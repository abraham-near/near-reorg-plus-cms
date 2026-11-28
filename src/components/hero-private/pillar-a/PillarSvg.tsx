"use client";
// Hero study "Pillar A": the Figma vector itself (public/hero-private/pillar.svg, cleaned from node 1120:6520: its layers named by data-part), fetched
// as soon as this module loads (in parallel with hydration) and inlined so its parts can move. The column runs through the centre of a square
// frame; a glass bubble round a stepped core sits on it under a green collar; satellites float round the frame on black dotted rows; thin grey
// dotted guides. Fitted so the frame sits ≈ 35 vw wide, centred on the copy; the column runs to both edges of its box (its end segments repeated:
// the source column stops at the artboard). The column is the one thing clipped (to the box, so on phones it doesn't run up over the copy).
// At inline time a few hooks are added to the vector (nothing visible changes): each moving piece gets its own wrapper <g>, the column is cut into its
// segments, the dotted rows (drawn by Figma as rows of tiny circles) become one round-capped dotted <line> each, and green "light" lines are laid
// over the rows, the guides, the glass tubes' inner green line and the column's front edge (the loop runs its light along them).
// The shared choreography (hero-brief-2):
//   1. intro (≈ 1.9 s, as soon as the drawing is in): one soft wave, everything from close by (expo.out, short staggers): the column's segments, the
//      core and bubble, the corners, the arms, the clamps, the guides and rows drawing out, the satellites; a light pulse through the green parts settles it.
//   2. loop (one 8 s master cycle, Web Animations all started together): inflow — light runs in from the satellites along the dotted rows; circulation —
//      it runs round the frame's glass tubes, then down and up the column toward the core; charge — the core lifts, the bubble and the collar glow;
//      release — a ripple runs back out along the rows and the guides and the satellites rise and settle in turn round the frame. Under it the dots
//      flow slowly. Paused off screen, with the tab hidden, or once the exit is under way.
//   3. exit "seal" (one trigger on .hp, "top top" → "bottom top", p 0..1, reversible): to 0.45 everything gathers — the rows draw back in and the
//      satellites fly in along them, the frame contracts round the core, the column telescopes into it from both ends, the bubble closes; 0.45 → 0.6
//      the gathered pillar compresses into one cube that turns green; 0.6 → 0.8 the cube arcs over and shrinks onto the h1's green square
//      (.hp__sq), turning flat as it lands with a soft flash; after that only the h1's own square is left.
// Intro and scroll never write the same thing: each piece holds two sets of values (intro, scroll) that one writer composes (offsets add, scales and
// opacities multiply) into its wrapper's transform / opacity; the loop moves the pieces' own groups (CSS `translate` / `filter`) inside those wrappers.
// Reduced motion: the composed drawing, still; the scroll only fades it out.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "@/lib/motion/scroll";
import "./pillar-svg.css";

gsap.registerPlugin(ScrollTrigger);

const SRC = "/hero-private/pillar.svg";
/** the drawing, requested as soon as this module runs (not after hydration) */
let pending: Promise<string | null> | null = null;
const load = () => (pending ??= fetch(SRC).then((r) => (r.ok ? r.text() : null)).catch(() => null));
if (typeof window !== "undefined") load();

const NS = "http://www.w3.org/2000/svg";
/** the frame's centre (on the column's axis, half way between the back and front corners) and the bubble's centre, in the drawing's units */
const F = { x: 1226.1, y: 1097 };
const BUB = { x: 1226.1, y: 1076 };
const FRAME_W = 1668;                         // the frame's width (left corner to right corner)
const SPREAD_H = 1193;                        // the satellites' height (top cap to the lowest cube)
const ISO = { x: 0.866, y: 0.5 };             // cos 30°, sin 30°
const UP_PITCH = 263.7, LO_PITCH = 216, EXTRA = 7;   // the column's repeat above / below, and how many segments are added past each end
const LOOP = 8000;                            // the master cycle, ms
const CORNERS: Record<string, [number, number]> = {
  B2_esquina_trasera: [0, -1], B3_esquina_der: [1, 0], B4_esquina_frontal: [0, 1], B1_esquina_izq: [-1, 0],
};
const ARMS: [number, number, string[]][] = [
  [ISO.x, -ISO.y, ["B8_tubo_vidrio", "B10_tubo_vidrio", "B18_panel_vidrio", "B9_abrazadera"]],        // back right
  [ISO.x, ISO.y, ["B16_tubo_vidrio", "B14_tubo_macizo", "B15_abrazadera"]],                           // front right
  [-ISO.x, ISO.y, ["B11_tubo_vidrio", "B13_tubo_macizo", "B12_abrazadera"]],                          // front left
  [-ISO.x, -ISO.y, ["B5_tubo_vidrio", "B7_tubo_macizo", "B17_panel_vidrio", "B6_abrazadera"]],        // back left
];
/** the glass tubes in their order round the frame (clockwise from the back corner), each with that way along it */
const ROUND: [string, number, number][] = [
  ["B8_tubo_vidrio", ISO.x, ISO.y], ["B10_tubo_vidrio", ISO.x, ISO.y], ["B16_tubo_vidrio", -ISO.x, ISO.y],
  ["B11_tubo_vidrio", -ISO.x, -ISO.y], ["B5_tubo_vidrio", ISO.x, -ISO.y],
];
const SATS = ["D1_tapa", "D2_lamina", "D5_cubo", "D4_tapa", "D7_lamina", "D6_cubo_ventana", "D10_lamina", "D9_cubo_chaflan", "D13_lamina", "D12_cubo"];
/** the exit: the frame contracts to this (about the bubble's width); the cube the pillar compresses into, its half-height at the core */
const LOCK = 0.34, CUBE = 128;

