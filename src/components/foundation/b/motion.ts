// Foundation B's behaviour, the two pieces the Foundation page (../e) still uses. Transforms, opacity and stroke offsets; reduced motion leaves the
// drawing at its finished frame and the text in place.
//   - [data-fb-rv]: text rises once as it comes in;
//   - transparency: the glass draws, the funds drop in; a scan plane passes slowly through the glass while it is in view.
import type { MotionCtx, Mount } from "@/lib/motion/scroll";

type G = MotionCtx["gsap"];
const $$ = <T extends Element = SVGElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const chipIn = (gsap: G, tl: gsap.core.Timeline, chips: SVGElement[], at: number) => {
  chips.forEach((c) => gsap.set(c, { svgOrigin: `${c.dataset.cx} ${c.dataset.cy}` }));
  const dots = chips.map((c) => c.querySelector(".fb-schip__dot")).filter(Boolean) as Element[];
  gsap.set(chips, { scale: 0.88, opacity: 0 }); gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
  tl.to(chips, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.12 }, at)
    .to(dots, { scale: 1, duration: 0.45, ease: "back.out(2.2)", stagger: 0.12 }, at + 0.2);
};
const draw = (gsap: G, els: Element[]) => gsap.set(els, { strokeDasharray: "1 1", strokeDashoffset: 1 });
/** a timeline that plays once its element is well into the view */
const once = (gsap: G, ST: MotionCtx["ScrollTrigger"], el: Element, start = "top 78%") => {
  const tl = gsap.timeline({ paused: true });
  ST.create({ trigger: el, start, once: true, onEnter: () => tl.play() });
  return tl;
};

/* ── text arrivals ── */
export const mountReveals: Mount = (root, { reduced }) => {
  const els = $$<HTMLElement>(root, "[data-fb-rv]");
  if (reduced) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const sibs = $$<HTMLElement>(e.target.parentElement || root, ":scope > [data-fb-rv]"), i = Math.max(0, sibs.indexOf(e.target as HTMLElement));
    (e.target as HTMLElement).style.setProperty("--rv", (0.08 + i * 0.1).toFixed(2) + "s");
    e.target.classList.add("is-in");
  }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in"); else io.observe(el); });
  return () => io.disconnect();
};

/* ── the pillars ── */
export const mountGlass: Mount = (root, { gsap, ScrollTrigger, reduced }) => {
  const fig = root.querySelector<HTMLElement>("[data-glass]"); if (!fig) return;
  const svg = fig.querySelector("svg")!, scan = svg.querySelector<SVGGElement>(".fb-a-scan")!;
  const H = 4.4 * 34;   // the glass's height (Art.tsx: H × u)
  // the scan: from the glass's top to its floor and back, slowly
  const loop = gsap.fromTo(scan, { y: -H / 2 }, { y: H / 2, duration: 4.2, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true });
  if (reduced) { loop.kill(); gsap.set(scan, { opacity: 0 }); return; }
  const tl = once(gsap, ScrollTrigger, fig, "top 75%");
  const dots = $$(svg, ".fb-a-dots"), edges = $$(svg, ".fb-a-edges path"), back = svg.querySelector(".fb-a-back"), glass = $$(svg, ".fb-a-glass > polygon"), glare = svg.querySelector(".fb-a-glare");
  const stacks = $$<SVGGElement>(svg, ".fb-a-stack"), chips = $$(svg, ".fb-a-chip"), lead = svg.querySelector(".fb-a-lead"), base = svg.querySelector(".fb-a-base");
  gsap.set([...dots, back, glare, lead, base, scan], { opacity: 0 }); gsap.set(glass, { opacity: 0 }); draw(gsap, edges);
  stacks.forEach((s) => gsap.set(s.children, { y: -40, opacity: 0 }));
  tl.to([...dots, base], { opacity: 1, duration: 0.8 }, 0)
    .to(edges, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.05 }, 0.15)
    .to(back, { opacity: 1, duration: 0.6 }, 0.6)
    .to(glass, { opacity: 1, duration: 0.9, ease: "sine.out" }, 0.8);
  stacks.forEach((s, i) => tl.to(s.children, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07 }, 1.0 + i * 0.18));
  tl.to(glare, { opacity: 1, duration: 0.8 }, 1.6).to(lead, { opacity: 1, duration: 0.5 }, 2.0).to(scan, { opacity: 1, duration: 0.8 }, 2.0);
  chipIn(gsap, tl, chips, 1.9);
  let ready = false, seen = false;
  const sync = () => (ready && seen ? loop.play() : loop.pause());
  tl.eventCallback("onComplete", () => { ready = true; sync(); });
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.1 }); io.observe(fig);
  return () => io.disconnect();
};

/* ── the Council ── */
