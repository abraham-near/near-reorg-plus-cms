// Blog E's motion, calm on purpose: grid.ts (rows draw as they arrive, the crosshairs, their text rises; no photo drift here, every photo is
// [data-still]) and the heading rising word by word (gsap SplitText, as Blog A). The figures' rule and numbers ride on the head row's .is-in (blog-e.css).
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "../grid";

export function mount(root: HTMLElement, ctx: MotionCtx): { grid: Grid; dispose: () => void } {
  const grid = mountGrid(root, ctx);
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".bl-e__h1");
  if (h && !ctx.reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "bl-e__w" });
    ctx.gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
  }
  return { grid, dispose: () => { split?.revert(); grid.dispose(); } };
}
