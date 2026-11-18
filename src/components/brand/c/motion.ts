// Brand C's motion, in the homepage's hand and once each (useScrollMotion; nothing here runs with reduced motion, where every piece is its final state):
//   - [data-rise] headings and the type specimens rise word by word (SplitText, no masks: { yPercent: 40, autoAlpha: 0 }); the h1 ("now") at once, the
//     others as they come into view; the green square at the h1's end lands last;
//   - [data-rv] blocks rise and fade in as they come into view (CSS, keyed on .is-in; --rv staggers a group);
//   - [data-open] photos open from the column's width to the whole screen as they come up (--shut, scrubbed), and [data-par] plates drift against the page;
//   - the ink bands' files settle from a touch larger as the band crosses the view (--z, scrubbed).
// Everything scroll-linked is a ScrollTrigger; the arrivals share one IntersectionObserver.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { gsap, reduced } = ctx;
  if (reduced) return;
  gsap.registerPlugin(SplitText);
  root.setAttribute("data-motion", "");
  const splits: SplitText[] = [];

  /* ── headings: split now, hidden, and played once ── */
  const plays = new Map<Element, { play: () => void; finish: () => void }>();
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "br-c-w" });
    splits.push(s);
    const sq = h.querySelector<HTMLElement>("[data-sq]");
    gsap.set(s.words, { yPercent: 40, autoAlpha: 0 });
    if (sq) gsap.set(sq, { scale: 0, transformOrigin: "50% 100%" });
    const play = (delay = 0) => {
      gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.06, delay, overwrite: true });
      if (sq) gsap.to(sq, { scale: 1, duration: 0.8, ease: "back.out(2.2)", delay: delay + 0.25 + s.words.length * 0.06 });
    };
    const finish = () => { gsap.set(s.words, { yPercent: 0, autoAlpha: 1 }); if (sq) gsap.set(sq, { scale: 1 }); };
    if (h.dataset.rise === "now") play(0.15);
    else plays.set(h, { play: () => play(0), finish });
  });

  /* ── one observer for the arrivals: blocks and headings ── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    if (el.hasAttribute("data-rv")) el.classList.add("is-in");
    plays.get(el)?.play();
  }), { rootMargin: "0px 0px -8% 0px" });
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
    gsap.fromTo(b, { "--shut": 1 }, { "--shut": 0, ease: "none", scrollTrigger: { trigger: b, start: "top 92%", end: "top 22%", scrub: 0.5 } });
  });
  root.querySelectorAll<HTMLElement>("[data-par]").forEach((p) => {
    const img = p.querySelector("img"); if (!img) return;
    gsap.fromTo(img, { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: p.parentElement ?? p, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ── the ink bands: the file settles from a touch larger as the band comes through ── */
  root.querySelectorAll<HTMLElement>(".br-c-band__art img").forEach((img) => {
    gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img.closest(".br-c-band") ?? img, start: "top bottom", end: "center 55%", scrub: 0.6 } });
  });

  return () => {
    io.disconnect(); root.removeEventListener("focusin", onFocus);
    splits.forEach((s) => s.revert());
    root.querySelectorAll("[data-rv]").forEach((el) => el.classList.remove("is-in", "is-now"));
    root.removeAttribute("data-motion");
  };
}
