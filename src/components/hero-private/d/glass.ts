// Study D's frosted glass and its data (./scene.ts). The technique is hero H's (../../heroes3d/scene-h.ts), turned to a light page: not physical
// transmission but a picture blurred twice.
//   · The picture: each frame the scene is drawn once more, sharp, at half size, with every pane of glass hidden (the blocks, rails, floor lines, the
//     core, the packets of data); then blurred to two levels at lower sizes (a quarter, a little: "frosted"; a sixth, more: "frosted deep") by a cheap
//     separable gaussian.
//   · The glass: each pane looks its level up where it is on screen (gl_FragCoord), so whatever lies behind it shows through soft; a milky white veil,
//     a fine frost grain, a white highlight round each panel's edges and a soft contact at its foot make it read as glass on light paper. The ring's
//     walls show level 1, the bubble level 2 (deeper: the core is only a shape, then only a glow). Glass is opaque to the depth buffer, so a packet
//     behind it is seen only through its frost.
//   · The data: packets of glyphs (a canvas atlas: hex digits and bits, chained blocks; or, `abstract`, dashes and ticks of the same rhythm), ink on
//     the paper; each glyph carries a level (0: legible; 1: only a green glow) that the scene raises as it crosses the glass.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { NOISE } from "./fx";
import { C, HT } from "./ring";

const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const BLUR_FS = /* glsl */ `
  uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tex, vUv) * 0.227027;
    s += (texture2D(tex, vUv + dir * 1.3846) + texture2D(tex, vUv - dir * 1.3846)) * 0.3162162;
    s += (texture2D(tex, vUv + dir * 3.2308) + texture2D(tex, vUv - dir * 3.2308)) * 0.0702703;
    gl_FragColor = s;
  }`;

/** the picture behind the glass and its two blurs */
export function createDiffusion(renderer: THREE.WebGLRenderer, bg: THREE.ColorRepresentation) {
  const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const pic = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const a1 = rt(), b1 = rt(), a2 = rt(), b2 = rt();
  const u = { tex: { value: null as THREE.Texture | null }, dir: { value: new THREE.Vector2() } };
  const mat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS, uniforms: u, depthTest: false, depthWrite: false });
  const quad = new FullScreenQuad(mat);
  const clear = new THREE.Color(bg), keep = new THREE.Color();
  const blur = (from: THREE.WebGLRenderTarget, a: THREE.WebGLRenderTarget, b: THREE.WebGLRenderTarget, spreads: number[]) => {
    let src = from;
    for (const s of spreads) {
      u.tex.value = src.texture; u.dir.value.set(s / a.width, 0); renderer.setRenderTarget(a); quad.render(renderer);
      u.tex.value = a.texture; u.dir.value.set(0, s / a.height); renderer.setRenderTarget(b); quad.render(renderer);
      src = b;
    }
  };
  return {
    /** level 1 (the walls) and level 2 (the bubble) */
    soft: b1.texture, deep: b2.texture,
    setSize(w: number, h: number) {
      pic.setSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
      for (const r of [a1, b1]) r.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)));
      for (const r of [a2, b2]) r.setSize(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 6)));
    },
    /** draw the scene without its glass into the picture, then the two blurs */
    render(scene: THREE.Scene, camera: THREE.Camera, glass: THREE.Object3D[], before: () => void, after: () => void) {
      const vis = glass.map((o) => o.visible), ca = renderer.getClearAlpha();
      renderer.getClearColor(keep);
      glass.forEach((o) => { o.visible = false; });
      before();
      renderer.setRenderTarget(pic); renderer.setClearColor(clear, 1); renderer.clear(); renderer.render(scene, camera);
      after();
      glass.forEach((o, i) => { o.visible = vis[i]; });
      blur(pic, a1, b1, [1, 1.6]);
      blur(b1, a2, b2, [1.2, 1.6]);
      renderer.setRenderTarget(null); renderer.setClearColor(keep, ca);
    },
    dispose() { [pic, a1, b1, a2, b2].forEach((r) => r.dispose()); mat.dispose(); quad.dispose(); },
  };
}

export type GlassU = {
  uPic: { value: THREE.Texture }; uRes: { value: THREE.Vector2 }; uMilk: { value: number }; uBuild: { value: number }; uHeat: { value: number };
  uFront: { value: number }; uFrontAmp: { value: number }; uFlash: { value: number }; uSweep: { value: number }; uCharge: { value: number };
  uAxis: { value: number }; uGlowPass: { value: number };
};

