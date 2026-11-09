// The page's smooth scroll, when it has one (v1's Lenis, set by its boot). Shared pieces (the header) scroll and lock through it; without one they use the window.
type Smooth = {
  scrollTo: (target: number | HTMLElement, opts?: { offset?: number; duration?: number; immediate?: boolean }) => void;
  stop: () => void;
  start: () => void;
};

let current: Smooth | null = null;
export const setSmooth = (s: Smooth | null) => { current = s; };
export const smooth = () => current;
