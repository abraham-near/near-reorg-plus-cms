// The hero, in motion (markup: HeroIso.tsx + FoundationB.tsx; data: hero-data.ts).
//   - arrival (time, once): the floor's dots come up from the middle out, the block settles onto them and its outline draws, then its seams; the headline's
//     words rise out of their lines, the subhead and the scale under it follow; the FOUNDATION chip pins the block.
//   - the scene (scrubbed): desktop: the section is 260 vh and its stage sticks; phones: the drawing plays as it crosses the view. The block parts into its 48
//     cubes; 44 slide out (the top layer first, each layer from the outside in) along the floor to their own nodes, dropping as they arrive, while the camera
//     pulls back from the block to the whole floor; the region chips pin as their cubes land, the network draws between the landed nodes, and the four cubes
//     left (the Foundation, smaller) take the green. Painter's order is kept by sorting the cubes on x + y + z as they move.
//   - reduced motion: the finished frame, no arrival.
import type { MotionCtx } from "@/lib/motion/scroll";
import { BH, CHIPS, EDGES, M, PIECES, T_MOVE, W } from "./hero-data";
import { clamp01, ease3, smooth } from "./iso";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// where the camera looks: the block's middle, then the middle of the finished ecosystem
const F0 = W(M, M, BH / 2);
const F1 = (() => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  PIECES.forEach((p) => { [W(p.ex, p.ey, p.ez + 1), W(p.ex + 1, p.ey + 1, p.ez)].forEach(([a, b]) => { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }); });
  return [(x0 + x1) / 2, (y0 + y1) / 2] as [number, number];
})();
const CORE_COLS = PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p.sx >= M - 1 && p.sx <= M && p.sy >= M - 1 && p.sy <= M && p.sz > 0);

