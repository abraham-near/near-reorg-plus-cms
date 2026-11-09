// Go deeper's motion (r17 v1, js/deeper.js). The tabs are React state (GoDeeper.tsx); a switch reaches this file as FILTER_EVENT on the section.
//   - the featured photo fades in with the scroll (scrubbed, reversible); a filter switch replays the fade (1.1 s, power2.out) on the new photo.
//   - >= 1100 wide: the list column is a WINDOW the photo's height showing --n rows (4, or 3 under 800 px tall). It scrolls inside itself (no pin) beside our own bar,
//     always visible (draggable thumb; a click on the track takes the list there). The wheel moves the list while it can move that way, then the page.
//     The rows draw in as the section comes up; "View everything" sits on the featured item's meta line (--foot-y).
//   - below 1100 wide: the rows draw in one by one as they enter (the hairline, then the text).
// Reduced motion: nothing here runs; the markup is the finished layout and the tabs still work.
import type { MotionCtx } from "@/lib/motion/scroll";
import { clamp, s01 } from "@/lib/motion/math";

export const FILTER_EVENT = "gd:filter";
export type FilterDetail = { replay: boolean };

type ST = ReturnType<MotionCtx["ScrollTrigger"]["create"]>;
type Pane = { p: HTMLElement; win: HTMLElement | null; sb: HTMLElement | null; th: HTMLElement | null; rows: HTMLElement[] };

const setK = (row: HTMLElement, v: number) => {
  row.style.setProperty("--k", s01(v * 1.6).toFixed(3));
  row.style.setProperty("--kt", s01((v - 0.25) / 0.75).toFixed(3));
};
const clearK = (row: HTMLElement) => { row.style.removeProperty("--k"); row.style.removeProperty("--kt"); };

