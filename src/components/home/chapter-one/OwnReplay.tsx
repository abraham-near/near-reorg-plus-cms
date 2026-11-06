"use client";

import { useEffect, useRef } from "react";

// Hovering an "Own your …" drawing replays its one small move (D28, after Tempo's cards: the drawing re-runs its
// story while the words beside it hold still). Mouse only, with motion allowed; a drawing that is still playing isn't
// restarted, and on a pinned stage only the drawing on show (data-on) answers. Stages can sit under a copy layer, so the
// pointer is tested against each drawing's box rather than waiting for it to receive the event. Mounted inside the story
// section (D29); a stage marks its drawings' holder with data-own-stage.
// While the pointer is over a drawing it also carries data-hover and the pointer's place in it as --px / --py (-1 to 1
// from the centre), so a drawing can answer the pointer directly (Orbit's parallax and hover state, D56).
const CAN = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export function OwnReplay() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("section");
    if (!root) return;
    const can = matchMedia(CAN);
    const arts = [...root.querySelectorAll<HTMLElement>("[data-art]")];
    const shown = (a: HTMLElement) => a.getClientRects().length > 0 && (!a.closest("[data-own-stage]") || a.hasAttribute("data-on"));
    let inside: HTMLElement | undefined;
    const leave = (a?: HTMLElement) => {
      if (!a) return;
      a.removeAttribute("data-hover");
      a.style.removeProperty("--px");
      a.style.removeProperty("--py");
    };
    const onMove = (e: PointerEvent) => {
      if (!can.matches || e.pointerType !== "mouse") return;
      let box: DOMRect | undefined;
      const hit = arts.find((a) => {
        if (!shown(a)) return false;
        const r = a.getBoundingClientRect();
        const ok = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (ok) box = r;
        return ok;
      });
      if (hit && box) {
        hit.style.setProperty("--px", (((e.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        hit.style.setProperty("--py", (((e.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      }
      if (hit === inside) return;
      leave(inside);
      inside = hit; // replay only on entering a drawing
      hit?.setAttribute("data-hover", "");
      // only a running move holds the replay back: the hover's own transitions (Orbit's parallax) start in this same frame
      if (!hit || hit.getAnimations({ subtree: true }).some((a) => a.playState === "running" && !(a instanceof CSSTransition))) return;
      hit.removeAttribute("data-play");
      void hit.getBoundingClientRect(); // restart the CSS moves
      hit.setAttribute("data-play", "");
    };
    const onOut = () => { leave(inside); inside = undefined; };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onOut);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onOut);
      onOut();
    };
  }, []);

  return <span ref={anchor} hidden />;
}
