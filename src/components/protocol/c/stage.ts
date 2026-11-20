// Protocol C · the canvas stage every drawing on the page runs on (B's, without text faces: C's drawings carry no words). It sizes the canvas to its
// box at the screen's density (≤ 2×), runs a frame loop only while the canvas is near the view and the tab is visible, and stops for good on destroy.
// With reduced motion it never loops: it paints one finished frame (at `still` seconds) and repaints it on resize.
export type Frame = (c: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void;

export type Stage = { redraw: () => void; destroy: () => void; readonly w: number; readonly h: number };

export function stage(canvas: HTMLCanvasElement, frame: Frame, { reduced, still = 8, margin = "15% 0px" }: { reduced: boolean; still?: number; margin?: string }): Stage {
  const c = canvas.getContext("2d");
  let w = 0, h = 0, raf = 0, on = false, near = false, dead = false, t = reduced ? still : 0, last = 0;
  const paint = (dt: number) => {
    if (!c || !w || !h) return;
    c.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    c.clearRect(0, 0, w, h);
    frame(c, w, h, t, dt);
  };
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const size = () => {
    if (!c) return;
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr())); canvas.height = Math.max(1, Math.round(h * dpr()));
  };
  const loop = (now: number) => {
    if (!on) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;   // a long pause (a hidden tab, a jank) never jumps the scene
    last = now; t += dt; paint(dt);
  };
  const start = () => { if (on || dead || reduced) return; on = true; last = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { on = false; cancelAnimationFrame(raf); };
  const sync = () => (near && !document.hidden ? start() : stop());

  const ro = new ResizeObserver(() => { size(); if (!on) paint(0); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; sync(); }, { rootMargin: margin });
  io.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  size(); paint(0);

  return {
    redraw: () => { if (!on) paint(0); },
    destroy: () => { dead = true; stop(); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", sync); },
    get w() { return w; }, get h() { return h; },
  };
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (v: number) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** a stable pseudo-random number in [0, 1) for a few integers (the scenes are functions of time: the same moment always draws the same) */
export function hash(a: number, b: number, c = 0) {
  let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1103515245);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** the site's colours as "r,g,b" (tokens.css / proof-deeper.css): ink, paper, the emerald, and the deep green for green on paper */
export const INK = "38,38,38", PAPER = "245,244,241", GREEN = "0,220,141", DEEP = "0,119,79";
export const rgba = (rgb: string, a: number) => `rgba(${rgb},${clamp01(a).toFixed(3)})`;

/** a drawing laid out in its own design space (dw × dh), scaled to fit the canvas and centred; returns the scale (for hairlines: 1 / s) */
export function fit(c: CanvasRenderingContext2D, w: number, h: number, dw: number, dh: number) {
  const s = Math.min(w / dw, h / dh);
  c.translate((w - dw * s) / 2, (h - dh * s) / 2);
  c.scale(s, s);
  return s;
}

/** a rounded rectangle path */
export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k);
  c.closePath();
}
