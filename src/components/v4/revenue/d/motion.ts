// Revenue option D, the scene (desktop ≥ 860 × 640, motion on). The section grows to T vh and its stage sticks for the last 100; one scrubbed timeline,
// in vh of scroll (0: the section's top at the view's foot, 100: the stage sticks, T: it lets go):
//   0–100   the stage comes up on the Stack's ink: the frame's two lines draw down, the heading and the lede rise in the middle of the screen;
//   112–146 they glide up to their row; only then the total rises in the middle, large, and counts up to $11.61M (152–196);
//   204–244 the calm beat: the ground turns to paper on a line that rises from the foot (where the figures are), the text turning with it, each line of
//           text exactly where the edge crosses it (a background clipped to the text: readable on both sides at every moment);
//   248–284 the total settles into its cell while the grid draws (rules, dividers, then the + marks);
//   262–314 the iso chart builds (./iso.ts): the floor and the wall come in, the columns rise month by month and the cumulative line draws along
//           them on the back wall (both rebuilt from the time), the $11.61M tag pops at its end;
//   290–322 the gauge fills to 37 %;  304–334 the last 30 days count up;  324–336 the button;  the finished bento holds to the release.
// The header's tone follows the ground (data-nav-tone). Phones, short screens, reduced motion: nothing here runs; the markup is the finished paper bento.
import type { MotionCtx } from "@/lib/motion/scroll";
import { smooth } from "@/lib/motion/smooth";
import { COL_H, column, line } from "./iso";

