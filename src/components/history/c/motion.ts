// History C's motion, in the homepage's hand and once each (useScrollMotion):
//   - the milestones' year (always, reduced motion included, where it changes without rolling): the milestone that crosses the middle of the view is the
//     one on; the sticky year rolls to its year, its chapter and count change, the track's dot moves, the others fade back (data-track);
//   - [data-rise] headings rise word by word (SplitText, no masks: { yPercent: 40, autoAlpha: 0 }); the h1 ("now") at once, the others as they come into
//     view;
//   - [data-rv] blocks rise and fade in as they come into view (CSS, keyed on .is-in; --rv staggers a group);
//   - the hero's span: the line draws, the ticks land, and the right-hand year rolls from the first year to the last;
//   - [data-open] photos open from the grid's width to the whole screen as they come up (--shut, scrubbed), and [data-par] plates drift against the page;
//   - [data-wipe] Today's statement is wiped from faint to paper in reading order as it passes through the view (each word's --k, scrubbed).
// Reads before writes: every measure happens in ScrollTrigger's refresh, the updates only write.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { setRoll } from "./parts";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const pad = (n: number) => String(n).padStart(2, "0");

/** the milestones: one on at a time, the sticky column follows it */
function track(root: HTMLElement, ScrollTrigger: MotionCtx["ScrollTrigger"]) {
  const items = [...root.querySelectorAll<HTMLElement>(".hs-c-mi")];
  const roll = root.querySelector<HTMLElement>(".hs-c-ms__y");
  const bar = root.querySelector<HTMLElement>(".hs-c-ms__track");
  const n = root.querySelector<HTMLElement>("[data-n]"), ch = root.querySelector<HTMLElement>("[data-ch]");
  const eras = [...root.querySelectorAll<HTMLElement>(".hs-c-ms__chl [data-era]")];
  if (!items.length || !roll) return;
  const first = Number(items[0].dataset.year), last = Number(items[items.length - 1].dataset.year);
  let on = -1;
  const set = (i: number) => {
    if (i === on) return;
    on = i;
    const it = items[i], y = it.dataset.year || "";
    items.forEach((el, k) => el.classList.toggle("is-on", k === i));
    setRoll(roll, y);
    bar?.style.setProperty("--p", String((Number(y) - first) / (last - first || 1)));
    if (n) n.textContent = pad(i + 1);
    const e = eras.findIndex((el) => el.dataset.era === it.dataset.era);
    eras.forEach((el, k) => (k === e ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
    if (ch && e >= 0) ch.textContent = pad(e + 1);
  };
  root.setAttribute("data-track", "");
  set(0);
  items.forEach((it, i) => {
    ScrollTrigger.create({
      trigger: it, start: "top 55%", end: "bottom 55%",
      onToggle: (s) => { if (s.isActive) set(i); },
      onRefresh: (s) => { if (s.isActive) set(i); },
    });
  });
  // above the first one: the first; past the last one: the last
  ScrollTrigger.create({ trigger: items[0], start: "top 55%", onLeaveBack: () => set(0) });
  ScrollTrigger.create({ trigger: items[items.length - 1], start: "bottom 55%", onEnter: () => set(items.length - 1) });
  return () => root.removeAttribute("data-track");
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { gsap, ScrollTrigger, reduced } = ctx;
  const untrack = track(root, ScrollTrigger);
  if (reduced) return untrack;
  gsap.registerPlugin(SplitText);
  root.setAttribute("data-motion", "");
  const splits: SplitText[] = [];

  /* ── headings: split now, hidden, and played once ── */
  const plays = new Map<Element, { play: () => void; finish: () => void }>();
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "hs-c-w" });
    splits.push(s);
    gsap.set(s.words, { yPercent: 40, autoAlpha: 0 });
    const play = (delay = 0) => gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.06, delay, overwrite: true });
    const finish = () => gsap.set(s.words, { yPercent: 0, autoAlpha: 1 });
    if (h.dataset.rise === "now") play(0.1);
    else plays.set(h, { play: () => play(0), finish });
  });

  /* ── the hero's span: the line draws, the right-hand year rolls up from the first ── */
  const span = root.querySelector<HTMLElement>("[data-span]");
  const to = span?.querySelector<HTMLElement>(".hs-c-span__y--to");
  const final = to?.dataset.roll || "";
  let spanT = 0;
  if (span && to) {
    const from = span.querySelector(".hs-c-span__y")?.textContent || "";
    to.classList.add("is-still"); setRoll(to, from);
    void to.offsetWidth;                       // the start, committed before the roll's transition is put back
    to.classList.remove("is-still");
    spanT = window.setTimeout(() => { span.classList.add("is-in"); setRoll(to, final); }, 650);
  }

  /* ── one observer for the arrivals: blocks and headings ── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    if (el.hasAttribute("data-rv")) el.classList.add("is-in");
    plays.get(el)?.play();
  }), { rootMargin: "0px 0px -10% 0px" });
  // read every position first, then act: a piece already above the view (a reload partway down) is finished at once, the rest wait for the view
  const all = [...root.querySelectorAll<HTMLElement>("[data-rv]"), ...(plays.keys() as Iterable<HTMLElement>)];
  const above = all.map((el) => el.getBoundingClientRect().bottom < 0);
  all.forEach((el, i) => {
    if (el.hasAttribute("data-rv") && !el.style.getPropertyValue("--rv")) el.style.setProperty("--rv", "0");
    if (!above[i]) { io.observe(el); return; }
    el.classList.add("is-in", "is-now");
    plays.get(el)?.finish();
  });
  // keyboard: a block that receives focus before it has arrived shows at once
  const onFocus = (e: FocusEvent) => { const b = (e.target as Element).closest?.("[data-rv]"); if (b && !b.classList.contains("is-in")) b.classList.add("is-in", "is-now"); };
  root.addEventListener("focusin", onFocus);

  /* ── photos: the frame opens to the whole screen, the plate drifts ── */
  root.querySelectorAll<HTMLElement>("[data-open]").forEach((b) => {
    gsap.fromTo(b, { "--shut": 1 }, { "--shut": 0, ease: "none", scrollTrigger: { trigger: b, start: "top 92%", end: "top 18%", scrub: 0.5 } });
  });
  root.querySelectorAll<HTMLElement>("[data-par]").forEach((p) => {
    const img = p.querySelector("img"); if (!img) return;
    gsap.fromTo(img, { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: p.parentElement ?? p, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ── Today's statement: faint to paper, in reading order, as it passes through the view ── */
  root.querySelectorAll<HTMLElement>("[data-wipe]").forEach((st) => {
    const words = [...st.querySelectorAll<HTMLElement>(".hs-c-ww")];
    const n = words.length, soft = 6;   // the front's soft edge, in words
    const last = new Float32Array(n).fill(-1);
    st.classList.add("is-wipe");
    const apply = (p: number) => {
      const front = p * (n + soft);
      for (let i = 0; i < n; i++) {
        const k = Math.round(clamp((front - i) / soft, 0, 1) * 100) / 100;
        if (last[i] !== k) { last[i] = k; words[i].style.setProperty("--k", String(k)); }
      }
    };
    apply(0);
    ScrollTrigger.create({ trigger: st, start: "top 82%", end: "bottom 42%", scrub: 0.4, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
  });

  return () => {
    untrack?.();
    io.disconnect(); root.removeEventListener("focusin", onFocus); clearTimeout(spanT);
    splits.forEach((s) => s.revert());
    if (span && to) { span.classList.remove("is-in"); setRoll(to, final); }
    root.querySelectorAll("[data-rv]").forEach((el) => el.classList.remove("is-in", "is-now"));
    root.querySelectorAll<HTMLElement>(".hs-c-ww").forEach((w) => w.style.removeProperty("--k"));
    root.querySelectorAll("[data-wipe]").forEach((el) => el.classList.remove("is-wipe"));
    root.removeAttribute("data-motion");
  };
}
