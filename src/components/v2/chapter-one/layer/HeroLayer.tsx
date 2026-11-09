"use client";

import { useEffect, useRef } from "react";
import TRACKS from "./tracks.json";
import styles from "./HeroLayer.module.css";
import { FPS, VW, VH, A4_PALETTE, clamp, smooth, rand, sample, groundAt, point, clearOfCopy, nearCopy, composition, cornerFade, toneOf, makeInk, type Track, type Pt, type Ctx, type Look, type Plex, type Palette } from "./core";
import { dust } from "./dust";
import { signal } from "./signal";

// Lab options for a quiet layer over the hero's camera move that ties the land to money, data and AI (D40). Every look
// is pinned to the footage: tracks.json holds points on the ridges, tracked through every frame of the render
// (optical flow; scripts track.py and select_survey.py in assets/generated/2026-11-04_hero-explore), so the marks ride the land as the scroll moves the camera.
// Nothing plays on its own: the frame is the video's current frame, so the layer only moves with the reader's scroll
// (or sits at the first frame where the still is shown). Decorative: the copy beside it carries the meaning.
//   survey:   crosshair marks on the ridges, joined to their nearest neighbours by a dashed network (data)
//   readings: contour lines read live from the footage's haze levels, read from the top down (data)
//   route:    an intent's route hops ridge to ridge and settles at the green thread's head (money)
//   notes:    three verified facts (money, data, AI) pinned to the ridges, one at a time
// Survey developed (D41), after Plexus (points joined within a distance, fading with it) and GMUNK's TRON: Legacy
// graphics (fine linework that traces the land, ticked rings), on a dense field of tracked points (plexus.json, loaded
// only for these looks):
//   plexus:   tracked dots joined to their nearest neighbours, lines fading with distance; key nodes as crosshairs
//   traces:   the plexus, quieter, plus lines that trace the ridge silhouettes, with ticks (no light ever runs along them: D45)
//   rings:    the plexus plus ticked rings around the green node and corner brackets on the key nodes
//   plexusTraces: A1's full plexus with the ridge traces on top, on every ridge the tracking finds (nine; A2 keeps five)
// D49, three options on the gentle pull-back (take j), each keeping clear of the headline itself rather than fading
// out across the left of the picture:
//   plexusBright: A4 brighter, short lines brightest, greens nearer NEAR green, more detail low in the picture and
//                 less in the sky beside the headline (Lawrence's notes)
//   dust:         the land drawn as glittering tracked particles, ridges as rims of light, ribbons along them (dust.ts)
//   signal:       data rising from the land: bars on tracked points, an arc between peaks, ringed data around yours
//                 (signal.ts)
// D50: plexusBright follows a golden-ratio composition (core.ts); plexusDust is it over a layer of option 2's dust
// (particle rims along the ridges, the field and the motes, no ribbons), quieter and shaped by the same composition
export type LayerLook = "survey" | "readings" | "route" | "notes" | "plexus" | "traces" | "rings" | "plexusTraces" | "plexusBright" | "dust" | "signal" | "plexusDust";

const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(parent: Element, name: K, cls: string, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, name);
  n.setAttribute("class", cls);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  parent.appendChild(n);
  return n;
};


