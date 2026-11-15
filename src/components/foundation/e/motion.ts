// Foundation E's motion (markup: FoundationE.tsx). B's for the sections it keeps (../b/motion.ts); new here:
//   · the hero: the headline's words rise and the drawing builds (C's: the plinth draws, the wireframes draw, the columns rise inside them). Then it
//     stays alive on its own: the columns breathe, green signals run the plinth's seams, the drawing leans to the pointer. Scrolled (no pin), a wave runs
//     the columns up and down with the page, and the drawing travels down into the stair's empty corner in the pillars below, barely smaller (desktop).
//   · "smaller" (desktop): the two lines start the width of the screen and shrink to the left; the text beside them arrives on the right; the section
//     then scrolls on.
// Reduced motion: everything in its final state, still.
import type { Mount, MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { mountCouncil, mountGlass, mountPillars, mountReveals } from "../b/motion";
import { mountOperateE } from "./operate-motion";
import { LANES, PILLARS, pFaces } from "../c/hero-geo";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const f = (n: number) => n.toFixed(3);
const K = 0.9;   // the hero drawing's size once it has settled into the pillars (barely smaller)

/* ==================================================================== the hero */
function mountHero(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  const hero = root.querySelector<HTMLElement>(".fe-hero");
  const art = hero?.querySelector<HTMLElement>(".fe-art"), svg = art?.querySelector<SVGSVGElement>(".fc-hiso");
  if (!hero || !art || !svg) return;
  const camEl = art.querySelector<HTMLElement>(".fe-art__cam")!;
  const q = <T extends Element>(s: string) => Array.from(svg.querySelectorAll<T>(s));
  const edges = q<SVGPathElement>(".fc-h-edge"), fills = q<SVGPolygonElement>(".fc-h-fill");
  const cols = q<SVGGElement>(".fc-col"), sig = q<SVGPolygonElement>(".fc-h-sig polygon");
  const solids = cols.map((g) => { const ps = g.querySelectorAll("polygon"); return ps.length ? { l: ps[0], r: ps[1], t: ps[2] } : null; });
  const wires = cols.map((g) => g.querySelector<SVGPathElement>(".fc-col__w")!);
  const words = Array.from(hero.querySelectorAll<HTMLElement>(".fb-wi")), after = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-rv]"));
  const lead = [...q(".fc-h-lead path"), ...q(".fc-chip")];

  if (reduced) { hero.classList.add("is-ready"); return () => hero.classList.remove("is-ready"); }

  // the columns' heights: grow (the build) × breath (idle) × wave (scroll: the page's scroll runs a wave across the field, back to front)
  const grow = PILLARS.map(() => 0), last = PILLARS.map(() => -1);
  let wave = 0, time = 0;
  const draw = () => {
    for (let k = 0; k < PILLARS.length; k++) {
      const s = solids[k]; if (!s) continue;
      const p = PILLARS[k], b = p.breathe >= 0 ? 1 + 0.08 * Math.sin(time * 0.9 + p.breathe) : 1;
      const w = 1 + 0.32 * Math.sin(wave - (p.i + p.j) * 0.55) * Math.min(1, Math.abs(wave) / 1.2);   // calm at the top of the page
      const t = grow[k] * b * w;
      if (Math.abs(t - last[k]) < 0.0004) continue;
      last[k] = t;
      const fc = pFaces(p, t);
      s.l.setAttribute("points", fc.left); s.r.setAttribute("points", fc.right); s.t.setAttribute("points", fc.top);
    }
  };

  /* the arrival */
  gsap.set(words, { yPercent: 112 });
  gsap.set(after, { autoAlpha: 0, y: 18 });
  gsap.set(edges, { strokeDasharray: "1 1", strokeDashoffset: 1 });
  gsap.set([...fills, svg.querySelector(".fc-h-ground"), svg.querySelector(".fc-h-grid"), ...sig, ...lead], { opacity: 0 });
  gsap.set(wires, { strokeDashoffset: 1, opacity: 1 });
  solids.forEach((s) => s && gsap.set([s.l, s.r, s.t], { opacity: 0 }));
  draw();
  hero.classList.add("is-ready");

  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(words, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.04 }, 0)
    .to(after, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.45)
    .to(svg.querySelector(".fc-h-ground"), { opacity: 1, duration: 1.2, ease: "power2.out" }, 0.1)
    .to(edges, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut", stagger: 0.14 }, 0.15)
    .to(fills, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.6)
    .to(svg.querySelector(".fc-h-grid"), { opacity: 1, duration: 0.6 }, 0.8)
    .to(wires, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: { amount: 0.7 } }, 0.75);
  const st0 = 1.2;
  PILLARS.forEach((p, k) => {
    const s = solids[k]; if (!s) return;
    const at = st0 + (k / PILLARS.length) * 0.8, o = { v: 0 };
    tl.to([s.l, s.r, s.t], { opacity: 1, duration: 0.2 }, at)
      .to(o, { v: 1, duration: 1.2, ease: "expo.out", onUpdate: () => { grow[k] = o.v; } }, at)
      .to(wires[k], { opacity: 0, duration: 0.6 }, at + 0.8);
  });
  tl.to(lead, { opacity: 1, duration: 0.6, stagger: 0.1 }, st0 + 1.1)
    .to(sig, { opacity: 1, duration: 0.5 }, st0 + 1.3);

  /* the scroll: the columns ride a wave with the page; over the first screen (desktop) the drawing travels into the stair's empty corner */
  let pt = 0, pc = 0, sy = scrollY, mx = 0, my = 0, cx = 0, cy = 0, alive = true, dx = 0, dy = 0, desk = false;
  const spot = Array.from(root.querySelectorAll<HTMLElement>(".fe-pl__spot")).at(-1);   // the third pillar's empty step (the grid adds crosshairs after the cells)
  const measure = () => {
    desk = innerWidth >= 860;
    art.style.transform = "";
    if (!desk || !spot) { dx = dy = 0; return; }
    // the plinth's foot lands just under the third pillar's step: the drawing (shrunk to K around its middle) rises out of the stair's empty corner
    const a = art.getBoundingClientRect(), s = spot.getBoundingClientRect();
    dy = Math.max(0, s.bottom + 24 - a.bottom + (a.height * (1 - K)) / 2);
    dx = s.left + s.width / 2 - (a.left + a.width / 2);
  };
  ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (s) => { pt = s.progress; }, onRefreshInit: measure, onRefresh: (s) => { pt = s.progress; } });
  // alive while the hero or the pillars (where the drawing settles) are on screen
  ScrollTrigger.create({ trigger: hero, start: "top bottom", endTrigger: root.querySelector(".fe-pl") ?? hero, end: "bottom top", onToggle: (s) => { alive = s.isActive; } });
  const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  measure();

  const tick = (_t: number, dt: number) => {
    if (!alive) return;
    time += dt / 1000;
    pc += (pt - pc) * 0.14; cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    const e = ease(seg(pc, 0, 1));
    sy += (scrollY - sy) * 0.14;
    wave = (sy / innerHeight) * Math.PI * 1.6;
    draw();
    art.style.transform = desk ? `translate3d(${(dx * e).toFixed(1)}px, ${(dy * e).toFixed(1)}px, 0) scale(${f(1 - (1 - K) * e)})` : "";
    camEl.style.transform = `translate3d(${f(cx * -14)}px, ${f(cy * -10)}px, 0) rotate(${f(cx * -0.8)}deg)`;
    // the signals: green squares running the seams of the plinth's top
    for (let i = 0; i < sig.length; i++) {
      const L = LANES[i], u = (time * (0.07 + i * 0.012) + i * 0.27) % 1;
      const x = L.a[0] + (L.b[0] - L.a[0]) * u, y = L.a[1] + (L.b[1] - L.a[1]) * u;
      sig[i].setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      sig[i].style.fillOpacity = f(Math.min(1, u * 8, (1 - u) * 8));
    }
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); removeEventListener("pointermove", onMove); tl.kill(); art.style.transform = ""; camEl.style.transform = ""; hero.classList.remove("is-ready"); };
}

