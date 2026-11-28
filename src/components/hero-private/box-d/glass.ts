// Hero study "Box D"'s data and its diffusion (the technique of /hero-h, "Veils", ../../heroes3d/scene-h.ts, as in ../pillar-d/glass.ts): the data's
// picture (rows of ASCII, monospace, in a 32 × 32 grid of cells that tiles) is drawn once a frame, sharp, into a texture, then blurred twice at lower
// resolutions: a little (the characters run together into soft rows) and a lot (only a glow is left). Whatever shows data samples it by its own
// planar coordinates, so the frost reads the same on any GPU (no transmission, no depth of field). The sharp level is not read from the texture but
// drawn straight from the glyph atlas (the same function that paints the picture), so the characters stay crisp at any size.
// Which level a point of data shows is decided by what lies between it and the eye: its line of sight is tested against the glass (the plates, the
// side panels: frosted → soft; the core: deep → only a green glow), each with soft rims and its hole (a port: seen through a hole, data stays sharp).
// Two things carry data:
//   · the data walls: the faint glass sheets of the back frames (B1 / B2) carry rows of ASCII at the core's height, drifting in toward the core. Where
//     nothing is in front of them they read sharp (ink); through a side panel, soft; behind the core, only green light;
//   · the streams: short tapes of characters that run in from outside through each port (the plates' holes, the side panels' holes) to a small cube,
//     then on into the core: sharp outside, soft behind the glass, a glow inside.
// The glass itself (./fx.ts makes the materials): `slabMaterial` for the plates and side panels (a light mint film, the drawing's green dots, mint
// edges with their green band, a fine rim light), `tintMaterial` for the bars, their green cores, the core's faint faces, the fins and the rod.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

export const CELLS = 32;                      // the picture: CELLS × CELLS glyph cells, tiling
export const CELL = 0.48;                     // a glyph cell, world units (≈ 15 css px at 1440: the characters ≈ 10 px tall)
export const TAPE_ROWS = 4;                   // the picture's rows 0–3 are the streams' tapes: always full

const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
// the atlas' order: 0–9, A–Z (so 0–15 are the hex digits), then the symbols, then a few lower case letters
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=/<>{}[];:.~^abcdefxyz@!?";

/** the glyph atlas: 8 × 8 cells of 128 px, white on transparent, monospace */
function atlas() {
  const c = document.createElement("canvas"); c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = "600 104px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  for (let i = 0; i < 64; i++) x.fillText(CHARS[i], (i % 8) * 128 + 64, Math.floor(i / 8) * 128 + 68);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** the picture, as GLSL: which glyph a cell holds at time t (−1: a space), and its ink at a point. Rows are tokens of 2–6 characters (words of
 *  letters and digits, hex, runs of symbols) with a space between; the wall's rows come in packets with blank rows between them; the characters
 *  re-roll slowly (the data changes) */
export const DATA_GLSL = /* glsl */ `
  uniform sampler2D tAtlas;
  float dh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float glyphAt(vec2 cell, float t){
    cell = mod(cell, ${CELLS.toFixed(1)});
    float r = cell.y, c = cell.x;
    float tape = step(r, ${(TAPE_ROWS - 0.5).toFixed(1)});
    float off = floor(dh(vec2(r, 3.3)) * 7.0);
    float k = floor((c + off) / 7.0), j = mod(c + off, 7.0);
    float L = 2.0 + floor(dh(vec2(r, k + 0.5)) * 5.0);
    float on = step(j, L - 0.5);
    float wallOn = step(0.12, dh(vec2(r, 9.0))) * step(0.14, dh(vec2(floor(r / 3.0), floor(c / 12.0) + 0.5)));
    on *= mix(wallOn, 1.0, tape);
    float cls = dh(vec2(r * 1.7, k));
    float roll = floor(t * (0.1 + dh(vec2(c, r)) * 0.35) + dh(vec2(r, c)) * 7.0);
    float rnd = dh(vec2(c, r) + roll * 0.173);
    float gi = cls < 0.42 ? floor(rnd * 36.0) : cls < 0.74 ? floor(rnd * 16.0) : 36.0 + floor(rnd * 18.0);
    return on > 0.5 ? gi : -1.0;
  }
  /** a glyph's ink: cell, the point inside it (0..1, y up), the point's screen gradients (in cells) */
  float inkCell(vec2 cell, vec2 f, vec2 gx, vec2 gy, float t){
    float gi = glyphAt(cell, t);
    if (gi < 0.0) return 0.0;
    vec2 slot = vec2(mod(gi, 8.0), floor(gi / 8.0));
    f = clamp(f, 0.02, 0.98);
    vec2 a = vec2((slot.x + f.x) / 8.0, 1.0 - (slot.y + 1.0 - f.y) / 8.0);
    return textureGrad(tAtlas, a, gx / 8.0, gy / 8.0).a;
  }
  float inkAt(vec2 g, float t){ return inkCell(floor(g), fract(g), dFdx(g), dFdy(g), t); }
`;

