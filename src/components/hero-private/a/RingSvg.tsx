"use client";
// Hero study A: the Figma vector itself (public/hero-private/ring.svg, cleaned from node 1123:610 by the build script: its layers named by data-part,
// the orbits redrawn as dashed ellipses), fetched as soon as this module loads and split into layers so its parts can move cheaply.
//
// The split: every named part (the orbits, the cut-outs, the guides, each satellite, the four corners, the four sides, the core's bubble, lines and
// cube) becomes its own small <svg> (its viewBox cropped to the part), stacked in the drawing's order on a stage drawn in the vector's own units
// (2016 × 1249 px, scaled to the box, never clipped). Each layer is three nested boxes, one per motion, so the three never overwrite each other:
//   .hpa__l  the intro (gsap, once)  >  .hpa__m  the exit (gsap, scrubbed)  >  .hpa__v (the svg)  the loop (CSS, ./ring-svg.css).
// Moving a part is then a transform on its own layer (no repaint of the 850 KB drawing); only the orbits' and guides' small layers repaint.
//
// The three acts (the shared round-3 choreography):
//   1. intro, fast but soft (≈ 1.9 s): one wave, every piece starting close to its place (≈ 110 units, 5 % of the drawing) with a heavy ease-out and
//      ≈ 50 ms staggers: orbits, corners, sides, the core, the guides, the satellites; then a settle (one quick lap of light round the ring);
//   2. loop, one 8 s master cycle (all its CSS animations share the period and start together, so they stay in sync; ./ring-svg.css):
//      0–2 s inflow (packets from the satellites down the guide lines), 2–4.5 s circulation (one light front round the ring), 4.5–5.5 s charge (the
//      bubble brightens, the cube lifts, the glow swells), 5.5–8 s release (the orbits pulse outward, a ripple runs out, the satellites rise and
//      settle round the ring); under it the orbits' dashes flow on. Paused off screen;
//   3. exit "seal" (trigger .hp, "top top" → "bottom top", 0..1): to 0.45 everything gathers toward the core (the satellites fly in, the ring
//      contracts round it, the bubble closes, the orbits draw in); to 0.65 it all compresses into the core cube, which turns green; to 0.8 the
//      green cube travels and shrinks onto the h1's green square (.hp__sq), becoming a flat square exactly on it, with a soft flash; then only
//      the h1's own square is left. Nothing is clipped or vanishes in place: every piece travels into the core.
// The intro and the exit compose (different boxes). The cube's travel is computed from the live layout (cached, re-measured on refresh).
// Reduced motion: no intro, no loop; the drawing just fades with the scroll.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";
import "./ring-svg.css";

const SRC = "/hero-private/ring.svg";
/** start the download with the page's scripts, not after hydration */
let pending: Promise<string | null> | null = null;
const load = () => (pending ??= fetch(SRC).then((r) => (r.ok ? r.text() : null)).catch(() => null));
if (typeof window !== "undefined") load();

const W = 2016, H = 1249;                            // the vector's units (the stage is drawn in them)
const C = { x: 1081, y: 624.5 };                     // the orbits' centre
const PAD = 48;                                      // room round each layer's crop (the light's glow)
const ISO = { x: 0.866, y: 0.5 };                    // cos 30°, sin 30°
const GREEN = "#00DC8D";
/** the sides' outward directions (the intro slides them in along these iso axes) */
const OUT: Record<string, [number, number]> = {
  B_lado_UL: [-ISO.x, -ISO.y], B_lado_UR: [ISO.x, -ISO.y], B_lado_LR: [ISO.x, ISO.y], B_lado_LL: [-ISO.x, ISO.y],
};
/** the round of the ring, clockwise from the back corner (the light's lap) */
const ROUND = ["B1_esquina_trasera", "B_lado_UR", "B3_esquina_der", "B_lado_LR", "B4_esquina_frontal", "B_lado_LL", "B2_esquina_izq", "B_lado_UL"];
const CORNERS = ["B1_esquina_trasera", "B3_esquina_der", "B2_esquina_izq", "B4_esquina_frontal"];   // the order they land in
const SIDES = ["B_lado_UL", "B_lado_UR", "B_lado_LR", "B_lado_LL"];
const FLAT = 80;                                     // the flat square the cube becomes, in units (scaled onto .hp__sq)

