/* r17 v1 js/railglobe.js · the rail's background world: the hero's dot globe (world/globe.ts, a SECOND, independent instance) seen as a huge planet whose upper-left limb arcs across the top half of
 * the rail; the rest of the sphere runs off to the right and below. It lives in .rs__globe, the LOWEST layer of the stage (under .rs__cv), a box from the stage's top to the green line (--rail-y):
 * the box clips it, so nothing of it is ever under the line (a horizon).
 *
 * A pure function of the rail's playhead (rail/layer.ts writes these numbers through update() from apply()):
 *   enter  the section's approach (S.enter) + its soft edge (EG, stage px): the globe sweeps in left -> right with the line and the phrases (a CSS mask on the box, like the .sw items)
 *   spin   0..1 over units 0 -> 95.2 (the thesis -> the end of "Own your identity."): HALF a turn, eased in and out (sine), and the drawn yaw follows the wanted one with a little inertia
 *          (it glides after the scroll stops, then rests: no scroll = no motion once settled). Reversible.
 *   out    0..1 over 92.3 -> 95.2 (with identity's words and drawing): the globe fades out, before the tide (95.8)
 *   quiet  0..1 the viewfinder's lock (I.fin.a): the dots behind the station's drawing go quieter (opts.quiet = the viewfinder element, its untransformed box)
 * Cheap: frozen (no spin, no pointer), raf: false; a frame is rendered only when the section is on screen AND the wanted state (yaw, alpha) or the size changed, at most once per animation
 * frame. Off screen / alpha 0: nothing is drawn, the box is hidden.
 *
 * v4 (LIVE: the stage is inside .layer--v4, and no reduced motion): the world is alive. It turns on its own at RG.live.base (a full turn in ~150 s, the same way as the scrub) the whole
 * time it is seen, and the scroll ADDS to it: the scrubbed turn is kept at RG.live.scrub of the half turn (followed with RG.lag), plus a flywheel: each scrolled radian of that scrub
 * kicks the speed by RG.live.kick rad/s (capped at RG.live.vmax), and the kick decays back to the base drift at RG.live.decay /s (kick = decay: the flywheel adds as much again as the
 * scrub, so the scroll's total share is still about the half turn). Scrolling back up runs it backwards for a moment; the drift itself never stops. A rAF loop, dt-based, that runs
 * only while the section is on screen, the world is visible (alpha > 0, the sweep has reached it) and the tab is shown; capped near 60 fps on faster displays (RG.live.minMs).
 * Not v4 (v1/v3): exactly the scroll-only behaviour above. */
import type { Globe } from "../world/globe";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const s01 = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export const RG = {
  alpha: 0.14, alphaM: 0.1,             /* the faint world's overall alpha (the hero's palette: land ink, sea pale, both at this fraction); phones: the sphere fills more of the screen, so less */
  dots: { desktop: 460000, mobile: 100000 },  /* finer and denser than the hero's (24000 on a sphere ~6.5x smaller; lattice build ~100 ms, once)... */
  gg: { d: 4.3, m: 3.8 },               /* ...and the dots do NOT grow with the zoom: uSize sets the dot scale (uGG x uSize, px) */
  sea: 0.8,                             /* the sea dots a touch quieter than the hero's (uSea): up close they are many, the land must still read over them */
  yaw0: 2.07 - 0.9,                     /* where the turn starts (mode A rests at 2.07): land on the visible limb */
  turn: -Math.PI,                       /* half a turn, the other way */
  pitch: 0, roll: 0,                    /* the camera straight in front */
  lag: 3.2,                             /* the inertia (1/s): the drawn yaw closes this fast on the scrolled one */
  /* the framing, in fractions of the box (W x the height above the line): the centre at cx (x W); the limb meets the line at xL (x W) and tops out at yT (x H) */
  d: { cx: 1.0, xL: 0.12, yT: 0.09 },
  m: { cx: 1.04, xL: 0.0, yT: 0.11 },
  edge: { L: 90, F: 380 },              /* the enter sweep's soft edge (px): lead, feather */
  knock: 0.55,                          /* behind a station's drawing (the viewfinder's box, while it is locked on) the dots go this much quieter (the engine's uKnock / uBox, 30 px feather) */
  /* v4 only (LIVE): the world's own life */
  live: {
    base: (2 * Math.PI) / 150,          /* the drift (rad/s): a full turn in 150 s, always, in the scrub's direction (RG.turn's sign) */
    scrub: 0.5,                         /* the scrubbed share of the half turn (position-bound, follows the scroll with RG.lag) */
    kick: 1.2,                          /* the flywheel: rad/s of extra speed per radian the scrub target moves (signed: scrolling back up pushes the other way) */
    decay: 1.2,                         /* ...which eases back to the base drift at this rate (1/s; half-life ~0.6 s) */
    vmax: 0.5,                          /* the kick's cap (rad/s, ~12x the drift): a fling or a jump never whips it round */
    minMs: 12.5,                        /* the frame cap: skip a rAF closer than this to the last drawn one (120 Hz -> 60 fps, 144 Hz -> 72, 60 Hz -> every frame) */
  },
};

