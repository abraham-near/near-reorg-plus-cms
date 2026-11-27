// The final Protocol page: the motion of the Vercel page's drawings (stack-kit r41, js/motion/motion.js §4 and hero-index.js, ported to the page's
// markup). Look: protocol-final.css (under .pr-f[data-motion], set by the grid's motion unless reduced motion).
//   - the build: as a drawing arrives (its top past 90 % of the view) its outlines draw on (pathLength 1), the floor and the dashed grid fade in, the
//     details and faces follow, the dots last; the mint marks (.hi) are there from the first frame. The hero's bodies also rise a little as they draw.
//     A drawing already above the view (a reload mid-page) is simply finished;
//   - the hero index: a link of the bar under the hero lights its part of the drawing (it lifts 6 px, its small mark turns mint, the others step
//     back), on hover or focus; once the hero has drawn, the parts light in turn (2.8 s each) while it is in view and nobody points at the bar or the
//     drawing (back 3.2 s after the pointer leaves). A click on a link (or on a part) scrolls to its section; Nightshade, resharding and the private shard live in the
//     pinned chapter, so a click there scrolls to their share of the pin. Reduced motion: no cycle, Private Shard rests lit;
//   - Speed. Scale. Access.: the count of ten shards lands cell by cell as it comes in, the mint one last (its plate builds as any drawing);
//   - the quantum ring's dashes run round the dial while it is in view (CSS, .is-run).
import type { MotionCtx } from "@/lib/motion/scroll";

const W_OUT = 0.9;   // a stroke at or above this width is an outline (theirs: outlines ≈ 0.8–1.06, details ≈ 0.3–0.55)
const per = (n: number, total: number, max: number) => Math.min(max, total / Math.max(1, n));
const fx = (v: number) => v.toFixed(3) + "s";
const t = (el: Element, d: number, dur?: number) => {
  const s = (el as SVGElement).style; s.setProperty("--d", fx(d)); if (dur != null) s.setProperty("--t", fx(dur));
};

/** the build's timing (theirs, the plain branch): each class of mark gets its delay (--d) and duration (--t); returns when the build ends, in s */
function plan(fig: HTMLElement, svg: SVGSVGElement) {
  const $$ = (s: string) => [...svg.querySelectorAll<SVGElement>(s)];
  const lines = $$(".ln:not(.dsh)");
  lines.forEach((p) => p.setAttribute("pathLength", "1"));
  const out: SVGElement[] = [], det: SVGElement[] = [];
  lines.forEach((p) => ((parseFloat(p.getAttribute("stroke-width") || "1") || 1) >= W_OUT ? out : det).push(p));
  const fl = $$(".fl"), dsh = $$(".dsh"), fc = $$(".fc:not(.hi)"), dt = $$(".dt"), hi = $$(".hi");
  const o = fig.dataset.art === "hero" ? 0.45 : 0;   // the hero waits a little after the page opens
  fl.forEach((f) => t(f, o, 0.6));
  dsh.forEach((f, i) => t(f, o + 0.12 + i * 0.05, 0.6));
  const so = per(out.length, 0.45, 0.08);
  out.forEach((p, i) => t(p, o + 0.05 + i * so, 0.75));
  const sd = per(det.length, 0.3, 0.05);
  det.forEach((p, i) => t(p, o + 0.5 + i * sd, 0.5));
  const sf = per(fc.length, 0.35, 0.03);
  fc.forEach((f, i) => t(f, o + 0.55 + i * sf, 0.55));
  const st = per(dt.length, 0.3, 0.012);
  dt.forEach((f, i) => t(f, o + 0.8 + i * st, 0.4));
  // the hero's bodies rise a little as their edges draw: its top groups other than the floor, in order
  if (o) [...svg.querySelectorAll<SVGGElement>(":scope > g:not(.floor)")].forEach((g, i, a) => { g.classList.add("m-up"); t(g, o + 0.05 + i * per(a.length, 0.4, 0.12), 0.9); });
  return o + Math.max(1.05 + hi.length * 0.08 + 0.6, 0.05 + so * out.length + 0.75, 0.55 + sf * fc.length + 0.55);
}

