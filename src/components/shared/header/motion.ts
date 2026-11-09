// The site header's behaviour (r17 v1 js/header.js, b8's nav on our markup).
//   - compact on the first real scroll (64 px), wide again only near the top (24 px): no flicker. Wide = the three groups translated to their wide places (measured here);
//   - desktop panels: disclosure navigation (not an ARIA menu). Mouse hover opens at once and closes 120 ms after leaving; a click pins it; Enter / Space toggles;
//     Escape closes and returns focus; focus or a click leaving closes it; it closes once the page has clearly moved on (160 px). ONE panel, placed under the bar;
//   - the ground: the bar reads the band under it (every 4th frame) and turns dark over dark bands (two frames of agreement, one clean switch);
//   - the footer (#footer): as it arrives (its top from 92 % to 57 % of the screen) the bar slides up and away, scrubbed;
//   - phones (< 860 px): the N tile + Menu; Menu opens the map, modal: the page behind is inert, Tab stays inside, Escape closes.
// The quiet CTA while the hero is in view is CSS only: html[data-hero-in-view] is set by the hero (home/chapter-one/HeroInView.tsx).
import type { MotionCtx } from "@/lib/motion/scroll";

const COMPACT_IN = 64, COMPACT_OUT = 24, FOOT_A = 0.92, FOOT_B = 0.57, MOVED_ON = 160;

