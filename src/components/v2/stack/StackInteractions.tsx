"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SELECT_EVENT, STEP_EVENT } from "./StackLayers";
import { LAYERS } from "./layers";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Matches Stack.module.css's pinned layout
const PINNED = "(min-width: 1280px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
const FREE = "(prefers-reduced-motion: no-preference) and (not ((min-width: 1280px) and (min-height: 760px)))";

// Hovering a layer (in the drawing) or its row in the list highlights it in the drawing: data-hl on the section
// drives CSS. Keyboard focus doesn't: the keys already move the selection, which the drawing shows. Clicking a layer in the drawing selects it. The Chapter 1 hand-off is placed over the drawing's
// own thread (--handoff-x/-h on the band, --pin-x/-h inside the pin).
// Pinned (desktop, motion, D18): scrolling through the track steps the list from the core outwards and the drawing
// builds to match (data-build); choosing a layer scrolls to its step. Elsewhere with motion: one build-in, core
// first, the first time the drawing comes into view. With reduced motion every layer shows.
export function StackInteractions() {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-stack]");
    const svg = root?.querySelector<SVGSVGElement>("[data-iso]");
    const track = root?.querySelector<HTMLElement>("[data-track]");
    const pin = root?.querySelector<HTMLElement>("[data-pin]");
    if (!root || !svg || !track || !pin) return;
    const indexOf = (key: string | null) => LAYERS.findIndex((l) => l.key === key);
    // Only a layer that's showing can be highlighted (while building, hovering a later row would just grey the drawing)
    const set = (key: string | null) => {
      const built = root.getAttribute("data-build");
      if (key && (built === null || indexOf(key) <= Number(built))) root.setAttribute("data-hl", key);
      else root.removeAttribute("data-hl");
    };
    const toneOf = (t: EventTarget | null) => (t as Element | null)?.closest?.("[data-iso] [data-tone]")?.getAttribute("data-tone") ?? null; // layers only, not the band's own tone

    const onSvgOver = (e: Event) => set(toneOf(e.target));
    const onSvgLeave = () => set(null);
    svg.addEventListener("pointerover", onSvgOver);
    svg.addEventListener("pointerleave", onSvgLeave);
    const onSvgClick = (e: Event) => {
      onSvgOver(e); // touch: highlight too
      const key = toneOf(e.target);
      if (key) window.dispatchEvent(new CustomEvent(SELECT_EVENT, { detail: key }));
    };
    svg.addEventListener("click", onSvgClick);

    // The hand-off: from the band's top edge to the pin's top, then inside the pin down to the drawing's thread
    const line = svg.querySelector<SVGGraphicsElement>("[data-thread] line");
    const place = () => {
      if (!line) return;
      const b = root.getBoundingClientRect(), p = pin.getBoundingClientRect(), t = line.getBoundingClientRect();
      // After the rail the drawing rises and grows into place (StoryRailMotion: y, and scale about its top centre), so
      // measure it as it will rest: undo that move on the points read from it
      const art = svg.parentElement!, a = art.getBoundingClientRect();
      const dy = Number(gsap.getProperty(art, "y")) || 0, k = Number(gsap.getProperty(art, "scale")) || 1;
      const ox = a.left + a.width / 2, oy = a.top - dy;
      const rest = { x: (sx: number) => ox + (sx - ox) / k, y: (sy: number) => oy + (sy - dy - oy) / k };
      const x = rest.x(t.left + t.width / 2);
      root.style.setProperty("--handoff-x", `${x - b.left}px`);
      root.style.setProperty("--handoff-h", `${Math.max(0, track.getBoundingClientRect().top - b.top)}px`);
      pin.style.setProperty("--pin-x", `${x - p.left}px`);
      // The drawing's thread starts at the drawing's top edge (it may lift with the pillar, so measure the edge)
      pin.style.setProperty("--pin-h", `${Math.max(0, rest.y(svg.getBoundingClientRect().top) - p.top)}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(root);
    const blocks = [...root.querySelectorAll<HTMLElement>("[data-key]")];
    const handlers = blocks.map((b) => {
      const on = () => set(b.dataset.key ?? null), off = () => set(null);
      b.addEventListener("pointerenter", on); b.addEventListener("pointerleave", off);
      return () => { b.removeEventListener("pointerenter", on); b.removeEventListener("pointerleave", off); };
    });

    const mm = gsap.matchMedia();
    mm.add(PINNED, () => {
      root.setAttribute("data-pinned", "");
      root.setAttribute("data-build", String(Math.max(0, indexOf(root.getAttribute("data-active-layer")))));
      let last = -1, seeking = -1, settle = 0;
      const st = ScrollTrigger.create({
        trigger: track, start: "top top", end: "bottom bottom",
        onUpdate: (self) => {
          const k = Math.min(LAYERS.length - 1, Math.floor(self.progress * LAYERS.length));
          // While a choice is scrolling to its step, the steps it passes don't override it
          if (seeking >= 0) { if (k !== seeking) return; seeking = -1; window.clearTimeout(settle); }
          if (k !== last) { last = k; window.dispatchEvent(new CustomEvent(STEP_EVENT, { detail: LAYERS[k].key })); }
        },
        onRefresh: place,
      });
      // A choice (row, keys, drawing) scrolls to the middle of that layer's step, so scroll and selection agree
      const onSelect = (e: Event) => {
        const k = indexOf((e as CustomEvent<string>).detail);
        if (k < 0) return;
        last = k; seeking = k;
        window.clearTimeout(settle);
        settle = window.setTimeout(() => { seeking = -1; }, 1500); // a scroll the reader interrupts hands control back
        window.scrollTo({ top: st.start + ((k + 0.5) / LAYERS.length) * (st.end - st.start), behavior: "smooth" });
      };
      window.addEventListener(SELECT_EVENT, onSelect);
      return () => { window.clearTimeout(settle); window.removeEventListener(SELECT_EVENT, onSelect); root.removeAttribute("data-pinned"); root.removeAttribute("data-build"); };
    });
    mm.add(FREE, () => {
      root.setAttribute("data-build", "-1");
      const timers: number[] = [];
      ScrollTrigger.create({
        trigger: svg, start: "top 75%", once: true,
        onEnter: () => LAYERS.forEach((_, k) => timers.push(window.setTimeout(() => root.setAttribute("data-build", String(k)), k * 320))),
      });
      return () => { timers.forEach(clearTimeout); root.removeAttribute("data-build"); };
    });

    return () => {
      mm.revert();
      svg.removeEventListener("pointerover", onSvgOver); svg.removeEventListener("pointerleave", onSvgLeave); svg.removeEventListener("click", onSvgClick);
      ro.disconnect();
      handlers.forEach((off) => off());
      root.removeAttribute("data-hl");
    };
  }, { scope: anchor });

  return <span ref={anchor} hidden />;
}
