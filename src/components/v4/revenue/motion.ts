// The revenue band's figures, once, when the band is well in view: the counts run up from 0, the bars rise one after another, the cumulative line draws
// over them, the gauge fills to its share. Reduced motion (or arriving from below, scrolled past): the final state, as the markup has it.
import type { MotionCtx } from "@/lib/motion/scroll";

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  if (reduced || root.getBoundingClientRect().top < innerHeight * 0.4) return;
  const counts = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  const bars = root.querySelectorAll<SVGRectElement>(".rv-bar"), line = root.querySelector<SVGPathElement>(".rv-line"), gauge = root.querySelector<SVGPathElement>("[data-gauge]");
  const show = (el: HTMLElement, v: number) => { el.textContent = `${el.dataset.pre || ""}${v.toFixed(Number(el.dataset.dec || 0))}${el.dataset.suf || ""}`; };
  counts.forEach((el) => show(el, 0));
  gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
  if (line) gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
  if (gauge) gsap.set(gauge, { strokeDasharray: "0 100" });

  const run = () => {
    counts.forEach((el, i) => {
      const o = { v: 0 }, to = Number(el.dataset.to);
      gsap.to(o, { v: to, duration: 1.8, delay: 0.25 + i * 0.12, ease: "expo.out", onUpdate: () => show(el, o.v) });
    });
    gsap.to(bars, { scaleY: 1, duration: 0.9, ease: "power3.out", stagger: 0.05, delay: 0.35 });
    if (line) gsap.to(line, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: 0.6 });
    if (gauge) gsap.to(gauge, { strokeDasharray: `${gauge.dataset.gauge} 100`, duration: 1.6, ease: "expo.out", delay: 0.4 });
  };
  const st = ScrollTrigger.create({ trigger: root.querySelector(".rv-a") || root, start: "top 70%", once: true, onEnter: run });
  return () => st.kill();
}
