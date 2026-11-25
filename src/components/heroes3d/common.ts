// What the three hero studies (/hero-a, /hero-b, /hero-c) share: the renderer and its loop (it runs only while the hero is on screen), the pointer and the
// scroll as smoothed numbers, the framing (the subject sits right of the headline on wide screens, under it on tall ones), the NEAR mark as a shape, and
// a few soft textures drawn once on a canvas. Each scene (./scene-a|b|c.ts) mounts on the hero's canvas and is told each word of the cycle (step).
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Scene = { step(i: number, last: number): void; dispose(): void };
/** track: the pinned hero's tall wrapper (D, E, F): the scroll through it drives the scene's hand-off to the Stack */
export type Mount = (canvas: HTMLCanvasElement, section: HTMLElement, track?: HTMLElement) => Scene;

export const GREEN = "#00dc8d";
export const PAPER = "#f5f5f5";
export const INK = "#262626";                                        /* the Stack band's colour (--color-ink): where the pinned heroes end */
export const STACK = { t: "#5fe0ae", l: "#3cc994", r: "#22a374" };   /* the Stack drawing's pillar faces (--stack-protocol-t|l|r) */
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - clamp(t), 3),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t))),
  inOutCubic: (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  outBack: (t: number, s = 1.25) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; },
};
/** a value that follows its target, frame-rate independent (k: how much of the gap closes per second, roughly) */
export const damp = (v: number, to: number, k: number, dt: number) => v + (to - v) * (1 - Math.exp(-k * dt));
/** a repeatable pseudo-random number for an integer */
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** the NEAR mark (the header's N, 90 × 90) as an extruded solid, centred, about `size` tall, standing in the XY plane, `depth` thick along Z */
const N_PATH = "M72.2 4.6L53.4 32.5c-1.3 1.9 1.2 4.2 3 2.6L74.9 19c.5-.4 1.2-.1 1.2.6v50.3c0 .7-.9 1-1.3.5l-56-67C17 1.2 14.4 0 11.5 0h-2C4.3 0 0 4.3 0 9.6v70.8C0 85.7 4.3 90 9.6 90c3.3 0 6.4-1.7 8.2-4.6l18.8-27.9c1.3-1.9-1.2-4.2-3-2.6L15.1 71c-.5.4-1.2.1-1.2-.6V20.1c0-.7.9-1 1.3-.5l56 67c1.8 2.2 4.5 3.4 7.3 3.4h2c5.3 0 9.6-4.3 9.6-9.6V9.6c0-5.3-4.3-9.6-9.6-9.6-3.4 0-6.5 1.7-8.3 4.6z";
export function nMark(size: number, depth: number, bevel = 0.04): THREE.ExtrudeGeometry {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90"><path d="${N_PATH}"/></svg>`);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const k = size / 90, b = bevel * size;
  const g = new THREE.ExtrudeGeometry(shapes, { depth: depth / k, bevelEnabled: bevel > 0, bevelThickness: b / k, bevelSize: b / k, bevelSegments: 3, curveSegments: 24 });
  g.scale(k, -k, k);   // SVG's y runs down
  g.center();
  g.computeVertexNormals();
  return g;
}

/** the NEAR mark's outline as points (same frame as nMark: centred, about `size` tall, in the XY plane), evenly spaced, closed */
export function nOutline(size: number, n = 600): THREE.Vector3[] {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90"><path d="${N_PATH}"/></svg>`);
  const shape = data.paths.flatMap((p) => SVGLoader.createShapes(p))[0];
  const k = size / 90;
  return shape.getSpacedPoints(n).map((v) => new THREE.Vector3((v.x - 45) * k, -(v.y - 45) * k, 0));
}

/** soft textures drawn on a canvas once: a round glow, a tall capsule glow (a lit tube's halo), a vertical streak (its reflection on a wet floor) */
export function glow(kind: "round" | "capsule" | "streak", size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = size; c.height = kind === "round" ? size : size * 2;
  const x = c.getContext("2d")!, w = c.width, h = c.height;
  if (kind === "round") {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.45)"); g.addColorStop(0.6, "rgba(255,255,255,.1)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  } else {
    // a horizontal falloff times a vertical one: bright along the middle line, soft at both ends (the streak fades away from its top)
    const img = x.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      const v = j / (h - 1);
      const vy = kind === "capsule" ? Math.pow(Math.sin(Math.PI * v), 0.6) : Math.pow(1 - v, 1.6);
      for (let i = 0; i < w; i++) {
        const u = Math.abs(i / (w - 1) - 0.5) * 2;
        const hx = Math.exp(-u * u * (kind === "capsule" ? 9 : 22)) * 0.9 + Math.exp(-u * u * 220) * 0.6;
        const a = Math.min(1, hx * vy);
        const o = (j * w + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = a * 255;
      }
    }
    x.putImageData(img, 0, 0);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** a speckled grey (concrete) or a brushed one (lines along x: steel), as a colour or roughness map */
export function surface(kind: "concrete" | "brushed", size = 512): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d")!;
  const img = x.createImageData(size, size);
  for (let j = 0; j < size; j++) {
    const row = kind === "brushed" ? (hash(j * 3.1) - 0.5) * 70 : 0;
    for (let i = 0; i < size; i++) {
      const n = kind === "brushed" ? 150 + row + (hash(i * 0.37 + j * 911.3) - 0.5) * 24 : 160 + (hash(i * 13.7 + j * 71.3) - 0.5) * 34 + (hash((i >> 3) * 5.1 + (j >> 3) * 17.9) - 0.5) * 26;
      const o = (j * size + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = n; img.data[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  if (kind === "concrete") {   // a few pores
    for (let k = 0; k < 260; k++) { x.fillStyle = `rgba(40,40,40,${0.25 + hash(k) * 0.4})`; x.beginPath(); x.arc(hash(k * 2.3) * size, hash(k * 7.1) * size, 0.6 + hash(k * 3.3) * 1.6, 0, 7); x.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/** a studio's soft reflections for metal and glass, from three's RoomEnvironment */
export function studio(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return env;
}

export type Frame = { t: number; dt: number; px: number; py: number; p: number; w: number; h: number; wide: boolean };

/**
 * The renderer and its loop. `frame` is called each animation frame while the hero is on screen (paused off screen and in a hidden tab), with the time,
 * the pointer (-1…1, smoothed), the hero's scroll (0 at rest, 1 once it has scrolled out) and the size. With reduced motion the pointer stays still and
 * the time runs as usual (each scene settles at once instead of playing its intro).
 */
export function stage(canvas: HTMLCanvasElement, section: HTMLElement,
  opts: { clear: string; tone?: THREE.ToneMapping; exposure?: number; shadows?: boolean; track?: HTMLElement; dpr?: number },
  camera: THREE.Camera, onResize: (w: number, h: number, wide: boolean) => void, frame: (f: Frame) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, opts.dpr ?? 1.75));
  renderer.setClearColor(opts.clear, 1);
  renderer.toneMapping = opts.tone ?? THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1;
  if (opts.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  const rm = reduced();
  const f: Frame = { t: 0, dt: 0, px: 0, py: 0, p: 0, w: 1, h: 1, wide: true };
  let tx = 0, ty = 0;
  const move = (e: PointerEvent) => { if (rm || e.pointerType === "touch") return; tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; };
  addEventListener("pointermove", move, { passive: true });

  const size = () => {
    const w = Math.max(1, section.clientWidth), h = Math.max(1, section.clientHeight);
    f.w = w; f.h = h; f.wide = w / h > 1.05;
    renderer.setSize(w, h, false);
    onResize(w, h, f.wide);
  };
  const ro = new ResizeObserver(size); ro.observe(section); size();

  let raf = 0, last = 0, seen = true, scene: THREE.Scene | null = null, draw: (() => void) | null = null, lastX = -1;
  const track = opts.track;
  const tick = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    f.dt = dt; f.t += dt;
    f.px = damp(f.px, tx, 3, dt); f.py = damp(f.py, ty, 3, dt);
    if (track) {
      // pinned: 0 at rest, 1 once the pin's stretch has scrolled by (the hero is about to leave), smoothed; the copy and the veil follow it (--x)
      const r = track.getBoundingClientRect();
      const to = clamp(-r.top / Math.max(1, r.height - innerHeight));
      f.p = dt ? damp(f.p, to, 7, dt) : to;
      if (Math.abs(to - f.p) < 0.0005) f.p = to;
      if (Math.abs(f.p - lastX) > 0.0004) { lastX = f.p; track.style.setProperty("--x", f.p.toFixed(4)); }
    } else {
      const r = section.getBoundingClientRect();
      f.p = clamp(-r.top / Math.max(1, r.height));
    }
    frame(f);
    if (draw) draw(); else if (scene) renderer.render(scene, camera);
    if (seen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0 });
  io.observe(section);
  const vis = () => go();
  document.addEventListener("visibilitychange", vis);

  return {
    renderer, f,
    /** starts the loop on this scene (drawn by `d`, a composer, when given) */
    run(s: THREE.Scene, d?: () => void) { scene = s; draw = d ?? null; go(); },
    dispose() {
      cancelAnimationFrame(raf); raf = 0; scene = null; draw = null;
      io.disconnect(); ro.disconnect();
      removeEventListener("pointermove", move); document.removeEventListener("visibilitychange", vis);
      renderer.dispose();
    },
  };
}

/** the framing: on wide screens the picture's centre moves right of the headline (a share of the width); on tall screens, down under it */
export function frameView(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, w: number, h: number, wide: boolean, shift: number, drop = 0.2) {
  if (wide) camera.setViewOffset(w, h, -w * shift, 0, w, h);
  else camera.setViewOffset(w, h, 0, -h * drop, w, h);
}

/** frees every geometry, material and texture under an object */
export function free(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      mat.dispose();
    }
  });
}
