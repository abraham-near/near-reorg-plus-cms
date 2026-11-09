/* r17 v1 · the "problem" illustration (Figma 459:527, public/v1/vig2/problem.svg, regrouped with .pb-* hooks) behind the vignette contract (./index.ts).
 * Drawn strokes (.pb-al/.pb-ul/.pb-tl/.pb-ring) carry pathLength=1; set() dashes them (1 2) only while they are partly drawn.
 * The story: the layer beneath. A UI plate on top, a green coin under it, three cubes on a floor; the arrows carry what flows from the UI, through the coin,
 * down into the cubes.
 *   arrive a 0 -> 1:  .04-.30 the floor rises 10 px into place, fading in · .10-.48 the dashed guides draw up from the floor (one clip growing upward)
 *                     .16-.56 the cubes drop 22 px onto the floor, back to front · .30-.62 the top plate comes down 40 px · .42-.66 the coin comes down 26 px
 *                     .50-.76 the plate's UI slides in along the card's axis, its lines drawing · .56-.70 the coin's inner ring draws
 *                     .60-.74 the upper arrow draws out from under the plate, its head lands .70-.77 · .66-.84 the green wipes across the coin
 *                     .74-.86 the lower arrow draws from the coin into the middle cube, its head lands .83-.89
 *                     .78-.92 the dark tags pop (scale .9 -> 1 + fade): the UI's first, then the cubes' blocks, their leader lines drawing.
 *   rest  a = 1:      exactly the Figma art (identity transforms, opacity 1, dashes fully drawn, clips fully open).
 *   leave a 1 -> 2:   the flow drains downward: tags fade 1.00-1.12 · the arrows retract into their heads, top first (1.00-1.14, 1.06-1.20), heads sink + fade
 *                     the green wipes back 1.04-1.20 · the plate lifts 30 px + fades 1.10-1.40 · the coin lifts 20 px + fades 1.18-1.46
 *                     the guides retract to the floor 1.22-1.52 · the cubes lift 14 px + fade, front first, 1.30-1.66 · the floor sinks + fades 1.50-1.80.
 *   idle (t, w):      the coin hovers 1 px (2.8 s), the plate breathes 1.2 px (4.6 s, out of phase), a small green bead runs down the upper arrow,
 *                     vanishes into the coin and comes out down the lower arrow into the middle cube (2.9 s of every 4.2 s). Additive; at w = 0 the dom is set(a)'s.
 */
import type { Vignette } from "./index";
import { mountArt, liveTf, q } from "./art";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (a: number, t0: number, t1: number) => cl((a - t0) / (t1 - t0));
const out3 = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const in2 = (t: number) => t * t;
const io2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const TAU = Math.PI * 2;
let UID = 0;

/** a part: translate (+ optional scale about cx, cy) and opacity, each written only on change */
type Part = { node: SVGGraphicsElement; tf: SVGTransform; cx: number; cy: number; x: number; y: number; s: number; o: number };
type Draw = { node: SVGGraphicsElement; d: number; o: number };

