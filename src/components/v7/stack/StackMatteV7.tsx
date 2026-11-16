"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { VIEWBOX } from "./geometry";

// Home v6's Stack, lit matte (D149): the drawing (StackArtV7) still runs everything (the build, the hover, the parting, the hover box, the list's rows)
// and still takes the pointer, but it is not seen: a three.js canvas over it draws the same pieces lit (./matte/gl.ts). Each frame something moves, the
// canvas reads where the drawing has each piece and how it is painted (its drop, its parting, its fade, its colour: green, dark, ghost or hot), from the
// drawing's own computed styles, and lights them there: one motion (the drawing's CSS), so the lit pieces can't drift from the ones the pointer finds.
// Without WebGL the drawing shows as before.
const [, , VW, VH] = VIEWBOX.split(" ").map(Number);
const PIECES = ["cube0", "cube1", "cube2", "cube3", "cube4", "cube5", "intents", "ironclaw", "cloud", "market", "com"] as const;
type Layer = "protocol" | "intents" | "ai" | "com";
/* each layer's left-face green (the colour sampled; tokens.css, NEAR Intents as v6 tones it): what the paint (gl.ts ALBEDO) stands for */
const LEFT: Record<Layer, string> = { protocol: "#3cc994", intents: "#72d9ac", ai: "#33b482", com: "#1e7a55" };

