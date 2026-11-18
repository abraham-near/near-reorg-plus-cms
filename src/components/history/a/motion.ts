// History A's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, + crosshairs, [data-rv] rises, the
// photos opening in their cells and the ridges opening to the whole screen with their parallax); on top of it:
//   - the h1 rises word by word (SplitText, no masks: the Kepler word's overhang is never clipped); the hero's [data-in] lines follow, once;
//   - the ledger's marker: a green rule runs down the ledger's left frame line as it is read (scrubbed: its top at 55 % of the view to its foot there);
//     its head carries the year of the entry beside it, and every entry it has passed is marked (.is-past: its square fills);
//   - the index's years, the layers and the ownerships rise in turn: CSS keyed on the row's .is-in (history-a.css).
// Reduced motion: no data-motion, no marker; every entry is marked from the first paint.
import { SplitText } from "gsap/SplitText";
import { scrub, type MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  const entries = [...root.querySelectorAll<HTMLElement>("[data-m]")];
  if (reduced) {
    entries.forEach((m) => m.classList.add("is-past"));
    return grid;
  }
  let dead = false;

  /* the h1, word by word */
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>("[data-h1]");
  if (h) {
    gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", wordsClass: "ha-w" });
    gsap.from(split.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.1 });
  }
  root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
    el.style.setProperty("--d", `${(0.35 + i * 0.1).toFixed(2)}s`);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
  });

  /* the ledger's marker */
  const ledger = root.querySelector<HTMLElement>("[data-ledger]");
  const yr = ledger?.querySelector<HTMLElement>("[data-yr]");
  if (ledger && yr) {
    let tops: number[] = [], H = 1, last = -2, lastP = "";
    const measure = () => { H = ledger.offsetHeight || 1; tops = entries.map((m) => m.offsetTop + 28); };
    const at = (p: number) => {
      const s = p.toFixed(4);
      if (s !== lastP) { lastP = s; ledger.style.setProperty("--p", s); }
      const y = p * H;
      let k = -1;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= y) k = i;
      if (k === last) return;
      last = k;
      entries.forEach((m, i) => m.classList.toggle("is-past", i <= k));
      yr.textContent = entries[Math.max(0, k)]?.dataset.year ?? "";
    };
    ledger.setAttribute("data-live", "");
    measure();
    scrub(ledger, "top 55%", "bottom 55%", at, measure);
  }

  return () => {
    dead = true; split?.revert();
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    ledger?.removeAttribute("data-live");
    if (typeof grid === "function") grid();
  };
}
