// Home v1 · the Stack's interactions (r17 v1 js/stack.js), from Lawrence's StackLayers.tsx + StackInteractions.tsx, minus his pinned mode (here the section is normal flow) and the hand-off thread:
//   - a vertical ARIA tablist (ArrowUp/ArrowDown/Home/End, aria-selected, roving tabindex); panels share one grid cell, the hidden ones are inert; NEAR Protocol is selected first;
//   - the drawing shows the selection (data-active-layer: the selected ring lifts); hovering a row or a ring (pointer) highlights that layer and drops the others to charcoal (data-hl);
//     clicking a ring in the drawing selects its layer; a layer that has not built yet cannot be highlighted;
//   - the build-in: when the drawing comes into view the layers build outwards, core first, 320 ms apart (data-build -1 -> 0 -> 1 -> 2 -> 3); reversible (scrolling back up past the same
//     point puts the drawing away again) so the scroll alone decides what is showing;
//   - the tabs, the text and the close rise softly as they come into view (data-rise), also reversible.
// No JS: every panel shows, stacked, and every ring is drawn. Reduced motion: no build-in, no rise; the tabs and the highlight still work.
// r17 v1 runs the 'rise' entrance (html[data-stk-enter="rise"], world/head.ts): the band rises from the bottom with the scroll while the rail's dark is still closing (the rail writes --ov
// on .stk for that overlap). r17's other entrance ('place', v2 only) is not part of v1 and is not ported.
import type { V1Ctx, Dispose } from "../ctx";
import { mountStackLive } from "../../v4/stack-live";

const KEYS = ["protocol", "intents", "ai", "com"];            /* core first, as the list reads (his layers.ts order) */

export function mountStack(ctx: V1Ctx): Dispose {
  const html = document.documentElement;
  const root = document.querySelector<HTMLElement>("[data-stack]");
  const svg = root?.querySelector<SVGSVGElement>("[data-iso]");
  if (!root || !svg) return () => {};
  const { signal, ScrollTrigger } = ctx;
  const on = { signal };
  const RM = html.hasAttribute("data-rm") || ctx.reduced;
  const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')], panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  html.setAttribute("data-stk", "");                          /* his html[data-js]: panels now share one cell and only the selected one shows */
  const setActive = (k: string | null | undefined) => {
    if (!k || !KEYS.includes(k)) return;
    root.setAttribute("data-active-layer", k);
    tabs.forEach((t) => { const sel = t.dataset.key === k; t.setAttribute("aria-selected", sel ? "true" : "false"); t.tabIndex = sel ? 0 : -1; });
    panels.forEach((p) => { const sel = p.id === "stack-panel-" + k; p.toggleAttribute("data-active", sel); p.inert = !sel; });
  };
  setActive("protocol");

  /* the highlight: only a layer that is showing can be highlighted (while building, hovering a later row would just grey the drawing) */
  const idx = (k: string) => KEYS.indexOf(k);
  const hl = (k: string | null | undefined) => {
    const b = root.getAttribute("data-build");
    if (k && (b === null || idx(k) <= Number(b))) root.setAttribute("data-hl", k); else root.removeAttribute("data-hl");
  };
  const toneOf = (t: EventTarget | null) => (t instanceof Element ? t.closest("[data-iso] [data-tone]")?.getAttribute("data-tone") ?? null : null);
  svg.addEventListener("pointerover", (e) => hl(toneOf(e.target)), on);
  svg.addEventListener("pointerleave", () => hl(null), on);
  svg.addEventListener("click", (e) => { const k = toneOf(e.target); hl(k); setActive(k); }, on);   /* touch: highlight too */
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => setActive(t.dataset.key), on);
    t.addEventListener("pointerenter", () => hl(t.dataset.key), on);
    t.addEventListener("pointerleave", () => hl(null), on);
    t.addEventListener("keydown", (e) => {
      const n = tabs.length, to = ({ ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
      if (to === undefined) return;
      e.preventDefault(); setActive(tabs[to].dataset.key); tabs[to].focus();
    }, on);
  });

  const reset = () => {
    html.removeAttribute("data-stk");
    root.removeAttribute("data-hl");
  };
  /* the build-in + the rise (scroll-driven, reversible) */
  if (RM || !ScrollTrigger) return reset;
  html.setAttribute("data-stk-in", "");
  /* a still drawing (the band's data-still, home v5): built from the start, no build-in and no live loop; the copy still rises */
  const still = root.hasAttribute("data-still");
  root.setAttribute("data-build", still ? String(KEYS.length - 1) : "-1");
  const timers: number[] = [];
  const clear = () => { timers.forEach(clearTimeout); timers.length = 0; };
  const sts: ReturnType<typeof ScrollTrigger.create>[] = [];
  if (!still) sts.push(ScrollTrigger.create({
    trigger: svg, start: "top 96%",                            /* the pillar builds as soon as it shows */
    onEnter: () => { clear(); KEYS.forEach((_, k) => timers.push(window.setTimeout(() => root.setAttribute("data-build", String(k)), k * 320))); },
    onLeaveBack: () => { clear(); root.setAttribute("data-build", "-1"); root.removeAttribute("data-hl"); },
  }));
  const rise = [...root.querySelectorAll<HTMLElement>("[data-rise]")];
  rise.forEach((el) => {
    sts.push(ScrollTrigger.create({ trigger: el, start: "top bottom", onEnter: () => el.classList.add("is-in"), onLeaveBack: () => el.classList.remove("is-in") }));
  });

  /* v4 only (its band is .stk--v4): the drawing keeps moving once built (v4/stack-live.ts); v1 never mounts it */
  const live = root.classList.contains("stk--v4") && !RM && !still ? mountStackLive(root, svg, ctx) : null;

  let done = false;
  return () => {
    if (done) return; done = true;
    live?.();
    clear(); sts.forEach((s) => s.kill());
    html.removeAttribute("data-stk-in"); root.removeAttribute("data-build");
    rise.forEach((el) => el.classList.remove("is-in"));
    reset();
  };
}