type V = { x: number; y: number; s: number; o: number };
type Piece = { w: SVGGElement; ox: number; oy: number; I: V; S: V; last: string };
type Dots = { line: SVGLineElement; x1: number; y1: number; x2: number; y2: number; step: number; guide: boolean; f: { f: number }; sf: { f: number } };
type Glow = { line: SVGLineElement; len: number; w: number };
const v0 = (): V => ({ x: 0, y: 0, s: 1, o: 1 });
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sineInOut = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;

export function PillarSvg() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current; if (!el) return;
    let dead = false;
    const offs: (() => void)[] = [];
    (async () => {
      const text = await load();
      if (!text || dead) return;
      el.innerHTML = text;
      const svg = el.querySelector("svg");
      const root = svg?.querySelector<SVGGElement>('[data-part="pillar"]');
      if (!svg || !root) return;
      const part = (n: string) => svg.querySelector<SVGGElement>(`[data-part="${n}"]`);
      const mk = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
        const e = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
        return e;
      };
      /** wraps `els` (contiguous siblings) in a new group, in place */
      const wrap = (els: Element[], attrs: Record<string, string> = {}) => {
        const g = mk("g", attrs); els[0].before(g); els.forEach((e) => g.append(e)); return g;
      };
      /** folds the loose siblings that follow a named group (its screws, slots, window) into it */
      const fold = (g: Element | null) => {
        let s = g?.nextElementSibling;
        while (g && s && !s.hasAttribute("data-part")) { const nx = s.nextElementSibling; g.append(s); s = nx; }
      };
      /** a green light line over a path, hidden until the loop runs a short dash of it from x1,y1 to x2,y2 */
      const glow = (host: Element, x1: number, y1: number, x2: number, y2: number, w: number, where: "after" | "append" = "after"): Glow => {
        const line = mk("line", { x1, y1, x2, y2, stroke: "#00DC8D", "stroke-width": w, "stroke-linecap": "round", "data-pulse": "", opacity: 0 });
        if (where === "after") host.after(line); else host.append(line);
        return { line, len: Math.hypot(x2 - x1, y2 - y1), w };
      };

      /* ---------- hooks on the vector ---------- */
      fold(part("B1_esquina_izq")); fold(part("B3_esquina_der")); fold(part("D6_cubo_ventana"));

      // the dotted rows: a row of tiny circles → one round-capped dotted line per row (the dots where they were); light lines over each
      const dots: Dots[] = [];
      const lights: { inn?: Glow; out: Glow; guide: boolean }[] = [];
      const toDots = (p: SVGPathElement, guide: boolean) => {
        const cs = (p.getAttribute("d") ?? "").split(/(?=M)/).filter(Boolean).map((d) => {
          const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
          return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: (x1 - x0) / 2 };
        }).filter((c) => Number.isFinite(c.x));
        if (cs.length < 2) return;
        let a = cs[0], b = cs[1], far = -1;           // the row's direction: its two farthest dots, running away from the frame
        for (const c of cs) for (const d of cs) { const l = Math.hypot(c.x - d.x, c.y - d.y); if (l > far) { far = l; a = c; b = d; } }
        if (Math.hypot(a.x - F.x, a.y - F.y) > Math.hypot(b.x - F.x, b.y - F.y)) [a, b] = [b, a];
        const ux = (b.x - a.x) / far, uy = (b.y - a.y) / far, along = (c: { x: number; y: number }) => (c.x - a.x) * ux + (c.y - a.y) * uy;
        cs.sort((c, d) => along(c) - along(d));
        const gaps = cs.slice(1).map((c, i) => Math.hypot(c.x - cs[i].x, c.y - cs[i].y));
        const med = [...gaps].sort((x, y) => x - y)[gaps.length >> 1];
        const runs: (typeof cs)[] = [[cs[0]]];          // split where a satellite interrupts the row
        gaps.forEach((g, i) => { if (g > med * 1.6) runs.push([]); runs[runs.length - 1].push(cs[i + 1]); });
        const r = cs.reduce((m, c) => m + c.r, 0) / cs.length;
        const frag = document.createDocumentFragment(), made: Dots[] = [];
        for (const run of runs) {
          if (run.length < 2) continue;
          const s = run[0], e = run[run.length - 1], step = Math.hypot(e.x - s.x, e.y - s.y) / (run.length - 1);
          const line = mk("line", {
            x1: s.x, y1: s.y, x2: e.x, y2: e.y, stroke: "#111111", "stroke-width": (r * 2).toFixed(2), "stroke-linecap": "round",
            "stroke-dasharray": `0 ${step.toFixed(3)}`, "data-dots": guide ? "guide" : "sat",
          });
          if (guide) line.setAttribute("stroke-opacity", "0.6");
          frag.append(line);
          const d: Dots = { line, x1: s.x, y1: s.y, x2: e.x, y2: e.y, step, guide, f: { f: 1 }, sf: { f: 1 } };
          dots.push(d); made.push(d);
        }
        p.replaceWith(frag);
        for (const d of made) {
          const w = guide ? 3 : r * 2;
          lights.push({ inn: guide ? undefined : glow(d.line, d.x2, d.y2, d.x1, d.y1, w), out: glow(d.line, d.x1, d.y1, d.x2, d.y2, w), guide });
        }
      };
      const guides = part("E_guias");
      guides?.querySelectorAll("path").forEach((p) => toDots(p, true));
      for (const n of ["D_satelites_traseros", "D_satelites_delanteros"]) {
        [...(part(n)?.children ?? [])].filter((c): c is SVGPathElement => c.tagName === "path" && c.getAttribute("fill") === "#111111").forEach((p) => toDots(p, false));
      }

      // the tubes' light: along each glass tube's inner green line, clockwise round the frame (just above the tube, out of its own filters)
      const tubes: (Glow & { tube: SVGGElement })[] = [];
      for (const [n, dx, dy] of ROUND) {
        const tube = part(n); if (!tube) continue;
        let best: number[] = [], bl = 0;
        tube.querySelectorAll('path[stroke="#00DC8D"]').forEach((p) => {
          const m = (p.getAttribute("d") ?? "").match(/^M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)$/); if (!m) return;
          const c = m.slice(1).map(Number), l = Math.hypot(c[2] - c[0], c[3] - c[1]);
          if (l > bl) { bl = l; best = c; }
        });
        if (!bl) continue;
        let [x1, y1, x2, y2] = best;
        if ((x2 - x1) * dx + (y2 - y1) * dy < 0) [x1, y1, x2, y2] = [x2, y2, x1, y1];
        tubes.push({ ...glow(tube, x1, y1, x2, y2, 5), tube });
      }

      // the column: its segments as groups (each run of loose paths from one tall body to the next), repeated past both ends
      const colUp = part("A_columna_superior"), colLo = part("A_columna_inferior");
      const upRuns: SVGGElement[] = [], loRuns: SVGGElement[] = [];
      let collar: SVGGElement | null = null;
      if (colUp) {
        const kids = [...colUp.children];
        collar = wrap(kids.slice(0, 5), { "data-part": "A_collar" });     // the green collar: the upper column's first five paths
        let group: Element[] = [];
        const flush = () => { if (group.length) upRuns.push(wrap(group)); group = []; };
        for (const c of kids.slice(5)) {
          if (c.tagName === "g") { flush(); upRuns.push(wrap([c])); continue; }
          if (c.getAttribute("fill") === "#CDCAC6" && (c as SVGGraphicsElement).getBBox().height > 100) flush();
          group.push(c);
        }
        flush();
        const src = upRuns[upRuns.length - 2];       // the topmost complete segment, repeated upward, each above the last
        for (let k = 1; k <= EXTRA; k++) {
          const c = src.cloneNode(true) as SVGGElement;
          c.setAttribute("transform", `translate(0 ${(-UP_PITCH * k).toFixed(1)})`);
          const g = mk("g"); g.append(c); colUp.append(g); upRuns.push(g);
        }
      }
      if (colLo) {
        const kids = [...colLo.children];
        const gs = kids.filter((c) => c.tagName === "g"), ps = kids.filter((c) => c.tagName !== "g");
        if (ps.length) loRuns.push(wrap(ps));          // nearest the core first
        [...gs].reverse().forEach((c) => loRuns.push(wrap([c])));
        const src = gs[0];                              // the bottom-most segment, repeated downward (each drawn under the ones above)
        for (let k = 1; src && k <= EXTRA; k++) {
          const c = src.cloneNode(true) as SVGGElement;
          c.setAttribute("transform", `translate(0 ${(LO_PITCH * k).toFixed(1)})`);
          const g = mk("g"); g.append(c); colLo.prepend(g); loRuns.push(g);
        }
      }
      // the column's light, along its front edge toward the core: up from below (under the frame's front), down from above
      const colGlow: Glow[] = [];
      if (colLo) colGlow.push(glow(colLo, 1226.1, 2900, 1226.1, 1200, 4, "append"));
      if (colUp) colGlow.push(glow(colUp, 1226.1, -1900, 1226.1, 985, 4, "append"));
      // the column is the one thing clipped: to the box (it bleeds to its edges; on phones the box sits under the copy)
      const defs = svg.querySelector("defs") ?? svg.insertBefore(mk("defs"), svg.firstChild);
      const clip = mk("clipPath", { id: "hpp-col", clipPathUnits: "userSpaceOnUse" }), clipRect = mk("rect");
      clip.append(clipRect); defs.append(clip);
      colUp?.setAttribute("clip-path", "url(#hpp-col)"); colLo?.setAttribute("clip-path", "url(#hpp-col)");

      /* ---------- the pieces: each one wrapped, with its intro and scroll values ---------- */
      const pieces: Piece[] = [];
      const piece = (e: Element | null, ox = F.x, oy = F.y): Piece | null => {
        if (!e) return null;
        const p: Piece = { w: wrap([e]), ox, oy, I: v0(), S: v0(), last: "" };
        pieces.push(p); return p;
      };
      const corner = Object.fromEntries(Object.keys(CORNERS).map((n) => [n, piece(part(n))]));
      const arms = ARMS.map(([dx, dy, ns]) => ({ dx, dy, ps: ns.map((n) => ({ n, p: piece(part(n)) })) }));
      const runY = (g: SVGGElement) => { const b = g.getBBox(); return b.y + b.height / 2; };
      const ups = upRuns.map((g) => ({ p: piece(g)!, y: runY(g) })), los = loRuns.map((g) => ({ p: piece(g)!, y: runY(g) }));
      const collarP = piece(collar);
      const bubBack = piece(part("C1_burbuja"), BUB.x, BUB.y), bubFront = piece(part("C1_burbuja_frente"), BUB.x, BUB.y);
      const merid = piece(part("C2_meridianos"), BUB.x, BUB.y), core = piece(part("C3_nucleo"), BUB.x, BUB.y + 40);
      const rods = piece(part("C4_C5_varillas"), BUB.x, 1235);
      const sats = SATS.map((n) => {
        const g = part(n); if (!g) return null;
        const b = g.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2, l = Math.hypot(cx - F.x, cy - F.y) || 1;
        // its row: the dotted row ending nearest it (it flies in along it, to the frame)
        let row: Dots | null = null, rd = 1e9;
        for (const d of dots) if (!d.guide) { const q = Math.min(Math.hypot(d.x2 - cx, d.y2 - cy), Math.hypot(d.x1 - cx, d.y1 - cy)); if (q < rd) { rd = q; row = d; } }
        const entry = row && rd < 160 ? { x: row.x1, y: row.y1 } : { x: F.x + (cx - F.x) * 0.5, y: F.y + (cy - F.y) * 0.5 };
        return { g, p: piece(g, cx, cy)!, cx, cy, dx: (cx - F.x) / l, dy: (cy - F.y) / l, entry, ang: Math.atan2(cy - F.y, cx - F.x) };
      }).filter((s) => !!s);
      const dotPieces = dots.map((d) => ({ d, p: piece(d.line, d.x1, d.y1)! }));
      const guideP = piece(guides);
      const all = piece(root, BUB.x, BUB.y)!;          // the whole drawing (its compression into the cube)

      // the cube the pillar seals into (drawn over the drawing, outside it): a white iso cube, a green one over it, a flat square, a flash
      const unit = (top: string, left: string, right: string) => {
        const g = mk("g");
        const face = (d: string, fill: string) => g.append(mk("path", { d, fill, stroke: "#111111", "stroke-opacity": 0.85, "stroke-width": 1.3, "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" }));
        face("M0 -1L0.866 -0.5L0 0L-0.866 -0.5Z", top); face("M-0.866 -0.5L0 0L0 1L-0.866 0.5Z", left); face("M0 0L0.866 -0.5L0.866 0.5L0 1Z", right);
        return g;
      };
      const cubeG = mk("g"), cubeW = unit("#F8F7F7", "#DFDDDA", "#CDCAC6"), cubeGreen = unit("#4CE6AF", "#0BC883", "#00B477");
      const sqColor = getComputedStyle(el.closest(".hp")?.querySelector(".hp__sq") ?? el).backgroundColor || "#00DC8D";
      const flat = mk("rect", { x: -0.5, y: -0.5, width: 1, height: 1, fill: sqColor });
      const flashGrad = mk("radialGradient", { id: "hpp-flash" });
      flashGrad.append(mk("stop", { offset: 0, "stop-color": "#7DF5C8", "stop-opacity": 0.9 }), mk("stop", { offset: 0.45, "stop-color": "#00DC8D", "stop-opacity": 0.35 }), mk("stop", { offset: 1, "stop-color": "#00DC8D", "stop-opacity": 0 }));
      defs.append(flashGrad);
      const flash = mk("circle", { r: 1, fill: "url(#hpp-flash)" });
      cubeG.append(cubeW, cubeGreen, flat); svg.append(flash, cubeG);
      cubeG.style.visibility = "hidden"; flash.style.visibility = "hidden";

      /* the one writer: intro and scroll composed into each wrapper, once a frame when something changed */
      let dirty = true;
      const write = () => {
        if (!dirty) return; dirty = false;
        for (const p of pieces) {
          const x = p.I.x + p.S.x, y = p.I.y + p.S.y, s = p.I.s * p.S.s, o = clamp(p.I.o * p.S.o);
          const t = Math.abs(s - 1) < 1e-4 ? `translate(${x.toFixed(1)} ${y.toFixed(1)})`
            : `translate(${(x + p.ox * (1 - s)).toFixed(1)} ${(y + p.oy * (1 - s)).toFixed(1)}) scale(${s.toFixed(4)})`;
          const key = t + o.toFixed(3);
          if (key === p.last) continue;
          p.last = key;
          p.w.setAttribute("transform", t);
          p.w.style.opacity = o >= 0.999 ? "" : o.toFixed(3);
          p.w.style.visibility = o <= 0.001 ? "hidden" : "";
        }
        for (const { line, x1, y1, x2, y2, f, sf } of dots) {
          const k = f.f * sf.f;
          line.setAttribute("x2", (x1 + (x2 - x1) * k).toFixed(1)); line.setAttribute("y2", (y1 + (y2 - y1) * k).toFixed(1));
        }
      };
      const touch = () => { dirty = true; };
      gsap.ticker.add(write);
      offs.push(() => gsap.ticker.remove(write));

      /* ---------- the fit: the frame ≈ 79.5 % of the box's width, centred in it; the column to both of its edges ---------- */
      let scrolled = 0;
      let seal = (p: number) => void p;              // the exit's cube (set below)
      const fit = () => {
        const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
        const s = Math.min((W * 0.795) / FRAME_W, (H * 0.72) / SPREAD_H), vw = W / s, vh = H / s, x = F.x - vw / 2, y = F.y - vh / 2;
        svg.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
        Object.entries({ x, y, width: vw, height: vh }).forEach(([k, v]) => clipRect.setAttribute(k, v.toFixed(1)));
      };
      fit();
      const ro = new ResizeObserver(() => { fit(); seal(scrolled); }); ro.observe(el); offs.push(() => ro.disconnect());

      const hero = el.closest(".hp");
      if (prefersReduced()) {
        write(); el.setAttribute("data-ready", "");
        if (hero) {
          const fade = (q: ScrollTrigger) => { all.S.o = 1 - q.progress; touch(); };
          const st = ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: fade, onRefresh: fade });
          offs.push(() => st.kill());
        }
        return;
      }

      /* ---------- 1. the intro: one soft wave from close by ---------- */
      const intro = gsap.timeline({ defaults: { ease: "expo.out" }, onUpdate: touch });
      const glassF = tubes.map(() => ({ v: 0 }));
      const setGlass = (i: number) => () => { const v = glassF[i].v; tubes[i].tube.style.filter = v >= 0.999 ? "" : `saturate(${(0.15 + v * 0.85).toFixed(3)})`; };
      const collarF = { v: 0 };
      const setCollar = () => { if (collar) collar.style.filter = collarF.v >= 0.999 ? "" : `saturate(${collarF.v.toFixed(3)}) brightness(${(1.2 - collarF.v * 0.2).toFixed(3)})`; };
      // the starting states: everything a short way from its place, transparent
      ups.forEach(({ p }, k) => { p.I.y = -(90 + Math.min(k, 6) * 22); p.I.o = 0; });
      los.forEach(({ p }, k) => { p.I.y = 90 + Math.min(k, 6) * 22; p.I.o = 0; });
      if (collarP) { collarP.I.y = -60; collarP.I.o = 0; }
      for (const [n, [dx, dy]] of Object.entries(CORNERS)) { const p = corner[n]; if (p) { p.I.x = dx * 150; p.I.y = dy * 150; p.I.o = 0; } }
      arms.forEach(({ dx, dy, ps }) => ps.forEach(({ n, p }) => { if (!p) return; const far = n.includes("abrazadera") ? 70 : 115; p.I.x = dx * far; p.I.y = dy * far; p.I.o = 0; }));
      for (const p of [bubBack, bubFront, merid]) if (p) { p.I.s = 0.86; p.I.o = 0; }
      if (core) { core.I.y = 40; core.I.o = 0; }
      if (rods) { rods.I.y = 60; rods.I.o = 0; }
      sats.forEach(({ p, dx, dy }) => { p.I.x = dx * 95; p.I.y = dy * 95; p.I.o = 0; });
      dotPieces.forEach(({ d, p }) => { d.f.f = 0; p.I.o = 0; });
      if (guideP) guideP.I.o = 0;
      tubes.forEach((_, i) => setGlass(i)()); setCollar(); write();
      el.setAttribute("data-ready", "");

      ups.forEach(({ p }, k) => intro.to(p.I, { y: 0, o: 1, duration: 1.05 }, Math.min(k, 8) * 0.04));
      los.forEach(({ p }, k) => intro.to(p.I, { y: 0, o: 1, duration: 1.05 }, Math.min(k, 8) * 0.04));
      if (collarP) intro.to(collarP.I, { y: 0, o: 1, duration: 1.0 }, 0.05);
      if (core) intro.to(core.I, { y: 0, o: 1, duration: 1.0 }, 0.08);
      [bubBack, bubFront, merid].forEach((p, i) => { if (p) intro.to(p.I, { s: 1, o: 1, duration: 1.0 }, 0.12 + i * 0.04); });
      if (rods) intro.to(rods.I, { y: 0, o: 1, duration: 0.9 }, 0.3);
      ["B2_esquina_trasera", "B3_esquina_der", "B4_esquina_frontal", "B1_esquina_izq"].forEach((n, i) => {
        const p = corner[n]; if (p) intro.to(p.I, { x: 0, y: 0, o: 1, duration: 1.0 }, 0.12 + i * 0.05);
      });
      arms.forEach(({ ps }, a) => ps.forEach(({ n, p }, j) => {
        if (!p) return;
        const clampP = n.includes("abrazadera");
        intro.to(p.I, { x: 0, y: 0, o: 1, duration: clampP ? 0.8 : 0.95 }, 0.25 + a * 0.05 + (clampP ? 0.22 : j * 0.04));
      }));
      tubes.forEach((_, i) => intro.to(glassF[i], { v: 1, duration: 0.7, ease: "power2.out", onUpdate: setGlass(i) }, 0.55 + i * 0.05));
      intro.to(collarF, { v: 1, duration: 0.5, ease: "power2.out", onUpdate: setCollar }, 0.6);
      if (guideP) intro.to(guideP.I, { o: 1, duration: 0.6, ease: "power2.out" }, 0.55);
      let si = 0;
      dotPieces.forEach(({ d, p }) => {
        const t = d.guide ? 0.55 : 0.62 + si++ * 0.04;
        intro.set(p.I, { o: 1 }, t);
        intro.to(d.f, { f: 1, duration: d.guide ? 0.8 : 0.6, ease: "power3.out" }, t);
      });
      sats.forEach(({ p }, i) => intro.to(p.I, { x: 0, y: 0, o: 1, duration: 0.85 }, 0.7 + i * 0.045));
      // the settle: one light pulse through the green parts (the tubes' and the column's light lines, the collar, the bubble's rim)
      [...tubes, ...colGlow].forEach((g) => {
        const seg = g.len > 600 ? 260 : 120, m = g.w;
        intro.set(g.line, { attr: { opacity: 0.85, "stroke-dasharray": `${seg} ${g.len + seg * 2 + m * 4}` } }, 1.25);
        intro.fromTo(g.line, { strokeDashoffset: seg + m }, { strokeDashoffset: -g.len - m, duration: 0.65, ease: "power2.inOut" }, 1.25);
        intro.set(g.line, { attr: { opacity: 0 } }, 1.92);
      });
      if (collar) intro.fromTo(collar, { filter: "brightness(1) drop-shadow(0 0 0px rgb(0 220 141 / 0))" }, { filter: "brightness(1.06) drop-shadow(0 0 10px rgb(0 220 141 / 0.6))", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut", clearProps: "filter" }, 1.33);
      const rim = bubFront?.w.querySelector<SVGPathElement>('path[stroke="#00DC8D"]');
      if (rim) intro.fromTo(rim, { strokeWidth: 2 }, { strokeWidth: 4.5, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 1, clearProps: "strokeWidth" }, 1.33);

      /* ---------- 2. the loop: one 8 s master cycle ---------- */
      const loops: Animation[] = [];
      let onScreen = true;
      const syncPlay = () => {
        const go = onScreen && !document.hidden && scrolled < 0.6;
        loops.forEach((a) => (go ? a.play() : a.pause()));
      };
      /** a short dash of light running the whole of a glow line between t0 and t1 (seconds into the cycle); hidden past both ends */
      const travel = (g: Glow, t0: number, t1: number, seg = 70, peak = 1) => {
        const L = g.len, m = g.w;
        g.line.setAttribute("stroke-dasharray", `${seg} ${L + seg * 2 + m * 4}`);
        g.line.setAttribute("opacity", String(peak));
        return g.line.animate([
          { strokeDashoffset: seg + m, offset: 0 }, { strokeDashoffset: seg + m, offset: t0 / 8, easing: "cubic-bezier(.4,0,.6,1)" },
          { strokeDashoffset: -L - m, offset: t1 / 8 }, { strokeDashoffset: -L - m, offset: 1 },
        ], { duration: LOOP, iterations: Infinity });
      };
      const startLoop = () => {
        if (dead) return;
        // inflow (0–2 s): from the satellites in along their rows
        lights.filter((l) => l.inn).forEach((l, i) => loops.push(travel(l.inn!, 0.1 + (i % 4) * 0.12, 1.7 + (i % 4) * 0.08, 36)));
        // circulation (2–4.5 s): round the frame's glass, clockwise, then along the column toward the core from both ends
        tubes.forEach((g, i) => loops.push(travel(g, 2.0 + i * 0.42, 2.0 + i * 0.42 + 0.62, 70)));
        colGlow.forEach((g) => loops.push(travel(g, 2.9, 4.55, 120, 0.9)));
        // charge (4.5–5.5 s): the core lifts, the bubble and the collar glow; all back to rest before the cycle ends
        const kf = (rest: Keyframe, peak: Keyframe): Keyframe[] => [
          { ...rest, offset: 0 }, { ...rest, offset: 4.4 / 8, easing: "cubic-bezier(.3,0,.2,1)" }, { ...peak, offset: 5.2 / 8, easing: "cubic-bezier(.45,0,.55,1)" },
          { ...rest, offset: 7.4 / 8 }, { ...rest, offset: 1 },
        ];
        const coreEl = core?.w.firstElementChild;
        if (coreEl) loops.push(coreEl.animate(kf({ translate: "0 0" }, { translate: "0 -16px" }), { duration: LOOP, iterations: Infinity }));
        for (const p of [bubBack, bubFront]) {
          const e = p?.w.firstElementChild;
          if (e) loops.push(e.animate(kf({ filter: "saturate(1) brightness(1)" }, { filter: "saturate(2.2) brightness(1.03)" }), { duration: LOOP, iterations: Infinity }));
        }
        if (collar) loops.push(collar.animate(kf({ filter: "brightness(1) drop-shadow(0 0 0px rgb(0 220 141 / 0))" }, { filter: "brightness(1.08) drop-shadow(0 0 12px rgb(0 220 141 / 0.65))" }), { duration: LOOP, iterations: Infinity }));
        // release (5.5–8 s): a ripple back out along the rows and the guides; the satellites rise and settle in turn round the frame
        lights.forEach((l, i) => loops.push(travel(l.out, (l.guide ? 5.8 : 5.5) + (i % 5) * 0.06, (l.guide ? 7.4 : 6.9) + (i % 5) * 0.06, l.guide ? 90 : 36, l.guide ? 0.55 : 1)));
        const turn = (a: number) => (a + 2.1 + Math.PI * 2) % (Math.PI * 2);
        [...sats].sort((a, b) => turn(a.ang) - turn(b.ang)).forEach((s, i) => {
          const a = (5.75 + i * 0.1) / 8, m = (6.25 + i * 0.1) / 8, b = (6.85 + i * 0.1) / 8;
          loops.push(s.g.animate([
            { translate: "0 0", offset: 0 }, { translate: "0 0", offset: a, easing: "cubic-bezier(.33,0,.2,1)" },
            { translate: "0 -18px", offset: m, easing: "cubic-bezier(.45,0,.55,1)" }, { translate: "0 0", offset: b }, { translate: "0 0", offset: 1 },
          ], { duration: LOOP, iterations: Infinity }));
        });
        // underneath: the dots flow slowly out
        dots.forEach(({ line, step, guide }) => loops.push(line.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -step }], { duration: guide ? 8000 : 4000, iterations: Infinity })));
        const t0 = document.timeline.currentTime;
        loops.forEach((a) => { a.startTime = t0; });
        syncPlay();
      };
      intro.call(startLoop, [], 1.95);
      const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; syncPlay(); }, { rootMargin: "80px" });
      io.observe(el);
      document.addEventListener("visibilitychange", syncPlay);
      offs.push(() => { intro.kill(); io.disconnect(); document.removeEventListener("visibilitychange", syncPlay); loops.forEach((a) => a.cancel()); });

      /* ---------- 3. the exit: seal ---------- */
      if (!hero) return;
      const E = "power2.inOut", S = "sine.inOut";
      const tl = gsap.timeline({ paused: true, defaults: { ease: E, duration: 1 }, onUpdate: touch });
      tl.fromTo(el, { "--po": 1 }, { "--po": 0, duration: 0.08, ease: "none" }, 0);           // the loop's light lines go out first
      // gather (0 → 0.45): the rows and guides draw back in, the satellites fly in along them to the frame, the frame contracts round the core,
      // the column telescopes into it from both ends, the bubble closes
      dots.forEach((d) => tl.to(d.sf, { f: 0, duration: d.guide ? 0.2 : 0.26, ease: S }, d.guide ? 0 : 0.02));
      dotPieces.forEach(({ d, p }) => tl.to(p.S, { o: 0, duration: 0.06, ease: "none" }, d.guide ? 0.17 : 0.24));
      sats.forEach(({ p, cx, cy, entry }, i) => {
        const t = 0.01 + (i % 5) * 0.015;
        tl.to(p.S, { x: entry.x - cx, y: entry.y - cy, s: 0.8, duration: 0.24, ease: S }, t);
        const lx = F.x + (entry.x - F.x) * LOCK, ly = F.y + (entry.y - F.y) * LOCK;
        tl.to(p.S, { x: lx - cx, y: ly - cy, s: 0.32, duration: 0.17, ease: E }, t + 0.24);
        tl.to(p.S, { o: 0, duration: 0.07, ease: "power1.in" }, t + 0.34);
      });
      const frameP = [...Object.values(corner), ...arms.flatMap((a) => a.ps.map((q) => q.p))].filter((p): p is Piece => !!p);
      frameP.forEach((p, i) => tl.to(p.S, { s: LOCK, duration: 0.36, ease: E }, 0.04 + (i % 4) * 0.012));
      const scope = (arr: { p: Piece; y: number }[], cy: number) => arr.forEach(({ p, y }, k) => tl.to(p.S, { y: cy - y, duration: 0.4, ease: E }, Math.max(0, 0.03 - Math.min(k, 6) * 0.004)));
      scope(ups, 940); scope(los, 1170);
      [bubBack, bubFront].forEach((p) => p && tl.to(p.S, { s: 0.72, duration: 0.38, ease: E }, 0.06));
      if (merid) tl.to(merid.S, { s: 0.6, duration: 0.36, ease: E }, 0.06);
      if (rods) tl.to(rods.S, { y: -110, s: 0.6, duration: 0.36, ease: E }, 0.05);
      if (guideP) tl.to(guideP.S, { o: 0, duration: 0.04, ease: "none" }, 0.19);
      // compress (0.45 → 0.6): the gathered pillar shrinks into the core as the cube grows out of it and turns green
      tl.to(all.S, { s: 0.22, duration: 0.15, ease: "power2.in" }, 0.45);
      tl.to(all.S, { o: 0, duration: 0.09, ease: "power1.in" }, 0.51);
      tl.set({}, {}, 1);
      // the cube: placed on each update (its landing place is the h1's square, wherever the layout puts it)
      const sq = hero.querySelector<HTMLElement>(".hp__sq");
      seal = (p: number) => {
        const show = p > 0.44 && p < 0.84, lit = p > 0.7 && p < 0.97;
        cubeG.style.visibility = show ? "" : "hidden";
        flash.style.visibility = lit ? "" : "hidden";
        const m = svg.getScreenCTM();
        if (!sq || !m || (!show && !lit)) return;
        const r = sq.getBoundingClientRect();
        const c = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(m.inverse()), w = r.width / m.a;
        const grow = sineInOut((p - 0.44) / 0.14), green = sineInOut((p - 0.5) / 0.1), go = sineInOut((p - 0.6) / 0.2), flatten = sineInOut((p - 0.73) / 0.07);
        const a = CUBE * (0.35 + 0.65 * grow) * (1 - go) + (w / 1.732) * go;          // its half-height: at the core → its width the square's
        const x = BUB.x + (c.x - BUB.x) * go, y = BUB.y + (c.y - BUB.y) * go - Math.sin(Math.PI * go) * 120;   // a soft arc up and over
        cubeG.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${a.toFixed(3)})`);
        cubeG.style.opacity = String(clamp((p - 0.44) / 0.05));
        cubeW.style.opacity = String(1 - green);
        cubeGreen.style.opacity = String(green * (1 - flatten));
        flat.setAttribute("transform", `scale(${(1.732 * (0.6 + 0.4 * flatten)).toFixed(3)})`);
        flat.style.opacity = String(flatten);
        flash.setAttribute("transform", `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${(w * (2.2 + 1.6 * clamp((p - 0.74) / 0.16))).toFixed(1)})`);
        flash.style.opacity = Math.exp(-Math.pow((p - 0.8) / 0.045, 2)).toFixed(3);
      };
      const prog = (q: ScrollTrigger) => { scrolled = q.progress; tl.progress(q.progress); seal(q.progress); touch(); syncPlay(); };
      const st = ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: prog, onRefresh: prog });
      offs.push(() => { st.kill(); tl.kill(); });
    })();
    return () => {
      dead = true; offs.forEach((f) => f());
      el.innerHTML = ""; el.removeAttribute("data-ready"); el.style.removeProperty("--po");
    };
  }, []);

  return <div ref={box} className="hpp" />;
}