export function mountArt(root: HTMLElement, { reduced, ScrollTrigger }: MotionCtx) {
  const ac = new AbortController(), on = { signal: ac.signal };
  const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => [...el.querySelectorAll<T>(s)];
  const timers: number[] = [], observers: IntersectionObserver[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  const figs = $$<HTMLElement>("figure[data-art]");

  /* ── the build ── */
  const finish = (fig: HTMLElement) => {
    fig.classList.remove("m-arm", "m-in");
    fig.querySelectorAll("[pathLength]").forEach((p) => p.removeAttribute("pathLength"));
    fig.querySelectorAll(".m-up").forEach((g) => g.classList.remove("m-up"));
    fig.dataset.m = "done";
    fig.dispatchEvent(new CustomEvent("art:drawn"));
  };
  if (reduced) figs.forEach((f) => { f.dataset.m = "done"; });
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const fig = e.target as HTMLElement; io.unobserve(fig);
      void fig.getBoundingClientRect();   // the armed state is committed before the play
      fig.classList.add("m-in");
      later(() => finish(fig), (Number(fig.dataset.mEnd) || 1.6) * 1000 + 120);
    }), { rootMargin: "0px 0px -10% 0px" });
    observers.push(io);
    figs.forEach((fig) => {
      const svg = fig.querySelector<SVGSVGElement>(":scope > svg"); if (!svg) return;
      if (fig.getBoundingClientRect().bottom < 0) { fig.dataset.m = "done"; return; }   // already above the view: finished
      fig.dataset.mEnd = plan(fig, svg).toFixed(2);
      fig.classList.add("m-arm");
      io.observe(fig);
    });
  }

  /* ── the hero index ── */
  const hero = root.querySelector<HTMLElement>("figure[data-art='hero']");
  const links = $$<HTMLAnchorElement>(".pf-index a[data-part]");
  const nav = root.querySelector<HTMLElement>(".pf-index");
  const parts = hero ? [...hero.querySelectorAll<SVGGElement>("[data-part]")] : [];
  const light = (name: string) => {
    links.forEach((a) => a.classList.toggle("is-lit", a.dataset.part === name));
    hero?.classList.toggle("has-on", !!name);
    parts.forEach((g) => g.classList.toggle("on", g.getAttribute("data-part") === name));
  };
  // a click: the section, or (inside the pinned chapter) the step's share of the pin
  const go = (name: string) => {
    const el = document.getElementById(name); if (!el) return;
    const step = el.closest<HTMLElement>(".pb-step"), band = el.closest<HTMLElement>(".pb-band.is-pinned");
    let y = el.getBoundingClientRect().top + scrollY - 96;
    if (step && band) {
      const stageEl = band.querySelector("[data-stage]"), st = ScrollTrigger.getAll().find((s) => s.trigger === stageEl);
      const steps = $$(".pb-step", band), i = steps.indexOf(step);
      if (st && i >= 0) y = st.start + (st.end - st.start) * ((i + 0.35) / steps.length);
    }
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", "#" + name);
  };
  links.forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); go(a.dataset.part || ""); }, on));
  parts.forEach((g) => g.addEventListener("click", () => go(g.getAttribute("data-part") || ""), on));

  if (hero && parts.length) {
    // the cycle's order: the index links' when the page has them, else the drawing's own parts
    const order = links.length ? links.map((a) => a.dataset.part || "") : [...new Set(parts.map((g) => g.getAttribute("data-part") || ""))];
    const REST = order.includes("private") ? "private" : order[0];
    let held = false, seen = false, cyc = 0, k = 0, back = 0;
    const stopCycle = () => { clearInterval(cyc); cyc = 0; };
    const startCycle = () => {
      if (reduced || cyc || held || !seen || hero.dataset.m !== "done" || document.hidden) return;
      const step = () => { light(order[k % order.length]); k++; };
      step(); cyc = window.setInterval(step, 2800);
    };
    const take = (name: string) => { held = true; clearTimeout(back); stopCycle(); light(name); };
    const leave = () => {
      held = false; clearTimeout(back);
      if (reduced) { light(REST); return; }
      light(""); back = window.setTimeout(startCycle, 3200);
    };
    links.forEach((a) => {
      a.addEventListener("pointerenter", () => take(a.dataset.part || ""), on);
      a.addEventListener("focus", () => take(a.dataset.part || ""), on);
      a.addEventListener("blur", leave, on);
    });
    nav?.addEventListener("pointerleave", leave, on);
    parts.forEach((g) => g.addEventListener("pointerenter", () => take(g.getAttribute("data-part") || ""), on));
    hero.addEventListener("pointerleave", leave, on);
    if (reduced) light(REST);
    else {
      const vis = new IntersectionObserver(([e]) => { seen = e.intersectionRatio >= 0.3; if (seen) startCycle(); else stopCycle(); }, { threshold: [0, 0.3] });
      vis.observe(hero); observers.push(vis);
      hero.addEventListener("art:drawn", () => later(startCycle, 400), on);
      document.addEventListener("visibilitychange", () => { if (document.hidden) stopCycle(); else startCycle(); }, on);
    }
    ac.signal.addEventListener("abort", () => { stopCycle(); clearTimeout(back); });
  }

  /* ── Speed. Scale. Access.: the count's cells land one by one as it comes in (≤ 0.6 s in all), the mint one last; above the view, or reduced
     motion: all there ── */
  const counts = $$<HTMLElement>(".pf-count");
  if (counts.length && !reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const g = e.target as HTMLElement; io.unobserve(g);
      const cells = [...g.children] as HTMLElement[], k = per(cells.length, 0.6, 0.03);
      cells.forEach((c, i) => c.style.setProperty("--d", fx(0.1 + (c.classList.contains("is-mark") ? cells.length : i) * k)));
      requestAnimationFrame(() => g.classList.add("m-go"));
    }), { rootMargin: "0px 0px -12% 0px" });
    observers.push(io);
    counts.forEach((g) => { if (g.getBoundingClientRect().bottom < 0) return; g.classList.add("m-set"); io.observe(g); });
  }

  /* ── the quantum ring runs while in view ── */
  const q = root.querySelector<HTMLElement>("figure[data-art='quantum']");
  if (q && !reduced) {
    const io = new IntersectionObserver(([e]) => q.classList.toggle("is-run", e.isIntersecting), { rootMargin: "10% 0px" });
    io.observe(q); observers.push(io);
  }

  return () => {
    ac.abort(); timers.forEach((x) => clearTimeout(x)); observers.forEach((o) => o.disconnect());
    figs.forEach((f) => { finish(f); delete f.dataset.m; delete f.dataset.mEnd; });
    counts.forEach((g) => { g.classList.remove("m-set", "m-go"); [...g.children].forEach((c) => (c as HTMLElement).style.removeProperty("--d")); });
    light("");
  };
}