const T = 350;

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  if (reduced) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 860px) and (min-height: 640px)", () => {
    const $ = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s)!;
    const $$ = <E extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<E>(s)];
    const stage = $(".rvd-stage"), edgeLine = $(".rvd-edge");
    root.classList.add("is-scene");
    root.style.setProperty("--rvd-h", `${T}vh`);

    // the figures' display copies (the sr-only copies keep the final values)
    const counts = $$("[data-count]");
    const show = (el: HTMLElement, v: number) => { el.textContent = `${el.dataset.pre || ""}${v.toFixed(Number(el.dataset.dec || 0))}${el.dataset.suf || ""}`; };
    const final = (el: HTMLElement) => show(el, Number(el.dataset.to));
    counts.forEach((el) => show(el, 0));

    // positions inside the stage, from layout (transforms ignored)
    const off = (el: HTMLElement) => {
      let x = 0, y = 0, e: HTMLElement | null = el;
      while (e && e !== stage) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent as HTMLElement | null; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    };
    const headIns = [$(".rvd-h .rvd-in"), $(".rvd-l .rvd-in")];
    const tIn = $(".rvd-t .rvd-in");
    /** the heading row, centred in the stage */
    const headY = () => {
      const bs = headIns.map(off), t = Math.min(...bs.map((b) => b.y)), b = Math.max(...bs.map((b) => b.y + b.h));
      return stage.offsetHeight / 2 - (t + b) / 2;
    };
    /** the total, large, in the middle of the room left under the heading row */
    const story = () => {
      const b = off(tIn), hc = off($(".rvd-h")), Hs = stage.offsetHeight, Ws = stage.offsetWidth, top = hc.y + hc.h;
      const s = Math.max(1, Math.min(1.5, (Hs - top - 64) / b.h, (Ws * 0.62) / b.w));
      return { x: Ws / 2 - (b.x + b.w / 2), y: top + (Hs - top) / 2 - (b.y + b.h / 2), s };
    };

    // the ground: the paper's edge (px from the stage's top), and every text on screen through the swap coloured on each side of it
    const inks = $$(".rvd-ink");
    // everything here is read off the timeline's time (not tweened), so a refresh or a jump can never leave it behind
    const SWAP = [204, 40] as const, swapE = gsap.parseEase("power1.inOut"), countE = gsap.parseEase("power2.out"), colE = gsap.parseEase("power2.out");
    const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const runs: { el: HTMLElement; at: number; dur: number; to: number; last: string }[] = [];
    const count = (el: HTMLElement, at: number, dur: number) => runs.push({ el, at, dur, to: Number(el.dataset.to), last: "" });
    const cols = COL_H.map((h, i) => {
      const g = $(`.rvd-col[data-i="${i}"]`), [l, r, t] = [...g.querySelectorAll("path")];
      return { g, l, r, t, h, at: 262 + 3 * i, last: -1 };
    });
    const run = $(".rvd-run"), head = $(".rvd-head");
    let lastQ = -1;
    const build = (time: number) => {
      cols.forEach((c) => {
        const k = Math.round(colE(c01((time - c.at) / 8)) * 1000) / 1000;
        if (k === c.last) return; c.last = k;
        c.g.style.visibility = k > 0 ? "" : "hidden";
        if (k > 0) { const f = column(Number(c.g.dataset.i), c.h * k); c.l.setAttribute("d", f.l); c.r.setAttribute("d", f.r); c.t.setAttribute("d", f.t); }
      });
      const q = Math.round(c01((time - 267) / 47) * 2000) / 2000;
      if (q !== lastQ) {
        lastQ = q; const L = line(q);
        run.setAttribute("d", L.d); head.setAttribute("cx", L.hx.toFixed(3)); head.setAttribute("cy", L.hy.toFixed(3));
        run.style.visibility = head.style.visibility = q > 0 ? "" : "hidden";
      }
    };
    let tone = "", phase = "", tlr: gsap.core.Timeline | null = null;
    const paint = () => {
      if (!tlr) return;
      const time = tlr.time();
      build(time);
      runs.forEach((r) => {
        const v = r.to * countE(c01((time - r.at) / r.dur)), s = v.toFixed(Number(r.el.dataset.dec || 0));
        if (s !== r.last) { r.last = s; show(r.el, v); }
      });
      const p = swapE(c01((time - SWAP[0]) / SWAP[1])), H = stage.offsetHeight, edge = H * (1 - p);
      stage.style.setProperty("--edge", `${edge.toFixed(1)}px`);
      const ph = p <= 0.001 ? "ink" : p >= 0.999 ? "paper" : "edge";
      edgeLine.style.opacity = ph === "edge" ? Math.min(1, p * 12, (1 - p) * 8).toFixed(3) : "0";
      if (ph === "edge") {   // only while the edge crosses the screen: each text's own offset to it (in its own, possibly scaled, box)
        const vy = stage.getBoundingClientRect().top + edge;
        inks.forEach((el) => {
          const r = el.getBoundingClientRect(), k = el.offsetHeight ? r.height / el.offsetHeight : 1;
          el.style.setProperty("--e", `${((vy - r.top) / (k || 1)).toFixed(1)}px`);
        });
      } else if (ph !== phase) inks.forEach((el) => el.style.setProperty("--e", ph === "paper" ? "-99999px" : "99999px"));
      phase = ph;
      const t = p > 0.96 ? "light" : "dark";
      if (t !== tone) { tone = t; root.setAttribute("data-nav-tone", t); }
    };

    const frames = $$(".rvd-fl, .rvd-fr"), h2 = $(".rvd-h2"), lede = $(".rvd-lede");
    const tParts = $$(".rvd-t .rvd-in > *");
    const hrs = $$(".rvd-hr"), vrs = $$(".rvd-vr"), xs = $$(".rvd-x");
    const chTop = $(".rvd-c__top"), axes = $$(".rvd-stage3, .rvd-tick, .rvd-fin"), tag = $(".rvd-tag > b");
    const cta = $(".rvd-cta");
    const gParts = $$(".rvd-g8 > :not(.rvd-hr, .rvd-x)"), gVal = $<SVGPathElement>("[data-gauge]"), gTrack = $<SVGPathElement>(".rvd-gauge__track");
    const dParts = $$(".rvd-d > :not(.rvd-hr, .rvd-x, .rvd-vr)");
    const cnt = (sel: string) => $(`${sel} [data-count]`);

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true, onRefresh: () => { paint(); requestAnimationFrame(paint); } },
      onUpdate: paint,
    });
    tl.set({}, {}, T);
    tlr = tl;

    // 1 · the stage comes up: the frame draws down, the heading and the lede rise in the middle
    tl.fromTo(frames, { scaleY: 0 }, { scaleY: 1, duration: 70, ease: "power2.inOut" }, 12);
    tl.set([h2, lede], { y: 40, autoAlpha: 0 }, 0);
    tl.to(h2, { y: 0, autoAlpha: 1, duration: 40, ease: "power3.out" }, 34);
    tl.to(lede, { y: 0, autoAlpha: 1, duration: 40, ease: "power3.out" }, 46);
    tl.fromTo(headIns, { y: headY }, { y: 0, duration: 34, ease: "power2.inOut" }, 112);

    // 2 · the total, large in the middle, counting up
    tl.fromTo(tIn, { x: () => story().x, y: () => story().y, scale: () => story().s }, { x: 0, y: 0, scale: 1, duration: 36, ease: "power2.inOut" }, 248);
    tl.set(tParts, { y: 28, autoAlpha: 0 }, 0);
    tl.to(tParts, { y: 0, autoAlpha: 1, duration: 26, stagger: 7, ease: "power3.out" }, 148);
    count(cnt(".rvd-big"), 152, 44);

    // 3 · the ground turns to paper (the calm beat: only the heading and the total on screen)
    tl.set({}, {}, SWAP[0] + SWAP[1]);   // (paint() reads it off the time)

    // 4 · the grid draws: rules, dividers, then the + marks
    tl.set(hrs, { scaleX: 0 }, 0);
    tl.to(hrs, { scaleX: 1, duration: 24, stagger: 2.5, ease: "power2.inOut" }, 248);
    tl.set(vrs, { scaleY: 0 }, 0);
    tl.to(vrs, { scaleY: 1, duration: 24, stagger: 3, ease: "power2.inOut" }, 256);
    tl.set(xs, { autoAlpha: 0, scale: 0.2, rotation: -90 }, 0);
    tl.to(xs, { autoAlpha: 1, scale: 1, rotation: 0, duration: 8, stagger: 0.7, ease: "power2.out" }, 268);

    // 5 · the chart: the title, the scales, then the bars month by month and the line along them
    tl.set([chTop, ...axes], { autoAlpha: 0 }, 0);
    tl.set(chTop, { y: 16 }, 0);
    tl.to(chTop, { y: 0, autoAlpha: 1, duration: 16, ease: "power2.out" }, 258);
    tl.to(axes, { autoAlpha: 1, duration: 14, stagger: 0.6 }, 262);
    tl.set({}, {}, 316);   // the columns (262 + 3i, 8 each) and the line (267–314): paint() builds them from the time
    tl.fromTo(tag, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 8, ease: "power2.out" }, 312);

    // 6 · the gauge fills to its share
    tl.set(gParts, { y: 20, autoAlpha: 0 }, 0);
    tl.to(gParts, { y: 0, autoAlpha: 1, duration: 16, stagger: 5, ease: "power2.out" }, 290);
    tl.fromTo(gTrack, { strokeDasharray: "0 100" }, { strokeDasharray: "100 100", duration: 14, ease: "power2.inOut" }, 290);
    tl.fromTo(gVal, { strokeDasharray: "0 100" }, { strokeDasharray: `${gVal.dataset.gauge} 100`, duration: 26, ease: "power2.out" }, 296);
    count(cnt(".rvd-gauge__v"), 296, 26);

    // 7 · the last 30 days
    tl.set(dParts, { y: 20, autoAlpha: 0 }, 0);
    tl.to(dParts, { y: 0, autoAlpha: 1, duration: 16, stagger: 5, ease: "power2.out" }, 304);
    const d = $$(".rvd-d [data-count]");
    count(d[0], 308, 22);
    count(d[1], 312, 22);

    // 8 · the button (opacity only: it stays focusable; a focus brings the scene to its end)
    tl.fromTo(cta, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 12, ease: "power2.out" }, 324);

    const onFocus = (e: FocusEvent) => {
      const st = tl.scrollTrigger; if (!st || tl.progress() > 0.95 || !(e.target as Element).closest?.(".rvd-cta")) return;
      const s = smooth(); if (s) s.scrollTo(st.end, { immediate: true }); else window.scrollTo(0, st.end);
    };
    root.addEventListener("focusin", onFocus);
    let live = true;
    document.fonts?.ready.then(() => { if (live) ScrollTrigger.refresh(); });
    paint();

    return () => {
      live = false; root.removeEventListener("focusin", onFocus);
      tl.scrollTrigger?.kill(); tl.revert();
      counts.forEach(final);
      build(1e4); cols.forEach((c) => (c.g.style.visibility = "")); run.style.visibility = head.style.visibility = "";
      inks.forEach((el) => el.style.removeProperty("--e"));
      stage.style.removeProperty("--edge"); edgeLine.style.opacity = "";
      root.classList.remove("is-scene"); root.style.removeProperty("--rvd-h");
      root.setAttribute("data-nav-tone", "light");
    };
  });
  return () => mm.revert();
}
