/* "Amanecer / Orbital dawn": the hero intro (r17 v1 js/intro.js; one smooth ~3.5 s move, the text 2 -> 4 s over the end of it).
 *
 * The page opens at a grazing angle on the planet: on the paper there is only a horizon (the limb of a huge sphere, a 1 px ink line drawn from the middle outward, with the
 * rail's tick scale under it) and, at its apex, the first light (green). The dawn reaches the surface: its dots come in from the horizon toward the viewer (land first, sea after),
 * rushing under the line as the planet turns. The camera pulls back and tilts up (log zoom, the box travels to its place, pitch / spin settle) while the light runs ONE lap
 * along the limb: it lingers at the apex while the horizon is a line, then accelerates around the curving rim (a bright head, a soft green halo, a tail along the rim that
 * lengthens with its speed) and closes the lap at the apex just before the globe lands -> a green flash of the whole rim that settles into a soft afterglow, gone exactly as the
 * CTA lands (after that, no glow: the rim is the globe's faint outline again, only the twinkles stay).
 * The world lands EXACTLY on the hero (same box, size, pitch) turning at 6 deg/s.
 * At rest (and from the middle of the flight) a few land dots light up green and fade (~24 at a time); they leave as soon as the scroll transition starts and come back at the top.
 *
 * TIMELINE (from navigation start, a warm load: the globe's first frame ~.3 s): the world moves from its first frame for DUR = 3.5 s, ONE speed (u linear in time; every
 * pose is a smooth eased function of u: no rate changes, no jumps; a stalled frame pauses it). The text overlaps the end: the header at u = .47 (~2.0 s), the title
 * lines from ~2.2 s, the sub, the CTA landing with the world at ~3.9 s; the glow ends with it.
 * LATE GLOBE: the move starts with the globe's first frame, shifted, never faster. Ready after fullUntil (2.5 s): the same move at the same speed entered later (u0) so that it
 * rests by ceil (5 s), its opening replayed on a quick clock, the text fitted; later than ~3.9 s: the end state. No globe at all: the text by ~5 s.
 *
 * The world is driven with the globe's public API only (g.setBox per frame = the camera, g.setView, uSize so dots grow as zoom^0.45, uFall = the dawn front, uSea, g.cfg.spin);
 * the hairline + ticks are one SVG in the stage; the light, the flash and the twinkles are ONE 2D canvas over the globe's canvas (drawn in g.onFrame, after the
 * rotation of that frame is known: g.project). The soft glow exists only on that canvas, only for the light and the flash.
 *
 *   const intro = mountIntro();   // before the boot
 *   intro.attach(ctx);            // the boot, as soon as the globe exists (GSAP, Lenis and the transition still to come): until the boot runs the globe's frames, the intro drives them
 *   intro.start(ctx);             // after the boot: also hands the intro to intro-hold.ts (input + the hero's scroll transition while the intro plays)
 *
 * html[data-r16-intro]: "run" (header + copy hidden; the stage hidden until the first intro frame: data-r16-live) -> "reveal" (CSS) -> "done".
 * Not set at all with ?rm=1 / reduced motion / ?gl=0 (head.ts): the page as before, no intro, no overlay. ?intro=0: the end state at once. */
import type { WorldCtx } from "./boot";
import type { Globe, GlobeUniforms } from "./globe";
import { mountHold, type Hold } from "./intro-hold";

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const s01 = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const lin = (x: number, a: number, b: number) => clamp((x - a) / (b - a), 0, 1);

/* cubic-bezier(x1, y1, x2, y2) as a function of x (Newton, then bisection) */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t, Y = (t: number) => ((ay * t + by) * t + cy) * t, dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6) return Y(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let a = 0, b = 1; t = x;
    for (let i = 0; i < 40; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) a = t; else b = t; t = (a + b) / 2; }
    return Y(t);
  };
}

