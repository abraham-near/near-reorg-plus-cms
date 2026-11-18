// Economics C's motion, in the homepage's hand and once each (useScrollMotion; nothing here runs with reduced motion, where every piece is its final state
// and the loop's four steps are listed beside a still ring):
//   - [data-rise] headings rise word by word (SplitText, no masks: { yPercent: 40, autoAlpha: 0 }); the h1 ("now") at once, the others as they come into
//     view; the green square at a heading's end lands last;
//   - [data-rv] blocks rise and fade in as they come into view (CSS, keyed on .is-in; --rv staggers a group);
//   - [data-count] figures count up from zero once, keeping their prefix and suffix ("−50%");
//   - the loop: on a screen tall enough for it, the band's stage is held (CSS sticky, .ec-c-loop[data-pin]) while the scroll runs through its track; each
//     quarter of the track is one step: the step's text shows, its node lights, the dot rests on it, then travels the ring to the next node as the
//     quarter ends (the last one carries it back to the top, closing the circle);
//   - [data-wipe] the long lines are wiped from faint to full in reading order as they pass through the view (each word's --k, scrubbed);
// Everything scroll-linked is a ScrollTrigger (it only works while the page scrolls); the only rAF is a figure's count, which stops when it lands.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { gsap, ScrollTrigger, reduced } = ctx;
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  root.setAttribute("data-motion", "");
  let dead = false;
  const splits: SplitText[] = [], rafs = new Set<number>();

  /* ── headings: split now, hidden, and played once ── */
  const plays = new Map<Element, { play: () => void; finish: () => void }>();
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "ec-c-w" });
    splits.push(s);
    const sq = h.querySelector<HTMLElement>("[data-sq]");
    gsap.set(s.words, { yPercent: 40, autoAlpha: 0 });
    if (sq) gsap.set(sq, { scale: 0, transformOrigin: "50% 100%" });
    const play = (delay = 0) => {
      gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.06, delay, overwrite: true });
      if (sq) gsap.to(sq, { scale: 1, duration: 0.8, ease: "back.out(2.2)", delay: delay + 0.25 + s.words.length * 0.06 });
    };
    const finish = () => { gsap.set(s.words, { yPercent: 0, autoAlpha: 1 }); if (sq) gsap.set(sq, { scale: 1 }); };
    if (h.dataset.rise === "now") play(0.1);
    else plays.set(h, { play: () => play(0), finish });
  });

  /* ── figures: count up once ── */
  const count = (el: HTMLElement) => {
    const v = el.dataset.count || "", m = /^([^\d]*)([\d.,]+)(.*)$/.exec(v);
    if (!m) return;
    const [, pre, num, suf] = m, to = parseFloat(num.replace(/,/g, "")), dec = (num.split(".")[1] || "").length;
    const t0 = performance.now() + 180, D = 1500;
    el.textContent = `${pre}${(0).toFixed(dec)}${suf}`;
    const step = (t: number) => {
      if (dead) return;
      const k = clamp((t - t0) / D, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = k >= 1 ? v : `${pre}${(to * e).toFixed(dec)}${suf}`;
      if (k < 1) { const r = requestAnimationFrame(step); rafs.add(r); }
    };
    const r = requestAnimationFrame(step); rafs.add(r);
  };

  /* ── one observer for the arrivals: blocks, headings, figures ── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    if (el.hasAttribute("data-rv")) el.classList.add("is-in");
    if (el.hasAttribute("data-count")) count(el);
    plays.get(el)?.play();
  }), { rootMargin: "0px 0px -10% 0px" });
  // read every position first, then act: a piece already above the view (a reload partway down) is finished at once, the rest wait for the view
  const all = [...root.querySelectorAll<HTMLElement>("[data-rv], [data-count]"), ...(plays.keys() as Iterable<HTMLElement>)];
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

  /* ── the loop: the stage held while the steps advance and the dot travels the ring ── */
  const loop = root.querySelector<HTMLElement>(".ec-c-loop"), track = root.querySelector<HTMLElement>("[data-track]");
  const mm = gsap.matchMedia();
  if (loop && track) {
    mm.add("(min-height: 600px)", () => {
      const steps = [...track.querySelectorAll<HTMLElement>("[data-step]")];
      const nodes = [...track.querySelectorAll<SVGElement>("[data-node]")];
      const labs = [...track.querySelectorAll<HTMLElement>("[data-lab]")];
      const mids = [...track.querySelectorAll<HTMLElement>("[data-mid]")];
      const arc = track.querySelector<SVGElement>("[data-arc]"), run = track.querySelector<SVGElement>(".ec-c-ring__run");
      const N = steps.length;
      loop.setAttribute("data-pin", "");
      let on = -1, lastPos = -1;
      const setOn = (k: number) => {
        if (k === on) return;
        on = k;
        steps.forEach((s, i) => s.toggleAttribute("data-on", i === k));
        mids.forEach((s, i) => s.toggleAttribute("data-on", i === k));
        [nodes, labs].forEach((list) => list.forEach((n, i) => { n.toggleAttribute("data-on", i === k); n.toggleAttribute("data-past", i < k); }));
      };
      const draw = (p: number) => {
        const q = clamp(p, 0, 1) * N, k = Math.min(N - 1, Math.floor(q));
        const pos = k + smooth(clamp((q - k - 0.55) / 0.45, 0, 1));   // rests on its node for the quarter's first half, then travels to the next
        setOn(k);
        const r = Math.round(pos * 1000) / 1000;
        if (r === lastPos) return;
        lastPos = r;
        if (run) run.style.transform = `rotate(${(r / N) * 360}deg)`;
        if (arc) arc.style.strokeDashoffset = String(1 - r / N);
      };
      const proxy = { p: 0 };
      draw(0);
      gsap.to(proxy, {
        p: 1, ease: "none", onUpdate: () => draw(proxy.p),
        scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.5, invalidateOnRefresh: true },
      });
      return () => {
        loop.removeAttribute("data-pin");
        [...steps, ...mids, ...nodes, ...labs].forEach((el) => { el.removeAttribute("data-on"); el.removeAttribute("data-past"); });
        if (run) run.style.removeProperty("transform");
        if (arc) arc.style.removeProperty("stroke-dashoffset");
      };
    });
  }

  /* ── the long lines: faint to full, in reading order, as they pass through the view ── */
  root.querySelectorAll<HTMLElement>("[data-wipe]").forEach((st) => {
    const words = [...st.querySelectorAll<HTMLElement>(".ec-c-ww")];
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
    ScrollTrigger.create({ trigger: st, start: "top 85%", end: "bottom 45%", scrub: 0.4, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
  });

  return () => {
    dead = true; io.disconnect(); root.removeEventListener("focusin", onFocus);
    mm.revert();
    rafs.forEach(cancelAnimationFrame);
    splits.forEach((s) => s.revert());
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => { el.textContent = el.dataset.count || ""; });
    root.querySelectorAll("[data-rv]").forEach((el) => el.classList.remove("is-in", "is-now"));
    root.querySelectorAll<HTMLElement>(".ec-c-ww").forEach((w) => w.style.removeProperty("--k"));
    root.querySelectorAll("[data-wipe]").forEach((el) => el.classList.remove("is-wipe"));
    root.removeAttribute("data-motion");
  };
}
