// Hero study "Stack D"'s look: its materials and its post-processing (Pillar D's, ../pillar-d/fx.ts). The scene (./scene.ts) drives both through
// `U` and the `Post` it gets.
// · A procedural micro-texture (a tileable value noise and its slope, in a DataTexture: nothing downloaded) sampled tri-planar in world space, so the
//   white pieces read as moulded matter: a fine grain in their colour, their roughness and their normals.
// · The perforated plates (A4, A2): white, their holes drawn on the top face (the drawing's grey wells with a fine ink rim, and the four big corner
//   holes of A4); through each hole the data shows as a dot of light: A4 (the lower) samples the soft picture, A2 (the upper) the glow, so the dots
//   go from a scatter of bright points to a single soft green haze as the data rises. A soft shadow of the glass sheet above falls on each.
// · The glass: ./glass.ts (the base, the middle and top sheets, the column).
// · The green cube (B1): the drawing's mint, emissive as it charges. Every green part has a bloom twin: the post renders the scene once more at half
//   size with all else black (so whites never bloom), blurs it (UnrealBloomPass) and lays it over the frame as green light on paper.
// · Grain and a faint vignette; MSAA (and SMAA on 1× screens). Pipeline: scene (MSAA) → composite (bloom, grain, vignette) → output (sRGB) → SMAA.
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { Lib, MatKind } from "./stack";
import { type Data, glassMaterial } from "./glass";

/* ── shared uniforms ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type Uniforms = ReturnType<typeof uniforms>;
export function uniforms() {
  return {
    uNoise: { value: noiseTexture() },
    uT: { value: 0 },
    uGlow: { value: 0 },                                  // the deep glass's glow (the top sheet, the column)
    uPulseY: { value: -99 },                              // a pulse up the column: its height, its strength
    uPulse: { value: 0 },
    tSoft: { value: null as THREE.Texture | null },       // the data's pictures (./glass.ts)
    tGlow: { value: null as THREE.Texture | null },
    uCell: { value: 0.36 },                               // a data row's pitch, world units
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
const VERT = (vs: string) => vs.replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying vec3 vOP; varying vec3 vON;")
  .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vOP = position; vON = objectNormal;");

export type PerfOpts = { pitch: number; r: number; n: number; skip: number; level: 1 | 2; corner: boolean };
/** whites: the tri-planar micro-texture (colour, roughness, normal); a perforated plate's holes and the light through them */
function patchSurface(mat: THREE.MeshStandardMaterial, U: Uniforms, grain: number, perf: PerfOpts | null, per: Record<string, THREE.IUniform>) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uNoise: U.uNoise, uT: U.uT }, perf ? { tSoft: U.tSoft, tGlow: U.tGlow, uCell: U.uCell, ...per } : {});
    sh.vertexShader = VERT(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vWP; varying vec3 vWN; varying vec3 vOP; varying vec3 vON; uniform sampler2D uNoise; uniform float uT;
        ${perf ? "uniform sampler2D tSoft, tGlow; uniform float uCell, uLit, uWave, uShade, uY, uBl; uniform vec3 uShadow; uniform vec2 uKey; float perfL = 0.0;" : ""}
        vec4 tri(vec3 p, vec3 n){ vec3 w = abs(n); w /= (w.x + w.y + w.z);
          return texture2D(uNoise, p.yz) * w.x + texture2D(uNoise, p.xz) * w.y + texture2D(uNoise, p.xy) * w.z; }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        vec4 mt = tri(vWP * 2.6, vWN); vec4 mt2 = tri(vWP * 9.0, vWN);
        float mn = mt.r * 0.6 + mt2.r * 0.4;
        diffuseColor.rgb *= 1.0 + (mn - 0.5) * ${grain.toFixed(3)};
        ${perf ? `if (vON.y > 0.5) {
          vec2 q = vOP.xz;
          // the holes: a grid (none round the axis where the plate has its square hole), and the corner holes
          float P = ${perf.pitch.toFixed(4)}, N = ${perf.n.toFixed(1)};
          vec2 id = floor(q / P + 0.5); vec2 c = id * P;
          float inG = step(max(abs(id.x), abs(id.y)), N) * step(${perf.skip.toFixed(1)}, max(abs(id.x), abs(id.y)));
          float d = length(q - c) - ${perf.r.toFixed(3)};
          ${perf.corner ? `{ vec2 cq = sign(q) * 2.42; float dc = length(q - cq) - 0.15; if (dc < d || inG < 0.5) { d = dc; c = cq; inG = 1.0; } }` : ""}
          float hole = (1.0 - smoothstep(-0.006, 0.006, d)) * inG;
          float rim = exp(-pow(d / 0.011, 2.0)) * inG;
          // the light through it: the picture at the hole's centre, at this plate's level; more as the crossing's wave passes
          vec2 uv = vec2(c.x / (uCell * 78.4), c.y / (uCell * 40.0));
          float s = ${perf.level === 1 ? "smoothstep(0.04, 0.35, texture2D(tSoft, uv).r)" : "smoothstep(0.02, 0.1, texture2D(tGlow, uv).r) * 0.7 + 0.15"};
          float wave = exp(-pow((max(abs(c.x), abs(c.y)) - uWave) / 0.6, 2.0)) * uLit;
          perfL = hole * s * (0.35 + wave * 1.4);
          vec3 well = vec3(0.8, 0.79, 0.775) * (0.94 + 0.06 * smoothstep(-0.12, 0.0, d));
          diffuseColor.rgb = mix(diffuseColor.rgb, well, hole);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0, 0.70, 0.45), clamp(perfL * 1.3, 0.0, 0.85));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.067), rim * 0.75);
          // the glass sheet above: its soft shadow
          if (uShadow.x > 0.0) { vec2 sq2 = abs(q + uKey * uShadow.z); float sd = max(sq2.x, sq2.y);
            float sh = (1.0 - smoothstep(-0.2, 0.35, sd - uShadow.x)) * (uShadow.y > 0.0 ? smoothstep(-0.15, 0.2, sd - uShadow.y) : 1.0);
            diffuseColor.rgb *= 1.0 - sh * uShade; }
        }` : ""}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.8 + mn * 0.4), 0.05, 1.0);")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec3 sl = (vec3(mt.g, mt.b, mt2.g) - 0.5) * 0.09;
        normal = normalize(normal + (viewMatrix * vec4(sl.x, sl.z, sl.y, 0.0)).xyz);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        ${perf ? "totalEmissiveRadiance += vec3(0.0, 0.62, 0.38) * perfL;" : ""}`)
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>
        ${perf ? "if (uBl > 0.5) gl_FragColor = vec4(vec3(0.0, 0.862, 0.553) * perfL * 1.2, 1.0);" : ""}`);
  };
  mat.customProgramCacheKey = () => `stack-d-surface-${grain}-${perf ? perf.level + "-" + perf.n : 0}`;
}

