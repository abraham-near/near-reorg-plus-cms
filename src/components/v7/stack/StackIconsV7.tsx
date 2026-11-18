"use client";
// Home v7 (D204, Lawrence: "the animated icons next to each of the 4 Near Stack names", b11's): the list's line icons (StackV4 icons; the files are
// public/nav/icons, the same as b11's). The repo's port of b11's icon script draws them (v3/header/icons.ts): an icon rests as dots along its lines and
// draws into lines, its green dot last; hovering (or focusing) its row folds it back to dots and draws it again. Each row's icon draws as the row comes in:
// the rows rise in on the tide (StackEnterV7, stack-v7.css), seen through their own opacity, so it waits until its row is at least half in, not merely on
// the screen. Reduced motion: drawn, still.
import { useEffect } from "react";
import { mountIcons } from "../../v3/header/icons";

/** how much of a row shows: its own opacity times its parents', up to the band */
function shown(e: Element | null, stop: Element) {
  let o = 1;
  for (; e && e !== stop.parentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity;
  return o;
}

export function StackIconsV7() {
  useEffect(() => {
    const band = document.querySelector<HTMLElement>("[data-stack]"), list = band?.querySelector<HTMLElement>(".stk-list");
    if (!band || !list) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const icons = mountIcons(list, reduced);
    if (reduced) return () => icons.dispose();
    const tabs = [...list.querySelectorAll<HTMLElement>(".stk-tab")], done = new Set<Element>();
    let raf = 0, near = false;
    const tick = () => {
      raf = 0;
      tabs.forEach((t) => {
        /* drawn once its icon is built (fetched) and its row is half in */
        if (done.has(t) || !t.querySelector(".stk-ic svg")) return;
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || shown(t, band) < 0.5) return;
        done.add(t); icons.draw(t);
      });
      if (near && done.size < tabs.length) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting;
      if (near && !raf && done.size < tabs.length) raf = requestAnimationFrame(tick);
    }, { rootMargin: "10% 0px" });
    io.observe(list);
    return () => { io.disconnect(); cancelAnimationFrame(raf); icons.dispose(); };
  }, []);
  return null;
}
