// v3's proof strip + Go deeper, the behaviour: b10's (js/content.js), on our markup (ProofDeeper.tsx).
//   - crosshairs: one + wherever a rule meets a vertical (the frame lines and every cell divider), at each row's top, in % of the row (they hold on resize);
//   - arrivals (motion only): a row draws when its top enters (rules, dividers, then the crosshairs), its [data-rv] text rises after, photos open with a soft mask;
//   - the proof strip's green rule draws once the strip's top passes 40 % of the view; the figures mask in at their final value, cell by cell;
//   - photos drift a little inside their frames (parallax, ±6 % of their height), only near the view;
//   - Go deeper: the filter tablist (click, arrows, Home / End); the green dot slides to the chosen tab, the new panel's photos open again;
//   - the icons (b10's line icons): drawn from dots as they come into view;
//   - the voices' full-bleed photo: its text rises once a third of it is in; the photo moves slower than the page and settles from 1.1; and (v3) it opens from
//     the grid's width to the whole screen as it reaches the middle of the view, holds, and closes again as it leaves (--shut, scrubbed; reduced motion: it stays
//     at the grid's width);
//   - NEAR belongs to you (desktop, motion on): one scene. The bleed is 200 vh and its stage sticks for the extra 100 vh. As the stage arrives the client's
//     lockup stands large in the sky (the N tile settles, the letters rise, once); while it holds, the lockup glides down to the headline's size and place and
//     `belongs to you` opens out of its right edge, word by word (scrubbed). The meadow eases from 1.08 to 1 and drifts. (v3) Its frame opens from the grid's
//     width to the whole screen as the scene arrives, stays open while it holds, and closes as it leaves. Phones and reduced motion: the finished line.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../header/icons";

