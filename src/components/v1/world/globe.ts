/* globe.ts · the MORPHABLE dot globe (r13/lib/globe.js): ONE THREE.Points draw call. The dots are a latitude-row lattice (lattice.ts): land = big and dark, sea = tiny and pale,
 * plus a ring of very small dots that reads as the hairline outline. Everything moves in the vertex shader; a frame only writes a handful of uniforms (no allocation).
 *
 *   const g = await createGlobe(canvas, { box, mode, dots, dpr, host, ... });      // async: it fetches /v1/world/land-rle.json (once per page)
 *
 *   opts:
 *       box        HTMLElement (the `.globe` box: centre + width/2 are read on every resize, transforms included) | { cx, cy, r } in stage px
 *       mode       'A' (the hero: globe whole at the right, yaw 2.07 pitch .29) | 'B' (a huge dome, yaw 1.44 pitch .30, bottom fade)    default 'A'
 *       dots       number | { desktop, mobile }  (default 24000 / 12000 lattice dots, + an outline ring of 6400 / 2600 tiny dots); mobile = (max-width: 760px)
 *       dpr        cap of the device pixel ratio (default 2, 1.5 on mobile); the engine steps it down if frames are slow
 *       host       element that gets the pointer events (default: the stage's parent, i.e. the pinned wrapper)
 *       stage      the element whose size is the coordinate system (default canvas.parentElement; the `.stage` div, 100vw x 100svh)
 *       bleed      px of canvas around the stage (default 0)
 *       frozen     true: no spin, no pointer          still: true: render on demand only, no loop (reduced motion)
 *       intro      true (default): the draw-in plays (1.4 s)   false: drawn at once   number 0..1: freeze the draw-in at that progress
 *       raf        true (default): the engine runs its own requestAnimationFrame loop. false: you call g.frame(now_ms) from your own ticker (the world's boot does, from gsap.ticker)
 *       land       the parsed land-rle.json (default: fetched)
 *   -> g (see the Globe type): uniforms (tween .value directly), set({ uZoom: 2, uInk: [r,g,b] }), setProgress('A'|'B'|'draw', p), setBox, bind(ch, target), configure(ch, {...}),
 *      setInteractive(bool), setRotation(auto), setView({ yaw, pitch }), view(), project(lat, lon, out, zoomed), onFrame / onResize / onRebuild (each returns its off),
 *      resize(), render(), frame(now_ms), pause(bool), destroy(), stats, size { W, H }, box { cx, cy, r }, dots, cfg, stageRect().
 *
 *   MORPH CHANNELS (A then B; B starts from wherever A left the dots): a TARGET is a Float32Array of 4 numbers per dot (dots.total, the ring included):
 *       x, y   where the dot goes, stage px; a value <= KEEP/2 means "keep the dot's current coordinate, plus (value - KEEP) px"
 *       z      size multiplier (channel look size x z); 0 shrinks the dot to nothing; z < 0 keeps the dot's size and alpha (x |z|)
 *       w      delay 0..1: the dot starts moving when the channel's progress reaches w * stagger
 *     uMorphA / uMorphB 0..1: tween it LINEARLY (the shader eases each dot on its own staggered window); uStag*, uEase*, uArc*, uLook* (seaSize, landSize, seaAlpha, landAlpha),
 *     uKeep* (arrived dots keep the sphere's front-face mask), uScale* / uPiv* / uOff*.
 *   OTHER UNIFORMS: uDraw (the draw-in), uAlpha, uSize, uRing, uZoom (+ uZoomC, uZoomSize), uSea, uThin, uLandSize, uDisperse, uInk / uPaper / uInvR / uInvC / uInvF,
 *     uFall (vec2: the dots fade out between these two stage y px), uKnock + uBox[2] (the dots inside those boxes go quieter, 30 px feather). */
import * as THREE from "three";
import { decodeLand, buildLattice, rotation, TAU, type LandRLE, type LandMask } from "./lattice";

export { rotation, TAU } from "./lattice";

const LAND_URL = "/v1/world/land-rle.json";
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const EASE: Record<string, number> = { linear: 0, none: 0, inout3: 1, "inout-expo": 2, inout: 1, in3: 3, out3: 4, "out-expo": 5, inout2: 6, in4: 7 };
type ModeCfg = { yaw: number; pitch: number; roll: number; fall: [number, number] | null; knock: number };
const MODES: Record<"A" | "B", ModeCfg> = {
  A: { yaw: 2.07, pitch: 0.29, roll: -0.02, fall: null, knock: 0 },
  B: { yaw: 1.44, pitch: 0.30, roll: -0.06, fall: [0.70, 0.98], knock: 0.72 },
};

