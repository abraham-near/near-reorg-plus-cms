// Solutions X's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, [data-rv] rises, the proof strip's
// green rule and figures, the dot icons); on top of it, kept calm:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it comes in (SplitText, no masks: the Kepler word's overhang is never clipped);
//     the hero's [data-in] lines (the subhead, the buttons, the drawing) follow the h1;
//   - the hero's drawing (Solutions B's hub) builds as the page opens (the floor, the stations' edges and faces, the centre, then the routes and the names;
//     b/kit.ts buildTimeline), then, only while it is near the view, green signals run each route out from NEAR to its station and back (B's pace);
//   - the spotlight's drawing (Solutions B's shard, a placeholder) builds once as it arrives (b/kit.ts mountDraw), then a deposit lands and its bar
//     closes, slowly, only while it is near the view (b/Shard.tsx liveShard).
// Reduced motion: no split, no build, no loop: everything at its finished frame.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountDraw, whileNear, along, tr, f } from "../b/kit";
import { ROUTES } from "../b/Hero";
import { env } from "../b/Scenes";
import { liveShard } from "../b/Shard";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap } = ctx;
  const grid = gridMount(root, ctx);
  let dead = false;
  const splits: SplitText[] = [];
  const offs: (() => void)[] = [];

  if (!reduced) {
    /* ── the headings, word by word ── */
    gsap.registerPlugin(SplitText);
    const h1 = root.querySelector<HTMLElement>("[data-h1]");
    if (h1) {
      const s = SplitText.create(h1, { type: "words", wordsClass: "sx-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
    }
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "sx-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: h, start: "top 92%", once: true } });
    });
    root.querySelectorAll<HTMLElement>("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.35 + i * 0.12).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });

    /* ── the hero's hub: builds as the page opens, then signals run the routes while it is near the view ── */
    const art = root.querySelector<HTMLElement>(".sx-hero__art"), hub = art?.querySelector<SVGSVGElement>("svg.hb");
    if (art && hub) {
      const build = buildTimeline(gsap, hub);   // sets every starting state now (hidden), paused
      const sigs = [...hub.querySelectorAll<SVGCircleElement>(".hb-sigs circle")];
      sigs.forEach((c) => { c.style.opacity = "0"; });
      art.classList.add("is-ready");            // the CSS gate (solutions-x.css) lets the drawing show: every starting state is set
      gsap.delayedCall(0.35, () => build.play());
      offs.push(whileNear(gsap, art, (t) => {
        if (build.isActive() || build.progress() < 1) return;
        sigs.forEach((c, i) => {
          // out from NEAR to the station, back again, each route on its own beat
          const w = (t * 0.24 + i * 0.37) % 1, u = w < 0.5 ? w * 2 : 2 - w * 2;
          c.setAttribute("transform", tr(along(ROUTES[i].ps, u)));
          c.style.opacity = f(env(u < 0.5 ? u + 0.06 : u - 0.06, 7));
        });
      }));
      offs.push(() => { build.kill(); art.classList.remove("is-ready"); sigs.forEach((c) => { c.style.opacity = ""; }); });
    }

    /* ── the spotlight's drawing: builds on arrival, then lives near the view ── */
    mountDraw(root, ctx);
    const shard = root.querySelector<SVGSVGElement>("svg[data-scene='shard']");
    if (shard) { const live = liveShard(shard); offs.push(whileNear(gsap, shard, (t) => live(t * 0.6), "10% 0px 10% 0px")); }   // B's pace, slowed
  }

  return () => {
    dead = true; splits.forEach((s) => s.revert()); offs.forEach((o) => o());
    root.querySelectorAll("[data-in]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
