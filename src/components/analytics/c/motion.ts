// Analytics C's motion. Everything here is extra: the markup is the finished page, and with reduced motion only the interactions run.
//   - the ruled grid (../../v3/proof-deeper/motion.ts): rows draw in, crosshairs, [data-rv] text rises;
//   - hero: the network runs while it is in view (a block lands on a shard, the plate flashes as it commits it, a receipt arcs to a neighbour; the
//     beacon pulses); the layers lean to the pointer at their own depths, the shard under it lifts and names itself; scrolled away, the plates spread;
//   - core stats (desktop): the stage holds (CSS sticky) while the scroll walks the five stats; each one's figure counts up as its drawing builds, and
//     the row below fills; its buttons jump to a stat. Phones: each stat builds once as it comes into view;
//   - revenue: the figure counts up, the sparkline draws, a scrubber follows the pointer (or the keys);
//   - status: the 60-day strips light up bar by bar; hovering a day names it; the heartbeat runs (CSS);
//   - tools: the card tilts toward the pointer and its tile lifts; ETPs: the arrow is drawn to the pointer.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mount as gridMount } from "../../v3/proof-deeper/motion";
import { PAIRS, PLATES, U } from "./HeroScene";
import { REVENUE } from "../content";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** "$11.6M" → a writer for any fraction of it ("$0.0M" … "$11.6M") */
function counter(v: string) {
  const m = v.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return () => v;
  const n = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length;
  return (k: number) => (k >= 1 ? v : m[1] + (n * k).toFixed(dec) + m[3]);
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const offs: (void | (() => void))[] = [gridMount(root, ctx), hero(root, ctx), story(root, ctx), cards(root, ctx), hovers(root, ctx)];
  return () => offs.forEach((o) => typeof o === "function" && o());
}

/* ───────────────────────── the scene engine: each part with a build window [a, b] and a mode, placed for a progress t ───────────────────────── */
type Part = { el: SVGElement; a: number; b: number; m: string; d: number; last: string };
export function engine(svg: Element) {
  const parts: Part[] = [...svg.querySelectorAll<SVGElement>("[data-a]")].map((el) => ({
    el, a: +el.dataset.a!, b: +el.dataset.b!, m: el.dataset.m || "fade", d: +(el.dataset.d || 40), last: "",
  }));
  return (t: number) => {
    for (const p of parts) {
      const k = smooth(p.a, p.b, t);
      let key: string;
      if (p.m === "drop") key = `${k}`;
      else key = k.toFixed(3);
      if (key === p.last) continue;
      p.last = key;
      const s = p.el.style;
      if (p.m === "drop") { const y = -p.d * Math.pow(1 - k, 2); s.opacity = String(clamp01(k * 2.5)); s.transform = y ? `translate(0px, ${y.toFixed(2)}px)` : ""; }
      else if (p.m === "pop") { s.opacity = String(k); s.transform = k < 1 ? `scale(${(0.55 + 0.45 * easeOut(k)).toFixed(3)})` : ""; }
      else if (p.m === "draw") s.strokeDashoffset = String(1 - k);
      else if (p.m === "out") s.opacity = String(1 - k);
      else s.opacity = String(k);
    }
  };
}

