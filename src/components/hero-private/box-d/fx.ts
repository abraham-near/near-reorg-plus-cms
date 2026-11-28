// Hero study "Box D"'s look: its materials and its post-processing (Pillar D's, ../pillar-d/fx.ts, adapted). The scene (./scene.ts) drives both through
// `U` and the `Post` it gets.
// · A procedural micro-texture (a tileable value noise and its slope, in a DataTexture: nothing downloaded) sampled tri-planar in world space, so the
//   white cubes read as moulded matter: a fine grain in their colour, their roughness and their normals.
// · Caustics: the central cube's faces catch a faint moving web of green light; it swells as the core charges (the cube "turns green inside").
// · The glass and the data: ./glass.ts (slabs, tints, the data walls, the streams).
// · The green: every green part has a bloom twin: the post renders the scene once more at half size with all else black (so whites never bloom), blurs
//   it (UnrealBloomPass) and lays it over the frame as green light on paper.
// · Grain and a faint vignette; MSAA (and SMAA on 1× screens). Pipeline: scene (MSAA) → composite (bloom, grain, vignette) → output (sRGB) → SMAA.
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { Lib, MatKind } from "./box";
import { type Cover, type Data, slabMaterial, tintMaterial, wallMaterial } from "./glass";

/* ── shared uniforms ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Uniforms = ReturnType<typeof uniforms>;
export function uniforms() {
  return {
    uNoise: { value: noiseTexture() },
    uT: { value: 0 },
    uCaust: { value: 0 },                                  // caustics' strength
    uBubC: { value: new THREE.Vector3(0, 0, 0) },          // where the caustics live (the central cube), its half size
    uBubH: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
    uGlow: { value: 0 },                                  // the deep glass's glow (the data seen through the core)
    uFlow: { value: 0.3 },                                // the walls' rows drift this many cells a second
    uInk: { value: 1 },                                   // the data's presence (intro, exit)
    uFrontA: { value: 0 }, uFrontK: { value: 0 },         // the light running round the core's frame
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

/** whites and the central cube: the tri-planar micro-texture (colour, roughness, normal); the central cube also takes the caustics */
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
        ${caust ? `{ vec3 q = abs(vWP - uBubC) / uBubH; float inside = 1.0 - smoothstep(0.95, 1.12, max(q.x, max(q.y, q.z)));
          float cc = caus(vWP.xz * 3.1 + vec2(vWP.y * 1.7), uT * 0.55) * 0.7 + caus(vWP.zy * 4.3 + 7.0, uT * 0.4) * 0.3;
          totalEmissiveRadiance += vec3(0.0, 0.32, 0.06) * (cc * 0.7 + 0.2) * inside * uCaust; }` : ""}`);
  };
  mat.customProgramCacheKey = () => `box-d-surface-${grain}-${caust ? 1 : 0}`;
}

/* ── the material library ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type LibX = Lib & { lines: LineMaterial[] };
/** the materials (one new instance per call: each piece fades on its own). The drawing's fills: bars #00DC8D at 0.12 with a core at 0.5, the core's
 *  faces at 0.05, the fins and the rod at 0.08 (a touch more here: blending in linear light pales them) */
export function library(U: Uniforms, d: Data, cover: Cover): LibX {
  const lines: LineMaterial[] = [];
  const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const std = (color: string, roughness: number, metalness: number, grain: number, caust: boolean, envMapIntensity = 1) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.FrontSide, envMapIntensity, ...off });
    patchSurface(m, U, grain, caust); return m;
  };
  const front = { uFrontA: U.uFrontA, uFrontK: U.uFrontK };
  const make = (k: MatKind): THREE.Material => {
    switch (k) {
      case "white": return std("#ffffff", 0.62, 0, 0.035, false);
      case "core": return std("#ffffff", 0.55, 0, 0.03, true);
      case "slab": return slabMaterial();
      case "bar": return tintMaterial("#00dc8d", 0.17, 0.0, front);
      case "gline": return tintMaterial("#00dc8d", 0.5, 0.06, front);
      case "face": return tintMaterial("#00dc8d", 0.06, 0.0, {}, THREE.DoubleSide);
      case "ghost": return tintMaterial("#00dc8d", 0.1, 0.0, front);
      case "green": return tintMaterial("#4ce6af", 0.5, 0.1, {}, THREE.DoubleSide);
      case "wall": return wallMaterial(d, cover, 0, { uT: U.uT, uFlow: U.uFlow, uInk: U.uInk, uGlow: U.uGlow });
      case "ink": return new THREE.MeshBasicMaterial({ color: "#111111" });
    }
  };
  return {
    make, lines,
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
          c = c * (1.0 - a * vec3(0.72, 0.1, 0.6)) + b * vec3(0.5, 1.0, 0.4);   // green on paper, not cyan
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
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));

  // the bloom: its own composer, half size (weaker on small screens), the scene drawn with everything but the green in black
  const bloomRt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const bloomComposer = new EffectComposer(renderer, bloomRt);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera, undefined, new THREE.Color(0x000000), 1));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.3, 0.0);
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
    bloomPass.strength = opts.lite ? 0.3 : 0.4;
    comp.mat.uniforms.uAsp.value = size.x / Math.max(1, size.y);
  };
  return {
    comp, bloomPass, setSize,
    render(bloomScene: () => () => void) {
      const undo = bloomScene();
      bloomComposer.render();
      undo();
      comp.mat.uniforms.uSeed.value = (comp.mat.uniforms.uSeed.value + 0.6180339) % 7;
      composer.render();
    },
    dispose() {
      comp.dispose(); bloomPass.dispose(); smaa.dispose();
      composer.dispose(); bloomComposer.dispose(); rt.dispose(); bloomRt.dispose();
    },
  };
}
