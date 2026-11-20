// Analytics X's motion (markup: AnalyticsX.tsx). The ruled rows' draw-in and crosshairs, the [data-rv] rises and the dot icons (<i data-icon>) are the
// homepage grid's kit (v3/proof-deeper/motion.ts); figures count once (kit.ts mountCount). The two kept drawings:
//   · the hero: the words rise; the plinth draws, the columns rise one by one, the trend line draws over their tops; then it lives (the columns breathe,
//     signals run the plinth's seams, the drawing leans a little to the pointer);
//   · go deeper: the hub builds as it arrives and signals run out to the instruments (the list's pointer lights one: CSS).
// Every loop runs only while its drawing is near the screen. Reduced motion: both drawings at their finished frame, still.
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountCount, whileNear, tr, f, P } from "./kit";
import { COLS, LANES, colFaces, topAt, trend } from "./HeroPlinth";
import { alongW, SPOKES } from "./ToolsHub";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const env = (u: number) => Math.min(1, u * 7, (1 - u) * 7);
const frac = (v: number) => v - Math.floor(v);

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".anx-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.anx-hx"), cam = hero?.querySelector<HTMLElement>(".anx-hero__cam");
  if (!hero || !svg || !cam) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  const words = $$<HTMLElement>(hero, ".anx-w"), after = $$<HTMLElement>(hero, "[data-hero-up]");
  const cols = $$<SVGGElement>(svg, ".anx-hx-col").sort((a, b) => +a.dataset.k! - +b.dataset.k!).map((g) => g.querySelectorAll("polygon"));
  const line = svg.querySelector<SVGPathElement>(".anx-hx-trend")!, dots = $$<SVGCircleElement>(svg, ".anx-hx-dots circle"), ring = svg.querySelector<SVGCircleElement>(".anx-hx-ring")!;
  const sig = $$<SVGPolygonElement>(svg, ".anx-hx-sig polygon");
  const build = buildTimeline(gsap, svg);
  const grow = COLS.map(() => 0), last = COLS.map(() => -1);
  let time = 0;
  const hts = COLS.map(() => 1);
  const draw = () => {
    for (let k = 0; k < COLS.length; k++) {
      const b = 1 + 0.045 * Math.sin(time * 0.8 + k * 0.55);
      const t = grow[k] * b; hts[k] = t;
      if (Math.abs(t - last[k]) < 0.0005) continue;
      last[k] = t;
      const fc = colFaces(k, t), ps = cols[k];
      ps[0].setAttribute("points", fc.left); ps[1].setAttribute("points", fc.right); ps[2].setAttribute("points", fc.top);
      const p = topAt(k, t); dots[k]?.setAttribute("cx", f(p[0])); dots[k]?.setAttribute("cy", f(p[1]));
    }
    line.setAttribute("d", trend(hts));
    const e = topAt(COLS.length - 1, hts[COLS.length - 1]); ring.setAttribute("cx", f(e[0])); ring.setAttribute("cy", f(e[1]));
  };
  gsap.set(words, { yPercent: 40, autoAlpha: 0 });
  gsap.set(after, { autoAlpha: 0, y: 18 });
  gsap.set(line, { strokeDasharray: "1 1", strokeDashoffset: 1 });
  draw();
  hero.classList.add("is-ready");
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power4.out", stagger: 0.06 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .call(() => { build.play(); }, [], 0.15);
  COLS.forEach((_, k) => { const o = { v: 0 }; tl.to(o, { v: 1, duration: 1.1, ease: "expo.out", onUpdate: () => { grow[k] = o.v; } }, 0.9 + k * 0.06); });
  tl.to(line, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 1.5);

  let mx = 0, my = 0, cx = 0, cy = 0;
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const off = whileNear(gsap, hero, (t) => {
    time = t;
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    cam.style.transform = `translate3d(${f(cx * -12)}px, ${f(cy * -8)}px, 0)`;
    draw();
    sig.forEach((s, i) => {
      const u = frac(t * (0.08 + i * 0.02) + i * 0.5), [a, b] = LANES[i];
      s.setAttribute("transform", tr([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]));
      s.style.opacity = f(env(u));
    });
    ring.setAttribute("r", f(5 + frac(t * 0.5) * 12)); ring.style.opacity = f(1 - frac(t * 0.5));
  });
  return () => { off(); removeEventListener("pointermove", onMove); tl.kill(); cam.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== go deeper: the hub */
function mountHub(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const svg = root.querySelector<SVGSVGElement>("svg.anx-th");
  if (!svg || reduced) return;
  const tl = buildTimeline(gsap, svg);
  ScrollTrigger.create({ trigger: svg, start: "top 85%", once: true, onEnter: () => tl.play() });
  const sigs = $$<SVGCircleElement>(svg, ".anx-th-sigs circle");
  return whileNear(gsap, svg, (t) => {
    sigs.forEach((c, i) => {
      const u = frac(t * 0.3 + i * 0.37);
      c.setAttribute("transform", tr(P(...alongW(SPOKES[i].path, u)))); c.style.opacity = f(env(u));
    });
  });
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountCount(root, ctx), mountHero(root, ctx), mountHub(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
