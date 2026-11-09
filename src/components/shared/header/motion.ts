// The header's behaviour: b10's nav (js/nav.js, rounds 22–23), on our markup (Header.tsx).
//   - desktop: the pill that opens. .nv-pop is the panel's box: closed it sits folded under the pill; open it unfolds out of the pill's lower edge into the
//     black panel GAP px under it, centred on the pill, and morphs between menus (left/top/width/height on one empty box); the content fades in after.
//   - hover intent by geometry: a trigger opens after 60 ms of the pointer resting on it; the open menu stays while the pointer is in its zone (the triggers' row,
//     the bridge down to the panel, the panel), and closes 180 ms after it leaves. A click pins it; Escape closes and returns focus.
//   - hides on the way down past 96 px (8 px of scroll), back on any 6 px up; never while a menu or the map is open or focus is inside.
//   - the ground under the pill: dark over the dark bands (two frames of agreement, one clean switch).
//   - the footer (#footer): as it arrives (its top from 92 % to 57 % of the screen) the pill slides out, scrubbed; back on the way up.
//   - Get started: magnet (pointer: fine), and quiet (ghost) while the hero's own CTA is on screen (html[data-hero-in-view], CSS).
//   - phones (< 860 px): the N + Menu; Menu opens the map, modal: the page behind is inert, Tab stays inside, Escape closes.
import type { MotionCtx } from "@/lib/motion/scroll";
import { smooth } from "@/lib/motion/smooth";
import { mountIcons } from "./icons";

const GAP = 8;                                   // px between the pill and the panel
const OPEN_MS = 60, CLOSE_MS = 180, ZPAD = 6;    // hover intent
const HIDE_AFTER = 96, DOWN = 8, UP = 6;         // hide on the way down, back on the way up
const FOOT_A = 0.92, FOOT_B = 0.57;              // the footer's top from 92 % to 57 % of the viewport: the pill slides out
const MOVED_ON = 160;                            // a panel closes once the page has clearly moved on