function survey(host: HTMLElement): Look {
  const svg = svgEl(host, "svg", styles.svg);
  const tracks = TRACKS.survey as Track[];
  // One pair of paths per edge (a tree on n marks has n − 1 edges), so each edge fades with its own ends
  const edges = tracks.slice(1).map(() => [svgEl(svg, "path", styles.halo), svgEl(svg, "path", `${styles.line} ${styles.dashed}`)]);
  // "You": the mark nearest the middle of the ridges at the first frame (clear of the thread), in green with a ring
  const you = tracks.reduce((b, t, i) => (Math.abs((sample(t, 0)?.[0] ?? 9) - 0.66) < Math.abs((sample(tracks[b], 0)?.[0] ?? 9) - 0.66) ? i : b), 0);
  const CROSS = "M-8 0H-3M3 0H8M0-8V-3M0 3V8";
  const marks = tracks.map((_, i) => {
    const g = svgEl(svg, "g", styles.mark);
    svgEl(g, "path", styles.halo, { d: CROSS });
    svgEl(g, "path", i === you ? styles.green : styles.line, { d: CROSS });
    if (i === you) { svgEl(g, "circle", styles.greenRing, { r: 12 }); svgEl(g, "circle", styles.greenDot, { r: 2 }); }
    return g;
  });
  return {
    resize: (c) => svg.setAttribute("viewBox", `0 0 ${c.W} ${c.H}`),
    draw: (c) => {
      const pts: Pt[] = [];
      tracks.forEach((t, i) => {
        const p = point(t, c);
        marks[i].style.opacity = p ? String(p.a) : "0";
        if (p) { marks[i].setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); pts.push(p); }
      });
      // The network: each mark joined to its nearest neighbours (a minimum spanning tree, so lines never cross). It is
      // drawn on by a sweep from the left: half the frame at the top of the page, all of it by the middle of the move
      const tree: [Pt, Pt][] = [];
      const inTree = pts.map((_, i) => i === 0);
      for (let n = 1; n < pts.length; n++) {
        let best: [number, number] | null = null, bd = Infinity;
        pts.forEach((a, i) => { if (inTree[i]) pts.forEach((b, j) => { const dd = Math.hypot(a.x - b.x, a.y - b.y); if (!inTree[j] && dd < bd) { bd = dd; best = [i, j]; } }); });
        if (!best) break;
        const [i, j] = best as [number, number];
        inTree[j] = true; tree.push(pts[i].x < pts[j].x ? [pts[i], pts[j]] : [pts[j], pts[i]]);
      }
      const sweep = c.W * (0.5 + 0.55 * smooth(c.f / 110));
      edges.forEach((pair, k) => {
        const e = tree[k];
        if (!e || e[0].x >= sweep) { pair.forEach((n) => n.setAttribute("d", "")); return; }
        const [a, b] = e, u = b.x > sweep ? (sweep - a.x) / (b.x - a.x) : 1;
        const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${(a.x + (b.x - a.x) * u).toFixed(1)} ${(a.y + (b.y - a.y) * u).toFixed(1)}`;
        pair.forEach((n) => { n.setAttribute("d", d); n.style.opacity = String(Math.min(a.a, b.a)); });
      });
    },
  };
}

// Marching squares: for each corner case, the pairs of cell edges its contour joins
const SEG: number[][] = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0], [3, 0], [0, 2], [3, 2, 0, 1], [0, 1], [3, 1], [2, 1], [3, 2], []];

function readings(host: HTMLElement, source: () => CanvasImageSource | null): Look {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  host.appendChild(canvas);
  const g = canvas.getContext("2d")!;
  // The footage read small: haze makes brightness a stand-in for distance, so its levels trace the ridges
  const GW = 240, GH = 135;
  const off = document.createElement("canvas");
  off.width = GW; off.height = GH;
  const o = off.getContext("2d", { willReadFrequently: true })!;
  const lum = new Float32Array(GW * GH), tmp = new Float32Array(GW * GH);
  const LEVELS = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78];
  const GREEN = 0.54;
  const css = getComputedStyle(document.documentElement);
  const light = css.getPropertyValue("--color-on-dark").trim(), green = css.getPropertyValue("--color-green").trim();
  let dpr = 1;
  const blur = () => {
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0, n = 0;
        for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx >= 0 && xx < GW) { s += lum[y * GW + xx]; n++; } }
        tmp[y * GW + x] = s / n;
      }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy >= 0 && yy < GH) { s += tmp[yy * GW + x]; n++; } }
        lum[y * GW + x] = s / n;
      }
    }
  };
  return {
    resize: (c) => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(c.W * dpr); canvas.height = Math.round(c.H * dpr);
    },
    draw: (c) => {
      const src = source();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, c.W, c.H);
      if (!src) return;
      o.drawImage(src, 0, 0, GW, GH);
      const px = o.getImageData(0, 0, GW, GH).data;
      for (let i = 0; i < GW * GH; i++) lum[i] = (0.2126 * px[4 * i] + 0.7152 * px[4 * i + 1] + 0.0722 * px[4 * i + 2]) / 255;
      blur();
      // Read from the upper ridges down over the first part of the move, with a soft edge (no hard scan line)
      const scan = c.H * (0.42 + 0.78 * smooth(c.f / 100)), soft = c.H * 0.12;
      const [ox, oy] = c.map(0, 0), [x1, y1] = c.map(1, 1), sx = (x1 - ox) / (GW - 1), sy = (y1 - oy) / (GH - 1);
      for (const L of LEVELS) {
        g.beginPath();
        for (let y = 0; y < GH - 1; y++) for (let x = 0; x < GW - 1; x++) {
          const a = lum[y * GW + x], b = lum[y * GW + x + 1], cc = lum[(y + 1) * GW + x + 1], d = lum[(y + 1) * GW + x];
          const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
          if (k === 0 || k === 15) continue;
          // Edge crossings (0 top, 1 right, 2 bottom, 3 left) in grid units, linearly interpolated
          const segs = SEG[k];
          for (let s2 = 0; s2 < segs.length; s2 += 2) {
            for (let end = 0; end < 2; end++) {
              const e = segs[s2 + end];
              const gx = e === 0 ? x + (L - a) / (b - a) : e === 1 ? x + 1 : e === 2 ? x + (L - d) / (cc - d) : x;
              const gy = e === 0 ? y : e === 1 ? y + (L - b) / (cc - b) : e === 2 ? y + 1 : y + (L - a) / (d - a);
              const X = ox + gx * sx, Y = oy + gy * sy;
              if (end === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
            }
          }
        }
        g.strokeStyle = L === GREEN ? green : light;
        g.globalAlpha = L === GREEN ? 0.9 : 0.4;
        g.lineWidth = L === GREEN ? 1.25 : 1;
        g.stroke();
      }
      g.globalAlpha = 1;
      if (scan < c.H + soft) {
        const fade = g.createLinearGradient(0, scan - soft, 0, scan);
        fade.addColorStop(0, "transparent"); fade.addColorStop(1, light);
        g.globalCompositeOperation = "destination-out";
        g.fillStyle = fade; g.fillRect(0, scan - soft, c.W, soft);
        g.fillStyle = light; g.fillRect(0, scan, c.W, c.H - scan);
        g.globalCompositeOperation = "source-over";
      }
    },
  };
}

function route(host: HTMLElement, head: () => [number, number] | null): Look {
  const svg = svgEl(host, "svg", styles.svg);
  const nodes = TRACKS.route as Track[];
  const hops = nodes.map(() => [svgEl(svg, "path", styles.halo), svgEl(svg, "path", styles.line)]);
  const dots = nodes.map(() => svgEl(svg, "circle", styles.node, { r: 2.5 }));
  const rings = nodes.map(() => svgEl(svg, "circle", styles.greenRing, { r: 3 }));
  const start = svgEl(svg, "circle", styles.greenRing, { r: 6 });
  const packet = svgEl(svg, "circle", styles.greenDot, { r: 3.5 });
  // Hop i runs over frames S + i·D … S + (i+1)·D; the last hop lands on the thread's head as it drops in
  const S = 4, D = 16;
  const arc = (a: number[], b: number[], u: number) => {
    // A shallow hop: a quadratic curve bowed upwards by a quarter of its length
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.25;
    let d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}`, end = a;
    for (let k = 1; k <= 24; k++) {
      const t = (k / 24) * u, s = 1 - t;
      end = [s * s * a[0] + 2 * s * t * mx + t * t * b[0], s * s * a[1] + 2 * s * t * my + t * t * b[1]];
      d += `L${end[0].toFixed(1)} ${end[1].toFixed(1)}`;
    }
    return { d, end };
  };
  return {
    resize: (c) => svg.setAttribute("viewBox", `0 0 ${c.W} ${c.H}`),
    draw: (c) => {
      const pts = nodes.map((t) => point(t, c));
      const h = head();
      const fade = 1 - 0.6 * smooth((c.f - 110) / 30); // once settled, the route steps back
      const now: { at: number[] | null } = { at: null }; // where the packet is, while a hop is under way
      pts.forEach((p, i) => {
        const reached = c.f >= S + i * D;
        dots[i].style.opacity = p ? String(p.a * (reached ? 0.95 : 0.45) * fade) : "0";
        if (p) { dots[i].setAttribute("cx", p.x.toFixed(1)); dots[i].setAttribute("cy", p.y.toFixed(1)); }
        // A ring opens and fades as the route reaches each node
        const r = clamp((c.f - (S + i * D)) / 12);
        rings[i].style.opacity = p && i > 0 && r > 0 && r < 1 ? String(0.8 * (1 - r)) : "0";
        if (p) { rings[i].setAttribute("cx", p.x.toFixed(1)); rings[i].setAttribute("cy", p.y.toFixed(1)); rings[i].setAttribute("r", (3 + 9 * r).toFixed(1)); }
        const to = i < pts.length - 1 ? pts[i + 1] : h ? { x: h[0], y: h[1], a: 1 } : null;
        const u = clamp((c.f - (S + i * D)) / D);
        if (p && to && u > 0) {
          const { d, end } = arc([p.x, p.y], [to.x, to.y], u);
          hops[i].forEach((n) => { n.setAttribute("d", d); n.style.opacity = String(Math.min(p.a, to.a) * fade); });
          if (u < 1) now.at = end;
        } else hops[i].forEach((n) => n.setAttribute("d", ""));
      });
      if (pts[0]) {
        start.setAttribute("cx", pts[0].x.toFixed(1)); start.setAttribute("cy", pts[0].y.toFixed(1));
        start.style.opacity = String(pts[0].a * fade);
      } else start.style.opacity = "0";
      packet.style.opacity = now.at ? "1" : "0";
      if (now.at) { packet.setAttribute("cx", now.at[0].toFixed(1)); packet.setAttribute("cy", now.at[1].toFixed(1)); }
    },
  };
}

// Verified facts only, worded as spec/PRODUCT.md has them (F1, F2, F17): one for money, one for data, one for AI.
// Decorative here (lab); if Notes ships, the facts must also reach screen readers (D40)
const NOTES = [
  { figure: "$36.8B+", text: "settled through NEAR Intents, all time", source: "As of 31 Oct 2026, Dune" },
  { figure: "~40%", text: "of the last 30 days’ NEAR Intents volume was confidential", source: "As of 31 Oct 2026, Dune" },
  { figure: "", text: "Private AI inference, attested on every request", source: "near.ai" },
];
const WINDOWS = [[0, 90], [75, 165], [150, 238]];

function notes(host: HTMLElement): Look {
  const svg = svgEl(host, "svg", styles.svg);
  const tracks = TRACKS.notes as Track[];
  const chips = [...host.querySelectorAll<HTMLElement>("[data-note]")];
  const leaders = tracks.map(() => [svgEl(svg, "path", styles.halo), svgEl(svg, "path", styles.line)]);
  const anchors = tracks.map(() => svgEl(svg, "circle", styles.anchor, { r: 3.5 }));
  const GAP = 40;
  return {
    resize: (c) => svg.setAttribute("viewBox", `0 0 ${c.W} ${c.H}`),
    draw: (c) => {
      tracks.forEach((t, i) => {
        const p = point(t, c), [a, b] = WINDOWS[i];
        const w = p ? p.a * (a === 0 ? 1 : smooth((c.f - a) / 10)) * smooth((b - c.f) / 10) : 0;
        const show = w > 0.01 && p;
        anchors[i].style.opacity = leaders[i][0].style.opacity = leaders[i][1].style.opacity = chips[i].style.opacity = show ? String(w) : "0";
        if (!show) return;
        // The chip holds still while it is read (DESIGN §4): placed once for its window, just above the highest point
        // its anchor reaches (the land rises as the camera descends), so the leader shortens as the ridge comes up to it
        const cw = chips[i].offsetWidth, ch = chips[i].offsetHeight;
        const ey = c.map(...(sample(t, b) ?? sample(t, c.f)!))[1];
        const [sx0] = c.map(...(sample(t, a) ?? sample(t, c.f)!));
        const edge = c.W * 0.04 + 8; // clear of the frame's edge, even with the phone band's slight scale
        const left = clamp(sx0 + cw + 16 > c.W ? sx0 - cw : sx0, edge, Math.max(edge, c.W - cw - edge));
        const top = clamp(Math.min(ey, p.y) - GAP - ch, 96, c.H - ch - 8); // 96: clear of the floating header
        chips[i].style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
        anchors[i].setAttribute("cx", p.x.toFixed(1)); anchors[i].setAttribute("cy", p.y.toFixed(1));
        // The leader runs from the anchor to the chip's lower edge, meeting it at the anchor's x where it can
        const lx = clamp(p.x, left + 2, left + cw - 2), ly = top + ch;
        leaders[i].forEach((n) => n.setAttribute("d", ly < p.y - 6 ? `M${p.x.toFixed(1)} ${(p.y - 4).toFixed(1)}L${lx.toFixed(1)} ${ly.toFixed(1)}` : ""));
      });
    },
  };
}


type Variant = "plexus" | "traces" | "rings" | "plexusTraces" | "plexusBright";

// onFocus: where your node is on screen each frame (the composition's focus, D50), for a layer drawn with it
function plexus(host: HTMLElement, variant: Variant, PX: Plex, onFocus?: (p: [number, number] | null, pockets: number[][]) => void): Look {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  host.appendChild(canvas);
  const g = canvas.getContext("2d")!;
  const bright = variant === "plexusBright";
  // D49 (option 1): greens nearer NEAR green. Over pale mist the deep green takes three fifths NEAR green; over the mid-tones
  // it is mostly NEAR green; over the dark forest white keeps a touch of it
  // D58 ("greener or brighter so we see more dots and lines clearly"): a deeper, more saturated green over the pale mist
  // (it reads against it), pure NEAR green over the mid-tones, and NEAR green with less white over the dark forest
  const BRIGHT_PALETTE: Palette = { pale: [0.45, 0], mid: [1, 0], dark: [0.95, 0.45] };
  const ink = makeInk(g, bright ? BRIGHT_PALETTE : A4_PALETTE), GREEN = ink.GREEN;
  const { points, chains, keys } = PX;
  // Ambient motion (D43, D44), so the layer is never a still with lights running over it. With t = 0 (reduced motion)
  // everything is simply there.
  // Pace (D48): every ambient element runs 5-15% faster than its base timing, each at its own rate, so the motion at rest
  // is livelier and less uniform. The scroll's part of the motion is unchanged.
  const pace = (id: number) => 1.05 + 0.1 * rand(id, 20);
  // Dots: a share of them appear and disappear on their own 8-16 s cycle (gone for 30% of it), growing in and
  // shrinking away over 0.7 s; the rest stay. The plexus rewires around them (a fading point counts as farther off).
  // When A4s settles, every life eases to its resting state (whole, present) before its clock holds: `rest`
  let rest = 0;
  const presence = (id: number, t: number, share: number) => {
    if (!t || rand(id, 3) >= share) return 1;
    const P = (8 + 8 * rand(id, 1)) / pace(id), u = (t / P + rand(id, 2)) % 1, tr = 0.7 / P;
    const pr = smooth(u / tr) * smooth((0.7 - u) / tr);
    return pr + (1 - pr) * rest;
  };
  // Lines: each connection lives its own 6-14 s cycle, off for a fifth of it. Half of them draw on from one end over
  // 0.9 s and retract into the other; the other half fade up over 1.2 s and fade off again (D45: no light ever runs
  // over a line). Returns the stretch of the line to draw, as fractions, and an opacity factor.
  type Life = [number, number, number];
  const settled = ([s0, s1, a]: Life): Life => [s0 * (1 - rest), s1 + (1 - s1) * rest, a + (1 - a) * rest];
  const lineLife = (key: number, t: number): Life => settled(lineCycle(key, t));
  const traceLife = (k: number, t: number): Life => settled(traceCycle(k, t));
  const lineCycle = (key: number, t: number): Life => {
    if (!t) return [0, 1, 1];
    const P = (6 + 8 * rand(key, 5)) / pace(key), u = (t / P + rand(key, 6)) % 1, off = 0.2;
    if (rand(key, 12) < 0.5) {
      const tr = 1.2 / P;
      return [0, 1, u < 1 - off ? smooth(u / tr) * smooth((1 - off - u) / tr) : 0];
    }
    const tr = 0.9 / P;
    if (u < tr) return [0, smooth(u / tr), 1];
    if (u < 1 - off - tr) return [0, 1, 1];
    if (u < 1 - off) return [smooth((u - (1 - off - tr)) / tr), 1, 1];
    return [1, 1, 1];
  };
  // Traces: now and then (every 16-24 s, each its own) a trace goes and comes back: half of them wipe off from the
  // left, are gone a moment and draw on again; the other half fade off and fade back up
  const traceCycle = (k: number, t: number): Life => {
    if (!t) return [0, 1, 1];
    const P = (16 + 8 * rand(k + 700, 8)) / pace(k + 700), u = (t / P + rand(k + 700, 9)) % 1;
    if (rand(k + 700, 12) < 0.5) return [0, 1, u < 0.2 ? 1 - smooth(u / 0.07) * smooth((0.2 - u) / 0.08) : 1];
    if (u < 0.06) return [smooth(u / 0.06), 1, 1];
    if (u < 0.1) return [1, 1, 1];
    if (u < 0.2) return [0, smooth((u - 0.1) / 0.1), 1];
    return [0, 1, 1];
  };
  // A line drawn between [s0, s1] of its length, from one end or the other as its key decides
  const part = (p: Path2D, key: number, s0: number, s1: number, ax: number, ay: number, bx: number, by: number) => {
    if (s1 <= s0) return;
    if (rand(key, 7) < 0.5) { p.moveTo(bx + (ax - bx) * s0, by + (ay - by) * s0); p.lineTo(bx + (ax - bx) * s1, by + (ay - by) * s1); return; }
    p.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); p.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1);
  };
  // Pockets (D58): small isolated clusters in the quieter parts of the picture, after the dense knots the plexus forms
  // over the near forest late in the move ("closer to that level in some other isolated areas"): in the mist right of
  // the headline, the mist below the far ridges and the bottom left. Each is anchored to the long-lived tracked point
  // nearest its place at the start (so it rides the land through the move), raises the composition to full around it
  // (core.ts), and carries seven satellite points of its own, fixed to the anchor at seeded offsets (the mist has few
  // tracked points to join). Video coordinates.
  // D64: two more nearer the text, right of the headline's last line and right of the button
  const POCKETS: [number, number][] = [[0.55, 0.4], [0.52, 0.62], [0.2, 0.84], [0.43, 0.48], [0.39, 0.7]];
  const pocketTrack = POCKETS.map(([u, v]) => {
    let best = -1, bd = Infinity;
    points.forEach((t, i) => {
      const q = sample(t, 0, PX.step);
      if (!q || (t.pts.length / 2) * PX.step < PX.frames * 0.6) return;
      const d = Math.hypot(q[0] - u, q[1] - v);
      if (d < bd) { bd = d; best = i; }
    });
    return bd < 0.08 ? best : -1;
  });
  // D59: six satellites each (was seven), with the composition trimmed, about a fifth fewer new elements
  const SATS = 6;
  // The foreground trees (D61: "add more dust and connecting lines to the foreground trees that enter as we scroll
  // down"): they rise into the picture late in the pull-back. Since D63 they are tracked properly: a second pass ran
  // the clip in reverse from the final frame (assets/generated/2026-11-05_hero-reverse-track), and its tree tracks are
  // part of the data (plexus-z-j2.json, dust-z-j2.json), so every dot and line there sits on a real tracked point.
  // Up to seven anchors among the points low in the picture on dark ground at 85% of the move, at least 12% apart,
  // become pockets that fade in as the trees enter (frames from 150), so the composition carries the detail there.
  // (D61's satellites and motes at fixed offsets, and D62's end anchors placed by the closing column, are gone: they
  // drifted against the trees.)
  const FG_AT = Math.round(PX.frames * 0.85);
  const fgTrack: number[] = [];
  points
    .map((t, i) => ({ i, q: sample(t, FG_AT, PX.step), l: groundAt(t, FG_AT, PX.step), n: t.pts.length }))
    .filter((o) => o.q && o.q[1] > 0.5 && o.l < 0.3)
    .sort((a, b) => b.n - a.n)
    .forEach((o) => {
      if (fgTrack.length < 7 && fgTrack.every((j) => { const q = sample(points[j], FG_AT, PX.step)!; return Math.hypot(q[0] - o.q![0], q[1] - o.q![1]) > 0.12; })) fgTrack.push(o.i);
    });
  const you = keys.reduce((b, t, i) => (Math.abs((sample(t, 0, PX.step)?.[0] ?? 9) - 0.66) < Math.abs((sample(keys[b], 0, PX.step)?.[0] ?? 9) - 0.66) ? i : b), 0);
  // Plexus rules: lines only within reach (in the picture's own scale, growing a little with the scroll), each point to
  // its K nearest, every line fading with its length
  // In A4 the traces lead: its plexus is a step lighter and its traces a step heavier
  // D49 (option 1, "too subtle"): every line, trace and dot stronger, and a short line at full strength, fading more
  // gently as it lengthens (below)
  const K = 3, REACH = variant === "traces" ? 0.058 : 0.068;
  // D50: option 1's strength is shaped by the composition (below), which carries "too intense" and "too busy"
  const LINE = variant === "traces" ? 0.5 : variant === "plexusTraces" ? 0.55 : bright ? 1 : 0.7;
  // on a phone the picture is a short band above the copy, where option 1 at full strength crowds it
  const narrow = () => window.innerWidth < 768;
  const TRACE = bright ? { a: 1, w: 1.1 } : variant === "plexusTraces" ? { a: 0.65, w: 1 } : { a: 0.55, w: 0.75 };
  // Ground this dark (under 5%) is crushed black: no dots there, and traces break (D48)
  const CRUSHED = 0.05;
  let dpr = 1;
  let inv = { ox: 0, oy: 0, dw: 1, dh: 1 };

  // Batched, token-coloured drawing (core.ts makeInk): colour follows the ground under each mark, deep green over pale
  // mist shading to white over the dark forest (D43), blended rather than switched so a line on a ridge's edge never
  // flickers
  type Batch = Map<string, Path2D>;
  const add = ink.add, flush = ink.flush;
  const out: Path2D[] = [];
  // `tone` (D68): option 1's marks vary in saturation and brightness (core.ts toneOf); the other looks keep one tone
  const both = (b: Batch, ground: number, a: number, width: number, tone = 0) => {
    out.length = 0;
    const p = ink.inked(b, ground, a, width, bright ? tone : 0);
    if (p) out.push(p);
    return out;
  };
  const seg = (p: Path2D, ax: number, ay: number, bx: number, by: number) => { p.moveTo(ax, ay); p.lineTo(bx, by); };
  // D59, the rule for lines that join dots: never one flat tone over the picture. Each is drawn in eight stretches whose
  // strength follows its place along the line: full at the dots at either end, about a sixth in the middle. Same life
  // as `part` (the stretch [s0, s1], from the end the key picks); still batched, by the stretches' quantised alphas.
  const GRAD_N = 8;
  const along = (t: number) => 0.15 + 0.85 * Math.pow(Math.abs(2 * t - 1), 1.2);
  const gradPart = (b: Batch, ground: number, a: number, w: number, key: number, s0: number, s1: number, ax: number, ay: number, bx: number, by: number, tone = toneOf(key)) => {
    if (s1 <= s0) return;
    const [sx, sy, ex, ey] = rand(key, 7) < 0.5 ? [bx, by, ax, ay] : [ax, ay, bx, by];
    for (let k = 0; k < GRAD_N; k++) {
      const t0 = Math.max(k / GRAD_N, s0), t1 = Math.min((k + 1) / GRAD_N, s1);
      if (t1 <= t0) continue;
      for (const p of both(b, ground, a * along((t0 + t1) / 2), w, tone)) seg(p, sx + (ex - sx) * t0, sy + (ey - sy) * t0, sx + (ex - sx) * t1, sy + (ey - sy) * t1);
    }
  };
  const cross = (p: Path2D, x: number, y: number, r: number, gap: number) => {
    seg(p, x - r, y, x - gap, y); seg(p, x + gap, y, x + r, y); seg(p, x, y - r, x, y - gap); seg(p, x, y + gap, x, y + r);
  };
  const bracket = (p: Path2D, x: number, y: number, r: number, l: number) => {
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      p.moveTo(x + sx * r, y + sy * (r - l)); p.lineTo(x + sx * r, y + sy * r); p.lineTo(x + sx * (r - l), y + sy * r);
    }
  };

  return {
    resize: (c) => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(c.W * dpr); canvas.height = Math.round(c.H * dpr);
    },
    draw: (c) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, c.W, c.H);
      const [ox, oy] = c.map(0, 0), [x1, y1] = c.map(1, 1);
      inv = { ox, oy, dw: x1 - ox, dh: y1 - oy };
      const grow = smooth(c.f / 120);
      rest = c.rest;
      // Each point keeps its own size (one in five a touch larger, as Plexus vertices vary), whatever order it is drawn in
      type GPt = Pt & { l: number };
      type Dot = GPt & { r: number; id: number };
      // Option 1 keeps clear of the headline itself (D49), so the open picture below and beside it can carry detail,
      // and follows the composition (D50, core.ts): everything fades into the white towards the left and is strongest
      // around the right-hand upper phi point; where the composition is light, the field also thins (below)
      // The focus is your node, where it is this frame
      const yp = bright ? point(keys[you], c, PX) : null, focus: [number, number] | null = yp && [yp.x, yp.y];
      // Each pocket's anchor this frame: its tracked point, or its place in the picture where that point isn't on screen
      const anchors = bright ? POCKETS.map(([u, v], k): GPt => {
        const t = pocketTrack[k] >= 0 ? points[pocketTrack[k]] : null, p = t && point(t, c, PX);
        if (p && t) return { ...p, l: groundAt(t, c.f, PX.step) };
        const [x, y] = c.map(u, v);
        return { x, y, a: 1, l: 0.75 };
      }) : [];
      // the foreground anchors this frame, with how far the trees have entered (D61)
      const enter = smooth((c.f - (FG_AT - 55)) / 45);
      const fg = bright && enter > 0 ? fgTrack.map((i): GPt | null => { const p = point(points[i], c, PX); return p && { ...p, a: p.a * enter, l: groundAt(points[i], c.f, PX.step) }; }).filter((p): p is GPt => !!p) : [];
      const pockets: number[][] = [...anchors.map((p) => [p.x, p.y]), ...fg.map((p) => [p.x, p.y, p.a])];
      onFocus?.(focus, pockets);
      const comp = (x: number, y: number) => composition(c, x, y, focus, pockets);
      // D58: the composition's quietest parts keep three tenths of the layer (was 15%)
      // D59: and in the bottom left, mixed progressively into the picture towards the left and up (core.ts cornerFade)
      const clear = (x: number, y: number) => (bright ? clearOfCopy(c, x, y) * (0.3 + 0.7 * comp(x, y)) * cornerFade(c, x, y) : 1);
      // a point is kept where the composition wants it: nearly all of them at the focus, few where it is light
      // D66: in proportion (about 1.4x the composition's strength is kept), so density tapers off towards the headline
      // rather than cutting off below a threshold (was: nothing kept under 16%)
      const thin = (id: number, x: number, y: number) => (bright ? smooth((1.4 * comp(x, y) - rand(id, 40)) / 0.12) : 1);
      const at = (t: Track): GPt | null => { const p = point(t, c, PX); return p && { ...p, a: p.a * clear(p.x, p.y), l: groundAt(t, c.f, PX.step) }; };
      // the near trees' points (D63, the reverse track) are their own field: never thinned, and at least 60% strong
      // wherever the headline allows, so the trees carry lines as well as dust as they rise into the picture
      const tracked = points.map((t, i): Dot | null => {
        const p = at(t), pr = presence(i, c.t, 0.45);
        if (p && t.fg && bright) { const q = point(t, c, PX)!; p.a = Math.max(p.a, 0.6 * q.a * clearOfCopy(c, p.x, p.y)); }
        return p && { ...p, a: p.a * pr * (t.fg ? 1 : thin(i, p.x, p.y)), r: (i % 5 === 0 ? 1.6 : 1.1) * (bright ? 1.1 : 1) * (0.35 + 0.65 * pr), id: i };
      });
      // Air (D44): points in the sky and mist, not tracked to the land. They travel with the upper scene through the
      // camera move and drift a little on their own (a few pixels over 7-15 s), so the lines drawn to them are never
      // still. Half of them come and go.
      const kk = clamp(c.f / PX.step, 0, PX.sky.length / 2 - 1), k0 = Math.min(Math.floor(kk), PX.sky.length / 2 - 2), ku = kk - k0;
      const sx = (PX.sky[2 * k0] + (PX.sky[2 * k0 + 2] - PX.sky[2 * k0]) * ku) / 1e4, sy = (PX.sky[2 * k0 + 1] + (PX.sky[2 * k0 + 3] - PX.sky[2 * k0 + 1]) * ku) / 1e4;
      // Three in five of the air points (D45: the pale sky beside the headline was too dense)
      const air = PX.air.map((q, k): Dot | null => {
        if (k % 5 === 1 || k % 5 === 3) return null;
        const id = 5000 + k, tau = 2 * Math.PI * c.t * pace(id);
        const dx = 0.006 * Math.sin(tau / (9 + 6 * rand(id, 8)) + 6.3 * rand(id, 9)), dy = 0.004 * Math.sin(tau / (7 + 5 * rand(id, 10)) + 6.3 * rand(id, 11));
        const [x, y] = c.map(q.x / 1e4 + sx + dx, q.y / 1e4 + sy + dy);
        const pr = presence(id, c.t, 0.5);
        // Option 1: few air points in the sky beside the headline (D49: "less in the red")
        // D64: eased to half (was 85%), so the effect comes closer to the headline
        const sky = bright ? 1 - 0.5 * smooth((0.34 - y / c.H) / 0.08) * smooth((x / c.W - 0.38) / 0.05) * smooth((0.7 - x / c.W) / 0.05) : 1;
        const a = Math.min(clamp(y / 40), clamp((c.H - y) / 40), clamp((c.W - x) / 40), clamp(x / 40)) * pr * sky * clear(x, y) * thin(id, x, y);
        // the ground under it along its path through the move (measured offline), so its colour follows what it drifts over
        const l = (q.lum[k0] + ((q.lum[k0 + 1] ?? q.lum[k0]) - q.lum[k0]) * ku) / 99;
        return a > 0 ? { x, y, a, l, r: 1.1 * (0.35 + 0.65 * pr), id } : null;
      });
      // Pocket satellites (D58): seven points around each anchor, within about 5% of the picture's width (flattened a
      // little, like the land), drifting a few pixels on their own; ids from 7000, so like the air points they reach a
      // little further and show only while a line reaches them
      const sats = anchors.flatMap((q, k) => Array.from({ length: SATS }, (_, n): Dot | null => {
        const id = 7000 + k * 10 + n, tau = 2 * Math.PI * c.t * pace(id);
        const r = inv.dw * 0.05 * (0.3 + 0.7 * Math.sqrt(rand(id, 30))), ang = 2 * Math.PI * rand(id, 31);
        const x = q.x + r * Math.cos(ang) + 2.5 * Math.sin(tau / (8 + 5 * rand(id, 32))), y = q.y + 0.7 * r * Math.sin(ang) + 2 * Math.sin(tau / (7 + 4 * rand(id, 33)));
        const pr = presence(id, c.t, 0.35);
        const a = q.a * Math.min(clamp(y / 40), clamp((c.H - y) / 40), clamp((c.W - x) / 40), clamp(x / 40)) * pr * clear(x, y) * thin(id, x, y);
        return a > 0 ? { x, y, a, l: q.l, r: (n % 3 === 0 ? 1.6 : 1.1) * 1.1 * (0.35 + 0.65 * pr), id } : null;
      }));
      const pts = [...tracked, ...air, ...sats].filter((p): p is Dot => !!p);
      const lines: Batch = new Map(), dots: Batch = new Map();

      // Ridge traces (TRON's line-work that follows the land), worked out first so the plexus can give way to them:
      // drawn on by a sweep from the left, which cuts each segment exactly at the sweep line (so a trace grows smoothly).
      // A link that has stretched well beyond its length at the chain's own frame has slipped onto another ridge, so the
      // trace breaks there; runs shorter than three points are dropped (no stubs).
      const traced = variant === "traces" || variant === "plexusTraces" || bright;
      const traceRuns: { p: GPt; i: number }[][][] = [];
      // Per trace: its chain, every vertex's point this frame, and which run each vertex belongs to (-1: none)
      const traceChains: { chain: Plex["chains"][number]; cp: (GPt | null)[]; runOf: number[] }[] = [];
      let sweep = Infinity;
      // A segment cut at the sweep line, or null when it lies wholly beyond it
      const clip = (ax: number, ay: number, bx: number, by: number): [number, number, number, number] | null => {
        if (ax >= sweep && bx >= sweep) return null;
        if (ax > sweep) { const u = (sweep - bx) / (ax - bx); return [bx + (ax - bx) * u, by + (ay - by) * u, bx, by]; }
        if (bx > sweep) { const u = (sweep - ax) / (bx - ax); return [ax, ay, ax + (bx - ax) * u, ay + (by - ay) * u]; }
        return [ax, ay, bx, by];
      };
      if (traced) {
        // On load the traces draw on across the whole picture from the left over 3 s (ambient), so the first frame is
        // never empty; without ambient motion they are simply there
        const intro = c.t ? smooth(c.t / 3) : 1;
        sweep = c.W * (0.35 + 0.75 * intro);
        // Segments of the traces built so far (longest chains first): where a nearer slope rises and hides a farther
        // ridge, that ridge's tracked points slide onto the slope's edge, so a trace breaks where it comes within 6 px
        // (at 960 px of picture width, scaled with the picture: about 12 px at 1920) of one already drawn, and the
        // longer trace keeps the ridge
        const taken: number[][] = [];
        const gap = (6 * inv.dw) / 960;
        const nearTaken = (x: number, y: number) => taken.some(([ax, ay, bx, by]) => {
          if (x < Math.min(ax, bx) - gap || x > Math.max(ax, bx) + gap || y < Math.min(ay, by) - gap || y > Math.max(ay, by) + gap) return false;
          const dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
          return Math.hypot(ax + u * dx - x, ay + u * dy - y) < gap;
        });
        (variant === "traces" ? chains.slice(0, 5) : chains).forEach((chain) => {
          const cp = chain.tracks.map(at);
          const runs: { p: GPt; i: number }[][] = [];
          let run: { p: GPt; i: number }[] = [];
          const end = () => { if (run.length > 2) runs.push(run); run = []; };
          cp.forEach((p, i) => {
            // no vertex over open mist (very pale ground): a trace follows a ridge's edge, never across the mist below it;
            // nor over crushed black, where a grade has flattened the land and a track has nothing true to hold (D48)
            if (!p || p.l > 0.82 || p.l < CRUSHED || nearTaken(p.x, p.y)) { end(); return; }
            const prev = run[run.length - 1];
            if (prev) {
              const ratio = Math.hypot(p.x - prev.p.x, p.y - prev.p.y) / inv.dw / (chain.len0[i - 1] / 1e4 || 1);
              // ridges here slope gently; a link steeper than about 50 degrees has slid onto the edge of something in
              // front (a tree rising into the frame, D48), so the trace breaks there rather than climb it
              const steep = Math.abs(p.y - prev.p.y) > 1.2 * Math.abs(p.x - prev.p.x);
              if (prev.i !== i - 1 || ratio > 1.5 || ratio < 0.5 || steep) end();
            }
            run.push({ p, i });
          });
          end();
          traceRuns.push(runs);
          runs.forEach((r) => r.slice(1).forEach((v, n) => taken.push([r[n].p.x, r[n].p.y, v.p.x, v.p.y])));
          const runOf = cp.map(() => -1);
          runs.forEach((r, n) => r.forEach((v) => { runOf[v.i] = n; }));
          traceChains.push({ chain, cp, runOf });
        });
      }
      // How far each point is from the nearest trace: a plexus line with both ends on a trace would only double it, so
      // it fades out as both ends come within 16 px of one (fully gone inside 6 px; smoothly, so nothing pops)
      const segs = traceRuns.flat().flatMap((r) => r.slice(1).map((v, n) => clip(r[n].p.x, r[n].p.y, v.p.x, v.p.y))).filter((q): q is [number, number, number, number] => !!q);
      const toTrace = (x: number, y: number) => {
        let best = Infinity;
        for (const [ax, ay, bx, by] of segs) {
          // Only segments whose box (grown by the fade's 16 px) contains the point can matter
          if (x < Math.min(ax, bx) - 16 || x > Math.max(ax, bx) + 16 || y < Math.min(ay, by) - 16 || y > Math.max(ay, by) + 16) continue;
          const dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
          best = Math.min(best, Math.hypot(ax + u * dx - x, ay + u * dy - y));
        }
        return best;
      };

      // Travellers (D46): dots that slide along the ridge traces, so the plexus lines tied to them swing and stretch,
      // before the scroll and during it. Two on each of the five longest traces and one on each shorter one, each going
      // slowly back and forth along its whole chain (15-35 px/s, easing at the turns). The motion runs over the chain's
      // vertices at a fixed reference length (its links' length at its own frame), so the camera move cannot speed it up;
      // its place is then taken on the tracked ridge this frame, so it stays on the land. It fades at the ends of the
      // drawn stretch it is on (and across any break), at a wipe's edge and at the draw-on line, and, like the air dots,
      // shows only while it pulls a line (it is a node, never a bead sliding along the trace).
      traceChains.forEach(({ chain, cp, runOf }, k) => {
        const [v0, v1, ta] = traceLife(k, c.t);
        const n = cp.length, ref = (chain.len0.reduce((sum, v) => sum + v, 0) / 1e4) * inv.dw;
        if (n < 3 || ref < 40) return;
        for (let m = 0; m < (k < 5 ? 2 : 1); m++) {
          const id = 3000 + k * 4 + m, speed = (15 + 20 * rand(id, 14)) * pace(id);
          const fi = (n - 1) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (c.t * speed / (2 * ref) + rand(id, 15))));
          const i0 = Math.min(Math.floor(fi), n - 2), u = fi - i0, a = cp[i0], b = cp[i0 + 1];
          if (!a || !b || runOf[i0] < 0 || runOf[i0] !== runOf[i0 + 1]) continue;
          // where it sits along its run, for the fades at the run's ends and at a wipe's edge
          const r = traceRuns[k][runOf[i0]];
          let arc = 0, total = 0;
          for (let q = 1; q < r.length; q++) {
            const l = Math.hypot(r[q].p.x - r[q - 1].p.x, r[q].p.y - r[q - 1].p.y);
            if (r[q].i <= i0) arc += l; else if (r[q].i === i0 + 1) arc += l * u;
            total += l;
          }
          const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u;
          const edge = smooth(arc / 20) * smooth((total - arc) / 20) * smooth((arc - v0 * total) / 20) * smooth((v1 * total - arc) / 20) * smooth((sweep - x) / 20);
          if (edge <= 0) continue;
          pts.push({ x, y, a: Math.min(a.a, b.a) * ta * edge, l: a.l + (b.l - a.l) * u, r: 1.5, id });
        }
      });

      // Lines. A pair is joined when either end counts the other among its K nearest. Rather than a hard cut at the
      // K-th neighbour, a line fades out as a closer (K+1)-th point overtakes it, so lines never pop on or off.
      // The reach breathes slowly (±6% over about 10 s), so connections also form and part between points that stay
      const reach = inv.dw * REACH * (0.86 + 0.14 * grow) * (1 + 0.06 * Math.sin((2 * Math.PI * c.t * 1.1) / 11));
      const soft = reach * 0.2;
      // Pairs within reach only: a sweep over the points sorted by x, so most pairs are never measured
      pts.sort((p, q) => p.x - q.x);
      const pairs: [number, number, number][] = [], within: number[][] = pts.map(() => []);
      // Air points reach a little further (1.25x): they sit apart, in open sky, and should still have lines drawn to them
      const AIR = 5000, far = reach * 1.25, reachOf = (i: number, j: number) => (pts[i].id >= AIR || pts[j].id >= AIR ? far : reach);
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length && pts[j].x - pts[i].x < far; j++) {
        const d = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y), reach = reachOf(i, j);
        // A point that is still fading in (or out) counts as farther off, so it takes over a neighbour's place gradually
        if (d < reach && d > 0) { pairs.push([i, j, d]); within[i].push(d + (1 - pts[j].a) * reach); within[j].push(d + (1 - pts[i].a) * reach); }
      }
      // where the composition is light, option 1 joins each point to its two nearest only (D50: no knots)
      const kOf = (i: number) => (bright && comp(pts[i].x, pts[i].y) < 0.6 ? 2 : K);
      const cut = within.map((ds, i) => (ds.length > kOf(i) ? ds.sort((p, q) => p - q)[kOf(i)] : reach));
      const onTrace = segs.length ? pts.map((p) => toTrace(p.x, p.y)) : null;
      const linked = pts.map(() => 0); // the strongest line drawn to each point this frame
      for (const [i, j, d] of pairs) {
        const r = reachOf(i, j);
        const keep = Math.max(smooth((cut[i] - d) / soft), smooth((cut[j] - d) / soft));
        if (keep <= 0) continue;
        const a = pts[i], b = pts[j], l = (a.l + b.l) / 2;
        // D67 ("remove 30% of the lines here"): near the headline about three in ten lines are left out (fixed per pair)
        if (bright && rand(Math.min(a.id, b.id) * 10007 + Math.max(a.id, b.id), 90) < 0.3 * nearCopy(c, (a.x + b.x) / 2, (a.y + b.y) / 2)) continue;
        // Traces: the detail stays with the ridges and the mist; the dark foreground forest keeps only its dots
        const ground = variant === "traces" ? 0.2 + 0.8 * smooth((l - 0.22) / 0.2) : 1;
        const offTrace = onTrace ? smooth((Math.max(onTrace[i], onTrace[j]) - 6) / 10) : 1;
        // lighter over pale ground, where the lines stack up against the sky (D45); option 1 only a little lighter there
        // D58: option 1 no longer lightens over pale ground (the mist is where it was hardest to see)
        const pale = bright ? 1 : 1 - 0.45 * smooth((l - 0.6) / 0.2);
        // fading with length: option 1 holds a short line at full strength and fades a long one away (D49:
        // "brighter when they are shorter then fade some as they get longer")
        const fall = bright ? Math.min(1, 1.6 * Math.pow(1 - d / r, 2)) : Math.pow(1 - d / r, 1.6);
        const al = LINE * (bright && narrow() ? 0.7 : 1) * fall * Math.min(a.a, b.a) * keep * ground * offTrace * pale;
        const key = Math.min(a.id, b.id) * 10007 + Math.max(a.id, b.id), [s0, s1, fa] = lineLife(key, c.t);
        if (bright) gradPart(lines, l, al * fa, 1.1, key, s0, s1, a.x, a.y, b.x, b.y);
        else for (const p of both(lines, l, al * fa, 0.75)) part(p, key, s0, s1, a.x, a.y, b.x, b.y);
        linked[i] = Math.max(linked[i], al * fa * (s1 - s0)); linked[j] = Math.max(linked[j], al * fa * (s1 - s0));
      }
      // Depth links (D44): long lines between a near point and a far one (chosen offline by how fast each moves through
      // the camera move), so the scroll stretches, shortens and turns them: parallax in the lines, not just the land.
      // They live the same life as the plexus lines (drawing on and off, or fading up and off), a little lighter.
      PX.links.forEach(([i, j], n) => {
        const a = tracked[i], b = tracked[j];
        if (!a || !b) return;
        if (bright && rand(900000 + n, 90) < 0.3 * nearCopy(c, (a.x + b.x) / 2, (a.y + b.y) / 2)) return;
        const key = 900000 + n, [s0, s1, fa] = lineLife(key, c.t);
        // thinner than the plexus, and lighter the longer it is (a long line should not outweigh the short ones)
        const len = Math.hypot(b.x - a.x, b.y - a.y), fade = 1 - 0.45 * smooth((len - 2 * reach) / (2 * reach));
        if (bright) gradPart(lines, (a.l + b.l) / 2, 0.45 * Math.min(a.a, b.a) * fade * fa, 0.75, key, s0, s1, a.x, a.y, b.x, b.y);
        else for (const p of both(lines, (a.l + b.l) / 2, 0.34 * Math.min(a.a, b.a) * fade * fa, 0.6)) part(p, key, s0, s1, a.x, a.y, b.x, b.y);
      });
      // Dots. An air dot or a traveller shows only while a line reaches it (it fades with its strongest line), so the sky
      // has no lone specks (D45) and no bead slides bare along a trace (D46)
      pts.forEach((p, i) => {
        if (p.l < CRUSHED) return;
        const a = p.id >= AIR || (p.id >= 3000 && p.id < 5000) ? p.a * smooth(linked[i] / 0.06) : p.a;
        const pr = bright ? p.r * 1.25 : p.r;
        // D67: the dots nearest the headline 40% more transparent
        const near = bright ? 1 - 0.4 * nearCopy(c, p.x, p.y) : 1;
        for (const path of both(dots, p.l, (bright ? 1 : 0.85) * a * near, 0, toneOf(p.id + 31))) { path.moveTo(p.x + pr, p.y); path.arc(p.x, p.y, pr, 0, Math.PI * 2); }
      });

      if (traced) {
        // The traces themselves, ticked at every third vertex of the chain; each now and then goes and comes back
        traceRuns.forEach((runs, k) => {
          const [v0, v1, ta] = traceLife(k, c.t);
          for (const r of runs) {
            const P = r.map((v) => v.p);
            const lens = P.slice(1).map((p, n) => Math.hypot(p.x - P[n].x, p.y - P[n].y)), total = lens.reduce((s, v) => s + v, 0);
            const lo = v0 * total, hi = v1 * total;
            // D59 (option 1): the gradient rule on the traces too. Their ticked vertices (every third, and the run's
            // ends) are their dots: each stretch between two is strongest at them and dips to about 30% between (a
            // gentler dip than the plexus lines', so a ridge still reads as one line)
            const nodes: number[] = [];
            let acc = 0;
            r.forEach((v, n) => { if (n > 0) acc += lens[n - 1]; if (n === 0 || n === r.length - 1 || v.i % 3 === 0) nodes.push(acc); });
            const along = (s: number) => {
              if (!bright) return 1;
              let k = 0;
              while (k < nodes.length - 2 && s > nodes[k + 1]) k++;
              const t = clamp((s - nodes[k]) / (nodes[k + 1] - nodes[k] || 1));
              return 0.3 + 0.7 * Math.pow(Math.abs(2 * t - 1), 1.2);
            };
            // The trace, drawn only along its living stretch [lo, hi] (it wipes off and draws on now and then)
            let d = 0;
            for (let n = 1; n < r.length; n++) {
              const a = r[n - 1].p, b = r[n].p, l = lens[n - 1], d0 = d;
              const u0 = clamp((lo - d) / l), u1 = clamp((hi - d) / l);
              d += l;
              if (u1 <= u0) continue;
              // in four pieces, each at the gradient's strength at its middle
              for (let m = 0; m < (bright ? 4 : 1); m++) {
                const pieces = bright ? 4 : 1, ua = u0 + ((u1 - u0) * m) / pieces, ub = u0 + ((u1 - u0) * (m + 1)) / pieces;
                const qp = clip(a.x + (b.x - a.x) * ua, a.y + (b.y - a.y) * ua, a.x + (b.x - a.x) * ub, a.y + (b.y - a.y) * ub);
                if (!qp) continue;
                // each trace keeps one tone along its length (a ridge is one line), varying from ridge to ridge
                for (const p of both(lines, (a.l + b.l) / 2, TRACE.a * Math.min(a.a, b.a) * ta * along(d0 + (l * (ua + ub)) / 2), TRACE.w, toneOf(8000 + k) % 4)) seg(p, qp[0], qp[1], qp[2], qp[3]);
              }
              const q = clip(a.x + (b.x - a.x) * u0, a.y + (b.y - a.y) * u0, a.x + (b.x - a.x) * u1, a.y + (b.y - a.y) * u1);
              if (!q) continue;
              for (const p of both(lines, (a.l + b.l) / 2, TRACE.a * Math.min(a.a, b.a) * ta, TRACE.w)) {
                // ticks only where the composition is strong (option 1), so the quieter traces are plain lines
                if (r[n].i % 3 === 0 && b.x < sweep && d >= lo && d <= hi && (!bright || comp(b.x, b.y) > 0.7)) {
                  const len = l || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
                  seg(p, b.x - nx * 3, b.y - ny * 3, b.x + nx * 3, b.y + ny * 3);
                }
              }
            }
          }
        });
      }

      // Key nodes: crosshairs (with brackets in the rings look); the one green node is yours
      keys.forEach((t, i) => {
        const p = at(t);
        if (!p || i === you) return;
        for (const path of both(lines, p.l, 0.9 * p.a, 1)) {
          cross(path, p.x, p.y, 7, 2.5);
          if (variant === "rings") bracket(path, p.x, p.y, 11, 4);
        }
      });
      flush(lines);
      flush(dots, true);

      // in option 1 your node is the composition's focus itself, so only the headline fades it
      const y = bright ? (() => { const p = point(keys[you], c, PX); return p && { ...p, a: p.a * clearOfCopy(c, p.x, p.y), l: groundAt(keys[you], c.f, PX.step) }; })() : at(keys[you]);
      // D64: option 1 no longer marks your node ("remove the circle with crosshair all together"); it stays the focus
      if (y && !bright) {
        const mark = new Map() as Batch;
        const gp = add(mark, GREEN, y.a, 1.25)!;
        cross(gp, y.x, y.y, 8, 3);
        gp.moveTo(y.x + 12, y.y); gp.arc(y.x, y.y, 12, 0, Math.PI * 2);
        if (c.t) {
          // A slow beacon: a ring opens from yours and fades over about 2.2 s, once every 7.3 s
          const ph = ((c.t * 1.1 + 1) % 8) / 2.4;
          if (ph < 1) {
            const r = 12 + 18 * smooth(ph), beacon = add(mark, GREEN, 0.5 * (1 - smooth(ph)) * y.a, 1);
            if (beacon) { beacon.moveTo(y.x + r, y.y); beacon.arc(y.x, y.y, r, 0, Math.PI * 2); }
          }
        }
        if (variant === "rings") {
          // Ticked rings (after the Throne Room's rings of decoded data), turning with the scroll
          const turn = (c.f * 0.6 * Math.PI) / 180;
          for (const p of both(mark, y.l, 0.75 * y.a, 0.75)) {
            for (let k = 0; k < 60; k++) {
              const ang = turn + (k * Math.PI * 2) / 60, r0 = 22, r1 = k % 5 === 0 ? 27 : 24.5;
              seg(p, y.x + Math.cos(ang) * r0, y.y + Math.sin(ang) * r0, y.x + Math.cos(ang) * r1, y.y + Math.sin(ang) * r1);
            }
            for (let k = 0; k < 4; k++) {
              const a0 = -turn * 0.7 + (k * Math.PI) / 2 + 0.25;
              p.moveTo(y.x + Math.cos(a0) * 36, y.y + Math.sin(a0) * 36);
              p.arc(y.x, y.y, 36, a0, a0 + Math.PI / 2 - 0.5);
            }
          }
          const arc = add(mark, GREEN, 0.6 * y.a, 1.25);
          if (arc) { arc.moveTo(y.x + Math.cos(turn * 1.4) * 48, y.y + Math.sin(turn * 1.4) * 48); arc.arc(y.x, y.y, 48, turn * 1.4, turn * 1.4 + 0.6); }
        }
        flush(mark);
      }
      g.globalAlpha = 1;
    },
  };
}

