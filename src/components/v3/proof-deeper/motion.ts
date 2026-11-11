// v3's proof strip + Go deeper, the behaviour: b10's (js/content.js), on our markup (ProofDeeper.tsx).
//   - crosshairs: one + wherever a rule meets a vertical (the frame lines and every cell divider), at each row's top, in % of the row (they hold on resize);
//   - arrivals (motion only): a row draws when its top enters (rules, dividers, then the crosshairs), its [data-rv] text rises after, photos open with a soft mask;
//   - the proof strip's green rule draws once the strip's top passes 40 % of the view; the figures mask in at their final value, cell by cell;
//   - photos drift a little inside their frames (parallax, ±6 % of their height), only near the view;
//   - Go deeper: the filter tablist (click, arrows, Home / End); the green dot slides to the chosen tab, the new panel's photos open again;
//   - the icons (b10's line icons): drawn from dots as they come into view;
//   - the voices (v3, desktop, motion on: gsap, one scrubbed timeline over the bleed): the stage holds for 200 vh; the frame opens to the whole screen as it
//     arrives and closes as it leaves; the three voices take turns in the sky, line by line (splitLines, below), each drifting a little against the ridges, which
//     settle from 1.22 and slide slower than the words (the parallax); the count and its bars follow. Phones and reduced motion: the three stacked, no hold;
//   - any other full-bleed photo: its text rises once a third of it is in; the photo moves slower than the page and settles from 1.1; and (v3) it opens from
//     the grid's width to the whole screen as it reaches the middle of the view, holds, and closes again as it leaves (--shut, scrubbed; reduced motion: it stays
//     at the grid's width);
//   - NEAR belongs to you (desktop, motion on): one scene. The bleed is 200 vh and its stage sticks for the extra 100 vh. As the stage arrives the client's
//     lockup stands large in the sky (the N tile settles, the letters rise, once); while it holds, the lockup glides down to the headline's size and place and
//     `belongs to you` opens out of its right edge, word by word (scrubbed). The meadow eases from 1.08 to 1 and drifts. (v3) Its frame opens from the grid's
//     width to the whole screen as the scene arrives and stays open; the newsletter arrives under the line once the words have opened, and the stage holds
//     100 vh more while the footer rises over it from below. Phones and reduced motion: the finished line and the newsletter, no hold.
import type { MotionCtx } from "@/lib/motion/scroll";
import { mountIcons } from "../header/icons";
import { mountVoiceMode } from "./voice-modes";

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
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

  const closeScene = { on: false }, voices = { on: false };
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
        if (bleed && voices.on && bleed.hasAttribute("data-voices")) return;   // the voices' scene moves its own photo (gsap, below)
        if (bleed && bleed.hasAttribute("data-close") && closeScene.on) {   // the scene moves its own photo; its frame opens as it arrives and stays open (the footer covers it)
          const b = bleed.getBoundingClientRect(), c01 = (x: number) => Math.max(0, Math.min(1, x));
          const shut = (1 - ss(0.15, 0.75, c01((vh - b.top) / vh))).toFixed(4);
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

  /* ── the voices: one scene (gsap) ── */
  const vb = root.querySelector<HTMLElement>("[data-voices]");
  /* v4's options (data-vmode): marquee / pins play without the scene (voice-modes.ts; the photo is the plain bleed's); short and deck are the scene, shorter */
  const vmode = vb?.dataset.vmode || "", deck = vmode === "deck", short = vmode === "short";
  const vOff = vb && (vmode === "marquee" || vmode === "pins") ? mountVoiceMode(vb, vmode, reduced) : null;
  let mm: gsap.MatchMedia | null = null;
  if (vb && !reduced && !vOff) {
    mm = gsap.matchMedia();
    mm.add("(min-width: 860px)", () => {
      voices.on = true; vb.classList.add("is-scene");
      const plate = vb.querySelector<HTMLElement>(".l-plate"), top = vb.querySelector<HTMLElement>(".l-voices__top");
      const nn = vb.querySelector<HTMLElement>(".l-voices__nn"), bars = [...vb.querySelectorAll<HTMLElement>(".l-voices__bars b")];
      const qs = [...vb.querySelectorAll<HTMLElement>(".l-vq")];
      // the timeline in vh of scroll: 0–100 the stage comes up, 100–300 it holds, 300–400 it leaves (three voices, v3's values).
      // More voices (v4: six): the hold grows 85 vh a voice (--scene-h), each comes in evenly and goes 20 vh before the next.
      // short (v4 A): the same scene in 340 vh (v4's six in the long one: 655), a voice every 36 vh, its moves at 0.6 of the time.
      // deck (v4 D): 280 vh, a voice every 24 vh, each sliding in from the right as the last slides out to the left.
      const n = qs.length, T = deck ? 280 : short ? 340 : n === 3 ? 400 : 400 + (n - 3) * 85, END = T - 100, K = deck ? 0.5 : short ? 0.6 : 1;
      const IN = deck || short ? qs.map((_, i) => Math.round(54 + (i * (T - 105 - 54)) / Math.max(1, n - 1)))
        : n === 3 ? [58, 158, 236] : qs.map((_, i) => Math.round(58 + (i * (T - 222)) / Math.max(1, n - 1)));
      const OUT = deck ? IN.slice(1).map((v) => v - 6) : short ? IN.slice(1).map((v) => v - 12) : n === 3 ? [138, 218] : IN.slice(1).map((v) => v - 20);
      if (n !== 3 || deck || short) vb.style.setProperty("--scene-h", `${END}vh`);
      let tl: gsap.core.Timeline | null = null;
      const build = () => {
        if (tl) { tl.scrollTrigger?.kill(); tl.revert(); }
        tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: vb, start: "top bottom", end: "bottom top", scrub: 0.7, invalidateOnRefresh: true } });
        tl.set({}, {}, T);
        // the frame: grid width → the whole screen as it arrives, back as it leaves
        tl.fromTo(vb, { "--shut": 1 }, { "--shut": 0, duration: 55, ease: "power2.inOut" }, 18).to(vb, { "--shut": 1, duration: 55, ease: "power2.inOut" }, T - 72);
        // the ridges: slower than the words, settling as they go
        if (plate) tl.fromTo(plate, { yPercent: 7, xPercent: 1.5, scale: 1.22 }, { yPercent: -7, xPercent: -1.5, scale: 1.04, duration: T }, 0);
        if (top) tl.fromTo(top, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 30, ease: "power2.out" }, 46);
        // the count: 01 → 02 → 03…, each bar fills through its voice
        if (nn) OUT.forEach((o, k) => tl!.to(nn, { yPercent: (-100 * (k + 1)) / n, duration: 18 * K, ease: "power2.inOut" }, o + 10 * K));
        bars.forEach((b, i) => tl!.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: (OUT[i] ?? END) - IN[i] }, IN[i]));
        // the voices, line by line; each drifts against the photo while it is on
        qs.forEach((q, i) => {
          const lines = q.querySelectorAll(".l-vl"), who = q.querySelector(".l-who"), a = IN[i], o = OUT[i];
          // the hidden state at 0 (a staggered fromTo only renders its first target's start)
          if (deck) {
            // deck: the lines come in from the right one after another and leave to the left the same way; the first is on as the stage comes up
            tl!.set(lines, { x: 120, autoAlpha: 0 }, 0);
            if (who) tl!.set(who, { x: 60, autoAlpha: 0 }, 0);
            tl!.to(lines, { x: 0, autoAlpha: 1, duration: 14, stagger: 2, ease: "power3.out" }, a);
            if (who) tl!.to(who, { x: 0, autoAlpha: 1, duration: 10, ease: "power2.out" }, a + 6);
            if (o !== undefined) {
              tl!.to(lines, { x: -120, autoAlpha: 0, duration: 9, stagger: 1.5, ease: "power2.in" }, o);
              if (who) tl!.to(who, { x: -60, autoAlpha: 0, duration: 7, ease: "power1.in" }, o);
            }
            return;
          }
          tl!.set(lines, { yPercent: 70, autoAlpha: 0 }, 0);
          if (who) tl!.set(who, { y: 16, autoAlpha: 0 }, 0);
          tl!.to(lines, { yPercent: 0, autoAlpha: 1, duration: 30 * K, stagger: 5 * K, ease: "power3.out" }, a);
          if (who) tl!.to(who, { y: 0, autoAlpha: 1, duration: 20 * K, ease: "power2.out" }, a + 20 * K);
          tl!.fromTo(q, { y: 40 }, { y: o === undefined ? 0 : -40, duration: (o === undefined ? END : o + 24 * K) - a }, a);
          if (o !== undefined) {
            tl!.to(lines, { yPercent: -50, autoAlpha: 0, duration: 20 * K, stagger: 3 * K, ease: "power2.in" }, o);
            if (who) tl!.to(who, { y: -10, autoAlpha: 0, duration: 14 * K, ease: "power1.in" }, o);
          }
        });
      };
      // split into lines once the fonts are in, and again when the width changes (the old timeline goes first, then the old lines)
      const ps = qs.map((q) => q.querySelector("p")!);
      let unsplit: (() => void)[] = [], w = 0, vt = 0, live = true;
      const resplit = () => {
        if (!live) return;
        if (tl) { tl.scrollTrigger?.kill(); tl.revert(); tl = null; }
        unsplit.forEach((f) => f()); w = innerWidth;
        unsplit = ps.map(splitLines);
        build(); ScrollTrigger.refresh();
      };
      const onRz = () => { clearTimeout(vt); vt = window.setTimeout(() => { if (innerWidth !== w) resplit(); }, 160); };
      const onFont = () => { clearTimeout(vt); vt = window.setTimeout(resplit, 60); };   // a face that lands late (the header's) changes the line breaks
      resplit();
      document.fonts?.ready.then(onFont);
      document.fonts?.addEventListener("loadingdone", onFont);
      addEventListener("resize", onRz);
      return () => {
        live = false; clearTimeout(vt); removeEventListener("resize", onRz); document.fonts?.removeEventListener("loadingdone", onFont);
        if (tl) { tl.scrollTrigger?.kill(); tl.revert(); tl = null; }
        unsplit.forEach((f) => f()); unsplit = []; vb.classList.remove("is-scene"); vb.style.removeProperty("--shut"); vb.style.removeProperty("--scene-h"); voices.on = false;
        if (plate) memo.delete(plate);
        memo.delete(vb);
      };
    });
  }

  /* ── NEAR belongs to you: the scene ── */
  const sc = root.querySelector<HTMLElement>("[data-close]");
  let sraf = 0;
  if (sc) {
    const stage = sc.querySelector<HTMLElement>(".l-close__stage")!, plate = sc.querySelector<HTMLElement>(".l-plate"), line = sc.querySelector<HTMLElement>(".l-close__h")!;
    const logo = sc.querySelector<HTMLElement>(".l-close__logo")!, rest = sc.querySelector<HTMLElement>(".l-close__rest")!, words = [...sc.querySelectorAll<HTMLElement>(".l-close__w")];
    const nl = sc.querySelector<HTMLElement>(".l-close__nl");
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
      document.documentElement.toggleAttribute("data-close-cover", v);   // the footer rises over the held stage (footer.css)
      if (nl) { nl.inert = false; sc.style.removeProperty("--nl"); }
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
      const hold = Math.max(1, stage.offsetHeight), p = c01(-r.top / hold), T = c01((vh - r.top) / (r.height + vh));   // the line's hold: the first 100 vh (the rest is the footer's cover)
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
      // v3: the newsletter arrives under the line once the words have opened
      if (nl) { const n = o3(c01((p - 0.62) / 0.3)); sc.style.setProperty("--nl", n.toFixed(4)); nl.inert = n < 0.5; }
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
    dead = true; ac.abort(); cancelAnimationFrame(raf); cancelAnimationFrame(sraf); mm?.revert(); vOff?.();
    if (sc) {
      sc.classList.remove("is-scene", "is-lit"); sc.style.removeProperty("--nl");
      document.documentElement.removeAttribute("data-close-cover");
      const nl = sc.querySelector<HTMLElement>(".l-close__nl"); if (nl) nl.inert = false;
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

/** the lines of a short text, as the browser broke them: each word (or a no-break group) measured in place, then one block span per line (.l-vl).
 *  Returns the undo. (gsap's SplitText mis-grouped these balanced, hanging quotes.) */
function splitLines(p: HTMLElement): () => void {
  const html = p.innerHTML, words: HTMLElement[] = [], frag = document.createDocumentFragment();
  [...p.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      (n.textContent || "").split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.append(" "); return; }
        const s = document.createElement("span"); s.textContent = t; words.push(s); frag.append(s);
      });
    } else { const s = document.createElement("span"); s.append(n.cloneNode(true)); words.push(s); frag.append(s); }
  });
  p.replaceChildren(frag);
  const lines: HTMLElement[][] = []; let top = -1e9;
  words.forEach((w) => { const t = w.offsetTop; if (t > top + 2) { lines.push([]); top = t; } lines[lines.length - 1].push(w); });
  p.replaceChildren(...lines.map((l) => {
    const d = document.createElement("span"); d.className = "l-vl";
    l.forEach((w, i) => { if (i) d.append(" "); d.append(...w.childNodes); });
    return d;
  }));
  return () => { p.innerHTML = html; };
}
