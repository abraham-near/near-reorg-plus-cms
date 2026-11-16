"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIDES } from "../../v1/rail/tide";

// Home v6: how the Stack's text comes in (D132, D133, D134). The rail's tide turns the world into the Stack's ground: a hard-edged wipe runs from the green
// line down to the foot of the screen, and the line rises off the top with the dark under it (v1/rail/layer.ts, exit "wipe"). The heading ("Four layers.
// One system.", its lede) and the columns under it (the list, the selected layer's detail) come up from the foot of the screen through it, rising the whole
// time, slow at first, and ease to a stop in their places just as the line leaves the top; then they stay put on the screen while the band lands under them,
// hold with it (CSS sticky, v1/stack/motion.ts data-stick) and leave with it. They show only on the dark: under the line (with room to spare: they never
// meet it) and above the wipe's edge.
//
// Driven by the rail's own state, not by the scroll: the rail hands over (v1/rail/tide.ts) where its line is, where the dark ends and how far the text has
// to go. The rail's timeline trails the scroll (scrubbed), so the text keeps in step with what is drawn. Each part is put at its resting place on the screen
// plus a shift (translate) from the tide.
//
// The scroll itself (D134): until the band lands, its content moves with the page, and the parts must not. The page scrolls on the compositor, so a shift
// worked out from the scroll on the main thread lagged a frame whenever the main thread was busy, and the text shook. Where the browser has scroll-driven
// animations (Chrome, Safari), the parts are held by one (stack-v6.css s6-comp: from where the tide starts to where the band lands, they move down as the
// page moves up), on the compositor with the scroll; elsewhere the shift is worked out here, as before. Once the band has landed nothing holds them: they
// stick with the band and leave with it (D134: they used to stay on the screen while the drawing left).
// Desktop with motion, where the band holds (the same query as motion.ts's steps); elsewhere the heading and the columns rise in as before.
const MOTION = "(min-width: 1280px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
const SPREAD = 0.3;    /* the columns trail the heading by their own gap and up to this much more, closing up as they land */
const LEDE = 0.06;     /* the lede trails its heading by up to this share of the screen */
const CLEAR = 0.08;    /* the least room between the line and the heading's top, as a share of the screen */
const LEAD = 2.5;      /* screens before the band lands where the scroll-driven hold starts (the tide starts about 1.3 screens before) */
const ease = (q: number) => (1 - Math.cos(Math.PI * q)) / 2;   /* slow from the foot, quickest mid-way, easing to a stop */
const unease = (e: number) => Math.acos(1 - 2 * Math.min(1, Math.max(0, e))) / Math.PI;
/* the columns' rows (D133 critic: on a timer they ran ahead of or behind the scroll): each rises 18 px as it fades in, on the tide itself, one after another
   in the order of stack-v6.css's delays, from when the list comes on the screen until ROWS_END, a little before the heading lands */
const ROW = 0.2, ROWS_END = 0.94;
const ROWS = [".stk-tab", ".stk-panelTop", ".stk-line", ".stk-features > li"];
const out3 = (x: number) => 1 - (1 - x) ** 3;

/* an inline style written only when it changes (an unchanged write still costs a restyle) */
const seen = new WeakMap<HTMLElement, Record<string, string>>();
function put(el: HTMLElement, k: "translate" | "clipPath" | "opacity" | "borderBottomColor" | "borderLeftColor", v: string) {
  let m = seen.get(el); if (!m) seen.set(el, (m = {}));
  if (m[k] === v) return;
  m[k] = v; el.style[k] = v;
}
/* an element's top in a positioned ancestor's box, without transforms (offsetTop), so a running animation can't skew the measure */
function topIn(el: HTMLElement, box: HTMLElement) {
  let y = 0, e: HTMLElement | null = el;
  while (e && e !== box) { y += e.offsetTop; e = e.offsetParent as HTMLElement | null; }
  return e === box ? y : el.getBoundingClientRect().top - box.getBoundingClientRect().top;
}