// `settle` (A4s, D43): the ambient motion plays for the first 5 s, then holds, and moves again for 3 s after the
// reader scrolls, moves the pointer, touches or presses a key; so nothing moves on its own for longer than 5 s
// (WCAG 2.2.2) and the first frame is still never frozen
// `data`: which render the plexus looks are tracked to. "plexus" is the original crane render (D41-D46); "master" is the
// D47 master render (the first 5.4 s of take g), made by the same pipeline (assets/generated/2026-11-04_hero-explore/pipeline.sh). It must
// match the video under the layer.
const DATA = {
  plexus: () => import("./plexus.json"),
  master: () => import("./plexus-master.json"),
  // D48: the pull-back renders (takes i and j), graded Green 1 with 10% more contrast
  zi: () => import("./plexus-z-i.json"),
  zj: () => import("./plexus-z-j.json"),
  // D49 option 1: take j with a denser field low in the picture and a sparser one in the sky beside the headline
  zj1: () => import("./plexus-z-j1.json"),
  // D63: zj1 with the reverse track of the near trees merged in (and the main pass's points that slid there cut)
  zj2: () => import("./plexus-z-j2.json"),
  // D93: zj2 re-sampled onto the re-timed take j (home-hero-ridges-take-j-v2.mp4: the move's 4-frame rhythm evened out)
  zj3: () => import("./plexus-z-j3.json"),
};
export type LayerData = keyof typeof DATA;

