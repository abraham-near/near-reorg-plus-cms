// Blog I's motion (one mount, through useScrollMotion; "bli:sync" on the root after a filter or view change picks up what React has just made).
//   - depth: every [data-depth] element near the view drifts by its depth around the middle of the screen (positive: behind, slower than the page;
//     negative: nearer, faster), so the board reads as layers; the head's pictures also lean a little toward the pointer (fine pointers).
//   - a print tilts toward the pointer and its light follows it (fine pointers).
//   - [data-in] arrivals: prints and list rows rise once, in turn; the list view's line icons.
// Reduced motion: no drift, no lean, no tilt; everything simply there.
import type { Mount } from "@/lib/motion/scroll";
import { mountIcons } from "../../header/icons";
import { arrivals } from "../loose";

export const mount: Mount = (root, { reduced }) => {
  const ac = new AbortController(), on = { signal: ac.signal };
  let dead = false, raf = 0, arr = arrivals(root, reduced);
  // the list view's line icons (the list is made and unmade by the view switch)
  const icons = new Map<HTMLElement, ReturnType<typeof mountIcons>>();
  const syncIcons = () => {
    icons.forEach((s, el) => { if (!el.isConnected) { s.dispose(); icons.delete(el); } });
    root.querySelectorAll<HTMLElement>(".bli-list").forEach((el) => { if (!icons.has(el)) icons.set(el, mountIcons(el, reduced)); });
  };
  const offIcons = () => icons.forEach((s) => s.dispose());
  syncIcons();
  if (reduced) {
    root.addEventListener("bli:sync", () => requestAnimationFrame(() => { arr(); arr = arrivals(root, true); syncIcons(); }), on);
    return () => { ac.abort(); arr(); offIcons(); };
  }
  root.setAttribute("data-motion", "");
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── depth ── */
  const near = new Set<HTMLElement>();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? near.add(e.target as HTMLElement) : near.delete(e.target as HTMLElement))), { rootMargin: "30% 0px 30% 0px" });
  const watch = () => { io.disconnect(); near.clear(); root.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => io.observe(el)); };
  watch();
  let px = 0, py = 0, cx = 0, cy = 0;   // the pointer, -0.5..0.5 (eased)
  const memo = new WeakMap<HTMLElement, string>();
  const tick = () => {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    cx += (px - cx) * 0.06; cy += (py - cy) * 0.06;
    if (!near.size) return;
    const vh = innerHeight, small = innerWidth < 1024 ? 0.5 : 1;
    near.forEach((el) => {
      if (!el.isConnected) { near.delete(el); return; }
      const z = +(el.dataset.depth || 0) * small;
      // measured without its own drift: the parent's box (the drift is on this element)
      const r = (el.parentElement || el).getBoundingClientRect();
      const k = (r.top + r.height / 2 - vh / 2) / vh;
      const y = -k * z * vh * 0.5;
      const lean = el.hasAttribute("data-lean") ? z : 0;
      const tx = (-cx * lean * 60).toFixed(1), ty = (y - cy * lean * 40).toFixed(1);
      const val = `${tx}px ${ty}px`;
      if (memo.get(el) !== val) { memo.set(el, val); el.style.translate = val; }
    });
  };
  raf = requestAnimationFrame(tick);
  if (fine) addEventListener("pointermove", (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true, signal: ac.signal });

  /* ── tilt ── */
  if (fine) {
    root.addEventListener("pointermove", (e) => {
      const a = (e.target as Element).closest?.<HTMLElement>(".bli-card__a"); if (!a) return;
      const ph = a.querySelector<HTMLElement>(".bli-card__ph")!, r = ph.getBoundingClientRect();
      const x = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5)), y = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      ph.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`); ph.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      ph.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`); ph.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    }, on);
    root.addEventListener("pointerout", (e) => {
      const a = (e.target as Element).closest?.<HTMLElement>(".bli-card__a");
      if (!a || a.contains(e.relatedTarget as Node)) return;
      const ph = a.querySelector<HTMLElement>(".bli-card__ph")!;
      ph.style.setProperty("--rx", "0deg"); ph.style.setProperty("--ry", "0deg");
    }, on);
  }

  root.addEventListener("bli:sync", () => requestAnimationFrame(() => { if (dead) return; arr(); arr = arrivals(root, false); watch(); syncIcons(); }), on);
  return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); ac.abort(); arr(); offIcons(); };
};