/* ───────── targets: the few helpers r17 v1 uses (r13/lib/targets.js; its builders targetPlane / Rows / Void / FromText / FromPath / FromPoints are not used here) ───────── */
export const KEEP = -1e5;
/** the NEAR "N" mark (73 x 73 viewBox) */
export const N_PATH = "M61.0741 15.4268L60.1503 15.6046L45.2764 28.5974C43.6305 29.4554 42.1009 27.9171 42.9636 26.2807L59.3426 2.19499C64.1334 -2.1196 71.7447 0.589276 72.4544 7.03665V65.6943C71.7753 72.6075 63.2278 74.6299 58.2046 70.8547L12.298 16.0152C11.9799 15.7271 11.3374 15.6781 11.1784 16.1623L11.1355 56.201L11.368 57.3103L12.2919 57.1325L27.1658 44.1397C28.4813 43.4288 29.9191 44.3358 29.7172 45.8496C29.6193 46.5728 26.1196 51.4819 25.4343 52.5176C21.4328 58.536 17.3335 64.4992 13.2219 70.444C8.44954 74.8628 0.728093 72.2336 0 65.6943V7.03665C0.679146 0.123497 9.22657 -1.89897 14.2498 1.8763L60.4134 56.8813L61.1108 56.8261L61.3128 16.5361L61.0803 15.4268H61.0741Z";
export const N_VIEWBOX: [number, number] = [73, 73];

/** a channel's look and motion (g.configure / a target's defaults) */
export type ChannelCfg = {
  stagger?: number; ease?: string | number; arc?: number; size?: number | [number, number]; alpha?: number | [number, number];
  keepVis?: boolean; scale?: number; pivot?: [number, number]; offset?: [number, number];
};
export type Target = { name: string; total: number; data: Float32Array; defaults?: ChannelCfg };
/** one run of text in one font, its baseline at (x, y) in stage px */
export type TextItem = { text: string; x: number; y: number; font: string; ls: number; line: number };

let metricsC: CanvasRenderingContext2D | null = null;
function fontMetrics(font: string, text: string) {
  const c = metricsC || (metricsC = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D);
  c.font = font;
  const m = c.measureText(text || "Hg"), px = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] || "16");
  return { w: m.width, asc: m.fontBoundingBoxAscent != null ? m.fontBoundingBoxAscent : px * 0.95, desc: m.fontBoundingBoxDescent != null ? m.fontBoundingBoxDescent : px * 0.25 };
}
/** The measured words / lines of the real DOM as items (so the dots land exactly where the page's type is): pass the elements that hold ONE font each.
 *  Uses each element's own box (measure the un-transformed wrapper), font, letter-spacing and line-height. */
export function textItemsFromDom(g: Globe, els: Element[], opts: { text?: (el: Element) => string; line?: (el: Element, k: number) => number } = {}): TextItem[] {
  const org = g.stageRect(), items: TextItem[] = [];
  els.forEach((el, k) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = (opts.text ? opts.text(el) : el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const m = fontMetrics(font, text), lh = parseFloat(cs.lineHeight);
    const H = isNaN(lh) ? m.asc + m.desc : lh;
    const ls = parseFloat(cs.letterSpacing);
    items.push({ text, x: r.left - org.left + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0), y: r.top - org.top + (parseFloat(cs.paddingTop) || 0) + (H - (m.asc + m.desc)) / 2 + m.asc, font, ls: isNaN(ls) ? 0 : ls, line: opts.line ? opts.line(el, k) : 0 });
  });
  return items;
}

