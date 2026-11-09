"use client";

import { useEffect, useRef } from "react";
import styles from "./DuneLayer.module.css";
import { scene, type Item, type Tone } from "./scene";
import { at, type Warp } from "./warp";
import { STOPS, TOKEN, VH, VW, paint, pathD, r1, runAt, toFrame0 } from "./ink";

// Dune (D90): the static concept's layer (cinematic/layers/Dune.tsx) tracked to the camera move. The camera move is
// the video's frame on screen, so it only moves with the reader's scroll; on top of that a little idle life runs on the
// clock (D44: alive, not lit; scene.ts), paused off screen and absent with reduced motion.
// - The still (reduced motion, no JS, and the first paint everywhere) is an SVG of frame 0, rendered on the server, in
//   a box with the picture's aspect and its cover crop (ChapterOne's --hero-fx/--hero-fy).
// - With motion allowed: a canvas draws the display list each frame. On the desktop camera move it is the frame on
//   screen, carried by the measured warp (track.json, loaded only there), clear of the headline as it scrolls up and of
//   the floating nav bar; elsewhere (the photo band) it is frame 0 with the idle life.
const FPS = 24;
type Track = Warp & { sun: number[] };

const STILL: Item[] = scene({ T: toFrame0, t: 0, q: 0, sun: 0, amb: 0, fade: () => 1 });

function Still() {
  return (
    <svg className={styles.svg} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
      {STILL.map((it, i) => {
        if (it.k === "d") return <circle key={i} cx={r1(it.x)} cy={r1(it.y)} r={r1(it.r)} style={{ fill: `var(${TOKEN[it.tone]})`, fillOpacity: r1(it.a * 100) / 100 }} />;
        const n = it.p.length, base = { fill: "none", strokeWidth: it.w ?? 0.75, strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: it.dash?.join(" ") } as const;
        if (it.dip === undefined) return <path key={i} d={pathD(it.p)} vectorEffect="non-scaling-stroke" style={{ ...base, stroke: `var(${TOKEN[it.tone]})`, strokeOpacity: r1(it.a * 100) / 100 }} />;
        const id = `dune-run-${i}`;
        return (
          <g key={i}>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={r1(it.p[0])} y1={r1(it.p[1])} x2={r1(it.p[n - 2])} y2={r1(it.p[n - 1])}>
              {STOPS.map((t) => <stop key={t} offset={t} style={{ stopColor: `var(${TOKEN[it.tone]})`, stopOpacity: r1(it.a * runAt(it.dip!, t) * 100) / 100 }} />)}
            </linearGradient>
            <path d={pathD(it.p)} vectorEffect="non-scaling-stroke" style={{ ...base, stroke: `url(#${id})` }} />
          </g>
        );
      })}
    </svg>
  );
}

const smooth = (v: number) => { const t = Math.min(1, Math.max(0, v)); return t * t * (3 - 2 * t); };