/** what lies between a point and the eye: the plates and side panels (frosted: level 1), the core (deep: level 2) */
export const COVER_GLSL = /* glsl */ `
  uniform vec3 uCoreC, uCoreH;
  uniform vec3 uTopC, uTopH, uTopHole, uBotC, uBotH, uBotHole, uLC, uLH, uLHole, uRC, uRH, uRHole;
  float sdBox(vec3 p, vec3 c, vec3 h){ vec3 q = abs(p - c) - h; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
  // a slab thin along axis ax: how much of it lies on the way from p to the eye (0..1, soft at its rims, 0 in its hole). hole = (a, b, r) in the
  // slab's plane coordinates (world), the plane's coordinates being (x, z) for a plate, (x, y) for the left panel, (z, y) for the right one
  float slabCover(vec3 p, vec3 v, vec3 c, vec3 h, vec3 hole, int ax){
    float pc = ax == 0 ? p.x - c.x : ax == 1 ? p.y - c.y : p.z - c.z;
    float vc = ax == 0 ? v.x : ax == 1 ? v.y : v.z;
    float t = -pc / vc;
    if (t <= 0.0 || abs(vc) < 1e-4) return 0.0;
    vec3 q = p + v * t;
    vec2 uv = ax == 0 ? q.zy : ax == 1 ? q.xz : q.xy;
    vec2 cc = ax == 0 ? c.zy : ax == 1 ? c.xz : c.xy;
    vec2 hh = ax == 0 ? h.zy : ax == 1 ? h.xz : h.xy;
    float m = min(hh.x - abs(uv.x - cc.x), hh.y - abs(uv.y - cc.y));
    float dho = length(uv - hole.xy) - hole.z;
    return smoothstep(-0.03, 0.16, m) * smoothstep(-0.04, 0.12, dho);
  }
  float coreCover(vec3 p, vec3 v){
    float d = 9.0;
    for (int i = 0; i < 10; i++) d = min(d, sdBox(p + v * (float(i) * 0.62), uCoreC, uCoreH));
    return smoothstep(0.1, -0.22, d);
  }
  float frostLevel(vec3 p, vec3 v){
    float s = max(max(slabCover(p, v, uTopC, uTopH, uTopHole, 1), slabCover(p, v, uBotC, uBotH, uBotHole, 1)),
                  max(slabCover(p, v, uLC, uLH, uLHole, 2), slabCover(p, v, uRC, uRH, uRHole, 0)));
    return max(s, coreCover(p, v) * 2.0);
  }
  // a point of data at level L (0 sharp, 1 soft, 2 glow), its three samples: colour and alpha; its green light (for the bloom) in .w of glowOut
  // (linear: the composer writes sRGB) ink #111, soft grey-green, the glow's green
  const vec3 INK = vec3(0.0056), SOFTC = vec3(0.12, 0.19, 0.155), GLOWC = vec3(0.02, 0.6, 0.27);
  vec4 dataCol(float L, float s0, float s1, float s2, float gk, out float glowOut){
    float w0 = 1.0 - smoothstep(0.15, 1.0, L), w2 = smoothstep(1.1, 1.9, L), w1 = max(0.0, 1.0 - w0 - w2);
    float a0 = s0 * 0.9 * w0;
    float a1 = smoothstep(0.03, 0.32, s1) * 0.42 * w1;
    float a2 = smoothstep(0.03, 0.11, s2) * (0.16 + gk * 0.3) * w2;
    float a = a0 + a1 + a2;
    glowOut = a2 * (0.35 + gk * 0.6);
    return vec4((INK * a0 + SOFTC * a1 + GLOWC * a2) / max(a, 1e-4), clamp(a, 0.0, 1.0));
  }
`;

