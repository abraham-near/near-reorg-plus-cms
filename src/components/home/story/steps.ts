// The "Own your" drawings on a pinned stage (D18, D29): one on show at a time, chosen by the scrubbed timeline's
// progress; the arriving drawing plays its one move (data-play), the others stop. `also` runs on every update too (the
// rail's parallax, D32). Returns a cleanup for gsap.matchMedia.
export function playSteps(tl: gsap.core.Timeline, arts: HTMLElement[], at: number[], also?: () => void) {
  let current = -2;
  const set = (step: number) => {
    if (step === current) return;
    arts.forEach((a, k) => {
      a.toggleAttribute("data-on", k === step);
      if (k === step) { a.removeAttribute("data-play"); void a.getBoundingClientRect(); a.setAttribute("data-play", ""); }
      else a.removeAttribute("data-play");
    });
    current = step;
  };
  const update = () => {
    const p = tl.progress();
    let step = -1;
    at.forEach((t, i) => { if (p >= t) step = i; });
    set(step);
    also?.();
  };
  tl.eventCallback("onUpdate", update);
  update();
  return () => {
    tl.eventCallback("onUpdate", null);
    arts.forEach((a) => { a.removeAttribute("data-on"); a.removeAttribute("data-play"); });
  };
}
