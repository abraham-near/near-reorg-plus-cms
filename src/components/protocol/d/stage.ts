// Protocol D · the canvas stage every drawing on the page runs on: sizes the canvas to its box at the screen's density (≤ 2×), runs a frame loop only
// while the canvas is near the view and the tab is visible, and stops for good on destroy. With reduced motion it never loops: it paints one finished
// frame (at `still` seconds) and repaints it on resize.
export type Frame = (c: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void;

export type Stage = { redraw: () => void; destroy: () => void; readonly w: number; readonly h: number };

export function stage(canvas: HTMLCanvasElement, frame: Frame, { reduced, still = 8, margin = "15% 0px" }: { reduced: boolean; still?: number; margin?: string }): Stage {
  const c = canvas.getContext("2d");
  let w = 0, h = 0, raf = 0, on = false, near = false, dead = false, t = reduced ? still : 0, last = 0;
  const paint = (dt: number) => {
    if (!c || !w || !h) return;
    c.clearRect(0, 0, w, h);
    frame(c, w, h, t, dt);
  };
  const size = () => {
    if (!c) return;
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
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

/** the page's faces for canvas text: Montreal Mono for the small labels, Montreal for the rest (read once from the CSS variables) */
export function faces(el: Element) {
  const cs = getComputedStyle(el);
  const mono = cs.getPropertyValue("--font-montreal-mono").trim() || "ui-monospace, monospace";
  const sans = cs.getPropertyValue("--font-montreal").trim() || "system-ui, sans-serif";
  return { mono, sans };
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
