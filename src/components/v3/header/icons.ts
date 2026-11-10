// b10's line icons (builder I, round 22, js/icons.js), ported for v3: the header's panels, the ruled page after the Stack and the footer.
// Every <i data-icon="name"> under the root renders as inline SVG from public/nav/icons/<name>.svg (one file per icon).
// Hairline ink, one green element. Motion: an icon rests as dots along its paths and draws into lines when it first enters the view,
// when its panel opens (draw(root)) and on hover / focus of its link; the green comes last. Reduced motion: drawn, no motion.
const NS = "http://www.w3.org/2000/svg";
const BASE = "/nav/icons/";
// the files in public/nav/icons (an unknown name is never fetched)
const NAMES = ["near-com", "near-intents", "near-ai", "near-protocol", "chain-abstraction", "quantum-security", "docs", "solutions", "research", "blog",
  "analytics", "brand", "mail", "briefcase", "history", "roadmap", "economics", "foundation", "people", "governance",
  "clock", "news", "quote", "video", "play", "x", "youtube", "github", "reddit", "telegram", "discord"];
const ALIAS: Record<string, string> = {
  account: "near-com", intents: "near-intents", enclave: "near-ai", ai: "near-ai", protocol: "near-protocol", quantum: "quantum-security",
  contact: "mail", careers: "briefcase", community: "people",
  read: "news", story: "quote", watch: "video",   /* Go deeper's glyphs (deeper-read …) */
};
const SHAPES = new Set(["path", "circle", "ellipse", "rect", "line", "polyline", "polygon"]);

const DUR = 620;      // draw, ms (calm)
const REWIND = 200;   // hover: lines fold back to dots first, ms
const ACC_AT = 0.74;  // the green accent's window starts here on the 0..1 timeline

type Dot = { n: SVGCircleElement; f: number };
type Path = { node: SVGGeometryElement; L: number; dots: Dot[]; r: number; a: number; b: number };
type St = {
  i: HTMLElement; svg: SVGSVGElement; gDots: SVGGElement; strokes: SVGGeometryElement[]; fills: SVGElement[]; accs: (SVGElement & { r0?: number })[];
  T: number; raf: number; busy: boolean; size: number; measured: boolean; paths: Path[];
};

