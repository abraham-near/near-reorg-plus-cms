// Analytics C's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv] rises,
// the proof strip's green rule, the SVRN photo opening to the whole screen with its parallax); on top of it, once each:
//   - the h1 rises word by word (SplitText, no masks: the Kepler word's overhang is never clipped); the hero's [data-in] lines follow;
//   - the figures ([data-count]) count up from zero as their row comes in, keeping prefix, decimals, thousands and suffix; a ghost copy holds the width;
//   - the revenue bars grow and the status matrix fills day by day: CSS keyed on the row's .is-in (analytics-c.css).
// Every loop here is a short one-shot tween; nothing runs while off screen. Reduced motion: no data-motion, the figures are their text from the first paint.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

const ease = (t: number) => 1 - Math.pow(1 - t, 4);

/** "$11.6M" → { pre "$", n 11.6, dec 1, post "M", commas } */
function parts(v: string) {
  const m = /^([^\d]*)([\d.,]+)(.*)$/.exec(v);
  if (!m) return null;
  const raw = m[2];
  return { pre: m[1], n: parseFloat(raw.replace(/,/g, "")), dec: (raw.split(".")[1] || "").length, post: m[3], commas: raw.includes(",") };
}
const fmt = (p: NonNullable<ReturnType<typeof parts>>, x: number) =>
  p.pre + (p.commas ? Math.round(x).toLocaleString("en-US") : x.toFixed(p.dec)) + p.post;

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  if (reduced) return grid;
  let dead = false;
  const rafs = new Set<number>(), timers: number[] = [];

  /* the h1, word by word */
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>("[data-h1]");
  if (h) {
    gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", wordsClass: "ac-w" });
    gsap.from(split.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });

  /* the figures count once */
  const live = (el: HTMLElement) => el.querySelector<HTMLElement>("[data-live]");
  const run = (el: HTMLElement) => {
    const v = el.dataset.count || "", p = parts(v), out = live(el);
    if (!p || !out) return;
    const t0 = performance.now() + Number(el.dataset.delay || 0), D = 1400;
    const step = (now: number) => {
      if (dead) return;
      const t = Math.max(0, Math.min(1, (now - t0) / D));
      out.textContent = t >= 1 ? v : fmt(p, p.n * ease(t));
      if (t < 1) { const r = requestAnimationFrame(step); rafs.add(r); }
    };
    rafs.add(requestAnimationFrame(step));
  };
  const els = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target); timers.push(window.setTimeout(() => run(e.target as HTMLElement), 180));
  }), { rootMargin: "0px 0px -12% 0px" });
  // read every rect first, then write
  const above = els.map((el) => el.getBoundingClientRect().bottom < 0);
  els.forEach((el, i) => {
    if (above[i]) return;
    const p = parts(el.dataset.count || ""), out = live(el);
    if (p && out) out.textContent = fmt(p, 0);
    io.observe(el);
  });

  return () => {
    dead = true; io.disconnect(); timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); split?.revert();
    els.forEach((el) => { const out = live(el); if (out) out.textContent = el.dataset.count || ""; });
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
