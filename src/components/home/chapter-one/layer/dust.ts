import styles from "./HeroLayer.module.css";
import { clamp, smooth, rand, groundAt, point, clearOfCopy, makeInk, toneOf, type Batch, type Ctx, type Data, type Look, type Plex, type Track } from "./core";

// D49, option 2: the land drawn as light. After point-cloud renders (a wolf, a car, a globe made of glittering
// particles, ribbons of light through a city), the ridges become rims of light built from thousands of tiny particles
// packed along every tracked silhouette (thickest at the edge, thinning into the land below it), over a quieter field
// of tracked particles on the slopes, larger where the land is near. Every particle twinkles on its own clock and a
// share come and go; now and then one glints. Motes drift in the sky and mist with the upper scene, and a few ribbons
// of fine line follow the ridges, drawing on and off (never a light running along them: D45). It keeps clear of the
// headline itself.
// dust-z-j.json (select_dust.py): about 550 tracked points on screen, every 6th frame, each with the ground's brightness
// under it and whether it sits on a ridge's edge
export type Dust = Data & { points: (Track & { edge?: number })[] };
// As a second layer under A4 (D50): `strength` scales every particle, `weight` (core.ts composition) shapes it across
// the picture (and thins the field where it is light), and `ribbons` off leaves the ridge lines to A4's traces.
// `risers` (D51): how many particles at a time lift off the land into the air (below)
export type DustOptions = { strength?: number; weight?: (c: Ctx, x: number, y: number) => number; ribbons?: boolean; risers?: number };