type Kind = "orbits" | "cut" | "guides" | "packets" | "sat" | "corner" | "side" | "bub" | "glow" | "lines" | "cube";
type Layer = { name: string; kind: Kind; l: HTMLDivElement; m: HTMLDivElement; v: Element; x: number; y: number; w: number; h: number };
type Seal = { cube: SVGGElement; green: SVGGElement; flat: SVGRectElement };

const kindOf = (n: string): Kind | null =>
  n === "E_anillos" ? "orbits" : n === "E_recorte_fondo" ? "cut" : n === "E_guias" ? "guides" : /^D\d+_/.test(n) ? "sat"
  : /^B\d_/.test(n) ? "corner" : n.startsWith("B_lado") ? "side" : n.startsWith("C1_") ? "bub" : n.startsWith("C2_") ? "lines"
  : n.startsWith("C3_") ? "cube" : null;
const SVGNS = "http://www.w3.org/2000/svg";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const attrs = (e: Element, a: Record<string, string | number>) => Object.entries(a).forEach(([k, v]) => e.setAttribute(k, String(v)));

/** a layer: the three nested boxes at (x, y, w, h) on the stage, holding `v` */
function layer(stage: HTMLElement, name: string, kind: Kind, x: number, y: number, w: number, h: number, v: Element): Layer {
  const l = document.createElement("div"), m = document.createElement("div");
  l.className = "hpa__l"; l.dataset.l = name; l.dataset.k = kind;
  Object.assign(l.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  m.className = "hpa__m"; v.classList.add("hpa__v");
  m.append(v); l.append(m); stage.append(l);
  return { name, kind, l, m, v, x, y, w, h };
}

/** the packets: a streak of light on each guide line, from its satellite end into the ring (each guide is drawn as dash segments, the first two
    of which are its end caps); they set off in sequence */
function packets(guides: SVGGElement) {
  const box = document.createElement("div");
  guides.querySelectorAll("path").forEach((p, k) => {
    const n = (p.getAttribute("d") ?? "").match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    if (n.length < 8) return;
    let [ax, ay, bx, by] = [n[0], n[1], n[4], n[5]];
    if (Math.hypot(bx - ax, by - ay) < 50) return;
    if (Math.hypot(ax - C.x, ay - C.y) < Math.hypot(bx - C.x, by - C.y)) [ax, ay, bx, by] = [bx, by, ax, ay];
    const d = document.createElement("i"); d.className = "hpa__pk";
    d.style.setProperty("offset-path", `path("M ${ax} ${ay} L ${bx} ${by}")`);
    d.style.setProperty("--dl", `${(k * 0.06).toFixed(2)}s`);
    box.append(d);
  });
  return box;
}

/** the core cube's sealed state, drawn inside its own svg: a green copy of the cube (its whites mapped to greens by lightness) and the flat
    square it becomes */
function sealOf(cube: SVGGElement, b: DOMRect): Seal {
  const green = cube.cloneNode(true) as SVGGElement;
  green.removeAttribute("data-part"); attrs(green, { class: "hpa__green", opacity: 0 });
  const lo = [0x07, 0xb5, 0x78], hi = [0x7a, 0xf2, 0xc6];
  green.querySelectorAll("[fill]").forEach((e) => {
    const f = e.getAttribute("fill") ?? "";
    if (!/^#[0-9a-f]{6}$/i.test(f)) return;
    const c = [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16));
    const t = clamp01(((c[0] + c[1] + c[2]) / 3 / 255 - 0.72) / 0.27);
    e.setAttribute("fill", `rgb(${lo.map((v, i) => Math.round(v + (hi[i] - v) * t)).join(" ")})`);
  });
  const flat = document.createElementNS(SVGNS, "rect");
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  attrs(flat, { x: cx - FLAT / 2, y: cy - FLAT / 2, width: FLAT, height: FLAT, fill: GREEN, opacity: 0, class: "hpa__flat" });
  return { cube, green, flat };
}

/** the inlined drawing → a stage of layers, in the drawing's order */
function split(el: HTMLElement, svg: SVGSVGElement) {
  const ring = svg.querySelector('[data-part="ring"]'); if (!ring) return null;
  const parts: SVGGElement[] = [];
  for (const g of Array.from(ring.children) as SVGGElement[]) {
    if ((g.dataset.part ?? "").startsWith("D_satelites")) parts.push(...(Array.from(g.children) as SVGGElement[]));
    else parts.push(g);
  }
  const boxes = parts.map((g) => g.getBBox());       // measured while the drawing is still whole
  const stage = document.createElement("div"); stage.className = "hpa__stage";
  const layers: Layer[] = [];
  let seal: Seal | null = null;
  parts.forEach((g, i) => {
    const name = g.dataset.part ?? "", kind = kindOf(name); if (!kind) return;
    const b = boxes[i], x = Math.floor(b.x - PAD), y = Math.floor(b.y - PAD), w = Math.ceil(b.width + 2 * PAD), h = Math.ceil(b.height + 2 * PAD);
    const s = document.createElementNS(SVGNS, "svg");
    attrs(s, { viewBox: `${x} ${y} ${w} ${h}`, fill: "none" }); s.append(g);
    if (kind === "cube") { seal = sealOf(g, b); s.append(seal.green, seal.flat); }
    if (kind === "orbits") {                         // the release's ripple: one green dashed orbit running out from the core
      const r = document.createElementNS(SVGNS, "ellipse");
      attrs(r, { cx: C.x, cy: C.y, rx: 1080, ry: 623.5, class: "hpa__rip", "vector-effect": "non-scaling-stroke" });
      r.style.transformOrigin = `${C.x - x}px ${C.y - y}px`;
      s.append(r);
      s.querySelectorAll<SVGElement>("[data-orbit]").forEach((e) => e.style.setProperty("--o", e.dataset.orbit ?? "0"));
    }
    layers.push(layer(stage, name, kind, x, y, w, h, s));
    if (kind === "guides") layers.push(layer(stage, "packets", "packets", 0, 0, W, H, packets(g)));
    if (name === "C1_burbuja_fondo") {               // the core's light: a soft green glow under the bubble's glass
      const r = Math.max(b.width, b.height) * 0.62, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      layers.push(layer(stage, "glow", "glow", cx - r, cy - r, 2 * r, 2 * r, document.createElement("i")));
    }
  });
  svg.remove();
  el.append(stage);
  return { stage, layers, seal: seal as Seal | null };
}

export function RingSvg() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let dead = false;
    const offs: (() => void)[] = [];
    (async () => {
      const text = await load();
      if (!text || dead) return;
      el.innerHTML = text;
      const svg = el.querySelector("svg"); if (!svg) return;
      const built = split(el, svg); if (!built) return;
      const { stage, layers, seal } = built;
      const by = (n: string) => layers.find((L) => L.name === n);
      const of = (kind: Kind) => layers.filter((L) => L.kind === kind);

      /* the stage drawn in the vector's units, scaled to the box */
      let k = 1;
      const fit = () => { k = el.clientWidth / W; stage.style.scale = String(k); };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(el); offs.push(() => ro.disconnect());

      ROUND.forEach((n, i) => by(n)?.l.style.setProperty("--i", String(i)));
      /* the satellites in their order round the centre, from the left (the intro's wave, the release's rise) */
      const turn = (L: Layer) => (Math.atan2(L.y + L.h / 2 - C.y, L.x + L.w / 2 - C.x) + 2 * Math.PI + 2.2) % (2 * Math.PI);
      const sats = of("sat").sort((p, q) => turn(p) - turn(q));
      sats.forEach((L, i) => L.l.style.setProperty("--k", String(i)));

      const hero = el.closest(".hp");
      if (prefersReduced()) {
        el.setAttribute("data-ready", "");
        if (hero) {
          const st = ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (s) => { stage.style.opacity = String(1 - s.progress); } });
          offs.push(() => st.kill());
        }
        return;
      }

      /* ---- 1. the intro, on the outer boxes (.hpa__l): one soft wave, everything starting close to its place ---- */
      const io = gsap.timeline({ delay: 0.05, defaults: { ease: "expo.out", duration: 1.05 } });
      const orbits = by("E_anillos");
      if (orbits) io.from(orbits.v.querySelectorAll("ellipse[data-orbit]"), { scale: 0.86, opacity: 0, svgOrigin: `${C.x} ${C.y}`, stagger: 0.05, duration: 1.2 }, 0);
      for (const L of of("cut")) io.from(L.l, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0.1);
      CORNERS.forEach((n, i) => { const L = by(n); if (L) io.from(L.l, { y: -110, opacity: 0 }, 0.08 + i * 0.055); });
      SIDES.forEach((n, i) => { const L = by(n); if (L) io.from(L.l, { x: OUT[n][0] * 110, y: OUT[n][1] * 110, opacity: 0 }, 0.22 + i * 0.055); });
      for (const L of of("bub")) io.from(L.l, { scale: 0.9, opacity: 0 }, 0.32);
      for (const L of of("lines")) io.from(L.l, { opacity: 0, ease: "power2.out" }, 0.38);
      for (const L of of("cube")) io.from(L.l, { y: -90, opacity: 0 }, 0.42);
      for (const L of of("glow")) io.from(L.l, { opacity: 0, scale: 0.8 }, 0.5);
      for (const L of of("guides")) io.from(L.l, { opacity: 0, ease: "power2.out", duration: 0.8 }, 0.45);
      sats.forEach((L, i) => io.from(L.l, { y: 46, opacity: 0, duration: 0.85, ease: "power3.out" }, 0.5 + i * 0.045));
      io.call(() => el.setAttribute("data-settle", ""), [], 1.2);                         // the settle: one quick lap of light round the ring
      io.call(() => { el.removeAttribute("data-settle"); el.setAttribute("data-loop", ""); }, [], 2.3);   // the master loop, from rest
      offs.push(() => io.kill());
      el.setAttribute("data-ready", "");

      /* ---- 2. the loop (CSS) runs only while the hero is on screen ---- */
      const seen = new IntersectionObserver(([e]) => el.toggleAttribute("data-play", e.isIntersecting), { rootMargin: "80px" });
      seen.observe(el); offs.push(() => seen.disconnect());

      /* ---- 3. the exit, "seal", on the middle boxes (.hpa__m) ---- */
      if (!hero) return;
      const cube = by("C3_cubo_nucleo"); if (!cube) return;
      const P = { x: cube.x + cube.w / 2, y: cube.y + cube.h / 2 };     // everything converges on the core cube
      const at = (L: Layer) => `${P.x - L.x}px ${P.y - L.y}px`;          // P in a layer's own box
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
      /* gather (0 → 0.45): the ring contracts round the core, corners first; the satellites fly in; the orbits draw in; the bubble closes;
         compress (0.45 → 0.65): all of it shrinks into the cube and merges with it */
      const ringParts = [...CORNERS, ...SIDES].map(by).filter((L): L is Layer => !!L);
      ringParts.forEach((L, i) => {
        const t = i * 0.012;
        tl.to(L.m, { scale: 0.58, transformOrigin: at(L), duration: 0.42 - t }, t);
        tl.to(L.m, { scale: 0.08, duration: 0.2, ease: "power2.in" }, 0.45 + t);
        tl.to(L.m, { opacity: 0, duration: 0.1, ease: "power1.in" }, 0.53 + t);
      });
      for (const L of of("cut")) {                                       // the cut-outs follow the ring (they hide the lines behind its glass)
        tl.to(L.m, { scale: 0.58, transformOrigin: at(L), duration: 0.42 }, 0);
        tl.to(L.m, { scale: 0.08, opacity: 0, duration: 0.18, ease: "power2.in" }, 0.45);
      }
      sats.forEach((L, i) => {
        const t = (i % 8) * 0.01;
        tl.to(L.m, { scale: 0.22, transformOrigin: at(L), duration: 0.4, ease: "sine.inOut" }, t);
        tl.to(L.m, { opacity: 0, duration: 0.14, ease: "power1.in" }, 0.28 + t);
      });
      for (const L of of("guides")) {
        tl.to(L.m, { scale: 0.3, transformOrigin: at(L), duration: 0.4, ease: "sine.inOut" }, 0);
        tl.to(L.m, { opacity: 0, duration: 0.22, ease: "power1.in" }, 0.12);
      }
      for (const L of of("packets")) tl.to(L.m, { opacity: 0, duration: 0.06, ease: "none" }, 0);
      if (orbits) {
        tl.to(orbits.m, { scale: 0.2, transformOrigin: at(orbits), duration: 0.45, ease: "sine.inOut" }, 0);
        tl.to(orbits.m, { opacity: 0, duration: 0.2, ease: "power1.in" }, 0.25);
      }
      for (const L of [...of("bub"), ...of("lines")]) {
        tl.to(L.m, { scale: 0.72, transformOrigin: at(L), duration: 0.42 }, 0.03);
        tl.to(L.m, { scale: 0.2, opacity: 0, duration: 0.18, ease: "power2.in" }, 0.45);
      }
      for (const L of of("glow")) {
        tl.to(L.m, { scale: 0.75, opacity: 1, transformOrigin: at(L), duration: 0.42 }, 0);
        tl.to(L.m, { scale: 0.3, opacity: 0, duration: 0.2, ease: "power2.in" }, 0.47);
      }
      tl.to(stage, { opacity: 0, duration: 0.02, ease: "none" }, 0.98);  // a guard: the art empty at the very end
      tl.set({}, {}, 1);

      /* seal (0.45 → 0.95): the cube itself, set from p directly (its target is the live layout): it turns green as the ring merges into it,
         travels in a soft arc and shrinks onto the h1's square, becomes a flat square exactly on it, flashes softly, and hands over to the h1's
         own square (which sits above the art) */
      const sq = hero.querySelector(".hp__sq");
      let tgt: { x: number; y: number; s: number } | null = null;
      const measure = () => {
        if (!sq) return null;
        const a = el.getBoundingClientRect(), b = sq.getBoundingClientRect();
        return { x: (b.left + b.width / 2 - a.left) / k - P.x, y: (b.top + b.height / 2 - a.top) / k - P.y, s: b.width / k / FLAT };
      };
      const inOut = gsap.parseEase("power2.inOut"), sine = gsap.parseEase("sine.inOut");
      const cv = cube.v as SVGSVGElement;
      const setCube = (p: number) => {
        if (p > 0.5 && !tgt) tgt = measure();
        const T = tgt ?? { x: 0, y: 0, s: 1 };
        const s0 = 1 + 0.16 * sine(span(p, 0.45, 0.6)), u = inOut(span(p, 0.6, 0.8));
        gsap.set(cube.m, {
          x: T.x * u, y: T.y * u - 140 * Math.sin(Math.PI * u),
          scale: s0 + (T.s - s0) * u, opacity: 1 - span(p, 0.88, 0.95), transformOrigin: "50% 50%",
        });
        if (seal) {
          const flat = span(p, 0.72, 0.8);
          seal.green.setAttribute("opacity", String(span(p, 0.45, 0.56) * (1 - flat)));
          seal.flat.setAttribute("opacity", String(flat));
          seal.cube.setAttribute("opacity", String(1 - flat));          // the white cube under its green copy goes too
        }
        const flash = Math.sin(Math.PI * span(p, 0.76, 0.94));
        cv.style.filter = flash > 0.01 ? `drop-shadow(0 0 ${(40 * flash).toFixed(1)}px rgb(0 220 141 / ${(0.7 * flash).toFixed(2)}))` : "";
        el.toggleAttribute("data-exit", p > 0.002);
      };
      const render = (p: number) => { tl.progress(p); setCube(p); };
      const st = ScrollTrigger.create({
        trigger: hero, start: "top top", end: "bottom top",
        onUpdate: (s) => render(s.progress),
        onRefresh: (s) => { tgt = null; render(s.progress); },
      });
      offs.push(() => { st.kill(); tl.kill(); });
    })();
    return () => {
      dead = true; offs.forEach((f) => f()); el.innerHTML = "";
      ["data-ready", "data-loop", "data-settle", "data-play", "data-exit"].forEach((a) => el.removeAttribute(a));
    };
  }, []);

  return <div ref={ref} className="hpa" />;
}
