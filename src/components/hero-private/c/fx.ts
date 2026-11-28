// Study C's surface effects for the ring (./scene.ts): shader code injected into three's own materials (so they keep their lighting, shadows,
// transmission and environment), and the procedural textures, all generated here (no downloads).
//   · a dissolve: each part / satellite has `uBuild` (0 → 1); its surface appears through a soft 3D noise with a green-lit edge (the intro), and goes the
//     same way when the seal swallows it;
//   · `uHeat`: the part turns to green light (the seal; a satellite sending energy);
//   · the energy front: `uFront` (a place round the ring, 0…1) with a tail, on the rails and in the glass, amplitude `uFrontAmp`; `uFlash`, a pulse of the
//     whole green (the intro's settle); `uCharge`, the bubble's charge (its iridescence and glow);
//   · the white blocks' finish: a brushed micro-texture (triplanar, in the object's own space) that varies their tint and roughness and bumps their normal
//     a hair; and two engraved panel lines round each block;
//   · `uGlowPass`: 1 while the bloom's source is drawn (./post.ts), so the green at rest blooms only softly and the travelling light strongly.
import * as THREE from "three";

export type GlobalU = {
  uT: { value: number }; uFront: { value: number }; uFrontAmp: { value: number }; uFlash: { value: number }; uCharge: { value: number };
  uGlowPass: { value: number }; uFade: { value: number }; uMicro: { value: THREE.Texture | null };
};
export type PartU = { uBuild: { value: number }; uHeat: { value: number } };
export const globalU = (micro: THREE.Texture): GlobalU => ({
  uT: { value: 0 }, uFront: { value: 0 }, uFrontAmp: { value: 0 }, uFlash: { value: 0 }, uCharge: { value: 0 }, uGlowPass: { value: 0 }, uFade: { value: 1 },
  uMicro: { value: micro },
});
export const partU = (): PartU => ({ uBuild: { value: 1 }, uHeat: { value: 0 } });

export type Kind = "rail" | "glass" | "solid" | "block" | "metal" | "line" | "bubble" | "core";