/* ==================================================================== smaller */
function mountSmall(root: HTMLElement, { reduced, ScrollTrigger }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".fe-small");
  if (!sec || reduced || !matchMedia("(min-width: 860px)").matches) return;
  const stage = sec.querySelector<HTMLElement>(".fe-small__stage")!, h = sec.querySelector<HTMLElement>(".fe-small__h")!, body = sec.querySelector<HTMLElement>(".fe-small__body")!;
  const acc = sec.querySelector<HTMLElement>(".fe-small__acc")!, sq = sec.querySelector<HTMLElement>(".fe-small__sq")!;
  const sns = Array.from(sec.querySelectorAll<HTMLElement>(".fe-sn")), probe = root.querySelector<HTMLElement>(".fb-tr .fb-h2");
  const end = sec.querySelector<HTMLElement>(".fe-small__end")!;   // its rule arrives with its line
  sec.classList.add("is-scene");
  let vh = innerHeight, big = 1, target = 0.5, H = 1, accW = 0;
  const measure = () => {
    vh = stage.clientHeight; h.style.transform = ""; h.style.letterSpacing = "";
    big = parseFloat(getComputedStyle(h).fontSize); H = h.offsetHeight; accW = acc.offsetWidth;
    // the heading it settles into: a section heading's size, and never past the text's column on the right
    const room = body.getBoundingClientRect().left - stage.getBoundingClientRect().left - 48;
    target = Math.min((probe ? parseFloat(getComputedStyle(probe).fontSize) : 56) * 1.1 / big, room / Math.max(1, h.scrollWidth));
  };
  const apply = (p: number) => {
    const e = ease(seg(p, 0.08, 0.5)), s = 1 + (target - 1) * e;
    h.style.letterSpacing = `${f(-0.02 - 0.015 * e)}em`;
    h.style.transform = `translate3d(0, ${((vh - H * s) / 2).toFixed(1)}px, 0) scale(${f(s)})`;
    acc.style.transform = `scale(${f(1 - 0.12 * e)})`;
    sq.style.transform = `translateX(${(-accW * 0.12 * e).toFixed(1)}px) scale(${f(1 - 0.4 * e)})`; sq.style.borderRadius = `${(50 * e).toFixed(1)}%`;
    sns.forEach((el, i) => { el.style.opacity = f(seg(p, 0.38 + i * 0.07, 0.48 + i * 0.07)); });
    end.style.borderTopColor = `rgb(38 38 38 / ${f(0.24 * seg(p, 0.38 + (sns.length - 1) * 0.07, 0.48 + (sns.length - 1) * 0.07))})`;
  };
  ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress), onRefreshInit: measure, onRefresh: (s) => apply(s.progress) });
  measure(); apply(0);
  return () => { sec.classList.remove("is-scene"); [h, acc, sq, end, ...sns].forEach((el) => el.removeAttribute("style")); };
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHero(root, ctx), mountReveals(root, ctx), mountPillars(root, ctx), mountSmall(root, ctx), mountGlass(root, ctx), mountCouncil(root, ctx), mountOperateE(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