export function boxFor(W: number, H: number) {
  const f = W <= 760 ? RG.m : RG.d, cx = f.cx * W, dx = cx - f.xL * W, yT = f.yT;
  /* the circle through (xL W, H) whose top is at yT H: cy from (cx - xL W)^2 + (cy - H)^2 = (cy - yT H)^2; at least H (only the upper-left quarter shows) */
  let cy = (dx * dx + H * H * (1 - yT * yT)) / (2 * H * (1 - yT));
  cy = Math.max(cy, H * 1.02);
  return { cx, cy, r: cy - yT * H };
}

export type RailGlobe = { update: (enter: number, eg: number, spin: number, out: number, quiet?: number) => void; dispose: () => void };

export function mountRailGlobe(stageEl: HTMLElement, opts: { quiet?: HTMLElement | null } = {}): RailGlobe {
  const wrap = document.createElement("div"); wrap.className = "rs__globe"; wrap.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); wrap.appendChild(cv);
  stageEl.prepend(wrap);                                      /* first child: under .rs__cv and everything else */
  const want = { yaw: RG.yaw0, alpha: 0, knock: 0 };
  let cur = RG.yaw0, lastT = 0;                               /* the drawn yaw (it follows want.yaw with RG.lag) */
  const drawn = { yaw: NaN, alpha: NaN, knock: NaN };
  let g: Globe | null = null, on = false, dirty = true, q = 0, lastE: number | null = null, lastOpen: boolean | null = null, lastVis: boolean | null = null, dead = false;

  const draw = () => {
    q = 0;
    if (!g || !on || dead) return;
    const now = performance.now(), dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60; lastT = now;
    const gap = want.yaw - cur;
    cur = Math.abs(gap) < 1e-4 ? want.yaw : cur + gap * (1 - Math.exp(-dt * RG.lag));
    if (!dirty && Math.abs(drawn.yaw - cur) < 1e-5 && Math.abs(drawn.alpha - want.alpha) < 1e-4 && Math.abs(drawn.knock - want.knock) < 1e-3) { lastT = 0; return; }
    g.setView({ yaw: cur, pitch: RG.pitch });
    g.set({ uAlpha: want.alpha, uKnock: want.knock });
    g.frame(performance.now());
    drawn.yaw = cur; drawn.alpha = want.alpha; drawn.knock = want.knock; dirty = false;
    if (cur !== want.yaw) schedule(); else lastT = 0;            /* keep gliding until it rests */
  };

  /* v4: the live world (see the header). yaw = yaw0 + drift (its own turn + the flywheel, integrated) + sc (the scrubbed share, gliding on scT) */
  const LIVE = !!stageEl.closest(".layer--v4") && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const L = RG.live, dir = Math.sign(RG.turn) || 1, TAU = 2 * Math.PI;
  let drift = 0, sc = 0, scT = 0, kv = 0, lastScT: number | null = null;
  const canRun = () => !!g && on && !dead && lastVis === true && !document.hidden;
  const live = (now: number) => {
    q = 0;
    const gg = g;
    if (!gg || !canRun()) { lastT = 0; return; }               /* paused: schedule() restarts it (update / the observer / the tab coming back / a resize) */
    if (lastT && now - lastT < L.minMs) { q = requestAnimationFrame(live); return; }
    const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0; lastT = now;
    drift = (drift + (dir * L.base + kv) * dt) % TAU;            /* the drift never stops; the kick rides on it... */
    kv *= Math.exp(-dt * L.decay);                               /* ...and eases back to it */
    sc += (scT - sc) * (1 - Math.exp(-dt * RG.lag));
    cur = RG.yaw0 + drift + sc;
    gg.setView({ yaw: cur, pitch: RG.pitch });
    gg.set({ uAlpha: want.alpha, uKnock: want.knock });
    gg.frame(now);
    drawn.yaw = cur; drawn.alpha = want.alpha; drawn.knock = want.knock; dirty = false;
    q = requestAnimationFrame(live);
  };
  const onVis = () => { if (!document.hidden) schedule(); };
  if (LIVE) document.addEventListener("visibilitychange", onVis);

  const schedule = () => {
    if (q || dead) return;
    if (LIVE) { if (canRun()) q = requestAnimationFrame(live); return; }
    q = requestAnimationFrame(draw);
  };

  import("../world/globe")
    .then(({ createGlobe }) => createGlobe(cv, { box: { cx: 0, cy: 0, r: 1 }, mode: "A", dots: RG.dots, dpr: 1.5, stage: wrap, host: wrap, frozen: true, intro: false, raf: false }))
    .then((gg) => {
      if (dead) { gg.destroy(); return; }
      g = gg;
      g.setInteractive(false); g.setRotation(false);
      g.cfg.roll = RG.roll; g.setView({ yaw: cur, pitch: RG.pitch });   /* the camera straight in front */
      g.set({ uSea: RG.sea, uAlpha: 0 });
      const frame = () => {
        if (!g) return;
        g.setBox(boxFor(g.size.W, g.size.H));
        g.set({ uSize: Math.min(1, (g.size.W <= 760 ? RG.gg.m : RG.gg.d) / g.uniforms.uGG.value) });   /* uGG follows the box (R x the lattice step): cancel the growth */
        /* the quiet box: the viewfinder's layout box (offset* ignore its scale), in .rs px = this box's px (both at the stage's top left) */
        const q2 = opts.quiet, b = g.uniforms.uBox.value[0];
        if (q2 && q2.offsetWidth) b.set(q2.offsetLeft, q2.offsetTop, q2.offsetLeft + q2.offsetWidth, q2.offsetTop + q2.offsetHeight); else b.set(9e4, 9e4, 9e4, 9e4);
      };
      frame();
      g.onResize(() => { frame(); dirty = true; schedule(); });
      g.pause(!on); dirty = true; schedule();
      wrap.setAttribute("data-ready", "");
    })
    .catch((e) => { console.warn("[railglobe] no background world", e); wrap.remove(); g = null; });

  const io = new IntersectionObserver((es) => { on = es.some((x) => x.isIntersecting); if (g) g.pause(!on); if (on) { dirty = true; schedule(); } });
  io.observe(wrap);

  return {
    /* from layer.ts apply(): enter (S.enter 0..1), eg (the rail's edge, stage px), spin (0..1: the turn), out (0..1: the exit), quiet (0..1: the viewfinder's lock) */
    update(enter, eg, spin, out, quiet = 0) {
      if (dead) return;
      want.yaw = RG.yaw0 + RG.turn * (0.5 - 0.5 * Math.cos(Math.PI * clamp(spin, 0, 1))); want.knock = RG.knock * clamp(quiet, 0, 1);
      if (LIVE) {
        scT = L.scrub * (want.yaw - RG.yaw0);
        if (lastScT === null) sc = scT;                          /* the first call (maybe mid-rail after a reload): start there, no glide in */
        else kv = clamp(kv + L.kick * (scT - lastScT), -L.vmax, L.vmax);
        lastScT = scT;
      }
      want.alpha = (innerWidth <= 760 ? RG.alphaM : RG.alpha) * (1 - s01(out)) * (enter > 0 ? 1 : 0);
      /* the enter sweep: the opaque part ends at e - F (as the .sw masks); open once the approach is done */
      const open = enter >= 1, e = open ? -1 : Math.round(Math.max(0, eg - RG.edge.L));
      if (open !== lastOpen) { lastOpen = open; wrap.classList.toggle("is-open", open); }
      if (!open && e !== lastE) { lastE = e; wrap.style.setProperty("--e", e + "px"); wrap.style.setProperty("--f", RG.edge.F + "px"); }
      const vis = want.alpha > 0.002 && (open || e > 0);
      if (vis !== lastVis) { lastVis = vis; wrap.style.visibility = vis ? "" : "hidden"; }
      schedule();
    },
    dispose() {
      if (dead) return; dead = true;
      if (q) cancelAnimationFrame(q); q = 0;
      io.disconnect();
      if (LIVE) document.removeEventListener("visibilitychange", onVis);
      if (g) { g.destroy(); g = null; }
      wrap.remove();
    },
  };
}
