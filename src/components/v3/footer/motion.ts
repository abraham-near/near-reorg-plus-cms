// v3's footer, the behaviour: b10's (js/footer.js), on our markup (Footer.tsx).
//   - arrival, in sequence (motion only): each block (.b10f-rv) arrives when a fifth of it is in; its pieces wait their own --d (set in the markup);
//   - the line icons (Products / Stack rows, socials) draw from dots as they arrive (../header/icons.ts);
//   - the side rules start at the Products / Stack labels (--f-rail);
//   - Back to top: to the top of the page (smooth, through v1's Lenis when it runs);
//   - the big `near`: flat, drawn on a canvas (the SVG under it is the fallback). On arrival, once, the ink fills in from left to right under a soft front while
//     the word rises 14 px. Reduced motion: the finished word.
import type { MotionCtx } from "@/lib/motion/scroll";
import { smooth } from "@/lib/motion/smooth";
import { mountIcons } from "../header/icons";
import { WORD_PATHS } from "./wordmark-paths";

export function mount(root: HTMLElement, { reduced }: MotionCtx) {
  const ac = new AbortController(), on = { signal: ac.signal };
  const icons = mountIcons(root, reduced);

  /* ── arrival ── */
  const blocks = [...root.querySelectorAll<HTMLElement>(".b10f-rv")];
  let io: IntersectionObserver | null = null;
  if (reduced) blocks.forEach((b) => b.classList.add("is-in"));
  else {
    root.classList.add("is-motion");
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in"); io!.unobserve(e.target); icons.draw(e.target);
    }), { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    blocks.forEach((b) => io!.observe(b));
  }

  /* ── where the side rules start: the top of the Products / Stack labels ── */
  const prod = root.querySelector<HTMLElement>(".b10f-prod"), inner = root.querySelector<HTMLElement>(".b10f-in");
  const rail = () => { if (prod && inner) root.style.setProperty("--f-rail", Math.round(prod.offsetTop + inner.offsetTop) + "px"); };
  rail();
  const ro = new ResizeObserver(rail); ro.observe(root);

  /* ── Back to top ── */
  root.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("[data-b10f-top]"); if (!a) return;
    e.preventDefault();
    const s = smooth(); if (s) s.scrollTo(0, { duration: 1.6 }); else scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, on);

  /* ── the big `near` ── */
  /* no arrival for the word (13 Nov): it is simply there, finished (the fill-in and the rise run only when `reduced` is false: wordmark's 3rd argument) */
  const offWord = wordmark(root, root.querySelector<HTMLElement>(".b10f-word"), true);

  return () => {
    ac.abort(); io?.disconnect(); ro.disconnect(); icons.dispose(); offWord();
    root.classList.remove("is-motion"); blocks.forEach((b) => b.classList.remove("is-in"));
    root.style.removeProperty("--f-rail");
  };
}

function wordmark(root: HTMLElement, box: HTMLElement | null, reduced: boolean): () => void {
  if (!box) return () => {};
  const LW = 363, T = 1100, RISE = 14, EXT = 24;   // EXT: the canvas reaches this far above the word, room for the rise (footer.css)
  const paths = WORD_PATHS.map((d) => new Path2D(d));
  const cv = document.createElement("canvas"); box.appendChild(cv);
  const ctx = cv.getContext("2d"); if (!ctx) { cv.remove(); return () => {}; }
  const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v), outC = (t: number) => 1 - Math.pow(1 - t, 3);
  type Geo = { W: number; H: number; dpr: number; k: number; face: string; tmp: HTMLCanvasElement };
  let G: Geo | null = null, key = "", prog = reduced ? 1 : 0, t0 = 0, raf = 0, dead = false;
  function build() {
    const r = box!.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!W || !H) return false;
    const k0 = W + "x" + H + "@" + dpr; if (key === k0) return true; key = k0;
    const face = getComputedStyle(root).getPropertyValue("--fw-face").trim() || "#f5f4f1";
    const tmp = document.createElement("canvas");
    G = { W, H, dpr, k: W / LW, face, tmp };
    cv.width = tmp.width = Math.round(W * dpr); cv.height = tmp.height = Math.round((H + EXT) * dpr);
    box!.classList.add("is-live");
    return true;
  }
  // the flat word on c
  function scene(c: CanvasRenderingContext2D, y: number) {
    const g = G!;
    c.fillStyle = g.face; c.setTransform(g.k * g.dpr, 0, 0, g.k * g.dpr, 0, g.dpr * (EXT + y));
    paths.forEach((p) => c.fill(p));
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function draw() {
    const g = G; if (!g || !ctx) return;
    const p = c01(prog), e = outC(c01(p / 0.85)), y = RISE * (1 - e);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (e >= 1) { scene(ctx, 0); return; }
    if (e <= 0) return;
    // the word, cut by a soft left-to-right front (a 25 %-wide ramp)
    const o = g.tmp.getContext("2d")!; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-over";
    o.clearRect(0, 0, g.tmp.width, g.tmp.height); scene(o, y);
    const f = -0.25 + 1.25 * e, lg = o.createLinearGradient(0, 0, g.tmp.width, 0);
    lg.addColorStop(0, "rgba(0,0,0,1)"); lg.addColorStop(c01(f), "rgba(0,0,0,1)"); lg.addColorStop(c01(f + 0.25), "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,0)");
    o.globalCompositeOperation = "destination-in"; o.fillStyle = lg; o.fillRect(0, 0, g.tmp.width, g.tmp.height);
    ctx.globalAlpha = Math.min(1, e * 3); ctx.drawImage(g.tmp, 0, 0); ctx.globalAlpha = 1;
  }
  function frame(now: number) {
    raf = 0;
    if (dead || (!G && !build())) return;
    if (t0) prog = Math.min(1, (now - t0) / T);
    draw();
    if (t0 && prog < 1) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(frame); };
  const ro = new ResizeObserver(() => { if (build()) draw(); }); ro.observe(box);
  build(); draw();
  let io: IntersectionObserver | null = null;
  if (!reduced) {
    // once, when a third of the word is in view
    io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io!.disconnect(); t0 = performance.now(); kick(); } }, { threshold: 0.34 });
    io.observe(box);
  }
  return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect(); cv.remove(); box.classList.remove("is-live"); };
}