// the picture, sharp, for the blurs (the same function the walls and the tapes draw their sharp level with)
const SRC_FS = /* glsl */ `
  uniform float t; varying vec2 vUv;
  ${DATA_GLSL}
  void main(){ float v = inkAt(vUv * ${CELLS.toFixed(1)}, t); gl_FragColor = vec4(v, v, v, 1.0); }`;
// a gaussian blur along one direction (9 taps through linear sampling), wrapping
const BLUR_FS = /* glsl */ `
  uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tex, vUv) * 0.227027;
    s += (texture2D(tex, vUv + dir * 1.3846) + texture2D(tex, vUv - dir * 1.3846)) * 0.3162162;
    s += (texture2D(tex, vUv + dir * 3.2308) + texture2D(tex, vUv - dir * 3.2308)) * 0.0702703;
    gl_FragColor = s;
  }`;

export type Data = ReturnType<typeof data>;
/** the picture and its two blurs; `update(t)` redraws them (cheap: 512² once, then small blurs) */
export function data(renderer: THREE.WebGLRenderer, lite: boolean) {
  const S = lite ? 384 : 512;
  const rt = (n: number) => {
    const r = new THREE.WebGLRenderTarget(n, n, { type: THREE.UnsignedByteType, depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    r.texture.wrapS = r.texture.wrapT = THREE.RepeatWrapping;
    return r;
  };
  const sharp = rt(S), s1 = rt(S / 2), s2 = rt(S / 2), g1 = rt(64), g2 = rt(64);
  const at = atlas();
  const srcMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: SRC_FS, uniforms: { tAtlas: { value: at }, t: { value: 0 } } });
  const blurU = { tex: { value: null as THREE.Texture | null }, dir: { value: new THREE.Vector2() } };
  const blurMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS, uniforms: blurU });
  const quad = new FullScreenQuad(srcMat);
  const pass = (mat: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget) => { quad.material = mat; renderer.setRenderTarget(to); quad.render(renderer); };
  const blur = (from: THREE.WebGLRenderTarget, a: THREE.WebGLRenderTarget, b: THREE.WebGLRenderTarget, spreads: number[]) => {
    let src = from;
    for (const s of spreads) {
      blurU.tex.value = src.texture; blurU.dir.value.set(s / a.width, 0); pass(blurMat, a);
      blurU.tex.value = a.texture; blurU.dir.value.set(0, s / a.width); pass(blurMat, b);
      src = b;
    }
  };
  let lastT = -1;
  return {
    atlas: at, soft: s2.texture, glow: g2.texture,
    update(t: number) {
      // the glyphs re-roll slowly: redraw ~15 times a second at most
      const q = Math.floor(t * 15) / 15;
      if (q === lastT) return; lastT = q;
      const prev = renderer.getRenderTarget();
      srcMat.uniforms.t.value = q;
      pass(srcMat, sharp);
      blur(sharp, s1, s2, [0.9, 1.4]);            // frosted: the characters run together into soft rows
      blur(s2, g1, g2, [1, 1.8, 2.4]);            // frosted deep: only a glow is left
      renderer.setRenderTarget(prev);
    },
    dispose() { for (const r of [sharp, s1, s2, g1, g2]) r.dispose(); at.dispose(); srcMat.dispose(); blurMat.dispose(); quad.dispose(); },
  };
}

/* ── the shared cover uniforms (the scene keeps them on the glass as it moves) ──────────────────────────────────────────────────────────── */
export type Cover = ReturnType<typeof coverUniforms>;
export function coverUniforms() {
  const v = () => ({ value: new THREE.Vector3() });
  return { uCoreC: v(), uCoreH: v(), uTopC: v(), uTopH: v(), uTopHole: v(), uBotC: v(), uBotH: v(), uBotHole: v(), uLC: v(), uLH: v(), uLHole: v(), uRC: v(), uRH: v(), uRHole: v() };
}

