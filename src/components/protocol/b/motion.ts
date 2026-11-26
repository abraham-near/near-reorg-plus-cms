// Protocol B's motion. The homepage's ruled grid does the arrivals (../../v3/proof-deeper/motion.ts: rows draw in, [data-rv] rises, the proof strip's
// green rule and figures, the dot icons). On top of it:
//   - the h1 rises word by word on load, each h2 ([data-split]) as it arrives (SplitText, no masks: the Kepler word is never clipped); the hero's
//     [data-in] lines follow the h1; [data-up] (the band's lede, off the grid) rises as it arrives;
//   - the hero's scene (net.ts) wipes in from the left over the first ~2 s, then runs (only while it is near the view and the tab is visible); a count
//     of 600 ms blocks since the page opened ticks in its legend;
//   - the chapter (desktop, motion on): the stage pins for about 0.9 screen per step; the scroll drives the lanes through the page's steps (B: all
//     four, Nightshade, resharding, the private shard, quantum; the final page: the first three), blended at each change; the step's copy and the index follow, a hairline shows how far along it is. Phones and
//     reduced motion: the steps stacked, each scene running its own step on a loop (reduced motion: its finished frame);
//   - Speed's metronome and Chain Signatures' lanes run while near the view.
// Reduced motion: no split, no wipe, no pin, no loop: every scene at a finished frame.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { clamp01, faces, smooth, stage, type Stage } from "./stage";
import { createNet, mix, PARAMS, type NetParams } from "./net";
import { createChains } from "./chains";

/** a step of the chapter (its kind: 0 Nightshade, 1 resharding, 2 the private shard, 3 quantum) on the lanes, at its own progress u (0..1) */
function stepParams(i: number, u: number): NetParams {
  const b: NetParams = { ...PARAMS, priv: 0 };
  switch (i) {
    case 0: return { ...b, shardsF: 1 + 9 * smooth(u / 0.7), consensus: 1 };
    case 1: return { ...b, reshardU: u };
    case 2: return { ...b, reshardU: 1, priv: smooth(u / 0.25), privHi: smooth((u - 0.05) / 0.3), lens: smooth((u - 0.3) / 0.4) };
    default: return { ...b, reshardU: 1, priv: 1, account: smooth(u / 0.22), rot: clamp01((u - 0.12) / 0.78), dim: 0.62 * smooth(u / 0.22) };
  }
}
/** a pinned progress (0..1) through the page's steps (their kinds, in order; B has all four, the final page three): each holds, then blends into the
 *  next over the last 18 % of its share. `on` is the step's place on the page */
