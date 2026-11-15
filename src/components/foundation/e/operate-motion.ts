// Foundation E, section 6's motion (markup and geometry: Operate.tsx). On desktop the drawing sticks while the three activities pass; the reading line
// (55% down the screen, where the sticky cursor sits) drives the scene's stage, scrubbed and eased: it builds into 01 as the list arrives, morphs into
// 02 across the first boundary and into 03 across the second. The same line fills the dotted axis and, as it passes each step's tick, turns that
// tick's dotted leader into a straight one. While on screen the scene keeps a slow life of its own (coins run the traces, the held functions bob,
// value runs the ring); the phones' per-step drawings keep that life at their fixed state.
// Reduced motion: no clock and no morph; the drawing simply shows the state of the step being read, and the axis follows.
import type { Mount } from "@/lib/motion/scroll";
import { collect, geo, paint } from "./Operate";

const lin = (a: number, b: number, x: number) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
const NOW = 0.55;   // the reading line, as a share of the screen (operate.css: --fe-now)

export const mountOperateE: Mount = (root, { ScrollTrigger, gsap, reduced }) => {
  const sec = root.querySelector<HTMLElement>(".fe-op");
  const list = sec?.querySelector<HTMLElement>(".fe-op__list"), main = sec?.querySelector<SVGSVGElement>(".fe-op-art--main");
  if (!sec || !list || !main) return;
  const steps = Array.from(sec.querySelectorAll<HTMLElement>(".fe-op__step")), nums = Array.from(sec.querySelectorAll<HTMLElement>(".fe-op__num"));
  const fill = sec.querySelector<HTMLElement>(".fe-op__fill"), count = sec.querySelector<HTMLElement>(".fe-op__ci");
  const art = [{ svg: main, el: collect(main), fixed: NaN, on: true },
    ...Array.from(sec.querySelectorAll<SVGSVGElement>(".fe-op__mfig svg")).map((svg) => ({ svg, el: collect(svg), fixed: +(svg.dataset.stage || 0), on: false }))];
  sec.classList.add("is-story");

  let top = 0, H = 1, ticks: number[] = [], vh = innerHeight;
  const measure = () => {
    vh = innerHeight;
    top = list.getBoundingClientRect().top + scrollY; H = list.offsetHeight;
    ticks = nums.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2 + scrollY - top; });
    art.forEach((a) => { a.on = a.svg.getClientRects().length > 0; });
  };
  const lineY = () => scrollY + vh * NOW - top;   // the reading line, from the top of the list
  // the stage: −1 → 0 as the list arrives, then one unit as each next step's tick comes up to the reading line (done just as it gets there)
  const stageAt = (y: number) =>
    -1 + lin(ticks[0] - vh * 0.85, ticks[0] - vh * 0.1, y) + lin(ticks[1] - vh * 0.42, ticks[1] - vh * 0.04, y) + lin(ticks[2] - vh * 0.42, ticks[2] - vh * 0.04, y);
  let on = -2;
  const ui = (y: number) => {
    if (fill) fill.style.height = `${Math.max(0, Math.min(H, y)).toFixed(1)}px`;
    nums.forEach((n, i) => n.classList.toggle("is-hit", y >= ticks[i]));
    const i = y < ticks[1] - vh * 0.22 ? 0 : y < ticks[2] - vh * 0.22 ? 1 : 2;   // a step is the one being read once its morph is half done
    if (i === on) return false;
    on = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    count?.style.setProperty("--ci", String(i));
    return true;
  };
  measure();

  if (reduced) {
    const st = ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onRefresh: measure,
      onUpdate: () => { if (ui(lineY())) paint(art[0].el, geo(on, 0)); } });
    if (ui(lineY())) paint(art[0].el, geo(on, 0));
    return () => { st.kill(); sec.classList.remove("is-story"); };
  }

  let s = stageAt(lineY()), time = 0, alive = false;
  ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onToggle: (t) => { alive = t.isActive; }, onRefresh: () => { measure(); alive = ScrollTrigger.isInViewport(sec); } });
  const tick = (_t: number, dt: number) => {
    if (!alive) return;
    time += dt / 1000;
    const y = lineY();
    s += (stageAt(y) - s) * (1 - Math.pow(0.88, dt / 16.7));
    ui(y);
    for (const a of art) if (a.on) paint(a.el, geo(Number.isNaN(a.fixed) ? s : a.fixed, time));
  };
  ui(lineY()); paint(art[0].el, geo(s, 0));
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); sec.classList.remove("is-story"); if (fill) fill.style.height = ""; };
};