/* ── the material library ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type LibX = Lib & { lines: LineMaterial[] };
export const PERF_A4: PerfOpts = { pitch: 0.345, r: 0.109, n: 6, skip: 0, level: 1, corner: true };
export const PERF_A2: PerfOpts = { pitch: 0.69, r: 0.095, n: 3, skip: 2, level: 2, corner: false };
/** the materials (one new instance per call: each piece fades on its own) */
export function library(U: Uniforms, d: Data): LibX {
  const lines: LineMaterial[] = [];
  const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const std = (color: string, roughness: number, grain: number, perf: PerfOpts | null = null) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide, ...off });
    const per = { uBl: { value: 0 }, uLit: { value: 0 }, uWave: { value: -9 }, uShade: { value: 0.06 }, uY: { value: 0 }, uShadow: { value: new THREE.Vector3() }, uKey: { value: new THREE.Vector2(0.327, 0.573) } };
    m.userData.perf = per;
    patchSurface(m, U, grain, perf, per); return m;
  };
  const make = (k: MatKind): THREE.Material => {
    switch (k) {
      case "white": return std("#ffffff", 0.66, 0.035);
      case "dim": return std("#c9c5c0", 0.85, 0.05);
      case "perf": return std("#ffffff", 0.66, 0.03, PERF_A4);
      case "perfArm": return std("#ffffff", 0.66, 0.03, PERF_A2);
      case "green": return new THREE.MeshPhysicalMaterial({ color: "#7fe8c2", emissive: "#00dc8d", emissiveIntensity: 0.04, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, ...off });
      case "glass": return glassMaterial(d, 0, 0.36, { uT: U.uT, uGlow: U.uGlow });
      case "column": return glassMaterial(d, 1, 0.36, { uT: U.uT, uGlow: U.uGlow, uPulseY: U.uPulseY, uPulse: U.uPulse });
    }
  };
  return {
    make, lines,
    line(green = false) {
      const l = new LineMaterial({ color: green ? 0x00dc8d : 0x111111, linewidth: green ? 1 : 1.3, transparent: true, opacity: green ? 0.55 : 0.85, depthWrite: false });
      lines.push(l); return l;
    },
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