const WORLD_VS = /* glsl */ `
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN; varying vec3 vWN;
  void main(){
    vLP = position; vLN = normal;
    vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
/** a ShaderMaterial whose `opacity` drives its uOp (the piece's fade writes it) */
function faded(m: THREE.ShaderMaterial, u: { uOp: THREE.IUniform }) {
  m.userData.glass = true;
  let op = 1;
  Object.defineProperty(m, "opacity", { get: () => op, set: (v: number) => { op = v; u.uOp.value = v; }, configurable: true });
  return m;
}

/* ── the data walls ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
// The back frames' sheets: a faint glass film; rows of ASCII at the core's height (a band, soft at its ends), drifting in toward the core; each point
// at the level of what lies in front of it. uSide 0: the left frame (plane x; its rows read toward −z), 1: the right one (plane z; toward +x).
const WALL_FS = /* glsl */ `
  uniform float uSide, uT, uFlow, uInk, uOp, uBloom, uGlow, uY0, uYa, uYb;
  uniform sampler2D tSoft, tGlow;
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN; varying vec3 vWN;
  ${DATA_GLSL}
  ${COVER_GLSL}
  void main(){
    vec3 v = normalize(cameraPosition - vWP);
    float u = uSide < 0.5 ? -vLP.z : vLP.x;
    float y = vLP.y + uY0;                                   // the height at rest
    vec2 g = vec2(u / ${CELL.toFixed(3)} + (uSide < 0.5 ? -1.0 : 1.0) * uT * uFlow + uSide * 13.0, y / ${CELL.toFixed(3)} + 5.0 + uSide * 9.0);
    float band = smoothstep(uYa, uYa + 0.5, y) * smoothstep(uYb, uYb - 0.5, y);
    float L = frostLevel(vWP, v);
    float s0 = L < 1.0 ? inkAt(g, uT) : 0.0;
    float s1 = texture2D(tSoft, g / ${CELLS.toFixed(1)}).r, s2 = texture2D(tGlow, g / ${CELLS.toFixed(1)}).r;
    float gl;
    vec4 d = dataCol(L, s0, s1, s2, uGlow, gl);
    d.a *= band * uInk;
    // the sheet's own film: the faintest mint
    vec3 col = mix(vec3(0.787, 0.935, 0.871), d.rgb, d.a / max(d.a + 0.05, 1e-4));
    float a = d.a + 0.05 * (1.0 - d.a);
    if (uBloom > 0.5) { gl_FragColor = vec4(vec3(0.0, 0.716, 0.266) * gl * band * uInk * uOp, 1.0); return; }
    gl_FragColor = vec4(col, a * uOp);
  }`;
export function wallMaterial(d: Data, cover: Cover, side: 0 | 1, shared: { [k: string]: THREE.IUniform }) {
  const u = {
    tAtlas: { value: d.atlas }, tSoft: { value: d.soft }, tGlow: { value: d.glow },
    uSide: { value: side }, uOp: { value: 1 }, uBloom: { value: 0 }, uY0: { value: 0 }, uYa: { value: -1.75 }, uYb: { value: 2.2 },
    ...cover, ...shared,
  } as { [k: string]: THREE.IUniform } & { uOp: THREE.IUniform };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: WORLD_VS, fragmentShader: WALL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return faded(m, u);
}

/* ── the streams ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
// A tape: a ribbon one cell wide laid along a path (attributes aS: the distance along it, in cells; aW: 0..1 across it). A packet of uLen characters
// runs along it (its head at uHead): the characters ride with it. Vertical tapes (uVert) stack upright characters; the others print a row along the
// path (uFlip: their characters read against the path, so the row never shows mirrored). Each point at the level of what lies in front of it.
const TAPE_VS = /* glsl */ `
  attribute float aS; attribute float aW;
  varying vec3 vWP; varying float vS; varying float vW;
  void main(){
    vS = aS; vW = aW;
    vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const TAPE_FS = /* glsl */ `
  uniform float uHead, uLen, uEnd, uVert, uFlip, uRow, uCol, uT, uOp, uBloom, uGlow, uFadeIn;
  uniform sampler2D tSoft, tGlow;
  varying vec3 vWP; varying float vS; varying float vW;
  ${DATA_GLSL}
  ${COVER_GLSL}
  void main(){
    float sl = vS - (uHead - uLen);                          // along the packet: 0 at its tail, uLen at its head
    vec2 dS = vec2(dFdx(sl), dFdy(sl)), dW = vec2(dFdx(vW), dFdy(vW));
    if (sl < 0.0 || sl > uLen) discard;
    float win = smoothstep(0.0, 1.2, sl) * smoothstep(uLen, uLen - 0.6, sl) * smoothstep(0.0, uFadeIn, vS) * smoothstep(uEnd, uEnd - 2.5, vS);
    float n = floor(sl), fs = fract(sl);
    vec2 cell, f, gx, gy;
    if (uVert > 0.5) { cell = vec2(uCol + n, uRow); f = vec2(vW, 1.0 - fs); gx = vec2(dW.x, -dS.x); gy = vec2(dW.y, -dS.y); }
    else if (uFlip > 0.5) { cell = vec2(uCol - n, uRow); f = vec2(1.0 - fs, vW); gx = vec2(-dS.x, dW.x); gy = vec2(-dS.y, dW.y); }
    else { cell = vec2(uCol + n, uRow); f = vec2(fs, vW); gx = vec2(dS.x, dW.x); gy = vec2(dS.y, dW.y); }
    vec3 v = normalize(cameraPosition - vWP);
    float L = frostLevel(vWP, v);
    float s0 = L < 1.0 ? inkCell(cell, f, gx, gy, uT) : 0.0;
    vec2 g = (cell + f) / ${CELLS.toFixed(1)};
    float s1 = texture2D(tSoft, g).r, s2 = texture2D(tGlow, g).r;
    float gl;
    vec4 d = dataCol(L, s0, s1, s2, uGlow + 0.4, gl);
    // behind glass, a touch of its milk
    d.rgb = mix(d.rgb, vec3(0.852, 0.935, 0.89), clamp(L, 0.0, 1.0) * 0.12);
    if (uBloom > 0.5) { gl_FragColor = vec4(vec3(0.0, 0.716, 0.266) * gl * win * uOp * 1.3, 1.0); return; }
    gl_FragColor = vec4(d.rgb, d.a * win * uOp);
  }`;
/** a tape along a polyline (world points); `across` the ribbon's width direction (unit), or null for "up" (world y) */
export function tapeGeometry(pts: THREE.Vector3[], across: THREE.Vector3 | null) {
  const pos: number[] = [], aS: number[] = [], aW: number[] = [], idx: number[] = [];
  let s = 0;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += pts[i].distanceTo(pts[i - 1]) / CELL;
    const w = (across ?? up).clone().multiplyScalar(CELL / 2);
    for (const k of [0, 1]) {
      const p = pts[i].clone().addScaledVector(w, k ? 1 : -1);
      pos.push(p.x, p.y, p.z); aS.push(s); aW.push(k);
    }
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1));
  g.setAttribute("aW", new THREE.Float32BufferAttribute(aW, 1));
  g.setIndex(idx);
  return { geo: g, len: s };
}
export function tapeMaterial(d: Data, cover: Cover, shared: { [k: string]: THREE.IUniform }, o: { vert: boolean; flip: boolean; row: number; col: number; end: number }) {
  const u = {
    tAtlas: { value: d.atlas }, tSoft: { value: d.soft }, tGlow: { value: d.glow },
    uHead: { value: -9 }, uLen: { value: 7 }, uEnd: { value: o.end }, uVert: { value: o.vert ? 1 : 0 }, uFlip: { value: o.flip ? 1 : 0 },
    uRow: { value: o.row }, uCol: { value: o.col }, uOp: { value: 1 }, uBloom: { value: 0 }, uFadeIn: { value: 1.5 },
    ...cover, ...shared,
  } as { [k: string]: THREE.IUniform } & { uOp: THREE.IUniform };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: TAPE_VS, fragmentShader: TAPE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return faded(m, u);
}

