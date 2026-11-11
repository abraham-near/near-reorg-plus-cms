// Version D's motion (one mount, through useScrollMotion: everything gsap / ScrollTrigger makes here is reverted with the context).
//   - the close scene (NEAR belongs to you) and the [data-icon] icons: v3's grid motion (../../v3/proof-deeper/motion.ts), which also sets [data-motion];
//   - the hero: the world (hero.ts); its stage sticks for the hero's extra height while the scroll scrubs the camera's pull-back (desktop);
//     the copy is a knock-out for the dots (the world goes quiet behind the words);
//   - the pillars: arrive in turn; tilt a little toward the pointer (fine pointers);
//   - the devolution (devolve.ts): scrubbed over the section (its figure sticks on desktop); the steps light up as they pass the middle of the view;
//   - transparency: the ridges drift slower than the page and settle; the card rises;
//   - how the Foundation operates (desktop): the section is as tall as its track is wide; the stage sticks and the track slides left, scrubbed;
//   - [data-fd] blocks rise once as they come in.
// Reduced motion: every scene in its finished state (the world fully grown, the slab small, the steps all lit, the track stacked), no scrubbing.
import type { Mount } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { createHero } from "./hero";
import { createDevolve } from "./devolve";

export const mount: Mount = (root, ctx) => {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);
  const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const ac = new AbortController(), on = { signal: ac.signal };
  const offs: (() => void)[] = [() => ac.abort()];
  const g = gridMount(root, ctx); if (typeof g === "function") offs.push(g);
  const desk = () => innerWidth >= 860;

  /* ── the hero ── */
  const heroSec = $(".fd-hero"), stage = $(".fd-hero__stage"), cv = $<HTMLCanvasElement>(".fd-hero__cv");
  if (heroSec && stage && cv) {
    const chips = new Map<string, HTMLElement>();
    $$(".fd-hero__chips [data-chip]").forEach((el) => chips.set(el.dataset.chip!, el));
    const hero = createHero(cv, stage, chips, reduced);
    offs.push(hero.dispose);
    const copy = $(".fd-hero__copy");
    // the copy's boxes, measured at rest (without the scroll's drift; the intro's rise is re-measured once it ends)
    const knock = () => {
      const tf = copy ? copy.style.transform : "";
      if (copy) copy.style.transform = "";
      const s = stage.getBoundingClientRect(), pad = 18;
      hero.setKnock($$(".fd-hero__copy .fd-ln > span, .fd-hero__sub, .fd-kicker__dot").map((el) => {
        const r = el.getBoundingClientRect(), dy = parseFloat(getComputedStyle(el).translate.split(" ")[1] || "0") || 0;
        return { x0: r.left - s.left - pad, y0: r.top - dy - s.top - pad * 0.6, x1: r.right - s.left + pad, y1: r.bottom - dy - s.top + pad * 0.6 };
      }));
      if (copy) copy.style.transform = tf;
    };
    let kt = 0; const later = (ms: number) => { clearTimeout(kt); kt = window.setTimeout(knock, ms); };
    knock(); document.fonts?.ready.then(() => { if (!ac.signal.aborted) knock(); });
    copy?.addEventListener("animationend", () => later(60), on);
    later(2400);
    addEventListener("resize", () => later(140), on);
    offs.push(() => clearTimeout(kt));
    if (!reduced) {
      ScrollTrigger.create({
        trigger: heroSec, start: "top top", end: "bottom top",
        onUpdate: (s) => {
          if (!desk()) return;
          const hold = heroSec.offsetHeight - innerHeight, y = s.progress * heroSec.offsetHeight;
          hero.setP(hold > 0 ? Math.min(1, y / hold) : 0);
          if (copy) copy.style.transform = `translate3d(0, ${(-Math.min(1, y / Math.max(1, hold)) * 28).toFixed(1)}px, 0)`;
        },
      });
      offs.push(() => { if (copy) copy.style.transform = ""; });
    }
  }

  /* ── arrivals ── */
  const rv = $$("[data-fd]");
  if (reduced) rv.forEach((el) => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add("is-in"); } }), { rootMargin: "0px 0px -12% 0px" });
    rv.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in"); else io.observe(el); });
    offs.push(() => io.disconnect());
  }

  /* ── the pillars: a small tilt toward the pointer ── */
  if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".fd-card[data-tilt]").forEach((card) => {
      const inner = card.querySelector<HTMLElement>(".fd-card__in")!;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg"); inner.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        inner.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%"); inner.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
      }, on);
      card.addEventListener("pointerleave", () => { inner.style.setProperty("--rx", "0deg"); inner.style.setProperty("--ry", "0deg"); }, on);
    });
  }

  /* ── the devolution ── */
  const dev = $(".fd-dev"), dcv = $<HTMLCanvasElement>(".fd-dev__cv"), dstage = $(".fd-dev__stage");
  if (dev && dcv && dstage) {
    const d = createDevolve(dcv, dstage, $(".fd-dev__chip"), reduced);
    offs.push(d.dispose);
    const steps = $$(".fd-step");
    if (reduced) steps.forEach((s) => s.classList.add("is-on"));
    else {
      ScrollTrigger.create({
        trigger: dev, start: () => (desk() ? "top top" : "top 75%"), end: () => (desk() ? "bottom bottom" : "bottom 70%"), invalidateOnRefresh: true,
        onUpdate: (s) => d.setP(s.progress), onRefresh: (s) => d.setP(s.progress),
      });
      steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 66%", end: "bottom 34%", toggleClass: { targets: s, className: "is-on" } }));
      // the last step stays lit once read (the figure is finished then)
      ScrollTrigger.create({ trigger: steps[steps.length - 1], start: "top 66%", onEnter: () => steps[steps.length - 1].classList.add("is-done"), onLeaveBack: () => steps[steps.length - 1].classList.remove("is-done") });
    }
  }

  /* ── transparency: the ridges drift and settle ── */
  const tr = $(".fd-tr"), trImg = $(".fd-tr__img");
  if (tr && trImg && !reduced) {
    gsap.fromTo(trImg, { yPercent: -7, scale: 1.14 }, { yPercent: 7, scale: 1.02, ease: "none", scrollTrigger: { trigger: tr, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  }

  /* ── how the Foundation operates: the horizontal track (desktop, motion on) ── */
  const op = $(".fd-op"), track = $(".fd-op__track"), bar = $(".fd-op__bar b");
  if (op && track && !reduced) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 860px)", () => {
      op.classList.add("is-track");
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const size = () => { op.style.height = `${dist() + innerHeight}px`; };
      size();
      const st = ScrollTrigger.create({
        trigger: op, start: "top top", end: () => `+=${dist()}`, invalidateOnRefresh: true, onRefresh: size,
        onUpdate: (s) => { track.style.transform = `translate3d(${(-s.progress * dist()).toFixed(1)}px, 0, 0)`; if (bar) bar.style.transform = `scaleX(${s.progress.toFixed(4)})`; },
      });
      return () => { st.kill(); op.classList.remove("is-track"); op.style.height = ""; track.style.transform = ""; if (bar) bar.style.transform = ""; };
    });
    offs.push(() => mm.revert());
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());
  return () => offs.reverse().forEach((f) => f());
};