type Win = [number, number];
/* ───────── the score (u = 0..1 over DUR seconds) ───────── */
export const INTRO = {
  DUR: 3.5,                    /* the world's move, s: ONE gentle ease from the first frame (~.3 s after navigation on a warm load) to rest (~3.8 s) */
  revealAt: 0.47,              /* the header starts here (~2.0 s), the text overlaps the end of the move */
  revealMs: 2000,              /* the reveal at k = 1 (intro.css: header .7 s; title +.2 / +.34, sub +.7, CTA +1.2 (.7 - .8 s each)): the CTA lands as the world does */
  fullUntil: 2.5,              /* s after navigation: a globe ready by then plays the whole move, shifted later (same speed, never faster) */
  ceil: 5.0,                   /* s after navigation: a later globe enters the piece later (same speed) so that everything is at rest by then */
  lateMin: 1.3,                /* s: the shortest late entry; a globe later than ceil - lateMin + .2 gets the end state */
  preHeader: 0.35,             /* s of flight a late entry shows before its header */
  openS: 1.0,                  /* s: a late entry's own quick opening (the line, the dawn front, the first light) runs on this clock */
  spin: TAU / 60,              /* the resting turn: 6 deg/s */
  yawEnd: 2.07 + 0.12,         /* where the turn is when the camera lands (mode A's yaw is 2.07) */
  yawV0: 0.324,                /* rad/s of the turn at the start (decays to `spin`) */
  pitchFrom: -0.55,            /* the grazing pitch (mode A rests at 0.29): the surface rushes from the horizon toward the viewer while it settles */
  zW: 1.8, zH: 1.4,            /* the start radius: max(zW W, zH H) */
  yh: 0.6, yhP: 0.56,          /* the horizon's height at the start (x the stage height; portrait) */
  kSize: 0.45,                 /* the dots grow as zoom^kSize (not as the world: no blobs) */
  line: [0.0, 0.12] as Win,    /* the horizon draws itself from the middle outward */
  ticks: [0.03, 0.14, 0.26, 0.42], /* the rail's tick scale under the horizon (every 12 px of the planet, 6 px long): in, full, out */
  dawn: [0.04, 0.34] as Win,   /* the light front: from the horizon to the bottom of the screen */
  dawnBand: 0.2,               /* its width, x the stage height */
  sea: [0.2, 0.62] as Win,     /* the sea catches the light after the land */
  lineOut: [0.5, 0.86] as Win, /* the ink hairline hands over to the globe's own faint outline */
  /* the light orbit */
  lightIn: [0.04, 0.13] as Win, /* the head appears at the apex */
  lap: 0.88,                   /* the lap closes here (u); phi = TAU (u / lap)^lapPow: it lingers at the apex while the horizon is a line, then whips round */
  lapPow: 5.5, lapPowP: 8,     /* (portrait: the globe is wider than the screen until late, so the lap is held back more to stay in view) */
  tail: 0.1,                   /* s: the tail is where the head was this long ago (min 70 px, max 1.9 rad) */
  flash: [0.05, 0.14, 0.34],   /* s: the flash's rise, its decay to the afterglow, the afterglow's level */
  glowOut: 0.3,                /* s: the afterglow fades out over this, ending EXACTLY as the CTA lands (the end of the reveal) */
  ctaLands: 2000,              /* ms after the reveal starts at k = 1 (intro.css: CTA delay 1.2 s + .8 s) */
  /* the twinkles */
  twN: 24, twLife: [1.3, 2.6], twFrom: 0.3,
  fast: 0.25,                  /* the reveal's time scale after a cut / Esc (~0.5 s) */
  /* the late entry (a late globe): the same move at the same speed, entered at u0 (the pull back already under way); its opening (line, dawn, first light) replays on its own quick clock (openS) */
  short: { u0: 0.42, line: [0, 0.22] as Win, ticks: [0, 0.1, 0.3, 0.5], dawn: [0.02, 0.42] as Win, sea: [0.1, 0.62] as Win, lightIn: [0, 0.12] as Win },
};
type OpKey = "line" | "dawn" | "sea" | "lightIn";
const E_CAM = bezier(0.55, 0, 0.3, 1);      /* the pull back: lingers on the horizon, a long glide, a long settle */
const E_X = bezier(0.5, 0, 0.28, 1);        /* the sideways travel to the right */
/* speed profile of the turns: full speed while we skim the horizon, then they slow as the camera pulls away (zero slope at both ends) */
const decay = (u: number) => 1 - s01((u - 0.1) / 0.9);
const NT = 512, CUM = new Float32Array(NT + 1);
{ let a = 0; CUM[0] = 0; for (let i = 1; i <= NT; i++) { const u0 = (i - 1) / NT, u1 = i / NT; a += 0.5 * (decay(u0) + decay(u1)) / NT; CUM[i] = a; } }
const cumAt = (u: number) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return mix(CUM[i], CUM[i + 1], f - i); };   /* integral of decay from 0 to u */
const CTOT = CUM[NT];
const GREEN = "#00DC8D";