const cache = new Map<string, Promise<string>>();
const load = (name: string) => {
  let p = cache.get(name);
  if (!p) { p = fetch(BASE + name + ".svg").then((r) => r.text()); cache.set(name, p); }
  return p;
};
// 'menu-account' and the like resolve to the base icon
const resolve = (raw: string) => {
  let n = raw.toLowerCase();
  if (!NAMES.includes(n) && !ALIAS[n]) n = n.replace(/^(menu|deeper|footer|nav|card|stack|own)-/, "");
  return ALIAS[n] || n;
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const el = <T extends SVGElement>(tag: string, cls?: string) => { const n = document.createElementNS(NS, tag) as T; if (cls) n.setAttribute("class", cls); return n; };

/** mounts every icon under root; returns draw(panel) (a panel just opened: draw its icons now) and the clean-up */
export function mountIcons(root: HTMLElement, reduced: boolean) {
  const all: St[] = [];
  const stOf = new WeakMap<Element, St>();
  const hosts = new WeakMap<Element, St[]>();
  const ac = new AbortController(), on = { signal: ac.signal };
  let dead = false;

  /* ---------- geometry: hairline width and dots, in screen px ---------- */
  function layout(st: St) {
    let s = st.i.getBoundingClientRect().width;
    st.measured = s > 0;
    if (!s) s = 24;
    st.size = s;
    const k = 24 / s; // user units per css px
    const px = s <= 18 ? 1 : s <= 22 ? 1.1 : 1.25; // 1.1 at 20 px, so the 20 px menu rows read as fine as 16 and 24
    const gap = (s <= 18 ? 2.3 : s <= 26 ? 2.6 : s <= 40 ? 2.9 : 3.4) * k;
    const r = (s <= 18 ? 0.6 : s <= 26 ? 0.7 : s <= 40 ? 0.8 : 1) * k;
    st.svg.style.setProperty("--ic-sw", (px * k).toFixed(3));
    // the green spark never shrinks below a 2 px dot on screen
    st.accs.forEach((n) => {
      if (n.localName !== "circle") return;
      if (n.r0 == null) n.r0 = parseFloat(n.getAttribute("r") || "") || 0;
      n.setAttribute("r", Math.max(n.r0, 1.0 * k).toFixed(3));
    });
    st.gDots.textContent = "";
    st.paths = st.strokes.map((node) => {
      let L = 0;
      try { L = node.getTotalLength(); } catch { L = 0; }
      const closed = /^(circle|ellipse|rect|polygon)$/.test(node.localName) || /z\s*$/i.test(node.getAttribute("d") || "");
      const n = Math.max(2, Math.round(L / gap));
      let host: SVGGElement = st.gDots;
      const tf = node.getAttribute("transform");
      if (tf) { host = el<SVGGElement>("g"); host.setAttribute("transform", tf); st.gDots.appendChild(host); }
      const dots: Dot[] = [];
      const last = closed ? n - 1 : n;
      for (let j = 0; j <= last; j++) {
        const f = j / n, p = node.getPointAtLength(L * f);
        const d = el<SVGCircleElement>("circle");
        d.setAttribute("cx", p.x.toFixed(2)); d.setAttribute("cy", p.y.toFixed(2)); d.setAttribute("r", r.toFixed(3));
        host.appendChild(d);
        dots.push({ n: d, f });
      }
      node.style.strokeDasharray = L + " " + (L + 2);
      return { node, L, dots, r, a: 0, b: 1 };
    });
    // timeline windows: paths overlap with a small stagger, all inside [0, 0.8]
    const count = st.paths.length || 1;
    const stagger = Math.min(0.12, 0.34 / count);
    const len = Math.max(0.36, 0.8 - stagger * (count - 1));
    st.paths.forEach((p, k2) => { p.a = k2 * stagger; p.b = Math.min(0.86, p.a + len); });
  }

  /* ---------- one frame of the 0..1 timeline ---------- */
  function render(st: St, T: number) {
    st.T = T;
    const W = 0.14;
    st.paths.forEach((p) => {
      const q = easeInOut(clamp01((T - p.a) / (p.b - p.a)));
      const head = q * (1 + W);
      p.node.style.opacity = q > 0.002 ? "1" : "0";
      p.node.style.strokeDashoffset = (p.L * (1 - q)).toFixed(2);
      p.dots.forEach((d) => { d.n.style.opacity = q >= 1 ? "0" : clamp01((d.f - head) / W + 1).toFixed(3); });
    });
    const a = clamp01((T - ACC_AT) / (1 - ACC_AT));
    const s = a > 0 ? 0.25 + 0.75 * easeOutBack(a) : 0.25;
    st.accs.forEach((n) => { n.style.opacity = clamp01(a * 1.6).toFixed(3); n.style.transform = "scale(" + s.toFixed(3) + ")"; });
    st.fills.forEach((n) => { n.style.opacity = "1"; });
  }

  /* ---------- motion ---------- */
  function go(st: St, to: number, ms: number, then?: () => void) {
    cancelAnimationFrame(st.raf);
    const from = st.T; let t0 = 0;
    if (ms <= 0 || from === to) { render(st, to); then?.(); return; }
    const step = (now: number) => {
      if (dead) return;
      if (!t0) t0 = now;
      const t = clamp01((now - t0) / ms);
      render(st, from + (to - from) * t);
      if (t < 1) st.raf = requestAnimationFrame(step); else then?.();
    };
    st.raf = requestAnimationFrame(step);
  }
  function draw(st: St, delay: number) {
    if (!st.measured) layout(st);
    if (st.busy) return;
    st.busy = true;
    window.setTimeout(() => { if (!dead) go(st, 1, DUR * (1 - st.T), () => { st.busy = false; }); }, delay || 0);
  }
  function replay(st: St) {
    if (reduced || st.busy) return;
    if (!st.measured) layout(st);
    st.busy = true;
    go(st, 0, REWIND * st.T, () => go(st, 1, DUR, () => { st.busy = false; }));
  }

  const io = new IntersectionObserver((entries) => {
    let n = 0;
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const st = stOf.get(e.target);
      if (st && st.T < 1) draw(st, Math.min(420, 70 * n++));
    });
  }, { threshold: 0.6, rootMargin: "0px 0px -6% 0px" });

  function bindHost(st: St) {
    const host = st.i.closest("a,button") || st.i.parentElement;
    if (!host) return;
    let list = hosts.get(host);
    if (!list) {
      list = []; hosts.set(host, list);
      const fire = () => hosts.get(host)?.forEach(replay);
      host.addEventListener("pointerenter", fire, on);
      host.addEventListener("focusin", fire, on);
    }
    list.push(st);
  }

  function build(i: HTMLElement, txt: string) {
    if (dead) return;
    const src = new DOMParser().parseFromString(txt, "image/svg+xml").documentElement;
    const svg = el<SVGSVGElement>("svg", "ic");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    const gLn = el<SVGGElement>("g", "ic-ln"), gDots = el<SVGGElement>("g", "ic-dots"), gFill = el<SVGGElement>("g", "ic-fill"), gAcc = el<SVGGElement>("g", "ic-acc");
    const strokes: SVGGeometryElement[] = [], fills: SVGElement[] = [], accs: SVGElement[] = [];
    Array.from(src.children).forEach((n) => {
      if (!SHAPES.has(n.localName)) return;
      const cls = n.getAttribute("class") || "";
      const c = document.importNode(n, true) as SVGElement;
      ["class", "fill", "stroke", "stroke-width", "style"].forEach((a) => c.removeAttribute(a));
      if (/\bg\b/.test(cls)) { c.setAttribute("class", "ic-g"); gAcc.appendChild(c); accs.push(c); }
      else if (/\bf\b/.test(cls)) { c.setAttribute("class", "ic-f"); gFill.appendChild(c); fills.push(c); }
      else { gLn.appendChild(c); strokes.push(c as SVGGeometryElement); }
    });
    svg.append(gLn, gDots, gFill, gAcc);
    i.textContent = "";
    i.appendChild(svg);
    const st: St = { i, svg, gDots, strokes, fills, accs, T: 0, raf: 0, busy: false, size: 0, measured: false, paths: [] };
    stOf.set(i, st);
    all.push(st);
    layout(st);
    if (reduced) { render(st, 1); return; }
    render(st, 0);
    io.observe(i);
    bindHost(st);
  }

  root.querySelectorAll<HTMLElement>("i[data-icon]").forEach((i) => {
    const name = resolve(i.getAttribute("data-icon") || "");
    if (!NAMES.includes(name)) { console.warn('[icons] unknown icon "' + name + '"'); return; }
    load(name).then((txt) => build(i, txt), () => { /* offline: the slot stays empty */ });
  });

  let rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => all.forEach((st) => {
      const s = st.i.getBoundingClientRect().width;
      if (s && Math.abs(s - st.size) > 0.5) { layout(st); render(st, st.T); }
    }), 200);
  }, on);

  return {
    /** a panel just opened: its icons draw from dots now, one after the other */
    draw(panel: Element) {
      let n = 0;
      panel.querySelectorAll("i[data-icon]").forEach((i) => {
        const st = stOf.get(i); if (!st || !st.paths) return;
        io.unobserve(i);
        layout(st);
        if (reduced) { render(st, 1); return; }
        cancelAnimationFrame(st.raf); st.busy = false; render(st, 0);
        draw(st, Math.min(480, 40 * n++));
      });
    },
    dispose() {
      dead = true; ac.abort(); io.disconnect(); clearTimeout(rt);
      all.forEach((st) => { cancelAnimationFrame(st.raf); st.i.textContent = ""; });
      all.length = 0;
    },
  };
}
