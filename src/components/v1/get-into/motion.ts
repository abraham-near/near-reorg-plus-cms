import type { Mount } from "@/components/v1/motion";
import { setter, scrub } from "@/components/v1/motion";
import { sat, s01, out3 } from "@/lib/motion/math";
import { staircase } from "@/lib/motion/staircase";
import { fade } from "@/lib/motion/fade";
import { follow } from "@/lib/motion/follow";

/* Scrubbed, reversible ([data-on] on the section):
   - the head (top 92% -> 50%): the hairline draws, the heading climbs the staircase;
   - the list (top 94% -> 40%): each row's hairline draws and its text rises, staggered; the preview fades in, then its caption shows. */
export const mount: Mount = (root, { ScrollTrigger, reduced }) => {
  if (reduced) return;
  const q = <T extends HTMLElement>(k: string) => root.querySelector<T>(`[data-k="${k}"]`);
  const inner = q("inner"), h = q("h"), list = q("list"), frame = q("frame");
  if (!inner || !h || !list) return;
  const rows = [...root.querySelectorAll<HTMLElement>('[data-k="row"]')];

  root.setAttribute("data-on", "");
  const setV = setter();
  const sh = staircase(h);
  const fd = frame ? fade(frame) : null;
  const run = (P: number) => {
    setV(list, "--hb", s01(sat(P, 0.55, 0.95)));
    rows.forEach((row, i) => {
      const p = sat(P, i * 0.16, 0.62 + i * 0.16);
      setV(row, "--h", s01(sat(p, 0, 0.5)));
      setV(row, "--a", out3(sat(p, 0.15, 0.6))); setV(row, "--b", out3(sat(p, 0.28, 0.75))); setV(row, "--c", out3(sat(p, 0.42, 0.95)));
    });
    if (fd) fd.set(sat(P, 0.05, 0.85));
    setV(inner, "--pc", s01(sat(P, 0.8, 1)));
  };
  const sts = [
    scrub(inner, "clamp(top 92%)", "clamp(top 50%)", (P) => { setV(inner, "--rk", s01(sat(P, 0, 0.55))); sh.render(sat(P, 0.1, 1)); }, () => sh.measure()),
    scrub(list, "clamp(top 94%)", "clamp(top 40%)", run),
  ];
  let alive = true;
  document.fonts?.ready.then(() => { if (alive) { sh.measure(); sh.render(); } });
  const unfollow = follow(ScrollTrigger, root, sts);

  return () => {
    alive = false; unfollow(); sh.revert(); fd?.revert();
    root.removeAttribute("data-on");
    [inner, list, ...rows].forEach((el) => el.removeAttribute("style"));
  };
};
