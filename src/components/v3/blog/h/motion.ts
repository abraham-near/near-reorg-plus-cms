// Blog H's motion (one mount, through useScrollMotion; "blh:sync" on the root after a filter change picks up the chapters React has just made).
//   - a chapter's title (desktop ≥ 1024, motion on): it sticks near the top of the screen and, over the next stretch of scroll, shrinks into a label
//     (scrubbed, eased); its type line fades first, so the posts passing beside it never meet the large title.
//   - the picture (fine pointers): over a row, the row's picture comes out and follows the cursor with a little lag, leaning with its speed; the other rows
//     quiet down (CSS). A row focused by keyboard shows its picture in the margin beside it. Reduced motion: the picture sits in the margin beside the
//     hovered or focused row and does not follow.
//   - the line icons, per chapter; [data-in] arrivals.
import type { Mount } from "@/lib/motion/scroll";
import { mountIcons } from "../../header/icons";
import { arrivals } from "../loose";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const STICK = 28, LABEL = 22;   // px: where a title sticks, the label's size

export const mount: Mount = (root, { reduced, ScrollTrigger }) => {
  const ac = new AbortController(), on = { signal: ac.signal };
  if (!reduced) root.setAttribute("data-motion", "");
  let dead = false;

  /* ── per chapter: icons and the shrinking title ── */
  const icons = new Map<HTMLElement, ReturnType<typeof mountIcons>>();
  let triggers: ScrollTrigger[] = [], arr = () => {};
  const desk = () => innerWidth >= 1024;
  const build = () => {
    icons.forEach((s, el) => { if (!el.isConnected) { s.dispose(); icons.delete(el); } });
    root.querySelectorAll<HTMLElement>(".blh-ch").forEach((ch) => { if (!icons.has(ch)) icons.set(ch, mountIcons(ch, reduced)); });
    triggers.forEach((t) => t.kill()); triggers = [];
    arr(); arr = arrivals(root, reduced);
    if (reduced) return;
    root.querySelectorAll<HTMLElement>(".blh-ch__head").forEach((head) => {
      const t = head.querySelector<HTMLElement>(".blh-ch__t")!, meta = head.querySelector<HTMLElement>(".blh-ch__meta");
      let min = 0.25;
      const measure = () => { min = LABEL / (parseFloat(getComputedStyle(t.querySelector(".blh-ch__name")!).fontSize) || 120); };
      const apply = (p: number) => {
        if (!desk()) { t.style.transform = ""; if (meta) meta.style.opacity = ""; return; }
        const s = 1 + (min - 1) * ease(p);
        t.style.transform = `scale(${s.toFixed(4)})`;
        if (meta) meta.style.opacity = (1 - clamp01(p / 0.28)).toFixed(3);
        head.classList.toggle("is-label", p > 0.98);
      };
      measure();
      triggers.push(ScrollTrigger.create({
        trigger: head, start: `top ${STICK}px`, end: () => `+=${Math.round(head.offsetHeight * 0.8)}`, invalidateOnRefresh: true,
        onRefreshInit: measure, onUpdate: (st) => apply(st.progress), onRefresh: (st) => apply(st.progress),
      }));
    });
    ScrollTrigger.refresh();
  };
  build();
  root.addEventListener("blh:sync", () => requestAnimationFrame(() => { if (!dead) build(); }), on);

  /* ── the picture ── */
  const pic = root.querySelector<HTMLElement>(".blh-pic"), pin = pic?.firstElementChild as HTMLElement | null;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let raf = 0;
  if (pic && pin && fine) {
    const imgs = new Map<string, HTMLImageElement>();
    pin.querySelectorAll<HTMLImageElement>("img[data-pic]").forEach((im) => imgs.set(im.dataset.pic!, im));
    let cur = "", follow = false, x = 0, y = 0, tx = 0, ty = 0, lean = 0, running = false;
    const W = () => pin.offsetWidth, H = () => pin.offsetHeight;
    const set = (id: string) => {
      if (id === cur) return; cur = id;
      imgs.forEach((im, k) => { const onNow = k === id; im.classList.toggle("is-on", onNow); if (onNow) { im.loading = "eager"; } });
      pic.classList.toggle("is-on", !!id);
      root.classList.toggle("is-peek", !!id);
    };
    const place = () => { pin.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${lean.toFixed(2)}deg)`; };
    const tick = () => {
      if (dead) return;
      const dx = tx - x;
      x += dx * 0.16; y += (ty - y) * 0.16; lean += (Math.max(-7, Math.min(7, dx * 0.05)) - lean) * 0.12;
      place();
      if (Math.abs(dx) + Math.abs(ty - y) + Math.abs(lean) > 0.2 || cur) raf = requestAnimationFrame(tick); else running = false;
    };
    const run = () => { if (!running && !reduced) { running = true; raf = requestAnimationFrame(tick); } };
    /** beside the row, in the left margin (keyboard, reduced motion) */
    const beside = (a: HTMLElement) => {
      const r = a.getBoundingClientRect(), w = W(), h = H();
      tx = desk() ? Math.max(16, r.left - w - 32) : Math.max(16, innerWidth - w - 16);
      ty = r.top + r.height / 2 - h / 2;
      if (reduced || !follow) { x = tx; y = ty; lean = 0; place(); }
    };
    const rowOf = (el: EventTarget | null) => (el instanceof Element ? el.closest<HTMLElement>(".blh-row__a") : null);
    let fa: HTMLElement | null = null;   // the row focused by keyboard
    root.addEventListener("pointermove", (e) => {
      const a = rowOf(e.target);
      if (!a) { if (cur && !fa) set(""); follow = false; return; }
      if (reduced) { beside(a); set(a.dataset.pic!); return; }
      const w = W(), h = H();
      // below and right of the cursor, so the row being read stays clear (above it near the foot of the screen)
      tx = Math.min(e.clientX + 24, innerWidth - w - 12); ty = e.clientY + 36;
      if (ty + h > innerHeight - 12) ty = e.clientY - h - 36;
      if (!follow || !cur) { x = tx; y = ty; lean = 0; place(); follow = true; }
      set(a.dataset.pic!); run();
    }, on);
    root.addEventListener("pointerleave", () => { set(""); follow = false; }, on);
    root.addEventListener("focusin", (e) => { const a = rowOf(e.target); if (a) { fa = a; follow = false; beside(a); set(a.dataset.pic!); } }, on);
    root.addEventListener("focusout", (e) => { if (!rowOf(e.relatedTarget)) { fa = null; set(""); } }, on);
    // scrolling: a keyboard row's picture stays beside it; the cursor's picture goes until the pointer moves again
    addEventListener("scroll", () => { if (!cur) return; if (fa && !follow) beside(fa); else set(""); }, { passive: true, signal: ac.signal });
  }

  return () => {
    dead = true; cancelAnimationFrame(raf); ac.abort(); arr();
    triggers.forEach((t) => t.kill());
    icons.forEach((s) => s.dispose());
  };
};