/* ───────────────────────── 1 · hero ───────────────────────── */
function hero(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".anc-hero"), svg = sec?.querySelector<SVGSVGElement>(".anc-hs");
  if (!sec || !svg) return;
  const ac = new AbortController(), on = { signal: ac.signal, passive: true } as AddEventListenerOptions;
  const plateEls = new Map<number, SVGGElement>();
  svg.querySelectorAll<SVGGElement>(".anc-h-plate").forEach((g) => plateEls.set(+g.dataset.k!, g));
  const blk = (k: number) => plateEls.get(k)!.querySelector<SVGGElement>(".anc-h-blk")!;
  const flash = (k: number) => plateEls.get(k)!.querySelector<SVGPolygonElement>(".anc-h-flash")!;
  const arcs = [...svg.querySelectorAll<SVGPathElement>(".anc-h-arc")];
  const dot = svg.querySelector<SVGCircleElement>(".anc-h-dot")!;
  const tip = svg.querySelector<SVGGElement>(".anc-h-tip"), tipT = tip?.querySelector("text");

  /* the shard under the pointer lifts and names itself (also with reduced motion: it is an interaction) */
  plateEls.forEach((g, k) => {
    g.addEventListener("pointerenter", () => {
      g.classList.add("is-hover");
      if (tip && tipT) { tipT.textContent = `SHARD ${String(k).padStart(2, "0")}`; const m = PLATES[k].mid; tip.setAttribute("transform", `translate(${m[0].toFixed(1)} ${(m[1] - 2.9 * U).toFixed(1)})`); tip.setAttribute("opacity", "1"); }
    }, { signal: ac.signal });
    g.addEventListener("pointerleave", () => { g.classList.remove("is-hover"); tip?.setAttribute("opacity", "0"); }, { signal: ac.signal });
  });
  if (reduced) return () => ac.abort();

  sec.classList.add("is-live");
  const lens = arcs.map((a) => a.getTotalLength());
  gsap.set(arcs, { opacity: 0 });
  gsap.set(dot, { opacity: 0 });
  plateEls.forEach((_, k) => gsap.set(blk(k), { opacity: 0 }));

  /* the beacon: three rings, one after the other */
  const rings = [...svg.querySelectorAll<SVGEllipseElement>(".anc-h-ring")];
  const slow = root.dataset.health !== "ok";
  const ringTl = gsap.timeline({ repeat: -1 });
  rings.forEach((r, i) => ringTl.fromTo(r, { scale: 0.4, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3.4, opacity: 0, duration: slow ? 3.6 : 2.4, ease: "power1.out" }, i * (slow ? 1.2 : 0.8)));

  /* the network: a block every ~0.7 s on a free shard; it lands, the plate commits it, a receipt arcs to a neighbour */
  const busy = new Set<number>();
  let alive = false, timer: gsap.core.Tween | null = null, arcsOn = 0;
  const live: gsap.core.Timeline[] = [];
  const spawn = () => {
    timer = gsap.delayedCall(0.55 + Math.random() * 0.45, spawn);
    if (!alive) return;
    const free = PLATES.map((p) => p.k).filter((k) => !busy.has(k));
    if (!free.length) return;
    const k = free[Math.floor(Math.random() * free.length)];
    busy.add(k);
    const b = blk(k), fl = flash(k);
    const tl = gsap.timeline({ onComplete: () => { busy.delete(k); live.splice(live.indexOf(tl), 1); } });
    live.push(tl);
    tl.fromTo(b, { y: -3.4 * U, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.in" })
      .fromTo(fl, { opacity: 0.9 }, { opacity: 0, duration: 0.8, ease: "power2.out" })
      .to(b, { y: -0.5 * U, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.5");
    if (arcsOn < 2) {
      const opts = PAIRS.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === k || p[1] === k);
      const { p, i } = opts[Math.floor(Math.random() * opts.length)];
      const fwd = p[0] === k, a = arcs[i], L = lens[i], to = fwd ? p[1] : p[0], st = { t: 0 };
      arcsOn++;
      tl.add(() => { gsap.set(a, { opacity: 0.75, strokeDasharray: L, strokeDashoffset: fwd ? L : -L }); gsap.set(dot, { opacity: 1 }); }, 0.62)
        .to(st, {
          t: 1, duration: 0.9, ease: "power1.inOut",
          onUpdate: () => {
            const pt = a.getPointAtLength((fwd ? st.t : 1 - st.t) * L);
            dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1));
            a.style.strokeDashoffset = String((fwd ? 1 : -1) * (1 - st.t) * L);
          },
        }, 0.62)
        .to(dot, { opacity: 0, duration: 0.2 }, 1.52)
        .fromTo(flash(to), { opacity: 0.55 }, { opacity: 0, duration: 0.6 }, 1.5)
        .to(a, { opacity: 0, duration: 0.5, onComplete: () => { arcsOn--; } }, 1.55);
    }
  };
  spawn();
  const io = new IntersectionObserver(([e]) => {
    alive = e.isIntersecting;
    if (alive) { ringTl.play(); live.forEach((t) => t.play()); } else { ringTl.pause(); live.forEach((t) => t.pause()); }
  });
  io.observe(sec);

  /* the lean: each layer follows the pointer at its own depth */
  const cam = sec.querySelector<HTMLElement>(".anc-hero__cam")!;
  const layers = [...svg.querySelectorAll<SVGGElement>("[data-depth]")].map((g) => ({ d: +g.dataset.depth!, x: gsap.quickTo(g, "x", { duration: 0.9, ease: "power3.out" }), y: gsap.quickTo(g, "y", { duration: 0.9, ease: "power3.out" }) }));
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      const r = cam.getBoundingClientRect(); if (r.bottom < 0) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      layers.forEach((l) => { l.x(nx * 9 * l.d); l.y(ny * 6 * l.d); });
    }, on);
  }

  /* scrolled away: the plates spread from the centre, the drawing drifts slower than the page */
  const plates = PLATES.map((p) => ({ g: plateEls.get(p.k)!, dx: p.c - 1, dy: p.r - 1 }));
  const C = Math.cos(Math.PI / 6);
  ScrollTrigger.create({
    trigger: sec, start: "top top", end: "bottom top",
    onUpdate: (s) => {
      const sp = smooth(0, 1, s.progress) * 1.1;
      plates.forEach(({ g, dx, dy }) => { g.style.transform = sp ? `translate(${((dx - dy) * C * sp * U).toFixed(1)}px, ${((dx + dy) * 0.5 * sp * U).toFixed(1)}px)` : ""; });
      cam.style.transform = `translate3d(0, ${(s.progress * 90).toFixed(1)}px, 0)`;
    },
  });

  return () => { ac.abort(); io.disconnect(); timer?.kill(); ringTl.kill(); live.forEach((t) => t.kill()); sec.classList.remove("is-live"); };
}

