// Revenue A's motion. The shutter: a sheet of the Stack's ink over the section's top (at least its heading row), whose height (--rva-h) rolls to 0 as
// the section comes up. Desktop: scrubbed, eased (sine.inOut), from the section's top at 80 % of the view to 5 %: the edge climbs the screen from below
// its foot to the Stack's, about 1.4× the page's speed. Phones (< 860 px): it rolls up on its own (1.1 s) once the section's top passes 72 %.
// The header reads the band as dark while the shutter is under it (data-nav-tone). Then, once, as the bento arrives: the figures count up, the bars
// rise, the cumulative line draws, the dial fills, the isometric arrives and then loops while in view (./iso-motion.ts). Reduced motion: no shutter, the final values (the markup's). Rows, rules, crosshairs: ProofDeeper's.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIso } from "./iso-motion";

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  if (reduced) return;
  const sh = root.querySelector<HTMLElement>(".rva-sh"), head = root.querySelector<HTMLElement>(":scope > .rva-head");
  const kills: (() => void)[] = [];

  /* ── the shutter ── */
  if (sh && head) {
    root.setAttribute("data-shut", "");
    const ease = gsap.parseEase("sine.inOut");
    let h0 = 0, last = -1, tone = "";
    const HEADER_Y = 44;   // about the middle of the header's pill
    const setTone = (h: number) => {
      const top = root.getBoundingClientRect().top, t = top < HEADER_Y && top + h > HEADER_Y ? "dark" : "light";
      if (t !== tone) { tone = t; root.setAttribute("data-nav-tone", t); }
    };
    const set = (h: number) => {
      h = Math.max(0, h);
      if (Math.abs(h - last) > 0.25 || (h === 0 && last !== 0)) {
        last = h; sh.style.setProperty("--rva-h", h.toFixed(1) + "px");
        sh.style.setProperty("--rva-e", Math.min(1, h / 40).toFixed(3));   // the edge fades as it folds into the Stack's foot
        sh.classList.toggle("is-up", h === 0);
      }
      setTone(h);
    };
    const START = 0.8, END = 0.05;
    const measure = () => { h0 = Math.max(head.offsetHeight + 2, innerHeight * (1.1 - START)); };

    if (innerWidth >= 860) {
      const st = ScrollTrigger.create({
        trigger: root, start: `top ${START * 100}%`, end: `top ${END * 100}%`,
        onUpdate: (s) => set((1 - ease(s.progress)) * h0),
        onRefreshInit: measure,
        onRefresh: (s) => set((1 - ease(s.progress)) * h0),
      });
      measure(); set((1 - ease(st.progress)) * h0);
    } else {
      measure();
      const o = { k: 1 };
      const past = root.getBoundingClientRect().top < innerHeight * 0.72;
      if (past) { o.k = 0; set(0); } else set(h0);
      const st = ScrollTrigger.create({
        trigger: root, start: "top 72%", once: true,
        onEnter: () => gsap.to(o, { k: 0, duration: 1.1, ease: "power3.inOut", onUpdate: () => set(o.k * h0) }),
        onRefresh: () => { if (o.k === 1) { measure(); set(h0); } },
      });
      // the tone follows the scroll while the shutter is down
      const onScroll = () => setTone(last);
      addEventListener("scroll", onScroll, { passive: true });
      kills.push(() => { st.kill(); removeEventListener("scroll", onScroll); });
    }
    kills.push(() => { root.removeAttribute("data-shut"); root.setAttribute("data-nav-tone", "light"); });
  }

  /* ── the figures, once (each row's as it arrives), and the isometric ── */
  const r2 = root.querySelector<HTMLElement>(".rva-r2"), r3 = root.querySelector<HTMLElement>(".rva-r3") || r2;
  const iso = root.querySelector<SVGSVGElement>(".rva-iso");
  const fresh = !!r2 && r2.getBoundingClientRect().top > innerHeight * 0.88;
  const art = iso ? mountIso(iso, gsap, fresh) : null;
  if (art) kills.push(art.kill);
  if (r2 && r3 && fresh) {
    const bars = root.querySelectorAll<SVGRectElement>(".rva-bar"), line = root.querySelector<SVGPathElement>(".rva-line");
    const dot = root.querySelector<HTMLElement>(".rva-end"), gauge = root.querySelector<SVGPathElement>("[data-gauge]"), share = root.querySelector<HTMLElement>(".rva-share > i");
    const show = (el: HTMLElement, v: number) => { el.textContent = `${el.dataset.pre || ""}${v.toFixed(Number(el.dataset.dec || 0))}${el.dataset.suf || ""}`; };
    const counts = (row: HTMLElement) => [...row.querySelectorAll<HTMLElement>("[data-count]")];
    const count = (els: HTMLElement[]) => els.forEach((el, i) => {
      const o = { v: 0 }, to = Number(el.dataset.to);
      gsap.to(o, { v: to, duration: 1.8, delay: 0.3 + i * 0.12, ease: "expo.out", onUpdate: () => show(el, o.v) });
    });
    [...counts(r2), ...counts(r3)].forEach((el) => show(el, 0));
    gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
    if (line) gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
    if (dot) gsap.set(dot, { scale: 0 });
    if (gauge) gsap.set(gauge, { strokeDasharray: "0 100" });
    if (share) gsap.set(share, { scaleX: 0, transformOrigin: "0 50%" });

    const runA = () => {
      count(counts(r2));
      if (gauge) gsap.to(gauge, { strokeDasharray: `${gauge.dataset.gauge} 100`, duration: 1.6, ease: "expo.out", delay: 0.45 });
      art?.run();
    };
    const runB = () => {
      count(counts(r3));
      gsap.to(bars, { scaleY: 1, duration: 0.9, ease: "power3.out", stagger: 0.05, delay: 0.2 });
      if (line) gsap.to(line, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: 0.45 });
      if (dot) gsap.to(dot, { scale: 1, duration: 0.5, ease: "back.out(2)", delay: 2.1 });
      if (share) gsap.to(share, { scaleX: 1, duration: 1.4, ease: "expo.out", delay: 0.7 });
    };
    const a = ScrollTrigger.create({ trigger: r2, start: "top 88%", once: true, onEnter: runA });
    const b = ScrollTrigger.create({ trigger: r3, start: "top 85%", once: true, onEnter: runB });
    kills.push(() => { a.kill(); b.kill(); });
  }
  return () => kills.forEach((k) => k());
}