/* ── the glass ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
// A slab (a plate, a side panel): its two broad faces a light mint film (the drawing's white over a breath of green) with a soft sheen across it, a
// fine bright line just inside the rims, the drawing's green dots (the plates) and dotted traces (the bottom plate); its edges the glass seen through
// its thickness: mint, a deeper green band down the middle. A light wave (uWave from the core outward, uLit its strength) and a glow (uHot) run in it.
// In the bloom pass (uBloom) it draws only its green light, added.
const SLAB_FS = /* glsl */ `
  uniform float uAxis, uOp, uBloom, uHot, uWave, uLit, uDots, uTrace;
  uniform vec3 uHalf, uHole, uWorldC;
  uniform vec2 uDotOff;
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN; varying vec3 vWN;
  const vec3 GREEN = vec3(0.0, 0.716, 0.266);   // #00DC8D, linear
  void main(){
    int ax = int(uAxis + 0.5);
    float nA = ax == 0 ? vLN.x : ax == 1 ? vLN.y : vLN.z;
    vec2 q = ax == 0 ? vLP.zy : ax == 1 ? vLP.xz : vLP.xy;
    vec2 h = ax == 0 ? uHalf.zy : ax == 1 ? uHalf.xz : uHalf.xy;
    float th = ax == 0 ? uHalf.x : ax == 1 ? uHalf.y : uHalf.z;
    float dAx = (ax == 0 ? vLP.x : ax == 1 ? vLP.y : vLP.z) / th;
    float rw = length(vWP - uWorldC);
    float wave = exp(-pow((rw - uWave) / 0.45, 2.0)) * uLit;
    vec3 col; float a; float gl;
    if (abs(nA) > 0.5) {
      // a broad face
      float rimD = min(h.x - abs(q.x), h.y - abs(q.y));
      float dHole = length(q - uHole.xy) - uHole.z;
      col = mix(vec3(1.0), GREEN, 0.2);
      a = 0.42;
      // the sheen: a soft diagonal light, brighter toward the top-left
      float sd = (q.x * 0.7 - q.y * 0.7) / max(h.x, h.y);
      col = mix(col, vec3(1.0), smoothstep(0.2, -0.9, sd) * 0.6);
      a += smoothstep(0.1, -1.0, sd) * 0.1;
      // the rims: a fine bright line inside the edge, then the mint edge itself; the hole's rim too
      float hl = exp(-pow((rimD - 0.055) / 0.016, 2.0)) + exp(-pow((dHole - 0.04) / 0.014, 2.0)) * 0.8;
      col = mix(col, vec3(1.0), clamp(hl, 0.0, 1.0) * 0.9); a = max(a, hl * 0.55);
      float edge = 1.0 - smoothstep(0.0, 0.03, rimD);
      col = mix(col, mix(vec3(1.0), GREEN, 0.4), edge * 0.7);
      // the dots: a grid (uDots: its step), green, as the drawing
      if (uDots > 0.0) {
        vec2 dq = (q - uDotOff) / uDots;
        vec2 cq = (fract(dq + 0.5) - 0.5) * uDots;
        float inside = step(abs(dq.x), 4.6) * step(abs(dq.y), 4.6) * step(0.55, dHole) * step(0.12, rimD);
        float dt0 = (1.0 - smoothstep(0.024, 0.036, length(cq))) * inside;
        col = mix(col, GREEN, dt0 * 0.85); a = max(a, dt0 * 0.85);
      }
      // the bottom plate's traces: two dotted lines from under the core out to the front edges
      if (uTrace > 0.0) {
        vec2 t0 = vec2(0.77, 0.75);
        float d1 = abs(q.x - t0.x) + max(0.0, t0.y - q.y) + max(0.0, q.y - 3.28);
        float d2 = abs(q.y - t0.y) + max(0.0, t0.x - q.x) + max(0.0, q.x - 3.3);
        float m1 = 1.0 - smoothstep(0.012, 0.022, length(vec2(d1, (fract((q.y - t0.y) / 0.1405 + 0.5) - 0.5) * 0.1405)));
        float m2 = 1.0 - smoothstep(0.012, 0.022, length(vec2(d2, (fract((q.x - t0.x) / 0.1405 + 0.5) - 0.5) * 0.1405)));
        float tr = max(m1, m2) * 0.7;
        col = mix(col, GREEN, tr); a = max(a, tr);
      }
      col = mix(col, mix(col, GREEN, 0.4), clamp(wave * 0.35 + uHot * 0.3, 0.0, 0.6));
      gl = wave * 0.12 + uHot * 0.15;
    } else {
      // an edge: the glass through its thickness, mint, the deeper band down its middle
      float band = 1.0 - smoothstep(0.7, 0.78, abs(dAx));
      col = mix(vec3(0.718, 0.913, 0.831), vec3(0.148, 0.793, 0.485), band);
      col = mix(col, GREEN, clamp(wave * 0.5 + uHot * 0.4, 0.0, 0.7));
      a = 0.9;
      gl = band * (0.05 + wave * 0.5 + uHot * 0.5);
    }
    if (uBloom > 0.5) { gl_FragColor = vec4(GREEN * gl * uOp, 1.0); return; }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOp);
  }`;
