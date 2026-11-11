// "Our goal is to make ourselves smaller": the Foundation's ink slab stands in the middle of an iso dot floor; as you scroll (p 0 → 1) it gets smaller and
// its functions leave it, one small cube at a time, each flying out along an arc to a point of the floor where it becomes part of the ecosystem (a person,
// a tile, a plate); the floor's dots multiply (the lattice spreads, then doubles), and the new nodes link to their neighbours. Everything is a pure
// function of p (reversible, scrubbed); only the pings are time-based. Reduced motion: p = 1 (the finished state), one frame per resize.
import { C, S, INK, GREEN, DARK, LIGHT, box, quad, person, ring, fit, clamp, oBack, io, rng } from "./canvas-kit";

type Nd = { i: number; j: number; d: number; th: number; kind: 0 | 1 | 2; g: boolean; nb: number[]; s: number };
const N = 11;

export type Devolve = { setP: (p: number) => void; dispose: () => void };

/** the slab's footprint (lattice cells) and height (cells) at p */
const SLAB = (p: number) => { const e = io(clamp(p / 0.9)); return { fp: 7.4 - 5.9 * e, h: 3.4 - 2.5 * e }; };

export function createDevolve(cv: HTMLCanvasElement, stage: HTMLElement, chip: HTMLElement | null, reduced: boolean): Devolve {
  let W = 0, H = 0, g = 14, ox = 0, oy = 0, pT = reduced ? 1 : 0, pS = pT, raf = 0, visible = false, dead = false;
  const t0 = performance.now();
  const R = rng(11), nodes: Nd[] = [];
  /* the ecosystem's places: a sparse, irregular selection of the lattice (none under the slab's final footprint) */
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
    const d = Math.max(Math.abs(i), Math.abs(j)); if (d < 2) continue;
    if (R() > 0.4 - d * 0.006) continue;
    const r = R();
    nodes.push({ i, j, d, th: 0, kind: r < 0.5 ? 0 : r < 0.82 ? 1 : 2, g: R() < 0.12, nb: [], s: R() });
  }
  /* when each one leaves the slab: nearest first, with some scatter; the cells under the slab wait until it has shrunk past them */
  const pFor = (fp: number) => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (SLAB(m).fp > fp) lo = m; else hi = m; } return hi; };
  nodes.forEach((n) => {
    const base = 0.04 + ((n.d - 2) / (N - 2)) * 0.74 + (n.s - 0.5) * 0.16;
    const free = n.d < 4.4 ? pFor(Math.max(1.5, 2 * (n.d - 0.7))) + 0.02 : 0;
    n.th = clamp(Math.max(base, free), 0.02, 0.9);
  });
  /* each links to its two nearest */
  nodes.forEach((n, a) => { n.nb = nodes.map((m, b) => [b, Math.hypot(m.i - n.i, m.j - n.j)] as [number, number]).filter(([b]) => b !== a).sort((x, y) => x[1] - y[1]).slice(0, 2).filter(([, dd]) => dd < 3.2).map(([b]) => b).filter((b) => b > a || !nodes[b].nb.includes(a)); });

  const FLY = 0.075;
  function frame(now: number) {
    if (dead) return;
    const t = (now - t0) / 1000;
    pS += (pT - pS) * (reduced ? 1 : 0.16); if (Math.abs(pT - pS) < 1e-4) pS = pT;
    const p = pS, { c } = fit(cv, W, H);
    c.clearRect(0, 0, W, H); c.lineWidth = 1;
    const X = (i: number, j: number) => ox + (i - j) * C * g, Y = (i: number, j: number, z = 0) => oy + ((i + j) * S - z) * g;
    /* the floor: the lattice spreads out from the slab, then doubles */
    const reach = 5.5 + (N + 1.5 - 5.5) * io(clamp(p / 0.7)), dbl = clamp((p - 0.4) / 0.5);
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
      const d = Math.max(Math.abs(i), Math.abs(j)), a = clamp(reach - d) * (0.22 + 0.2 * clamp(1 - d / N)); if (a < 0.02) continue;
      c.fillStyle = `rgba(38,38,38,${a.toFixed(3)})`; c.fillRect(X(i, j) - 0.9, Y(i, j) - 0.9, 1.8, 1.8);
      if (dbl > 0 && i < N && j < N) {
        const dd = Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5)), b = clamp(dbl * (N + 2) - dd) * 0.22 * clamp(1 - dd / (N + 1));
        if (b > 0.02) { c.fillStyle = `rgba(38,38,38,${b.toFixed(3)})`; c.fillRect(X(i + 0.5, j + 0.5) - 0.7, Y(i + 0.5, j + 0.5) - 0.7, 1.4, 1.4); }
      }
    }
    /* the floor's edge: a hairline diamond that draws as the lattice reaches it */
    const rim = clamp((reach - N) / 1.5);
    if (rim > 0) {
      const E = N + 0.6; c.globalAlpha = 0.35 * rim; c.strokeStyle = INK; c.setLineDash([2, 4]);
      c.beginPath(); c.moveTo(X(-E, -E), Y(-E, -E)); c.lineTo(X(E, -E), Y(E, -E)); c.lineTo(X(E, E), Y(E, E)); c.lineTo(X(-E, E), Y(-E, E)); c.closePath(); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
    }
    const k = g / 10.5;   // the objects' scale (world units per lattice cell: 10.5)
    const placed = (n: Nd) => clamp((p - n.th - FLY) / 0.03);
    /* the links, on the floor */
    c.strokeStyle = INK; c.setLineDash([2.5, 3]);
    nodes.forEach((n) => n.nb.forEach((b) => {
      const m = nodes[b], a = Math.min(placed(n), placed(m)); if (a <= 0) return;
      c.globalAlpha = 0.42 * a; c.beginPath(); c.moveTo(X(n.i, n.j), Y(n.i, n.j)); c.lineTo(X(m.i, m.j), Y(m.i, m.j)); c.stroke();
    }));
    c.setLineDash([]); c.globalAlpha = 1;
    /* objects and the slab, back to front (by i + j); the flights on top */
    const sl = SLAB(p);
    const items: [number, () => void][] = [];
    nodes.forEach((n) => {
      const u = placed(n); if (u <= 0) return;
      items.push([n.i + n.j, () => {
        const x = X(n.i, n.j), y = Y(n.i, n.j);
        if (!reduced && u >= 1) { const per = 5 + n.s * 7, ph = (t + n.s * per) % per; if (ph < 1.4 && n.s > 0.55) { const v = ph / 1.4; c.globalAlpha = (1 - v) * 0.5; c.strokeStyle = n.g ? GREEN : INK; ring(c, x, y, k, 4 + v * 9); c.globalAlpha = 1; c.strokeStyle = INK; } }
        c.save(); c.globalAlpha = clamp(u * 2); c.translate(x, y); const s = oBack(u); c.scale(s, s);
        if (n.kind === 0) person(c, 0, 0, k, 0, n.g);
        else if (n.kind === 1) box(c, 0, 0, k, 5.2, 5.2, 3 + n.s * 6, 0, LIGHT, n.g ? GREEN : undefined);
        else { box(c, 0, 0, k, 9, 9, 1.8, 0, LIGHT); person(c, 0, 0, k, 1.8, n.g); }
        c.restore();
      }]);
    });
    items.push([0.01, () => {
      const fp = sl.fp * 10.5, h = sl.h * 10.5;
      box(c, ox, oy, k, fp, fp, h, 0, DARK);
      const q = Math.min(2.6, fp * 0.28); quad(c, ox, oy, k, -q / 2, -q / 2, q, q, h, GREEN);
    }]);
    items.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
    /* the flights: a small cube leaves the slab's top along an arc */
    nodes.forEach((n) => {
      const f = (p - n.th) / FLY; if (f <= 0 || f >= 1) return;
      const e = io(f), sx = ox, sy = oy - sl.h * g, tx = X(n.i, n.j), ty = Y(n.i, n.j);
      const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e - Math.hypot(tx - sx, ty - sy) * 0.35 * 4 * e * (1 - e);
      c.globalAlpha = clamp(f * 6) * clamp((1 - f) * 8 + 0.3);
      box(c, x, y, k, 3.2, 3.2, 3.2, 0, n.g ? DARK : LIGHT, n.g ? GREEN : undefined);
      c.globalAlpha = 1;
    });
    /* the chip rides the slab's top */
    if (chip) {
      const cy = oy - sl.h * g - sl.fp * g * S - 34, cx = ox + 10;
      chip.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    }
    stage.style.setProperty("--dp", p.toFixed(4));
    if (!reduced && visible) raf = requestAnimationFrame(frame);
  }

  function resize() {
    const r = cv.parentElement!.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    g = Math.max(8, Math.min((W * 0.9) / (4 * N * C), (H * 0.74) / (2 * N + 3)));
    ox = W / 2; oy = H * 0.52;
    if (reduced || !visible) { cancelAnimationFrame(raf); frame(performance.now()); }
  }
  const io_ = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && !reduced) raf = requestAnimationFrame(frame); }), { rootMargin: "10% 0px" });
  io_.observe(stage);
  const ro = new ResizeObserver(resize); ro.observe(cv.parentElement!);
  resize();
  return {
    setP: (p) => { if (reduced) return; pT = clamp(p); },
    dispose: () => { dead = true; cancelAnimationFrame(raf); io_.disconnect(); ro.disconnect(); },
  };
}