/* ───────── the shaders ───────── */
const VS = /* glsl */`
precision highp float;
uniform vec2 uRes, uC, uFall, uOrg, uZoomC, uInvC, uPivA, uPivB, uOffA, uOffB;
uniform float uPx, uDraw, uGG, uR, uKnock, uAlpha, uSize, uRing, uZoom, uZoomSize, uSea, uThin, uLandSize, uDisperse, uMaxPt, uSnap, uInvR, uInvF;
uniform float uMorphA, uMorphB, uStagA, uStagB, uEaseA, uEaseB, uArcA, uArcB, uKeepA, uKeepB, uScaleA, uScaleB;
uniform vec4 uLookA, uLookB;
uniform vec3 uInk, uPaper;
uniform mat3 uRot;
uniform vec4 uBox[2];
attribute vec4 aG;        /* x land (0 sea .. 1 land), y z hashes, w kind: 0 = a dot of the world, 1 = a dot of the outline ring */
attribute vec4 aTA;       /* target of channel A: x y (px; <= -5e4: keep current + (v + 1e5)), size multiplier (<0 keep look), delay */
attribute vec4 aTB;
varying float vA;
varying vec2 vS;          /* x dot diameter (device px), y sprite side (device px) */
varying vec3 vC;

float ez(float p, float m){
  if (m < .5) return p;
  if (m < 1.5) return p < .5 ? 4. * p * p * p : 1. - pow(-2. * p + 2., 3.) * .5;
  if (m < 2.5) return p <= 0. ? 0. : p >= 1. ? 1. : p < .5 ? pow(2., 20. * p - 10.) * .5 : (2. - pow(2., -20. * p + 10.)) * .5;
  if (m < 3.5) return p * p * p;
  if (m < 4.5) return 1. - pow(1. - p, 3.);
  if (m < 5.5) return p >= 1. ? 1. : 1. - pow(2., -10. * p);
  if (m < 6.5) return p < .5 ? 2. * p * p : 1. - pow(-2. * p + 2., 2.) * .5;
  return p * p * p * p;
}

/* one morph channel: the dot (pos, sz, a) moves toward its target T by its own staggered, eased progress */
void morph(inout vec2 pos, inout float sz, inout float a, vec4 T, float m, float stag, float em, float arc, vec4 lk, float keep, vec2 pv, float sc, vec2 off, float vis, float ls, float h){
  float p = clamp((m - T.w * stag) / max(1. - stag, .02), 0., 1.);
  float e = ez(p, em);
  vec2 d;
  d.x = T.x < -5e4 ? pos.x + T.x + 1e5 : pv.x + (T.x - pv.x) * sc;
  d.y = T.y < -5e4 ? pos.y + T.y + 1e5 : pv.y + (T.y - pv.y) * sc;
  d += off;
  vec2 dv = d - pos;
  vec2 np = mix(pos, d, e) + vec2(-dv.y, dv.x) * arc * (.4 + .6 * h) * sin(3.14159265 * e);
  bool kz = T.z < 0.;
  float tsz = kz ? sz * -T.z : mix(lk.x, lk.y, ls) * T.z;
  float ta = kz ? a : mix(lk.z, lk.w, ls) * mix(1., vis, keep);
  sz = mix(sz, tsz, e); a = mix(a, ta, e); pos = np;
}

void main(){
  bool ring = aG.w > .5;
  float ls = aG.x, h1 = aG.y, h2 = aG.z, vis = 1.;
  vec2 pos; float a, sz;
  if (ring){
    pos = uC + vec2(position.x, -position.y) * uR;
    a = 0.032 * smoothstep(0.3, 0.9, uDraw) * uRing * (1. - clamp(max(uMorphA, uMorphB) * 8., 0., 1.));
    sz = 1.7;
  } else {
    vec3 n = uRot * position;
    /* the draw-in: from the centre of the face that looks at us to the limb; a little hash breaks the rings */
    float st = length(n.xy) * 0.7 + h1 * 0.08;
    float prog = clamp((uDraw - st) / 0.22, 0., 1.);
    float x1 = prog - 1.;
    float e = prog < 1. ? 1. + 2.2 * x1 * x1 * x1 + 1.2 * x1 * x1 : 1.;
    vis = smoothstep(-0.02, 0.12, n.z);
    float day = smoothstep(-0.4, 0.6, dot(n, normalize(vec3(-0.55, 0.45, 0.7))));
    sz = uGG * mix(mix(0.2, 0.26, day), mix(0.5, 0.64, day), ls);
    sz *= mix(0.3, 1., smoothstep(0., 0.7, n.z));
    sz *= e;
    pos = uC + vec2(n.x, -n.y) * uR * (1. + ls * 0.006) * mix(0.965, 1., prog);
    a = mix(0.15 + 0.12 * day, 0.86 + 0.12 * day, ls) * vis * prog;
  }
  /* the dots fade out toward the bottom of the screen (the dots themselves; no overlay) */
  a *= 1. - smoothstep(uFall.x, uFall.y, pos.y);
  /* the dots that sit under the copy go quieter, so the text stays readable */
  if (uKnock > 0.){
    float k = 0.;
    for (int i = 0; i < 2; i++){
      vec4 R = uBox[i];
      vec2 dq = max(R.xy - pos, pos - R.zw);
      k = max(k, 1. - smoothstep(0., 30., max(dq.x, dq.y)));
    }
    a *= 1. - uKnock * k;
  }
  if (!ring){
    float sea = 1. - ls;
    a *= mix(1., uSea * step(uThin, h2), sea);
    sz *= mix(1., uLandSize, ls);
    if (uMorphA > 0.) morph(pos, sz, a, aTA, uMorphA, uStagA, uEaseA, uArcA, uLookA, uKeepA, uPivA, uScaleA, uOffA, vis, ls, h2);
    if (uMorphB > 0.) morph(pos, sz, a, aTB, uMorphB, uStagB, uEaseB, uArcB, uLookB, uKeepB, uPivB, uScaleB, uOffB, vis, ls, h2);
  }
  sz *= uSize; a *= uAlpha;
  if (uZoom != 1.){ pos = uZoomC + (pos - uZoomC) * uZoom; sz *= pow(uZoom, uZoomSize); }
  if (uDisperse > 0.){ float th = h1 * 6.2831853; pos += vec2(cos(th), sin(th)) * uDisperse * (.3 + .7 * h2); }
  float inv = uInvR > 0. ? 1. - smoothstep(uInvR - uInvF, uInvR, distance(pos, uInvC)) : 0.;
  vC = mix(uInk, uPaper, inv);
  pos += uOrg;
  /* pixel-snap (at rest): the centre of a dot sits on a device pixel, the sprite is an odd number of pixels, the dot is drawn inside it. In motion the centre is free (sub-pixel, smooth). */
  vec2 dev = pos * uPx;
  if (!ring) dev = mix(dev, floor(dev) + 0.5, uSnap);
  float side = clamp(max(sz, 1.1) * uPx, 1., uMaxPt - 4.);
  gl_Position = vec4(dev.x / (uRes.x * uPx) * 2. - 1., 1. - dev.y / (uRes.y * uPx) * 2., 0., 1.);
  float S = 2. * ceil(side * 0.5) + 3.;
  gl_PointSize = S;
  vA = clamp(a, 0., 1.) * clamp(sz / 1.1, 0., 1.);
  vS = vec2(side, S);
}`;