export function StackEnterV6() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const band = ref.current?.closest<HTMLElement>("[data-stack]");
    const inner = band?.querySelector<HTMLElement>(".stk-inner");
    const head = band?.querySelector<HTMLElement>(".stk-head"), lede = head?.querySelector<HTMLElement>("p") ?? null;
    const list = band?.querySelector<HTMLElement>(".stk-list"), panels = band?.querySelector<HTMLElement>(".stk-panels");
    if (!band || !inner || !head || !list || !panels) return;
    const parts = [head, list, panels];
    const SCROLL_TL = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      band.setAttribute("data-entering", "");
      /* each part's place in the band's inner box and height; the band's padding above the inner box (where the inner box rests, held) */
      let off = [0, 0, 0], top = 0;
      /* the rows, with their place in the order (the --rv delays: list rows 0-3, the panel's label row 1, its line 2, its features 3.5 on) */
      const rows: [HTMLElement, number][] = [];
      list.querySelectorAll<HTMLElement>(ROWS[0]).forEach((el, i) => rows.push([el, i]));
      panels.querySelectorAll<HTMLElement>(".stk-panel").forEach((pn) => {
        pn.querySelectorAll<HTMLElement>(ROWS[1]).forEach((el) => rows.push([el, 1]));
        pn.querySelectorAll<HTMLElement>(ROWS[2]).forEach((el) => rows.push([el, 2]));
        pn.querySelectorAll<HTMLElement>(ROWS[3]).forEach((el, i) => rows.push([el, 3.5 + i]));
      });
      const last_ = Math.max(...rows.map(([, k]) => k), 1);
      const rules = [...panels.querySelectorAll<HTMLElement>(".stk-features")];
      const clear = () => {
        parts.forEach((el) => { put(el, "translate", ""); put(el, "clipPath", ""); }); if (lede) put(lede, "translate", "");
        rows.forEach(([el]) => { put(el, "opacity", ""); put(el, "translate", ""); });
        put(list, "borderBottomColor", ""); rules.forEach((el) => put(el, "borderLeftColor", ""));
      };
      /* the scroll-driven hold's range: from LEAD screens before the band lands to where it lands (its top at the screen's top: the inner box sticks) */
      const range = () => {
        if (!SCROLL_TL) return;
        const s1 = band.getBoundingClientRect().top + scrollY, s0 = Math.max(0, s1 - LEAD * innerHeight);   /* unrounded: the sticky hold takes over at s1 exactly (D134 critic: a 0.4 px step) */
        band.style.setProperty("--s6-s0", s0 + "px"); band.style.setProperty("--s6-s1", s1 + "px"); band.style.setProperty("--s6-c", (s0 - s1) + "px");
      };
      const measure = () => {
        off = parts.map((el) => topIn(el, inner));
        top = parseFloat(getComputedStyle(band).paddingTop) || 0;
        range();
        last = ""; render();
      };
      let last = "", raf = 0, near = false;
      const frame = () => { raf = near ? requestAnimationFrame(frame) : 0; render(); };
      const render = () => {
        const td = TIDES.get(band);
        /* the CSS hold runs only on the held band (data-sticky, set by motion.ts once its steps mount) */
        const css = SCROLL_TL && band.hasAttribute("data-sticky");
        const it = css ? 0 : inner.getBoundingClientRect().top;   /* without it: where the page has the inner box */
        const key = td ? `${td.q.toFixed(4)}|${td.y.toFixed(1)}|${td.f.toFixed(1)}|${css ? "c" : it.toFixed(1)}|${innerHeight}` : "-";
        if (key === last) return; last = key;
        if (!td) { clear(); band.removeAttribute("data-s6-settled"); return; }   /* no tide (the rail isn't running): the page as it is */
        const { q, y: ty, f: tf } = td, H = innerHeight, E = ease(q);
        const rest = off.map((o) => top + o);              /* each part's top on the screen once the band has landed */
        let at = rest[0] + (H - rest[0]) * (1 - E);        /* the heading: from the foot of the screen to its place */
        at = Math.max(at, ty + CLEAR * H);                 /* and never near the line */
        const cols = at + (rest[1] - rest[0]) * (1 + SPREAD * (1 - E));
        const want = [at, cols, cols + (rest[2] - rest[1])];
        const done = q >= 1 && ty < 0 && tf >= H;
        /* the text has settled (D135): the drawing starts its build and 01 NEAR Protocol lights now, not once the band lands (StackArtV6). Let go only
           well back (q under .9: about 300 px at 1440 × 900; .97 was 120, D135 critic), so a to-and-fro at the end doesn't restart the build */
        if (done) band.setAttribute("data-s6-settled", ""); else if (q < 0.9) band.removeAttribute("data-s6-settled");
        /* how far below its resting place the page has the inner box (before it lands); the CSS hold takes this up where it runs */
        const low = css ? 0 : Math.max(0, it - top);
        const hgt = parts.map((el) => el.offsetHeight);
        parts.forEach((el, i) => {
          const d = want[i] - rest[i] - low;
          put(el, "translate", Math.abs(d) < 0.05 ? "" : `0 ${d.toFixed(1)}px`);
          /* only on the dark: under the line, above the wipe's edge (a little over the sides for the glyphs) */
          put(el, "clipPath", done ? "" : `inset(${(ty + 4 - want[i]).toFixed(1)}px -40px ${(want[i] + hgt[i] - tf).toFixed(1)}px -40px)`);
        });
        if (lede) put(lede, "translate", E >= 1 ? "" : `0 ${(LEDE * H * (1 - E)).toFixed(1)}px`);
        /* the rows: from when the list's top is 92 % down the screen (worked back from the heading's path) to ROWS_END */
        const span = (H - rest[0]) + SPREAD * (rest[1] - rest[0]);
        const q0 = Math.min(0.6, unease(1 - (0.92 * H - rest[1]) / span));
        const step = (ROWS_END - ROW - q0) / last_;
        const p = (k: number) => out3(Math.min(1, Math.max(0, (q - q0 - k * step) / ROW)));
        rows.forEach(([el, k]) => {
          const v = p(k);
          put(el, "opacity", v >= 1 ? "" : v.toFixed(3));
          put(el, "translate", v >= 1 ? "" : `0 ${(18 * (1 - v)).toFixed(1)}px`);
        });
        /* the list's foot rule and the features' side rule come in with their rows, so no empty frame shows ahead of them */
        const mix = (v: number) => (v >= 1 ? "" : `color-mix(in oklab, var(--color-line-on-dark) ${(v * 100).toFixed(1)}%, transparent)`);
        put(list, "borderBottomColor", mix(p(3)));
        rules.forEach((el) => put(el, "borderLeftColor", mix(p(3.5))));
      };
      measure();
      addEventListener("resize", measure);
      ScrollTrigger.addEventListener("refresh", measure);   /* the pins above settle: where the band lands moves */
      /* the band's layout settles after the first measure (fonts, the panels' grid): measure again when it does */
      const ro = new ResizeObserver(() => measure()); ro.observe(inner);
      document.fonts?.ready.then(measure);
      /* the loop runs only while the band is within a screen and a half (D134: it ran every frame of the whole page) */
      const io = new IntersectionObserver(([en]) => {
        near = en.isIntersecting;
        if (near && !raf) raf = requestAnimationFrame(frame);
      }, { rootMargin: "150% 0px" });
      io.observe(band);
      return () => {
        cancelAnimationFrame(raf); raf = 0; near = false; io.disconnect();
        removeEventListener("resize", measure); ScrollTrigger.removeEventListener("refresh", measure); ro.disconnect();
        band.removeAttribute("data-entering"); band.removeAttribute("data-s6-settled"); clear();
        for (const k of ["--s6-s0", "--s6-s1", "--s6-c"]) band.style.removeProperty(k);
      };
    });
    return () => mm.revert();
  }, []);
  return <span ref={ref} hidden />;
}