function atProgress(p: number, kinds: number[]) {
  const n = kinds.length, q = Math.min(n - 0.0001, Math.max(0, p * n)), i = Math.floor(q), u = q - i, HOLD = 0.82;
  if (i < n - 1 && u > HOLD) { const f = smooth((u - HOLD) / (1 - HOLD)); return { params: mix(stepParams(kinds[i], 1), stepParams(kinds[i + 1], 0), f), on: f > 0.5 ? i + 1 : i }; }
  return { params: stepParams(kinds[i], clamp01(u / HOLD)), on: i };
}
/** a step's scene on its own (phones): runs its step, holds the end, starts over */
const loopU = (t: number) => { const tau = t % 10; return clamp01((tau - 0.8) / 6); };

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { reduced, gsap, ScrollTrigger } = ctx;
  const grid = gridMount(root, ctx);
  const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => el.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => [...el.querySelectorAll<T>(s)];
  const { mono, sans } = faces(root);
  const stages: Stage[] = [], offs: (() => void)[] = [], splits: SplitText[] = [];
  let dead = false;

  /* ── the headings and the hero's lines ── */
  if (!reduced) {
    gsap.registerPlugin(SplitText);
    const h1 = $("[data-h1]");
    if (h1) { const s = SplitText.create(h1, { type: "words", wordsClass: "pb-w" }); splits.push(s); gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.1 }); }
    $$("[data-split]").forEach((h) => {
      const s = SplitText.create(h, { type: "words", wordsClass: "pb-w" }); splits.push(s);
      gsap.from(s.words, { yPercent: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 90%", once: true } });
    });
    $$("[data-in]").forEach((el, i) => {
      el.style.setProperty("--d", `${(0.4 + i * 0.12).toFixed(2)}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) el.classList.add("is-in"); }));
    });
    $$("[data-up]").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => el.classList.add("is-in") }));
  }

  /* ── 1 · the hero's scene ── */
  const heroArt = $(".pb-hero__art"), heroCv = $<HTMLCanvasElement>("canvas[data-scene='hero']");
  if (heroArt && heroCv) {
    const wide = createNet({ shards: 10, tone: "paper", reshard: "cycle", ruler: true, labels: true, dots: true, mono, sans }),
      slim = createNet({ shards: 5, tone: "paper", reshard: "cycle", ruler: true, labels: true, dots: true, mono, sans, maxLane: 40 });
    const hp: NetParams = { ...PARAMS, reveal: reduced ? 1 : 0 };
    stages.push(stage(heroCv, (c, w, h, t) => { (w < 640 ? slim : wide)(c, w, h, t + 4, hp); }, { reduced, still: 13 }));
    heroArt.classList.add("is-ready");   // every starting state is set: the CSS gate (protocol-b.css) lets the scene show
    if (!reduced) gsap.to(hp, { reveal: 1, duration: 2, ease: "power2.inOut", delay: 0.5 });
    // blocks since the page opened, at NEAR's 600 ms (an estimate, said as one)
    const out = $("[data-blocks]"), t0 = performance.now();
    if (out) { const iv = window.setInterval(() => { if (!document.hidden) out.textContent = Math.floor((performance.now() - t0) / 600).toLocaleString("en-US"); }, 600); offs.push(() => clearInterval(iv)); }
  }

  /* ── 3 · the chapter ── */
  const band = $(".pb-band"), stageEl = $("[data-stage]");
  const chapterNet = () => createNet({ shards: 10, tone: "ink", reshard: "scrub", ruler: true, labels: true, mono, sans, maxLane: 34 });
  let mm: gsap.MatchMedia | null = null;
  const flat = () => {
    // each step keeps its own scene, running its step on a loop
    $$<HTMLCanvasElement>("canvas[data-scene='step']", band ?? root).forEach((cv) => {
      const i = Number(cv.dataset.step) || 0, net = chapterNet();
      const st = stage(cv, (c, w, h, t) => net(c, w, h, t, stepParams(i, reduced ? 0.92 : loopU(t))), { reduced, still: 11 });
      stages.push(st);
    });
  };
  if (band && stageEl) {
    if (reduced) flat();
    else {
      mm = gsap.matchMedia();
      mm.add({ pin: "(min-width: 960px) and (min-height: 600px)", stack: "(max-width: 959px), (max-height: 599px)" }, (cx) => {
        const local: Stage[] = [];
        if (cx.conditions?.stack) {
          $$<HTMLCanvasElement>("canvas[data-scene='step']", band).forEach((cv) => {
            const i = Number(cv.dataset.step) || 0, net = chapterNet();
            local.push(stage(cv, (c, w, h, t) => net(c, w, h, t, stepParams(i, loopU(t))), { reduced: false }));
          });
          return () => local.forEach((s) => s.destroy());
        }
        band.classList.add("is-pinned");
        const steps = $$(".pb-step", band), idx = $$(".pb-idx__i", band), bar = $("[data-bar]", band);
        const kinds = steps.map((s) => Number(s.dataset.step) || 0), of = steps.map((s) => Number(s.dataset.of) || 0);
        const cv = $<HTMLCanvasElement>("canvas[data-scene='chapter']", band);
        let target = 0, cur = 0, on = -1;
        const show = (i: number) => {
          if (i === on) return; on = i;
          steps.forEach((s, j) => { s.classList.toggle("is-on", j === i); s.toggleAttribute("inert", j !== i); });
          idx.forEach((el, j) => el.classList.toggle("is-on", j === of[i]));
        };
        show(0);
        const net = chapterNet();
        if (cv) local.push(stage(cv, (c, w, h, t, dt) => {
          cur += (target - cur) * Math.min(1, dt * 7 || 1);   // the scene eases after the scroll, never jumps
          const a = atProgress(cur, kinds);
          net(c, w, h, t, a.params);
        }, { reduced: false, margin: "0px" }));
        ScrollTrigger.create({
          trigger: stageEl, start: "top top", end: () => "+=" + Math.round(innerHeight * 0.9 * kinds.length), pin: true, pinSpacing: true, anticipatePin: 1,
          onUpdate: (s) => { target = s.progress; show(atProgress(s.progress, kinds).on); if (bar) bar.style.transform = `scaleX(${s.progress.toFixed(4)})`; },
          onRefresh: (s) => { target = s.progress; },
        });
        return () => { local.forEach((s) => s.destroy()); band.classList.remove("is-pinned"); steps.forEach((s) => { s.classList.remove("is-on"); s.removeAttribute("inert"); }); idx.forEach((el) => el.classList.remove("is-on")); };
      });
    }
  }

  /* ── 4 · Speed's metronome ── */
  const spCv = $<HTMLCanvasElement>("canvas[data-scene='speed']");
  if (spCv) {
    const net = createNet({ shards: 3, tone: "paper", reshard: "off", ruler: true, labels: true, globals: true, mono, sans, maxLane: 44, now: 0.74 });
    const sp: NetParams = { ...PARAMS, shardsF: 3, priv: 0 };
    stages.push(stage(spCv, (c, w, h, t) => net(c, w, h, t + 3, sp), { reduced, still: 6 }));
  }

  /* ── 5 · Chain Signatures ── */
  const csCv = $<HTMLCanvasElement>("canvas[data-scene='chains']");
  if (csCv) { const draw = createChains({ mono, sans }); stages.push(stage(csCv, (c, w, h, t) => draw(c, w, h, t + 2.6), { reduced, still: 5.4 })); }

  return () => {
    dead = true;
    stages.forEach((s) => s.destroy()); offs.forEach((o) => o()); splits.forEach((s) => s.revert()); mm?.revert();
    heroArt?.classList.remove("is-ready");
    $$("[data-in], [data-up]").forEach((el) => el.classList.remove("is-in"));
    if (typeof grid === "function") grid();
  };
}