const FS = /* glsl */`
precision highp float;
varying float vA;
varying vec2 vS;
varying vec3 vC;
void main(){
  vec2 o = (gl_PointCoord * 2. - 1.) * vS.y * 0.5;
  float al = vA * clamp(0.5 - (length(o) - vS.x * 0.5), 0., 1.);
  if (al < 0.004) discard;
  gl_FragColor = vec4(vC, al);                      /* flat colour: ink #1C1917 by default */
}`;

/* ───────── types ───────── */
export type Box = { cx: number; cy: number; r: number };
export type GlobeOpts = {
  box?: HTMLElement | Box; mode?: "A" | "B"; dots?: number | { desktop?: number; mobile?: number }; dpr?: number;
  host?: HTMLElement; stage?: HTMLElement; bleed?: number; frozen?: boolean; still?: boolean; intro?: boolean | number; raf?: boolean;
  land?: LandRLE; fall?: [number, number] | null; autostart?: boolean;
};
const U = <T,>(v: T) => ({ value: v });
const V2 = (x = 0, y = 0) => new THREE.Vector2(x, y), V4 = (x: number, y: number, z: number, w: number) => new THREE.Vector4(x, y, z, w);
function makeUniforms(bleed: number, maxPoint: number) {
  return {
    uRes: U(V2(1, 1)), uC: U(V2()), uOrg: U(V2(bleed, bleed)), uFall: U(V2(1e5, 1e5 + 1)), uPx: U(1), uDraw: U(0), uGG: U(8), uR: U(300), uKnock: U(0), uMaxPt: U(maxPoint), uSnap: U(1),
    uRot: U(new THREE.Matrix3()), uBox: U([V4(9e4, 9e4, 9e4, 9e4), V4(9e4, 9e4, 9e4, 9e4)]),
    uInk: U(new THREE.Vector3(0.110, 0.098, 0.090)), uPaper: U(new THREE.Vector3(0.961, 0.961, 0.961)), uInvC: U(V2()), uInvR: U(0), uInvF: U(24),
    uAlpha: U(1), uSize: U(1), uRing: U(1), uSea: U(1), uThin: U(0), uLandSize: U(1), uDisperse: U(0),
    uZoom: U(1), uZoomC: U(V2()), uZoomSize: U(1),
    uMorphA: U(0), uStagA: U(0.5), uEaseA: U(1), uArcA: U(0), uLookA: U(V4(2, 2.6, 0.2, 0.6)), uKeepA: U(0), uScaleA: U(1), uPivA: U(V2()), uOffA: U(V2()),
    uMorphB: U(0), uStagB: U(0.5), uEaseB: U(1), uArcB: U(0), uLookB: U(V4(2, 2.6, 0.2, 0.6)), uKeepB: U(0), uScaleB: U(1), uPivB: U(V2()), uOffB: U(V2()),
  };
}
export type GlobeUniforms = ReturnType<typeof makeUniforms>;
export type UniformName = keyof GlobeUniforms;
/** the engine's state (read-only from outside, except through the methods) */
export type GlobeState = {
  W: number; H: number; dpr: number; cap: number; yaw: number; pitch: number; base: number; px: number; py: number; tx: number; ty: number; dragV: number; drag: boolean;
  lx: number; ly: number; lt: number; cx: number; cy: number; R: number; t0: number; draw: number; k: number; ema: number; nf: number; low: number;
  auto: boolean; inter: boolean; blank: boolean; paused: boolean; pivAuto: boolean; rebuilt: boolean; boxEl: HTMLElement | null;
};
export type GlobeCfg = ModeCfg & { spin: number; tilt: number; drawMs: number; nDesktop: number; nMobile: number; ringDesktop: number; ringMobile: number };
export type GlobeDots = { n: number; total: number; pos: Float32Array; aG: Float32Array; row: Uint16Array; rows: number; step: number };
type Off = () => void;
export type Globe = {
  canvas: HTMLCanvasElement; uniforms: GlobeUniforms; S: GlobeState; stats: { cpu: number; max: number; frames: number; dpr: number };
  size: { W: number; H: number }; box: Box; dots: GlobeDots; cfg: GlobeCfg; maxPoint: number; mode: "A" | "B";
  set(o: Partial<Record<UniformName, number | number[] | Record<string, number>>>): Globe;
  setProgress(name: "A" | "B" | "draw", p: number): Globe;
  setBox(b: HTMLElement | Box): Globe;
  bind(ch: "A" | "B", t: Target, applyDefaults?: boolean): Globe;
  configure(ch: "A" | "B", o?: ChannelCfg): Globe;
  resize(): Globe; render(): void; frame(now: number): void; start(): void;
  setInteractive(b: boolean): Globe; setRotation(auto: boolean): Globe;
  setView(v: { yaw?: number; pitch?: number }): Globe; view(): { yaw: number; pitch: number };
  project(lat: number, lon: number, out?: { x?: number; y?: number; z?: number }, zoomed?: boolean): { x: number; y: number; z: number };
  onFrame(cb: (dt: number, now: number, S: GlobeState) => void): Off; onResize(cb: (g: Globe) => void): Off; onRebuild(cb: (g: Globe) => void): Off;
  stageRect(): DOMRect; pause(b?: boolean): Globe; destroy(): void;
};

