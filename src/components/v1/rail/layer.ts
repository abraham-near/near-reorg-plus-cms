/* r17 v1 js/layer.js · the rail of the Figma frames (TJ38G7245lEghviUBaCTFJ, 384:8605 ... 459:4246): a straight green line at 64 % of the stage, the three phrases, the title, four stations that
 * slide along the line; then the straight tide into the Stack.
 *
 * ONE pinned section, ONE scrubbed master timeline (TOTAL units; 0.08 screen a unit on desktop, 0.0622 on phones), a pure function of the playhead: the tweens only move the numbers in `S` and in
 * the items; `apply()` writes everything (DOM masks, the world's translation, the two 2D canvases, the vignettes' set(a)).
 *
 * The device is ONE SOFT EDGE that sweeps across type and line:  entering = dots -> line, left to right (ahead of the edge the dots grow in, behind it they shrink while the type resolves);
 * leaving = line -> dots, right to left, then every dot drifts to the nearest dot of the (undrawn) field and fades on the way. The station text uses the page's staircase (each word rises through its own window).
 *
 * THE WORLD. S.wv (vw) is the world position under the screen centre: a thing at world x is at screen x = 50 vw + (x - wv) vw. The stations, the end labels and the survey hairlines live in the world.
 *
 * Lawrence's rail furniture (StoryRail "horizon"): the node is NEAR's green tile with the official black N (48 px at the meeting point, 32 px at each station), popping in with a back ease; the playhead
 * is a square frame 8 px wider than the station tile, drawn around the first tile as it lands (never empty before it) and fixed at the centre from then on; the line is green up to its green front S.gf
 * (world vw) and grey beyond, the front running ahead to each station with the slide; a fine tick ruler under the line; the viewfinder locks only once the station has landed, and the survey hairlines
 * hide while they pass through the viewfinder or the tile. The resting vignette gets an idle motion (idleLoop).
 * Beats (units; TOTAL = 112.3). THE LINE NEVER LEAVES: green from the approach to the tide, at 64 %; the survey stays on it.
 *   approach  (scrubbed over the section's arrival, 'top bottom' -> 'top top')  the edge crosses the stage once: the phrases, the green line, the end labels, the survey   [384:8605]
 *    0.3 -  2.5  the green node pops at the centre; f1 holds to 9
 *    9   - 13    "AI is the frontend." / "Blockchain is the backend." dissolve (reverse sweep -> dots); the end labels sweep out; the node shrinks away
 *   10.5 - 18    "NEAR is where they connect." moves up and docks at the top left (its own size) (one slot: NEAR is ONE node all along, translated and scaled)
 *   14.5 - 19.6  the problem paragraph climbs in word by word, bottom -> top (the staircase), its illustration (.rs__gate) with it; f05 holds to 26                               [384:9085]
 *   26   - 31    the paragraph dissolves (word by word, last word first, each word -> dots); "is where they connect." too (26.6 - 29.2)
 *   26   - 36    the world slides 50 -> 150 vw;  29.4 - 34.8  NEAR moves (its place by 33.3) and resizes (by 34.8) into "On NEAR, that layer is user-owned."; "On" and the rest sweep in
 *                around it (33.4 - 37.6); the marker wipes (37 - 39.6), the green runs on past the title (37 - 41.5)                                                         [384:9555 / 459:2367]
 *   43.5 - 85    four stations, centred at 49 / 61 / 73 / 85 (the world slides 55 vw in 5.5 units ending there); each: the viewfinder locks on, the green fills the node, the illustration arrives
 *                (set(a) 0 -> 1), "Own your ___." and its sentence climb the staircase; the old one rides the slide out (set(a) 1 -> 2, the words up through their windows)          [459:2850 ...]
 *   92.3 - 95.2  identity leaves as the others do (its words up through their windows, the drawing set(a) 1 -> 2, the viewfinder unlocks); only the line, its ruler and the node remain
 *   95.8 - 106.3 THE TIDE: the cells under the line darken and merge into #262626 from just under the centre (S.tk 95.8 - 104.3), the dark rises from the line as a straight edge
 *                (S.tg 97.3 - 106.3); M.covered -> html[data-ly-dark]; the Stack band rises over the last TR.ov = 12.5 units (from 99.8)
 * Home v5 (.layer[data-beats="split"]): the thesis and the problem are two beats, and 9 - 43.5 run instead as (the rest is the same):
 *    9   - 13.3  lines 1, 2 AND 3 dissolve ("NEAR is where they connect." does not dock: NEAR leaves with its line); the node shrinks away (11 - 12.4)
 *   11   - 20    the world slides 50 -> 150 vw (the problem's place) while the thesis' dots drift off; the line stays ink across (S.ik)
 *   17.5 - 22.6  the problem climbs in; its drawing arrives 18 - 23.4 (S.ga 0 -> 1); holds to 29
 *   29   - 33.8  the paragraph dissolves; 30 - 36 the SAME drawing becomes the user's in place (S.own 0 -> 1: problem.ts own()); the world stays
 *   32.2 - 36.4  "On NEAR, that stack is user-owned, / from inference to settlement." sweeps in (NEAR is part of it); the marker 36 - 38.6; the ink ends at the gate 36 - 40.5
 *   43.8 - 47.2  the drawing rides the world out with the slide to the first station (S.ga 1 -> 2)
 * Home v5 (.layer[data-back="ridges"]): Lawrence's ridges panorama (home v2's "horizon") behind the rail instead of the dot globe: 205 vw wide, its foot on the line,
 *   moving at 0.3x the world's travel; the tide rises over it like everything else. Its look (strength, masks): v5/rail-v5.css */
import type { V1Ctx, Dispose } from "../ctx";
import { sampleText, samplePoly, mulberry32, type Pt, type Org } from "./sample";
import { loadTone, buildField, nearestDot, type Field, type Tone } from "./field";
import { makeLattice, xOf, jRange, type Lattice } from "./planet";
import { createVignette, type Vignette, type VigKey } from "./vig2";
import { mountRailGlobe, type RailGlobe } from "./railglobe";

const WORLD = true;                                   /* the background world behind the top half (rail/railglobe.ts); false turns it off */
const ICON = "/v1/rail/icon.svg";
const RIDGES = "/v1/rail/rail-ridges.webp";           /* the field's source: never drawn, its dots are where the leaving words drift to */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const inOut3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const s01 = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const out3 = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

const RAIL = { title: 150, stations: [235, 290, 345, 400], end: 470 };   /* world positions (vw) (the gate is the title's place) */
const ARR = [49, 61, 73, 85];                                            /* when each station is centred (units) */
const SLIDE = 5.5;                                                       /* the slide between two places (units) */
const TOTAL = 112.3;
const TR = { t0: 95.8, k1: 104.3, g0: 97.3, g1: 106.3, ov: 12.5 };       /* the transition (units); the Stack slides in over the last TR.ov */
const ID_OUT = 92.3;                                                      /* identity starts to leave (its hold: ARR[3] -> here, as the others' rest) */
const RATE = { d: 9 / 112.5, m: 7 / 112.5 };                             /* screens per unit: 8.98 screens on desktop, 6.99 on phones */
const DARK = "#262626", INK = "#1C1917", GREEN = "#00DC8D";
const GREY = "rgba(28,25,23,.34)";                                       /* the line ahead of the green front (the page's --line) */
type Stair = { dw: number; dl: number; dur: number; span: number };
const ST: Stair = { dw: 0.18, dl: 0.42, dur: 1.5, span: 3.6 };           /* the sentence's staircase: per word, per line, one word's rise, the whole (units) */
const STT: Stair = { dw: 0.3, dl: 0, dur: 1.5, span: 2.4 };              /* the station title's ("Own your data.") */
const STP: Stair = { dw: 0.16, dl: 0.55, dur: 1.6, span: 5.1 };          /* the problem paragraph's (bottom -> top, word by word) */
const SCREENS = () => TOTAL * (innerWidth <= 760 ? RATE.m : RATE.d);
const NB = 16;
const FDS = 0.2;
const RU = { step: 12, y0: 4, s: 6, a: 0.2 };                            /* the ruler: one tick every RU.step px of the world, RU.y0 under the line, RU.s long, alpha RU.a */
const IDLE = { wait: 500, up: 0.45, down: 0.15 };

/* the survey hairlines: world positions (vw), every 25 vw away from the busy places */
const HV: number[] = [];
for (let i = 0; i < 19; i++) { const v = i * 25 + 12.5; if ([50, RAIL.title, ...RAIL.stations].every((b) => Math.abs(v - b) > 16)) HV.push(v); }

type Dots = { n: number; hx: Float32Array; hy: Float32Array; rr: Float32Array; dl: Float32Array; ax: Float32Array; tx: Float32Array; ty: Float32Array; tk: Float32Array; tr: Float32Array; ta: Float32Array };
/* an item = one thing that sweeps in / out: a DOM element (masked by --e), a line (drawn on the canvas), or a staircase, plus its dots.
 *   a: 0..1 enters (L -> R)   o: 0..1 leaves (the reverse sweep)   dr: 0..1 its dots drift to the field   ge: it enters with the section's approach (the global edge)   space: 'stage' | 'world' */
type Item = {
  key: string; el: HTMLElement; a: number; o: number; dr: number; ge: boolean; dir: number; space: "stage" | "world";
  W: number; F: number; L: number; x0: number; r0: number; color: 0 | 1; kind: "css" | "line" | "stair"; dots: Dots | null; leaves: boolean; refWv: number;
  _e: number; _open?: boolean | null; _off?: boolean | null; sc?: number; pv?: Pt; msc?: number; kids?: Item[];
  st?: Stair; ws?: HTMLElement[]; si?: HTMLElement[]; Lx?: Int16Array; Jx?: Int16Array; kc?: Int32Array; fs?: number;
};
type Edges = { p: number; tot: number; full: number; es: number };
type Copy = { c: string[]; problem: string; on: string; mid: string; owned: string; tail: string; next: string; list: { key: VigKey; own: string; acc: string; line: string }[] };
type Stage = {
  stage: HTMLElement; cv: HTMLCanvasElement; cv2: HTMLCanvasElement; rail: HTMLElement; world: HTMLElement; track: HTMLElement; ends: HTMLElement[]; arts: HTMLElement[]; vig: Vignette[];
  titles: HTMLElement[]; lines: HTMLElement[]; dots: HTMLElement[]; cl: HTMLElement[]; slot: HTMLElement; ns: HTMLElement; ns2: HTMLElement; rest1: HTMLElement; near: HTMLElement;
  pre: HTMLElement; rest2: HTMLElement; next: HTMLElement | null; gate: HTMLElement; gvig: Vignette | null; problem: HTMLElement; pws: HTMLElement[]; ans: HTMLElement; mk: HTMLElement; fin: HTMLElement;
  point: HTMLElement; play: HTMLElement; playRect: SVGRectElement; ridges: HTMLElement | null; plate: HTMLElement | null;
};
type Rect = { x: number; y: number; w: number; h: number };
type Metrics = {
  org: Org; W: number; H: number; cx: number; vw: number; railY: number; px: (n: number) => number; dk: number; sT: number; nearW: number; dockY: number; P1: [number, number, number]; P2: [number, number, number];
  playHW: number; finHW: number; tall: number; quiet: { x0: number; x1: number; y0: number; y1: number }[]; riseEnd: number; rise: number; Y0: number; pa: number; A: [number, number];
  Dv: number; kx: number; Dmax: number; Wf: number; Xc: number; covered: boolean;
};
type Tl = ReturnType<V1Ctx["gsap"]["timeline"]>;
type Trig = ReturnType<V1Ctx["ScrollTrigger"]["create"]>;

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
const stair = (words: string[]) => words.map((w) => `<span class="sk"><span class="si">${w}</span></span>`).join(" ");
const stairText = (text: string) => stair(text.split(/\s+/).filter(Boolean).map(esc));
const txt = (el: Element | null) => (el?.textContent || "").trim();