const NOISE = /* glsl */ `
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
uniform float uT, uFront, uFrontAmp, uFlash, uCharge, uGlowPass, uFade, uBuild, uHeat;
uniform sampler2D uMicro;
varying vec3 vL;
varying vec3 vNl;
${hasS ? "varying float vS;" : "const float vS = 0.0;"}
float fxEdge = 0.0, fxMicro = 0.5;
${NOISE}
float fxFrontAt(float s){ if (${hasS ? "false" : "true"}) return 0.0; float d = fract(uFront - s); return (exp(-d * 9.0) + exp(-(1.0 - d) * 80.0) * 0.6) * uFrontAmp; }`;
    // the dissolve (every kind) and the blocks' finish, where the base colour is known
    let color = `
  { float n = fxNoise(vL * 2.4 + 3.1) * 0.72 + fxNoise(vL * 7.3) * 0.28;
    float thr = uBuild * 1.16 - 0.08;
    if (n > thr) discard;
    fxEdge = (1.0 - smoothstep(0.0, 0.07, thr - n)) * step(uBuild, 0.999); }`;
    if (kind === "block" || kind === "solid") {
      color += `
  { vec3 w = pow(abs(normalize(vNl)), vec3(4.0)); w /= dot(w, vec3(1.0));
    fxMicro = texture2D(uMicro, vL.zy * vec2(0.9, 2.6)).r * w.x + texture2D(uMicro, vL.xz * vec2(0.9, 0.9)).r * w.y + texture2D(uMicro, vL.xy * vec2(0.9, 2.6)).r * w.z;
    diffuseColor.rgb *= 1.0 - (fxMicro - 0.5) * 0.03;`;
      if (kind === "block") color += `
    float side = 1.0 - smoothstep(0.4, 0.6, abs(normalize(vNl).y));
    float gr = max(1.0 - smoothstep(0.004, 0.016, abs(vL.y - 0.17)), 1.0 - smoothstep(0.004, 0.016, abs(vL.y - 1.32))) * side;
    diffuseColor.rgb *= 1.0 - gr * 0.07; fxMicro += gr * 0.9;`;
      color += " }";
    }
    color += "\n  diffuseColor.a *= uFade;";
    let emis = "";
    if (kind === "rail") emis = `
  totalEmissiveRadiance *= mix(1.0, 0.16, uGlowPass);
  totalEmissiveRadiance += vec3(0.55, 1.0, 0.8) * (fxFrontAt(vS) * 1.5 + uFlash * 0.9) * mix(0.6, 1.0, uGlowPass);`;
    if (kind === "glass") emis = `
  { float f = fxFrontAt(vS); totalEmissiveRadiance += vec3(0.5, 1.0, 0.78) * (f * 0.32 + uFlash * 0.12);
    diffuseColor.a = min(1.0, diffuseColor.a + f * 0.12); }`;
    if (kind === "bubble") emis = `
  { float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
    totalEmissiveRadiance += vec3(0.45, 1.0, 0.75) * (uCharge * (0.12 + rim * 0.5) + uFlash * 0.1); }`;
    if (kind === "core") emis = `
  totalEmissiveRadiance += vec3(0.0, 0.716, 0.266) * uCharge * 0.18;`;
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
        // a hair of bump from the micro-texture (three's perturbNormalArb, on the texture's screen-space derivatives)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
  { vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition); vec2 dh = vec2(dFdx(fxMicro), dFdy(fxMicro)) * 0.012;
    vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
    if (abs(det) > 1e-12) normal = normalize(abs(det) * normal - sign(det) * (dh.x * r1 + dh.y * r2)); }`);
    }
  };
  mat.customProgramCacheKey = () => `ringc-${kind}-${hasS ? 1 : 0}`;
}

/** a brushed micro-texture: fine streaks along u over a little grain, tileable, one channel */
export function microTexture() {
  const N = 256, d = new Uint8Array(N * N * 4);
  const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rows = Array.from({ length: N }, (_, j) => rnd(j));
  for (let j = 0; j < N; j++) {
    const r = (rows[j] * 0.5 + rows[(j + 1) % N] * 0.3 + rows[(j + N - 1) % N] * 0.2);
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

/** the panels' perforated sheet: a pale green plate with round holes through it (alpha 0), each hole with a darker rim and a lit lower lip */
export function perforatedTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(150,236,200,0.34)"; x.fillRect(0, 0, 64, 64);
  x.fillStyle = "rgba(11,150,98,0.9)"; x.beginPath(); x.arc(32, 32, 12.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgba(220,255,240,0.9)"; x.beginPath(); x.arc(32, 33.5, 11, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(32, 32, 9.5, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
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
  const t = new THREE.CanvasTexture(c); return t;
}

/** the floor's light: caustics under the glass (the ring's channels and the bubble, as signed distances) and the release's ripple */
export function floorLightMaterial(H: number, RC: number, HW: number, bubble: { half: number; r: number }) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uCaus: { value: 0 }, uRip: { value: 0 }, uRipA: { value: 0 } },
    vertexShader: "varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: /* glsl */ `
uniform float uT, uCaus, uRip, uRipA;
varying vec2 vP;
float sdBox(vec2 p, float h, float r){ vec2 q = abs(p) - vec2(h - r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.2831, 6.2831) - 250.0, i = p; float c = 1.0, inten = 0.005;
  for (int n = 0; n < 4; n++) { float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))); }
  c /= 4.0; c = 1.17 - pow(c, 1.4); return pow(abs(c), 8.0); }
void main(){
  float a = 0.0; vec3 col = vec3(0.45, 0.93, 0.74);
  if (uCaus > 0.001) {
    float band = 1.0 - smoothstep(${(HW - 0.12).toFixed(3)}, ${(HW + 0.02).toFixed(3)}, abs(sdBox(vP, ${H.toFixed(3)}, ${RC.toFixed(3)})));
    float bub = 1.0 - smoothstep(-0.12, 0.02, sdBox(vP, ${bubble.half.toFixed(3)}, ${bubble.r.toFixed(3)}));
    float m = max(band, bub);
    if (m > 0.0) a += clamp(caustic(vP * 0.16 + 0.3, uT * 0.55), 0.0, 1.0) * m * uCaus * 0.5;
  }
  float d = length(vP) - uRip;
  a += exp(-d * d * 22.0) * uRipA * 0.42 + exp(-pow(d + 0.6, 2.0) * 6.0) * uRipA * 0.12;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, min(a, 0.75));
}`,
  });
}