export function DuneLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    const media = host?.closest<HTMLElement>("[data-ch='media']");
    if (!host || !media) return;
    const video = media.querySelector<HTMLVideoElement>("[data-ch='video']");
    const img = media.querySelector<HTMLImageElement>("img");
    const copyEl = host.closest("[data-ch='root']")?.querySelector<HTMLElement>("[data-ch='copy']") ?? null;
    const motion = window.matchMedia("(min-width: 1280px) and (prefers-reduced-motion: no-preference)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = document.querySelector<HTMLElement>("header");
    const playing = () => !!video?.hasAttribute("data-ready");

    let canvas: HTMLCanvasElement | null = null, g: CanvasRenderingContext2D | null = null;
    let data: Track | null = null, dead = false, loading = false;
    let rgb: Record<Tone, [number, number, number]> | null = null;
    const readTokens = () => {
      const css = getComputedStyle(document.documentElement);
      const parse = (v: string): [number, number, number] => {
        v = v.trim();
        if (v.startsWith("#")) { const h = v.length === 4 ? v.slice(1).replace(/(\w)/g, "$1$1") : v.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]; }
        return (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number) as [number, number, number];
      };
      rgb = { ink: parse(css.getPropertyValue(TOKEN.ink)), deep: parse(css.getPropertyValue(TOKEN.deep)), green: parse(css.getPropertyValue(TOKEN.green)) };
    };

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

    // The headline's text, as a box relative to its block (measured once per size), moved with the block as it scrolls
    let tight: [number, number, number, number] | null = null, tightKey = "";
    const textBox = (el: HTMLElement, a: DOMRect): [number, number, number, number] | null => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const grow = (q: DOMRect) => { l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); };
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), range = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) grow(q);
      }
      el.querySelectorAll("a, button").forEach((q) => grow(q.getBoundingClientRect()));
      return r > l ? [l - a.left, t - a.top, r - l, b - t] : null;
    };

    let W = 0, H = 0, dpr = 1, key = "", raf = 0, inView = true, crop = "", pos = [0.3, 0.5], navFoot = 0;
    // The idle clock: runs while the hero is on screen and the tab is visible (rAF pauses with the tab)
    let amb = 0, last = 0, drawn = 0;
    const update = () => {
      if (!canvas || !g) return;
      const w = host.clientWidth, h = host.clientHeight;
      if (w !== W || h !== H || dpr !== Math.min(2, window.devicePixelRatio || 1)) {
        W = w; H = h; dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); key = ""; tightKey = "";
      }
      // The same crop as the picture under it: object-fit cover at its object-position
      const el = (playing() ? video : img) as HTMLElement | null, cid = `${W}|${H}|${playing()}`;
      if (cid !== crop && el) {
        crop = cid;
        // object-position may come back as a calc() of --hero-fx/--hero-fy; read the numbers either way
        const cs = getComputedStyle(el), op = cs.objectPosition.split(" ").map((v) => parseFloat(v.replace(/^calc\(/, "")) / 100);
        const fx = parseFloat(cs.getPropertyValue("--hero-fx")), fy = parseFloat(cs.getPropertyValue("--hero-fy"));
        pos = [Number.isFinite(op[0]) ? op[0] : Number.isFinite(fx) ? fx : 0.3, Number.isFinite(op[1]) ? op[1] : Number.isFinite(fy) ? fy : 0.5];
        // the floating nav bar's foot, in this layer's coordinates (the layer is pinned under it on the desktop)
        navFoot = nav && motion.matches ? Math.max(0, nav.getBoundingClientRect().bottom - host.getBoundingClientRect().top) : 0;
      }
      const s = Math.max(W / VW, H / VH), ox = (W - VW * s) * pos[0], oy = (H - VH * s) * (pos[1] ?? 0.5);
      const f = data && motion.matches ? Math.min(frameNow(), data.frames - 1) : 0;
      let box: [number, number, number, number] | null = null;
      if (copyEl && copyEl.offsetParent) {
        const a = copyEl.getBoundingClientRect(), b = host.getBoundingClientRect();
        if (tightKey !== `${W}|${H}`) { tightKey = `${W}|${H}`; tight = textBox(copyEl, a); }
        if (tight && a.bottom > b.top && a.top < b.bottom) box = [a.left + tight[0] - b.left, a.top + tight[1] - b.top, tight[2], tight[3]];
      }
      const k = `${f.toFixed(2)}|${W}|${H}|${dpr}|${box ? box.map((v) => v.toFixed(0)).join() : ""}|${!!data}|${pos.join()}`;
      // idle-only changes redraw at 30 fps; a scroll frame or a size change draws at once
      const now = performance.now();
      if (k === key && now - drawn < 33) return;
      key = k; drawn = now;
      // Clear of the headline (D49, D66): nothing within 6 px of its text, a long soft feather beyond (ease-out)
      // and clear of the nav bar (the marks under it fade out over 48 px below its foot) and the frame's right edge
      const fade = (x: number, y: number) => {
        const sx = ox + x * s, sy = oy + y * s;
        const edge = smooth((sy - navFoot - 6) / 48) * smooth((W - sx) / 36);
        if (!box) return edge;
        const [cx, cy, cw, ch] = box;
        const dx = Math.max(cx - 6 - sx, 0, sx - (cx + cw + 6)), dy = Math.max(cy - 6 - sy, 0, sy - (cy + ch + 6));
        const t = Math.min(1, Math.hypot(dx, dy) / 200);
        return edge * t * (2 - t);
      };
      if (!still.matches && inView) { if (last) amb += Math.min(now - last, 100) / 1000; last = now; } else last = 0;
      const wf = at(data, f);
      const sun = data ? sunAt(data, f) : 0;
      const t = data ? f / (data.frames - 1) : 0;
      const items = scene({ T: (p) => wf(toFrame0(p)), t, q: smooth(t), sun, amb: still.matches ? 0 : amb + 1e-3, fade });
      if (!rgb) readTokens();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      paint(g, items, s, ox, oy, rgb!);
    };

    const tick = () => { raf = requestAnimationFrame(tick); if (inView) update(); else last = 0; };
    const start = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (still.matches) {
        // Reduced motion: the server's SVG of frame 0 carries it, so the canvas goes
        canvas?.remove(); canvas = null; g = null; host.removeAttribute("data-live");
        return;
      }
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = styles.canvas;
        host.appendChild(canvas);
        g = canvas.getContext("2d");
        W = 0; key = ""; crop = "";
      }
      if (motion.matches && !data && !loading) {
        loading = true;
        import("./track.json").then((m) => { if (!dead) { data = m.default as Track; key = ""; update(); } });
      }
      crop = ""; key = "";
      update();
      host.setAttribute("data-live", "");
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(media);
    motion.addEventListener("change", start);
    still.addEventListener("change", start);
    start();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (video && hasVFC && vfc) video.cancelVideoFrameCallback(vfc);
      io.disconnect();
      motion.removeEventListener("change", start);
      still.removeEventListener("change", start);
      canvas?.remove();
      host.removeAttribute("data-live");
    };
  }, []);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      <div className={styles.box}><Still /></div>
    </div>
  );
}

// The light's reading at frame f (0-1, measured from the footage), between samples
function sunAt(d: Track, f: number) {
  const k = Math.min(Math.max(f / d.step, 0), d.sun.length - 1), i = Math.min(Math.floor(k), d.sun.length - 2);
  return d.sun[i] + (d.sun[i + 1] - d.sun[i]) * (k - i);
}
