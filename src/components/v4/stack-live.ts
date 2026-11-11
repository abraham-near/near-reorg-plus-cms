// Home v4 · the Stack's drawing, alive (v4 only; v1's drawing stays still). Once the build-in has finished (data-build = 3, plus the last ring's settle) the four layers keep moving
// while the drawing is on screen, several loops of different periods, out of phase:
//   - the three rings float along the iso vertical (3 / 4 / 5 units, 5.4 / 6.9 / 8.6 s), the pillar (the core) stays put. Done with the CSS `translate` property on each ring's
//     .stk-b, which composes with (never replaces) the build's `transform` on .stk-b and the lift's `transform` on .stk-c; the pillar's cover clips have ~16 units of slack, so the rings
//     stay correctly tucked behind the pillar;
//   - green packets (iso squares, with a small echo) run around each ring along its top faces' centreline, dropping down / climbing up the corner posts (6.2 / 7.8 / 9.0 s a lap, 2 / 2 / 3
//     packets, alternating direction). They live inside the ring's own group, so the pillar's covers and the rings in front hide them where they pass behind;
//   - two light bands rise up the pillar's sides (4.2 s and 6.6 s), clipped to the side faces and copied into each pillar cover so they stay continuous where the rings cross; the first one
//     lights the pillar's top face as it arrives;
//   - a soft glint sweeps down across every ring's (visible) top faces (8.4 s).
// The effects belong to their layer: when a layer is highlighted (data-hl) the dimmed layers' effects fade out. Nothing listens to the pointer (pointer-events: none), so hover / click /
// the selected ring's lift work as before. Paused off screen (IntersectionObserver), never mounted with reduced motion, stops if the OS setting turns on. One rAF loop: no layout reads,
// no allocation per frame (SVGTransform.setTranslate, precomputed strings for the rest). Everything added is removed on dispose.
import type { V1Ctx, Dispose } from "../v1/ctx";

const NS = "http://www.w3.org/2000/svg";
const TAU = Math.PI * 2;
const SETTLE = 1300;                                   /* ms after data-build reaches 3: the last ring's fade (1.2 s) is done */
let uid = 0;

/* each ring's loop on its top faces (StackIso's geometry): back corner, right corner (post top), right corner (post foot), front corner, left foot, left top */
const LOOPS: Record<string, number[]> = {
  intents: [0, 200.8, 136.4, 279.55, 136.4, 313.55, 0, 392.3, -136.4, 313.55, -136.4, 279.55],
  ai: [0, 107.65, 214.55, 231.55, 214.55, 364.05, 0, 487.85, -214.55, 364.05, -214.55, 231.55],
  com: [0, 12.45, 295.4, 183.05, 295.4, 412.55, 0, 583.05, -295.4, 412.55, -295.4, 183.05],
};
/* float: amplitude (units), period (s), phase (rad); packets: lap (s), count, direction */
const RINGS = [
  { tone: "intents", amp: 3, per: 5.4, ph: 0, lap: 6.2, n: 2, dir: 1 },
  { tone: "ai", amp: 4, per: 6.9, ph: 2.2, lap: 7.8, n: 2, dir: -1 },
  { tone: "com", amp: 5, per: 8.6, ph: 4.3, lap: 9.0, n: 3, dir: 1 },
];
const PULSES = [
  { per: 4.2, travel: 2.4, off: 0, cls: "" },
  { per: 6.6, travel: 3.6, off: 2.9, cls: " stk-live-pulse--b" },
];
const GLINT = { per: 8.4, travel: 2.8, off: 5.2 };
const ECHO = 15;                                       /* units behind its packet */

/* precomputed strings: the float's `translate` (0.05-unit steps) and opacities (1 % steps) */
const QSTEP = 0.05, QMAX = 120;
const TRANSLATE = Array.from({ length: QMAX * 2 + 1 }, (_, i) => `0px ${((i - QMAX) * QSTEP).toFixed(2)}px`);
const OPACITY = Array.from({ length: 101 }, (_, i) => String(i / 100));

const easeInOut = (k: number) => 0.5 - 0.5 * Math.cos(Math.PI * k);
const pts = (el: Element | null) => (el?.getAttribute("points") ?? "").trim().split(/[\s,]+/).map(Number);

type Path = { xs: Float32Array; ys: Float32Array; cum: Float32Array; total: number };
const toPath = (p: number[]): Path => {
  const n = p.length / 2, xs = new Float32Array(n + 1), ys = new Float32Array(n + 1), cum = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    xs[i] = p[(i % n) * 2]; ys[i] = p[(i % n) * 2 + 1];
    if (i) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  }
  return { xs, ys, cum, total: cum[n] };
};
/* a point at arc length s on a closed path, written to the transform (no allocation) */
const place = (tr: SVGTransform, P: Path, s: number) => {
  s %= P.total; if (s < 0) s += P.total;
  let i = 1;
  while (i < P.cum.length - 1 && P.cum[i] < s) i++;
  const a = P.cum[i - 1], k = (s - a) / (P.cum[i] - a || 1);
  tr.setTranslate(P.xs[i - 1] + (P.xs[i] - P.xs[i - 1]) * k, P.ys[i - 1] + (P.ys[i] - P.ys[i - 1]) * k);
};