/* ───────────────────────── 2 · core stats ───────────────────────── */
const PIN_Q = "(min-width: 1024px) and (min-height: 600px)";
function story(root: HTMLElement, { gsap, ScrollTrigger, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>(".anc-story");
  if (!sec || reduced) return;
  const steps = [...sec.querySelectorAll<HTMLElement>(".anc-step")];
  const N = steps.length;
  const builds = steps.map((s) => { const svg = s.querySelector(".anc-sc"); return svg ? engine(svg) : () => {}; });
  const nums = steps.map((s) => { const el = s.querySelector<HTMLElement>(".anc-num__v")!; return { el, w: counter(el.dataset.v || el.textContent || ""), last: "" }; });
  const setNum = (i: number, k: number) => { const n = nums[i], v = n.w(k); if (v !== n.last) { n.last = v; n.el.textContent = v; } };
  const rail = [...sec.querySelectorAll<HTMLButtonElement>(".anc-rail__b")];
  const bars = rail.map((b) => b.querySelector<HTMLElement>(".anc-rail__bar i")!);
  const countI = sec.querySelector<HTMLElement>(".anc-count__i");
  const ac = new AbortController();
  const mm = gsap.matchMedia();

  mm.add(PIN_Q, () => {
    sec.classList.add("is-pin");
    let active = -1;
    const geo = () => { const top = sec.getBoundingClientRect().top + scrollY, len = (sec.offsetHeight - innerHeight) / N; return { top, len }; };
    const apply = (f: number) => {
      steps.forEach((s, i) => {
        const enter = i === 0 ? 1 : smooth(i - 0.01, i + 0.12, f), exit = i === N - 1 ? 1 : 1 - smooth(i + 1 - 0.13, i + 1 - 0.02, f);
        const v = Math.min(enter, exit);
        s.style.opacity = v.toFixed(3);
        s.style.visibility = v < 0.01 ? "hidden" : "visible";
        const y = (1 - enter) * 48 - (1 - exit) * 48;
        s.style.setProperty("--y", `${y.toFixed(1)}px`);
        const t = i === 0 ? clamp01((f + 0.75) / 1.05) : clamp01((f - i + 0.1) / 0.7);
        builds[i](t);
        setNum(i, easeOut(smooth(0.02, 0.85, t)));
      });
      const a = Math.max(0, Math.min(N - 1, Math.floor(f + 0.04)));
      bars.forEach((b, i) => { b.style.transform = `scaleX(${clamp01(f - i + 0.04).toFixed(3)})`; });
      if (a !== active) {
        active = a;
        rail.forEach((b, i) => { b.classList.toggle("is-on", i === a); b.classList.toggle("is-done", i < a); if (i === a) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
        if (countI) countI.textContent = String(a + 1).padStart(2, "0");
      }
    };
    const st = ScrollTrigger.create({
      trigger: sec, start: "top bottom", end: "bottom bottom",
      onUpdate: () => { const g = geo(); apply((scrollY - g.top) / g.len); },
      onRefresh: () => { const g = geo(); apply((scrollY - g.top) / g.len); },
    });
    rail.forEach((b, i) => b.addEventListener("click", () => { const g = geo(); scrollTo({ top: g.top + (i + 0.5) * g.len, behavior: "smooth" }); }, { signal: ac.signal }));
    // a keyboard user tabbing into a stat's link: bring that stat on stage
    steps.forEach((s, i) => s.addEventListener("focusin", () => { const g = geo(); if (Math.floor((scrollY - g.top) / g.len) !== i) scrollTo({ top: g.top + (i + 0.5) * g.len }); }, { signal: ac.signal }));
    return () => {
      st.kill(); sec.classList.remove("is-pin");
      steps.forEach((s, i) => { s.style.opacity = s.style.visibility = ""; s.style.removeProperty("--y"); builds[i](1); setNum(i, 1); });
    };
  });

  mm.add(`not all and ${PIN_Q}`, () => {
    // phones and tablets: each stat builds once as it comes into view
    const tweens: gsap.core.Tween[] = [];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const i = steps.indexOf(e.target as HTMLElement), o = { t: 0 };
      tweens.push(gsap.to(o, { t: 1, duration: 2, ease: "power1.inOut", onUpdate: () => { builds[i](o.t); setNum(i, easeOut(smooth(0, 0.85, o.t))); } }));
    }), { rootMargin: "0px 0px -20% 0px" });
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.8) return; builds[i](0); setNum(i, 0); io.observe(s); });
    return () => { io.disconnect(); tweens.forEach((t) => t.kill()); steps.forEach((_, i) => { builds[i](1); setNum(i, 1); }); };
  });

  return () => { ac.abort(); mm.revert(); };
}