function readCopy(sec: HTMLElement): Copy {
  const c = [...sec.querySelectorAll(".rail__s")].map(txt);
  // the answer: "On NEAR" + the rest + the marked phrase (v1: the mark ends it). Optional (v4): text after the mark on the same line (tail), then a second line (.rail__next).
  const ans = sec.querySelector(".rail__answer") as HTMLElement, mkEl = ans.querySelector(".rail__mark"), nextEl = ans.querySelector(".rail__next"), owned = txt(mkEl);
  let pre = "", tail = "";
  for (let nd = ans.firstChild; nd && nd !== mkEl; nd = nd.nextSibling) pre += nd.textContent || "";
  for (let nd = mkEl?.nextSibling ?? null; nd && nd !== nextEl; nd = nd.nextSibling) tail += nd.textContent || "";
  pre = pre.trimStart(); tail = tail.trimEnd();
  const n = pre.indexOf("NEAR");
  const list = [...sec.querySelectorAll<HTMLElement>(".rail__list > li")].map((li) => { const h = li.querySelector("h3") as HTMLElement, acc = txt(h.querySelector(".acc")); return { key: li.dataset.own as VigKey, own: txt(h).slice(0, -acc.length).trim(), acc, line: txt(li.querySelector("p")) }; });
  return { c, problem: txt(sec.querySelector(".rail__problem")), on: pre.slice(0, n), mid: pre.slice(n + 4), owned, tail, next: txt(nextEl), list };
}

/* the fonts must be in before the stage is measured and its glyphs sampled (next/font hashes the family names: read them from the computed style) */
async function loadFonts(sec: HTMLElement) {
  try {
    const fam = getComputedStyle(sec).fontFamily, accEl = sec.querySelector(".acc"), acc = accEl ? getComputedStyle(accEl).fontFamily : null;
    await Promise.all([document.fonts.load(`400 40px ${fam}`), document.fonts.load(`500 14px ${fam}`), acc ? document.fonts.load(`italic 500 40px ${acc}`) : null]);
    await document.fonts.ready;
  } catch { /* fonts fall back */ }
}