/** relative luminance of a computed colour, or -1 when it's (mostly) transparent */
const lum = (c: string) => {
  const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(c);
  if (!m || (m[4] !== undefined && +m[4] < 0.5)) return -1;
  return (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
};
type R = { l: number; r: number; t: number; b: number };
const inR = (r: R, x: number, y: number) => x >= r.l && x <= r.r && y >= r.t && y <= r.b;

export function mount(header: HTMLElement, { reduced }: MotionCtx) {
  const doc = document.documentElement;
  const mqMob = matchMedia("(max-width: 859px)"), mqHover = matchMedia("(hover: hover) and (pointer: fine)");
  const isMob = () => mqMob.matches;
  const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = header) => r.querySelector(s) as T;   // the markup is ours: every node exists
  const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = header) => [...r.querySelectorAll<T>(s)];
  const bar = $(".nv-bar"), pop = $(".nv-pop"), list = $(".nv-list"), nav = $(".nv-nav");
  const menuBtn = $<HTMLButtonElement>(".nv-bar .nv-menu"), map = $(".nv-map"), closeBtn = $<HTMLButtonElement>(".nv-close", map);
  const cta = $<HTMLAnchorElement>(".nv-bar .nv-cta");
  const trigs = $$<HTMLButtonElement>(".nv-trig"), panels = $$(".nv-panel");
  const ac = new AbortController(), on = { signal: ac.signal }, onP = { signal: ac.signal, passive: true };
  let dead = false, raf = 0;
  panels.forEach((p) => { p.inert = true; });

  const icons = mountIcons(header, reduced);

  const st = { popKey: "", openId: null as string | null, pinned: false, map: false, dark: false, quiet: false,
    darkRaw: false, darkN: 0, openY: 0, away: false, fade: 0 };
  let closeT = 0, openT = 0;

  /* ── the pill that opens (desktop): coordinates in the pill's own box (pop and panels are absolute children of .nv-bar) ── */
  const panelOf = (id: string | null) => panels.find((p) => p.dataset.panel === id);
  const trigOf = (id: string) => trigs.find((t) => t.dataset.panel === id);
  function placePop(instant: boolean) {
    if (isMob()) return;
    const bw = bar.offsetWidth, bh = bar.offsetHeight, bl = bar.getBoundingClientRect().left, vw = doc.clientWidth;
    let x = 16, y = 6, w = bw - 32, h = bh - 12; // folded under the pill
    const p = panelOf(st.openId);
    if (p) {
      w = p.offsetWidth; h = p.offsetHeight;
      x = Math.round(Math.max(12 - bl, Math.min(vw - 12 - w - bl, bw / 2 - w / 2)));
      y = bh + GAP;
      p.style.left = x + "px"; p.style.top = y + "px";
    }
    const k = [x, y, w, h].map(Math.round).join(",");
    if (k === st.popKey && !instant) return;
    st.popKey = k;
    if (instant) pop.style.transition = "none";
    pop.style.left = Math.round(x) + "px"; pop.style.top = Math.round(y) + "px"; pop.style.width = Math.round(w) + "px"; pop.style.height = Math.round(h) + "px";
    if (instant) { void pop.offsetWidth; pop.style.transition = ""; }
  }
  function openPanel(id: string, pinned: boolean) {
    if (isMob()) return;
    clearTimeout(closeT); closeT = 0; clearTimeout(openT); openT = 0;
    const was = st.openId;
    if (was === id) { if (pinned) st.pinned = true; return; }
    st.openId = id; st.pinned = pinned; st.openY = scrollY;
    trigs.forEach((t) => t.setAttribute("aria-expanded", String(t.dataset.panel === id)));
    panels.forEach((p) => { const is = p.dataset.panel === id; p.classList.toggle("is-on", is); p.inert = !is; });
    header.classList.toggle("nv-switch", !!was); // between menus: the box morphs, the contents cross-fade at once
    placePop(false);
    pop.classList.add("is-open");
    header.classList.add("nv-popped");
    zoneKey = "";
    const p = panelOf(id); if (p) icons.draw(p); // the icons draw from dots as it opens
  }
  function closePanel(focusBack: boolean) {
    clearTimeout(closeT); closeT = 0; clearTimeout(openT); openT = 0;
    if (!st.openId) return;
    const id = st.openId;
    st.openId = null; st.pinned = false;
    trigs.forEach((t) => t.setAttribute("aria-expanded", "false"));
    panels.forEach((p) => { p.classList.remove("is-on"); p.inert = true; });
    pop.classList.remove("is-open");
    header.classList.remove("nv-popped", "nv-switch");
    placePop(false);
    if (focusBack) { const t = trigOf(id); if (t) { st.quiet = true; t.focus(); st.quiet = false; } }
  }

  /* ── hover intent: geometry, not enter / leave events ── */
  let zoneKey = "", zone: R[] | null = null, lastMove = 0, lastXY = "";
  function zoneOf(): R[] | null {
    const p = panelOf(st.openId); if (!p) return null;
    const br = bar.getBoundingClientRect(), lr = list.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const pt = br.bottom + GAP, ph = p.offsetHeight; // the panel's final top and height (its own transform is a 6 px fade-in nudge)
    return [
      { l: lr.left - ZPAD, r: lr.right + ZPAD, t: br.top - ZPAD, b: br.bottom },                          // the triggers' row, full pill height
      { l: Math.min(pr.left, lr.left), r: Math.max(pr.right, lr.right), t: br.bottom - 1, b: pt + 1 },     // the bridge
      { l: pr.left - ZPAD, r: pr.right + ZPAD, t: pt, b: pt + ph + ZPAD },                                  // the panel
    ];
  }
  const inZone = (x: number, y: number) => !!zone && zone.some((r) => inR(r, x, y));
  const canHover = () => mqHover.matches && !isMob() && !hd.on && !st.away && !st.map && st.fade === 0;
  function hoverMove(x: number, y: number) {
    if (!st.openId || st.pinned) return;
    const k = st.openId + st.popKey;
    if (k !== zoneKey) { zoneKey = k; zone = zoneOf(); }
    if (inZone(x, y)) { clearTimeout(closeT); closeT = 0; }
    else if (!closeT) closeT = window.setTimeout(() => { closeT = 0; if (!st.pinned) closePanel(false); }, CLOSE_MS);
  }
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const xy = e.clientX + "," + e.clientY;
    if (xy !== lastXY) { lastXY = xy; lastMove = performance.now(); }
    hoverMove(e.clientX, e.clientY);
  }, onP);
  doc.addEventListener("pointerleave", () => { if (st.openId && !st.pinned && !closeT) closeT = window.setTimeout(() => { closeT = 0; closePanel(false); }, CLOSE_MS); }, on);
  trigs.forEach((t) => {
    const id = t.dataset.panel || "";
    const intend = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !canHover() || st.openId === id) return;
      if (performance.now() - lastMove > 120) return; // the pill moved under a resting cursor: not an intent
      clearTimeout(openT);
      openT = window.setTimeout(() => { openT = 0; if (canHover() && t.matches(":hover")) openPanel(id, false); }, OPEN_MS);
    };
    t.addEventListener("pointerenter", intend, on);
    t.addEventListener("pointermove", (e) => { if (!openT) intend(e); }, on);
    t.addEventListener("pointerleave", () => { clearTimeout(openT); openT = 0; }, on);
    t.addEventListener("click", () => { if (st.openId === id && st.pinned) closePanel(false); else { openPanel(id, true); st.pinned = true; } }, on);
    t.addEventListener("focus", () => { if (!st.quiet && t.matches(":focus-visible")) openPanel(id, false); }, on);
  });
  nav.addEventListener("focusout", (e) => { const to = e.relatedTarget as Node | null; if (!to || !nav.contains(to)) closePanel(false); }, on);
  document.addEventListener("pointerdown", (e) => { if (st.openId && !(e.target as Element | null)?.closest?.(".nv-panel, .nv-trig, .nv-pop")) closePanel(false); }, on);

  /* ── the map (phones): modal ── */
  let inertList: Element[] = [], mapT = 0;
  function setInert(open: boolean) {
    if (open) {
      inertList = [...document.body.children].filter((el) => !el.contains(header) && el.tagName !== "SCRIPT" && !el.hasAttribute("inert"));
      inertList.forEach((el) => el.setAttribute("inert", ""));
    } else { inertList.forEach((el) => el.removeAttribute("inert")); inertList = []; }
  }
  function lockScroll(open: boolean) {
    const s = smooth(); if (s) { if (open) s.stop(); else s.start(); }
    doc.classList.toggle("nv-locked", open);
  }
  function fitMap() { // fill the screen when it fits; otherwise rows take their content and the map scrolls (never clips)
    const grid = $(".nv-map-grid"), body = $(".nv-map-body");
    grid.classList.remove("is-tall");
    if (map.hidden || isMob()) return;
    if (body.scrollHeight > body.clientHeight + 1) grid.classList.add("is-tall");
  }
  function setMap(open: boolean) {
    if (open === st.map) return;
    st.map = open; clearTimeout(mapT);
    menuBtn.setAttribute("aria-expanded", String(open));
    header.classList.toggle("nv-mapped", open);
    if (open) {
      setHidden(false);
      map.hidden = false;
      fitMap();
      raf2(() => map.classList.add("is-open"));
      setInert(true); lockScroll(true);
      closeBtn.focus({ preventScroll: true });
    } else {
      map.classList.remove("is-open");
      mapT = window.setTimeout(() => { map.hidden = true; }, reduced ? 200 : 400);
      setInert(false); lockScroll(false);
      menuBtn.focus({ preventScroll: true });
    }
  }
  menuBtn.addEventListener("click", () => setMap(!st.map), on);
  closeBtn.addEventListener("click", () => setMap(false), on);
  function trapIn(container: HTMLElement, e: KeyboardEvent) {
    const f = $$("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])", container)
      .filter((el) => !el.closest("[inert]") && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !container.contains(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === last || !container.contains(at))) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (st.map) { e.preventDefault(); setMap(false); }
      else if (st.openId) { e.preventDefault(); closePanel(true); }
    } else if (e.key === "Tab" && st.map) trapIn(map, e);
  }, on);

  /* ── clicks: the N goes home (on its own home: back to the top); Get started goes to Get into NEAR; a real page closes what's open and goes ── */
  const START_SEL = "#paths";   // Get into NEAR (shared/get-into)
  const startEl = () => document.querySelector<HTMLElement>(START_SEL);
  const goTo = (el: HTMLElement) => {
    const s = smooth();
    if (s) s.scrollTo(el, { offset: -24, duration: 1.4 }); else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  const toTop = () => { const s = smooth(); if (s) s.scrollTo(0); else scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); };
  // a page without Get into NEAR: Get started leaves for near.com
  const fixStarts = () => { if (!startEl()) $$<HTMLAnchorElement>("[data-nv-start]").forEach((a) => { a.href = "https://near.com"; }); };
  header.addEventListener("click", (e) => {
    const t = e.target as Element;
    const home = t.closest<HTMLAnchorElement>("[data-nv-home]");
    const start = t.closest<HTMLAnchorElement>("[data-nv-start]");
    const link = t.closest<HTMLAnchorElement>("[data-nv-link]");
    if (home) {
      if (new URL(home.href, location.href).pathname !== location.pathname) { if (st.map) setMap(false); return; } // another page: let it go
      e.preventDefault(); if (st.map) setMap(false); closePanel(false); toTop(); return;
    }
    if (start) {
      const el = startEl(); if (!el) { if (st.map) setMap(false); return; }
      e.preventDefault(); if (st.map) setMap(false); closePanel(false); goTo(el); return;
    }
    if (link) { if (st.map) setMap(false); closePanel(false); }
  }, on);

  /* ── hide on the way down, back on the way up (never inert: Tab into the hidden pill brings it back) ── */
  const hd = { y: scrollY, acc: 0, on: false, up: false };
  function setHidden(v: boolean) { if (v === hd.on) return; hd.on = v; header.classList.toggle("nv-hide", v); }
  header.addEventListener("focusin", () => { hd.acc = 0; setHidden(false); }, on);

  /* ── the ground under the pill: a band that says its tone (data-nav-tone, or the Stack's data-tone="dark"), else its background's luminance ── */
  let nF = 0, lastG = false;
  function ground() {
    if (++nF % 4 || hd.on) return lastG; // read every 4th frame; hold while the pill is out of view
    const r = bar.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, vw = innerWidth;
    for (const el of document.elementsFromPoint(x, y)) {
      if (header.contains(el)) continue;
      for (let e: Element | null = el; e && e !== document.body && e !== doc; e = e.parentElement) {   // the band's ground, never a small element passing under the pill
        const nt = e.getAttribute("data-nav-tone"); if (nt) return (lastG = nt === "dark");
        if (e.getAttribute("data-tone") === "dark") return (lastG = true);
        if (e.getBoundingClientRect().width < vw * 0.6) continue;
        const L = lum(getComputedStyle(e).backgroundColor); if (L >= 0) return (lastG = L < 0.35);
      }
      break;
    }
    return (lastG = false);
  }

  /* ── per frame: theme, hide, footer slide ── */
  let foot: HTMLElement | null = null;
  function frame() {
    const y = scrollY, vh = innerHeight;
    const raw = ground();
    if (raw !== st.darkRaw) { st.darkRaw = raw; st.darkN = 0; } else st.darkN++;
    if (st.darkRaw !== st.dark && (st.darkN >= 2 || reduced)) {
      st.dark = st.darkRaw;
      header.classList.add("nv-flip");
      header.classList.toggle("is-dark", st.dark);
      raf2(() => header.classList.remove("nv-flip"));
    }
    // direction, with a little hysteresis
    const dy = y - hd.y; hd.y = y;
    if (dy) {
      hd.acc = Math.sign(dy) === Math.sign(hd.acc) ? hd.acc + dy : dy;
      const busy = st.openId || st.map || header.contains(document.activeElement);
      if (y <= HIDE_AFTER || busy) { setHidden(false); hd.up = false; }
      else if (hd.acc >= DOWN) { setHidden(true); hd.up = false; }
      else if (hd.acc <= -UP) { setHidden(false); hd.up = true; } // on the way up it returns anywhere, the footer too
    }
    // the footer: its own mark, Get started and map take over, so the floating pill slides out, scrubbed
    if (!foot?.isConnected) foot = document.getElementById("footer");
    let k = 0;
    if (foot && !st.map && !hd.up) { const ft = foot.offsetHeight ? foot.getBoundingClientRect().top : 1e9; k = Math.max(0, Math.min(1, (vh * FOOT_A - ft) / (vh * (FOOT_A - FOOT_B)))); }
    k = k * k * (3 - 2 * k);
    if (Math.abs(k - st.fade) > 0.004 || (k === 0) !== (st.fade === 0) || (k === 1) !== (st.fade === 1)) {
      if (k > 0 !== st.fade > 0) { header.classList.toggle("nv-fading", k > 0); if (k > 0) closePanel(false); }
      st.fade = k; header.style.setProperty("--nv-fade", k.toFixed(3));
    }
    const away = k >= 1;
    if (away !== st.away) {
      st.away = away; header.classList.toggle("nv-away", away);
      if (away && header.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
      bar.inert = away;
    }
    // panels close once the page has clearly moved on
    if (st.openId && Math.abs(y - st.openY) > MOVED_ON && (st.pinned || !lastXY || !inZone(+lastXY.split(",")[0], +lastXY.split(",")[1]))) closePanel(false);
    else if (st.openId) placePop(false);
  }
  const raf2 = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) fn(); }));

  /* ── magnet: Get started (pointer: fine). Pull ≤ 6 px, label ≤ 3 px, zone = box + 24 px; in tick 240, back settle 400 (CSS transitions on translate).
     A pill the page carries out from under a resting pointer lets go: on every scroll it re-checks against the last pointer position. ── */
  let ptr: { x: number; y: number } | null = null, magOn = false;
  const lab = cta.querySelector<HTMLElement>(".mag-l");
  const magWhen = () => !isMob() && !doc.hasAttribute("data-hero-in-view") && !st.away && !hd.on && !st.openId;
  const put = (x: number, y: number) => {
    cta.style.translate = x ? x.toFixed(2) + "px " + y.toFixed(2) + "px" : "";
    if (lab) lab.style.translate = x ? (x / 2).toFixed(2) + "px " + (y / 2).toFixed(2) + "px" : "";
  };
  const magOff = () => { if (magOn) { magOn = false; cta.classList.remove("is-mag"); put(0, 0); } };
  function magnet(px: number, py: number, scrolled?: boolean) {
    if (scrolled && !magOn) return; // a scroll only releases; it never starts a pull under a still pointer
    const r = cta.getBoundingClientRect(); if (!r.width) { magOff(); return; }
    const Z = 24, inside = magWhen() && px > r.left - Z && px < r.right + Z && py > r.top - Z && py < r.bottom + Z;
    if (!inside) { magOff(); return; }
    const nx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 2 + Z))), ny = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 2 + Z)));
    if (!magOn) { magOn = true; cta.classList.add("is-mag"); }
    put(nx * 6, ny * 6);
  }
  if (mqHover.matches && !reduced) {
    cta.setAttribute("data-mag", "");
    document.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; ptr = { x: e.clientX, y: e.clientY }; magnet(ptr.x, ptr.y); }, onP);
    addEventListener("scroll", () => { if (ptr) magnet(ptr.x, ptr.y, true); }, { signal: ac.signal, passive: true, capture: true });
  }

  /* ── go ── */
  fixStarts();
  placePop(true); frame();
  const loop = () => {   // own rAF loop: a throwing page listener elsewhere never stalls the nav
    try { frame(); } catch (err) { console.warn("[header]", err instanceof Error ? err.message : err); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  addEventListener("resize", () => { placePop(true); fitMap(); if (!isMob() && st.map) setMap(false); }, on);
  addEventListener("load", () => { placePop(true); fixStarts(); }, on);
  document.fonts?.ready.then(() => { if (!dead) placePop(true); });

  return () => {
    dead = true; ac.abort(); cancelAnimationFrame(raf);
    clearTimeout(closeT); clearTimeout(openT); clearTimeout(mapT);
    icons.dispose();
    inertList.forEach((el) => el.removeAttribute("inert")); inertList = [];
    doc.classList.remove("nv-locked");
    if (st.map) smooth()?.start();
    panels.forEach((p) => { p.classList.remove("is-on"); p.inert = false; p.style.left = ""; p.style.top = ""; });
    trigs.forEach((t) => t.setAttribute("aria-expanded", "false"));
    pop.classList.remove("is-open"); pop.removeAttribute("style");
    map.classList.remove("is-open"); map.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); bar.inert = false;
    cta.removeAttribute("data-mag"); cta.classList.remove("is-mag"); put(0, 0);
    header.classList.remove("nv-popped", "nv-switch", "nv-mapped", "nv-hide", "nv-flip", "is-dark", "nv-fading", "nv-away");
    header.style.removeProperty("--nv-fade");
  };
}
