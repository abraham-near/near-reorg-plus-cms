// Foundation B, the behaviour (markup: FoundationB.tsx, Art.tsx). Everything here is transforms, opacity and stroke offsets; reduced motion leaves every
// drawing at its finished frame (the markup) and every text in place.
//   - v3's ruled grid (../../v3/proof-deeper/motion.ts): the ecosystem's rows, the close scene, data-motion on the page;
//   - the hero (hero-motion.ts);
//   - [data-fb-rv]: text rises once as it comes in;
//   - the pillars: each drawing builds once as it comes in (the Stiftung closes and is sealed, the stack grows, the lattice disperses); a little parallax;
//   - the thesis: the word "smaller" stands huge under the line, then shrinks into its place at the end of it (scrubbed, the stage sticks); the text follows;
//   - transparency: the glass draws, the funds drop in; a scan plane passes slowly through the glass while it is in view;
//   - the Council: the two bodies settle, the lines arrive; a green pulse runs down (empowers), a paper one back up (reports back);
//   - how the Foundation operates: the drawing sticks while the three activities pass; each one steps it to its state (resources flow out, the functions
//     without a steward are taken up, the treasury shrinks as the ecosystem closes its own ring); the count and the rail follow.
import type { MotionCtx, Mount } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { mountHero } from "./hero-motion";
import { ease3, smooth } from "./iso";

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
export const mountPillars: Mount = (root, { gsap, ScrollTrigger, reduced }) => {
  const items = $$<HTMLElement>(root, ".fb-pillar");
  if (reduced || !items.length) return;
  items.forEach((it, i) => {
    const svg = it.querySelector<SVGSVGElement>("svg.fb-art")!; if (!svg) return;
    const tl = once(gsap, ScrollTrigger, it, "top 80%");
    const dots = $$(svg, ".fb-a-dots"), chips = $$(svg, ".fb-a-chip");
    gsap.set(dots, { opacity: 0 });
    tl.to(dots, { opacity: 1, duration: 0.8, ease: "sine.out" }, 0);
    if (i === 0) {
      const body = svg.querySelector(".fb-a-body"), lid = svg.querySelector(".fb-a-lid"), strap = $$(svg, ".fb-a-strap path"), fill = svg.querySelector(".fb-a-strapfill");
      const seal = svg.querySelector(".fb-a-seal > *") ? $$(svg, ".fb-a-seal > *") : [], shadow = svg.querySelector(".fb-a-shadow");
      gsap.set(body, { y: 18, opacity: 0 }); gsap.set(lid, { y: -46, opacity: 0 }); draw(gsap, strap); gsap.set([fill, shadow], { opacity: 0 });
      gsap.set(seal, { scale: 1.8, opacity: 0, transformOrigin: "50% 50%" });
      tl.to(body, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1)
        .to(shadow, { opacity: 1, duration: 0.6 }, 0.2)
        .to(lid, { y: 0, opacity: 1, duration: 1.1, ease: "power3.inOut" }, 0.35)
        .to(strap, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.08 }, 1.2)
        .to(fill, { opacity: 1, duration: 0.4 }, 1.5)
        .to(seal, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2)", stagger: 0.06 }, 1.75);
      chipIn(gsap, tl, chips, 2.0);
    } else if (i === 1) {
      const cubes = $$<SVGGElement>(svg, ".fb-a-col").reverse().flatMap((c) => $$(c, ".fb-a-cube")), trend = $$(svg, ".fb-a-trend, .fb-a-tick");
      gsap.set(cubes, { y: -34, opacity: 0 }); gsap.set(trend, { opacity: 0 });
      tl.to(cubes, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.09 }, 0.15)
        .to(trend, { opacity: 1, duration: 0.6, ease: "sine.out", stagger: 0.15 }, 1.25);
      chipIn(gsap, tl, chips, 1.45);
    } else {
      const nodes = $$<SVGGElement>(svg, ".fb-a-node"), ghost = svg.querySelector(".fb-a-ghost"), links = $$(svg, ".fb-a-link");
      nodes.forEach((n) => gsap.set(n, { x: Number(n.dataset.dx), y: Number(n.dataset.dy), opacity: 0 }));
      gsap.set(ghost, { opacity: 0 }); draw(gsap, links);
      tl.to(nodes, { opacity: 1, duration: 0.3, stagger: 0.02 }, 0.1)
        .to(nodes, { x: 0, y: 0, duration: 1.2, ease: "power3.inOut", stagger: 0.04 }, 0.3)
        .to(ghost, { opacity: 1, duration: 0.6 }, 1.0)
        .to(links, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.06 }, 1.2);
      chipIn(gsap, tl, chips, 1.7);
    }
  });
  // a little parallax: the drawings drift against their text (desktop)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 860px)", () => {
    items.forEach((it, i) => {
      const art = it.querySelector(".fb-pillar__art");
      gsap.fromTo(art, { y: 30 + i * 10 }, { y: -30 - i * 10, ease: "none", scrollTrigger: { trigger: it, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  });
};

/* ── the thesis: "smaller" ── */
const mountMission: Mount = (root, { ScrollTrigger, reduced }) => {
  const sec = root.querySelector<HTMLElement>("[data-mission]"); if (!sec || reduced) return;
  const h = sec.querySelector<HTMLElement>(".fb-mission__h")!, slot = sec.querySelector<HTMLElement>(".fb-mission__sm")!, para = sec.querySelector<HTMLElement>(".fb-mission__b")!;
  // the big word: a copy of the slot's word, out of the reading order; the slot keeps the real one (read, never shown until the copy lands on it)
  const big = document.createElement("span");
  big.className = "fb-mission__big accent"; big.setAttribute("aria-hidden", "true"); big.textContent = slot.textContent || "";
  h.appendChild(big);
  sec.classList.add("is-scene");
  let m = { tx: 0, ty: 0, k: 1 }, p = 0;
  const measure = () => {
    big.style.transform = "";
    const a = big.getBoundingClientRect(), b = slot.querySelector<HTMLElement>(".accent")!.getBoundingClientRect();
    m = { tx: b.left - a.left, ty: b.top - a.top, k: b.width / Math.max(1, a.width) };
  };
  const render = () => {
    const e = ease3(smooth(0.14, 0.62, p)), k = 1 + (m.k - 1) * e;
    big.style.transform = `translate3d(${(m.tx * e).toFixed(1)}px, ${(m.ty * e).toFixed(1)}px, 0) scale(${k.toFixed(4)})`;
    const done = e > 0.995;
    big.style.opacity = done ? "0" : "1"; slot.style.opacity = done ? "1" : "0";
    const o = smooth(0.56, 0.82, p);
    para.style.opacity = o.toFixed(3); para.style.transform = `translate3d(0, ${((1 - o) * 26).toFixed(1)}px, 0)`;
  };
  const st = ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (s) => { p = s.progress; render(); }, onRefresh: (s) => { measure(); p = s.progress; render(); } });
  measure(); render();
  document.fonts?.ready.then(() => { measure(); render(); });
  return () => { st.kill(); big.remove(); sec.classList.remove("is-scene"); slot.style.opacity = ""; para.style.opacity = ""; para.style.transform = ""; };
};