export function slabMaterial(shared: { [k: string]: THREE.IUniform } = {}) {
  const u = {
    uAxis: { value: 1 }, uOp: { value: 1 }, uBloom: { value: 0 }, uHot: { value: 0 }, uWave: { value: -9 }, uLit: { value: 0 }, uDots: { value: 0 }, uTrace: { value: 0 },
    uHalf: { value: new THREE.Vector3(1, 1, 1) }, uHole: { value: new THREE.Vector3(0, 0, 0.3) }, uWorldC: { value: new THREE.Vector3() }, uDotOff: { value: new THREE.Vector2() },
    ...shared,
  } as { [k: string]: THREE.IUniform } & { uOp: THREE.IUniform };
  const m = new THREE.ShaderMaterial({
    uniforms: u, vertexShader: WORLD_VS, fragmentShader: SLAB_FS, transparent: true, depthWrite: false, side: THREE.FrontSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  return faded(m, u);
}

// A tint: the bars' glass, their green cores, the core's faint faces, the fins and the rod: a flat colour at an alpha (the drawing's fills), a faint
// sheen at grazing angles, and a light front that can run through it in world space (uFront: a point on a loop round the core, its strength uFrontK).
const TINT_FS = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha, uOp, uBloom, uGlowBase, uFrontA, uFrontK, uHot;
  varying vec3 vWP; varying vec3 vLP; varying vec3 vLN; varying vec3 vWN;
  const vec3 GREEN = vec3(0.0, 0.716, 0.266);   // #00DC8D, linear
  void main(){
    // the front: an angle round the vertical axis (and a little with height), so it runs round the core's frame as one travelling light
    float ang = atan(vWP.z, vWP.x) + vWP.y * 0.35;
    float dd = abs(mod(ang - uFrontA + 3.14159, 6.28318) - 3.14159);
    float fr = exp(-pow(dd / 0.5, 2.0)) * uFrontK;
    vec3 v = normalize(cameraPosition - vWP);
    float fres = pow(1.0 - abs(dot(normalize(vWN), v)), 3.0);
    vec3 col = mix(uColor, vec3(1.0), fres * 0.35);
    col = mix(col, GREEN, clamp(fr * 0.7 + uHot * 0.5, 0.0, 0.85));
    float a = uAlpha + fr * 0.25 + uHot * 0.15;
    if (uBloom > 0.5) { gl_FragColor = vec4(GREEN * (uGlowBase + fr * 1.1 + uHot) * uOp, 1.0); return; }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOp);
  }`;
export function tintMaterial(color: string, alpha: number, glowBase: number, shared: { [k: string]: THREE.IUniform } = {}, side: THREE.Side = THREE.FrontSide) {
  const u = {
    uColor: { value: new THREE.Color(color) }, uAlpha: { value: alpha }, uOp: { value: 1 }, uBloom: { value: 0 }, uGlowBase: { value: glowBase },
    uFrontA: { value: 0 }, uFrontK: { value: 0 }, uHot: { value: 0 },
    ...shared,
  } as { [k: string]: THREE.IUniform } & { uOp: THREE.IUniform };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: WORLD_VS, fragmentShader: TINT_FS, transparent: true, depthWrite: false, side });
  return faded(m, u);
}
