import type { Item, Tone } from "./scene";
import type { P } from "./warp";
import DESIGN from "./design.json";

// Still px -> the video's first frame (1920 x 1080): Seedance re-frames the 2688 x 1520 still to 16:9 (a hair closer
// and squeezed); fitted by assets/generated/2026-11-05_hero-dune/register.py (SIFT + RANSAC, refined by ECC on the
// light-normalised texture). [a, b, tx; c, d, ty]
export const A0 = DESIGN.A;
export const toFrame0 = (p: readonly [number, number]): P => [A0[0][0] * p[0] + A0[0][1] * p[1] + A0[0][2], A0[1][0] * p[0] + A0[1][1] * p[1] + A0[1][2]];
export const VW = 1920, VH = 1080;

// The D59 curve: a run is full at its ends and `dip` in the middle, sampled at seven stops
export const STOPS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1];
export const runAt = (dip: number, t: number) => dip + (1 - dip) * Math.pow(Math.abs(2 * t - 1), 1.2);

export const TOKEN: Record<Tone, string> = { ink: "--color-ink", deep: "--color-green-text", green: "--color-green" };

// One canvas frame: the display list in video px, drawn through the picture's cover crop (s, ox, oy). Hairlines keep
// 0.75 CSS px at any scale; token colours read once (rgb strings)
export function paint(g: CanvasRenderingContext2D, items: Item[], s: number, ox: number, oy: number, rgb: Record<Tone, [number, number, number]>) {
  const col = (t: Tone, a: number) => `rgba(${rgb[t][0]},${rgb[t][1]},${rgb[t][2]},${Math.min(1, Math.max(0, a)).toFixed(3)})`;
  g.lineCap = "round"; g.lineJoin = "round";
  for (const it of items) {
    if (it.k === "d") {
      g.fillStyle = col(it.tone, it.a);
      g.beginPath(); g.arc(ox + it.x * s, oy + it.y * s, Math.max(0.6, it.r * s), 0, 2 * Math.PI); g.fill();
      continue;
    }
    const p = it.p;
    g.beginPath();
    g.moveTo(ox + p[0] * s, oy + p[1] * s);
    for (let i = 2; i < p.length; i += 2) g.lineTo(ox + p[i] * s, oy + p[i + 1] * s);
    g.lineWidth = it.w ?? 0.75;
    g.setLineDash(it.dash ?? []);
    if (it.dip !== undefined) {
      const n = p.length;
      const gr = g.createLinearGradient(ox + p[0] * s, oy + p[1] * s, ox + p[n - 2] * s, oy + p[n - 1] * s);
      for (const t of STOPS) gr.addColorStop(t, col(it.tone, it.a * runAt(it.dip, t)));
      g.strokeStyle = gr;
    } else g.strokeStyle = col(it.tone, it.a);
    g.stroke();
  }
  g.setLineDash([]);
}

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const pathD = (p: number[]) => {
  let d = "";
  for (let i = 0; i < p.length; i += 2) d += `${i ? "L" : "M"}${r1(p[i])} ${r1(p[i + 1])}`;
  return d;
};
