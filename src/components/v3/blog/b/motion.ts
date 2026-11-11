// Blog B's motion: grid.ts (rows draw, crosshairs, framed photos drift, icons) and the two full-bleed photos (gsap, scrubbed):
//   - the cover: at the top of the page it sits at the grid's width; it opens to the whole screen as it rises to the top of the view, the stage holds
//     while it is open (the plate drifts and settles from 1.14, the headline drifts a little against it), then the frame closes as it leaves (desktop);
//   - Inside NEAR: opens as it reaches the middle of the view and closes as it leaves, as /home-v3's voices (desktop);
//   - both plates move slower than the page on every width. Reduced motion: the bleeds stay at the grid's width, still; the text is simply there.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountGrid } from "../grid";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { gsap, reduced } = ctx;
  const grid = mountGrid(root, ctx);
  const cover = root.querySelector<HTMLElement>('[data-bleed="cover"]'), talks = root.querySelector<HTMLElement>('[data-bleed="talks"]');
  const plate = (b: HTMLElement | null) => b?.querySelector<HTMLElement>(".bl-plate") ?? null;
  if (reduced) return grid.dispose;

  gsap.registerPlugin(SplitText);
  const mm = gsap.matchMedia();
  // every width: the plates drift slower than the page
  [cover, talks].forEach((b) => {
    const p = plate(b); if (!b || !p) return;
    gsap.fromTo(p, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  });
  // the cover's headline: line by line once it is in (its own masks; the other text rises through grid.ts)
  const title = cover?.querySelector<HTMLElement>(".bl-b__cover-t");
  let split: SplitText | null = null;
  if (title) {
    split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "bl-b__line", autoSplit: true,
      onSplit: (s) => gsap.from(s.lines, { yPercent: 105, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.35 }) });
    title.removeAttribute("data-rv");
  }

  mm.add("(min-width: 860px)", () => {
    if (cover) {
      cover.classList.add("is-scene");
      const stage = cover.querySelector<HTMLElement>(".bl-bleed__in");
      // open: from the top of the page until its top meets the top of the view; the stage then holds (CSS: sticky, the bleed is 200 vh)
      gsap.fromTo(cover, { "--shut": 1 }, { "--shut": 0, ease: "power2.inOut", immediateRender: true, scrollTrigger: { trigger: cover, start: () => 0, end: "top top", scrub: 0.6, invalidateOnRefresh: true } });
      // close: as its foot leaves
      gsap.to(cover, { "--shut": 1, ease: "power2.inOut", immediateRender: false, scrollTrigger: { trigger: cover, start: "bottom 75%", end: "bottom top", scrub: 0.6 } });
      const p = plate(cover);
      if (p) gsap.fromTo(p, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: cover, start: () => 0, end: "bottom bottom", scrub: 0.6 } });
      if (stage) gsap.to(stage, { y: () => -innerHeight * 0.08, ease: "none", scrollTrigger: { trigger: cover, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
    }
    if (talks) {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: talks, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      tl.fromTo(talks, { "--shut": 1 }, { "--shut": 0, duration: 0.3 }, 0.1).to(talks, { "--shut": 0, duration: 0.25 }).to(talks, { "--shut": 1, duration: 0.3 });
    }
    return () => { cover?.classList.remove("is-scene"); [cover, talks].forEach((b) => b?.style.removeProperty("--shut")); };
  });
  requestAnimationFrame(() => ctx.ScrollTrigger.refresh());

  return () => { mm.revert(); split?.revert(); title?.setAttribute("data-rv", ""); grid.dispose(); };
}
