import { clamp, s01 } from "./math";

// An image (or any box) that fades in with the scroll: set(q), q = 0..1 (scrubbed, reversible). The page's images appear this way for now.
export function fade(box: HTMLElement) {
  let last = -1;
  return {
    set(v: number) { const o = v >= 0.999 ? 1 : s01(clamp(v, 0, 1)); if (o === last) return; last = o; box.style.opacity = o >= 1 ? "" : o.toFixed(3); },
    revert() { box.style.opacity = ""; },
  };
}