/** r17 v1 layer.js mount(ctx): the pinned rail; reduced motion (or a failure) -> the static stacked page */
export async function mountLayer(ctx: V1Ctx): Promise<Dispose | null> {
  const sec = document.querySelector<HTMLElement>(".layer"); if (!sec) return null;
  /* how the tide closes the world into the Stack: "dots" (v1 / v3: the lattice's dots grow and merge) or, without dots (v4's options), "floor" | "frame" | "seam" | "ruler" */
  const EXIT = sec.dataset.exit || "dots";
  /* v4 (.layer[data-line="ink"]): the line and its sweep's dots in ink, not green (no green on the line yet), and the ruler's ticks draw in from both ends
     (the frontend's, the backend's) and meet under the node as the section arrives */
  const INKLINE = sec.dataset.line === "ink", LINE_C = INKLINE ? INK : GREEN;
  const STEPLINE = INKLINE && sec.dataset.steps === "line";   /* v4 "line": the steps in green over a whole ink line, no N tiles */
  const SPLIT = sec.dataset.beats === "split";                 /* v5: the thesis and the problem as two beats; the problem's drawing turns the user's in place (see the header) */
  const PHOTO = sec.dataset.back === "ridges";                 /* v5: the ridges panorama behind the rail instead of the dot globe */
  const html = document.documentElement;
  if (html.hasAttribute("data-rm") || ctx.reduced) return staticPage(sec);
  const { gsap, ScrollTrigger } = ctx;
  const ac = new AbortController(), sig = ac.signal;
  ctx.signal.addEventListener("abort", () => ac.abort(), { once: true, signal: sig });

  /* the animated state (everything the timeline moves that is not an item). gy / gq: the background world's turn and exit (rail/railglobe.ts) */
  /* own: the problem's drawing becomes the user's (v5); ik: how far the ink line reaches (world vw; v5 keeps it across the screen while the world slides to the problem) */
  const S = { enter: 0, wv: 50, pt: 0, dock: 0, nx: 0, mark: 0, finS: 1.14, sd: [0, 0, 0, 0], va: [0, 0, 0, 0], tk: 0, tg: 0, gf: 100, pf: 0, gy: 0, gq: 0, ga: 0, own: 0, ik: SPLIT ? RAIL.end : 0 };
  const M = {} as Metrics;
  let R: Stage | null = null, field: Field | null = null, toneImg: Tone | null = null, P: Lattice | null = null, RGl: RailGlobe | null = null;
  const items: Item[] = [];
  let I!: { c: Item[]; ends: Item[]; tit: Item[]; ln: Item[]; near: Item; rest1: Item; prob: Item; ans: Item; rail1: Item; fin: Item };
  let ctx2!: CanvasRenderingContext2D, ctx3!: CanvasRenderingContext2D, dpr = 1;
  const buckets: number[][][] = [[], []];                     /* [ink, green] x NB alpha levels, each a flat array x,y,r,... */
  for (const b of buckets) for (let i = 0; i < NB; i++) b.push([]);

  /* ───────────────────────────── items ───────────────────────────── */
  function mkItem(def: Partial<Item> & { key: string; el: HTMLElement }): Item {
    const it: Item = Object.assign({ a: 0, o: 0, dr: 0, ge: false, dir: 1, space: "stage" as const, W: 1, F: 40, L: 32, x0: 0, r0: 1.45, color: 0 as const, kind: "css" as const, dots: null, leaves: false, refWv: 50, _e: -1, sc: undefined }, def);
    items.push(it); return it;
  }
  function setDots(it: Item, pts: Pt[], seed = 7) {
    const n = pts.length, rnd = mulberry32(seed + n), F = () => new Float32Array(n);
    const d: Dots = { n, hx: F(), hy: F(), rr: F(), dl: F(), ax: F(), tx: F(), ty: F(), tk: F(), tr: F(), ta: F() };
    for (let i = 0; i < n; i++) { d.hx[i] = pts[i][0]; d.hy[i] = pts[i][1]; d.rr[i] = 0.82 + rnd() * 0.34; d.dl[i] = rnd(); d.ax[i] = (rnd() - 0.5) * 2; }
    it.dots = d;
  }
  /* the field's nearest dot for every dot of a leaving item (layer space), so each dot drifts INTO a dot of the field */
  function retarget(it: Item) {
    const d = it.dots; if (!d || !it.leaves) return;
    const wxRef = -(M.W * (it.refWv - 50)) / 100;
    for (let i = 0; i < d.n; i++) {
      const sx = d.hx[i], sy = d.hy[i], f = field && nearestDot(field, sx, sy, wxRef, 170);
      if (f && field) { const l = field.layers[f.li]; d.tx[i] = l.x[f.i]; d.ty[i] = l.y[f.i]; d.tk[i] = l.k; d.tr[i] = l.r; d.ta[i] = l.a; }
      else { d.tx[i] = sx - 60 - d.dl[i] * 40; d.ty[i] = sy - 36 - d.dl[i] * 30; d.tk[i] = 0; d.tr[i] = 0.8; d.ta[i] = 0; }
    }
  }

  /* ───────────────────────────── the stage (DOM) ───────────────────────────── */
  function buildStage(copy: Copy): Stage {
    const stage = document.createElement("div"); stage.className = "rs"; stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = `${PHOTO ? `<div class="rs__ridges"><i class="rs__plate"></i></div>` : ""}
  <canvas class="rs__cv"></canvas><span class="rs__rail"></span>
  <div class="rs__world" style="width:${RAIL.end}vw">
    <span class="rs__end sw sw-t" style="--x:5vw"><b>AI</b> <em>the frontend</em></span><span class="rs__end rs__end--r sw sw-t" style="--x:95vw"><b>Blockchain</b> <em>the backend</em></span>
    ${copy.list.map((o, i) => `<div class="rs__st" style="--x:${RAIL.stations[i]}vw"><div class="rs__art va" data-art="${o.key}"></div>
      <p class="rs__title">${stair([...o.own.split(/\s+/).map(esc), `<span class="acc">${esc(o.acc)}</span>`])}</p><p class="rs__line">${stairText(o.line)}</p></div>`).join("")}
  </div>
  <div class="rs__conn">
    <p class="cl cl0 sw sw-t">${esc(copy.c[0])}</p><p class="cl cl1 sw sw-t">${esc(copy.c[1])}</p>
    <div class="rs__slot"><p class="cl cl2 sw sw-t"><span class="ns"></span><span class="rest1 sw sw-t">${esc(copy.c[2].slice(copy.c[2].indexOf("NEAR") + 4).trim())}</span></p></div>
  </div>
  <div class="rs__problem"><p>${stairText(copy.problem)}</p></div><div class="rs__gate"></div>
  <p class="rs__ans sw sw-t"><span class="pre">${esc(copy.on)}${SPLIT ? "NEAR" : ""}</span><span class="ns ns2"></span><span class="rest2">${esc(copy.mid)}<span class="rs__mk">${esc(copy.owned)}</span>${esc(copy.tail)}</span>${copy.next ? `<br><span class="rs__next">${esc(copy.next)}</span>` : ""}</p>
  <span class="rs__near sw sw-t">NEAR</span>
  <span class="rs__fin sw"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></span>
  <span class="rs__point"><img src="${ICON}" alt="" width="639" height="639"></span>
  <canvas class="rs__cv2"></canvas>
  <span class="rs__play"><svg viewBox="0 0 40 40"><rect x=".5" y=".5" width="39" height="39" rx="11.5" pathLength="1"/></svg></span>
  <div class="rs__track" style="width:${RAIL.end}vw">${RAIL.stations.map((x) => `<span class="rs__dot" style="--x:${x}vw"><img src="${ICON}" alt="" width="639" height="639"></span>`).join("")}</div>`;
    sec!.appendChild(stage);
    const q = <T extends Element = HTMLElement>(s: string) => stage.querySelector(s) as T, qa = (s: string) => [...stage.querySelectorAll<HTMLElement>(s)];
    const arts = qa(".rs__art"), gate = q(".rs__gate");
    return {
      stage, cv: q<HTMLCanvasElement>(".rs__cv"), cv2: q<HTMLCanvasElement>(".rs__cv2"), rail: q(".rs__rail"), world: q(".rs__world"), track: q(".rs__track"), ends: qa(".rs__end"),
      arts, vig: arts.map((h, i) => createVignette(copy.list[i].key, h)), titles: qa(".rs__title"), lines: qa(".rs__line"), dots: qa(".rs__dot"),
      cl: qa(".rs__conn .cl"), slot: q(".rs__slot"), ns: q(".ns"), ns2: q(".ns2"), rest1: q(".rest1"), near: q(".rs__near"), pre: q(".pre"), rest2: q(".rest2"), next: stage.querySelector<HTMLElement>(".rs__next"),
      gate, gvig: createVignette("problem", gate), problem: q(".rs__problem"), pws: qa(".rs__problem .si"), ans: q(".rs__ans"), mk: q(".rs__mk"), fin: q(".rs__fin"), point: q(".rs__point"),
      play: q(".rs__play"), playRect: q<SVGRectElement>(".rs__play rect"), ridges: stage.querySelector<HTMLElement>(".rs__ridges"), plate: stage.querySelector<HTMLElement>(".rs__plate"),
    };
  }

  /* ───────────────────────────── measuring + dots ───────────────────────────── */
  const cssNum = (el: Element, name: string, def: number) => { const v = parseFloat(getComputedStyle(el).getPropertyValue(name)); return Number.isFinite(v) ? v : def; };
  const fD = (dy: number) => (dy <= M.Dv ? dy : M.Dv + (dy - M.Dv) * FDS);
  function layout() {
    if (!R) return;
    const stage = R.stage, org = stage.getBoundingClientRect();
    M.org = { left: org.left, top: org.top }; M.W = org.width; M.H = org.height; M.cx = M.W / 2; M.vw = M.W / 100;
    M.railY = R.rail.getBoundingClientRect().top - org.top;
    /* the title clears Lawrence's bar (bottom 80 px) by 16 px, and the viewfinder clears the title's marker by 20 px (short viewports: the title is nudged down, the art and its
       brackets shrink: --art-cap). Measured on the title's marker (.rs__mk::before: .08em under the span's top, .04em over its bottom) */
    { R.ans.style.top = ""; R.stage.style.removeProperty("--art-cap");
      const f = parseFloat(getComputedStyle(R.ans).fontSize), mkR = () => { const r = R!.mk.getBoundingClientRect(); return [r.top - org.top + 0.08 * f, r.bottom - org.top + 0.04 * f]; };
      let mk = mkR(); if (mk[0] < 96) { R.ans.style.top = (parseFloat(getComputedStyle(R.ans).top) + 96 - mk[0]).toFixed(1) + "px"; mk = mkR(); }
      // a second line (v4's .rs__next) sits under the marker: the viewfinder clears that instead
      const low = R.next ? Math.max(mk[1], R.next.getBoundingClientRect().bottom - org.top + 0.04 * f) : mk[1];
      R.stage.style.setProperty("--art-cap", Math.max(140, M.railY - 12 - 44 - (low + 20)).toFixed(0) + "px"); }
    const save = { finS: S.finS }; S.finS = 1; R.fin.style.transform = "none";
    const mobile = M.W <= 760;
    M.px = (n) => n * M.vw;
    const rect = (el: Element): Rect => { const r = el.getBoundingClientRect(); return { x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height }; };
    const textPitch = (el: Element) => Math.max(3.1, parseFloat(getComputedStyle(el).fontSize) * 0.058);
    const dotText = (el: Element) => sampleText(el, textPitch(el), M.org);
    const fOf = (w: number, lo = 36, hi = 150, k = 0.3) => clamp(w * k, lo, hi);
    const fs = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
    /* NEAR: ONE node (font size --cs) over the spacer at the start of line 3; the slot (line 3) docks at the top left; NEAR follows it, then moves and resizes onto the spacer
       after "On " in the title. Poses (offsets from its natural place + scale; origin top left): P0 = (0, 0, 1), P1 = the docked spacer, P2 = the title's spacer */
    R.slot.style.transform = "none"; R.near.style.transform = "none";
    { const sp = document.createElement("span"); sp.style.cssText = "position:absolute;visibility:hidden;white-space:pre"; sp.textContent = " "; R.cl[2].appendChild(sp); const spW = sp.getBoundingClientRect().width; sp.remove();
      R.ns.style.width = ""; const nc = getComputedStyle(R.near), nW = R.near.getBoundingClientRect().width - (parseFloat(nc.paddingLeft) + parseFloat(nc.paddingRight));
      const csPx = fs(R.near); M.sT = fs(R.ans) / csPx; M.dk = 1;   /* line 3 only moves to the top */
      R.ns.style.width = (nW + spW).toFixed(2) + "px"; R.ns2.style.width = SPLIT ? "0px" : (nW * M.sT).toFixed(2) + "px"; M.nearW = nW; }
    const ns = rect(R.ns), cr = rect(R.near.offsetParent as Element);
    R.near.style.left = (ns.x - cr.x).toFixed(2) + "px"; R.near.style.top = (ns.y - cr.y).toFixed(2) + "px";
    const slot = rect(R.slot), ns2 = rect(R.ns2);
    M.dockY = Math.max(M.H * cssNum(R.stage, "--dock-y", 0.118), 92) - slot.y;          /* the docked line keeps clear of Lawrence's bar (80 px) */
    M.P1 = [(ns.x - slot.x) * (M.dk - 1), M.dockY + (ns.y - slot.y) * (M.dk - 1), M.dk];
    M.P2 = [ns2.x - ns.x, ns2.y - ns.y, M.sT];
    /* the phrases: lines 1 and 2 enter with the approach and leave with their own edge; line 3 enters with it (its mask: the slot's line; NEAR's own) */
    [I.c[0], I.c[1]].forEach((it, i) => { const el = R!.cl[i], r = rect(el); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w); it.L = it.F * 0.8; setDots(it, dotText(el), 3 + i); });
    { const it = I.c[2], r = rect(R.cl[2]); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w); it.L = it.F * 0.8; setDots(it, dotText(R.rest1), 5); }
    { const it = I.near, r = rect(R.near); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w, 30, 70, 0.55); it.L = it.F * 0.8; setDots(it, dotText(R.near), 6); }
    /* "is where they connect." leaves from the docked pose (its dots sampled there; its mask is in the slot's own, scaled px) */
    if (!SPLIT) R.slot.style.transform = `translate3d(0,${M.dockY.toFixed(2)}px,0) scale(${M.dk})`;   /* v5: it leaves from where it stands (no dock) */
    { const it = I.rest1, r = rect(R.rest1); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w, 30, 90); it.L = it.F * 0.8; it.msc = M.dk; setDots(it, sampleText(R.rest1, textPitch(R.rest1) * M.dk, M.org, M.dk), 7); it.refWv = 60; }
    R.slot.style.transform = "none";
    /* the problem: a staircase in; out word by word, each word an item of its own (mask + dots that drift away) */
    measureStair(I.prob, R.problem.querySelectorAll<HTMLElement>(".sk"), STP);
    I.prob.kids!.forEach((k, i) => { const r = rect(k.el); k.x0 = r.x; k.W = r.w; k.F = clamp(r.w * 0.5, 14, 44); k.L = k.F * 0.8; setDots(k, dotText(k.el), 60 + i); });
    /* the title (NEAR is not part of it: its dots are "On" and ", that layer is user-owned.") */
    { const it = I.ans, r = rect(R.ans); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w, 40, 140); it.L = it.F * 0.8; setDots(it, dotText(R.pre).concat(dotText(R.rest2), R.next ? dotText(R.next) : []), 9); }
    /* the line: it enters with the approach and never leaves (green, across the stage; its dots green while it sweeps in) */
    { const it = I.rail1; it.x0 = 0; it.W = M.W; it.F = 150; it.L = 120; setDots(it, samplePoly([[0, M.railY], [M.W, M.railY]], 9), 11); it.r0 = 1.3; }
    /* the end labels (world items; at wv = 50 the world is in stage coordinates) */
    R.ends.forEach((el, i) => { const it = I.ends[i], r = rect(el); it.x0 = r.x; it.W = r.w; it.F = fOf(r.w, 30, 70, 0.5); it.L = it.F * 0.8; it.dots = null; });
    /* the viewfinder (four corners of dots); its half width and the frame's, for the survey's clearance */
    M.playHW = R.play.offsetWidth / 2;
    { const it = I.fin, r = rect(R.fin), leg = 16, x = r.x, y = r.y, w = r.w, h = r.h; M.finHW = w / 2;
      it.x0 = x; it.W = w; it.F = 70; it.L = 50; it.pv = [x + w / 2, y + h / 2];
      const c: Pt[][] = [[[x, y + leg], [x, y], [x + leg, y]], [[x + w - leg, y], [x + w, y], [x + w, y + leg]], [[x, y + h - leg], [x, y + h], [x + leg, y + h]], [[x + w - leg, y + h], [x + w, y + h], [x + w, y + h - leg]]];
      setDots(it, c.flatMap((p) => samplePoly(p, 5)), 22); it.r0 = 1.3; }
    /* the stations' words */
    for (let i = 0; i < 4; i++) { measureStair(I.tit[i], R.titles[i].querySelectorAll<HTMLElement>(".sk"), STT); measureStair(I.ln[i], R.lines[i].querySelectorAll<HTMLElement>(".sk"), ST); }
    /* the survey hairlines' height */
    M.tall = M.H * 0.26;
    /* the field (budget 8200 dots, the travel of the whole rail) */
    field = toneImg ? buildField(toneImg, { W: M.W, H: M.H, railY: M.railY, travel: M.px(RAIL.stations[3] - 50), budget: 8200 }) : null;
    /* quiet zones: the field dims under the phrases and the title */
    { const a = R.cl.map(rect), x1 = Math.max(...a.map((r) => r.x + r.w)), t = rect(R.ans), pb = rect(R.problem);
      M.quiet = [{ x0: a[0].x - 24, x1: x1 + 24, y0: a[0].y - 12, y1: a[2].y + a[2].h + 12 }, { x0: t.x - 24, x1: t.x + t.w + 24, y0: t.y - 14, y1: t.y + t.h + 14 }, { x0: pb.x - 24, x1: pb.x + pb.w + 24, y0: pb.y - 12, y1: pb.y + pb.h + 12 }]; }
    items.forEach(retarget); I.prob.kids!.forEach(retarget);
    /* the tide: the dark rises until the line has left the top (riseEnd px); the dark front spreads from just under the screen centre (A) outwards as a flat ellipse; below the resting screen
       (depth > Dv) depth counts a fifth (fD); Dmax: the farthest cell still in view when the tide is 3/4 up, so the screen is merged by then */
    const pa = mobile ? 7 : clamp(M.W / 200, 6, 8);
    M.riseEnd = M.railY + 46; M.rise = 0; M.Y0 = M.railY; M.pa = pa;
    M.A = [M.cx, M.railY + 20]; M.Dv = M.H - M.A[1] + 10;
    M.kx = clamp((M.Dv / (M.W / 2)) * 1.15, 0.45, 1);
    M.Dmax = Math.max(Math.hypot((M.W / 2 + 10) * M.kx, M.Dv) * 1.02, Math.hypot((M.W / 2 + 10) * M.kx, fD(M.H + 0.75 * M.riseEnd - M.A[1])) * 1.08); M.Wf = M.Dmax * 0.45;
    P = makeLattice({ W: M.W, H: M.H, cx: M.cx, lineY: M.railY, pa, extra: M.riseEnd });
    /* canvases */
    dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const cv of [R.cv, R.cv2]) { cv.width = Math.round(M.W * dpr); cv.height = Math.round(M.H * dpr); }
    ctx2 = R.cv.getContext("2d") as CanvasRenderingContext2D; ctx3 = R.cv2.getContext("2d") as CanvasRenderingContext2D;
    S.finS = save.finS;
    [...items, ...I.prob.kids!].forEach((it) => { it._e = -1; it._open = null; it._off = null; if (it.kc) it.kc.fill(-1); });
    last = {};
  }
  /* a staircase: one window per word; its line (L) and its place on it (J) give the delay */
  function measureStair(it: Item, spans: NodeListOf<HTMLElement>, st: Stair) {
    it.st = st; it.ws = [...spans]; it.si = it.ws.map((s) => s.firstElementChild as HTMLElement); const n = it.ws.length;
    it.Lx = new Int16Array(n); it.Jx = new Int16Array(n); it.kc = new Int32Array(n).fill(-1);
    let line = -1, lastTop = -1e9, j = 0;
    it.ws.forEach((s, k) => { const top = s.getBoundingClientRect().top; if (top - lastTop > 3) { line++; j = 0; lastTop = top; } it.Lx![k] = line; it.Jx![k] = j++; });
    let mx = 0; for (let k = 0; k < n; k++) mx = Math.max(mx, it.Lx[k] * st.dl + it.Jx[k] * st.dw);
    it.fs = Math.min(1, (st.span - st.dur) / Math.max(mx, 1e-3)); it.kind = "stair";
  }

  function makeItems() {
    const r = R!;
    const c = r.cl.map((el, i) => mkItem({ key: "c" + i, el, ge: true, r0: 1.55, leaves: i < 2 }));
    const near = mkItem({ key: "near", el: r.near, ge: true, r0: 1.55, leaves: SPLIT });   /* v5: NEAR leaves with its line (the answer has its own) */
    const rest1 = mkItem({ key: "rest1", el: r.rest1, a: 1, r0: 1.3, leaves: true });          /* open from the start (line 3's own mask brings it in); it leaves from the docked pose */
    const prob = mkItem({ key: "prob", el: r.problem, kind: "stair" });
    prob.kids = r.pws.map((el, i): Item => ({ key: "pw" + i, el, a: 1, o: 0, dr: 0, ge: false, dir: 1, space: "stage", W: 1, F: 30, L: 24, x0: 0, r0: 1.3, color: 0, kind: "css", dots: null, leaves: true, refWv: 62, _e: -1 }));
    const ans = mkItem({ key: "ans", el: r.ans, r0: 1.4 });
    const rail1 = mkItem({ key: "rail1", el: r.rail, ge: true, kind: "line", color: 1 });
    const ends = r.ends.map((el, i) => mkItem({ key: "end" + i, el, ge: true, space: "world" }));
    const fin = mkItem({ key: "fin", el: r.fin, pv: [0, 0] });
    const tit: Item[] = [], ln: Item[] = [];
    for (let i = 0; i < 4; i++) { tit.push(mkItem({ key: "tit" + i, el: r.titles[i], kind: "stair" })); ln.push(mkItem({ key: "ln" + i, el: r.lines[i], kind: "stair" })); }
    I = { c, ends, tit, ln, near, rest1, prob, ans, rail1, fin };
  }

  /* ───────────────────────────── apply: S + items -> the page ───────────────────────────── */
  let last: Record<string, unknown> = {}, EG = 0;
  const setC = (el: HTMLElement, k: string, v: string) => { el.style.setProperty(k, v); };
  const put = (key: string, el: HTMLElement, v: string) => { if (last[key] !== v) { last[key] = v; el.style.transform = v; } };

  function edges(it: Item): Edges {
    const tot = it.W + it.F + it.L, full = it.W + it.F;
    const p = it.ge ? (S.enter >= 1 ? tot + 1 : EG - it.x0) : it.a * tot;
    const esIn = clamp(p - it.L, 0, full), esOut = full * (1 - it.o);
    return { p, tot, full, es: Math.min(esIn, esOut) };
  }
  /* how much of a line item is resolved at stage x (res) and how far its lead band of dots has come (lead) */
  function cov(it: Item, ed: Edges, x: number): [number, number] {
    const u = x - it.x0;
    return [ed.es >= ed.full - 0.5 ? 1 : clamp((ed.es - u) / it.F, 0, 1), ed.p >= ed.tot ? 1 : s01((ed.p - u) / it.L)];
  }
  function maskCss(it: Item, es: number, full: number) {
    const el = it.el, open = es >= full - 0.5, off = es <= 0.5;
    if (it._open !== open) { it._open = open; el.classList.toggle("is-open", open); }
    if (it._off !== off) { it._off = off; el.classList.toggle("is-off", off); }
    if (!open && !off) { const k = it.msc || 1, v = Math.round((es / k) * 2) / 2; if (it._e !== v) { it._e = v; setC(el, "--e", v + "px"); setC(el, "--f", (it.F / k).toFixed(1) + "px"); } }
  }
  function renderItem(it: Item, wx: number) {
    if (it.kids) {                                       /* the problem: out word by word, the last word first (each: reverse sweep, then its dots drift away) */
      const ks = it.kids, n = ks.length, ov = 0.4;
      for (let i = 0; i < n; i++) { const k = ks[i], r = (n - 1 - i) / n; k.o = clamp((it.o - r * (1 - ov)) / ov, 0, 1); k.dr = clamp((it.dr - r * 0.45) / 0.55, 0, 1); renderItem(k, wx); }
      const o = it.o; it.o = 0; renderStair(it); it.o = o;   /* the staircase only brings the words in */
      return;
    }
    if (it.kind === "stair") return renderStair(it);
    const ed = edges(it);
    if (it.kind !== "line") maskCss(it, ed.es, ed.full);
    if (it.dots) drawDots(it, ed, wx);
  }
  /* the staircase: each word rises through the window of its line, from below (translateY 105 % -> 0, power3.out, fading in); the delay grows along the line and from line to line.
     Leaving: the same order, up through the top of the window */
  function renderStair(it: Item) {
    const si = it.si!, Lx = it.Lx!, Jx = it.Jx!, kc = it.kc!, st = it.st!, fsc = it.fs!, n = si.length, T = it.a * st.span, To = it.o * st.span;
    for (let i = 0; i < n; i++) {
      const dly = (Lx[i] * st.dl + Jx[i] * st.dw) * fsc;
      const ai = clamp((T - dly) / st.dur, 0, 1), oi = clamp((To - dly * 0.7) / (st.dur * 0.8), 0, 1);
      const key = Math.round(ai * 240) * 1000 + Math.round(oi * 240);
      if (kc[i] === key) continue; kc[i] = key;
      const el = si[i];
      if (ai >= 1 && oi <= 0) { el.style.transform = ""; el.style.opacity = ""; el.style.visibility = ""; continue; }
      if (ai <= 0 || oi >= 1) { el.style.visibility = "hidden"; continue; }
      const y = (1 - out3(ai)) * 105 - oi * oi * 105, op = s01(ai * 1.5) * (1 - s01(oi * 1.6));
      el.style.visibility = ""; el.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`; el.style.opacity = op.toFixed(3);
    }
  }

  function pushDot(col: number, a: number, x: number, y: number, r: number) { if (a < 0.03) return; const q = Math.min(NB - 1, Math.round(a * (NB - 1))); if (q < 1) return; buckets[col][q].push(x, y, r); }
  const edgeFade = (x: number) => { const e = M.W * 0.09; return x < e ? s01(x / e) : x > M.W - e ? s01((M.W - x) / e) : 1; };
  function drawDots(it: Item, ed: Edges, wx: number) {
    const d = it.dots; if (!d || !d.n || it.dr >= 1) return;
    const { p, tot, es } = ed, W = it.W, F = it.F, L = it.L, dir = it.dir, sx = it.space === "world" ? wx : 0;
    const done = p >= tot && es >= W + F - 0.5;
    if (done && it.dr === 0) return;
    if (p <= 0 && it.dr === 0) return;
    if (it.o === 0 && p <= -L) return;
    const drift = it.dr > 0, col = it.color, sc = it.sc, pv = it.pv;
    for (let i = 0; i < d.n; i++) {
      const u = dir > 0 ? d.hx[i] - it.x0 : it.x0 + W - d.hx[i];
      const lead = p >= tot ? 1 : s01((p - u) / L), m = clamp((es - u) / F, 0, 1), k = 1 - sstep(0.18, 0.85, m);
      const vis = lead * k; if (vis < 0.02 && !drift) continue;
      let hx = d.hx[i], hy = d.hy[i];
      if (sc !== undefined && pv) { hx = pv[0] + (hx - pv[0]) * sc; hy = pv[1] + (hy - pv[1]) * sc; }
      const rr = d.rr[i];
      if (!drift) {
        const x = hx + sx - (1 - lead) * dir * (14 + 10 * rr), y = hy + (d.dl[i] - 0.5) * (1 - lead) * 9, r = it.r0 * rr * (0.4 + 0.6 * lead) * k;
        pushDot(col, lead * (0.35 + 0.65 * k), x, y, r);
      } else {
        const delay = 0.42 * (1 - clamp(u / W, 0, 1)) + 0.08 * d.dl[i], e = inOut3(clamp((it.dr - delay) / 0.5, 0, 1));
        if (e >= 0.999) continue;
        const x0 = hx + sx, x1 = d.tx[i] + d.tk[i] * wx, bump = Math.sin(Math.PI * e) * d.ax[i] * 26;
        const x = lerp(x0, x1, e) + bump * 0.6, y = lerp(hy, d.ty[i], e) - Math.abs(bump) * 0.7;
        const aEnd = 0, r = lerp(it.r0 * rr, d.tr[i], e);   /* the field is not drawn: the drifting dots fade out on the way */
        /* a green dot of the line fades to ink as it drifts */
        if (col === 1 && e > 0.5) pushDot(0, lerp(1, aEnd, e) * s01((e - 0.5) / 0.3), x, y, r);
        pushDot(col, lerp(1, aEnd, e) * (col === 1 ? 1 - s01((e - 0.5) / 0.3) : 1), x, y, r);
      }
    }
  }

  /* the survey: a vertical hairline with a node on the line, every 25 vw of the world; it resolves where the line is resolved (a dotted ghost ahead of the line's edge in the approach) */
  function drawSurvey() {
    const c = ctx2, Wd = M.W, Y0 = M.Y0, r1 = I.rail1, e1 = edges(r1);
    for (const xv of HV) {
      const X = M.cx + (xv - S.wv) * M.vw; if (X < -24 || X > Wd + 24) continue;
      /* clear of the viewfinder while it shows, and of the tile and its frame at the centre */
      const dx = Math.abs(X - M.cx), hide = Math.max(I.fin.a * (1 - s01((dx - M.finHW - 6) / 36)), 1 - s01((dx - M.playHW - 4) / 28));
      const zone = s01((X - Wd * 0.05) / (Wd * 0.13)) * s01((Wd * 0.95 - X) / (Wd * 0.13)) * (1 - hide);
      const [q1, l1] = cov(r1, e1, X), res = zone * q1, vis = (1 - q1) * l1 * (1 - hide);
      const bx = Math.round(X) + 0.5, ty = Y0 - M.tall;
      if (res > 0.02) {
        const g = c.createLinearGradient(bx, Y0, bx, ty); g.addColorStop(0, "rgba(28,25,23,.34)"); g.addColorStop(0.3, "rgba(28,25,23,.34)"); g.addColorStop(1, "rgba(28,25,23,0)");
        c.globalAlpha = res; c.strokeStyle = g; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, Y0); c.lineTo(bx, ty); c.stroke();
        c.beginPath(); c.arc(bx, Y0, 2.6, 0, 6.2832); c.fillStyle = "#F5F5F5"; c.fill(); c.strokeStyle = "rgba(28,25,23,.6)"; c.stroke(); c.globalAlpha = 1;
      }
      if (vis >= 0.04) { const ef = edgeFade(X), n = Math.round(M.tall / 8); for (let k = 0; k <= n; k++) { const t = k / n; pushDot(0, vis * ef * s01(t / 0.7) * 0.42, X, Y0 - M.tall * (1 - t), 1.05); } }
    }
  }
  function flush() {
    const c = ctx2;
    for (let col = 0; col < 2; col++) {
      c.fillStyle = col ? LINE_C : INK;
      for (let q = 1; q < NB; q++) {
        const b = buckets[col][q], n = b.length; if (!n) continue;
        c.globalAlpha = q / (NB - 1); c.beginPath();
        for (let j = 0; j < n; j += 3) { const r = b[j + 2]; c.moveTo(b[j] + r, b[j + 1]); c.arc(b[j], b[j + 1], r, 0, 6.2832); }
        c.fill(); b.length = 0;
      }
    }
    c.globalAlpha = 1;
  }

  /* ───────────── the line (on the cover canvas, above the text, so that the rising tide carries it over the content) ───────────── */
  const PXs = new Float32Array(400), PYs = new Float32Array(400), ALs = new Float32Array(400);
  /* a polyline whose alpha varies per vertex (quantised to 16 steps): consecutive segments of one step are stroked together */
  function strokeLine(c: CanvasRenderingContext2D, n: number, color: string, lw: number) {
    c.strokeStyle = color; c.lineWidth = lw; c.lineCap = "butt";
    let qs = -1;
    for (let i = 0; i < n - 1; i++) {
      const q = Math.round(((ALs[i] + ALs[i + 1]) * 0.5) * 15);
      if (q !== qs) { if (qs > 0) { c.globalAlpha = qs / 15; c.stroke(); } qs = q; c.beginPath(); c.moveTo(PXs[i], PYs[i]); }
      if (q > 0) c.lineTo(PXs[i + 1], PYs[i + 1]);
    }
    if (qs > 0) { c.globalAlpha = qs / 15; c.stroke(); }
    c.globalAlpha = 1;
  }
  /* the ruler (Lawrence's scale): fine ink ticks 4 px under the line, one every RU.step px of the WORLD (they slide with it), all the same; drawn in with the line (its sweep), gone with it
     in the tide (they fade as the dark front starts and rise with the line). Clear of the end labels and of the station text */
  const TBs: number[][] = Array.from({ length: 16 }, () => []);
  /* ink line: how far in from each end the line and its ticks have drawn (both fronts meet under the node at the end of the arrival) */
  const inkReach = () => (INKLINE ? (M.W / 2 + 8) * inOut3(clamp(S.enter / 0.92, 0, 1)) : 0);
  function drawRuler(c: CanvasRenderingContext2D, it: Item, ed: Edges) {
    const fade = 1 - s01(S.tk * 4); if (fade < 0.01) return;
    const { cx, Xc, Y0 } = M, k0 = Math.ceil((Xc - cx - 2) / RU.step), k1 = Math.floor((Xc + cx + 2) / RU.step), y = Math.round(Y0) + RU.y0;
    /* ink line: the ticks come in from both ends with the arrival (S.enter), the two fronts meeting under the node; a few ticks at each front stand taller and darker */
    const reach = inkReach(), FR = 54;
    const front: number[] = [];
    for (let k = k0; k <= k1; k++) {
      const x = Math.round(cx + k * RU.step - Xc) + 0.5;
      let q: number;
      if (INKLINE) {
        const fromEnd = Math.min(x, M.W - x), ahead = reach - fromEnd; if (ahead <= 0) continue;
        q = 15; if (S.enter < 0.999 && ahead < FR) front.push(x, 1 - ahead / FR);
      } else { q = Math.round(cov(it, ed, x)[0] * 15); if (q < 1) continue; }
      TBs[q].push(x);
    }
    c.strokeStyle = INK; c.lineWidth = 1;
    for (let j = 0; j < front.length; j += 2) { const f = front[j + 1]; c.globalAlpha = (0.2 + 0.55 * f) * fade; c.beginPath(); c.moveTo(front[j], y); c.lineTo(front[j], y + RU.s + 8 * f); c.stroke(); }
    for (let q = 1; q < 16; q++) {
      const b = TBs[q]; if (!b.length) continue;
      c.globalAlpha = (q / 15) * RU.a * fade; c.beginPath(); for (let j = 0; j < b.length; j++) { c.moveTo(b[j], y); c.lineTo(b[j], y + RU.s); } c.stroke(); b.length = 0;
    }
    c.globalAlpha = 1;
  }
  /* one run of the line from x0 to x1 (stage px), its alpha where the line has resolved */
  function lineRun(c: CanvasRenderingContext2D, it: Item, ed: Edges, x0: number, x1: number, y: number, color: string, lw: number) {
    if (x1 - x0 < 0.5) return;
    const N = clamp(Math.ceil((x1 - x0) / 12), 2, 380);
    const reach = inkReach();
    for (let i = 0; i <= N; i++) { const x = x0 + ((x1 - x0) * i) / N; PXs[i] = x; PYs[i] = y; ALs[i] = INKLINE ? (Math.min(x, M.W - x) <= reach ? 1 : 0) : cov(it, ed, x)[0]; }
    strokeLine(c, N + 1, color, lw);
  }
  /* the line: green up to the green front (S.gf, world vw), grey beyond it (Lawrence's: the green runs ahead to each station) */
  function drawLine(c: CanvasRenderingContext2D) {
    const { W: Wd, Y0 } = M; if (Y0 < -12) return;
    const y = Math.round(Y0) + 0.25;
    const it = I.rail1, ed = edges(it); if (ed.es <= 0.5) return;
    drawRuler(c, it, ed);
    const xf = clamp(M.cx + (S.gf - S.wv) * M.vw, 0, Wd);
    if (!INKLINE) {
      lineRun(c, it, ed, xf, Wd, Math.round(Y0) + 0.5, GREY, 1);
      lineRun(c, it, ed, 0, xf, y, LINE_C, 1.5);
      return;
    }
    if (STEPLINE) {
      /* v4 "line": a whole ink line; the green runs over it across the screen with the steps' progress (a quarter per station, it moves as the world slides) */
      lineRun(c, it, ed, 0, Wd, y, INK, 1.5);
      const p = stepP(), xp = p * Wd, yy = Math.round(Y0);
      if (xp > 0.5) lineRun(c, it, ed, 0, xp, yy, GREEN, 2);
      return;
    }
    /* ink line (v4): ink up to the steps' start (the title's run ends at RAIL.title + 20), then the steps in green: the line turns green behind the front as it
       runs station to station, grey ahead, and the track ends at the last station (before the Stack) */
    const sx = (v: number) => M.cx + (v - S.wv) * M.vw, xs = sx(RAIL.title + 20), xEnd = Math.min(Wd, sx(RAIL.stations[3]));
    const xa = clamp(xs, 0, xf), xg = Math.min(xf, xEnd);
    /* v5: the ink reaches S.ik (across the screen until the answer, then back to the gate), the grey of the steps ahead only beyond it */
    const xi = SPLIT ? Math.max(xa, clamp(sx(S.ik), 0, Wd)) : xa, xq = Math.max(xf, xi);
    if (xEnd > xq) lineRun(c, it, ed, xq, xEnd, Math.round(Y0) + 0.5, GREY, 1);
    lineRun(c, it, ed, 0, xi, y, INK, 1.5);
    if (xg > xa) lineRun(c, it, ed, xa, xg, Math.round(Y0), GREEN, 2);
    drawSteps(c, Wd, xs, xf, Math.round(Y0));
  }
  /* the steps' marks on the line (v4): a green square where the steps start, a small open square at each station still ahead (the station's tile covers it
     when the front arrives and it pops) */
  function drawSteps(c: CanvasRenderingContext2D, Wd: number, xs: number, xf: number, y: number) {
    const reach = inkReach(), seen = (x: number) => x > -8 && x < Wd + 8 && Math.min(x, M.W - x) <= reach;
    c.save();
    if (xf >= xs - 0.5 && seen(xs)) { c.fillStyle = GREEN; c.fillRect(Math.round(xs) - 4, y - 4, 8, 8); }
    c.strokeStyle = GREY; c.fillStyle = "#F5F4F1"; c.lineWidth = 1;
    for (const v of RAIL.stations) {
      const x = sx0(v); if (S.gf >= v - 0.5 || !seen(x)) continue;
      const r = Math.round(x) - 3.5; c.fillRect(r, y - 3.5, 7, 7); c.strokeRect(r, y - 3.5, 7, 7);
    }
    c.restore();
  }
  const sx0 = (v: number) => M.cx + (v - S.wv) * M.vw;
  /* the steps' progress (0 -> 1) from where the world stands: the title = 0, each station a quarter more, the last = 1 */
  function stepP() {
    const k = [RAIL.title, ...RAIL.stations], n = RAIL.stations.length;
    if (S.wv <= k[0]) return 0;
    for (let i = 1; i < k.length; i++) if (S.wv <= k[i]) return (i - 1 + (S.wv - k[i - 1]) / (k[i] - k[i - 1])) / n;
    return 1;
  }


  /* ───────────────────────────── the tide: the cells under the line darken and merge into the Stack's ground, then the dark rises, on the cover canvas ─────────────────────────────
     Every cell of the lattice under the line is a dark dot in waiting. A cell at distance d from A (just under the screen centre; the depth counts only down to Dv, the bottom of the resting screen) has
     progress p = clamp((F - d) / Wf), F = tk (Dmax + Wf): the front spreads outward from A. p 0 -> .5 the dot gains alpha, p .1 -> .9 it grows from a fine dot to a radius that overlaps its neighbours;
     the merged part (nearer than F - Wf) is ONE flat fill (no gradient, no blur). All of it is lifted by the tide (M.rise) and clipped below the line (y > Y0): the straight edge of the dark. */
  const CB: number[][] = Array.from({ length: 9 }, () => []);
  function drawCover() {
    const c = ctx3, { W: Wd, H, Y0, rise } = M; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, Wd, H);
    const full = S.tk >= 1 && Y0 < -6;
    M.covered = full;
    if (S.tk > 0) {
      if (full) { c.fillStyle = DARK; c.fillRect(-1, -1, Wd + 2, H + 2); return; }
      const F = S.tk * (M.Dmax + M.Wf), rho = F - M.Wf, Ax = M.A[0], Ay = M.A[1] - rise, Dv = M.Dv;
      if (EXIT !== "dots") { c.save(); c.fillStyle = DARK; drawExit(c, Wd, H, Y0); c.restore(); drawLine(c); return; }
      c.save(); c.beginPath(); c.rect(-2, Y0, Wd + 4, H - Y0 + 4); c.clip();
      c.fillStyle = DARK;
      if (rho > 0) {
        const rr = rho + M.pa * 1.6;
        c.beginPath(); c.ellipse(Ax, Ay, rr / M.kx, rr, 0, 0, 6.2832); c.fill();
        if (rr > Dv && Ay + Dv < H + 4) {
          c.save(); c.beginPath(); c.rect(-2, Ay + Dv, Wd + 4, H + 4 - Ay - Dv); c.clip();
          c.beginPath(); c.ellipse(Ax, Ay + Dv - Dv / FDS, rr / M.kx, rr / FDS, 0, 0, 6.2832); c.fill(); c.restore();
        }
      }
      if (F > 0 && P) {
        const m = 14, rf = M.pa * 0.66, span = Wd / 2 + m, Xc = M.Xc;
        for (let q = 0; q < 9; q++) CB[q].length = 0;
        for (const gr of P.rows) {
          const y = gr.y - rise;
          if (y < Y0 - m) continue; if (y > H + m) break;
          const dy = fD(gr.y - M.A[1]), [j0, j1] = jRange(P, gr, Xc, span);
          for (let j = j0; j <= j1; j++) {
            const x = xOf(P, gr, j, Xc), dx = (x - Ax) * M.kx, d = Math.sqrt(dx * dx + dy * dy);
            const pp = (F - d) / M.Wf; if (pp <= 0 || pp >= 1) continue;
            const al = s01(pp / 0.5), r = lerp(1, rf, s01((pp - 0.1) / 0.8)), qa = Math.max(1, Math.round(al * 8));
            CB[qa].push(x, y, r);
          }
        }
        for (let q = 1; q < 9; q++) { const b = CB[q]; if (!b.length) continue; c.globalAlpha = q / 8; c.beginPath(); for (let j = 0; j < b.length; j += 3) { c.moveTo(b[j] + b[j + 2], b[j + 1]); c.arc(b[j], b[j + 1], b[j + 2], 0, 6.2832); } c.fill(); b.length = 0; }
        c.globalAlpha = 1;
      }
      c.restore();
    }
    drawLine(c);
  }

  /* the tide without dots (v4: .layer[data-exit]), on the same timing (S.tk closes it, M.rise lifts it); each covers the whole screen at S.tk = 1, so the hand-over to
     the flat dark (M.covered) never jumps. Outlines fade as the dark closes (lit).
       floor     the illustrations' isometric floor: a 2:1 rhombus grows from under the node, with a fine ink outline, until it holds the screen
       frame     the stations' viewfinder opens from the node (its tile's round corners squaring off) to the whole screen
       seam      a seam drops from the node, then the dark parts from it to both sides
       ruler     the line's own ruler: its ticks grow down from the line, the centre first, thicken and merge into the dark
       drop      the four steps fall: the line's four quarters drop down the screen in turn, the dark behind each */
  function drawExit(c: CanvasRenderingContext2D, Wd: number, H: number, Y0: number) {
    const p = S.tk, rise = M.rise, lit = 1 - s01((p - 0.8) / 0.2);
    const band = (y0: number) => { c.beginPath(); c.rect(-2, y0, Wd + 4, H - y0 + 4); c.clip(); };   /* everything stays under the line */
    const top = M.railY - rise, deep = H + M.riseEnd - M.railY + 24;       /* the area under the line, with what the tide lifts into view */
    if (EXIT === "floor") {                    /* the illustrations' isometric floor: a 2:1 rhombus grows from under the node, an ink outline just outside it, until it holds the whole area */
      band(Y0);
      const e = inOut3(p), hh = (Wd / 4 + deep / 2 + 8) * e, hw = hh * 2, cx = M.cx, cy = top + deep * 0.42 * e;
      if (hh < 0.5) return;
      const dia = (k: number) => { c.beginPath(); c.moveTo(cx, cy - hh - k); c.lineTo(cx + hw + 2 * k, cy); c.lineTo(cx, cy + hh + k); c.lineTo(cx - hw - 2 * k, cy); c.closePath(); };
      dia(0); c.fill();
      if (lit > 0.01) { dia(7); c.globalAlpha = 0.35 * lit; c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; }
    } else if (EXIT === "frame") {             /* the stations' viewfinder: it opens from the node (the tile's round corners squaring off) to the whole width and depth */
      band(Y0);
      const e = inOut3(p), hub = 24, hw = lerp(hub, Wd / 2 + 12, e), h = lerp(hub, deep, e), r = 12 * (1 - e);
      c.beginPath(); c.roundRect(M.cx - hw, top - 1 - r, hw * 2, h + 1 + r, r); c.fill();
    } else if (EXIT === "seam") {              /* the node opens the screen: a seam drops from it, then the dark parts from the seam to both sides */
      band(Y0);
      const d = s01(p / 0.26), o = inOut3(clamp((p - 0.16) / 0.84, 0, 1)), w = (Wd / 2 + 4) * o;
      if (d > 0) { c.fillRect(M.cx - 0.75, top, 1.5, deep * d); }
      if (w > 0) c.fillRect(M.cx - w, top - 1, w * 2, deep + 1);
    } else if (EXIT === "drop") {              /* the four steps fall: the green line parts into its four quarters (a step each) and each drops down the screen, left to
                                                  right as the steps ran, pulling the dark down behind it; four steps become the Stack's four layers */
      band(Y0);
      const n = RAIL.stations.length, lag = 0.13, cw = Wd / n;
      for (let i = 0; i < n; i++) {
        const t = inOut3(clamp((p - i * lag) / (1 - (n - 1) * lag), 0, 1)); if (t <= 0) continue;
        const x = Math.floor(i * cw) - 1, w = Math.ceil(cw) + 2, h = (deep + 4) * t;
        c.fillRect(x, top - 1, w, h + 1);
        const g = lit * (1 - s01((t - 0.82) / 0.18));
        if (g > 0.01) { c.globalAlpha = g; c.fillStyle = GREEN; c.fillRect(x + 1, top - 1 + h, w - 2, 2); c.fillStyle = DARK; c.globalAlpha = 1; }
      }
        } else if (EXIT === "ruler") {             /* the line's own ruler: each tick grows down from the line, the centre first, thickens and merges with its neighbours */
      c.beginPath(); c.rect(-2, Y0, Wd + 4, H - Y0 + 4); c.clip();
      const step = RU.step, { cx, Xc } = M, k0 = Math.ceil((Xc - cx - 2) / step) - 1, k1 = Math.floor((Xc + cx + 2) / step) + 1, full = H + M.riseEnd - M.railY + 24;
      for (let k = k0; k <= k1; k++) {
        const x = cx + k * step - Xc, d = Math.min(1, Math.abs(x - cx) / (Wd / 2)), t = clamp((p - d * 0.42) / 0.58, 0, 1); if (t <= 0) continue;
        const len = lerp(RU.s, full, inOut3(t)), w = lerp(1, step + 1, s01((t - 0.2) / 0.8)), y = Y0 + RU.y0 * (1 - t);
        c.globalAlpha = lerp(RU.a, 1, s01(t / 0.35)); c.fillRect(x - w / 2, y, w, len);
      }
      c.globalAlpha = 1;
    }
  }

  function apply() {
    if (!R || !M.W) return;
    EG = S.enter >= 1 ? 1e9 : S.enter * (M.W + 420);
    const wx = -(M.W * (S.wv - 50)) / 100; M.Xc = M.W * S.wv / 100;
    M.rise = S.tg > 0.00002 ? M.riseEnd * S.tg : 0; M.Y0 = M.railY - M.rise;
    const ry = (-M.rise).toFixed(2);
    put("tw", R.world, `translate3d(${wx.toFixed(2)}px,0,0)`);
    put("tt", R.track, `translate3d(${wx.toFixed(2)}px,${ry}px,0)`);
    put("tp", R.play, M.rise ? `translate3d(0,${ry}px,0)` : "none");
    /* the frame draws itself around the first tile as it lands, then stays; it fades as the dark starts (ink on the dark would vanish half-way) */
    { const pf = S.pf.toFixed(3), po = (1 - s01(S.tk * 4)).toFixed(3);
      if (last.pf !== pf) { last.pf = pf; R.playRect.style.strokeDashoffset = (1 - S.pf).toFixed(3); R.play.style.visibility = S.pf > 0.001 ? "visible" : "hidden"; }
      if (last.po !== po) { last.po = po; R.play.style.opacity = po; } }
    /* v4 "line": the node stays centred on the line through every scene up to "user-owned", then leaves with the world as it slides to the first station
       (riding the line: x from the title on, and the tide's rise) */
    if (STEPLINE) { const nx = -(M.W * Math.max(0, S.wv - RAIL.title)) / 100; put("pt", R.point, `translate3d(${nx.toFixed(2)}px,${ry}px,0) scale(${S.pt.toFixed(3)})`); }
    else put("pt", R.point, `scale(${S.pt.toFixed(3)})`);
    /* the slot (line 3) docks; NEAR: P0 -> P1 with the dock, then P1 -> P2 (the title) */
    { const d = S.dock, k = 1 + (M.dk - 1) * d; put("ts", R.slot, d < 1e-4 ? "none" : `translate3d(0,${(M.dockY * d).toFixed(2)}px,0) scale(${k.toFixed(4)})`); I.rest1.msc = k;
      const P1 = M.P1, P2 = M.P2, np = s01(S.nx / 0.72), ns = s01(S.nx), x = lerp(P1[0] * d, P2[0], np), y = lerp(P1[1] * d, P2[1], np), sc = lerp(1 + (P1[2] - 1) * d, P2[2], ns);   /* the place first, the size last (it never crosses "On", it closes on the comma) */
      put("tn", R.near, Math.abs(x) + Math.abs(y) < 0.01 && Math.abs(sc - 1) < 1e-4 ? "none" : `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${sc.toFixed(4)})`); }
    R.dots.forEach((el, i) => put("d" + i, el, `scale(${S.sd[i].toFixed(3)})`));
    /* v5: the ridges hang back at 0.3x the world's travel (0 -> 105 vw over the whole rail); they come in with the section's arrival */
    if (R.plate && R.ridges) {
      put("rg", R.plate, `translate3d(${(-0.3 * (clamp(S.wv, 50, RAIL.stations[3]) - 50) * M.vw).toFixed(2)}px,0,0)`);
      const ro = s01(S.enter * 1.25).toFixed(3); if (last.ro !== ro) { last.ro = ro; R.ridges.style.opacity = ro; }
    }
    /* v5: the problem's drawing stays where it is from the problem to the answer (the world stands at the title), then rides the world out to the first station */
    if (SPLIT) put("tg", R.gate, `translateX(-50%) translate3d(${(-Math.max(0, S.wv - RAIL.title) * M.vw).toFixed(2)}px,0,0)`);
    put("fs", R.fin, `scale(${S.finS.toFixed(4)})`); I.fin.sc = S.finS;
    const mk = S.mark.toFixed(3); if (last.mk !== mk) { last.mk = mk; setC(R.mk, "--mark", mk); }
    /* the illustrations: a pure function of the playhead (the vig2 contract) */
    R.vig.forEach((v, i) => { const a = S.va[i]; if (last["va" + i] !== a) { last["va" + i] = a; v.set(a); } });
    if (R.gvig && last.ga !== S.ga) { last.ga = S.ga; R.gvig.set(S.ga); }      /* the problem's illustration (the layer beneath), beside the paragraph */
    if (SPLIT && R.gvig?.own && last.own !== S.own) { last.own = S.own; R.gvig.own(S.own); }   /* v5: and it becomes the user's, in place */
    const c = ctx2; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, M.W, M.H);
    drawCover();                                        /* sets M.covered: the stage under the flat dark need not be drawn */
    if (!M.covered) {
      for (const it of items) if (!(INKLINE && it === I.rail1)) renderItem(it, wx);   /* ink line: no dot sweep, it draws in from both ends */
      drawSurvey();
      flush();
    }
    if (last.cov !== M.covered) { last.cov = M.covered; html.toggleAttribute("data-ly-dark", M.covered === true); }
    if (RGl) RGl.update(S.enter, EG, S.gy, S.gq, I.fin.a);         /* the background world (it renders on its own rAF, only when something changed) */
  }

  /* ───────────────────────────── the master timeline ───────────────────────────── */
  function leave(tl: Tl, it: Item, at: number, o = 2.8, drAt = 1.6, drDur = 2.8) {
    tl.to(it, { o: 1, duration: o, ease: "none" }, at);
    if (drDur) tl.to(it, { dr: 1, duration: drDur, ease: "none" }, at + drAt);
  }
  let tl0!: Tl;
  function build(tl: Tl) {
    tl0 = tl;
    const to = (t: object, v: gsap.TweenVars, at: number) => tl.to(t, v, at);
    /* 0.3 - 2.5 the green node pops (the approach has swept in everything else of 384:8605); f1 holds to 9 */
    to(S, { pt: 1, duration: 2.2, ease: "back.out(2)" }, 0.3);
    /* 9 - 13 lines 1 and 2 dissolve; the end labels sweep out; the node shrinks away (the line stays) */
    leave(tl, I.c[0], 9, 2.8, 1.5, 3); leave(tl, I.c[1], 9.8, 2.8, 1.5, 3);
    I.ends.forEach((it, i) => to(it, { o: 1, duration: 2.2, ease: "none" }, 9.6 + 0.6 * i));
    if (!STEPLINE) to(S, { pt: 0, duration: 1.4, ease: "power2.in" }, 11);
    if (SPLIT) buildSplit(); else buildDock();
    buildSteps();
  }
  /* v5: two beats (see the header). The thesis leaves whole (line 3 and NEAR too), the world moves on to the problem's place; the problem and its drawing; then the paragraph
     goes, the drawing becomes the user's where it stands and the answer comes in over it; the world only moves on with the first station */
  function buildSplit() {
    const to = (t: object, v: gsap.TweenVars, at: number) => tl0.to(t, v, at), tl = tl0;
    leave(tl, I.near, 10.2, 2.8, 1.5, 3); leave(tl, I.rest1, 10.5, 2.8, 1.5, 3);
    to(S, { wv: RAIL.title, duration: 9, ease: "power2.inOut" }, 11);
    to(I.prob, { a: 1, duration: STP.span, ease: "none" }, 17.5);
    to(S, { ga: 1, duration: 5.4, ease: "none" }, 18);
    to(I.prob, { o: 1, duration: 3.4, ease: "none" }, 29); to(I.prob, { dr: 1, duration: 4, ease: "none" }, 29.8);
    to(S, { own: 1, duration: 6, ease: "none" }, 30);
    to(I.ans, { a: 1, duration: 4.2, ease: "none" }, 32.2);
    to(S, { mark: 1, duration: 2.6, ease: "power3.inOut" }, 36);
    to(S, { gf: RAIL.title + 20, duration: 4.5, ease: "power2.out" }, 36);
    to(S, { ik: RAIL.title + 20, duration: 4.5, ease: "power2.out" }, 36);   /* the ink ends at the gate: the steps ahead turn grey */
    to(S, { ga: 2, duration: 3.4, ease: "none" }, ARR[0] - SLIDE + 0.3);         /* the drawing leaves as the world slides on, as a station's does */
  }
  function buildDock() {
    const to = (t: object, v: gsap.TweenVars, at: number) => tl0.to(t, v, at), tl = tl0;
    /* 10.5 - 18 "NEAR is where they connect." docks at the top left (384:9085) */
    to(S, { dock: 1, duration: 7.5, ease: "power2.inOut" }, 10.5);
    /* 14.5 - 19.6 the problem climbs in, word by word, bottom -> top; it holds to 26 */
    to(I.prob, { a: 1, duration: STP.span, ease: "none" }, 14.5);
    to(S, { ga: 1, duration: 5.4, ease: "none" }, 15);                                  /* the layer beneath arrives with the paragraph (set(a) 0 -> 1) */
    /* 26 - 31 the problem dissolves (last word first); "is where they connect." too */
    to(I.prob, { o: 1, duration: 3.4, ease: "none" }, 26); to(I.prob, { dr: 1, duration: 4, ease: "none" }, 26.8);
    to(S, { ga: 2, duration: 3.6, ease: "none" }, 25.6);                                /* and leaves with it (set(a) 1 -> 2) */
    leave(tl, I.rest1, 26.6, 2.6, 1.2, 2.8);                                            /* gone (its type) by 29.2, before NEAR moves */
    /* 26 - 36 the world slides to the title's place; 29.4 - 34.8 NEAR moves and resizes into the title; "On" and the rest sweep in around it; the marker (384:9555) */
    to(S, { wv: RAIL.title, duration: 10, ease: "power2.inOut" }, 26);
    to(S, { nx: 1, duration: 5.4, ease: "none" }, 29.4);                                /* eased in apply(): NEAR's place by 33.3, its size by 34.8 */
    to(I.ans, { a: 1, duration: 4.2, ease: "none" }, 33.4);                             /* "On" appears once NEAR has passed it; the comma once NEAR has its size */
    to(S, { mark: 1, duration: 2.6, ease: "power3.inOut" }, 37);
    /* the green has stopped at the first screen's edge (100 vw) while the world slid to the title; with the marker it runs on a little past the title (Lawrence's gate + 20) */
    to(S, { gf: RAIL.title + 20, duration: 4.5, ease: "power2.out" }, 37);
  }
  function buildSteps() {
    const to = (t: object, v: gsap.TweenVars, at: number) => tl0.to(t, v, at), tl = tl0;
    /* 43.5 - 85 the four stations (459:2850 ...): the world slides 55 vw (SLIDE units) and lands on each; the old station leaves as the slide starts, the new one arrives as it lands */
    ARR.forEach((at, i) => {
      const s0 = at - SLIDE;
      to(S, { wv: RAIL.stations[i], duration: SLIDE, ease: "power2.inOut" }, s0);
      to(S, { gf: RAIL.stations[i], duration: SLIDE, ease: "power2.inOut" }, s0);     /* the green runs ahead to the station, with the slide (its front lands on the tile) */
      to(S.va, { [i]: 1, duration: 4.6, ease: "none" }, at - 4.1);                    /* the illustration arrives: set(a) 0 -> 1 over the second half of the slide, done just after it lands */
      to(S.sd, { [i]: 1, duration: 1.6, ease: "back.out(2)" }, at - 1.1);             /* the station's N tile pops on the line */
      if (i === 0) to(S, { pf: 1, duration: 1.8, ease: "power2.out" }, at - 0.5);      /* the frame draws around the first tile as it lands, and stays */
      to(I.fin, { a: 1, duration: 2.4, ease: "none" }, at - 0.3);                    /* the viewfinder locks on once the station has landed */
      to(S, { finS: 1, duration: 2.4, ease: "power3.out" }, at - 0.3);
      to(I.tit[i], { a: 1, duration: STT.span, ease: "none" }, at - 2.4);
      to(I.ln[i], { a: 1, duration: ST.span, ease: "none" }, at - 1.6);
      if (i > 0) {
        const p = i - 1;
        to(S.va, { [p]: 2, duration: 3.4, ease: "none" }, s0 + 0.3);                 /* the old one leaves as it slides away: set(a) 1 -> 2 */
        to(I.tit[p], { o: 1, duration: 2.2, ease: "none" }, s0 + 0.9);              /* the words ride the slide for a while, then climb out through their windows */
        to(I.ln[p], { o: 1, duration: 2.2, ease: "none" }, s0 + 0.6);
        to(I.fin, { a: 0, duration: 2.0, ease: "none" }, s0 - 0.4); to(S, { finS: 1.14, duration: 0.01 }, s0 + 1.7);
      }
    });
    /* 92.3 - 95.2 identity leaves as the others do, before any dark: the words up through their windows, the drawing (set(a) 1 -> 2: gone by a = 1.85), the viewfinder */
    to(S.va, { 3: 2, duration: 3.4, ease: "none" }, ID_OUT);
    to(I.ln[3], { o: 1, duration: 2.2, ease: "none" }, ID_OUT); to(I.tit[3], { o: 1, duration: 2.2, ease: "none" }, ID_OUT + 0.3);
    to(I.fin, { a: 0, duration: 2.0, ease: "none" }, ID_OUT);
    /* 95.8 - 106.3 THE WORLD BECOMES THE STACK: S.tk the cells under the line darken and merge from just under the centre outwards; S.tg the tide: the dark rises from the line as a straight edge,
       carrying the line and the node, until the line has left the top. The Stack slides in under the last TR.ov units (the band's overlap), on the same ground */
    to(S, { tk: 1, duration: TR.k1 - TR.t0, ease: "power1.out" }, TR.t0);
    to(S, { tg: 1, duration: TR.g1 - TR.g0, ease: "power2.inOut" }, TR.g0);
    /* the background world (rail/railglobe.ts): ONE turn from the thesis (0) to identity's exit (95.2), linear; it leaves with identity (92.3 - 95.2) */
    to(S, { gy: 1, duration: ID_OUT + 2.9, ease: "none" }, 0);
    to(S, { gq: 1, duration: 2.9, ease: "none" }, ID_OUT);
    tl.set({}, {}, TOTAL);
    tl.eventCallback("onUpdate", apply);
  }

  /* the idle motion: the vignette AT REST on screen (set(a) exactly 1) gets idle(t, w) every frame; w eases 0 -> 1 once the scroll has stopped AND the scrubbed playhead has settled
     (IDLE.wait ms of both), back to 0 fast when the scroll resumes or the station starts leaving (then the next resting station takes over). The others get nothing (w = 0).
     A rAF that only runs while the section is on screen; never with reduced motion / on the static page (not started there). */
  let idleRaf = 0, idleIO: IntersectionObserver | null = null;
  function idleLoop(main: Tl) {
    let prev = 0, lastT = NaN, still = 0, lastScroll = 0, w = 0, idx = -1, sent = 0;
    const mark = () => { lastScroll = performance.now(); };
    for (const t of ["scroll", "wheel", "touchmove"] as const) addEventListener(t, mark, { passive: true, signal: sig });
    const send = (i: number, t: number, v: number) => { const g = R && R.vig[i]; if (g && g.idle) g.idle(t, v); };
    /* v4 (INKLINE): the drawings live while they are seen, scroll or not: the station at rest gets idle at once (no wait for the scroll to stop), and the
       problem's drawing (the gate, S.ga exactly 1) gets its own */
    let gw = 0, gsent = 0;
    const frame = (now: number) => {
      if (sig.aborted) return;
      idleRaf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, prev ? (now - prev) / 1000 : 0); prev = now;
      if (INKLINE) {
        let rest = -1; for (let i = 0; i < 4; i++) if (S.va[i] === 1) rest = i;
        if (rest !== idx && w <= 0) idx = rest;
        const want = idx >= 0 && rest === idx && !document.hidden;
        w = want ? Math.min(1, w + dt / IDLE.up) : Math.max(0, w - dt / IDLE.down);
        if (idx >= 0 && (w > 0 || sent > 0)) { const e = s01(w); send(idx, now / 1000, e); sent = e; }
        const g = R && R.gvig, gwant = S.ga === 1 && !document.hidden;
        gw = gwant ? Math.min(1, gw + dt / IDLE.up) : Math.max(0, gw - dt / IDLE.down);
        if (g && g.idle && (gw > 0 || gsent > 0)) { const e = s01(gw); g.idle(now / 1000, e); gsent = e; }
        return;
      }
      const T = main.time(); if (!(Math.abs(T - lastT) < 0.003)) { lastT = T; still = now; }   /* the scrub's last creeping hundredths count as settled */
      let rest = -1; for (let i = 0; i < 4; i++) if (S.va[i] === 1) rest = i;
      if (rest !== idx && w <= 0) idx = rest;                                   /* hand over only once the last one is back at rest */
      const want = idx >= 0 && rest === idx && now - still > IDLE.wait && now - lastScroll > IDLE.wait && !document.hidden;
      w = want ? Math.min(1, w + dt / IDLE.up) : Math.max(0, w - dt / IDLE.down);
      if (idx >= 0 && (w > 0 || sent > 0)) { const e = s01(w); send(idx, now / 1000, e); sent = e; }
    };
    const stop = () => {
      if (!idleRaf) return; cancelAnimationFrame(idleRaf); idleRaf = 0; prev = 0; if (idx >= 0 && sent > 0) send(idx, performance.now() / 1000, 0); w = 0; sent = 0;
      if (gsent > 0 && R && R.gvig) R.gvig.idle(performance.now() / 1000, 0); gw = 0; gsent = 0;
    };
    idleIO = new IntersectionObserver((es) => { const on = es.some((e) => e.isIntersecting); if (on && !idleRaf && !sig.aborted) idleRaf = requestAnimationFrame(frame); else if (!on) stop(); });
    idleIO.observe(sec!);
  }

  /* ───────────────────────────── mount ───────────────────────────── */
  const trigs: Trig[] = [];
  let main: Tl | null = null, enterTl: Tl | null = null, rsTm = 0, disposed = false;
  const band = document.querySelector<HTMLElement>(".stk");
  const dispose: Dispose = () => {
    if (disposed) return; disposed = true;
    ac.abort();
    clearTimeout(rsTm);
    if (idleRaf) cancelAnimationFrame(idleRaf); idleRaf = 0; idleIO?.disconnect(); idleIO = null;
    trigs.forEach((t) => t.kill()); trigs.length = 0;
    main?.kill(); enterTl?.kill(); main = enterTl = null;
    try { RGl?.dispose(); } catch (e) { console.warn("[rail] globe dispose", e); }
    RGl = null;
    if (R) { for (const v of [...R.vig, R.gvig]) { try { v?.dispose?.(); } catch (e) { console.warn("[rail] vignette dispose", e); } } R.stage.remove(); R = null; }
    band?.style.removeProperty("--ov");
    for (const a of ["data-rail", "data-ly-ready", "data-ly-dark"]) html.removeAttribute(a);
  };

  try {
    const copy = readCopy(sec);
    await loadFonts(sec);
    toneImg = await loadTone(RIDGES).catch(() => null);
    if (sig.aborted) { dispose(); return null; }
    R = buildStage(copy);
    RGl = WORLD && !PHOTO ? mountRailGlobe(R.stage, { quiet: R.fin }) : null;   /* v5: the ridges instead */                      /* the faint world, the stage's lowest layer (async: it draws once its globe is ready) */
    html.setAttribute("data-rail", "");
    makeItems();
    layout();
  } catch (e) {
    console.warn("[rail] static section", e);
    dispose();
    return staticPage(sec);
  }
  /* the Stack band is pulled up over the last TR.ov units of the pin (stack.css: html[data-rail] .stk; the overlap is see-through, the world's dark shows under it) */
  const pinPx = () => SCREENS() * innerHeight;
  const PLACE = html.getAttribute("data-stk-enter") === "place";
  const setOv = () => { if (band) band.style.setProperty("--ov", (PLACE ? innerHeight : (TR.ov / TOTAL) * pinPx()).toFixed(1) + "px"); };
  setOv();
  main = gsap.timeline({ paused: true });
  build(main);
  enterTl = gsap.timeline({ paused: true }); enterTl.to(S, { enter: 1, duration: 1, ease: "none" }, 0); enterTl.eventCallback("onUpdate", apply);
  trigs.push(ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "top top", scrub: 0.8, animation: enterTl, invalidateOnRefresh: true }));
  trigs.push(ScrollTrigger.create({ trigger: sec, start: "top top", end: () => "+=" + Math.round(pinPx()), pin: true, pinSpacing: true, scrub: 0.8, animation: main, invalidateOnRefresh: true, anticipatePin: 1 }));
  apply(); html.setAttribute("data-ly-ready", "");
  requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
  idleLoop(main);
  addEventListener("resize", () => { setOv(); clearTimeout(rsTm); rsTm = window.setTimeout(() => { layout(); apply(); }, 180); }, { signal: sig });
  return dispose;
}

/* reduced motion / no GSAP / a failure: the stacked page, the copy in order, the illustrations at rest (set(1)) */
function staticPage(sec: HTMLElement): Dispose {
  const html = document.documentElement, vigs: Vignette[] = [];
  html.setAttribute("data-ly", "static");
  sec.querySelectorAll<HTMLElement>(".rail__list > li").forEach((li) => {
    const h = li.querySelector<HTMLElement>(".rail__art"); if (!h || h.childElementCount) return;
    try { const v = createVignette(li.dataset.own as VigKey, h); v.set(1); vigs.push(v); } catch (e) { console.warn("[rail] vignette", e); }
  });
  let done = false;
  return () => {
    if (done) return; done = true;
    for (const v of vigs) { try { v.dispose?.(); } catch (e) { console.warn("[rail] vignette dispose", e); } }
    html.removeAttribute("data-ly");
  };
}