export function HeroLayer({ look, settle = false, data = "plexus" }: { look: LayerLook; settle?: boolean; data?: LayerData }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    const media = host?.closest<HTMLElement>("[data-ch='media']");
    const stage = host?.closest<HTMLElement>("[data-ch='stage']");
    if (!host || !media || !stage) return;
    const video = media.querySelector<HTMLVideoElement>("[data-ch='video']");
    const img = media.querySelector<HTMLImageElement>("img");
    const copyEl = host.closest("[data-ch='root']")?.querySelector<HTMLElement>("[data-ch='copy']") ?? null;
    const playing = () => !!video?.hasAttribute("data-ready");
    const shown = () => (playing() ? video : img) as HTMLElement | null;
    // The thread's head (ChapterOneMotion), in this layer's coordinates; the two boxes only shift on resize
    let headOff: [number, number] | null = null;
    const headDot = () => {
      const dot = stage.querySelector<SVGCircleElement>("[data-ch='head']");
      if (!dot || !dot.getAttribute("cy")) return null;
      if (!headOff) {
        const s = (dot.ownerSVGElement ?? dot).getBoundingClientRect(), r = host.getBoundingClientRect();
        headOff = [s.left - r.left, s.top - r.top];
      }
      return [headOff[0] + Number(dot.getAttribute("cx")), headOff[1] + Number(dot.getAttribute("cy"))] as [number, number];
    };

    const picture = () => {
      const el = playing() ? video : img;
      return el && (el instanceof HTMLVideoElement ? el.readyState >= 2 : el.complete && el.naturalWidth) ? el : null;
    };
    let L: Look = { draw: () => {} }, dead = false;
    if (look === "survey") L = survey(host);
    else if (look === "readings") L = readings(host, picture);
    else if (look === "route") L = route(host, headDot);
    else if (look === "notes") L = notes(host);
    else {
      // The dense point field is only fetched for the looks that draw it
      const variant = look;
      const ready = (l: Look) => {
        if (dead) return;
        L = l;
        W = 0; // so the next update sizes the new canvas
        update();
      };
      if (variant === "dust") Promise.all([DATA[data](), import("./dust-z-j.json")]).then(([m, d]) => ready(dust(host, m.default as Plex, d.default)));
      else if (variant === "plexusDust") Promise.all([DATA[data](), data === "zj3" ? import("./dust-z-j3.json") : data === "zj2" ? import("./dust-z-j2.json") : import("./dust-z-j.json")]).then(([m, d]) => {
        // the dust underneath (its canvas first), A4 over it; D51: the dust at full strength, with particles rising off
        // the land
        let focus: [number, number] | null = null, pockets: number[][] = [];
        // D58: the dust a third stronger, and shaped by the same pockets as the plexus over it
        // D64: nine risers (was five), more of them lifting a triangle
        const under = dust(host, m.default as Plex, d.default, { strength: 1.35, weight: (c, x, y) => composition(c, x, y, focus, pockets) * cornerFade(c, x, y), ribbons: false, risers: 9 });
        const over = plexus(host, "plexusBright", m.default as Plex, (p, k) => { focus = p; pockets = k; });
        ready({ resize: (c) => { under.resize?.(c); over.resize?.(c); }, draw: (c) => { under.draw(c); over.draw(c); } });
      });
      else if (variant === "signal") DATA[data]().then((m) => ready(signal(host, m.default as Plex)));
      else DATA[data]().then((m) => ready(plexus(host, variant, m.default as Plex)));
    }

    // The frame on screen: during a seek currentTime is already the target while the old frame still shows, so take
    // the presented frame's own time where the browser reports it, and otherwise hold the last time while seeking
    let shownT = 0, vfc = 0;
    const hasVFC = !!video && "requestVideoFrameCallback" in video;
    if (video && hasVFC) {
      const onFrame = (_: number, m: VideoFrameCallbackMetadata) => { shownT = m.mediaTime; vfc = video.requestVideoFrameCallback(onFrame); };
      vfc = video.requestVideoFrameCallback(onFrame);
    }
    const frameNow = () => {
      if (!playing()) return 0;
      if (!hasVFC && !video!.seeking) shownT = video!.currentTime;
      return shownT * FPS;
    };

    let W = 0, H = 0, key = "", raf = 0, inView = true, crop = "";
    // The headline block's text as a box relative to the block (D64): the union of its text lines and its links
    let tight: [number, number, number, number] | null = null, tightKey = "";
    const textBox = (el: HTMLElement, a: DOMRect): [number, number, number, number] | null => {
      let l = Infinity, t = Infinity, r = -Infinity, btm = -Infinity;
      const grow = (q: DOMRect) => { l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); btm = Math.max(btm, q.bottom); };
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), range = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) grow(q);
      }
      el.querySelectorAll("a, button").forEach((q) => grow(q.getBoundingClientRect()));
      return r > l ? [l - a.left, t - a.top, r - l, btm - t] : null;
    };
    let pos = [0.5, 0.5];
    const ctx = (): Ctx => {
      // The same crop as the picture under it: object-fit cover at its object-position (read once per size and source)
      const el = shown(), id = `${W}|${H}|${playing()}`;
      if (id !== crop && el) { crop = id; pos = getComputedStyle(el).objectPosition.split(" ").map((v) => parseFloat(v) / 100); }
      const s = Math.max(W / VW, H / VH), dw = VW * s, dh = VH * s, ox = (W - dw) * pos[0], oy = (H - dh) * (pos[1] ?? 0.5);
      const t = ambientT();
      // The headline block, where it sits over the picture now (it scrolls up over the pinned stage)
      // D64: the text itself (its lines and the button), not the block's full width, which runs well past the words
      // and kept the layer from coming close to them; measured once per size, relative to the block, then moved with it
      let box: Ctx["copy"] = null;
      if (copyEl && copyEl.offsetParent) {
        const a = copyEl.getBoundingClientRect(), b = host.getBoundingClientRect();
        if (tightKey !== `${W}|${H}`) { tightKey = `${W}|${H}`; tight = textBox(copyEl, a); }
        if (a.bottom > b.top && a.top < b.bottom) box = tight ? [a.left + tight[0] - b.left, a.top + tight[1] - b.top, tight[2], tight[3]] : [a.left - b.left, a.top - b.top, a.width, a.height];
      }
      return { host, W, H, f: frameNow(), t, rest: restNow, map: (nx, ny) => [ox + nx * dw, oy + ny * dh], copy: box, thread: headDot()?.[0] ?? null };
    };
    const update = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (w !== W || h !== H) { W = w; H = h; headOff = null; L.resize?.(ctx()); key = ""; }
      const c = ctx();
      const hd = look === "route" ? headDot() : null;
      // At rest (no scroll frame or size change for 250 ms) ambient-only changes redraw at 30 fps; while the reader
      // scrolls every frame draws, since skipping the frames that wait on a video seek made the scroll's pacing uneven
      const rest = `${c.f.toFixed(2)}|${W}|${H}|${playing()}`, now = performance.now();
      if (rest !== lastStill) lastMove = now;
      if (rest === lastStill && c.t && now - lastMove > 250 && now - lastDraw < 33) return;
      const k = `${c.f.toFixed(2)}|${c.t}|${c.rest.toFixed(3)}|${W}|${H}|${playing()}|${hd?.map((v) => v.toFixed(0)).join()}|${look === "readings" ? (shown() as HTMLImageElement)?.complete : ""}`;
      if (k === key) return;
      key = k; lastStill = rest; lastDraw = performance.now();
      L.draw(c);
    };
    // Only the desktop camera move (and the thread) can change the picture between resizes; elsewhere the layer sits
    // at the first frame over the still, so it redraws on resize and once the still has loaded, and otherwise idles
    const motion = window.matchMedia("(min-width: 1280px) and (prefers-reduced-motion: no-preference)");
    // Ambient motion (D43): the plexus looks keep moving on their own, at every size, unless the reader prefers reduced
    // motion; it pauses with the tab and whenever the hero is off screen
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const PLEX_LOOKS: LayerLook[] = ["plexus", "traces", "rings", "plexusTraces", "plexusBright", "dust", "signal", "plexusDust"];
    const ambient = () => PLEX_LOOKS.includes(look) && !still.matches;
    // The ambient clock: it advances while motion is allowed (always, or with `settle` only for the first 5 s and
    // within 3 s of the reader's last scroll, pointer move, touch or key), and holds otherwise, so motion resumes where
    // it stopped. It starts just above zero, since a zero t means "no ambient motion" to the looks.
    const t0 = performance.now();
    let clock = 1e-4, lastNow = t0, lastInput = -Infinity, lastDraw = 0, lastStill = "", lastMove = 0;
    // With `settle`, every line and dot also eases to its resting state (whole, present) over 1.2 s once the clock
    // holds, and back into its cycle over 0.6 s when it moves again, so nothing is left half-drawn
    let restNow = 0, restFrom = 0, restAt = t0, wasMoving = true;
    const ambientT = () => {
      if (!ambient()) return 0;
      const now = performance.now();
      const moving = !settle || now - t0 < 5000 || now - lastInput < 3000;
      if (moving !== wasMoving) { wasMoving = moving; restAt = now; restFrom = restNow; }
      restNow = moving ? restFrom * (1 - smooth((now - restAt) / 600)) : restFrom + (1 - restFrom) * smooth((now - restAt) / 1200);
      if (moving) clock += Math.min(now - lastNow, 100) / 1000;
      lastNow = now;
      return clock;
    };
    const onInput = () => { lastInput = performance.now(); };
    const INPUTS = ["scroll", "pointermove", "touchstart", "keydown"] as const;
    if (settle) INPUTS.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    const tick = () => { raf = requestAnimationFrame(tick); if (inView) update(); };
    const start = () => { cancelAnimationFrame(raf); raf = 0; if (motion.matches || ambient()) raf = requestAnimationFrame(tick); else update(); };
    const ro = new ResizeObserver(() => update());
    ro.observe(host);
    img?.addEventListener("load", update);
    motion.addEventListener("change", start);
    still.addEventListener("change", start);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(media);
    start();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect(); ro.disconnect();
      img?.removeEventListener("load", update);
      motion.removeEventListener("change", start);
      still.removeEventListener("change", start);
      if (settle) INPUTS.forEach((e) => window.removeEventListener(e, onInput));
      host.querySelectorAll("svg, canvas").forEach((n) => n.remove());
    };
  }, [look, settle, data]);

  return (
    <div ref={ref} className={`${styles.layer} ${styles[look]}`} data-look={look} aria-hidden="true">
      {look === "notes" && NOTES.map((n) => (
        <div key={n.text} className={styles.chip} data-note>
          <p className={styles.chipLine}>{n.figure && <span className={styles.figure}>{n.figure}</span>} {n.text}</p>
          <p className={styles.chipSource}>{n.source}</p>
        </div>
      ))}
    </div>
  );
}
