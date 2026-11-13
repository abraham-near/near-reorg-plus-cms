"use client";

import { useHeroTx, track, ease } from "./common";

// E · Halftone (D109): the film turns to print. A hard front sweeps down the screen and everything above it becomes a halftone of ink dots on
// paper, sampled live from the frame on screen (so the camera keeps moving inside the dots); then a second front of paper wipes the dots
// away, top first, and the paper is left for the intro. The dots rhyme with the plexus. After ordered-dither / halftone dissolves (Codrops, "Building a Real-Time Dithering
// Shader", 2025), done on a 2D canvas: one sample per cell, one dot per cell, its area the cell's darkness.
const CELL = 9;   /* px between dot centres */

export function TxHalftone({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage, W, H }) => {
    const media = stage.querySelector<HTMLElement>(".hero6__media");
    const video = media?.querySelector<HTMLVideoElement>("video");
    const img = media?.querySelector<HTMLImageElement>("img");
    if (!media || !img) return;
    const canvas = document.createElement("canvas");
    canvas.className = "tx-overlay txd";
    canvas.setAttribute("aria-hidden", "true");
    stage.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const sample = document.createElement("canvas");
    const sctx = sample.getContext("2d", { willReadFrequently: true })!;
    const css = getComputedStyle(stage);
    const INK = css.getPropertyValue("--color-ink").trim() || "#262626";
    const PAPER = css.getPropertyValue("--paper").trim() || "#f4f4f4";

    let w = 0, h = 0, cols = 0, rows = 0, dpr = 1;
    const layout = () => {
      w = W(); h = H(); dpr = 1;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      sample.width = cols; sample.height = rows;
    };
    layout();

    const p = { front: 0, gone: 0 };
    let lastKey = "";
    // the picture on screen, cropped as object-fit: cover at its object-position, scaled down to one pixel per cell
    const grab = () => {
      const src: HTMLVideoElement | HTMLImageElement = video && video.hasAttribute("data-ready") && video.readyState >= 2 ? video : img;
      const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth, sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
      if (!sw || !sh) return null;
      const [px, py] = getComputedStyle(src).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const s = Math.max(w / sw, h / sh), vw = w / s, vh = h / s;
      sctx.drawImage(src, (sw - vw) * px, (sh - vh) * (py ?? 0.5), vw, vh, 0, 0, cols, rows);
      return sctx.getImageData(0, 0, cols, rows).data;
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const t = video?.currentTime ?? 0;
      const key = `${p.front.toFixed(4)}|${p.gone.toFixed(4)}|${t.toFixed(3)}|${w}|${h}`;
      if (key === lastKey) return;
      lastKey = key;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (p.front <= 0) return;
      const front = Math.ceil((h * ease.io1(p.front)) / CELL) * CELL;   /* on a row edge */
      const wipe = h * ease.io1(p.gone);
      const data = grab();
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, front);
      if (!data) return;
      ctx.fillStyle = INK;
      ctx.beginPath();
      const R = CELL * 0.5;
      for (let r = 0; r < rows; r++) {
        const y = r * CELL + CELL / 2;
        if (y > front) break;
        // a second front of paper wipes the dots away from the top down
        if (y < wipe) continue;
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          const dark = Math.pow(1 - lum, 1.6);
          if (dark < 0.06) continue;   /* light cells stay paper */
          const rad = R * Math.sqrt(dark);
          if (rad < 0.35) continue;
          const x = c * CELL + CELL / 2;
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };
    let raf = requestAnimationFrame(draw);

    const offs = [
      track(hero, "top -80%", "top -118%", (v) => { p.front = v; }),
      track(hero, "top -112%", `top -${end}%`, (v) => { p.gone = v; }),
    ];
    const ro = new ResizeObserver(() => { layout(); lastKey = ""; });
    ro.observe(stage);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); offs.forEach((f) => f()); canvas.remove(); };
  });
  return <span ref={ref} hidden />;
}
