"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Home v6's intro, held and read in (D113). The statement (World.tsx: .statement[data-reveal="wipe"][data-hold]) locks on the screen when it gets there (CSS: the
// section is a screen plus --st-hold tall and its content sticks, v6.css); while it holds, the text, set faint, is wiped to ink in reading order, one soft edge running
// along each line and on to the next, as one continuous front; then the green marker on "user-owned agent economy." wipes in, and it rests a moment before it goes.
// Scrubbed by the scroll (reversible). Each word paints its own two-tone gradient through its letters (background-clip: text), so the front can stop mid-word.
// The words are split.ts's (.st__wi), made by the world's boot after this mounts: it waits for them. Reduced motion: none of this, the intro stays as v5's.
const INK: [number, number] = [0, 0.7];       /* the hold's progress over which the ink front runs */
const MARK: [number, number] = [0.72, 0.86];  /* then the marker (the last 14 % is a rest before it scrolls on) */
const EDGE = 0.45;                            /* the front's soft edge, half its width, in em of the statement */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const s01 = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function StatementWipe() {
  const anchor = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const sec = anchor.current?.closest<HTMLElement>(".statement");
    if (!sec) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      let off: (() => void) | null = null, mounted: Element | null = null;
      const tryMount = () => {
        const first = sec.querySelector(".st__wi");
        if (first === mounted) return;
        off?.(); off = null; mounted = first;
        if (first) off = mount(sec);
      };
      const mo = new MutationObserver(tryMount);
      mo.observe(sec, { childList: true, subtree: true });
      tryMount();
      return () => { mo.disconnect(); off?.(); };
    });
    return () => mm.revert();
  }, { scope: anchor });
  return <span ref={anchor} hidden />;
}

function mount(sec: HTMLElement) {
  const words = [...sec.querySelectorAll<HTMLElement>(".st__wi")];
  const mark = sec.querySelector<HTMLElement>(".st__mark");
  // the reading path: each word's start along it (the lines laid end to end) and its width, in px
  let at: number[] = [], wd: number[] = [], total = 1, edge = 20;
  const measure = () => {
    at = []; wd = [];
    let top = -1e9, lineX = 0, base = 0, lineEnd = 0;
    for (const el of words) {
      const r = el.getBoundingClientRect();
      if (r.top - top > 3) { base += lineEnd - lineX; lineX = r.left; top = r.top; }
      at.push(base + r.left - lineX); wd.push(r.width); lineEnd = r.right;
    }
    total = Math.max(1, base + lineEnd - lineX);
    edge = EDGE * (parseFloat(getComputedStyle(sec.querySelector(".st") ?? sec).fontSize) || 40);
    cache.fill(-1e9); lastMark = "";
  };
  const cache = new Float64Array(words.length);
  let lastMark = "", p = 0;
  const apply = () => {
    const q = clamp((p - INK[0]) / (INK[1] - INK[0]), 0, 1), front = -edge + q * (total + 2 * edge);
    for (let i = 0; i < words.length; i++) {
      const x = clamp(Math.round((front - at[i]) * 2) / 2, -edge - 1, wd[i] + edge + 1);
      if (cache[i] === x) continue; cache[i] = x;
      words[i].style.backgroundImage = x >= wd[i] + edge ? "linear-gradient(var(--ink), var(--ink))"
        : x <= -edge ? "linear-gradient(var(--st-faint), var(--st-faint))"
        : `linear-gradient(90deg, var(--ink) ${(x - edge).toFixed(1)}px, var(--st-faint) ${(x + edge).toFixed(1)}px)`;
    }
    if (mark) { const m = s01((p - MARK[0]) / (MARK[1] - MARK[0])).toFixed(3); if (m !== lastMark) { lastMark = m; mark.style.setProperty("--mark", m); } }
  };
  sec.classList.add("is-wipe");
  measure(); apply();
  const o = { p: 0 };
  const tw = gsap.to(o, { p: 1, ease: "none", onUpdate: () => { p = o.p; apply(); },
    scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
  const onRefresh = () => { measure(); apply(); };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  ScrollTrigger.refresh();
  return () => {
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    tw.scrollTrigger?.kill(); tw.kill();
    for (const el of words) el.style.backgroundImage = "";
    mark?.style.removeProperty("--mark");
    sec.classList.remove("is-wipe");
  };
}