/* the transition holds the turn while it runs and resumes it at the top; with this intro it always resumes (the intro drives the camera with the turn off and turns it on
   when it lands; the transition reads `spinning` a frame late: a hold that started during the intro or on its landing frame found it off). */
let mounted = false;
export const introOwnsTurn = () => mounted;

export type Intro = { attach(c: WorldCtx): void; start(c: WorldCtx): Intro; skip(): void; dispose(): void; readonly state: string | null };

export function mountIntro(): Intro {
  const html = document.documentElement;
  mounted = true;
  let lapPow = INTRO.lapPow;
  const phiAt = (u: number) => TAU * Math.pow(clamp(u / INTRO.lap, 0, 1), lapPow);
  let state = html.getAttribute("data-r16-intro");       /* set by the head script: null (no intro), "run", or "done" (?intro=0) */
  let ctx: WorldCtx | null = null, g: Globe | null = null, U: GlobeUniforms | null = null;
  let svg: SVGSVGElement | null = null, limb: SVGPathElement | null = null, ticks: SVGPathElement | null = null;
  let t0 = -1, u = 0, tau = 0, mode: "long" | "short" | "end" = "long", uSpeed = 1 / INTRO.DUR, u0 = 0, uHead = INTRO.revealAt, kRev = 1, ticking = false, finished = false, revealT = 0, pNow = 0, timer = 0;
  let flying = false, closeAt = -1, lastNow = 0, glowEnd = -1;          /* closeAt: performance time (ms) the lap closed (the flash clock) */
  let dead = false;
  const offs: (() => void)[] = [];
  const L = { W: 1, H: 1, cx0: 0, cy0: 0, R0: 1, Z0: 10, yh: 0, ok: false };
  const BOX = { cx: 0, cy: 0, r: 1 };

  const setState = (s: string) => { state = s; html.setAttribute("data-r16-intro", s); };

  /* the reveal: the header, then the title lines, then the sub + the CTA (intro.css, scaled by --r16k) */
  function reveal(k = 1) {
    if (state !== "run") return;
    html.style.setProperty("--r16k", String(k));
    setState("reveal");
    clearTimeout(revealT);
    revealT = window.setTimeout(() => { setState("done"); html.style.removeProperty("--r16k"); if (finished || !g) fireDone(); }, Math.ceil(INTRO.revealMs * k) + 80);
    glowEnd = performance.now() + INTRO.ctaLands * k;          /* the world's glow lives until the CTA has landed */
    clearTimeout(timer);
  }

  /* ── no globe at all by then (a failed or very slow load): the text comes anyway, by ~ceil ── */
  if (state === "run") timer = window.setTimeout(() => { if (!attached || mode === "end") skip(); }, Math.max(0, INTRO.ceil * 1000 - INTRO.revealMs * INTRO.fast - 120 - performance.now()));

  function layout() {
    if (!g || !ctx) return;
    const sr = g.stageRect(), br = ctx.box.getBoundingClientRect();
    L.W = Math.max(1, sr.width); L.H = Math.max(1, sr.height);
    L.cx0 = br.left - sr.left + br.width / 2; L.cy0 = br.top - sr.top + br.height / 2; L.R0 = Math.max(1, br.width / 2);
    const portrait = L.H > L.W * 1.15;
    L.Z0 = Math.max(INTRO.zW * L.W, INTRO.zH * L.H) / L.R0;          /* the start: a limb so big that it reads as a line across the screen */
    L.yh = L.H * (portrait ? INTRO.yhP : INTRO.yh);                   /* the horizon's height at the start */
    lapPow = portrait ? INTRO.lapPowP : INTRO.lapPow;
    L.ok = true;
  }

  /* the pose of the world at progress u */
  function pose(u: number) {
    const e = E_CAM(u), ex = E_X(u);
    const Z = Math.exp(Math.log(L.Z0) * (1 - e));
    const R = L.R0 * Z;
    const top = mix(L.yh, L.cy0 - L.R0, e);
    BOX.cx = mix(L.W / 2, L.cx0, ex); BOX.cy = top + R; BOX.r = R;
    return Z;
  }
  function yawAt(u: number) { const T = INTRO.DUR, rest = T * (1 - u) * INTRO.spin, extra = (INTRO.yawV0 - INTRO.spin) * T * (CTOT - cumAt(u)); return INTRO.yawEnd - rest - extra; }
  function pitchAt(u: number) { const P1 = g!.cfg.pitch; return P1 - (P1 - INTRO.pitchFrom) * (1 - cumAt(u) / CTOT); }

  function apply(u: number) {
    const Z = pose(u), gg = g!, Ug = U!;
    gg.setBox(BOX);
    gg.setView({ yaw: yawAt(u), pitch: pitchAt(u) });
    Ug.uSize.value = Math.pow(Z, INTRO.kSize - 1);
    Ug.uDisperse.value = 1e-4;                                /* the dots move freely (no pixel snap) while the camera flies */
    const top = BOX.cy - BOX.r, band = L.H * INTRO.dawnBand, f = s01(op("dawn"));
    const fx = mix(top - 40 - band, L.H * 1.05, f);
    Ug.uFall.value.set(fx, fx + band);
    Ug.uSea.value = mix(0.12, 1, s01(op("sea")));
    Ug.uRing.value = 1;
    drawLine(u);
  }

  /* the horizon: an SVG arc on the limb + the tick scale (it is a circle; at the start only the top of it is on the screen) */
  const p2 = (n: number) => n.toFixed(2);
  function drawLine(u: number) {
    if (!limb || !ticks) return;
    const a = 1 - s01(lin(u, INTRO.lineOut[0], INTRO.lineOut[1]));
    if (a <= 0.001) { limb.setAttribute("d", ""); ticks.setAttribute("d", ""); return; }
    const R = BOX.r * 1.003, cx = BOX.cx, cy = BOX.cy;
    const dr = op("line"), dd = 1 - Math.pow(1 - dr, 3);
    const edge = Math.asin(clamp(Math.max(cx, L.W - cx) / R, 0, 1)) * 1.04;
    const th = dr >= 1 ? Math.PI * 0.999 : Math.min(Math.PI * 0.999, edge * dd);
    const sx = Math.sin(th) * R, sy = Math.cos(th) * R;
    let d;
    if (th <= Math.PI / 2) d = `M${p2(cx - sx)} ${p2(cy - sy)}A${p2(R)} ${p2(R)} 0 0 1 ${p2(cx + sx)} ${p2(cy - sy)}`;
    else d = `M${p2(cx)} ${p2(cy - R)}A${p2(R)} ${p2(R)} 0 0 0 ${p2(cx - sx)} ${p2(cy - sy)}M${p2(cx)} ${p2(cy - R)}A${p2(R)} ${p2(R)} 0 0 1 ${p2(cx + sx)} ${p2(cy - sy)}`;
    limb.setAttribute("d", d);
    limb.style.opacity = (0.62 * a).toFixed(3);
    const K = mode === "short" ? INTRO.short.ticks : INTRO.ticks, kc = mode === "short" ? tau : u, ka = s01(lin(kc, K[0], K[1])) * (1 - s01(lin(kc, K[2], K[3])));
    if (ka > 0.001) {
      const step = 12 / (L.R0 * L.Z0), n = Math.floor(th / step), r1 = R - 4, r2 = R - 10;
      let t = "";
      for (let i = -n; i <= n; i++) {
        const an = i * step, sa = Math.sin(an), ca = Math.cos(an), x1 = cx + r1 * sa;
        if (x1 < -2 || x1 > L.W + 2) continue;
        t += `M${p2(x1)} ${p2(cy - r1 * ca)}L${p2(cx + r2 * sa)} ${p2(cy - r2 * ca)}`;
      }
      ticks.setAttribute("d", t); ticks.style.opacity = (0.3 * ka).toFixed(3);
    } else ticks.setAttribute("d", "");
  }

  /* ───────── the light layer: one 2D canvas over the globe (the orbit, the flash, the twinkles) ───────── */
  let cv: HTMLCanvasElement | null = null, c2: CanvasRenderingContext2D | null = null, dpr = 1, dirty: false | 1 | 2 = false, sprite: HTMLCanvasElement | null = null, land: Int32Array | null = null;
  const P = { x: 0, y: 0, z: 0 }, DR = { x: 0, y: 0, w: 0, h: 0 };            /* g.project scratch; the dirty square at rest */
  type Tw = { k: number; la: number; lo: number; t0: number; T: number; wait: number };
  const TW: Tw[] = [];
  function makeLayer(stage: HTMLElement) {
    cv = document.createElement("canvas"); cv.className = "r16i-light"; cv.setAttribute("aria-hidden", "true");
    stage.appendChild(cv); c2 = cv.getContext("2d");
    /* the halo: a radial falloff, green (drawn scaled; the only glow of the page) */
    sprite = document.createElement("canvas"); sprite.width = sprite.height = 128;
    const s = sprite.getContext("2d")!, gr = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,220,141,0.62)"); gr.addColorStop(0.18, "rgba(0,220,141,0.36)"); gr.addColorStop(0.45, "rgba(0,220,141,0.11)"); gr.addColorStop(1, "rgba(0,220,141,0)");
    s.fillStyle = gr; s.fillRect(0, 0, 128, 128);
    sizeLayer(); landList();
    for (let i = 0; i < INTRO.twN; i++) TW.push({ k: -1, la: 0, lo: 0, t0: 0, T: 1, wait: Math.random() * 1.2 });
  }
  function sizeLayer() {
    if (!cv) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(L.W)), H = Math.max(1, Math.round(L.H));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); dirty = 2;
  }
  function landList() {
    const D = g!.dots, n = D.n, a: number[] = [];
    for (let i = 0; i < n; i++) if (D.aG[4 * i] > 0.5) a.push(i);
    land = Int32Array.from(a);
    for (const t of TW) t.k = -1;
  }
  const halo = (x: number, y: number, r: number, a: number) => { if (a <= 0.003) return; c2!.globalAlpha = a; c2!.drawImage(sprite!, x - r, y - r, 2 * r, 2 * r); };

  /* one frame of the layer: called from g.onFrame (the rotation, the box and the uniforms of THIS frame are set) */
  function drawLayer(dt: number) {
    if (!c2 || !cv) return;
    const now = performance.now();                           /* one clock for the lap close, the flash and the twinkles (onFrame's `now` is GSAP's) */
    lastNow = now;
    const tw = twinkleOn();
    const lit = flying || (closeAt >= 0 && glowEnd >= 0 && now < glowEnd + 50);
    c2.setTransform(1, 0, 0, 1, 0, 0);
    if (dirty) { if (dirty === 2) c2.clearRect(0, 0, cv.width, cv.height); else c2.clearRect(DR.x, DR.y, DR.w, DR.h); dirty = false; }
    if (!lit && !tw) return;
    /* at rest only the twinkles draw: next frame clears just the globe's square (cheap); the light / the flash clear the whole layer */
    if (lit) dirty = 2;
    else { const b = g!.box, m = 8; DR.x = Math.floor((b.cx - b.r - m) * dpr); DR.y = Math.floor((b.cy - b.r - m) * dpr); DR.w = Math.ceil((2 * b.r + 2 * m) * dpr); DR.h = DR.w; dirty = 1; }
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (tw) drawTwinkles(dt, now);
    if (lit) drawLight(now);
    c2.globalAlpha = 1; c2.globalCompositeOperation = "source-over";
  }

  /* the light: the head at phi on the limb (clockwise from the apex), a tail along the rim; then the flash */
  function drawLight(now: number) {
    const c = c2!, b = g!.box, R = b.r * 1.004, cx = b.cx, cy = b.cy, sc = Math.min(L.W, L.H) / 900;
    const uu = flying ? u : 1;
    let tf = -1;                                             /* s since the lap closed */
    if (closeAt >= 0) tf = (now - closeAt) / 1000;
    const F = INTRO.flash;
    const ga = s01(flying ? op("lightIn") : 1) * (tf < 0 ? 1 : 1 - s01(tf / 0.12));
    if (ga > 0.003) {
      const phi = phiAt(uu), dur = 1 / uSpeed;
      const w = (phiAt(Math.min(uu + 0.004, INTRO.lap)) - phiAt(Math.max(uu - 0.004, 0))) / (0.008 * dur);   /* rad/s */
      const tailA = clamp(Math.max(w * INTRO.tail, (70 * sc) / R), 0, 1.9);
      const M = 44;
      c.lineCap = "round";
      for (let i = 0; i < M; i++) {                          /* the tail: crisp, fading toward its end, thinning */
        const f0 = i / M, f1 = (i + 1) / M, a0 = phi - tailA * f0, a1 = phi - tailA * f1;
        c.globalAlpha = ga * Math.pow(1 - f0, 1.7);
        c.strokeStyle = GREEN; c.lineWidth = mix(2.4, 0.7, f0);
        c.beginPath(); c.moveTo(cx + R * Math.sin(a0), cy - R * Math.cos(a0)); c.lineTo(cx + R * Math.sin(a1), cy - R * Math.cos(a1)); c.stroke();
      }
      for (let i = 0; i < 10; i++) {                         /* its halo, a few soft stamps along it */
        const f = i / 10, an = phi - tailA * f * 0.8;
        halo(cx + R * Math.sin(an), cy - R * Math.cos(an), 22 * sc * (1 - 0.6 * f), ga * 0.55 * Math.pow(1 - f, 2));
      }
      const hx = cx + R * Math.sin(phi), hy = cy - R * Math.cos(phi);
      halo(hx, hy, 34 * sc, ga);                             /* the head */
      c.globalAlpha = ga; c.fillStyle = GREEN; c.beginPath(); c.arc(hx, hy, 2.6, 0, TAU); c.fill();
    }
    if (tf >= 0) {                                           /* the flash: the whole rim lights green, then back to its faint outline */
      /* when the glow ends (s after the close): the CTA landing */
      const gEnd = glowEnd >= 0 ? (glowEnd - closeAt) / 1000 : 9;
      const peak = tf < F[0] ? s01(tf / F[0]) : mix(F[2], 1, Math.exp(-(tf - F[0]) / F[1]));
      const env = peak * (1 - s01((tf - (gEnd - INTRO.glowOut)) / INTRO.glowOut));
      if (env > 0.004) {
        c.globalAlpha = env * 0.5; c.strokeStyle = GREEN; c.lineWidth = 2;
        c.shadowColor = "rgba(0,220,141,0.9)"; c.shadowBlur = 18 * dpr;
        c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
        c.shadowBlur = 0; c.shadowColor = "transparent";
        c.globalAlpha = env; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
        halo(cx, cy - R, 62 * sc, env * 0.85);               /* the burst where the lap closed */
      }
    }
  }

  /* the twinkles: ~24 land dots at a time light up green and fade (flat dots over the ink dots, no glow) */
  function twinkleOn() {
    if (!land || !land.length || pNow > 0.012) return false;
    return flying ? u >= INTRO.twFrom : true;
  }
  function drawTwinkles(dt: number, now: number) {
    const c = c2!, gg = g!, Ug = U!;
    const sf = (1 - s01(pNow / 0.012)) * (flying ? s01(lin(u, INTRO.twFrom, INTRO.twFrom + 0.15)) : 1);
    const Ugg = Ug.uGG.value * Ug.uSize.value * Ug.uLandSize.value * Math.pow(Ug.uZoom.value, Ug.uZoomSize.value);
    const fx = Ug.uFall.value.x, fb = Math.max(1, Ug.uFall.value.y - fx);
    c.fillStyle = GREEN;
    for (const t of TW) {
      if (t.k < 0) { t.wait -= dt; if (t.wait <= 0) spawn(t, now); if (t.k < 0) continue; }
      const x = (now - t.t0) / (t.T * 1000);
      if (x >= 1) { t.k = -1; t.wait = Math.random() * 0.5; continue; }
      gg.project(t.la, t.lo, P, true);
      if (P.z < 0.04) continue;
      const env = Math.pow(Math.sin(Math.PI * x), 2), vz = s01((P.z - 0.04) / 0.25), vf = 1 - s01((P.y - fx) / fb);
      const a = env * vz * vf * sf; if (a < 0.01) continue;
      const r = 0.5 * Ugg * 0.66 * mix(0.3, 1, s01(P.z / 0.7)) * 1.12 + 0.3;
      c.globalAlpha = a; c.beginPath(); c.arc(P.x, P.y, r, 0, TAU); c.fill();
    }
  }
  function spawn(t: Tw, now: number) {
    const gg = g!, ld = land!;
    for (let k = 0; k < 10; k++) {
      const i = ld[(Math.random() * ld.length) | 0], D = gg.dots.pos, x = D[3 * i], y = D[3 * i + 1], z = D[3 * i + 2];
      const la = (Math.asin(clamp(y, -1, 1)) * 180) / Math.PI, lo = (Math.atan2(x, z) * 180) / Math.PI;
      gg.project(la, lo, P, true);
      if (P.z < 0.3 || P.x < 0 || P.y < 0 || P.x > L.W || P.y > L.H || P.y > U!.uFall.value.x) continue;
      t.k = i; t.la = la; t.lo = lo; t.t0 = now; t.T = mix(INTRO.twLife[0], INTRO.twLife[1], Math.random()); return;
    }
  }

  /* which entry plays (at the first frame): the whole move if the globe is ready by fullUntil (shifted later, never faster); a later globe enters the same move at the
     same speed at u0, so that it is at rest by ceil (at least lateMin s of it); later still, the end state */
  function choose(now: number) {
    const s0 = now / 1000;
    uSpeed = 1 / INTRO.DUR;
    if (s0 <= INTRO.fullUntil) { mode = "long"; u0 = 0; }
    else if (s0 <= INTRO.ceil - INTRO.lateMin + 0.2) { mode = "short"; u0 = clamp(1 - Math.max(INTRO.lateMin, INTRO.ceil - s0) / INTRO.DUR, 0, 0.9); }
    else { mode = "end"; return; }
    plan();
  }
  /* the text: from uHead (revealAt, or a little after a late entry), its pace k fitted so that the CTA lands when the world does (u = 1) */
  function plan() { uHead = Math.max(INTRO.revealAt, u0 + INTRO.preHeader / INTRO.DUR); kRev = Math.min(1, ((1 - uHead) * INTRO.DUR * 1000) / INTRO.revealMs); }
  /* the opening's clocks: in the full intro they run on u; in the condensed cut on its own time tau (they are already past at u0) */
  function op(k: OpKey) {
    if (mode === "short") { const r = INTRO.short[k], l = INTRO[k]; return Math.max(lin(tau, r[0], r[1]), lin(u, l[0], l[1])); }
    const r = INTRO[k]; return lin(u, r[0], r[1]);
  }

  let lastT = -1;
  function tick() {
    const time = performance.now() / 1000;                   /* one clock whoever drives (rAF before the boot runs the globe, then gsap.ticker) */
    if (finished || !g || dead) return;
    if (!L.ok) { layout(); sizeLayer(); }
    if (t0 < 0) {
      t0 = time; lastT = time;
      choose(performance.now());
      if (mode === "end") { skip(); return; }
      u = u0;
    }
    /* ONE speed for the whole move (u linear in time; the poses are eased functions of u). A frame advances it by at most 120 ms: a stall of the page pauses it, never a jump */
    u = Math.min(1, u + Math.min(time - lastT, 0.12) * uSpeed); lastT = time;
    tau = (time - t0) / INTRO.openS;
    if (closeAt < 0 && u >= INTRO.lap) closeAt = performance.now() - ((u - INTRO.lap) * 1000) / uSpeed;
    apply(u);
    if (!html.hasAttribute("data-r16-live")) html.setAttribute("data-r16-live", "");
    if (u >= uHead) reveal(kRev);
    if (u >= 1) landNow();
  }

  /* the camera has landed: hand the world back to the page, exactly at the hero, turning at 6 deg/s (the layer stays: the flash tail, then the twinkles) */
  function landNow() {
    if (finished) return;
    finished = true; flying = false;
    if (closeAt < 0) closeAt = lastNow || performance.now();
    stopDriver();
    if (g && ctx && U) {
      g.setBox(ctx.box);                                      /* the element again (resize re-reads it) */
      g.setView({ yaw: yawAt(1), pitch: g.cfg.pitch });
      U.uSize.value = 1; U.uDisperse.value = 0; U.uSea.value = 1; U.uRing.value = 1;
      U.uFall.value.set(1e5, 1e5 + 1);
      g.cfg.spin = INTRO.spin; g.setRotation(true);
      g.setInteractive(pNow < 0.004);
    }
    if (svg) { svg.remove(); svg = limb = ticks = null; }
    html.setAttribute("data-r16-live", "");
    if (state === "done") fireDone();
  }

  function skip() {
    if (state !== "run") return;
    if (g && !finished) { closeAt = -9e9; landNow(); }        /* a cut: no flash */
    reveal(INTRO.fast);
  }

  let attached = false, driver = "", rafId = 0, mine = 0, offFrame: (() => void) | null = null, hold: Hold | null = null;
  const doneCbs: (() => void)[] = [];
  let doneFired = false;
  function fireDone() { if (doneFired) return; doneFired = true; doneCbs.splice(0).forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }
  const isDone = () => state == null || (state === "done" && (finished || !g));
  /* the hold (intro-hold.ts) owns input and the hero's scroll transition while the intro plays; it calls skip() (Esc, the hero scrolled away) */
  function start(c: WorldCtx) {
    attach(c);
    if (!hold && !dead) {
      hold = mountHold(c, {
        running: () => state === "run" && !finished,
        skip: () => skip(),
        onDone: (cb) => { if (doneFired || isDone()) { doneFired = true; cb(); } else doneCbs.push(cb); },
      });
    }
    return api;
  }
  function attach(c: WorldCtx) {
    if (attached || dead) return; attached = true;
    ctx = c; g = c.globe; U = g && g.uniforms;
    offs.push(c.progress((p) => { pNow = p; }));
    if (!g || c.reduced) { skip(); return; }
    layout(); makeLayer(c.stage);
    offs.push(g.onFrame(drawLayer));
    offs.push(g.onResize(() => { layout(); sizeLayer(); }));
    offs.push(g.onRebuild(() => landList()));
    if (state !== "run") { endGlobe(); return; }             /* ?intro=0, or the hard timeout came first: the end state at once */
    g.setProgress("draw", 1);                                 /* the dots are all there: the dawn front (uFall) shows them */
    g.setRotation(false); g.setInteractive(false);
    const NS = "http://www.w3.org/2000/svg";
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "r16i-sky"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    ticks = document.createElementNS(NS, "path"); ticks.setAttribute("class", "r16i-ticks");
    limb = document.createElementNS(NS, "path"); limb.setAttribute("class", "r16i-limb");
    svg.appendChild(ticks); svg.appendChild(limb); c.stage.insertBefore(svg, cv);
    flying = true; ticking = true;
    if (g.stats.frames > 0) handOver();
    else {                                                    /* the first frame at once: the choice of cut is made now, not a frame later */
      driver = "raf";
      const loop = (now: number) => { if (!ticking || driver !== "raf" || dead || !g) return; if (g.stats.frames > mine) { handOver(); return; } tick(); g.frame(now); mine++; rafId = requestAnimationFrame(loop); };
      loop(performance.now());
    }
  }
  /* the boot renders now (from gsap.ticker): drive the world BEFORE the globe's own frame in the same tick (no frame of lag) */
  function handOver() {
    cancelAnimationFrame(rafId);
    if (ctx) { driver = "gsap"; ctx.gsap.ticker.add(tick, false, true); }
    else if (g) { driver = "frame"; offFrame = g.onFrame(() => tick()); }
  }
  function stopDriver() {
    if (!ticking) return; ticking = false;
    if (driver === "gsap" && ctx) ctx.gsap.ticker.remove(tick);
    else if (driver === "frame" && offFrame) offFrame();
    cancelAnimationFrame(rafId); driver = "";
  }
  /* the resting state without a flight (skip before the globe existed, ?intro=0) */
  function endGlobe() {
    if (!g || finished) return;
    finished = true; flying = false; closeAt = -9e9;
    g.setProgress("draw", 1);
    g.cfg.spin = INTRO.spin; g.setRotation(true);
    html.setAttribute("data-r16-live", "");
    if (state === "done" || state == null) fireDone();
  }

  const api: Intro = {
    attach, start, skip,
    get state() { return state; },
    dispose() {
      if (dead) return;
      dead = true;
      stopDriver();
      clearTimeout(timer); clearTimeout(revealT);
      hold?.dispose();
      offs.splice(0).forEach((f) => f());
      svg?.remove(); cv?.remove(); svg = limb = ticks = null; cv = null; c2 = null;
      html.style.removeProperty("--r16k");
      mounted = false;
    },
  };
  return api;
}