/* ───────────────────────── 3 & 4 · the two cards ───────────────────────── */
function cards(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const ac = new AbortController(), on = { signal: ac.signal };
  /* the sparkline's scrubber: the pointer, or the arrow keys once it has focus */
  const fig = root.querySelector<HTMLElement>(".anc-spark");
  const sp = REVENUE.spark, n = sp.length, lo = Math.min(...sp) - 4, hi = Math.max(...sp) + 2;
  if (fig) {
    const x = fig.querySelector<SVGLineElement>(".anc-spark__x")!, dot = fig.querySelector<HTMLElement>(".anc-spark__dot")!;
    const w = fig.querySelector<HTMLElement>(".anc-spark__w")!, p = fig.querySelector<HTMLElement>(".anc-spark__p")!;
    const SW = 360, SH = 112, SP = 8;
    const set = (i: number) => {
      const X = SP + (i / (n - 1)) * (SW - 2 * SP), Y = SH - 10 - ((sp[i] - lo) / (hi - lo)) * (SH - 26);
      x.setAttribute("x1", X.toFixed(1)); x.setAttribute("x2", X.toFixed(1));
      dot.style.left = `${((X / SW) * 100).toFixed(2)}%`; dot.style.top = `${((Y / SH) * 100).toFixed(2)}%`;
      w.textContent = `Week ${i + 1}`; p.textContent = `${sp[i]}%`;
      fig.classList.toggle("is-scrub", i !== n - 1);
    };
    fig.addEventListener("pointermove", (e) => { const r = fig.getBoundingClientRect(); set(Math.round(clamp01((e.clientX - r.left) / r.width) * (n - 1))); }, on);
    fig.addEventListener("pointerleave", () => set(n - 1), on);
  }
  /* status: a hovered day names itself */
  root.querySelectorAll<HTMLElement>(".anc-svc__i").forEach((li) => {
    const u = li.querySelector<HTMLElement>(".anc-svc__u")!, base = u.textContent || "";
    li.querySelectorAll<HTMLElement>(".anc-strip i").forEach((d, i, all) => {
      d.addEventListener("pointerenter", () => { const ago = all.length - 1 - i; u.textContent = `${ago ? `${ago}d ago` : "Today"} · ${d.classList.contains("is-down") ? "Outage" : d.classList.contains("is-deg") ? "Degraded" : "Operational"}`; u.classList.add("is-day"); }, on);
    });
    li.addEventListener("pointerleave", () => { u.textContent = base; u.classList.remove("is-day"); }, on);
  });
  if (reduced) return () => ac.abort();
  /* arrivals: the figure counts up, the line draws, the strips light up */
  const els = [...root.querySelectorAll<HTMLElement>(".anc-rev, .anc-st")];
  const tweens: gsap.core.Tween[] = [];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    e.target.classList.add("is-on");
    const num = e.target.querySelector<HTMLElement>(".anc-rev__n");
    if (num) { const w = counter(num.dataset.v || ""), o = { k: 0 }; tweens.push(gsap.to(o, { k: 1, duration: 1.6, delay: 0.3, ease: "power2.out", onUpdate: () => { num.textContent = w(o.k); } })); num.textContent = w(0); }
  }), { rootMargin: "0px 0px -18% 0px" });
  root.classList.add("anc-cards-motion");
  els.forEach((el) => io.observe(el));
  return () => { ac.abort(); io.disconnect(); tweens.forEach((t) => t.kill()); root.classList.remove("anc-cards-motion"); };
}

