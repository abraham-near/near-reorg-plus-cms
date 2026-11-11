// The blog's ruled grid, the behaviour shared by the three indexes (proof-deeper/motion.ts's grid, ported for content React re-renders):
//   - crosshairs: one + wherever a row's top rule meets a vertical (the frame lines and every cell divider), in % of the row, so they hold on resize;
//   - arrivals (motion only): a row draws when its top enters (rules, dividers, then the crosshairs), its [data-rv] text rises after, photos open;
//     a row already above the view, or one that appears in view after a filter change (sync(true)), is simply there (is-now);
//   - photos drift a little inside their frames (±6 % of their height), only near the view;
//   - the line icons (header/icons.ts), mounted row by row as rows appear.
// sync() picks up rows React has added since (filters, Load more); call it after each commit that changes rows.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../header/icons";

export type Grid = { sync: (instant?: boolean) => void; dispose: () => void };

export function mountGrid(root: HTMLElement, { reduced }: Pick<MotionCtx, "reduced">): Grid {
  const ac = new AbortController(), on = { signal: ac.signal };
  let dead = false, raf = 0, rz = 0;
  if (!reduced) root.setAttribute("data-motion", "");

  /* ── crosshairs ── */
  const cross = (row: HTMLElement) => {
    row.querySelectorAll(":scope > .bl-x[data-gen]").forEach((x) => x.remove());
    const w = row.clientWidth; if (!w || row.hasAttribute("data-no-x")) return;
    const src = row.querySelector<HTMLElement>(":scope > [data-cells]") || row;   // a row whose cells sit one level down
    const xs = new Set([0, w]);
    ([...src.children] as HTMLElement[]).forEach((c, i) => { if (i && c.classList.contains("bl-cell") && c.offsetWidth) xs.add(Math.round(c.offsetLeft)); });
    xs.forEach((x) => {
      const b = document.createElement("b"); b.className = "bl-x"; b.setAttribute("aria-hidden", "true"); b.setAttribute("data-gen", "");
      b.style.left = ((x / w) * 100).toFixed(3) + "%"; b.style.setProperty("--xd", (x / w).toFixed(3)); row.appendChild(b);
    });
  };
  const rows = () => [...root.querySelectorAll<HTMLElement>("[data-row]")];

  /* ── arrivals ── */
  const arrive = (r: Element) => {
    r.classList.add("is-in");
    [...r.querySelectorAll<HTMLElement>("[data-rv]")].forEach((el, i) => el.style.setProperty("--rv", (0.18 + i * 0.07).toFixed(2) + "s"));
  };
  const io = reduced ? null : new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io!.unobserve(e.target); arrive(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
  if (io) root.addEventListener("focusin", (e) => { const r = (e.target as Element).closest?.("[data-row]"); if (r && !r.classList.contains("is-in")) r.classList.add("is-in", "is-now"); }, on);

  /* ── photos: decode ahead of the view, then drift inside their frames ── */
  const dio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; dio.unobserve(e.target);
    const im = e.target.querySelector("img"); if (im) { im.loading = "eager"; im.decode?.().catch(() => {}); }
  }), { rootMargin: "150% 0px 150% 0px" });
  const near = new Set<HTMLElement>();
  const pio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? near.add(e.target as HTMLElement) : near.delete(e.target as HTMLElement))), { rootMargin: "20% 0px 20% 0px" });
  const memo = new WeakMap<HTMLElement, string>();
  if (!reduced) {
    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (!near.size) return;
      const vh = innerHeight;
      near.forEach((p) => {
        if (!p.isConnected) { near.delete(p); return; }
        if (p.hasAttribute("data-still")) return;   // a photo that moves on its own (a bleed's plate: its version's motion)
        const r = p.getBoundingClientRect();
        const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        const v = (-k * r.height * 0.06).toFixed(1) + "px";
        if (memo.get(p) !== v) { memo.set(p, v); (p.firstElementChild as HTMLElement).style.translate = `0 ${v}`; }
      });
    };
    raf = requestAnimationFrame(tick);
  }

  /* ── rows as React adds and removes them ── */
  const seen = new WeakSet<Element>(), seenPh = new WeakSet<Element>();
  const icons = new Map<HTMLElement, ReturnType<typeof mountIcons>>();
  const sync = (instant = false) => {
    if (dead) return;
    icons.forEach((set, r) => { if (!r.isConnected) { set.dispose(); icons.delete(r); } });
    rows().forEach((r) => {
      cross(r);
      if (seen.has(r)) return;
      seen.add(r);
      icons.set(r, mountIcons(r, reduced));
      if (!io) { r.classList.add("is-in"); return; }
      const b = r.getBoundingClientRect();
      if (b.bottom < 0 || (instant && b.top < innerHeight)) r.classList.add("is-in", "is-now");
      else io.observe(r);
    });
    root.querySelectorAll<HTMLElement>("[data-ph]").forEach((p) => { if (seenPh.has(p)) return; seenPh.add(p); dio.observe(p); if (!reduced) pio.observe(p); });
  };
  sync();
  addEventListener("resize", () => { clearTimeout(rz); rz = window.setTimeout(() => rows().forEach(cross), 120); }, on);
  document.fonts?.ready.then(() => { if (!dead) rows().forEach(cross); });

  return {
    sync,
    dispose() {
      dead = true; ac.abort(); cancelAnimationFrame(raf); clearTimeout(rz);
      io?.disconnect(); dio.disconnect(); pio.disconnect();
      icons.forEach((s) => s.dispose()); icons.clear();
      root.removeAttribute("data-motion");
      root.querySelectorAll(".bl-x[data-gen]").forEach((x) => x.remove());
      rows().forEach((r) => r.classList.remove("is-in", "is-now"));
      root.querySelectorAll<HTMLElement>("[data-ph]").forEach((p) => { const f = p.firstElementChild as HTMLElement | null; if (f) f.style.translate = ""; });
    },
  };
}