export function mount(root: HTMLElement, { reduced }: MotionCtx) {
  const ac = new AbortController(), on = { signal: ac.signal }, onP = { signal: ac.signal, passive: true };
  const $$ = <T extends HTMLElement = HTMLElement>(s: string, el: ParentNode = root) => [...el.querySelectorAll<T>(s)];
  const rows = $$("[data-row]");
  const timers: number[] = [];
  let dead = false, raf = 0;
  if (!reduced) root.setAttribute("data-motion", "");
  const icons = mountIcons(root, reduced);

  // a section's first rule is the rule it shares with the one above: it never draws in
  $$(".l-sec").forEach((sec, i) => { const r = sec.querySelector("[data-row]"); if (r && i) r.setAttribute("data-start", ""); });

  /* ── crosshairs ── */
  const cross = (row: HTMLElement) => {
    row.querySelectorAll(":scope > .l-x[data-gen]").forEach((x) => x.remove());
    const w = row.clientWidth; if (!w) return;
    const src = row.querySelector<HTMLElement>(":scope > .l-panel[data-on]") || row;   // Go deeper: the cells of the panel on show
    const xs = new Set([0, w]);
    ([...src.children] as HTMLElement[]).filter((c) => c.classList.contains("l-cell")).forEach((c, i) => { if (i && c.offsetWidth) xs.add(Math.round(c.offsetLeft)); });
    if (row.hasAttribute("data-after-bleed")) return;   // a row right under a full-bleed photo: the photo's edge is its top line (no +)
    xs.forEach((x) => {
      const b = document.createElement("b"); b.className = "l-x"; b.setAttribute("aria-hidden", "true"); b.setAttribute("data-gen", "");
      b.style.left = ((x / w) * 100).toFixed(3) + "%"; b.style.setProperty("--xd", (x / w).toFixed(3)); row.appendChild(b);
    });
  };
  const crossAll = () => rows.forEach(cross);
  crossAll();
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = window.setTimeout(() => { crossAll(); place(); }, 120); }, on);
  document.fonts?.ready.then(() => { if (!dead) { crossAll(); place(); } });

  /* ── the proof strip's green rule ── */
  const proofRow = root.querySelector<HTMLElement>(".l-proof__row");
  const green = () => { if (!proofRow) return; const k = proofRow.getBoundingClientRect().top < innerHeight * 0.4; if (k !== proofRow.classList.contains("is-lit")) proofRow.classList.toggle("is-lit", k); };
  if (reduced) proofRow?.classList.add("is-lit");
  else { addEventListener("scroll", green, onP); green(); }

  /* ── photos decode ahead of the view, so their arrival never costs a long frame ── */
  const dio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; dio.unobserve(e.target);
    const im = e.target.querySelector("img"); if (im) { im.loading = "eager"; im.decode?.().catch(() => {}); }
  }), { rootMargin: "150% 0px 150% 0px" });
  $$("[data-ph]").forEach((ph) => dio.observe(ph));

  /* ── arrivals ── */
  const bleeds = $$("[data-bleed]");
  let io: IntersectionObserver | null = null, bio: IntersectionObserver | null = null;
  if (reduced) rows.concat(bleeds).forEach((r) => r.classList.add("is-in"));
  else {
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io!.unobserve(e.target); e.target.classList.add("is-in");
      $$("[data-rv]", e.target).forEach((el, i) => el.style.setProperty("--rv", (0.18 + i * 0.08).toFixed(2) + "s"));
    }), { rootMargin: "0px 0px -12% 0px" });
    rows.forEach((r) => { if (r.getBoundingClientRect().bottom < 0) r.classList.add("is-in", "is-now"); else io!.observe(r); });
    // a full-bleed photo arrives when a third of it is in: its text rises then
    bio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; bio!.unobserve(e.target); e.target.classList.add("is-in");
      $$("[data-rv]", e.target).forEach((el, i) => el.style.setProperty("--rv", (0.1 + i * 0.12).toFixed(2) + "s"));
    }), { threshold: 0.34 });
    bleeds.forEach((r) => { if (r.getBoundingClientRect().bottom < 0) r.classList.add("is-in", "is-now"); else bio!.observe(r); });
    // a jump (focus) never leaves a row undrawn above the view
    root.addEventListener("focusin", (e) => { const r = (e.target as Element).closest?.("[data-row]"); if (r && !r.classList.contains("is-in")) r.classList.add("is-in", "is-now"); }, on);
  }

  const closeScene = { on: false };
  /* ── parallax: each framed photo drifts inside its frame (the image is 116 % of the frame); a full-bleed one moves slower than the page (≈ 0.88 speed)
     and settles from 1.1 to 1 as it comes up, and its frame opens to the whole screen around the middle of the view ── */
  const ss = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const OPEN: [number, number, number, number] = [0.12, 0.4, 0.6, 0.88];   /* t (0: its top at the view's foot, 1: its foot at the top): opens, open, closes, closed */
  const near = new Set<HTMLElement>();
  const pio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? near.add(e.target as HTMLElement) : near.delete(e.target as HTMLElement))), { rootMargin: "20% 0px 20% 0px" });
  const memo = new WeakMap<HTMLElement, string>();
  if (!reduced) {
    $$("[data-ph]").forEach((p) => pio.observe(p));
    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (!near.size) return;
      const vh = innerHeight, list: [HTMLElement, DOMRect][] = [];
      near.forEach((p) => list.push([p, p.getBoundingClientRect()]));
      list.forEach(([p, r]) => {
        const bleed = p.closest<HTMLElement>("[data-bleed]");
        if (bleed && bleed.hasAttribute("data-close") && closeScene.on) {   // the scene moves its own photo; its frame opens for the length of the scene
          const b = bleed.getBoundingClientRect(), c01 = (x: number) => Math.max(0, Math.min(1, x));
          const shut = (1 - ss(0.15, 0.75, c01((vh - b.top) / vh)) * (1 - ss(0.2, 0.8, c01((vh - b.bottom) / vh)))).toFixed(4);
          if (memo.get(bleed) !== shut) { memo.set(bleed, shut); bleed.style.setProperty("--shut", shut); }
          return;
        }
        if (bleed) {
          const t = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
          const y = (0.5 - t) * r.height * 0.24, sc = 1 + 0.1 * Math.pow(1 - Math.min(1, t / 0.5), 2);
          const v = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
          if (memo.get(p) !== v) { memo.set(p, v); (p.firstElementChild as HTMLElement).style.transform = v; }
          const shut = (1 - ss(OPEN[0], OPEN[1], t) * (1 - ss(OPEN[2], OPEN[3], t))).toFixed(4);
          if (memo.get(bleed) !== shut) { memo.set(bleed, shut); bleed.style.setProperty("--shut", shut); }
          return;
        }
        const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        const v = (-k * r.height * 0.06).toFixed(1) + "px";
        if (memo.get(p) !== v) { memo.set(p, v); (p.firstElementChild as HTMLElement).style.translate = `0 ${v}`; }
      });
    };
    raf = requestAnimationFrame(tick);
  }

  /* ── NEAR belongs to you: the scene ── */
  const sc = root.querySelector<HTMLElement>("[data-close]");
  let sraf = 0;
  if (sc) {
    const stage = sc.querySelector<HTMLElement>(".l-close__stage")!, plate = sc.querySelector<HTMLElement>(".l-plate"), line = sc.querySelector<HTMLElement>(".l-close__h")!;
    const logo = sc.querySelector<HTMLElement>(".l-close__logo")!, rest = sc.querySelector<HTMLElement>(".l-close__rest")!, words = [...sc.querySelectorAll<HTMLElement>(".l-close__w")];
    const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v), io3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), o3 = (t: number) => 1 - Math.pow(1 - t, 3);
    let g: { k: number; w: number; h: number; gap: number; rw: number; dx: number; dy: number } | null = null, last = "", init = false;
    const measure = () => {   // the lockup's start, measured untransformed
      logo.style.transform = ""; line.style.transform = ""; rest.style.transform = "";
      const s0 = stage.getBoundingClientRect(), l = logo.getBoundingClientRect(), rr = rest.getBoundingClientRect();
      const w = Math.min(s0.width * 0.38, 620), k = w / l.width;   // a calm arrival, not a billboard
      g = { k, w: l.width, h: l.height, gap: rr.left - l.right, rw: rr.width - (parseFloat(getComputedStyle(rest).paddingRight) || 0),
        dx: s0.left + s0.width / 2 - (l.left + l.width / 2), dy: s0.top + s0.height * 0.42 - (l.top + l.height / 2) };
      last = "";
    };
    const want = () => !reduced && innerWidth >= 860;
    const setOn = (v: boolean) => {
      closeScene.on = v; sc.classList.toggle("is-scene", v);
      if (!v) {
        logo.style.transform = ""; line.style.transform = ""; rest.style.transform = ""; rest.style.maskImage = rest.style.webkitMaskImage = "";
        words.forEach((w) => { w.style.transform = ""; }); if (plate) plate.style.transform = "";
        if (reduced || init) sc.classList.add("is-lit");
      } else measure();
    };
    const tick = () => {
      if (!closeScene.on || !g) return;
      const vh = innerHeight, r = sc.getBoundingClientRect();
      if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
      const hold = Math.max(1, r.height - stage.offsetHeight), p = c01(-r.top / hold), T = c01((vh - r.top) / (r.height + vh));
      if (!sc.classList.contains("is-lit") && r.top < vh * 0.55) sc.classList.add("is-lit");
      const e = io3(c01(p / 0.5)), u = 1 - e, k = 1 + (g.k - 1) * u;
      const rv = o3(c01((p - 0.28) / 0.34));
      const key = p.toFixed(4) + T.toFixed(4);
      if (key === last) return; last = key;
      // the lockup plus the words shown so far always sit centred: the lockup shrinks in place, then the group slides left as the words come out
      const dx = g.dx - (g.gap * k + g.rw) * rv / 2, dy = g.dy * u;
      logo.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${k.toFixed(4)})`;
      // the words ride on the lockup's right edge and its baseline (0.344 of its height below its centre): pulled out of it
      const rx = dx + (k - 1) * (g.w / 2 + g.gap), ry = dy + (k - 1) * g.h * 0.344;
      rest.style.transform = Math.abs(rx) + Math.abs(ry) < 0.1 ? "" : `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      const m = rv >= 0.999 ? "" : `linear-gradient(90deg, #000 calc(${(rv * 100).toFixed(2)}% - 1.2em), transparent ${(rv * 100).toFixed(2)}%)`;   // a soft edge
      rest.style.maskImage = rest.style.webkitMaskImage = m;
      words.forEach((w, i) => { const t = o3(c01((p - 0.3 - i * 0.07) / 0.26)); w.style.transform = t >= 0.999 ? "" : `translate3d(${((t - 1) * 0.14).toFixed(3)}em, 0, 0)`; });
      line.style.transform = `translate3d(0, ${((0.5 - T) * vh * 0.07).toFixed(1)}px, 0)`;
      // the meadow keeps moving through the hold (≈ 1.06 → 1.01 while pinned)
      if (plate) plate.style.transform = `translate3d(0, ${((0.5 - T) * vh * 0.14).toFixed(1)}px, 0) scale(${(1 + 0.08 * (1 - c01((T - 0.2) / 0.55))).toFixed(4)})`;
    };
    setOn(want()); init = true;
    let crz = 0;
    addEventListener("resize", () => { clearTimeout(crz); crz = window.setTimeout(() => { if (want() !== closeScene.on) setOn(want()); else if (closeScene.on) measure(); tick(); }, 120); }, on);
    document.fonts?.ready.then(() => { if (!dead && closeScene.on) { measure(); tick(); } });
    if (!reduced) { const loop = () => { if (dead) return; tick(); sraf = requestAnimationFrame(loop); }; sraf = requestAnimationFrame(loop); }
    if (!closeScene.on && !reduced) {
      const lio = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { lio.disconnect(); sc.classList.add("is-lit"); } }), { threshold: 0.3 });
      lio.observe(sc); ac.signal.addEventListener("abort", () => lio.disconnect());
    }
  }

  /* ── Go deeper: the filter tablist ── */
  const tabs = $$<HTMLButtonElement>(".l-tab"), panels = $$(".l-panel"), dot = root.querySelector<HTMLElement>(".l-tabs__dot");
  const body = root.querySelector<HTMLElement>(".l-deeper__body");
  function place() {
    const t = tabs.find((b) => b.getAttribute("aria-selected") === "true"); if (!t || !dot) return;
    dot.style.translate = `${(t.offsetLeft - 14).toFixed(1)}px 0`;
  }
  const choose = (key: string, focus?: boolean) => {
    tabs.forEach((b) => { const s = b.dataset.key === key; b.setAttribute("aria-selected", String(s)); b.tabIndex = s ? 0 : -1; if (s && focus) b.focus(); });
    panels.forEach((p) => {
      const s = p.dataset.key === key;
      p.inert = !s; p.toggleAttribute("data-on", s);
      if (s) p.removeAttribute("aria-hidden"); else p.setAttribute("aria-hidden", "true");
      if (s) { p.classList.remove("is-shown"); void p.offsetWidth; p.classList.add("is-shown"); icons.draw(p); }
    });
    place(); if (body) cross(body);
  };
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => choose(b.dataset.key || "all"), on);
    b.addEventListener("keydown", (e) => {
      const n = tabs.length, to = ({ ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
      if (to === undefined) return; e.preventDefault(); choose(tabs[to].dataset.key || "all", true);
    }, on);
  });
  place();

  return () => {
    dead = true; ac.abort(); cancelAnimationFrame(raf); cancelAnimationFrame(sraf);
    if (sc) {
      sc.classList.remove("is-scene", "is-lit");
      sc.querySelectorAll<HTMLElement>(".l-close__logo, .l-close__h, .l-close__rest, .l-close__w, .l-plate").forEach((el) => { el.style.transform = ""; el.style.maskImage = el.style.webkitMaskImage = ""; });
    } clearTimeout(rz); timers.forEach(clearTimeout);
    io?.disconnect(); bio?.disconnect(); dio.disconnect(); pio.disconnect(); icons.dispose();
    root.removeAttribute("data-motion");
    root.querySelectorAll(".l-x[data-gen]").forEach((x) => x.remove());   // only the generated ones (the bleed's are in the markup)
    rows.concat(bleeds).forEach((r) => r.classList.remove("is-in", "is-now", "is-lit"));
    bleeds.forEach((b) => b.style.removeProperty("--shut"));
    $$("[data-ph]").forEach((p) => { const f = p.firstElementChild as HTMLElement; f.style.translate = ""; f.style.transform = ""; });
  };
}
