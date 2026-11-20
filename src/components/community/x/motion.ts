// Community X's motion: C's, with less of it (no photos, so no opening frames and no parallax), plus the site's dot icons. Once each (useScrollMotion):
//   - the channels' icons ([data-icon]) rest as dots and draw into lines as they come into view, and again on hover / focus (../../v3/header/icons.ts).
//     They mount with reduced motion too: there they are simply drawn;
//   - [data-rise] headings rise word by word (SplitText, no masks: { yPercent: 40, autoAlpha: 0 }); the h1 ("now") at once, the others as they come into
//     view; the green square after the accent word lands last;
//   - [data-rv] blocks rise and fade in as they come into view (CSS, keyed on .is-in; --rv staggers a group);
//   - [data-count] figures count up from zero once, keeping their prefix, separators and suffix ("2,000+");
//   - [data-wipe] the Legion's statement is wiped from faint to paper in reading order as it passes through the view (each word's --k, scrubbed).
//   - the hero's drawing (HeroWeb.tsx) builds in (floor, tiles, threads, people), then runs its signals and the green ring while on screen (hero());
// Reduced motion: only the icons mount (drawn); every other piece is its final state.
import { SplitText } from "gsap/SplitText";
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../../v3/header/icons";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** the hero's drawing (HeroWeb.tsx): built in once, then signals along the middle crew's threads and a ring off the green figure while it is on screen */
function hero(root: HTMLElement, gsap: MotionCtx["gsap"]) {
  const svg = root.querySelector<SVGSVGElement>(".cmx-web");
  if (!svg) return () => {};
  const floor = svg.querySelector(".cmx-web__floor"), tiles = svg.querySelectorAll(".cmx-web__t"), links = svg.querySelectorAll(".cmx-web__links path");
  const pawns = svg.querySelectorAll(".cmx-web__p"), ring = svg.querySelector<SVGCircleElement>(".cmx-web__ring");
  const hubs = [...svg.querySelectorAll<SVGPathElement>(".cmx-web__links .is-hub")], sigs = [...svg.querySelectorAll<SVGCircleElement>(".cmx-web__sig circle")];
  const lens = hubs.map((p) => p.getTotalLength());
  let on = false, live = false, t0 = 0;
  const tick = (time: number) => {
    if (!t0) t0 = time;
    const t = time - t0;
    // each signal runs out from the middle crew along its thread (about 2.6 s), the six staggered, fading in and out at the ends
    sigs.forEach((c, i) => {
      const u = ((t / 2.6 + i / sigs.length) % 1 + 1) % 1, pt = hubs[i].getPointAtLength(u * lens[i]);
      c.setAttribute("cx", pt.x.toFixed(2)); c.setAttribute("cy", pt.y.toFixed(2));
      c.setAttribute("opacity", Math.sin(Math.PI * u).toFixed(3));
    });
    // the ring: every 3.2 s it grows off the green head and fades
    if (ring) { const k = (t % 3.2) / 1.6; ring.setAttribute("opacity", k < 1 ? (0.7 * (1 - k)).toFixed(3) : "0"); ring.style.transform = `scale(${(1 + 2.2 * Math.min(k, 1)).toFixed(3)})`; }
  };
  const run = () => { if (on && live) gsap.ticker.add(tick); else gsap.ticker.remove(tick); };
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; run(); });
  io.observe(svg);
  const gctx = gsap.context(() => {
    const tl = gsap.timeline({ delay: 0.3, onComplete: () => { live = true; run(); } });
    if (floor) tl.from(floor, { opacity: 0, duration: 0.9, ease: "none" }, 0);
    tl.from(tiles, { y: 18, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 }, 0.15)
      .from(links, { opacity: 0, duration: 0.7, ease: "none", stagger: 0.05 }, 0.75)
      .from(pawns, { y: -12, opacity: 0, duration: 0.55, ease: "back.out(2)", stagger: 0.035 }, 0.95);
  }, svg);
  return () => {
    io.disconnect(); gsap.ticker.remove(tick); gctx.revert();
    sigs.forEach((c) => c.setAttribute("opacity", "0"));
    if (ring) { ring.setAttribute("opacity", "0"); ring.style.removeProperty("transform"); }
  };
}