/* ── transparency: the glass ── */
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
export const mountCouncil: Mount = (root, { gsap, ScrollTrigger, reduced }) => {
  const fig = root.querySelector<HTMLElement>("[data-council]"); if (!fig) return;
  const svg = fig.querySelector("svg")!;
  const pd = svg.querySelector<SVGCircleElement>(".fb-a-pulse--d")!, pu = svg.querySelector<SVGCircleElement>(".fb-a-pulse--u")!;
  if (reduced) { gsap.set([pd, pu], { opacity: 0 }); return; }
  const dy = (c: SVGCircleElement) => Number(c.dataset.y1) - Number(c.dataset.y0);
  const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
  loop.set([pd, pu], { y: 0, opacity: 0 })
    .to(pd, { opacity: 1, duration: 0.25 }, 0).to(pd, { y: dy(pd), duration: 1.6, ease: "power1.inOut" }, 0).to(pd, { opacity: 0, duration: 0.25 }, 1.4)
    .to(pu, { opacity: 1, duration: 0.25 }, 1.9).to(pu, { y: dy(pu), duration: 1.6, ease: "power1.inOut" }, 1.9).to(pu, { opacity: 0, duration: 0.25 }, 3.3);
  const tl = once(gsap, ScrollTrigger, fig, "top 75%");
  const dots = $$(svg, ".fb-a-dots"), exec = svg.querySelector(".fb-a-exec"), team = $$(svg, ".fb-a-team > g"), council = svg.querySelector(".fb-a-council"), seats = $$(svg, ".fb-a-seats > g");
  const lines = $$(svg, ".fb-a-down, .fb-a-downh, .fb-a-up, .fb-a-uph"), caps = $$(svg, ".fb-a-cap"), chips = $$(svg, ".fb-a-chip");
  gsap.set(dots, { opacity: 0 }); gsap.set(exec, { y: 22, opacity: 0 }); gsap.set([...team, ...seats], { y: -16, opacity: 0 }); gsap.set(council, { y: -40, opacity: 0 });
  gsap.set([...lines, ...caps, pd, pu], { opacity: 0 });
  tl.to(dots, { opacity: 1, duration: 0.8 }, 0)
    .to(exec, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1)
    .to(team, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.08 }, 0.5)
    .to(council, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" }, 0.4)
    .to(seats, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07 }, 0.9)
    .to(lines.slice(0, 2), { opacity: 1, duration: 0.6 }, 1.3).to(caps[0], { opacity: 1, duration: 0.5 }, 1.4)
    .to(lines.slice(2), { opacity: 1, duration: 0.6 }, 1.7).to(caps[1], { opacity: 1, duration: 0.5 }, 1.8);
  chipIn(gsap, tl, chips, 1.1);
  let ready = false, seen = false;
  const sync = () => (ready && seen ? loop.play() : loop.pause());
  tl.eventCallback("onComplete", () => { ready = true; sync(); });
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.1 }); io.observe(fig);
  return () => io.disconnect();
};