export function mountStackLive(root: HTMLElement, svg: SVGSVGElement, ctx: V1Ctx): Dispose {
  const html = document.documentElement;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (ctx.reduced || html.hasAttribute("data-rm") || mq.matches) return () => {};
  const defs = svg.querySelector("defs");
  const [core, icon] = svg.querySelectorAll<SVGGElement>('.stk-c[data-li="0"]');
  const coreB = core?.querySelector<SVGGElement>(".stk-b"), iconB = icon?.querySelector<SVGGElement>(".stk-b");
  if (!defs || !coreB || !iconB) return () => {};

  const id = `stk-live-${++uid}`;
  const added: Element[] = [];
  const mk = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    parent?.appendChild(el);
    return el;
  };
  const tracked = <T extends Element>(el: T, parent: Element, before?: Node | null) => { parent.insertBefore(el, before ?? null); added.push(el); return el; };
  const translator = (el: SVGGraphicsElement) => { el.transform.baseVal.appendItem(svg.createSVGTransform()); return el.transform.baseVal.getItem(0); };

  /* shared defs: the pillar's side faces (the bands' clip) and the glint's soft edge */
  const sides = tracked(mk("clipPath", { id: `${id}-sides` }), defs);
  for (const f of coreB.querySelectorAll(".stk-l, .stk-r")) mk("polygon", { points: f.getAttribute("points") ?? "" }, sides);
  const H = 16, nx = -0.5 * H, ny = 0.866 * H, L = 480, ux = 0.866 * L, uy = 0.5 * L;   /* band: edges along the iso axis (slope +30°), 2H across */
  const grad = tracked(mk("linearGradient", { id: `${id}-glint`, gradientUnits: "userSpaceOnUse", x1: -nx, y1: -ny, x2: nx, y2: ny }), defs);
  [0, 0.5, 1].forEach((o) => mk("stop", { offset: o, "stop-opacity": o === 0.5 ? 0.42 : 0, class: "stk-live-stop" }, grad));
  const bandPts = `${-ux - nx},${-uy - ny} ${ux - nx},${uy - ny} ${ux + nx},${uy + ny} ${-ux + nx},${-uy + ny}`;

  /* the pillar's rising bands: one copy over the pillar itself and one in each cover (so they stay continuous where a ring passes behind) */
  const pulseTr: SVGTransform[][] = PULSES.map(() => []);
  const addPulses = (parent: Element) => {
    const fx = tracked(mk("g", { class: "stk-live-fx" }), parent);
    const clip = mk("g", { "clip-path": `url(#${id}-sides)` }, fx);
    PULSES.forEach((p, i) => {
      const g = mk("g", { class: "stk-live-pulse" + p.cls }, clip);
      mk("polyline", { points: "-58,0 0,33.5 58,0", class: "stk-live-pulse-glow" }, g);
      mk("polyline", { points: "-58,0 0,33.5 58,0", class: "stk-live-pulse-line" }, g);
      const tr = translator(g); tr.setTranslate(0, 760); pulseTr[i].push(tr);
    });
  };
  addPulses(coreB);
  svg.querySelectorAll(".stk-cover").forEach(addPulses);
  /* the top face lights as the first band arrives (under the core's icon, over every cover) */
  const flashFx = tracked(mk("g", { class: "stk-live-fx" }), iconB, iconB.firstChild);
  const flash = mk("polygon", { points: coreB.querySelector(".stk-t")?.getAttribute("points") ?? "", class: "stk-live-flash", opacity: 0 }, flashFx);

  /* the rings: float, glint (clipped to the top faces that show), packets */
  type R = { b: SVGGElement; amp: number; per: number; ph: number; q: number; band: SVGTransform | null; pk: SVGTransform[]; s0: number[]; speed: number; P: Path };
  const rings: R[] = [];
  for (const cfg of RINGS) {
    const b = svg.querySelector<SVGGElement>(`.stk-c[data-tone="${cfg.tone}"] > .stk-b`);
    if (!b) continue;
    const blocks = [...b.children].filter((c) => c.tagName === "g").map((g) => {
      const t = g.querySelector(".stk-t"), p = pts(t);
      let maxY = -Infinity;
      g.querySelectorAll(".stk-l, .stk-r").forEach((s) => pts(s).forEach((v, i) => { if (i % 2) maxY = Math.max(maxY, v); }));
      return { t, cx: (p[0] + p[2] + p[4] + p[6]) / 4, cy: (p[1] + p[3] + p[5] + p[7]) / 4, maxY };
    });
    /* a top face is hidden when a later block of the same post sits on it */
    const tops = blocks.filter((a, i) => a.t && !blocks.some((o, j) => j > i && Math.abs(o.cx - a.cx) < 1 && o.cy < a.cy && o.maxY >= a.cy - 1));
    const clip = tracked(mk("clipPath", { id: `${id}-${cfg.tone}` }), defs);
    tops.forEach((a) => mk("polygon", { points: a.t?.getAttribute("points") ?? "" }, clip));

    const fx = tracked(mk("g", { class: "stk-live-fx" }), b);
    const gl = mk("g", { "clip-path": `url(#${id}-${cfg.tone})` }, fx);
    const band = mk("polygon", { points: bandPts, fill: `url(#${id}-glint)`, class: "stk-live-glint" }, gl);
    const bandTr = translator(band); bandTr.setTranslate(0, 900);
    const P = toPath(LOOPS[cfg.tone]);
    const pk: SVGTransform[] = [], s0: number[] = [];
    for (let i = 0; i < cfg.n; i++) {
      const start = (P.total * i) / cfg.n;
      const echo = mk("polygon", { points: "0,-2.3 4,0 0,2.3 -4,0", class: "stk-live-pk stk-live-pk--echo" }, fx);
      const head = mk("polygon", { points: "0,-4 7,0 0,4 -7,0", class: "stk-live-pk" }, fx);
      pk.push(translator(echo), translator(head)); s0.push(start - ECHO * cfg.dir, start);
    }
    rings.push({ b, amp: cfg.amp, per: cfg.per, ph: cfg.ph, q: 0, band: bandTr, pk, s0, speed: (P.total / cfg.lap) * cfg.dir, P });
  }

  /* the loop */
  let raf = 0, prev = -1, t = 0, env = 0, live = false, visible = false, built = false, armT = 0, flashQ = 0, done = false;
  const frame = (now: number) => {
    raf = 0;
    const dt = prev < 0 ? 0 : Math.min(0.05, (now - prev) / 1000);
    prev = now; t += dt;
    env = live ? Math.min(1, env + dt / 1.4) : Math.max(0, env - dt / 0.7);
    const e = env * env * (3 - 2 * env);
    for (let r = 0; r < rings.length; r++) {
      const R = rings[r];
      const q = Math.max(-QMAX, Math.min(QMAX, Math.round((e * R.amp * Math.sin((TAU * t) / R.per + R.ph)) / QSTEP)));
      if (q !== R.q) { R.q = q; R.b.style.setProperty("translate", TRANSLATE[q + QMAX]); }
      for (let i = 0; i < R.pk.length; i++) place(R.pk[i], R.P, R.s0[i] + R.speed * t);
    }
    for (let i = 0; i < PULSES.length; i++) {
      const p = PULSES[i], ph = (t + p.off) % p.per;
      const y = ph < p.travel ? 700 - 740 * easeInOut(ph / p.travel) : 760;   /* from under the foot to over the top edge; clipped to the sides */
      for (let c = 0; c < pulseTr[i].length; c++) pulseTr[i][c].setTranslate(0, y);
      if (i === 0) {
        const since = ph - p.travel * 0.85;                                  /* the band clears the top edge at ~85 % of its rise */
        const fq = since < 0 ? 0 : Math.round(30 * Math.exp(-since * 3));
        if (fq !== flashQ) { flashQ = fq; flash.setAttribute("opacity", OPACITY[fq]); }
      }
    }
    const gph = (t + GLINT.off) % GLINT.per;
    const gy = gph < GLINT.travel ? -80 + 800 * easeInOut(gph / GLINT.travel) : 900;
    for (let r = 0; r < rings.length; r++) rings[r].band?.setTranslate(0, gy);
    if (visible && (live || env > 0)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !done && visible && (live || env > 0)) { prev = -1; raf = requestAnimationFrame(frame); } };
  const setLive = (v: boolean) => {
    if (live === v) return;
    live = v; root.classList.toggle("stk-live-on", v); kick();
  };
  const readBuild = () => {
    const b = root.getAttribute("data-build"), now = b === null || b === "3";
    if (now === built) return;
    built = now; clearTimeout(armT);
    if (built) armT = window.setTimeout(() => setLive(true), SETTLE); else setLive(false);
  };
  const mo = new MutationObserver(readBuild);
  mo.observe(root, { attributes: true, attributeFilter: ["data-build"] });
  const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; kick(); });
  io.observe(svg);
  const onRM = () => { if (mq.matches) dispose(); };
  mq.addEventListener("change", onRM);
  readBuild();

  function dispose() {
    if (done) return; done = true;
    cancelAnimationFrame(raf); clearTimeout(armT); mo.disconnect(); io.disconnect();
    mq.removeEventListener("change", onRM);
    root.classList.remove("stk-live-on");
    rings.forEach((R) => R.b.style.removeProperty("translate"));
    added.forEach((el) => el.remove());
  }
  ctx.signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}