export function mount(root: HTMLElement, ctx: MotionCtx) {
  if (ctx.reduced) return;
  const { gsap, ScrollTrigger } = ctx;
  const html = document.documentElement;
  const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const activePanel = () => panels.find((p) => p.hasAttribute("data-active"));
  html.setAttribute("data-gd", "");

  const rowTs: { panel: HTMLElement | null; st: ST }[] = [];
  let win: { filter: () => void } | null = null;

  /* below 1100 wide: each row draws over the first 64 px after it enters */
  const perRow = () => {
    root.querySelectorAll<HTMLElement>(".gd-row").forEach((row) => {
      setK(row, 0);
      const st = ScrollTrigger.create({ trigger: row, start: "clamp(top bottom)", end: "clamp(top bottom-=64)", onUpdate: (s) => setK(row, s.progress), onRefresh: (s) => setK(row, s.progress) });
      rowTs.push({ panel: row.closest<HTMLElement>('[role="tabpanel"]'), st });
    });
    return () => { rowTs.forEach((t) => t.st.kill()); rowTs.length = 0; root.querySelectorAll<HTMLElement>(".gd-row").forEach(clearK); };
  };

  /* desktop: the windowed list, scrolling inside itself */
  const windowed = () => {
    const panes: Pane[] = panels.map((p) => ({
      p, win: p.querySelector<HTMLElement>(".gd-win"), sb: p.querySelector<HTMLElement>(".gd-sb"), th: p.querySelector<HTMLElement>(".gd-sb-th"),
      rows: [...p.querySelectorAll<HTMLElement>(".gd-row")],
    }));
    html.setAttribute("data-gdwin", "");
    const inner = root.querySelector<HTMLElement>(".gd-inner")!, foot = root.querySelector<HTMLElement>(".gd-foot");
    const panelsBox = root.querySelector<HTMLElement>(".gd-panels")!;
    const N = () => Math.max(1, Math.min(5, parseInt(getComputedStyle(panelsBox).getPropertyValue("--n"), 10) || 4));

    /* the bar: the thumb's height is the visible share of the list, its place the scroll's */
    const bar = (q: Pane) => {
      const { win: w, sb, th } = q; if (!w || !sb || !th) return;
      const H = w.clientHeight, S = w.scrollHeight, T = sb.clientHeight, over = S > H + 1;
      sb.toggleAttribute("data-off", !over); if (!over) return;
      const h = Math.max(28, Math.round((T * H) / S)), y = Math.round((T - h) * (w.scrollTop / (S - H)));
      th.style.height = h + "px"; th.style.transform = `translate3d(0,${y}px,0)`;
    };
    const off: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn, o); off.push(() => el.removeEventListener(ev, fn, o));
    };
    panes.forEach((q) => {
      const { win: w, sb, th } = q; if (!w || !sb || !th) return;
      on(w, "scroll", () => bar(q), { passive: true });
      /* the wheel: the list first, the page once the list cannot move that way */
      on(w, "wheel", (e) => {
        if (e.ctrlKey) return;
        const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * w.clientHeight : e.deltaY;
        const max = w.scrollHeight - w.clientHeight, t = w.scrollTop;
        if (!((d > 0 && t < max - 0.5) || (d < 0 && t > 0.5))) return;
        e.preventDefault(); e.stopPropagation();
        w.scrollTop = clamp(t + d, 0, max);
      }, { passive: false });
      /* drag the thumb */
      on(th, "pointerdown", (e) => {
        e.preventDefault(); e.stopPropagation(); th.setPointerCapture(e.pointerId); sb.setAttribute("data-drag", "");
        const y0 = e.clientY, s0 = w.scrollTop, T = sb.clientHeight, h = th.offsetHeight, max = w.scrollHeight - w.clientHeight;
        const mv = (ev: PointerEvent) => { w.scrollTop = clamp(s0 + (ev.clientY - y0) * (max / Math.max(1, T - h)), 0, max); };
        const up = () => { sb.removeAttribute("data-drag"); th.removeEventListener("pointermove", mv); th.removeEventListener("pointerup", up); th.removeEventListener("pointercancel", up); };
        th.addEventListener("pointermove", mv); th.addEventListener("pointerup", up); th.addEventListener("pointercancel", up);
      });
      /* a click on the track brings that place of the list */
      on(sb, "pointerdown", (e) => {
        if (e.target === th) return;
        const r = sb.getBoundingClientRect(), h = th.offsetHeight, max = w.scrollHeight - w.clientHeight;
        const k = clamp((e.clientY - r.top - h / 2) / Math.max(1, r.height - h), 0, 1);
        w.scrollTo({ top: k * max, behavior: "smooth" });
      });
      bar(q);
    });
    /* the rows draw in as the section comes up (one clock, staggered by row; the rows below the window are whole) */
    const drawIn = (v: number) => panes.forEach((q) => q.rows.forEach((row, j) => setK(row, clamp((v * 1.5 - 0.09 * Math.min(j, N())) / 0.7, 0, 1))));
    ScrollTrigger.create({ trigger: root, start: "top bottom", end: "top 20%", onUpdate: (s) => drawIn(s.progress), onRefresh: (s) => drawIn(s.progress) });
    /* "View everything" on the featured item's meta line (the photos share one height, so one line serves every filter) */
    const place = () => {
      const meta = activePanel()?.querySelector(".gd-feat .gd-meta"); if (!meta || !foot) return;
      const r = meta.getBoundingClientRect(), ri = inner.getBoundingClientRect();
      inner.style.setProperty("--foot-y", (r.top + r.height / 2 - ri.top - foot.offsetHeight / 2).toFixed(1) + "px");
    };
    place();
    const ro = new ResizeObserver(() => { place(); panes.forEach(bar); }); ro.observe(root);
    let raf = 0;
    win = {
      filter() {
        const q = panes.find((x) => x.p.hasAttribute("data-active")); if (q?.win) q.win.scrollTop = 0;
        cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { place(); panes.forEach(bar); });
      },
    };
    return () => {
      win = null; cancelAnimationFrame(raf); off.forEach((f) => f()); ro.disconnect(); html.removeAttribute("data-gdwin");
      panes.forEach((q) => { if (q.win) q.win.scrollTop = 0; if (q.th) { q.th.style.height = ""; q.th.style.transform = ""; } q.sb?.removeAttribute("data-off"); q.rows.forEach(clearK); });
      inner.style.removeProperty("--foot-y");
    };
  };

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1100px)", windowed);
  mm.add("(max-width: 1099px)", perRow);

  /* the featured photo: a plain fade, scrubbed as it comes into view, replayed when a filter switches it in */
  let media: HTMLElement | null = null, img: HTMLImageElement | null = null, st: ST | null = null;
  let scrollQ = 0, playQ = 1, lastQ = -1, play = 0;
  const draw = () => {
    if (!img) return;
    const q = Math.min(scrollQ, playQ); if (q === lastQ) return; lastQ = q;
    img.style.opacity = q >= 0.999 ? "" : s01(q).toFixed(3);
  };
  const startPlay = () => {
    /* 1.1 s, power2.out, on its own clock that steps at most 50 ms a frame (a long frame never skips the fade) */
    cancelAnimationFrame(play);
    let v = 0, t0 = performance.now(); playQ = 0; lastQ = -1; draw();
    const step = (t: number) => { v = Math.min(1, v + Math.min(50, t - t0) / 1100); t0 = t; playQ = 1 - (1 - v) * (1 - v); draw(); play = v < 1 ? requestAnimationFrame(step) : 0; };
    play = requestAnimationFrame(step);
  };
  const attach = (replay: boolean) => {
    const m = activePanel()?.querySelector<HTMLElement>("[data-media]"); if (!m) return;
    if (m !== media) {
      media?.removeAttribute("data-done");
      if (img) img.style.opacity = "";
      media = m; img = m.querySelector("img"); m.setAttribute("data-done", "");
      if (img && img.loading === "lazy") img.loading = "eager";
      st?.kill();
      st = ScrollTrigger.create({ trigger: m, start: "clamp(top 92%)", end: "clamp(top 38%)", onUpdate: (s) => { scrollQ = s.progress; draw(); }, onRefresh: (s) => { scrollQ = s.progress; lastQ = -1; draw(); } });
      scrollQ = st.progress; lastQ = -1;
    }
    if (replay) startPlay(); else draw();
  };
  /* the other filters' photos load as the section comes near, so a switch rarely waits */
  ScrollTrigger.create({ trigger: root, start: "top 160%", once: true, onEnter: () => panels.forEach((p) => { const i = p.querySelector<HTMLImageElement>("[data-media] img"); if (i && i.loading === "lazy") i.loading = "eager"; }) });
  attach(false);

  const onFilter = (e: Event) => {
    const { replay } = (e as CustomEvent<FilterDetail>).detail;
    attach(replay);
    win?.filter();
    rowTs.forEach((t) => { if (t.panel?.hasAttribute("data-active")) t.st.refresh(); });   /* only this section's own triggers */
  };
  root.addEventListener(FILTER_EVENT, onFilter);

  return () => {
    root.removeEventListener(FILTER_EVENT, onFilter);
    cancelAnimationFrame(play); st?.kill(); mm.revert();
    if (img) img.style.opacity = "";
    media?.removeAttribute("data-done");
    html.removeAttribute("data-gd");
  };
}