export function StackMatteV7() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, art = canvas?.parentElement, svg = art?.querySelector<SVGSVGElement>("svg.stk7");
    if (!canvas || !art || !svg) return;
    let dead = false, cleanup = () => {};
    /* three.js and the WebGL setup wait until the drawing is a screen and a half away: it sits far below the hero, and the drawing shows unlit until then */
    const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { near.disconnect(); start(); } }, { rootMargin: "150% 0px" });
    near.observe(art);
    const start = () => (async () => {
      const [THREE, { createMatte, ALBEDO, PAD }] = await Promise.all([import("three"), import("./matte/gl")]);
      if (dead) return;
      let gl: Awaited<ReturnType<typeof createMatte>>;
      try { gl = await createMatte(canvas, "/v1/stack/stack-icon.svg"); } catch { return; }   /* no WebGL: the drawing stays */
      if (dead) { gl.dispose(); return; }

      /* colours as the drawing has them (rgb(), color(srgb ...), oklab(): whatever a transition is part way through), read by a 1 px canvas */
      const cx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const seen = new Map<string, [number, number, number]>();
      const rgb = (css: string) => {
        let v = seen.get(css);
        if (!v) {
          cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1);
          const d = cx.getImageData(0, 0, 1, 1).data; v = [d[0], d[1], d[2]];
          if (seen.size > 512) seen.clear(); seen.set(css, v);
        }
        return v;
      };
      const lin = (hex: string) => new THREE.Color().setStyle(hex, THREE.SRGBColorSpace);
      const lum = (c: THREE_NS.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      /* the sampled green to the paint. The drawing mixes each piece's colour in sRGB on one line, from its layer's green (at rest) to its dark (put back): a
         ghost is 42 % of the way to the dark, and a fade runs along it. So where the sampled colour is on that line is how far back the piece is, and the
         paint moves the same way, from the paint to graphite, never darker than where it is going (D149 critic: mapped by darkness and greyness apart, a fade
         passed through a murky olive darker than both ends). Graphite, not black: a piece put back keeps its form on the band without the drawing's outline */
      const DARK = [0x35 / 255, 0x35 / 255, 0x35 / 255], LIFT = 0.012;   /* worked back through the tone mapping, which crushes the darkest greys */
      const enc = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);   /* hex as written (sRGB) */
      const MAP = Object.fromEntries((Object.keys(LEFT) as Layer[]).map((l) => {
        const L = lin(LEFT[l]), A = lin(ALBEDO[l]), Le = enc(LEFT[l]), Ae = enc(ALBEDO[l]);
        const De = enc(l === "protocol" ? "#1d1d1d" : "#1b1b1b");   /* stack-v7.css --s7-dark: a ring's a shade darker */
        const v = De.map((d, k) => d - Le[k]), vv = v.reduce((n, x) => n + x * x, 0);
        return [l, { L, A, Le, Ae, v, vv }];
      })) as Record<Layer, { L: THREE_NS.Color; A: THREE_NS.Color; Le: number[]; Ae: number[]; v: number[]; vv: number }>;
      const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      let dark = 0, floor = 0;   /* the last piece painted: its lift toward graphite (none for a ghost, which keeps its green), and graphite's floor (in early, so
                                    the paint going down never falls under it on the way; it leaves anything lighter alone) */
      const paintOf = (css: string, layer: Layer, out: THREE_NS.Color) => {
        const [r, g, b] = rgb(css), m = MAP[layer], se = [r / 255, g / 255, b / 255];
        out.setRGB(se[0], se[1], se[2], THREE.SRGBColorSpace);
        const lm = lum(out);
        /* brighter than at rest (the hot flash): the paint itself, as much brighter (its own hue: the sampled pale mint, mapped channel by channel, read as
           plaster, D149 critic) */
        if (lm >= lum(m.L)) { dark = floor = 0; return out.copy(m.A).multiplyScalar(lm / lum(m.L)); }
        const t = Math.min(1, Math.max(0, se.reduce((n, x, k) => n + (x - m.Le[k]) * m.v[k], 0) / m.vv));
        dark = smooth(0.45, 1, t); floor = smooth(0, 0.3, t);
        return out.setRGB(...(m.Ae.map((x, k) => x + (DARK[k] - x) * t) as [number, number, number]), THREE.SRGBColorSpace);
      };

      const cs = (el: Element) => getComputedStyle(el);
      const num = (v: string, d = 1) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
      const ty = (el: Element) => { const m = /matrix\(([^)]+)\)/.exec(cs(el).transform); return m ? num(m[1].split(",")[5], 0) : 0; };
      const base = svg.querySelector(".s7-base")!, front = svg.querySelector(".s7-front")!;
      const ring = (k: string) => svg.querySelector<SVGGElement>(`:scope > .s7-ring[data-ring="${k}"]`)!;
      const rings = { intents: ring("intents"), ai: ring("ai"), com: ring("com") };
      const states = PIECES.map(() => ({ dy: 0, alpha: 1, present: 1, top: false, lift: 0, dark: 0, line: 0, color: new THREE.Color() }));
      const sample = () => {
        /* the pillar: the copy that shows (the front one while parted or lit whole, else the one drawn in) */
        const copy = num(cs(front).opacity, 0) > 0.5 ? front : base;
        let mark = 0;
        const spread = svg.hasAttribute("data-spread");
        for (let i = 0; i < 6; i++) {
          const g = copy.querySelector(`.s7-cube[data-cube="${i}"]`)!, l = g.querySelector(".s7-l")!, st = states[i], o = num(cs(g).opacity);
          const arriving = svg.hasAttribute("data-build") && (!g.hasAttribute("data-in") || g.hasAttribute("data-new"));
          /* the pillar together (not parted): a cube lands as the drawing's comes within 6 units, its last 12 twice as fast. The drawing's drop eases out
             slowly, and a cube a few units over the one under it showed that one's top as a gap in the column (D150, Lawrence: no gaps when together) */
          const d = ty(g), ad = Math.abs(d);
          st.dy = spread || ad >= 12 ? d : Math.sign(d) * Math.max(0, ad - 6) * 2; st.present = o;
          st.top = copy === front && spread && g.hasAttribute("data-on");   /* the hovered cube, over everything (D129) */
          const fo = num(cs(l).fillOpacity);
          /* a ghost cube's .72; arriving, its fade is the cube's own (the green's is later, for the outline), solid by a third of it (see-through for longer, a
             falling cube read as smoked glass: the drawing has its outline then, D149 critic). The hovered cube solid at once (easing out of see-through read
             as milky glass); the ghosts, closing, solid well before the green has come back (the rings green around a glass pillar, D149 critic) */
          const gh = Math.min(1, (1 - fo) / 0.28);
          st.alpha = arriving ? Math.min(1, o * 3) : st.top ? o : spread ? o * fo : o * (1 - 0.28 * gh * gh * gh);
          paintOf(cs(l).fill, "protocol", st.color); st.lift = dark * LIFT; st.dark = floor;
          /* its outline as the drawing has it (its fade in comes first, D135; ghost .4, the hovered cube .46, the hot flash) */
          const e = g.querySelector(".s7-e"); st.line = o * (e ? num(cs(e).strokeOpacity, 0.36) : 0.36);
          if (i === 0) { const ic = g.querySelector(".s7-icon"); mark = o * (ic ? num(cs(ic).opacity) : 1); }
        }
        (["intents", "ai", "com"] as const).forEach((k) => {
          const r = rings[k], o = num(cs(r).opacity), dy = ty(r);
          const parts = k === "ai" ? (["ironclaw", "cloud", "market"] as const).map((s) => r.querySelector(`.s7-seg[data-seg="${s}"]`)!) : [r];
          parts.forEach((p, j) => {
            const st = states[k === "intents" ? 6 : k === "ai" ? 7 + j : 10];
            st.dy = dy; st.present = o;
            /* a dark ring solid (the drawing has it a little see-through, .84, to show the pillar behind it faintly; lit, the ghost pillar through graphite
               read murky, D149 critic) */
            st.alpha = Math.min(1, o * 2.5) * (k === "ai" ? num(cs(p).opacity) : 1);   /* arriving: see-through briefly (the pillar showed through, D149 critic) */
            paintOf(cs(p.querySelector(".s7-l")!).fill, k, st.color); st.lift = dark * LIFT; st.dark = floor;
            const e = p.querySelector(".s7-e"); st.line = o * (k === "ai" ? num(cs(p).opacity) : 1) * (e ? num(cs(e).strokeOpacity, 0.36) : 0.36);
          });
        });
        return { pieces: states, mark, joined: !spread };
      };
      const keyOf = (s: ReturnType<typeof sample>) => s.mark.toFixed(3) + +s.joined + s.pieces.map((p) => `${p.dy.toFixed(2)},${p.alpha.toFixed(3)},${p.present.toFixed(3)},${+p.top},${p.lift.toFixed(4)},${p.dark.toFixed(3)},${p.line.toFixed(3)},${p.color.getHexString()}`).join("|");

      /* the canvas over the drawing: its viewBox where the svg shows it (meet: centred), plus room above and below for what moves past it */
      let size = "";
      const place = () => {
        const r = svg.getBoundingClientRect(), a = art.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const s = Math.min(r.width / VW, r.height / VH), ox = (r.width - VW * s) / 2, oy = (r.height - VH * s) / 2;
        const x = r.left - a.left - art.clientLeft + ox, y = r.top - a.top - art.clientTop + oy - PAD.top * s;
        const w = VW * s, h = (VH + PAD.top + PAD.bottom) * s, dpr = Math.min(window.devicePixelRatio || 1, 2);
        Object.assign(canvas.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
        const k = `${Math.round(w * dpr)}x${Math.round(h * dpr)}`;
        if (k !== size) { size = k; gl.resize(Math.round(w), Math.round(h), dpr); last = ""; }
      };

      /* drawn only when something moves: a transition or animation starting in the drawing, or a state change, keeps the loop going a while (the
         longest the drawing has is the green's .13 + .84 s, and the arrival mark's 1.2 s) */
      let last = "", raf = 0, until = 0;
      const tick = () => {
        raf = 0;
        const s = sample(), k = keyOf(s);
        if (k !== last) { last = k; gl.render(s); }
        if (performance.now() < until) raf = requestAnimationFrame(tick);
      };
      const kick = () => { until = Math.max(until, performance.now() + 1400); if (!raf) raf = requestAnimationFrame(tick); };
      const mo = new MutationObserver(kick);
      mo.observe(svg, { attributes: true, subtree: true, attributeFilter: ["data-in", "data-new", "data-fill", "data-lit", "data-spread", "data-on", "data-hot", "data-seg-lit", "data-build"] });
      const ev = ["transitionrun", "transitionstart", "animationstart"] as const;
      ev.forEach((e) => svg.addEventListener(e, kick));
      const ro = new ResizeObserver(() => { place(); kick(); });
      ro.observe(art); ro.observe(svg);
      const onResize = () => { place(); kick(); };
      window.addEventListener("resize", onResize);

      place(); tick();
      canvas.removeAttribute("hidden");
      svg.setAttribute("data-gl", "");
      kick();
      cleanup = () => {
        cancelAnimationFrame(raf); mo.disconnect(); ro.disconnect(); window.removeEventListener("resize", onResize);
        ev.forEach((e) => svg.removeEventListener(e, kick));
        svg.removeAttribute("data-gl"); gl.dispose();
      };
    })();
    return () => { dead = true; near.disconnect(); cleanup(); };
  }, []);
  return <canvas ref={ref} className="s7-gl" aria-hidden="true" hidden />;
}