/* the land, fetched once per page (the hero's globe and the rail's share it) */
let landP: Promise<LandRLE> | null = null;
const loadLand = () => landP || (landP = fetch(LAND_URL).then((r) => { if (!r.ok) throw new Error("land " + r.status); return r.json() as Promise<LandRLE>; }).catch((e) => { landP = null; throw e; }));
let maskCache: { src: LandRLE; mask: LandMask } | null = null;

export async function createGlobe(canvas: HTMLCanvasElement, opts: GlobeOpts = {}): Promise<Globe> {
  const mode = opts.mode === "B" ? "B" : "A";
  const stage = opts.stage || (canvas.parentElement as HTMLElement), host = opts.host || stage.parentElement || stage;
  const dotsOpt = opts.dots;
  const cfg: GlobeCfg = {
    ...MODES[mode], spin: TAU / 180, tilt: 0.07, drawMs: 1400,
    nDesktop: typeof dotsOpt === "number" ? dotsOpt : (dotsOpt && dotsOpt.desktop) || 24000, nMobile: typeof dotsOpt === "number" ? dotsOpt : (dotsOpt && dotsOpt.mobile) || 12000,
    ringDesktop: 6400, ringMobile: 2600,
  };
  const frozen = !!opts.frozen, still = !!opts.still, bleed = opts.bleed ? opts.bleed | 0 : 0;
  const land = opts.land || (await loadLand());
  const raw = maskCache && maskCache.src === land ? maskCache.mask : (maskCache = { src: land, mask: decodeLand(land) }).mask;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const gl = renderer.getContext();
  if (!gl) throw new Error("no webgl");
  renderer.setClearColor(0x000000, 0);
  const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null, maxPoint = range ? range[1] : 64;
  const scene = new THREE.Scene(), camera = new THREE.Camera();

  const uniforms = makeUniforms(bleed, maxPoint);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending });
  const points = new THREE.Points(new THREE.BufferGeometry(), mat);
  points.frustumCulled = false;
  scene.add(points);

  /* ───── the data: the lattice (per tier, built once) + the outline ring ───── */
  const cache: Record<string, ReturnType<typeof buildLattice>> = {};
  let tier = "", geoA: THREE.BufferAttribute | null = null, geoB: THREE.BufferAttribute | null = null;
  const dots: GlobeDots = { n: 0, total: 0, pos: new Float32Array(0), aG: new Float32Array(0), row: new Uint16Array(0), rows: 0, step: 0 };
  const cbRebuild: ((g: Globe) => void)[] = [], cbResize: ((g: Globe) => void)[] = [], cbFrame: ((dt: number, now: number, S: GlobeState) => void)[] = [];

  /* ───── state ───── */
  const S: GlobeState = { W: 1, H: 1, dpr: 0, cap: 1, yaw: cfg.yaw, pitch: cfg.pitch, base: cfg.pitch, px: 0, py: 0, tx: 0, ty: 0, dragV: 0, drag: false, lx: 0, ly: 0, lt: 0, cx: 0, cy: 0, R: 1, t0: -1, draw: 0, k: 0, ema: 0.016, nf: 0, low: 0, auto: !frozen, inter: true, blank: false, paused: false, pivAuto: true, rebuilt: false, boxEl: null };
  let introOpt = opts.intro;

  function applyTier(t: string) {
    if (t === tier) return;
    const first = !tier;
    tier = t;
    const N = t === "m" ? cfg.nMobile : cfg.nDesktop, M = t === "m" ? cfg.ringMobile : cfg.ringDesktop;
    const L = cache[t] || (cache[t] = buildLattice(N, raw));
    const total = L.n + M, pos = new Float32Array(3 * total), aG = new Float32Array(4 * total);
    pos.set(L.pos); aG.set(L.aG);
    for (let i = 0; i < M; i++) { const th = (i / M) * TAU, j = L.n + i; pos[3 * j] = Math.cos(th); pos[3 * j + 1] = Math.sin(th); aG[4 * j + 3] = 1; }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); bg.setAttribute("aG", new THREE.BufferAttribute(aG, 4));
    geoA = new THREE.BufferAttribute(new Float32Array(4 * total), 4); geoB = new THREE.BufferAttribute(new Float32Array(4 * total), 4);
    geoA.setUsage(THREE.DynamicDrawUsage); geoB.setUsage(THREE.DynamicDrawUsage);
    bg.setAttribute("aTA", geoA); bg.setAttribute("aTB", geoB);
    points.geometry.dispose(); points.geometry = bg;
    dots.n = L.n; dots.total = total; dots.pos = pos; dots.aG = aG; dots.row = L.row; dots.rows = L.rows; dots.step = L.step;
    if (!first) S.rebuilt = true;                      // the rebuild callbacks run at the end of resize(), when the box and the size are fresh
  }

  const rot = new Float32Array(9), m3 = uniforms.uRot.value;
  const box: Box = { cx: 0, cy: 0, r: 1 }, size = { W: 1, H: 1 };
  const stats = { cpu: 0, max: 0, frames: 0, dpr: 1 };
  const setRot = (yaw: number, pitch: number) => { rotation(rot, yaw, pitch, cfg.roll); m3.set(rot[0], rot[1], rot[2], rot[3], rot[4], rot[5], rot[6], rot[7], rot[8]); };

  function applyBox() {
    box.cx = S.cx; box.cy = S.cy; box.r = S.R;
    uniforms.uC.value.set(S.cx, S.cy); uniforms.uR.value = S.R;
    uniforms.uGG.value = Math.max(S.R * dots.step * 0.98, 1.6);                  // pitch of the lattice at the centre of the face (step is the angular pitch, in radians)
    if (S.pivAuto) { uniforms.uPivA.value.set(S.cx, S.cy); uniforms.uPivB.value.set(S.cx, S.cy); uniforms.uZoomC.value.set(S.cx, S.cy); }
  }
  function setBox(b: HTMLElement | Box) {
    if (b instanceof HTMLElement) { S.boxEl = b; measureBox(stage.getBoundingClientRect()); }
    else { S.boxEl = null; S.cx = b.cx; S.cy = b.cy; S.R = b.r; applyBox(); }
    return g;
  }
  function measureBox(sr: DOMRect) {
    if (!S.boxEl) return;
    const gr = S.boxEl.getBoundingClientRect();
    S.cx = gr.left - sr.left + gr.width / 2; S.cy = gr.top - sr.top + gr.height / 2; S.R = Math.max(1, gr.width / 2);
    applyBox();
  }
  function resize() {
    if (dead) return g;
    const sr = stage.getBoundingClientRect(), W = Math.max(1, Math.round(sr.width)), H = Math.max(1, Math.round(sr.height));
    applyTier(matchMedia("(max-width: 760px)").matches ? "m" : "d");
    S.cap = Math.min(devicePixelRatio || 1, opts.dpr || (tier === "m" ? 1.5 : 2));
    if (!S.dpr || S.dpr > S.cap) S.dpr = S.cap;
    const cw = W + 2 * bleed, ch = H + 2 * bleed;
    renderer.setPixelRatio(S.dpr); renderer.setSize(cw, ch, false);
    if (bleed) { const st = canvas.style; st.position = "absolute"; st.inset = "auto"; st.left = st.top = -bleed + "px"; st.width = cw + "px"; st.height = ch + "px"; st.maxWidth = st.maxHeight = "none"; }
    S.W = W; S.H = H; size.W = W; size.H = H;
    uniforms.uRes.value.set(cw, ch); uniforms.uPx.value = S.dpr; stats.dpr = S.dpr;
    measureBox(sr);
    const f = opts.fall !== undefined ? opts.fall : cfg.fall;
    if (f) uniforms.uFall.value.set(f[0] * H, f[1] * H); else uniforms.uFall.value.set(1e5, 1e5 + 1);
    uniforms.uKnock.value = 0;                       // no copy boxes here (r13's knock option is mode B's): a caller that wants the knock sets uKnock / uBox after each resize (onResize)
    cbResize.forEach((f2) => f2(g));
    if (S.rebuilt) { S.rebuilt = false; cbRebuild.slice().forEach((f2) => f2(g)); }
    if (still || S.paused) render();
    return g;
  }
  function render() { if (!dead) renderer.render(scene, camera); }

  /* ───── channels ───── */
  const setLook = (v4: THREE.Vector4, sz?: number | [number, number], alpha?: number | [number, number]) => {
    if (sz != null) { const s = Array.isArray(sz) ? sz : [sz, sz]; v4.x = s[0]; v4.y = s[1]; }
    if (alpha != null) { const a = Array.isArray(alpha) ? alpha : [alpha, alpha]; v4.z = a[0]; v4.w = a[1]; }
  };
  function configure(ch: "A" | "B", o: ChannelCfg = {}) {
    const B = ch === "B", u = uniforms;
    if (o.stagger != null) (B ? u.uStagB : u.uStagA).value = o.stagger;
    if (o.ease != null) (B ? u.uEaseB : u.uEaseA).value = typeof o.ease === "string" ? (EASE[o.ease] != null ? EASE[o.ease] : 1) : o.ease;
    if (o.arc != null) (B ? u.uArcB : u.uArcA).value = o.arc;
    setLook((B ? u.uLookB : u.uLookA).value, o.size, o.alpha);
    if (o.keepVis != null) (B ? u.uKeepB : u.uKeepA).value = o.keepVis ? 1 : 0;
    if (o.scale != null) (B ? u.uScaleB : u.uScaleA).value = o.scale;
    if (o.pivot) { (B ? u.uPivB : u.uPivA).value.set(o.pivot[0], o.pivot[1]); S.pivAuto = false; }
    if (o.offset) (B ? u.uOffB : u.uOffA).value.set(o.offset[0], o.offset[1]);
    return g;
  }
  function bind(ch: "A" | "B", t: Target, applyDefaults = true) {
    if (t.total !== dots.total) { console.warn("[globe] bind: the target was built for another dot count; rebuild it (onRebuild)"); return g; }
    const attr = ch === "B" ? geoB : geoA;
    if (!attr) return g;
    (attr.array as Float32Array).set(t.data); attr.needsUpdate = true;
    if (applyDefaults && t.defaults) configure(ch, t.defaults);
    S.blank = false;
    return g;
  }
  function setProgress(name: "A" | "B" | "draw", p: number) {
    if (name === "A") uniforms.uMorphA.value = p; else if (name === "B") uniforms.uMorphB.value = p; else { uniforms.uDraw.value = p; S.draw = p; introOpt = p; }
    return g;
  }
  function set(o: Partial<Record<UniformName, number | number[] | Record<string, number>>>) {
    for (const k in o) {
      const u = (uniforms as Record<string, { value: unknown }>)[k]; if (!u) { console.warn("[globe] set: no uniform", k); continue; }
      const v = o[k as UniformName];
      if (typeof v === "number") u.value = v;
      else if (Array.isArray(v)) { if (typeof u.value === "object" && u.value) { const t = u.value as Record<string, number>; t.x = v[0]; t.y = v[1]; if (v.length > 2) t.z = v[2]; if (v.length > 3) t.w = v[3]; } }
      else if (v && typeof v === "object") Object.assign(u.value as object, v);
    }
    return g;
  }

  /* ───── interaction: a soft tilt toward the pointer, drag to turn with inertia ───── */
  const inUI = (t: EventTarget | null) => !!(t instanceof Element && t.closest("a, button, input, .nav"));
  const ac = new AbortController(), sig = { signal: ac.signal };
  if (!still && !frozen) {
    host.addEventListener("pointermove", (e) => {
      if (!S.inter) return;
      const r = host.getBoundingClientRect();
      if (S.drag) {
        const dx = e.clientX - S.lx, dy = e.clientY - S.ly, now = performance.now(), dt = Math.max(1, now - S.lt) / 1000, k = 1.1 / S.R;
        S.yaw += dx * k; if (e.pointerType === "mouse") S.pitch = clamp(S.pitch + dy * k * 0.7, -0.5, 1.0);
        S.dragV = S.dragV * 0.6 + (dx * k / dt) * 0.4;
        S.lx = e.clientX; S.ly = e.clientY; S.lt = now;
        return;
      }
      if (e.pointerType === "mouse") { S.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); S.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1); }
    }, sig);
    host.addEventListener("pointerleave", () => { S.tx = 0; S.ty = 0; }, sig);
    host.addEventListener("pointerdown", (e) => {
      if (!S.inter || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0) || inUI(e.target)) return;
      S.drag = true; S.lx = e.clientX; S.ly = e.clientY; S.lt = performance.now(); S.dragV = 0;
      host.classList.add("is-drag");
      try { host.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }, sig);
    const up = (e: PointerEvent) => {
      if (!S.drag) return;
      S.drag = false; host.classList.remove("is-drag");
      S.dragV = clamp(S.dragV, -3, 3);
      try { host.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    host.addEventListener("pointerup", up, sig); host.addEventListener("pointercancel", up, sig);
  }
  function setInteractive(b: boolean) {
    S.inter = !!b;
    if (!b) { S.tx = 0; S.ty = 0; if (S.drag) { S.drag = false; host.classList.remove("is-drag"); } host.classList.remove("is-grab"); }
    host.classList.toggle("is-grab", !!b && !frozen && !still);
    return g;
  }

  /* ───── the frame ───── */
  let raf = 0, last = 0, dead = false;
  function frame(now: number) {
    if (dead) return;
    const t0 = performance.now();
    const dt = clamp((now - last) / 1000, 0.001, 0.1); last = now;
    if (S.t0 < 0) S.t0 = now;
    let k: number;
    if (introOpt === false) k = 1; else if (typeof introOpt === "number") k = introOpt; else k = clamp((now - S.t0) / cfg.drawMs, 0, 1);
    S.k = k; S.draw = 1 - (1 - k) * (1 - k) * (1 - k);                       // soft ease-out
    if (typeof introOpt === "number") { S.draw = introOpt; }
    uniforms.uDraw.value = S.draw;
    if (!frozen) {
      if (!S.drag) {
        if (S.auto) S.yaw += cfg.spin * dt;
        S.yaw += S.dragV * dt; S.dragV *= Math.exp(-dt * 2.3);
        S.pitch += (S.base - S.pitch) * (1 - Math.exp(-dt * 0.8));
      }
      const e = 1 - Math.exp(-dt * 1.6);
      S.px += (S.tx - S.px) * e; S.py += (S.ty - S.py) * e;
    }
    setRot(S.yaw + S.px * cfg.tilt, S.pitch + S.py * cfg.tilt);
    uniforms.uSnap.value = (uniforms.uMorphA.value > 0 || uniforms.uMorphB.value > 0 || uniforms.uZoom.value !== 1 || uniforms.uDisperse.value > 0) ? 0 : 1;
    for (let i = 0; i < cbFrame.length; i++) cbFrame[i](dt, now, S);
    if (!S.paused) {
      if (uniforms.uAlpha.value < 0.002) { if (!S.blank) { render(); S.blank = true; } }       // nothing to see: clear once, then skip the draw call
      else { render(); S.blank = false; }
    }
    // adaptive pixel ratio: a frame budget of ~26 ms steps the ratio down by a quarter, comfortably fast steps it back up (never above the device's)
    S.ema += (dt - S.ema) * 0.05;
    if (++S.nf % 40 === 0 && S.nf > 80) {
      if (S.ema > 0.026 && S.dpr > 1) { S.dpr = Math.max(1, S.dpr - 0.25); S.low++; setPR(); }
      else if (S.ema < 0.0135 && S.dpr < S.cap && S.low < 3) { S.dpr = Math.min(S.cap, S.dpr + 0.25); setPR(); }
    }
    const c = performance.now() - t0;
    stats.cpu += (c - stats.cpu) * 0.08; if (c > stats.max) stats.max = c; stats.frames++;
  }
  const loop = (now: number) => { raf = requestAnimationFrame(loop); frame(now); };
  function setPR() { renderer.setPixelRatio(S.dpr); renderer.setSize(S.W + 2 * bleed, S.H + 2 * bleed, false); uniforms.uPx.value = S.dpr; stats.dpr = S.dpr; }
  const onVis = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf && opts.raf !== false && !still) { last = performance.now(); raf = requestAnimationFrame(loop); }
    else last = performance.now();
  };
  function start() {
    if (still) { uniforms.uDraw.value = 1; S.draw = 1; setRot(S.yaw, S.pitch); render(); return; }
    last = performance.now();
    if (opts.raf !== false) raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVis, sig);
  }

  let roQ = 0;
  const queueResize = () => { cancelAnimationFrame(roQ); roQ = requestAnimationFrame(() => resize()); };
  const ro = new ResizeObserver(queueResize);
  ro.observe(stage);
  window.addEventListener("resize", queueResize, sig);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!dead) queueResize(); });
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), sig);

  /* ───── the public object ───── */
  const g: Globe = {
    canvas, uniforms, S, stats, size, box, dots, cfg, maxPoint, mode,
    set, setProgress, setBox, bind, configure, resize, render, frame, start,
    setInteractive,
    setRotation(auto) { S.auto = !!auto && !frozen; return g; },
    setView(v) { if (v.yaw != null) S.yaw = v.yaw; if (v.pitch != null) { S.pitch = v.pitch; S.base = v.pitch; } return g; },
    view() { return { yaw: S.yaw, pitch: S.pitch }; },
    project(lat, lon, out = {}, zoomed = false) {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180, cl = Math.cos(la);
      const x = Math.sin(lo) * cl, y = Math.sin(la), z = Math.cos(lo) * cl;
      const nx = rot[0] * x + rot[1] * y + rot[2] * z, ny = rot[3] * x + rot[4] * y + rot[5] * z, nz = rot[6] * x + rot[7] * y + rot[8] * z;
      let px = S.cx + nx * S.R, py = S.cy - ny * S.R;
      if (zoomed) { const z0 = uniforms.uZoom.value, c = uniforms.uZoomC.value; px = c.x + (px - c.x) * z0; py = c.y + (py - c.y) * z0; }
      const o = out as { x: number; y: number; z: number };
      o.x = px; o.y = py; o.z = nz; return o;
    },
    onFrame(cb) { cbFrame.push(cb); return () => { const i = cbFrame.indexOf(cb); if (i >= 0) cbFrame.splice(i, 1); }; },
    onResize(cb) { cbResize.push(cb); return () => { const i = cbResize.indexOf(cb); if (i >= 0) cbResize.splice(i, 1); }; },
    onRebuild(cb) { cbRebuild.push(cb); return () => { const i = cbRebuild.indexOf(cb); if (i >= 0) cbRebuild.splice(i, 1); }; },
    stageRect() { return stage.getBoundingClientRect(); },
    pause(b = true) { S.paused = !!b; if (!b) S.blank = false; return g; },
    destroy() {
      if (dead) return;
      dead = true;
      cancelAnimationFrame(raf); raf = 0; ro.disconnect(); cancelAnimationFrame(roQ);
      ac.abort();
      host.classList.remove("is-grab", "is-drag");
      cbFrame.length = cbResize.length = cbRebuild.length = 0;
      points.geometry.dispose(); mat.dispose(); renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* ignore */ }
    },
  };

  /* boot */
  applyTier(matchMedia("(max-width: 760px)").matches ? "m" : "d");
  if (opts.box) setBox(opts.box);
  setRot(S.yaw, S.pitch);
  resize();
  if (introOpt === false) { uniforms.uDraw.value = 1; S.draw = 1; }
  if (typeof introOpt === "number") { uniforms.uDraw.value = introOpt; S.draw = introOpt; }
  setInteractive(true);
  if (opts.autostart !== false) start();
  return g;
}
