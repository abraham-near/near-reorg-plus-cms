import { clamp, s01 } from "@/lib/motion/math";
import { staircase } from "@/lib/motion/staircase";
import { fade } from "@/lib/motion/fade";
import { scrub, type Mount } from "@/lib/motion/scroll";

// Origin's motion, every part a pure function of the scroll (scrubbed, reversible), each on the element's own position:
//   - the green bar draws down the seam and the grey panel opens from it, left -> right   (.og-inner: top 92% -> top 45%)
//   - the heading climbs the staircase word by word, the Kepler phrase last              (h2: top 94% -> top 52%)
//   - the photo fades in                                                                  (figure: top 94% -> top 40%)
//   - the account rises line by line (one clock per line), then the button               (.og-body: top 96% -> bottom 92%)
// Reduced motion: nothing is split or hidden; the static markup is the finished layout.
export const mount: Mount = (root, { ScrollTrigger, reduced }) => {
  if (reduced) return;
  const inner = root.querySelector<HTMLElement>(".og-inner"), panel = root.querySelector<HTMLElement>(".og-panel");
  const h = root.querySelector<HTMLElement>(".og-h"), fig = root.querySelector<HTMLElement>(".og-fig"), img = root.querySelector<HTMLElement>(".og-img");
  const body = root.querySelector<HTMLElement>(".og-body"), p = root.querySelector<HTMLElement>(".og-p"), cta = root.querySelector<HTMLElement>(".og-cta");
  if (!inner || !panel || !h || !fig || !img || !body || !p) return;
  root.setAttribute("data-on", "");

  const head = staircase(h);
  const acc = staircase(p, { dw: 0, dl: 0.55, dur: 1.4, span: 3.6 });   // the account: the words of one line share one clock
  const photo = fade(img);

  let rule = 1, sh = 1, sb = 1;
  const renderRule = () => { panel.style.setProperty("--bk2", s01(rule / 0.5).toFixed(4)); panel.style.setProperty("--pk", s01((rule - 0.22) / 0.62).toFixed(4)); };
  // the lines share the first 84 % of the clock; the button rises over the last part
  const renderBody = () => { acc.render(clamp(sb / 0.84, 0, 1)); if (cta) cta.style.setProperty("--bk", s01((sb - 0.7) / 0.3).toFixed(3)); };

  const sts = [
    scrub(inner, "top 92%", "top 45%", (v) => { rule = v; renderRule(); }),
    scrub(h, "top 94%", "top 52%", (v) => { sh = v; head.render(sh); }, () => { head.measure(); acc.measure(); renderBody(); }),
    scrub(body, "top 96%", "bottom 92%", (v) => { sb = v; renderBody(); }),
    scrub(fig, "clamp(top 94%)", "clamp(top 40%)", (v) => photo.set(v)),
  ];

  // the section moves without a global refresh when a pin above changes length (Go deeper's filter refreshes only its own trigger): re-measure our own triggers
  let top = -1, raf = 0;
  const absTop = () => Math.round(root.getBoundingClientRect().top + scrollY);
  const onRefresh = () => { top = absTop(); };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const t = absTop(); if (top >= 0 && Math.abs(t - top) > 1) { top = t; sts.forEach((s) => s.refresh()); } else if (top < 0) top = t; });
  });
  ro.observe(document.body);

  return () => {
    ro.disconnect(); cancelAnimationFrame(raf);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    head.revert(); acc.revert(); photo.revert();
    panel.style.removeProperty("--bk2"); panel.style.removeProperty("--pk"); cta?.style.removeProperty("--bk");
    root.removeAttribute("data-on");
  };
};
