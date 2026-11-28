// Hero study "Pillar C"'s look: its materials and its post-processing (the scene, ./scene.ts, drives both through `U` and the `Post` it gets).
// · A procedural micro-texture (a tileable value noise and its slope, made here in a DataTexture: nothing downloaded) sampled tri-planar in world
//   space, so the white pieces read as moulded matter: a fine grain in their colour, their roughness and their normals.
// · Caustics: inside the bubble the core's (and the column's) faces catch a moving web of green light, as under real glass; it swells as the core charges.
// · The glass: MeshPhysicalMaterial with real transmission (it refracts what's behind it, tinted mint), thickness, ior, a little roughness and a clear
//   coat, plus a sheen band that sweeps it (the loop's shimmer). On small screens: plain transparent glass (no transmission pass).
// · The green: emissive (the collar is also a real point light in the scene). Every green part has a twin "bloom" material: the post renders the
//   scene once more at half size with all else black (so whites never bloom), blurs it (UnrealBloomPass) and lays it over the frame as green light on
//   paper (it greens the paper under it rather than whitening it).
// · Depth of field, a gather blur from the depth buffer, only while the camera moves (intro, exit); grain and a faint vignette; MSAA (and SMAA on 1×
//   screens). Pipeline: scene (MSAA, depth) → DOF → composite (bloom, grain, vignette) → output (sRGB) → SMAA.
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { Lib, MatKind } from "./pillar";

/* ── shared uniforms ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Uniforms = ReturnType<typeof uniforms>;
export function uniforms() {
  return {
    uNoise: { value: noiseTexture() },
    uT: { value: 0 },
    uCaust: { value: 0 },                                  // caustics' strength
    uBubC: { value: new THREE.Vector3(0, 0.21, 0) },       // the bubble's centre and half size (world): caustics live inside it
    uBubH: { value: new THREE.Vector3(1.4, 1.04, 1.4) },
    uSheen: { value: -99 },                                // the sheen band's position across the scene
    uShimmer: { value: 0 },
  };
}

/** a 128² tileable value noise (fbm) in R and its slope in G / B */
function noiseTexture() {
  const N = 128, h = new Float32Array(N * N);
  const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  for (const [cells, amp] of [[8, 0.5], [16, 0.28], [32, 0.15], [64, 0.07]] as const) {
    const g = (x: number, y: number) => rnd(((x % cells) + cells) % cells + (((y % cells) + cells) % cells) * 97 + cells * 13);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = (x / N) * cells, fy = (y / N) * cells, ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const v = (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty;
      h[y * N + x] += v * amp;
    }
  }
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)], dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x];
    d[i * 4] = Math.round(Math.min(1, h[i]) * 255); d[i * 4 + 1] = Math.round(128 + dx * 900); d[i * 4 + 2] = Math.round(128 + dy * 900); d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/* ── shader patches ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const VERT_WORLD = (vs: string) => vs.replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN;")
  .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);");
const CAUSTIC = /* glsl */ `
  float caus(vec2 p, float t){
    vec2 i = p; float c = 1.0; float inten = 0.005;
    for (int n = 0; n < 3; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 3.0; c = 1.17 - pow(c, 1.4);
    return clamp(pow(abs(c), 8.0), 0.0, 2.0);
  }`;

/** whites, greys and the core: the tri-planar micro-texture (colour, roughness, normal); the core and the column also take the caustics */
function patchSurface(mat: THREE.MeshStandardMaterial, U: Uniforms, grain: number, caust: boolean) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uNoise: U.uNoise, uT: U.uT, uCaust: U.uCaust, uBubC: U.uBubC, uBubH: U.uBubH });
    sh.vertexShader = VERT_WORLD(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vWP; varying vec3 vWN; uniform sampler2D uNoise; uniform float uT, uCaust; uniform vec3 uBubC, uBubH;
        ${caust ? CAUSTIC : ""}
        vec4 tri(vec3 p, vec3 n){ vec3 w = abs(n); w /= (w.x + w.y + w.z);
          return texture2D(uNoise, p.yz) * w.x + texture2D(uNoise, p.xz) * w.y + texture2D(uNoise, p.xy) * w.z; }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        vec4 mt = tri(vWP * 2.6, vWN); vec4 mt2 = tri(vWP * 9.0, vWN);
        float mn = mt.r * 0.6 + mt2.r * 0.4;
        diffuseColor.rgb *= 1.0 + (mn - 0.5) * ${grain.toFixed(3)};`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.8 + mn * 0.4), 0.05, 1.0);")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec3 sl = (vec3(mt.g, mt.b, mt2.g) - 0.5) * 0.09;
        normal = normalize(normal + (viewMatrix * vec4(sl.x, sl.z, sl.y, 0.0)).xyz);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        ${caust ? `{ vec3 q = abs(vWP - uBubC) / uBubH; float inside = 1.0 - smoothstep(0.85, 1.0, max(q.x, max(q.y, q.z)));
          float up = 0.45 + 0.55 * max(vWN.y, 0.0);
          float cc = caus(vWP.xz * 3.1 + vec2(vWP.y * 1.7), uT * 0.55) * 0.7 + caus(vWP.zx * 4.3 + 7.0, uT * 0.4) * 0.3;
          totalEmissiveRadiance += vec3(0.05, 0.75, 0.42) * cc * inside * up * uCaust; }` : ""}`);
  };
  mat.customProgramCacheKey = () => `pillar-c-surface-${grain}-${caust ? 1 : 0}`;
}