/** relative luminance of a computed colour, or -1 when it's (mostly) transparent */
const lum = (c: string) => {
  const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(c);
  if (!m || (m[4] !== undefined && +m[4] < 0.5)) return -1;
  return (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
};

export function mount(header: HTMLElement, { reduced }: MotionCtx) {
  const html = document.documentElement;
  const mqMob = matchMedia("(max-width: 859px)"), mqHover = matchMedia("(hover: hover) and (pointer: fine)");
  const isMob = () => mqMob.matches;
  const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = header) => r.querySelector(s) as T;   // the markup is ours (Header.tsx): every node exists
  const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = header) => [...r.querySelectorAll<T>(s)];
  const bar = $(".hd-bar"), logo = $(".hd-bar .hd-logo"), nav = $(".hd-nav"), list = $(".hd-list"), actions = $(".hd-actions");
  const trigs = $$<HTMLButtonElement>(".hd-trig"), panels = $$(".hd-panel");
  const map = $(".hd-map"), mapBtn = $<HTMLButtonElement>(".hd-bar .hd-menu"), closeBtn = $<HTMLButtonElement>(".hd-close", map);
  const ac = new AbortController(), on = { signal: ac.signal };
  let dead = false, raf = 0, closeT = 0, mapT = 0, quiet = false;

  // the panels render hidden (no JS: closed); from here they fade, and stay inert while closed
  panels.forEach((p) => { p.hidden = false; p.inert = true; });
  const st = { compact: null as boolean | null, open: null as string | null, pinned: false, openY: 0, dark: false, darkRaw: false, darkN: 0, fade: 0, away: false, map: false };

  // ── the wide offsets: from the compact places (the layout) to the wide ones (logo at the page margin, the menus centred, the action at the right margin) ──
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;width:var(--m, 64px);height:0";
  header.appendChild(probe);
  function measure() {
    header.setAttribute("data-calm", "");
    ["--dx-logo", "--dx-nav", "--dx-act"].forEach((k) => header.style.removeProperty(k));
    if (!isMob()) {
      const had = header.hasAttribute("data-compact"); header.setAttribute("data-compact", "");   // read the compact boxes untransformed
      const vw = html.clientWidth, m = probe.offsetWidth || 64;
      const l = logo.getBoundingClientRect(), n = nav.getBoundingClientRect(), a = actions.getBoundingClientRect();
      header.style.setProperty("--dx-logo", Math.round(m - l.left) + "px");
      header.style.setProperty("--dx-nav", Math.round((vw - n.width) / 2 - n.left) + "px");
      header.style.setProperty("--dx-act", Math.round(vw - m - a.right) + "px");
      if (!had) header.removeAttribute("data-compact");
    }
    void bar.offsetWidth; header.removeAttribute("data-calm");
  }

  // ── panels ──
  const panelOf = (id: string | null) => panels.find((p) => p.dataset.panel === id), trigOf = (id: string) => trigs.find((t) => t.dataset.panel === id);
  function place() {
    const p = panelOf(st.open); if (!p) return;
    const br = bar.getBoundingClientRect(), w = p.offsetWidth, vw = html.clientWidth;
    const x = Math.round(Math.max(12, Math.min(vw - w - 12, br.left + br.width / 2 - w / 2))), y = Math.round(br.bottom + 8);
    p.style.left = "0px"; p.style.top = "0px";
    const o = p.getBoundingClientRect();   // its containing block's origin (the menus may be translated)
    p.style.left = x - o.left + "px"; p.style.top = y - o.top + "px";
  }
  function openPanel(id: string, pin: boolean) {
    if (isMob()) return;
    clearTimeout(closeT);
    if (st.open === id) { if (pin) st.pinned = true; return; }
    list.toggleAttribute("data-switching", st.open !== null);
    st.open = id; st.pinned = pin; st.openY = scrollY;
    trigs.forEach((t) => t.setAttribute("aria-expanded", String(t.dataset.panel === id)));
    panels.forEach((p) => { const is = p.dataset.panel === id; p.classList.toggle("is-on", is); p.inert = !is; });
    place();
  }
  function closePanel(focusBack: boolean) {
    clearTimeout(closeT);
    if (!st.open) return;
    const id = st.open; st.open = null; st.pinned = false; list.removeAttribute("data-switching");
    trigs.forEach((t) => t.setAttribute("aria-expanded", "false"));
    panels.forEach((p) => { p.classList.remove("is-on"); p.inert = true; });
    if (focusBack) { const t = trigOf(id); if (t) { quiet = true; t.focus(); quiet = false; } }
  }
  const later = () => { clearTimeout(closeT); closeT = window.setTimeout(() => { if (!st.pinned) closePanel(false); }, 120); };
  trigs.forEach((t) => {
    const id = t.dataset.panel || "";
    t.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && mqHover.matches) openPanel(id, false); }, on);
    t.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") later(); }, on);
    t.addEventListener("click", () => { if (st.open === id && st.pinned) closePanel(false); else openPanel(id, true); }, on);
    t.addEventListener("focus", () => { if (!quiet && t.matches(":focus-visible")) openPanel(id, false); }, on);
  });
  panels.forEach((p) => {
    p.addEventListener("pointerenter", () => clearTimeout(closeT), on);
    p.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") later(); }, on);
  });
  nav.addEventListener("focusout", (e) => { const to = e.relatedTarget as Node | null; if (!to || !nav.contains(to)) closePanel(false); }, on);
  document.addEventListener("pointerdown", (e) => { if (st.open && !(e.target as Element | null)?.closest?.(".hd-panel, .hd-trig")) closePanel(false); }, on);

  // ── the map (phones): modal ──
  let inertList: Element[] = [];
  function setMap(open: boolean) {
    if (open === st.map) return;
    st.map = open; clearTimeout(mapT);
    mapBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      map.hidden = false;
      raf2(() => map.classList.add("is-open"));
      inertList = [...document.body.children].filter((el) => el !== header && el.tagName !== "SCRIPT" && !el.hasAttribute("inert"));
      inertList.forEach((el) => el.setAttribute("inert", ""));
      bar.inert = true; html.setAttribute("data-hd-locked", "");
      closeBtn.focus({ preventScroll: true });
    } else {
      map.classList.remove("is-open");
      mapT = window.setTimeout(() => { map.hidden = true; }, reduced ? 0 : 320);
      inertList.forEach((el) => el.removeAttribute("inert")); inertList = [];
      bar.inert = st.away; html.removeAttribute("data-hd-locked");
      mapBtn.focus({ preventScroll: true });
    }
  }
  mapBtn.addEventListener("click", () => setMap(true), on);
  closeBtn.addEventListener("click", () => setMap(false), on);
  map.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) setMap(false); }, on);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (st.map) { e.preventDefault(); setMap(false); } else if (st.open) { e.preventDefault(); closePanel(true); }
    } else if (e.key === "Tab" && st.map) {
      const f = $$("a[href], button", map).filter((el) => el.getClientRects().length);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || !map.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !map.contains(at))) { e.preventDefault(); first.focus(); }
    }
  }, on);

  // ── the ground under the bar: a band that says its tone (data-nav-tone, or the Stack's data-tone="dark"), else its background's luminance ──
  let nF = 0, lastG = false;
  function ground() {
    if (++nF % 4) return lastG;
    const r = bar.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, vw = innerWidth;
    for (const el of document.elementsFromPoint(x, y)) {
      if (header.contains(el)) continue;
      for (let e: Element | null = el; e && e !== document.body && e !== html; e = e.parentElement) {   // the band's ground, never a small element passing under the bar
        const nt = e.getAttribute("data-nav-tone"); if (nt) return (lastG = nt === "dark");
        if (e.getAttribute("data-tone") === "dark") return (lastG = true);
        if (e.getBoundingClientRect().width < vw * 0.6) continue;
        const L = lum(getComputedStyle(e).backgroundColor); if (L >= 0) return (lastG = L < 0.35);
      }
      break;
    }
    return (lastG = false);
  }

  // ── per frame ──
  let foot: HTMLElement | null = null;
  function frame() {
    const y = scrollY, vh = innerHeight;
    const compact = st.compact ? y > COMPACT_OUT : y > COMPACT_IN;
    if (compact !== st.compact) { st.compact = compact; header.toggleAttribute("data-compact", compact); closePanel(false); }
    const raw = ground();
    if (raw !== st.darkRaw) { st.darkRaw = raw; st.darkN = 0; } else st.darkN++;
    if (st.darkRaw !== st.dark && (st.darkN >= 2 || reduced)) {
      st.dark = st.darkRaw; header.setAttribute("data-flip", ""); header.toggleAttribute("data-dark", st.dark);
      raf2(() => header.removeAttribute("data-flip"));
    }
    if (!foot?.isConnected) foot = document.getElementById("footer");   // the footer mounts after the header (and may change with the route)
    const ft = foot && foot.offsetHeight ? foot.getBoundingClientRect().top : 1e9;
    let k = st.map ? 0 : Math.max(0, Math.min(1, (vh * FOOT_A - ft) / (vh * (FOOT_A - FOOT_B)))); k = k * k * (3 - 2 * k);
    if (Math.abs(k - st.fade) > 0.004 || (k === 0) !== (st.fade === 0) || (k === 1) !== (st.fade === 1)) {
      if (k > 0 !== st.fade > 0) { header.toggleAttribute("data-fading", k > 0); if (k > 0) closePanel(false); }
      st.fade = k; header.style.setProperty("--hd-fade", k.toFixed(3));
    }
    const away = k >= 1;
    if (away !== st.away) {
      st.away = away;
      if (away && bar.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
      bar.inert = away;
    }
    if (st.open && Math.abs(y - st.openY) > MOVED_ON) closePanel(false); else if (st.open) place();
  }
  const raf2 = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) fn(); }));

  measure(); frame();
  // the bar fades in once, after its first measure (never a raw bar, never a jump)
  let shown = false;
  const show = () => { if (shown || dead) return; shown = true; measure(); requestAnimationFrame(() => { if (!dead) header.setAttribute("data-in", ""); }); };
  document.fonts?.ready.then(show);
  document.fonts?.addEventListener("loadingdone", measure, on);
  const showT = window.setTimeout(show, 600);
  const loop = () => {
    try { frame(); } catch (err) { console.warn("[header]", err instanceof Error ? err.message : err); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  addEventListener("resize", () => { measure(); if (st.open) place(); if (!isMob() && st.map) setMap(false); }, on);
  addEventListener("load", measure, on);

  return () => {
    dead = true; ac.abort(); cancelAnimationFrame(raf);
    clearTimeout(closeT); clearTimeout(mapT); clearTimeout(showT);
    inertList.forEach((el) => el.removeAttribute("inert")); inertList = [];
    html.removeAttribute("data-hd-locked");
    probe.remove();
    panels.forEach((p) => { p.classList.remove("is-on"); p.inert = false; p.hidden = true; p.style.left = ""; p.style.top = ""; });
    trigs.forEach((t) => t.setAttribute("aria-expanded", "false"));
    list.removeAttribute("data-switching");
    map.classList.remove("is-open"); map.hidden = true; mapBtn.setAttribute("aria-expanded", "false"); bar.inert = false;
    ["data-compact", "data-dark", "data-flip", "data-calm", "data-in", "data-fading"].forEach((a) => header.removeAttribute(a));
    ["--dx-logo", "--dx-nav", "--dx-act", "--hd-fade"].forEach((k) => header.style.removeProperty(k));
  };
}