export function mount(root: HTMLElement, ctx: MotionCtx) {
  const { gsap, ScrollTrigger, reduced } = ctx;
  const icons = mountIcons(root, reduced);
  if (reduced) return () => icons.dispose();
  gsap.registerPlugin(SplitText);
  root.setAttribute("data-motion", "");
  let dead = false;
  const unhero = hero(root, gsap);
  const splits: SplitText[] = [], rafs = new Set<number>();

  /* ── headings: split now, hidden, and played once ── */
  const plays = new Map<Element, { play: () => void; finish: () => void }>();
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
    const s = SplitText.create(h, { type: "words", wordsClass: "cmx-w" });
    splits.push(s);
    const sq = h.querySelector<HTMLElement>("[data-sq]");
    gsap.set(s.words, { yPercent: 40, autoAlpha: 0 });
    if (sq) gsap.set(sq, { scale: 0, transformOrigin: "50% 100%" });
    const play = (delay = 0) => {
      gsap.to(s.words, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.06, delay, overwrite: true });
      if (sq) gsap.to(sq, { scale: 1, duration: 0.8, ease: "back.out(2.2)", delay: delay + 0.25 + s.words.length * 0.06 });
    };
    const finish = () => { gsap.set(s.words, { yPercent: 0, autoAlpha: 1 }); if (sq) gsap.set(sq, { scale: 1 }); };
    if (h.dataset.rise === "now") play(0.1);
    else plays.set(h, { play: () => play(0), finish });
  });

  /* ── figures: count up once ── */
  const count = (el: HTMLElement) => {
    const v = el.dataset.count || "", m = /^([^\d]*)([\d.,]+)(.*)$/.exec(v);
    if (!m) return;
    const [, pre, num, suf] = m, to = parseFloat(num.replace(/,/g, "")), dec = (num.split(".")[1] || "").length, comma = num.includes(",");
    const fmt = (x: number) => { const s = x.toFixed(dec); return comma ? Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s; };
    const t0 = performance.now() + 180, D = 1500;
    el.textContent = `${pre}${fmt(0)}${suf}`;
    const step = (t: number) => {
      if (dead) return;
      const k = clamp((t - t0) / D, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = k >= 1 ? v : `${pre}${fmt(to * e)}${suf}`;
      if (k < 1) { const r = requestAnimationFrame(step); rafs.add(r); }
    };
    const r = requestAnimationFrame(step); rafs.add(r);
  };

  /* ── one observer for the arrivals: blocks, headings, figures ── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    if (el.hasAttribute("data-rv")) el.classList.add("is-in");
    if (el.hasAttribute("data-count")) count(el);
    plays.get(el)?.play();
  }), { rootMargin: "0px 0px -10% 0px" });
  // read every position first, then act: a piece already above the view (a reload partway down) is finished at once, the rest wait for the view
  const all = [...root.querySelectorAll<HTMLElement>("[data-rv], [data-count]"), ...(plays.keys() as Iterable<HTMLElement>)];
  const above = all.map((el) => el.getBoundingClientRect().bottom < 0);
  all.forEach((el, i) => {
    if (el.hasAttribute("data-rv") && !el.style.getPropertyValue("--rv")) el.style.setProperty("--rv", "0");
    if (!above[i]) { io.observe(el); return; }
    el.classList.add("is-in", "is-now");
    plays.get(el)?.finish();
  });
  // keyboard: a block that receives focus before it has arrived shows at once
  const onFocus = (e: FocusEvent) => { const b = (e.target as Element).closest?.("[data-rv]"); if (b && !b.classList.contains("is-in")) b.classList.add("is-in", "is-now"); };
  root.addEventListener("focusin", onFocus);

  /* ── the Legion's statement: faint to paper, in reading order, as it passes through the view ── */
  root.querySelectorAll<HTMLElement>("[data-wipe]").forEach((st) => {
    const words = [...st.querySelectorAll<HTMLElement>(".cmx-ww")];
    const n = words.length, soft = 6;   // the front's soft edge, in words
    const last = new Float32Array(n).fill(-1);
    st.classList.add("is-wipe");
    const apply = (p: number) => {
      const front = p * (n + soft);
      for (let i = 0; i < n; i++) {
        const k = Math.round(clamp((front - i) / soft, 0, 1) * 100) / 100;
        if (last[i] !== k) { last[i] = k; words[i].style.setProperty("--k", String(k)); }
      }
    };
    apply(0);
    ScrollTrigger.create({ trigger: st, start: "top 82%", end: "bottom 38%", scrub: 0.4, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
  });

  return () => {
    dead = true; io.disconnect(); root.removeEventListener("focusin", onFocus); icons.dispose(); unhero();
    rafs.forEach(cancelAnimationFrame);
    splits.forEach((s) => s.revert());
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => { el.textContent = el.dataset.count || ""; });
    root.querySelectorAll("[data-rv]").forEach((el) => el.classList.remove("is-in", "is-now"));
    root.querySelectorAll<HTMLElement>(".cmx-ww").forEach((w) => w.style.removeProperty("--k"));
    root.querySelectorAll("[data-wipe]").forEach((el) => el.classList.remove("is-wipe"));
    root.removeAttribute("data-motion");
  };
}