/** the glass: a sheen band sweeping it, brighter while the core charges */
function patchGlass(mat: THREE.MeshPhysicalMaterial, U: Uniforms) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uSheen: U.uSheen, uShimmer: U.uShimmer, uT: U.uT });
    sh.vertexShader = VERT_WORLD(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uSheen, uShimmer, uT; varying vec3 vWP; varying vec3 vWN;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        { float sx = dot(vWP, vec3(0.62, 0.45, -0.62)) - uSheen; float shn = exp(-sx * sx * 2.2);
          float sh2 = uShimmer * (0.55 + 0.45 * sin(dot(vWP, vec3(5.0, 9.0, -5.0)) - uT * 7.0));
          totalEmissiveRadiance += vec3(0.45, 1.0, 0.75) * (shn * 0.32 + sh2 * 0.22); }`);
  };
  mat.customProgramCacheKey = () => "pillar-c-glass";
}

/* ── the material library ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type LibX = Lib & { lines: LineMaterial[]; glassBase: Map<THREE.Material, number> };
export function library(U: Uniforms, lite: boolean, env: THREE.Texture | null): LibX {
  const lines: LineMaterial[] = [];
  const glassBase = new Map<THREE.Material, number>();
  const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const std = (color: string, roughness: number, metalness: number, grain: number, caust: boolean, envMapIntensity = 1) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide, envMapIntensity, ...off });
    patchSurface(m, U, grain, caust); return m;
  };
  const make = (k: MatKind): THREE.Material => {
    switch (k) {
      case "white": return std("#ffffff", 0.66, 0, 0.035, true);
      case "dim": return std("#c9c5c0", 0.85, 0, 0.05, false);
      case "screw": return std("#e4e2df", 0.32, 0.55, 0.02, false, 1.6);
      case "core": return std("#f2faf6", 0.5, 0, 0.03, true);
      case "green": return new THREE.MeshPhysicalMaterial({ color: "#00e795", emissive: "#00dc8d", emissiveIntensity: 0.2, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, ...off });
      case "gline": return new THREE.MeshBasicMaterial({ color: "#00dc8d", transparent: true, opacity: 0.8, depthWrite: false });
      case "glass": {
        const m = lite
          ? new THREE.MeshPhysicalMaterial({ color: "#00dc8d", transparent: true, opacity: 0.14, roughness: 0.15, clearcoat: 0.6, depthWrite: false, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.6 })
          : new THREE.MeshPhysicalMaterial({
            color: "#c4f5e0", transmission: 1, thickness: 0.35, ior: 1.32, roughness: 0.16, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.1,
            attenuationColor: "#5fe8b4", attenuationDistance: 1.6, specularIntensity: 0.7, envMapIntensity: 0.7, depthWrite: false,
            transparent: false, opacity: 1,
          });
        glassBase.set(m, m.opacity);
        patchGlass(m, U); return m;
      }
    }
  };
  return {
    make, lines, glassBase,
    line() { const l = new LineMaterial({ color: 0x111111, linewidth: 1.3, transparent: true, opacity: 0.85, depthWrite: false }); lines.push(l); return l; },
  };
}

/** a soft round glow: white in alpha (sprites tint it green) */
export function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.2, "rgba(255,255,255,0.7)"); g.addColorStop(0.55, "rgba(255,255,255,0.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ── post ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

/** depth of field: a 24-tap gather (Vogel disc) with each tap's circle of confusion from the depth buffer (world units off the focus plane) */
class DofPass extends Pass {
  quad: FullScreenQuad; mat: THREE.ShaderMaterial;
  constructor() {
    super();
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: null }, tDepth: { value: null }, uNear: { value: 1 }, uFar: { value: 100 }, uFocus: { value: 10 }, uAmt: { value: 0 }, uMax: { value: 10 }, uPx: { value: new THREE.Vector2() } },
      vertexShader: QUAD_VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor, tDepth; uniform float uNear, uFar, uFocus, uAmt, uMax; uniform vec2 uPx; varying vec2 vUv;
        float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
        float coc(vec2 uv){ float z = lin(texture2D(tDepth, uv).x); return clamp(abs(z - uFocus) * uAmt, 0.0, uMax); }
        void main(){
          float c0 = coc(vUv);
          vec4 acc = texture2D(tColor, vUv); float w = 1.0;
          for (int i = 0; i < 24; i++) {
            float fi = float(i) + 0.5; float r = sqrt(fi / 24.0); float a = fi * 2.39996;
            vec2 o = vec2(cos(a), sin(a)) * r * uMax * uPx;
            float c = coc(vUv + o);
            float k = smoothstep(r * uMax - 1.0, r * uMax + 0.5, max(c, c0 * 0.6));
            acc += texture2D(tColor, vUv + o) * k; w += k;
          }
          gl_FragColor = acc / w;
        }`,
    });
    this.quad = new FullScreenQuad(this.mat);
  }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.mat.uniforms.tColor.value = readBuffer.texture;
    this.mat.uniforms.tDepth.value = readBuffer.depthTexture;
    this.mat.uniforms.uPx.value.set(1 / readBuffer.width, 1 / readBuffer.height);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.mat.dispose(); this.quad.dispose(); }
}

