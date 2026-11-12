// Blog G's motion (one mount, through useScrollMotion).
//   - the stream (desktop, ≥ 1024): the post whose block crosses the middle of the view is "on": its picture wipes up over the last one in the sticky frame
//     (a z-index that only climbs, so going back up wipes too), the counter, the green line and the source under the frame follow; the column's other
//     posts sit back. Reduced motion: the picture switches with no wipe; nothing sits back.
//   - the jump links mark the part you are in.
//   - Inside NEAR (desktop, motion on): the band is as tall as its track is wide; the stage sticks and the track slides left, scrubbed, the green line with
//     it. A talk focused by keyboard scrolls the page to where the track shows it. Otherwise the track is a native sideways scroller.
//   - the line icons; [data-in] arrivals.
import type { Mount } from "@/lib/motion/scroll";
import { mountIcons } from "../../header/icons";
import { POSTS, SHORT_LABEL, idx } from "../data";
import { arrivals } from "../loose";

const STREAM = [POSTS[0], ...POSTS.filter((p) => p.type === "story")];

export const mount: Mount = (root, { reduced, gsap, ScrollTrigger }) => {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);
  const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const ac = new AbortController(), on = { signal: ac.signal };
  const icons = mountIcons(root, reduced);
  const offs: (() => void)[] = [() => ac.abort(), () => icons.dispose(), arrivals(root, reduced)];
  if (!reduced) root.setAttribute("data-motion", "");

  /* ── the stream ── */
  const slides = $$(".blg-slide"), blocks = [$(".blg-lead"), ...$$(".blg-entry")].filter(Boolean) as HTMLElement[];
  const ci = $(".blg-cap__i"), bar = $(".blg-cap__bar b"), src = $(".blg-cap__src"), tag = $(".blg-frame__tag");
  let cur = -1, z = 1;
  const show = (i: number) => {
    if (i === cur || !slides[i]) return;
    cur = i;
    const s = slides[i];
    if (reduced) slides.forEach((x) => x.classList.toggle("is-on", x === s));
    else { s.classList.remove("is-on"); s.style.zIndex = String(++z); void s.offsetWidth; s.classList.add("is-on"); }
    blocks.forEach((b) => b.classList.toggle("is-on", +(b.dataset.i || 0) === i));
    if (ci) ci.textContent = idx(i);
    if (bar) bar.style.transform = `scaleX(${(i / Math.max(1, STREAM.length - 1)).toFixed(3)})`;
    if (src) src.textContent = STREAM[i].source;
    if (tag) tag.lastChild!.textContent = i === 0 ? "Latest" : SHORT_LABEL[STREAM[i].type];
  };
  blocks.forEach((b) => {
    const i = +(b.dataset.i || 0);
    ScrollTrigger.create({ trigger: b, start: "top 55%", end: "bottom 55%", onToggle: (s) => { if (s.isActive) show(i); } });
  });
  // the lead is on until the first story arrives (the page starts on it)
  show(0);
  // a post focused by keyboard is on at once
  root.addEventListener("focusin", (e) => {
    const b = (e.target as Element).closest?.<HTMLElement>(".blg-lead, .blg-entry");
    if (b) show(+(b.dataset.i || 0));
  }, on);

  /* ── the jump links ── */
  const jumps = $$(".blg-jump__a");
  jumps.forEach((a) => {
    const t = root.querySelector(a.getAttribute("href")!);
    if (t) ScrollTrigger.create({ trigger: t, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-here", s.isActive) });
  });

  /* ── Inside NEAR ── */
  const talks = $(".blg-talks"), track = $(".blg-talks__track"), tbar = $(".blg-talks__bar b"), ti = $(".blg-talks__i");
  if (talks && track && !reduced) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      talks.classList.add("is-run");
      const dist = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const size = () => { talks.style.height = `${Math.round(dist() * 1.1 + innerHeight)}px`; };
      size();
      const items = [...track.children] as HTMLElement[];
      const st = ScrollTrigger.create({
        trigger: talks, start: "top top", end: () => `+=${Math.round(dist() * 1.1)}`, invalidateOnRefresh: true, onRefreshInit: size,
        onUpdate: (s) => {
          const x = s.progress * dist();
          track.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
          if (tbar) tbar.style.transform = `scaleX(${s.progress.toFixed(4)})`;
          // the talk nearest the track's left edge is "on"
          let k = 0; items.forEach((it, j) => { if (it.offsetLeft - x < track.clientWidth * 0.35) k = j; });
          items.forEach((it, j) => it.classList.toggle("is-on", j === k));
          if (ti) ti.textContent = idx(k);
        },
      });
      const onFocus = (e: FocusEvent) => {
        const it = (e.target as Element).closest?.<HTMLElement>(".blg-talk"); if (!it || !dist()) return;
        const p = Math.max(0, Math.min(1, (it.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft)) / dist()));
        window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" as ScrollBehavior });
      };
      track.addEventListener("focusin", onFocus);
      return () => { track.removeEventListener("focusin", onFocus); talks.classList.remove("is-run"); talks.style.height = ""; track.style.transform = ""; if (tbar) tbar.style.transform = ""; };
    });
    offs.push(() => mm.revert());
  }

  return () => offs.reverse().forEach((f) => f());
};