const GLASS_VS = /* glsl */ `
  attribute float aS; varying vec3 vL; varying vec3 vN; varying vec3 vV; varying float vS;
  void main(){
    vL = position; vS = aS;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
/** a pane of the walls (`bubble` false) or the bubble (true) */
function glassFS(bubble: boolean) {
  return /* glsl */ `
  uniform sampler2D uPic; uniform vec2 uRes; uniform float uMilk, uBuild, uHeat, uFront, uFrontAmp, uFlash, uSweep, uCharge, uAxis, uGlowPass;
  varying vec3 vL; varying vec3 vN; varying vec3 vV; varying float vS;
  ${NOISE}
  float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    float n = fxNoise(vL * 2.4 + 3.1) * 0.72 + fxNoise(vL * 7.3) * 0.28;
    float thr = uBuild * 1.16 - 0.08;
    if (n > thr) discard;
    float edgeB = (1.0 - smoothstep(0.0, 0.07, thr - n)) * step(uBuild, 0.999);
    vec3 N = normalize(vN), V = normalize(vV);
    float fr = pow(1.0 - abs(dot(N, V)), 2.2);
    vec2 suv = gl_FragCoord.xy / uRes + N.xy * ${bubble ? "0.012" : "0.004"};
    vec3 behind = texture2D(uPic, suv).rgb;
    vec3 milk = vec3(0.955, 0.985, 0.972);
    vec3 col = mix(behind, milk, uMilk);
    col += (h2(floor(gl_FragCoord.xy)) - 0.5) * 0.022;                 // the frost's grain
    ${bubble ? `
    col += milk * fr * 0.22;                                           // its rim, brighter
    col = mix(col, vec3(0.5, 1.0, 0.76), clamp(uCharge * (0.3 + fr * 0.4), 0.0, 1.0));
    col += vec3(0.0, 0.716, 0.266) * uCharge * 0.12;` : `
    // a white highlight just inside each panel's edges (the glass's cut edge catching the light), a soft contact at its foot
    float t = uAxis > 0.5 ? vL.z : vL.x, sp = ${((2 * C) / 3).toFixed(4)};
    float dt = abs(fract((t + ${C.toFixed(4)}) / sp + 0.5) - 0.5) * sp;
    float edge = max(1.0 - smoothstep(0.035, 0.11, dt), 1.0 - smoothstep(0.0, 0.1, ${(HT - 0.075).toFixed(3)} - vL.y));
    col = mix(col, vec3(1.0), edge * 0.55 * (1.0 - uGlowPass));
    col *= 1.0 - (1.0 - smoothstep(0.07, 0.55, vL.y)) * 0.06;
    col += vec3(1.0) * fr * 0.08;
    // two faint diagonal reflections across each panel (the glass's sheen)
    float ds = fract((t + vL.y * 0.7) / sp + 0.15);
    col += vec3(1.0) * (exp(-pow((ds - 0.32) / 0.05, 2.0)) * 0.05 + exp(-pow((ds - 0.42) / 0.014, 2.0)) * 0.06) * (1.0 - uGlowPass);
    // the energy front running round the ring, lighting the glass from inside
    float d = fract(uFront - vS), f = (exp(-d * 9.0) + exp(-(1.0 - d) * 80.0) * 0.6) * uFrontAmp;
    col = mix(col, vec3(0.45, 1.0, 0.75), clamp(f * 0.28 + uFlash * 0.1, 0.0, 1.0));`}
    // the intro's settle: a sheen sweeping across the glass
    col += vec3(0.75, 1.0, 0.9) * exp(-pow((suv.x - uSweep) / 0.035, 2.0)) * 0.2;
    col = mix(col, vec3(0.0, 0.716, 0.266) * 1.1, uHeat * 0.85);
    col += vec3(0.55, 1.0, 0.8) * edgeB * 1.6;
    gl_FragColor = vec4(col * (1.0 - uGlowPass), 1.0);
    #include <colorspace_fragment>
  }`;
}
export function glassMaterial(u: GlassU, bubble: boolean) {
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: GLASS_VS, fragmentShader: glassFS(bubble), transparent: bubble, depthWrite: !bubble });
  if (bubble) m.side = THREE.FrontSide;
  return m;
}
/* ── the data ──────────────────────────────────────────────────────────────────────────────────────────────────────────── */

export type GlyphStyle = "hex" | "abstract";
/** 16 glyphs in an 8 × 2 atlas (white on transparent; the shader inks them) */
export function glyphAtlas(style: GlyphStyle) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const x = c.getContext("2d")!, S = 64;
  x.fillStyle = x.strokeStyle = "#fff"; x.lineWidth = 4; x.lineCap = "butt";
  const cell = (i: number) => [(i % 8) * S + S / 2, Math.floor(i / 8) * S + S / 2] as const;
  if (style === "hex") {
    x.font = "500 44px ui-monospace, 'SF Mono', Menlo, Consolas, monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    ["0", "1", "a", "7", "f", "3", "c", "9", "e", "5", "b", "2"].forEach((ch, i) => { const [cx, cy] = cell(i); x.fillText(ch, cx, cy + 2); });
    { const [cx, cy] = cell(12); x.fillRect(cx - 12, cy - 12, 24, 24); }                                                         // a block
    { const [cx, cy] = cell(13); x.strokeRect(cx - 11, cy - 11, 22, 22); }                                                       // an empty one
    { const [cx, cy] = cell(14); x.fillRect(cx - 22, cy - 8, 16, 16); x.fillRect(cx + 6, cy - 8, 16, 16); x.fillRect(cx - 6, cy - 2, 12, 4); }   // chained
    { const [cx, cy] = cell(15); for (let k = 0; k < 3; k++) x.fillRect(cx - 22 + k * 16, cy - 6, 12, 12); }                     // a short chain
  } else {
    // dashes and ticks of the same rhythm: one-, two- and three-unit bars, a bar and a tick, a dot, two ticks
    const bar = (cx: number, cy: number, w: number, hgt = 7) => x.fillRect(cx - w / 2, cy - hgt / 2, w, hgt);
    const kinds: ((cx: number, cy: number) => void)[] = [
      (cx, cy) => bar(cx, cy, 34), (cx, cy) => bar(cx, cy, 18), (cx, cy) => { bar(cx - 10, cy, 14); bar(cx + 12, cy, 10); },
      (cx, cy) => bar(cx, cy, 40, 6), (cx, cy) => { bar(cx - 8, cy, 22); x.fillRect(cx + 10, cy - 12, 6, 24); },
      (cx, cy) => bar(cx, cy, 10, 10), (cx, cy) => { x.fillRect(cx - 9, cy - 11, 6, 22); x.fillRect(cx + 3, cy - 11, 6, 22); },
      (cx, cy) => { bar(cx - 12, cy, 12); bar(cx + 4, cy, 6); bar(cx + 16, cy, 6); },
    ];
    for (let i = 0; i < 16; i++) { const [cx, cy] = cell(i); kinds[i % kinds.length](cx, cy); }
  }
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}

/** packets of glyphs: per point aG (glyph), aA (alpha), aZ (size), aL (0 legible → 1 green glow) */
export function glyphMaterial(atlas: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uAtlas: { value: atlas }, uSize: { value: 12 } },
    vertexShader: /* glsl */ `
      attribute float aG; attribute float aA; attribute float aZ; attribute float aL; uniform float uSize;
      varying float vG; varying float vA; varying float vL;
      void main(){ vG = aG; vA = aA; vL = aL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aA < 0.004 ? 0.0 : uSize * aZ * (1.0 + aL * 0.5); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas; varying float vG; varying float vA; varying float vL;
      void main(){
        vec2 pc = gl_PointCoord;
        vec2 uv = vec2((mod(vG, 8.0) + pc.x) / 8.0, 1.0 - (floor(vG / 8.0) + pc.y) / 2.0);   // the canvas is flipped (row 0 on top)
        float g = texture2D(uAtlas, uv, vL * 3.5).a;
        float r = length(pc - 0.5), glow = exp(-r * r * 16.0);
        float k = smoothstep(0.15, 0.85, vL);
        float a = mix(g * 0.8, glow * 0.95, k) * vA;
        if (a < 0.01) discard;
        // ink #111 (linear 0.0056) → NEAR green with a pale core
        vec3 green = mix(vec3(0.0, 0.716, 0.266), vec3(0.6, 1.0, 0.82), smoothstep(0.35, 0.0, r) * 0.6);
        gl_FragColor = vec4(mix(vec3(0.0056), green, k), a);
      }`,
  });
}
