import { clamp, out3, s01, sat } from "@/lib/motion/math";
import { scrub, type Mount } from "@/lib/motion/scroll";

/* The voices' reveal. Everything is scroll-scrubbed and reversible (each block has its own trigger, clamped so it completes by the end of the page):
 *   - the head (section top 92% -> 45%): the hairline above draws left -> right (0 - .6), the heading climbs word by word (.12 - .85);
 *   - the featured voice (its top 92% -> 45%): its words rise one after another (0 - .62), the attribution rises in (.5 - .78), then the green marker wipes over
 *     its phrase left -> right, across its line break (.66 - .98);
 *   - each of the three (its top 95% -> 62%): its hairline draws (0 - .5), the quote rises in (.18 - .7), the attribution (.36 - .82), and a thin green underline
 *     wipes under its phrase (.62 - 1). One full marker per screen (the featured); the three stay subtle.
 * The marks are bars laid behind the words from the mark's own line boxes (getClientRects), so a phrase that breaks over two lines is wiped as one stroke.
 * Reduced motion: nothing runs; the static markup shows everything (the marks as a plain green fill / underline). */

type Memo = Record<string, string>;

/* the words of an element into windows (<span.vx-k><span.vx-i>word</span></span>), spaces kept as text; nested inline elements (the mark) are split in place;
   the hanging opening mark joins the first word's window (the window is outdented instead of the mark). revert() puts the original nodes back. */
function split(el: HTMLElement) {
  const words: HTMLElement[] = [];
  const swaps: { orig: Text; parts: Node[] }[] = [];
  const walk = (node: Node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const t = n as Text, parts: Node[] = [];
      t.data.split(/(\s+)/).forEach((s) => {
        if (!s) return;
        if (/^\s+$/.test(s)) { parts.push(document.createTextNode(s)); return; }
        const k = document.createElement("span"), i = document.createElement("span");
        k.className = "vx-k"; i.className = "vx-i"; i.textContent = s; k.appendChild(i); parts.push(k); words.push(i);
      });
      t.replaceWith(...parts); swaps.push({ orig: t, parts });
    } else if (n.nodeType === 1 && !(n as HTMLElement).classList.contains("vx-hang")) walk(n);
  });
  walk(el);
  const hang = el.querySelector<HTMLElement>(":scope > .vx-hang");
  if (hang && words[0]) { words[0].prepend(hang); words[0].parentElement?.classList.add("vx-k--hang"); }
  return {
    words,
    revert() {
      swaps.forEach(({ orig, parts }) => { parts[0]?.parentNode?.insertBefore(orig, parts[0]); parts.forEach((p) => p.parentNode?.removeChild(p)); });
      if (hang) el.prepend(hang); // the hang is the paragraph's first child in the markup
    },
  };
}

/* a marker behind a <mark>: one bar per line box, wiped as one stroke (m 0..1). 'fill' = the block marker, 'u' = a thin underline */
function marker(p: HTMLElement, mark: HTMLElement, mode: "fill" | "u") {
  const box = document.createElement("span"); box.className = "vx-bars"; box.setAttribute("aria-hidden", "true"); p.appendChild(box);
  let segs: { b: HTMLElement; x0: number; w: number }[] = [], L = 0, m = 0, last = "";
  const paint = () => {
    const key = segs.length + ":" + m.toFixed(4); if (key === last) return; last = key;
    segs.forEach((s) => { const k = clamp((m * L - s.x0) / s.w, 0, 1); s.b.style.transform = `scaleX(${k.toFixed(4)})`; });
  };
  return {
    layout() {
      box.textContent = ""; segs = []; L = 0; last = "";
      const pr = p.getBoundingClientRect(), fs = parseFloat(getComputedStyle(p).fontSize) || 16;
      [...mark.getClientRects()].forEach((r) => {
        if (r.width < 2) return;
        const b = document.createElement("span"); b.className = "vx-bar";
        const x = r.left - pr.left - 0.08 * fs, w = r.width + 0.14 * fs;
        let y: number, h: number;
        if (mode === "u") { h = Math.max(2, Math.round(0.08 * fs)); y = r.bottom - pr.top - 0.05 * fs; }
        else { y = r.top - pr.top + 0.19 * fs; h = r.height - 0.27 * fs; }
        b.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
        box.appendChild(b); segs.push({ b, x0: L, w }); L += w;
      });
      paint();
    },
    set(v: number) { m = v; paint(); },
    remove() { box.remove(); },
  };
}

