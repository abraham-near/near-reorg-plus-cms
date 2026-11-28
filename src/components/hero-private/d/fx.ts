// Study D's surface effects on three's own materials (./scene.ts), after study C's (../c/fx.ts), without its transmission glass: shader code injected
// into the solid parts' materials so they keep their lighting and shadows, and the small procedural textures (no downloads).
//   · a dissolve: each part / satellite has `uBuild` (0 → 1); its surface appears through a soft 3D noise with a green-lit edge (the intro), and goes the
//     same way when the seal swallows it;
//   · `uHeat`: the part turns to green light (the seal; a satellite sending or receiving);
//   · the energy front on the rails: `uFront` (a place round the ring, 0…1) with a tail, amplitude `uFrontAmp`; `uFlash`, a pulse of all the green;
//     `uCharge`, the core's charge;
//   · the white blocks' finish: a brushed micro-texture (triplanar, in the object's own space) on their tint, roughness and normal;
//   · `uGlowPass`: 1 while the bloom's source is drawn (./post.ts), so the resting green blooms only softly and the travelling light strongly.
import * as THREE from "three";

export type GlobalU = {
  uT: { value: number }; uFront: { value: number }; uFrontAmp: { value: number }; uFlash: { value: number }; uCharge: { value: number };
  uGlowPass: { value: number }; uMicro: { value: THREE.Texture | null };
};
export type PartU = { uBuild: { value: number }; uHeat: { value: number } };
export const globalU = (micro: THREE.Texture): GlobalU => ({
  uT: { value: 0 }, uFront: { value: 0 }, uFrontAmp: { value: 0 }, uFlash: { value: 0 }, uCharge: { value: 0 }, uGlowPass: { value: 0 }, uMicro: { value: micro },
});
export const partU = (): PartU => ({ uBuild: { value: 1 }, uHeat: { value: 0 } });

export type Kind = "rail" | "solid" | "block" | "line" | "core" | "tray";

export const NOISE = /* glsl */ `
float fxHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fxNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fxHash(i), fxHash(i + vec3(1,0,0)), f.x), mix(fxHash(i + vec3(0,1,0)), fxHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fxHash(i + vec3(0,0,1)), fxHash(i + vec3(1,0,1)), f.x), mix(fxHash(i + vec3(0,1,1)), fxHash(i + vec3(1,1,1)), f.x), f.y), f.z); }`;

/** inject the effects into a material. `hasS`: its geometry carries aS (the ring's own pieces) */
export function fx(mat: THREE.Material, g: GlobalU, p: PartU, kind: Kind, hasS: boolean) {
  const lit = kind !== "line";
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, g, p);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vL;\nvarying vec3 vNl;\n${hasS ? "attribute float aS;\nvarying float vS;" : ""}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvL = position;\nvNl = normal;\n${hasS ? "vS = aS;" : ""}`);
    const head = `#include <common>
uniform float uT, uFront, uFrontAmp, uFlash, uCharge, uGlowPass, uBuild, uHeat;
uniform sampler2D uMicro;
varying vec3 vL;
varying vec3 vNl;
${hasS ? "varying float vS;" : "const float vS = 0.0;"}
float fxEdge = 0.0, fxMicro = 0.5;
${NOISE}
float fxFrontAt(float s){ if (${hasS ? "false" : "true"}) return 0.0; float d = fract(uFront - s); return (exp(-d * 9.0) + exp(-(1.0 - d) * 80.0) * 0.6) * uFrontAmp; }`;
    let color = `
  { float n = fxNoise(vL * 2.4 + 3.1) * 0.72 + fxNoise(vL * 7.3) * 0.28;
    float thr = uBuild * 1.16 - 0.08;
    if (n > thr) discard;
    fxEdge = (1.0 - smoothstep(0.0, 0.07, thr - n)) * step(uBuild, 0.999); }`;
    if (kind === "block" || kind === "solid") {
      color += `
  { vec3 w = pow(abs(normalize(vNl)), vec3(4.0)); w /= dot(w, vec3(1.0));
    fxMicro = texture2D(uMicro, vL.zy * vec2(0.9, 2.6)).r * w.x + texture2D(uMicro, vL.xz * vec2(0.9, 0.9)).r * w.y + texture2D(uMicro, vL.xy * vec2(0.9, 2.6)).r * w.z;
    diffuseColor.rgb *= 1.0 - (fxMicro - 0.5) * 0.03; }`;
    }
    let emis = "";
    if (kind === "rail") emis = `
  totalEmissiveRadiance *= mix(1.0, 0.16, uGlowPass);
  totalEmissiveRadiance += vec3(0.55, 1.0, 0.8) * (fxFrontAt(vS) * 1.5 + uFlash * 0.9) * mix(0.6, 1.0, uGlowPass);`;
    if (kind === "core") emis = `
  totalEmissiveRadiance += vec3(0.0, 0.716, 0.266) * uCharge * 1.3;
  diffuseColor.rgb *= 1.0 - uCharge * 0.5;`;
    if (lit) emis += `
  totalEmissiveRadiance = mix(totalEmissiveRadiance, vec3(0.0, 0.716, 0.266) * 1.1, uHeat * 0.85);
  diffuseColor.rgb *= 1.0 - uHeat * 0.75;
  totalEmissiveRadiance += vec3(0.55, 1.0, 0.8) * fxEdge * 2.2;`;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", head)
      .replace("#include <color_fragment>", "#include <color_fragment>" + color);
    if (lit) sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>" + emis);
    if (kind === "block" || kind === "solid") {
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor *= 0.82 + fxMicro * 0.36;")
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
  { vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition); vec2 dh = vec2(dFdx(fxMicro), dFdy(fxMicro)) * 0.012;
    vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
    if (abs(det) > 1e-12) normal = normalize(abs(det) * normal - sign(det) * (dh.x * r1 + dh.y * r2)); }`);
    }
  };
  mat.customProgramCacheKey = () => `ringd-${kind}-${hasS ? 1 : 0}`;
}

/** a brushed micro-texture: fine streaks along u over a little grain, tileable, one channel */
export function microTexture() {
  const N = 256, d = new Uint8Array(N * N * 4);
  const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rows = Array.from({ length: N }, (_, j) => rnd(j));
  for (let j = 0; j < N; j++) {
    const r = rows[j] * 0.5 + rows[(j + 1) % N] * 0.3 + rows[(j + N - 1) % N] * 0.2;
    for (let i = 0; i < N; i++) {
      const streak = 0.5 + (r - 0.5) * 0.8 + Math.sin((i / N) * Math.PI * 2 * 3 + rows[j] * 6.28) * 0.04;
      const v = Math.max(0, Math.min(1, streak * 0.75 + rnd(j * N + i + 7) * 0.25));
      const k = (j * N + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.round(v * 255); d[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

/** a soft round glow (the core's halo, the seal's flash) */
export function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(150,245,205,0.9)"); g.addColorStop(0.35, "rgba(0,220,141,0.32)"); g.addColorStop(1, "rgba(0,220,141,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** a soft dark rectangle (contact occlusion under a part): black, its alpha a blurred box */
export function aoTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.shadowColor = "rgba(0,0,0,1)"; x.shadowBlur = 22; x.shadowOffsetX = 400;
  x.fillStyle = "#000"; x.fillRect(-400 + 30, 30, 68, 68);
  return new THREE.CanvasTexture(c);
}

/** a thin ring (the "received" pulse round a satellite) */
export function ringTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.strokeStyle = "rgba(0,220,141,1)"; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 56, 0, Math.PI * 2); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