export function dust(host: HTMLElement, PX: Plex, D: Dust, { strength = 1, weight, ribbons = true, risers = 0 }: DustOptions = {}): Look {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  host.appendChild(canvas);
  const g = canvas.getContext("2d")!;
  // Glitter is light on anything but the pale sky: deep green with a little NEAR green over pale mist (where light
  // would vanish), a pale green-white over the mid-tone ridges, white touched with green over the dark forest
  const ink = makeInk(g, { pale: [0.3, 0], mid: [0.5, 0.7], dark: [0.3, 0.95] });
  // One satellite around each tracked particle (a fixed offset a few px out, scaled with the picture); it rides its
  // particle and shimmers a pixel or so
  const SAT = 1;
  let dpr = 1;
  // Each riser's origin particles, fixed when its cycle starts (so a scroll never swaps them mid-rise): "slot|cycle"
  const origins = new Map<string, number[]>();

  return {
    resize: (c) => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(c.W * dpr); canvas.height = Math.round(c.H * dpr);
    },
    draw: (c: Ctx) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, c.W, c.H);
      const [ox] = c.map(0, 0), [x1] = c.map(1, 1), s = (x1 - ox) / 1920;
      const dots: Batch = new Map(), lines: Batch = new Map();
      // D51: as a layer it now stays at least 30% strong where the composition is light ("much stronger")
      const shaped = (x: number, y: number) => strength * (weight ? 0.3 + 0.7 * weight(c, x, y) : 1);
      // the field's particles drawn this frame (risers start from them), by index
      const seen = new Map<number, [number, number, number]>();
      // the bottom left, below the headline: the golden spiral's sweep (core.ts composition)
      const lowLeft = (x: number, y: number) => y / c.H > 0.55 && x / c.W < 0.7;
      // D68: as a layer under option 1, each particle keeps its own tone (deeper, paler, muted or vivid as well as the
      // plain shade), so the glitter is not one flat green
      const dot = (x: number, y: number, r: number, l: number, a: number, id = 0) => {
        const p = ink.inked(dots, l, a * shaped(x, y), 0, weight ? toneOf(id + 17) : 0);
        if (!p) return;
        // round, however small (D50: square specks read as sensor dust)
        p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2);
      };

      // The ridges as tracked runs: every chain's points this frame, broken where the tracking slips (a link far longer
      // or shorter than at the chain's own frame, or steeper than the ridges run), over open mist and at the headline.
      // Each vertex: x, y, ground brightness, opacity (its own fades at its track's ends and the frame's edges, and
      // its clearance from the headline)
      type V = [number, number, number, number];
      const runsOf = PX.chains.map((chain) => {
        const runs: V[][] = [];
        let run: V[] = [];
        chain.tracks.forEach((t, i) => {
          const q = point(t, c, PX), l = groundAt(t, c.f, PX.step);
          const prev = run[run.length - 1];
          const ok = !!q && l < 0.82 && (!prev || (() => {
            const ratio = Math.hypot(q.x - prev[0], q.y - prev[1]) / (x1 - ox) / (chain.len0[i - 1] / 1e4 || 1);
            return ratio > 0.5 && ratio < 1.5 && Math.abs(q.y - prev[1]) < 1.2 * Math.abs(q.x - prev[0]);
          })());
          if (!ok || !q) { if (run.length > 1) runs.push(run); run = []; if (q && l < 0.82) run.push([q.x, q.y, l, q.a * clearOfCopy(c, q.x, q.y)]); return; }
          run.push([q.x, q.y, l, q.a * clearOfCopy(c, q.x, q.y)]);
        });
        if (run.length > 1) runs.push(run);
        return runs;
      });

      // Rims: along every run, a particle about every 2 px of the silhouette, most of them right on the edge and the
      // rest scattered a few px into the land below it (the edge's own side), tiny, each twinkling on its own
      runsOf.forEach((runs, n) => runs.forEach((r, m) => {
        for (let k = 1; k < r.length; k++) {
          const [ax, ay, al, aa] = r[k - 1], [bx, by, bl, ba] = r[k];
          const len = Math.hypot(bx - ax, by - ay), M = Math.round(len / (2.2 * s));
          if (!M) continue;
          // the normal pointing down into the land
          let nx = -(by - ay) / len, ny = (bx - ax) / len;
          if (ny < 0) { nx = -nx; ny = -ny; }
          for (let q = 0; q < M; q++) {
            const id = n * 100000 + m * 1000 + k * 40 + q, u = (q + rand(id, 1)) / M;
            const depth = s * 9 * Math.pow(rand(id, 2), 2.2);
            const x = ax + (bx - ax) * u + nx * depth, y = ay + (by - ay) * u + ny * depth;
            const tw = c.t ? 0.55 + 0.45 * Math.sin(2 * Math.PI * (c.t * (0.2 + 0.5 * rand(id, 3)) + rand(id, 4))) : 0.8;
            const a = (aa + (ba - aa) * u) * tw * (1 - 0.5 * depth / (9 * s));
            dot(x, y, s * (0.65 + 0.5 * rand(id, 5)), al + (bl - al) * u, a, id);
          }
        }
      }));

      D.points.forEach((t, i) => {
        const p = point(t, c, D);
        if (!p) return;
        const l = groundAt(t, c.f, D.step), clear = clearOfCopy(c, p.x, p.y);
        // as a layer: none over pale ground (specks there read as dirt), and the field thins smoothly where the
        // composition is light
        // (D51: in the bottom left, where the picture is mostly pale mist, the field may sit on pale ground too, lighter)
        const bl = weight ? lowLeft(p.x, p.y) : false;
        if (clear <= 0 || (weight && l > (bl ? 0.85 : 0.7))) return;
        const keep = weight ? smooth((weight(c, p.x, p.y) + 0.4 - rand(i, 41)) / 0.1) : 1;
        if (keep <= 0) return;
        // a third of the particles come and go on 6-14 s cycles, over a second either way
        let pr = 1;
        if (c.t && rand(i, 3) < 0.33) {
          const P = 6 + 8 * rand(i, 1), u = (c.t / P + rand(i, 2)) % 1, tr = 1 / P;
          pr = smooth(u / tr) * smooth((0.75 - u) / tr);
        }
        // twinkle (0.15-0.6 Hz), and a glint now and then (one in six, every 4-9 s, a quarter second)
        const tw = c.t ? 0.6 + 0.4 * Math.sin(2 * Math.PI * (c.t * (0.15 + 0.45 * rand(i, 4)) + rand(i, 5))) : 0.85;
        let glint = 0;
        if (c.t && rand(i, 6) < 0.16) {
          const P = 4 + 5 * rand(i, 7), u = (c.t / P + rand(i, 8)) % 1;
          glint = smooth(u / 0.03) * smooth((0.06 - u) / 0.03);
        }
        const edge = t.edge ? 1 : 0, near = 1 - l;
        const r = s * (0.8 + 1.2 * near + 0.3 * edge) * (1 + 0.8 * glint);
        const a = p.a * pr * clear * keep * (bl && l > 0.7 ? 0.5 : 1) * Math.min(1, (edge ? 0.9 : 0.55) * tw + glint);
        dot(p.x, p.y, r, l, a, i);
        if (a > 0.3) seen.set(i, [p.x, p.y, l]);
        for (let k = 0; k < SAT; k++) {
          const ang = 2 * Math.PI * rand(i, 10 + k), d = s * (4 + 9 * rand(i, 12 + k)) * (0.6 + 0.6 * near);
          const sh = c.t ? Math.sin(2 * Math.PI * c.t * (0.2 + 0.3 * rand(i, 14 + k))) * s : 0;
          dot(p.x + Math.cos(ang) * (d + sh), p.y + Math.sin(ang) * (d + sh), r * 0.65, l, a * (0.55 + 0.35 * rand(i, 16 + k)), i * 7 + k + 3);
        }
      });

      // Risers (D51): now and then a particle lifts off the land and drifts up into the air like dust caught by the
      // wind, a line drawn back to where it left (its origin stays tracked to the land). The line is a curve, strongest
      // at the land and fainter towards the particle, and it fades as it lengthens; the particle and its line are gone
      // by the top of the rise. `risers` slots each run their own 5-8 s cycle: rising over 80% of it, then a pause. Half
      // of the cycles lift two of the origin's nearest neighbours too, joined to each other as they rise (a polygon)
      // as well as to their own origins. So about 4-8 are in the air at once (D64: nine slots in the hero, about 7-14).
      if (c.t && risers) {
        const edgeFade = (x: number, y: number) => Math.min(clamp(y / 40), clamp((c.H - y) / 40), clamp(x / 40), clamp((c.W - x) / 40));
        for (let k = 0; k < risers; k++) {
          const P = 5 + 3 * rand(k, 60), v = c.t / P + rand(k, 61), cyc = Math.floor(v), u = v - cyc;
          if (u > 0.8) continue;
          const key = `${k}|${cyc}`;
          let set = origins.get(key);
          if (!set) {
            // chosen only as a cycle starts (otherwise the slot sits this cycle out, so nothing appears mid-rise): the
            // first of a few random particles that is on screen, on the land, where the composition is moderate (the
            // busiest middle is left to the lines), and clear of the headline
            set = [];
            if (u < 0.06) {
              const cand = Array.from({ length: 16 }, (_, m) => Math.floor(rand(cyc * 31 + k, 62 + m) * D.points.length));
              const o = cand.find((j) => {
                const q = seen.get(j), w = q && weight ? weight(c, q[0], q[1]) : 0.5;
                // D64: the busier middle too (no upper bound on the composition), where the ridges climb to the focus
                // and every other slot only there (w > 0.6), so the rising lines gather over those ridges
                return q && q[2] < (lowLeft(q[0], q[1]) ? 0.8 : 0.65) && w > (k % 2 ? 0.6 : 0.3) && clearOfCopy(c, q[0], q[1]) >= 1;
              });
              if (o !== undefined) {
                set.push(o);
                if (rand(cyc * 31 + k, 80) < 0.65) {
                  const [ox0, oy0] = seen.get(o)!;
                  const dist = (q: [number, number, number]) => Math.hypot(q[0] - ox0, q[1] - oy0);
                  const near = [...seen].filter(([j, q]) => j !== o && dist(q) < 80 * s && dist(q) > 14 * s).sort((a2, b2) => dist(a2[1]) - dist(b2[1])).slice(0, 2).map(([j]) => j);
                  if (near.length === 2) set.push(...near);
                }
              }
            }
            origins.set(key, set);
            if (origins.size > 4 * risers) origins.delete(origins.keys().next().value!);
          }
          const rise = smooth(u / 0.8), fade = 1 - rise, side = rand(cyc * 31 + k, 81) < 0.5 ? -1 : 1;
          const tops: [number, number, number, number][] = [];
          set.forEach((j, n) => {
            // the origin where it is this frame, from its own track (never gated by its twinkle)
            const t = D.points[j], q = point(t, c, D);
            if (!q) return;
            const l = groundAt(t, c.f, D.step), id = cyc * 97 + k * 7 + n;
            const H = s * (70 + 90 * rand(id, 63)) * (1 - 0.15 * n), lift = H * (1 - (1 - rise) * (1 - rise));
            // the wind: a drift to one side that grows as it rises, and a slow sway
            const drift = side * s * (40 + 20 * rand(id, 64)) * Math.pow(rise, 1.5) + s * 4 * Math.sin(2 * Math.PI * c.t / (2.5 + rand(id, 65)));
            const x = q.x + drift, y = q.y - lift;
            const a = q.a * smooth(u / 0.06) * fade * clearOfCopy(c, x, y) * edgeFade(x, y) * strength;
            if (a <= 0) return;
            // the curve leaves the land straight up and bends with the wind; in three pieces, fainter towards the top
            const cx = q.x, cy = q.y - lift * 0.6;
            const bez = (w: number): [number, number] => [(1 - w) * (1 - w) * q.x + 2 * (1 - w) * w * cx + w * w * x, (1 - w) * (1 - w) * q.y + 2 * (1 - w) * w * cy + w * w * y];
            for (let m = 0; m < 3; m++) {
              const ln = ink.inked(lines, l, 0.8 * a * (1 - m / 3), 0.6);
              if (!ln) continue;
              const [x0, y0] = bez(m / 3); ln.moveTo(x0, y0);
              for (let z = 1; z <= 4; z++) { const [xz, yz] = bez((m + z / 4) / 3); ln.lineTo(xz, yz); }
            }
            const d = ink.inked(dots, l, Math.min(1, 1.2 * a), 0);
            if (d) { const r = s * 1.9; d.moveTo(x + r, y); d.arc(x, y, r, 0, Math.PI * 2); }
            tops.push([x, y, l, a]);
          });
          if (tops.length === 3) {
            // the triangle's edges join dots, so they follow the gradient rule (D59): strongest at the rising particles,
            // about a sixth between, in six stretches each
            const a3 = 0.6 * Math.min(...tops.map((q) => q[3]));
            for (let e = 0; e < 3; e++) {
              const [ax, ay] = tops[e], [bx, by] = tops[(e + 1) % 3];
              for (let m = 0; m < 6; m++) {
                const t0 = m / 6, t1 = (m + 1) / 6, along = 0.15 + 0.85 * Math.pow(Math.abs(t0 + t1 - 1), 1.2);
                const pg = ink.inked(lines, tops[0][2], a3 * along, 0.6);
                if (pg) { pg.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0); pg.lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1); }
              }
            }
          }
        }
      }

      // Motes: a few around each air point, travelling with the upper scene and drifting on their own
      const kk = clamp(c.f / PX.step, 0, PX.sky.length / 2 - 1), k0 = Math.min(Math.floor(kk), PX.sky.length / 2 - 2), ku = kk - k0;
      const sx = (PX.sky[2 * k0] + (PX.sky[2 * k0 + 2] - PX.sky[2 * k0]) * ku) / 1e4, sy = (PX.sky[2 * k0 + 1] + (PX.sky[2 * k0 + 3] - PX.sky[2 * k0 + 1]) * ku) / 1e4;
      PX.air.forEach((q, k) => {
        const l = (q.lum[k0] + ((q.lum[k0 + 1] ?? q.lum[k0]) - q.lum[k0]) * ku) / 99;
        // as a layer: one mote per air point, and none over pale sky
        if (weight && l > 0.65) return;
        for (let m = 0; m < (weight ? 1 : 4); m++) {
          const id = 5000 + k * 4 + m, tau = 2 * Math.PI * c.t;
          const dx = 0.035 * (rand(id, 1) - 0.5) + 0.006 * Math.sin(tau / (9 + 6 * rand(id, 2)) + 6.3 * rand(id, 3));
          const dy = 0.03 * (rand(id, 4) - 0.5) + 0.005 * Math.sin(tau / (7 + 5 * rand(id, 5)) + 6.3 * rand(id, 6));
          const [x, y] = c.map(q.x / 1e4 + sx + dx, q.y / 1e4 + sy + dy);
          const tw = c.t ? 0.55 + 0.45 * Math.sin(2 * Math.PI * (c.t * (0.1 + 0.3 * rand(id, 7)) + rand(id, 8))) : 0.8;
          const a = 0.7 * tw * clearOfCopy(c, x, y) * Math.min(clamp(y / 40), clamp((c.H - y) / 40), clamp((c.W - x) / 40));
          if (a > 0) dot(x, y, s * (0.9 + 0.7 * rand(id, 9)), l, a, id);
        }
      });

      // Ribbons: on the four longest ridges, two fine strands just above the ridge, as smooth curves through its
      // tracked points. Each lives its own 12-20 s cycle: draws on from one end over 2.5 s, holds, retracts into the
      // other end (the moving end interpolated along its segment, so it grows smoothly), and fades with its points.
      if (ribbons) runsOf.slice(0, 4).forEach((runs, n) => {
        for (let strand = 0; strand < 2; strand++) {
          const id = 800 + n * 2 + strand, off = s * (5 + 6 * strand);
          let lo = 0, hi = 1;
          if (c.t) {
            const P = 12 + 8 * rand(id, 1), u = (c.t / P + rand(id, 2)) % 1, tr = 2.5 / P;
            if (u < tr) hi = smooth(u / tr);
            else if (u > 0.85 - tr && u < 0.85) lo = smooth((u - (0.85 - tr)) / tr);
            else if (u >= 0.85) continue;
          }
          for (const r of runs) {
            if (r.length < 4) continue;
            const at = (f: number) => {
              const k = Math.min(Math.floor(f), r.length - 2), u = f - k;
              return [r[k][0] + (r[k + 1][0] - r[k][0]) * u, r[k][1] + (r[k + 1][1] - r[k][1]) * u - off];
            };
            const f0 = lo * (r.length - 1), f1 = hi * (r.length - 1);
            if (f1 - f0 < 0.5) continue;
            const v = [at(f0), ...r.slice(Math.floor(f0) + 1, Math.ceil(f1)).map(([x, y]) => [x, y - off]), at(f1)];
            const a = Math.min(...r.map((q) => q[3]));
            const p = ink.inked(lines, r[Math.floor(r.length / 2)][2], (0.7 - 0.2 * strand) * a, 0.8);
            if (!p) continue;
            // a smooth curve: through the midpoints, with the vertices as control points
            p.moveTo(v[0][0], v[0][1]);
            for (let k = 1; k < v.length - 1; k++) p.quadraticCurveTo(v[k][0], v[k][1], (v[k][0] + v[k + 1][0]) / 2, (v[k][1] + v[k + 1][1]) / 2);
            p.lineTo(v[v.length - 1][0], v[v.length - 1][1]);
          }
        }
      });

      ink.flush(lines);
      ink.flush(dots, true);
    },
  };
}