/* ── how the Foundation operates ── */
export const mountOperate: Mount = (root, { gsap, ScrollTrigger, reduced }) => {
  const sec = root.querySelector<HTMLElement>("[data-op]"); if (!sec) return;
  const svg = sec.querySelector<SVGSVGElement>(".fb-art--operate")!, steps = $$<HTMLElement>(sec, ".fb-op__step");
  const fly = $$<SVGGElement>(svg, ".fb-op-flyc"), arcs = $$<SVGPathElement>(svg, ".fb-op-arc"), coins = $$(svg, ".fb-op-coin");
  const solids = $$(svg, ".fb-op-solid"), ghosts = $$(svg, ".fb-op-ghost"), fchips = $$(svg, ".fb-op-fchip"), tchip = $$(svg, ".fb-op-tchip");
  const spokes = svg.querySelector(".fb-op-spokes"), links = $$(svg, ".fb-op-link"), tscale = svg.querySelector<SVGGElement>(".fb-op-tscale")!, tcoins = svg.querySelector(".fb-op-tcoins");
  if (reduced) { gsap.set([...fly, ...arcs, spokes], { opacity: 0 }); gsap.set(ghosts, { opacity: 0 }); gsap.set(tscale, { scale: 0.55, svgOrigin: tscaleOrigin(svg) }); steps.forEach((s) => s.classList.add("is-on")); return; }
  sec.classList.add("is-story");
  // the fly-out coins ride their arcs
  const L = arcs.map((a) => a.getTotalLength());
  const ride = fly.map(() => ({ t: 0 }));
  const place = (i: number) => { const p = arcs[i].getPointAtLength(ride[i].t * L[i]); fly[i].setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); };
  fly.forEach((_, i) => place(i));
  gsap.set(tscale, { svgOrigin: tscaleOrigin(svg) });
  // the start: the treasury holds it all, the functions are ghosts, the spokes run to the middle
  gsap.set([...fly, ...coins, ...solids, ...arcs], { opacity: 0 });
  gsap.set(solids, { y: -14 }); draw(gsap, links);
  fchips.concat(tchip).forEach((c) => gsap.set(c, { svgOrigin: `${c.dataset.cx} ${c.dataset.cy}` }));
  gsap.set(fchips, { opacity: 0, scale: 0.88 });
  const tl = gsap.timeline({ paused: true });
  // 0 → 1: allocate
  tl.addLabel("s0", 0)
    .to(arcs, { opacity: 1, duration: 0.3, stagger: 0.08 }, 0)
    .to(fly, { opacity: 1, duration: 0.15, stagger: 0.12 }, 0.05);
  fly.forEach((_, i) => tl.to(ride[i], { t: 1, duration: 0.7, ease: "power2.inOut", onUpdate: () => place(i) }, 0.05 + i * 0.12));
  fly.forEach((f, i) => tl.to(f, { opacity: 0, duration: 0.1 }, 0.72 + i * 0.12).to(coins[i], { opacity: 1, duration: 0.15 }, 0.7 + i * 0.12));
  tl.to(arcs, { opacity: 0.35, duration: 0.3 }, 1.1).addLabel("s1", 1.25);
  // 1 → 2: the functions without a steward are taken up
  tl.to(arcs, { opacity: 0, duration: 0.3 }, 1.3)
    .to(solids, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, 1.35)
    .to(ghosts, { opacity: 0, duration: 0.4, stagger: 0.12 }, 1.55)
    .to(fchips, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out", stagger: 0.12 }, 1.6)
    .addLabel("s2", 2.3);
  // 2 → 3: the ecosystem closes its own ring; the treasury shrinks
  tl.to(spokes, { opacity: 0, duration: 0.5 }, 2.35)
    .to(links, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut", stagger: 0.07 }, 2.4)
    .to(tscale, { scale: 0.55, duration: 0.9, ease: "power3.inOut" }, 2.45)
    .to(tcoins, { opacity: 0.5, duration: 0.6 }, 2.5)
    .to(tchip, { y: 22, duration: 0.9, ease: "power3.inOut" }, 2.45)
    .addLabel("s3", 3.3);
  const labels = ["s0", "s1", "s2", "s3"];
  const count = sec.querySelector<HTMLElement>(".fb-op__ci");
  let at = -1;
  const go = (i: number) => {
    if (i === at) return; at = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    if (count) count.style.setProperty("--ci", String(Math.max(0, i)));
    tl.tweenTo(labels[i + 1], { duration: Math.max(0.4, Math.abs(tl.labels[labels[i + 1]] - tl.time()) * 1.1), ease: "power1.inOut" });
  };
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 62%", onEnter: () => go(i), onEnterBack: () => go(i), onLeaveBack: () => { if (i === 0) go(-1); } }));
  const fill = sec.querySelector<HTMLElement>(".fb-op__fill"), list = sec.querySelector<HTMLElement>(".fb-op__steps");
  if (fill && list) ScrollTrigger.create({ trigger: list, start: "top 62%", end: "bottom 62%", onUpdate: (s) => { fill.style.transform = `scaleY(${s.progress.toFixed(4)})`; } });
  return () => { sec.classList.remove("is-story"); steps.forEach((s) => s.classList.remove("is-on")); };
};
function tscaleOrigin(svg: SVGSVGElement) {
  const t = svg.querySelector<SVGGElement>(".fb-op-tscale")!.getBBox();
  return `${(t.x + t.width / 2).toFixed(1)} ${(t.y + t.height).toFixed(1)}`;
}

/** every section's motion, under one gsap context (useScrollMotion) */
export const mountAll: Mount = (root, ctx) => {
  const offs = [gridMount(root, ctx), mountHero(root, ctx), mountReveals(root, ctx), mountPillars(root, ctx), mountMission(root, ctx), mountGlass(root, ctx), mountCouncil(root, ctx), mountOperate(root, ctx)];
  return () => offs.forEach((o) => { if (typeof o === "function") o(); });
};