const setV = (el: HTMLElement, name: string, v: number, memo: Memo) => { const s = v.toFixed(3); if (memo[name] !== s) { memo[name] = s; el.style.setProperty(name, s); } };
/* the staircase: each word rises through its own window, one after another between a and b */
const rise = (words: HTMLElement[], P: number, a: number, b: number, dur: number, memo: Memo) => {
  const n = words.length, dw = n > 1 ? (b - a - dur) / (n - 1) : 0;
  words.forEach((w, i) => {
    const t = out3(sat(P, a + i * dw, a + i * dw + dur)), s = ((1 - t) * 108).toFixed(2);
    if (memo[i] !== s) { memo[i] = s; w.style.transform = s === "0.00" ? "" : `translate3d(0,${s}%,0)`; }
  });
};

export const mount: Mount = (sec, { ScrollTrigger, reduced }) => {
  if (reduced) return;
  const inner = sec.querySelector<HTMLElement>(".vx-inner"), title = sec.querySelector<HTMLElement>(".vx-title"), feat = sec.querySelector<HTMLElement>(".vx-feat");
  const fp = feat?.querySelector<HTMLElement>("blockquote p"), fby = feat?.querySelector<HTMLElement>(".vx-by"), fm = fp?.querySelector<HTMLElement>(".vx-mk");
  if (!inner || !title || !feat || !fp || !fby || !fm) return;
  const html = document.documentElement;
  html.setAttribute("data-vx", "");
  const styled: [HTMLElement, string][] = [[inner, "--h"], [fby, "--a"]];

  /* the head */
  const ts = split(title), mHead: Memo = {}, mTw: Memo = {};
  const head = (P: number) => { setV(inner, "--h", s01(sat(P, 0, 0.6)), mHead); rise(ts.words, P, 0.12, 0.85, 0.3, mTw); };

  /* the featured voice */
  const fs = split(fp), mFw: Memo = {}, mFby: Memo = {};
  const fmk = marker(fp, fm, "fill");
  const featR = (P: number) => { rise(fs.words, P, 0, 0.62, 0.24, mFw); setV(fby, "--a", out3(sat(P, 0.5, 0.78)), mFby); fmk.set(s01(sat(P, 0.66, 0.98))); };

  /* the three */
  const items = [...sec.querySelectorAll<HTMLElement>(".vx-item")].flatMap((li) => {
    const p = li.querySelector<HTMLElement>("blockquote p"), bq = li.querySelector<HTMLElement>("blockquote"), by = li.querySelector<HTMLElement>(".vx-by");
    if (!p || !bq || !by) return [];
    const mk = p.querySelector<HTMLElement>(".vx-mk");
    const memo: Memo = {}, mq: Memo = {}, mb: Memo = {};
    const k = mk ? marker(p, mk, "u") : null;
    styled.push([li, "--h"], [bq, "--q"], [by, "--a"]);
    const run = (P: number) => { setV(li, "--h", s01(sat(P, 0, 0.5)), memo); setV(bq, "--q", out3(sat(P, 0.18, 0.7)), mq); setV(by, "--a", out3(sat(P, 0.36, 0.82)), mb); if (k) k.set(s01(sat(P, 0.62, 1))); };
    return [{ li, k, run }];
  });

  const layout = () => { fmk.layout(); items.forEach((it) => it.k?.layout()); };
  const sts = [
    scrub(sec, "clamp(top 92%)", "clamp(top 45%)", head),
    scrub(feat, "clamp(top 92%)", "clamp(top 45%)", featR),
    ...items.map((it) => scrub(it.li, "clamp(top 95%)", "clamp(top 62%)", it.run)),
  ];
  layout();

  /* the bars follow the layout (every refresh, and once the fonts are in) */
  let alive = true, top = -1, raf = 0;
  const absTop = () => Math.round(sec.getBoundingClientRect().top + window.scrollY);
  const onRefresh = () => { layout(); top = absTop(); };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  document.fonts?.ready.then(() => { if (alive) layout(); });
  /* the section can move without a global refresh (a section above changing length): re-measure our triggers then */
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const t = absTop();
      if (top >= 0 && Math.abs(t - top) > 1) { top = t; sts.forEach((s) => s.refresh()); layout(); } else if (top < 0) top = t;
    });
  });
  ro.observe(document.body);

  return () => {
    alive = false; cancelAnimationFrame(raf); ro.disconnect();
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    fmk.remove(); items.forEach((it) => it.k?.remove());
    ts.revert(); fs.revert();
    styled.forEach(([el, name]) => el.style.removeProperty(name));
    html.removeAttribute("data-vx");
  };
};
