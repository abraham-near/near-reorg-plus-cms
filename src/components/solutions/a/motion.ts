// Solutions A's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv] rises, the
// proof strip's green rule and figures, the line icons); on top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//     the hero's [data-in] lines follow the h1;
//   - the index: the solution row crossing 55 % of the view is the one on show (data-on on the row and on its link in the hero's bar).
// Reduced motion: no split; the row on show still follows the scroll, without transitions (solutions-a.css). The spotlight's bars stand redacted.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const grid = gridMount(root, ctx);
  let dead = false;
  const splits: SplitText[] = [];

  /* ── the index: the row on show ── */
  const rows = [...root.querySelectorAll<HTMLElement>("[data-sol]")];
  const navs = [...root.querySelectorAll<HTMLElement>("[data-nav]")];
  let cur = "";
  const show = (k: string) => {
    if (k === cur) return;
    cur = k;
    rows.forEach((r) => r.toggleAttribute("data-on", r.dataset.sol === k));
    navs.forEach((n) => n.toggleAttribute("data-on", n.dataset.nav === k));
  };
  rows.forEach((r, i) => ScrollTrigger.create({
    trigger: r, start: "top 55%", end: "bottom 55%",
    onToggle: (st) => { if (st.isActive) show(r.dataset.sol || ""); },
    onLeave: () => { if (i === rows.length - 1) show(""); },
    onLeaveBack: () => { if (i === 0) show(""); },
  }));

  /* ── the headings, word by word ── */
  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = root.querySelector<HTMLElement>("[data-h1]");
    if (h1) {
      const s = SplitText.create(h1, { type: "words", wordsClass: "sa-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
    }
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "sa-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: h, start: "top 92%", once: true } });
    });
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
  }

  return () => {
    dead = true; splits.forEach((s) => s.revert());
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    rows.forEach((r) => r.removeAttribute("data-on")); navs.forEach((n) => n.removeAttribute("data-on"));
    if (typeof grid === "function") grid();
  };
}