export function create(host: HTMLElement): Vignette {
  const uid = ++UID;
  let a = 0, ready = false;
  /* idle offsets (added on top of set's base) */
  let iCoin = 0, iPlate = 0, iPh = -1, iW = 0;
  let N: {
    svg: SVGSVGElement; visible: boolean; MX: DOMMatrix;
    floor: Part; cubes: Part[]; tags: Part[]; tls: Draw[]; gclip: Part; guides: Part; coin: Part; wipe: Part; ring: Draw;
    plate: Part[]; ui: Part[]; uls: Draw[]; uitag: Part; al: Draw[]; ah: Part[]; pulse: Part;
  } | null = null;

  function build(svg: SVGSVGElement) {
    const { $, $$ } = q(svg);
    const part = (node: SVGGraphicsElement, cx = 0, cy = 0): Part => ({ node, tf: liveTf(svg, node), cx, cy, x: NaN, y: NaN, s: NaN, o: NaN });
    const draw = (node: SVGGraphicsElement): Draw => ({ node, d: NaN, o: NaN });
    N = {
      svg, visible: true, MX: svg.createSVGMatrix(),
      floor: part($(".pb-floor")),
      cubes: $$(".pb-cube").map((g) => part(g)),
      tags: [part($(".pb-cubeA .pb-tag"), 342.6, 426.7), part($(".pb-cubeB .pb-tag"), 298, 452.5)],
      tls: $$(".pb-tl").map(draw),
      gclip: part($(".pb-gclip"), 0, 544),
      guides: part($(".pb-guides")),
      coin: part($(".pb-coin")),
      wipe: part($(".pb-wipe")),
      ring: draw($(".pb-ring")),
      plate: $$(".pb-plate").map((g) => part(g)),   /* the right face (painted under the coin and arrows, as in the Figma) + the rest */
      ui: $$(".pb-ui").map((g) => part(g)),
      uls: $$(".pb-ul").map(draw),
      uitag: part($(".pb-uitag"), 437.8, 158.2),
      al: $$(".pb-al").map(draw),            /* [lower arrow line, upper arrow line] (paint order) */
      ah: $$(".pb-ah").map((g) => part(g)),
      pulse: part($(".pb-pulse")),
    };
  }

  const wT = (p: Part, x: number, y: number, s = 1) => {
    if (Math.abs(p.x - x) < 1e-3 && Math.abs(p.y - y) < 1e-3 && Math.abs(p.s - s) < 1e-4) return;
    p.x = x; p.y = y; p.s = s; const M = N!.MX;
    M.a = s; M.b = 0; M.c = 0; M.d = s; M.e = x + p.cx * (1 - s); M.f = y + p.cy * (1 - s); p.tf.setMatrix(M);
  };
  const wSY = (p: Part, sy: number) => {   /* scaleY about (·, cy): the guides' clip */
    if (Math.abs(p.s - sy) < 1e-4) return; p.s = sy; const M = N!.MX;
    M.a = 1; M.b = 0; M.c = 0; M.d = sy; M.e = 0; M.f = p.cy * (1 - sy); p.tf.setMatrix(M);
  };
  const wO = (p: Part | Draw, o: number) => { o = o < 0.001 ? 0 : o > 0.999 ? 1 : o; if (Math.abs(p.o - o) < 1e-3) return; p.o = o; p.node.style.opacity = String(o); };
  /* dashed only while partly drawn: fully drawn, the stroke is the Figma's solid one (a 1-long dash renders a hair differently) */
  const wD = (p: Draw, d: number) => {
    if (Math.abs(p.d - d) < 1e-4) return; p.d = d;
    if (d === 0) { p.node.style.strokeDasharray = ""; p.node.style.strokeDashoffset = ""; return; }
    p.node.style.strokeDasharray = "1 2"; p.node.style.strokeDashoffset = String(d);
  };
  /* a stroke drawn from its start: q 0 -> 1 shows [0, q]; retracting r 0 -> 1 hides [0, r] (dasharray 1 2, pathLength 1) */
  const drawq = (p: Draw, q: number, r: number) => wD(p, r > 0 ? -r : 1 - q);

  function apply() {
    if (!N) return;
    const vis = a > 0.0005 && a < 1.9995;
    if (vis !== N.visible) { N.visible = vis; N.svg.style.visibility = vis ? "" : "hidden"; }
    const A = a <= 1 ? a : 1, L = a > 1 ? a - 1 : 0;   /* arrival playhead, leave playhead (0..1) */

    /* floor */
    { const i = out3(seg(A, 0.04, 0.30)), l = in2(seg(L, 0.50, 0.80));
      wT(N.floor, 0, 10 * (1 - i) + 10 * l); wO(N.floor, seg(A, 0.04, 0.22) * (1 - seg(L, 0.50, 0.80))); }
    /* guides: the clip grows up from the floor (y 544) */
    { const g = io2(seg(A, 0.10, 0.48)) * (1 - io2(seg(L, 0.22, 0.52)));
      wSY(N.gclip, g < 0.0005 ? 0.0005 : g); wO(N.guides, g > 0.001 ? 1 : 0); }
    /* cubes: back to front in, front first out */
    for (let k = 0; k < 3; k++) {
      const i = out3(seg(A, 0.16 + k * 0.06, 0.44 + k * 0.06)), l = seg(L, 0.38 - k * 0.04, 0.66 - k * 0.04);
      wT(N.cubes[k], 0, -22 * (1 - i) - 14 * in2(l)); wO(N.cubes[k], seg(A, 0.16 + k * 0.06, 0.34 + k * 0.06) * (1 - l));
    }
    /* the dark tags: the UI's, then the cubes' blocks (their leader lines draw just before) */
    const tagOut = seg(L, 0.0, 0.12);
    for (let k = 0; k < 2; k++) {
      const t0 = 0.81 + k * 0.03, i = out3(seg(A, t0, t0 + 0.08));
      wT(N.tags[k], 0, 0, 0.9 + 0.1 * i - 0.1 * tagOut); wO(N.tags[k], i * (1 - tagOut));
      drawq(N.tls[k], io2(seg(A, t0 - 0.03, t0 + 0.05)), 0); wO(N.tls[k], 1 - tagOut);
    }
    { const i = out3(seg(A, 0.78, 0.86)); wT(N.uitag, 0, 0, 0.9 + 0.1 * i - 0.1 * tagOut); wO(N.uitag, i * (1 - tagOut)); }
    /* the top plate comes down; lifts away on leave */
    { const i = out3(seg(A, 0.30, 0.62)), l = seg(L, 0.10, 0.40);
      for (let k = 0; k < 2; k++) { wT(N.plate[k], 0, -40 * (1 - i) - 30 * in2(l) + iPlate); wO(N.plate[k], seg(A, 0.30, 0.46) * (1 - l)); } }
    /* the plate's UI: slides in along the card's axis (-0.866, 0.5) x 7, staggered; its lines draw */
    for (let k = 0; k < 5; k++) {
      const s = seg(A, 0.50 + k * 0.04, 0.62 + k * 0.04), i = out3(s);
      wT(N.ui[k], -6.06 * (1 - i), 3.5 * (1 - i)); wO(N.ui[k], s);
    }
    for (let k = 0; k < 3; k++) drawq(N.uls[k], io2(seg(A, 0.52 + k * 0.05, 0.68 + k * 0.05)), 0);
    /* the coin comes down; its inner ring draws; the green wipes across (edge along the iso vertical, left -> right); reverse on leave */
    { const i = out3(seg(A, 0.42, 0.66)), l = seg(L, 0.18, 0.46);
      wT(N.coin, 0, -26 * (1 - i) - 20 * in2(l) + iCoin); wO(N.coin, seg(A, 0.42, 0.56) * (1 - l));
      drawq(N.ring, io2(seg(A, 0.56, 0.70)), 0);
      const gw = io2(seg(A, 0.66, 0.84)) * (1 - io2(seg(L, 0.04, 0.20)));
      wT(N.wipe, 250 + 152 * gw, 0); }
    /* the arrows: the upper one (plate -> coin) then the lower one (coin -> middle cube); they draw down, heads land; on leave they drain down */
    const ARR: [number, number, number][] = [[0.74, 0.86, 0.06], [0.60, 0.74, 0.0]];   /* [draw from, draw to, leave delay]: index 0 = lower line, 1 = upper */
    for (let k = 0; k < 2; k++) {
      const [d0, d1, ld] = ARR[k], q = io2(seg(A, d0, d1)), r = io2(seg(L, ld, ld + 0.14));
      drawq(N.al[k], q, r);
      const h = out3(seg(A, d1 - 0.04, d1 + 0.03)), hl = seg(L, ld + 0.11, ld + 0.17);
      wT(N.ah[k], 0, -5 * (1 - h) + 3 * hl); wO(N.ah[k], cl(h * 1.4) * (1 - hl));
    }
    /* the idle pulse: a green bead (ink rim) runs down the upper arrow, through the coin (hidden), down the lower arrow into the cube */
    { const p = N.pulse, restK = seg(A, 0.9, 1) * (1 - seg(L, 0, 0.06));
      let y = 0, o = 0;
      if (iW > 0 && iPh >= 0) {
        if (iPh < 0.42) { const s = iPh / 0.42; y = 278 + 38 * io2(s) + iCoin * s; o = Math.sin(Math.PI * s); }
        else if (iPh >= 0.5) { const s = (iPh - 0.5) / 0.5; y = 354 + iCoin * (1 - s) + 50 * s; o = Math.sin(Math.PI * s); }
        o *= iW * restK;
      }
      wO(p, o); wT(p, 0, y); }
  }

  /* the clip ids get a per-instance suffix (two problems on one page must not share a clip) */
  const art = mountArt("problem", host, (s) => {
    s.removeAttribute("width"); s.removeAttribute("height"); s.setAttribute("preserveAspectRatio", "xMidYMax meet");
    s.style.cssText = "display:block;width:100%;height:100%";
    build(s); ready = true; apply();
  }, (t) => t.replace(/pb-clip-(\w+)/g, `pb-clip-$1-${uid}`));

  return {
    el: art.el,
    set(v) { if (art.dead()) return; a = v < 0 ? 0 : v > 2 ? 2 : v; apply(); },
    idle(t, w) {
      w = w > 0 ? (w > 1 ? 1 : w) : 0;
      if (!ready || art.dead()) return;
      if (w === 0) { if (iW === 0 && iCoin === 0 && iPlate === 0) return; iW = 0; iCoin = 0; iPlate = 0; iPh = -1; apply(); return; }
      iW = w;
      iCoin = -1.0 * w * (0.5 - 0.5 * Math.cos(TAU * t / 2.8));
      iPlate = -1.2 * w * (0.5 - 0.5 * Math.cos(TAU * t / 4.6 + 2.1));
      const u = (t % 4.2) / 4.2;   /* the run takes 2.9 s of every 4.2 */
      iPh = u < 0.69 ? u / 0.69 : -1;
      apply();
    },
    dispose() { art.kill(); N = null; ready = false; },
  };
}