export function mountHero(root: HTMLElement, { gsap, reduced }: MotionCtx) {
  const sec = root.querySelector<HTMLElement>("[data-hero]"); if (!sec) return;
  const art = sec.querySelector<HTMLElement>(".fb-iso")!, svg = art.querySelector<SVGSVGElement>("svg")!;
  const cam = svg.querySelector<SVGGElement>(".fb-cam")!, pcsG = svg.querySelector<SVGGElement>(".fb-pcs")!, shell = svg.querySelector<SVGGElement>(".fb-shell")!;
  // by index, not DOM order: the painter's sort re-appends them (and a remount finds them in that order)
  const pcs: SVGGElement[] = []; svg.querySelectorAll<SVGGElement>(".fb-pc").forEach((g) => { pcs[Number(g.dataset.i)] = g; });
  const greens = pcs.map((g) => g.querySelector<SVGElement>(".fb-pc__g"));
  const edges = [...svg.querySelectorAll<SVGPathElement>(".fb-edge")];
  const chipEl = new Map(CHIPS.map((c) => [c.k, sec.querySelector<HTMLElement>(`.fb-chip[data-k="${c.k}"]`)!]));
  const regionPiece = new Map([0, 1, 2, 3].map((r) => [String(r), PIECES.findIndex((p) => p.g && p.r === r)]));
  const coreGreen = PIECES.findIndex((p) => p.core && p.g);
  const fill = sec.querySelector<HTMLElement>(".fb-hud__fill");
  const ac = new AbortController();

  let w = 1440, h = 900, mobile = false, cur = 0, chipsOn = reduced;
  const size = () => {
    const r = art.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); mobile = innerWidth < 860;
    svg.setAttribute("viewBox", `0 0 ${w.toFixed(0)} ${h.toFixed(0)}`);
  };
  const camera = (p: number) => {
    const e = ease3(clamp01(p / 0.86));
    const k = mobile ? Math.min(w / 1100, h / 640) : Math.min(w / 1440, h / 900);
    const s = lerp(mobile ? 2.3 : 1.8, mobile ? 1.42 : 0.9, e) * k;
    const T0: [number, number] = mobile ? [0.5 * w, 0.56 * h] : [0.745 * w, 0.66 * h], T1: [number, number] = mobile ? [0.5 * w, 0.5 * h] : w < 1200 ? [0.695 * w, 0.75 * h] : [0.7 * w, 0.665 * h];   // narrower desktops: under the subhead
    const fx = lerp(F0[0], F1[0], e), fy = lerp(F0[1], F1[1], e);
    return { s, tx: lerp(T0[0], T1[0], e) - fx * s, ty: lerp(T0[1], T1[1], e) - fy * s };
  };

  let order = pcs.map((_, i) => i), lastSw = "";
  const thin = [svg.querySelector<SVGGElement>(".fb-edges")!, svg.querySelector<SVGPathElement>(".fb-outline")!, svg.querySelector<SVGGElement>(".fb-seams")!];
  const keys = new Float64Array(pcs.length), pos = PIECES.map(() => [0, 0, 0]);
  const render = (p: number) => {
    cur = p;
    const c = camera(p);
    cam.setAttribute("transform", `matrix(${c.s.toFixed(4)} 0 0 ${c.s.toFixed(4)} ${c.tx.toFixed(2)} ${c.ty.toFixed(2)})`);
    const sw = (1 / c.s).toFixed(3);   // the drawn-in paths keep a 1 px line at any zoom (they can't use non-scaling-stroke)
    if (sw !== lastSw) { lastSw = sw; thin.forEach((el) => { el.style.strokeWidth = sw; }); }
    shell.style.opacity = (1 - smooth(0.006, 0.04, p)).toFixed(3);
    pcsG.style.opacity = p > 0.003 ? "1" : "0";
    PIECES.forEach((q, i) => {
      const t = q.core ? 0 : clamp01((p - q.s) / T_MOVE), e = ease3(t), ez = smooth(0.4, 1, t);
      const x = lerp(q.sx, q.ex, e), y = lerp(q.sy, q.ey, e), z = lerp(q.sz, q.ez, ez);
      pos[i][0] = x; pos[i][1] = y; pos[i][2] = z; keys[i] = x + y + z;
      const [a, b] = W(x, y, z);
      pcs[i].setAttribute("transform", `translate(${a.toFixed(2)} ${b.toFixed(2)})`);
      const g = greens[i]; if (g) g.style.opacity = (i === coreGreen ? smooth(0.84, 0.92, p) : smooth(0.86, 1, t)).toFixed(3);
    });
    const next = order.slice().sort((a, b) => keys[a] - keys[b] || a - b);
    if (next.some((v, k) => v !== order[k])) { order = next; order.forEach((i) => pcsG.appendChild(pcs[i])); }
    edges.forEach((el, i) => { el.style.strokeDashoffset = (1 - smooth(EDGES[i].at, EDGES[i].at + 0.09, p)).toFixed(3); });
    // the chips: the Foundation's on its block's top (it sinks as the layers leave), each region's on its green cube once it has landed
    const pres = (L: number) => { let m = 0; CORE_COLS.forEach(({ p: q }) => { if (q.sz === L) m = Math.max(m, clamp01((cur - q.s) / T_MOVE)); }); return 1 - smooth(0.05, 0.5, m); };
    const zTop = 1 + pres(1) + pres(2);
    const place = (el: HTMLElement, wx: number, wy: number, wz: number, on: boolean) => {
      const [a, b] = W(wx, wy, wz), X = a * c.s + c.tx, Y = b * c.s + c.ty;
      el.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, 0)`;
      el.classList.toggle("is-on", on);
    };
    place(chipEl.get("f")!, M, M, zTop, chipsOn);
    regionPiece.forEach((i, k) => { const q = PIECES[i], [x, y, z] = pos[i]; place(chipEl.get(k)!, x + 0.5, y + 0.5, z + 1, chipsOn && clamp01((p - q.s) / T_MOVE) > 0.96); });
    if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;
  };

  size();
  addEventListener("resize", () => { size(); render(cur); }, { signal: ac.signal });

  if (reduced) { render(1); sec.classList.add("is-ready"); return () => { ac.abort(); sec.classList.remove("is-ready"); }; }

  render(0);

  /* the scene, scrubbed */
  const proxy = { p: 0 };
  const mm = gsap.matchMedia();
  mm.add({ desk: "(min-width: 860px)", mob: "(max-width: 859px)" }, (ctx) => {
    const desk = ctx.conditions?.desk;
    size();
    gsap.fromTo(proxy, { p: 0 }, {
      p: 1, ease: "none", onUpdate: () => render(proxy.p),
      scrollTrigger: desk ? { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true }
        : { trigger: art, start: "top 82%", end: "bottom 30%", scrub: 0.7, invalidateOnRefresh: true },
    });
  });

  /* the arrival, once (skipped when the page opens mid-scene) */
  const words = [...sec.querySelectorAll<HTMLElement>(".fb-wi")], after = [...sec.querySelectorAll<HTMLElement>("[data-hero-rv]")];
  const dots = [...svg.querySelectorAll<SVGPathElement>(".fb-dots")], shellIn = svg.querySelector<SVGGElement>(".fb-shell-in")!;
  const outline = svg.querySelector<SVGPathElement>(".fb-outline")!, seams = [...svg.querySelectorAll<SVGPathElement>(".fb-seams path")];
  const finish = () => { chipsOn = true; render(cur); };
  if (proxy.p > 0.02 || sec.getBoundingClientRect().top < -40) finish();
  else {
    gsap.set(words, { yPercent: 112 });
    gsap.set(after, { autoAlpha: 0, y: 18 });
    gsap.set(dots, { opacity: 0 });
    gsap.set(shellIn, { y: -70, opacity: 0 });
    gsap.set([outline, ...seams], { strokeDasharray: "1 1", strokeDashoffset: 1 });
    const tl = gsap.timeline({ delay: 0.15, onComplete: finish });
    tl.to(words, { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: 0.045 }, 0)
      .to(dots, { opacity: 1, duration: 0.9, ease: "sine.out", stagger: 0.12 }, 0.1)
      .to(shellIn, { y: 0, opacity: 1, duration: 1.4, ease: "power3.out" }, 0.25)
      .to(outline, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 0.3)
      .to(seams, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.035 }, 1.05)
      .to(after, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1 }, 0.55)
      .call(() => { chipsOn = true; render(cur); }, [], 1.25);
  }
  sec.classList.add("is-ready");

  return () => { ac.abort(); mm.revert(); sec.classList.remove("is-ready"); };
}
