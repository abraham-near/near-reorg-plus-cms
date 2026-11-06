import styles from "./HeroLayer.module.css";
import { clamp, smooth, rand, sample, groundAt, point, clearOfCopy, makeInk, type Batch, type Ctx, type Look, type Plex, type Pt } from "./core";

// D49, option 3: data rising from the land. After GMUNK's TRON: Legacy boardroom graphics (a globe's points sending
// up lines with a dot at each tip, an arc carried from one city to another, rings of data blocks, columns of falling
// data), on the same tracked points as A4:
//   bars:  thin vertical lines rising from tracked points, a dot at the tip, a tick at the foot. Each grows up from
//          the land, its height breathes as if read live, and it sinks back. One in four is a column of dots instead.
//          Nearer land carries taller bars. Never green, and never on the green thread, so none reads as a copy of it.
//   arcs:  two at a time, in NEAR green, an arc lifts from your node and lands on another key node or a far point:
//          it draws on, holds, then its tail follows it in (never a light running along it: D45); its landing opens
//          a ring.
//   rings: ringed data around your node, laid flat on the land: a fine ring, a ring of data blocks of varying
//          length, and a ticked ring, turning slowly (and with the scroll).
// It keeps clear of the headline itself.
export function signal(host: HTMLElement, PX: Plex): Look {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  host.appendChild(canvas);
  const g = canvas.getContext("2d")!;
  // The bars and rings in deep green over pale ground and white over dark: NEAR green is kept for the arcs and your
  // node, which are yours (as the thread is)
  const ink = makeInk(g, { pale: [0, 0], mid: [0.15, 0.25], dark: [0.1, 1] });
  const GREEN = ink.GREEN;
  const { points, keys } = PX;
  const you = keys.reduce((b, t, i) => (Math.abs((sample(t, 0, PX.step)?.[0] ?? 9) - 0.66) < Math.abs((sample(keys[b], 0, PX.step)?.[0] ?? 9) - 0.66) ? i : b), 0);
  // Bars on three in ten of the tracked points, and every key node
  const BARS = points.map((t, i) => ({ t, id: i })).filter(({ id }) => rand(id, 30) < 0.3);
  let dpr = 1;

  // A bar's life: 7-13 s, rising over 1.2 s, held (its height breathing), sinking over 0.9 s, gone for a fifth
  const barLife = (id: number, t: number) => {
    if (!t) return 1;
    const P = 7 + 6 * rand(id, 31), u = (t / P + rand(id, 32)) % 1;
    return smooth(u / (1.2 / P)) * smooth((0.8 - u) / (0.9 / P));
  };

  return {
    resize: (c) => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(c.W * dpr); canvas.height = Math.round(c.H * dpr);
    },
    draw: (c: Ctx) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, c.W, c.H);
      const [ox] = c.map(0, 0), [x1] = c.map(1, 1), s = (x1 - ox) / 1920;
      const lines: Batch = new Map(), dots: Batch = new Map(), green: Batch = new Map();
      type KP = Pt & { l: number };
      const at = (t: Plex["points"][number]): KP | null => {
        const p = point(t, c, PX);
        return p && { ...p, a: p.a * clearOfCopy(c, p.x, p.y), l: groundAt(t, c.f, PX.step) };
      };

      // Bars
      const bar = (p: KP, id: number, base: number) => {
        const life = barLife(id, c.t);
        if (life <= 0 || p.a <= 0 || (c.thread !== null && Math.abs(p.x - c.thread) < 32)) return;
        const breathe = c.t ? 0.75 + 0.25 * Math.sin(2 * Math.PI * (c.t * (0.08 + 0.12 * rand(id, 33)) + rand(id, 34))) : 1;
        let h = s * base * (0.7 + 0.8 * (1 - p.l)) * breathe * life;
        // a tall bar stops short of the headline
        while (h > 4 && clearOfCopy(c, p.x, p.y - h) < 0.5) h *= 0.85;
        const top = p.y - h;
        const ln = ink.inked(lines, p.l, 0.9 * p.a, 0.9);
        if (!ln) return;
        if (rand(id, 35) < 0.25) {
          // a column of dots, 5 px apart, the rising data of the boardroom's falling columns
          const d = ink.inked(dots, p.l, 0.9 * p.a, 0);
          for (let y = p.y - 4 * s; y > top && d; y -= 5 * s) d.rect(p.x - 0.8, y - 0.8, 1.6, 1.6);
        } else {
          ln.moveTo(p.x, p.y); ln.lineTo(p.x, top);
        }
        ln.moveTo(p.x - 3 * s, p.y); ln.lineTo(p.x + 3 * s, p.y);
        const tip = ink.inked(dots, p.l, p.a * life, 0);
        if (tip) { tip.moveTo(p.x + 1.8, top); tip.arc(p.x, top, 1.8, 0, Math.PI * 2); }
      };
      BARS.forEach(({ t, id }) => { const p = at(t); if (p) bar(p, id, 30 + 90 * rand(id, 36)); });
      const K = keys.map((t) => at(t));
      K.forEach((p, i) => {
        if (!p || i === you) return;
        bar(p, 900 + i, 120 + 40 * rand(i, 37));
        const cr = ink.inked(lines, p.l, 0.9 * p.a, 1);
        if (cr) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { cr.moveTo(p.x + dx * 3, p.y + dy * 3); cr.lineTo(p.x + dx * 8, p.y + dy * 8); }
      });

      // Rings around yours, laid flat on the land (an ellipse a third as tall as it is wide)
      const y = K[you];
      if (y) {
        const turn = (c.t * 6 + c.f * 0.5) * (Math.PI / 180), flat = 0.34;
        const ell = (p: Path2D, r: number, a0: number, a1: number) => p.ellipse(y.x, y.y, r, r * flat, 0, a0, a1);
        const r1 = 40 * s, r2 = 62 * s, r3 = 88 * s;
        const fine = ink.inked(lines, y.l, 0.7 * y.a, 0.75);
        if (fine) { fine.moveTo(y.x + r1, y.y); ell(fine, r1, 0, Math.PI * 2); }
        // data blocks: 40 slots, each filled or not, of its own length, turning one way
        const blocks = ink.inked(lines, y.l, 0.9 * y.a, 2.4);
        if (blocks) for (let k = 0; k < 40; k++) {
          if (rand(k, 40) < 0.3) continue;
          const a0 = turn + (k / 40) * Math.PI * 2, a1 = a0 + (Math.PI * 2 / 40) * (0.25 + 0.6 * rand(k, 41));
          blocks.moveTo(y.x + Math.cos(a0) * r2, y.y + Math.sin(a0) * r2 * flat); ell(blocks, r2, a0, a1);
        }
        // ticks: every 6 degrees, longer every 30, turning the other way
        const ticks = ink.inked(lines, y.l, 0.6 * y.a, 0.75);
        if (ticks) for (let k = 0; k < 60; k++) {
          const a = -turn * 0.6 + (k / 60) * Math.PI * 2, r0 = r3, rr = k % 5 === 0 ? r3 + 8 * s : r3 + 4 * s;
          ticks.moveTo(y.x + Math.cos(a) * r0, y.y + Math.sin(a) * r0 * flat); ticks.lineTo(y.x + Math.cos(a) * rr, y.y + Math.sin(a) * rr * flat);
        }
        // your node: a green crosshair and ring
        const gp = ink.add(green, GREEN, y.a, 1.25);
        if (gp) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { gp.moveTo(y.x + dx * 3, y.y + dy * 3); gp.lineTo(y.x + dx * 8, y.y + dy * 8); }
          gp.moveTo(y.x + 12, y.y); gp.arc(y.x, y.y, 12, 0, Math.PI * 2);
        }

        // Arcs: two in flight, each on a 9 s cycle (half a cycle apart), to a destination that changes every cycle:
        // the other key nodes, or a far tracked point on the right of the picture
        // (each cycle's destination is fixed when it starts; a cycle whose node is hidden or too close is skipped)
        const others = keys.map((_, i) => i).filter((i) => i !== you);
        if (c.t && others.length) for (let n = 0; n < 2; n++) {
          const P = 9, cyc = Math.floor(c.t / P + n * 0.5), u = (c.t / P + n * 0.5) % 1;
          const d = K[others[Math.floor(rand(cyc, 50 + n) * others.length)]];
          if (!d || d.a < 0.5) continue;
          const dist = Math.hypot(d.x - y.x, d.y - y.y);
          if (dist < 60 * s) continue;
          // the arc as a quadratic curve lifted above the higher of its two ends, so it rises and falls rather than
          // hanging from your node like a hook
          const cx = (y.x + d.x) / 2, cy = Math.min(y.y, d.y) - dist * 0.3;
          const pt = (v: number) => [(1 - v) * (1 - v) * y.x + 2 * (1 - v) * v * cx + v * v * d.x, (1 - v) * (1 - v) * y.y + 2 * (1 - v) * v * cy + v * v * d.y];
          // draws on over the first quarter, holds to 60%, its tail follows in by 85%, gone after
          const head = smooth(u / 0.25), tail = smooth((u - 0.6) / 0.25);
          if (tail >= 1) continue;
          const arc = ink.add(green, GREEN, 0.9 * Math.min(y.a, d.a) * clearOfCopy(c, cx, (cy + Math.min(y.y, d.y)) / 2), 1.25);
          if (arc) {
            const N = 40, a = Math.floor(tail * N), b = Math.ceil(head * N);
            const p0 = pt(tail); arc.moveTo(p0[0], p0[1]);
            for (let k = a + 1; k < b; k++) { const q = pt(k / N); arc.lineTo(q[0], q[1]); }
            const p1 = pt(head); arc.lineTo(p1[0], p1[1]);
          }
          // the landing: a ring opens on the destination as the arc arrives, and fades
          const land = clamp((u - 0.25) / 0.3);
          if (land > 0 && land < 1) {
            const ring = ink.add(green, GREEN, 0.8 * (1 - smooth(land)) * d.a, 1);
            if (ring) { const r = (8 + 22 * smooth(land)) * s * 1.4; ring.moveTo(d.x + r, d.y); ring.arc(d.x, d.y, r, 0, Math.PI * 2); }
          }
        }
      }

      ink.flush(lines);
      ink.flush(dots, true);
      ink.flush(green);
    },
  };
}
