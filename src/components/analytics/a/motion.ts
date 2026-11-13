// Analytics A's motion, restrained: the homepage's ruled grid does most of it (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv]
// text rises), and on top of it, once each:
//   - the heading rises word by word (gsap SplitText, as Blog J); the lede and the status line follow ([data-in]);
//   - the figures ([data-count]) count up from zero to their value as their row comes in, keeping their prefix, decimals and suffix ("$11.6M", "62%");
//   - the sparkline draws along its run and its dot lands, and the uptime strips wipe in left to right (CSS, keyed on the row's .is-in).
// Reduced motion: no data-motion, nothing counts or draws; every figure is its final value from the first paint.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  if (reduced) return grid;
  let dead = false;
  const timers: number[] = [], rafs = new Set<number>();

  /* ── the hero ── */
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".an-a-h1");
  if (h) {
    gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "an-a-w" });
    gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });

  /* ── the figures count up once ── */
  const count = (el: HTMLElement) => {
    const v = el.dataset.count || "", m = /^([^\d]*)([\d.,]+)(.*)$/.exec(v);
    if (!m) return;
    const [, pre, num, suf] = m, to = parseFloat(num.replace(/,/g, "")), dec = (num.split(".")[1] || "").length;
    const t0 = performance.now(), D = 1400;
    const step = (t: number) => {
      if (dead) return;
      const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 4);
      el.textContent = k >= 1 ? v : `${pre}${(to * e).toFixed(dec)}${suf}`;
      if (k < 1) { const r = requestAnimationFrame(step); rafs.add(r); }
    };
    el.textContent = `${pre}${(0).toFixed(dec)}${suf}`;
    timers.push(window.setTimeout(() => { const r = requestAnimationFrame(step); rafs.add(r); }, 260));
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); count(e.target as HTMLElement); } }), { rootMargin: "0px 0px -12% 0px" });
  root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => { if (el.getBoundingClientRect().bottom > 0) io.observe(el); });

  return () => {
    dead = true; io.disconnect(); timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); split?.revert();
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => { el.textContent = el.dataset.count || ""; });
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
