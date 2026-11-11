// Revenue option B's motion.
//   - desktop (≥ 860 × 700, motion on): the stage sticks for 100 vh more (.is-pin). Over the first ~60 % of that hold the dark (the Stack's ground, full bleed)
//     contracts to the screen's rect, scrubbed and eased (clip-path inset, from the viewport's edges to the grid's): the paper shows round it, the heading is
//     wiped from dark to paper, the corner crosshairs land (--rvb-k). The header reads the heading as dark until the dark's edge has passed under it.
//   - the figures fill once, when the screen settles (desktop) or comes into view (phones): the counts run up, the bars rise, the line draws, the gauge fills.
//   - reduced motion, or arriving from below: the settled state with the final values, as the markup has it.
import type { MotionCtx } from "@/lib/motion/scroll";

const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
  const stage = q(".rvb-stage"), track = q(".rvb-track"), dark = q(".rvb-dark"), screen = q(".rvb-screen");
  const head = q(".rvb-head:not(.rvb-head--ghost)"), total = q(".rvb-total"), chart = q(".rvb-chart");
  if (!stage || !track || !dark || !screen || !head || !total || !chart) return;
  const ac = new AbortController();

  // the screen's inner crosshairs sit on its row lines
  const rows = () => {
    root.style.setProperty("--rvb-r1", `${total.offsetTop}px`);
    root.style.setProperty("--rvb-r2", `${chart.offsetTop}px`);
  };
  rows();
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = window.setTimeout(rows, 120); }, { signal: ac.signal });
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) { rows(); ScrollTrigger.refresh(); } });

  /* ── the figures ── */
  const counts = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  const figs = root.querySelectorAll<HTMLElement>(".rvb-big, .rvb-dial__v, .rvb-30__figs dd");
  const bars = root.querySelectorAll<SVGRectElement>(".rvb-bar-m");
  const line = q<SVGPathElement>(".rvb-line"), area = q<SVGPathElement>(".rvb-area"), end = q(".rvb-end");
  const gauge = q<SVGPathElement>("[data-gauge]"), mark = q<SVGLineElement>(".rvb-dial__mark"), ratio = q(".rvb-ratio i");
  const show = (el: HTMLElement, v: number) => { el.textContent = `${el.dataset.pre || ""}${v.toFixed(Number(el.dataset.dec || 0))}${el.dataset.suf || ""}`; };
  // already past it (a reload or a jump from below): nothing waits
  let played = reduced || root.getBoundingClientRect().bottom < innerHeight;
  if (!played) {
    counts.forEach((el) => show(el, 0));
    gsap.set(figs, { autoAlpha: 0, y: 14 });
    gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
    if (line) gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set([area, end, mark].filter(Boolean), { autoAlpha: 0 });
    if (gauge) gsap.set(gauge, { strokeDasharray: "0 100" });
    if (ratio) gsap.set(ratio, { scaleX: 0 });
  }
  const play = () => {
    if (played) return; played = true;
    gsap.to(figs, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 });
    counts.forEach((el, i) => {
      const o = { v: 0 }, to = Number(el.dataset.to);
      gsap.to(o, { v: to, duration: 1.8, delay: 0.1 + i * 0.1, ease: "expo.out", onUpdate: () => show(el, o.v), onComplete: () => show(el, to) });
    });
    gsap.to(bars, { scaleY: 1, duration: 0.8, ease: "power3.out", stagger: 0.045, delay: 0.2 });
    if (line) gsap.to(line, { strokeDashoffset: 0, duration: 1.7, ease: "power2.inOut", delay: 0.45 });
    if (area) gsap.to(area, { autoAlpha: 1, duration: 0.8, delay: 1.6 });
    if (end) gsap.fromTo(end, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)", delay: 2.05 });
    if (gauge) gsap.to(gauge, { strokeDasharray: `${gauge.dataset.gauge} 100`, duration: 1.6, ease: "expo.out", delay: 0.3 });
    if (mark) gsap.to(mark, { autoAlpha: 1, duration: 0.4, delay: 1.1 });
    if (ratio) gsap.to(ratio, { scaleX: 1, duration: 1.4, ease: "expo.out", delay: 0.6 });
  };
  if (reduced) return () => ac.abort();

  const mm = gsap.matchMedia();
  /* ── desktop: the stage holds while the dark contracts to the screen ── */
  mm.add("(min-width: 860px) and (min-height: 700px)", () => {
    root.classList.add("is-pin");
    const ins = { t: 0, r: 0, b: 0, l: 0 };
    const measure = () => {
      const sw = stage.clientWidth, sh = stage.clientHeight;
      ins.t = screen.offsetTop; ins.l = screen.offsetLeft;
      ins.r = sw - ins.l - screen.offsetWidth; ins.b = sh - ins.t - screen.offsetHeight;
      rows(); last = "";
    };
    const ease = gsap.parseEase("power3.inOut");
    const P = { p: 0 };
    let last = "", tone = "";
    const apply = () => {
      const e = ease(c01((P.p - 0.05) / 0.58));
      const v = `inset(${(ins.t * e).toFixed(1)}px ${(ins.r * e).toFixed(1)}px ${(ins.b * e).toFixed(1)}px ${(ins.l * e).toFixed(1)}px)`;
      if (v !== last) { last = v; dark.style.clipPath = v; root.style.setProperty("--rvb-k", e.toFixed(3)); }
      // the header pill: dark while the dark still covers the top of the heading
      const t = ins.t * e > 76 ? "light" : "dark";
      if (t !== tone) { tone = t; head.setAttribute("data-nav-tone", t); }
      if (e > 0.97) play();
    };
    measure(); apply();
    gsap.to(P, {
      p: 1, ease: "none", onUpdate: apply,
      scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.35, onRefresh: () => { measure(); apply(); } },
    });
    return () => {
      root.classList.remove("is-pin"); root.style.removeProperty("--rvb-k");
      dark.style.clipPath = ""; head.setAttribute("data-nav-tone", "light");
      requestAnimationFrame(rows);
    };
  });
  /* ── phones, short screens: no hold; the figures fill as the screen comes in ── */
  mm.add("(max-width: 859px), (max-height: 699px)", () => {
    ScrollTrigger.create({ trigger: screen, start: "top 72%", once: true, onEnter: play });
  });

  return () => { ac.abort(); clearTimeout(rz); mm.revert(); };
}