/** the composite: the bloom laid over as green light on paper (it multiplies the paper down a little where it adds green), grain, a faint vignette */
class CompositePass extends Pass {
  quad: FullScreenQuad; mat: THREE.ShaderMaterial;
  constructor(bloom: THREE.Texture) {
    super();
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tBloom: { value: bloom }, uBloom: { value: 1 }, uGrain: { value: 0.012 }, uVig: { value: 0.022 }, uSeed: { value: 0 }, uC: { value: new THREE.Vector2(0.7, 0.5) }, uAsp: { value: 1 } },
      vertexShader: QUAD_VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse, tBloom; uniform float uBloom, uGrain, uVig, uSeed, uAsp; uniform vec2 uC; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          vec3 b = texture2D(tBloom, vUv).rgb * uBloom;
          float a = clamp(max(b.r, max(b.g, b.b)), 0.0, 1.0);
          c = c * (1.0 - a * vec3(0.62, 0.12, 0.58)) + b * vec3(0.7, 1.0, 0.75);   // green on paper, not cyan
          vec2 d = (vUv - uC) * vec2(uAsp, 1.0);
          c *= 1.0 - uVig * smoothstep(0.35, 1.25, length(d));
          c += (h(vUv * 1000.0) - 0.5) * uGrain * (0.35 + 0.65 * dot(c, vec3(0.33)));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.quad = new FullScreenQuad(this.mat);
  }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.mat.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.mat.dispose(); this.quad.dispose(); }
}

export type Post = ReturnType<typeof post>;
/** the pipeline. `bloomScene()` is called around the bloom render to swap the scene to its bloom look (and back: it returns the undo). */
export function post(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, opts: { lite: boolean }) {
  const size = new THREE.Vector2();
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: opts.lite ? 0 : 4 });
  rt.depthTexture = new THREE.DepthTexture(1, 1);
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const dof = new DofPass(); composer.addPass(dof);

  // the bloom: its own composer, half size (weaker on small screens), the scene drawn with everything but the green in black
  const bloomRt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const bloomComposer = new EffectComposer(renderer, bloomRt);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera, undefined, new THREE.Color(0x000000), 1));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.5, 0.0);
  bloomComposer.addPass(bloomPass);

  const comp = new CompositePass(bloomComposer.renderTarget2.texture); composer.addPass(comp);
  composer.addPass(new OutputPass());
  const smaa = new SMAAPass(); composer.addPass(smaa);

  const setSize = (pxRatio: number) => {
    renderer.getSize(size);
    composer.setPixelRatio(pxRatio); composer.setSize(size.x, size.y);
    const k = 0.5;
    bloomComposer.setPixelRatio(1); bloomComposer.setSize(Math.max(1, Math.round(size.x * pxRatio * k)), Math.max(1, Math.round(size.y * pxRatio * k)));
    smaa.enabled = pxRatio < 1.5;
    bloomPass.strength = opts.lite ? 0.45 : 0.75;
    comp.mat.uniforms.uAsp.value = size.x / Math.max(1, size.y);
  };
  return {
    dof, comp, bloomPass, setSize,
    render(bloomScene: () => () => void) {
      const undo = bloomScene();
      bloomComposer.render();
      undo();
      comp.mat.uniforms.uSeed.value = (comp.mat.uniforms.uSeed.value + 0.6180339) % 7;
      composer.render();
    },
    dispose() {
      dof.dispose(); comp.dispose(); bloomPass.dispose(); smaa.dispose();
      composer.dispose(); bloomComposer.dispose(); rt.dispose(); rt.depthTexture?.dispose(); bloomRt.dispose();
    },
  };
}
