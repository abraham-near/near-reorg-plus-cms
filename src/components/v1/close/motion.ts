import type { Mount } from "@/components/v1/motion";
import { setter, scrub } from "@/components/v1/motion";
import { sat, s01, out3 } from "@/lib/motion/math";
import { staircase } from "@/lib/motion/staircase";
import { fade } from "@/lib/motion/fade";
import { follow } from "@/lib/motion/follow";

/* Scrubbed, reversible ([data-on] on the section):
   - the head (its top 92% -> 45%): the hairline draws (0 - .45), the N tile fades in (.05 - .55), the heading climbs the staircase, "you" last (.12 - .78),
     the line rises line by line (.36 - 1);
   - the form (its top 98% -> 70%): the unit rises in (0 - .7), then the note (.45 - 1). */
export const mount: Mount = (root, { ScrollTrigger, reduced }) => {
  if (reduced) return;
  const q = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`);
  const inner = q("inner"), head = q("head"), h = q("h"), lede = q("lede"), form = q("form"), box = q("mark");
  if (!inner || !head || !h || !lede || !form) return;

  root.setAttribute("data-on", "");
  const setV = setter();
  const sh = staircase(h), sl = staircase(lede, { dw: 0, dl: 0.55, dur: 1.4, span: 3.6 });
  const fd = box ? fade(box) : null;
  const runHead = (P: number) => {
    setV(inner, "--rk", s01(sat(P, 0, 0.45)));
    if (fd) fd.set(sat(P, 0.05, 0.55));
    sh.render(sat(P, 0.12, 0.78)); sl.render(sat(P, 0.36, 1));
  };
  const runForm = (P: number) => { setV(form, "--f", out3(sat(P, 0, 0.7))); setV(form, "--n", s01(sat(P, 0.45, 1))); };
  const sts = [
    scrub(head, "clamp(top 92%)", "clamp(top 45%)", runHead, () => { sh.measure(); sl.measure(); }),
    scrub(form, "clamp(top 98%)", "clamp(top 70%)", runForm),
  ];
  let alive = true;
  document.fonts?.ready.then(() => { if (alive) { sh.measure(); sl.measure(); sh.render(); sl.render(); } });
  const unfollow = follow(ScrollTrigger, root, sts);

  return () => {
    alive = false; unfollow(); sh.revert(); sl.revert(); fd?.revert();
    root.removeAttribute("data-on");
    inner.style.removeProperty("--rk"); form.style.removeProperty("--f"); form.style.removeProperty("--n");
  };
};
