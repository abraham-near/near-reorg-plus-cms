// Analytics D's motion (markup: AnalyticsD.tsx). The ruled grid's draw-in, crosshairs and [data-rv] rises are the shared kit's (v3/proof-deeper/motion.ts);
// the small drawings build as they arrive (kit.ts mountDraw); figures count once (kit.ts mountCount). New here:
//   · the hero: the words rise; the plinth draws, the columns rise one by one, the trend line draws over their tops; then it lives: the columns breathe
//     (the line follows), signals run the plinth's seams, the drawing leans to the pointer;
//   · revenue: coins run from the network block to the splitter, five in eight to the vault, the rest to the stack;
//   · status: each rack's lamp pulses on its own beat, packets run the traces between the racks;
//   · go deeper: signals run out from the hub to the instruments (the list's pointer lights one: CSS);
//   · SVRN: the vault's dial turns slowly.
// Every loop runs only while its drawing is near the screen. Reduced motion: every drawing at its finished frame, still.
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { buildTimeline, mountCount, mountDraw, whileNear, tr, f, P } from "./kit";
import { COLS, LANES, colFaces, topAt, trend } from "./HeroPlinth";
import { FLOW_A, FLOW_B, FLOW_N, toVault, alongW, SPOKES } from "./Scenes";

const $$ = <T extends Element>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
const env = (u: number) => Math.min(1, u * 7, (1 - u) * 7);
const frac = (v: number) => v - Math.floor(v);

/** a drawing that builds once as it arrives, then runs its loop while near */
function scene(root: HTMLElement, sel: string, { gsap, ScrollTrigger, reduced }: MotionCtx, loop: (svg: SVGSVGElement, t: number) => void) {
  const svg = root.querySelector<SVGSVGElement>(sel);
  if (!svg || reduced) return;
  const tl = buildTimeline(gsap, svg);
  ScrollTrigger.create({ trigger: svg, start: "top 85%", once: true, onEnter: () => tl.play() });
  return whileNear(gsap, svg, (t) => loop(svg, t));
}

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".ad-hero"), svg = hero?.querySelector<SVGSVGElement>("svg.hx"), cam = hero?.querySelector<HTMLElement>(".ad-hero__cam");
  if (!hero || !svg || !cam) return;
  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }
  const words = $$<HTMLElement>(hero, ".ad-w"), after = $$<HTMLElement>(hero, "[data-hero-up]");
  const cols = $$<SVGGElement>(svg, ".hx-col").sort((a, b) => +a.dataset.k! - +b.dataset.k!).map((g) => g.querySelectorAll("polygon"));
  const line = svg.querySelector<SVGPathElement>(".hx-trend")!, dots = $$<SVGCircleElement>(svg, ".hx-dots circle"), ring = svg.querySelector<SVGCircleElement>(".hx-ring")!;
  const sig = $$<SVGPolygonElement>(svg, ".hx-sig polygon");
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
    cam.style.transform = `translate3d(${f(cx * -16)}px, ${f(cy * -10)}px, 0) rotate(${f(cx * -0.7)}deg)`;
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

/* ==================================================================== the scenes' loops */
const mountRevenue = (root: HTMLElement, ctx: MotionCtx) => {
  let coins: SVGGElement[] | null = null;
  return scene(root, "svg.rv", ctx, (svg, t) => {
    coins ??= $$<SVGGElement>(svg, ".rv-coin");
    for (let i = 0; i < coins.length; i++) {
      const u = frac(t * 0.16 + i / FLOW_N), p = P(...alongW(toVault(i) ? FLOW_A : FLOW_B, u));
      coins[i].setAttribute("transform", tr(p)); coins[i].style.opacity = f(env(u));
    }
  });
};
const mountStatus = (root: HTMLElement, ctx: MotionCtx) => {
  let glows: SVGEllipseElement[] | null = null, pk: SVGCircleElement[] | null = null;
  const ring: [number, number][][] = [[[54, 27], [104, 27]], [[27, 54], [27, 104]], [[131, 54], [131, 104]], [[54, 131], [104, 131]]];
  return scene(root, "svg.sg", ctx, (svg, t) => {
    glows ??= $$<SVGEllipseElement>(svg, ".sg-glow"); pk ??= $$<SVGCircleElement>(svg, ".sg-pkts circle");
    glows.forEach((g, i) => {
      const a = frac(t * 0.55 + i * 0.27);
      g.setAttribute("rx", f(9 + a * 13)); g.setAttribute("ry", f(5.2 + a * 7.5)); g.style.opacity = f((1 - a) * 0.8);
    });
    pk.forEach((c, i) => {
      let u = frac(t * 0.35 + i * 0.31); if (i % 2) u = 1 - u;
      const [a, b] = ring[i]; c.setAttribute("transform", tr(P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u))); c.style.opacity = f(env(u));
    });
  });
};
const mountHub = (root: HTMLElement, ctx: MotionCtx) => {
  let sigs: SVGCircleElement[] | null = null;
  return scene(root, "svg.th", ctx, (svg, t) => {
    sigs ??= $$<SVGCircleElement>(svg, ".th-sigs circle");
    sigs.forEach((c, i) => {
      const u = frac(t * 0.3 + i * 0.37);
      c.setAttribute("transform", tr(P(...alongW(SPOKES[i].path, u)))); c.style.opacity = f(env(u));
    });
  });
};
const mountVault = (root: HTMLElement, ctx: MotionCtx) => {
  let dial: SVGGElement | null = null;
  return scene(root, "svg.vt--big", ctx, (svg, t) => {
    dial ??= svg.querySelector<SVGGElement>(".vt-dial");
    if (dial) dial.setAttribute("transform", `rotate(${f((t * 14) % 360)} ${dial.dataset.c})`);
  });
};

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountDraw(root, ctx), mountCount(root, ctx), mountHero(root, ctx), mountRevenue(root, ctx), mountStatus(root, ctx), mountHub(root, ctx), mountVault(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