/* ───────────────────────── 5 & 6 · card hovers: the tools tilt, the ETP arrows are drawn to the pointer ───────────────────────── */
function hovers(root: HTMLElement, { reduced }: MotionCtx) {
  if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const ac = new AbortController(), on = { signal: ac.signal };
  root.querySelectorAll<HTMLElement>(".anc-tool__a").forEach((a) => {
    a.addEventListener("pointermove", (e) => {
      const r = a.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      a.style.setProperty("--ry", `${(nx * 7).toFixed(2)}deg`); a.style.setProperty("--rx", `${(-ny * 6).toFixed(2)}deg`);
      a.style.setProperty("--gx", `${((nx + 0.5) * 100).toFixed(1)}%`); a.style.setProperty("--gy", `${((ny + 0.5) * 100).toFixed(1)}%`);
    }, on);
    a.addEventListener("pointerleave", () => { a.style.setProperty("--ry", "0deg"); a.style.setProperty("--rx", "0deg"); }, on);
  });
  root.querySelectorAll<HTMLElement>(".anc-etp__a").forEach((a) => {
    const go = a.querySelector<HTMLElement>(".anc-etp__go")!;
    a.addEventListener("pointermove", (e) => {
      const r = go.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const k = Math.min(1, 140 / Math.max(1, Math.hypot(dx, dy)));
      go.style.translate = `${(dx * 0.18 * k).toFixed(1)}px ${(dy * 0.18 * k).toFixed(1)}px`;
    }, on);
    a.addEventListener("pointerleave", () => { go.style.translate = ""; }, on);
  });
  return () => ac.abort();
}
