"use client";
// Type over a photo, always readable (D262, D264). Reads the photo's own pixels behind each word and line of text, at the crop on screen right
// now (object-fit: cover and its object-position), and picks:
//   - the type: white on a dark photo, ink on a light one. A post can force it (Img.textTone); otherwise the photo's hint (lib/blog/tone-hint.ts,
//     rendered into the HTML) is preferred unless the other tone needs clearly less veil, so a photo keeps one tone across screen sizes;
//   - the veil: dark under white type, white under ink type, the least at which every word's 98th-percentile pixel reaches 3.4:1 (title) or
//     4.9:1 (small text), and at least what the detail behind it asks for (busyness, D265); none when the type already reads on a plain area.
// The veil sits only behind the text: the root gets data-tone="white" | "ink", --veil-a (0…0.9) and --veil-x/y/w/h/f (px: the box round the
// words, and its feather, which grows with the box so no edge shows). Measured again on resize and when fonts load. With no hint, the text waits
// hidden until measured (CSS shows a safe default after 2.5 s). A photo that can't be read (another origin without CORS) keeps the hint or the
// safe default.
import { useEffect, type RefObject } from "react";
import { DARK_VEIL, LIGHT_VEIL, TARGET, busyFloor, busyness, choose, parseColor, veilFor, type RGB, type TextTone, type ToneHint } from "@/lib/blog/tone-math";

export type { TextTone };
/** a piece of text over the photo: its selector inside the root, whether it is large (the title: 3:1) and the opacity its colour is drawn at.
 *  own: measured (it counts towards the veil's strength) but kept out of the veil's box, for text far from the rest that draws its own veil (a caption) */
export type ToneZone = { sel: string; large?: boolean; alpha?: number; own?: boolean };

const PAD = 16;

/** the pieces of an element's text, as boxes on screen: its split words (.pbv-w, at their layout place, so the rise animation doesn't move them),
 *  else its child items (the meta row), else its text's line boxes */
function pieces(n: HTMLElement, root: HTMLElement, rootBox: DOMRect): DOMRect[] {
  const words = [...n.querySelectorAll<HTMLElement>(".pbv-w")];
  if (words.length) return words.map((w) => layoutBox(w, root, rootBox));
  const kids = [...n.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !!c.textContent?.trim());
  if (kids.length > 1) return kids.map((k) => layoutBox(k, root, rootBox));
  const r = document.createRange();
  r.selectNodeContents(n);
  const rects = [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1);
  return rects.length ? rects : [layoutBox(n, root, rootBox)];
}

/** the photo's pixels behind a box on screen, given its cover crop */
function pixelsUnder(data: ImageData, box: DOMRect, img: HTMLImageElement, imgBox: DOMRect) {
  const { naturalWidth: iw, naturalHeight: ih } = img;
  const W = imgBox.width, H = imgBox.height, s = Math.max(W / iw, H / ih);
  const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
  const ox = (W - iw * s) * px, oy = (H - ih * s) * py, k = data.width / iw;
  box = new DOMRect(box.left, box.top - box.height * 0.1, box.width, box.height * 1.2);   // a little taller: the glyphs' tops and tails reach past the word's box (D265)
  const x0 = Math.max(0, Math.floor(((box.left - imgBox.left - ox) / s) * k)), x1 = Math.min(data.width, Math.ceil(((box.right - imgBox.left - ox) / s) * k));
  const y0 = Math.max(0, Math.floor(((box.top - imgBox.top - oy) / s) * k)), y1 = Math.min(data.height, Math.ceil(((box.bottom - imgBox.top - oy) / s) * k));
  const step = Math.max(1, Math.round((2 * k) / s));   // about every 2 CSS px, so busyness reads the same at any image size
  const out: RGB[] = [];
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) { const i = (y * data.width + x) * 4; out.push([data.data[i], data.data[i + 1], data.data[i + 2]]); }
  return { px: out, cols: Math.max(0, Math.ceil((x1 - x0) / step)) };
}

/**
 * Sets the tone and the veil on `root` for the photo `imgSel` and the text `zones` inside it. `force` (Img.textTone) fixes the type's colour,
 * `hint` (from the server) is preferred; the veil is measured either way. Layout boxes are used, not transformed ones, so the settle and rise
 * animations don't skew the measurement.
 */
export function useTextTone(root: RefObject<HTMLElement | null>, imgSel: string, zones: ToneZone[], force?: TextTone, hint?: ToneHint) {
  const key = zones.map((z) => `${z.sel}:${z.large ? 1 : 0}:${z.alpha ?? 1}:${z.own ? 1 : 0}`).join("|");
  const prefer = force ?? hint?.tone, hintVeil = hint?.veil;
  useEffect(() => {
    const el = root.current, img = el?.querySelector<HTMLImageElement>(imgSel);
    if (!el) return;
    const hinted = hintVeil !== undefined;
    const set = (tone: TextTone, a: number, box?: { x: number; y: number; w: number; h: number; f: number }, final = true) => {
      el.dataset.tone = tone;
      el.style.setProperty("--veil-a", String(a));
      if (box) for (const [k, v] of Object.entries(box)) el.style.setProperty(`--veil-${k}`, `${Math.round(v)}px`);
      el.dataset.toneVeil = `${tone === "ink" ? "light" : "dark"} ${a}`;   // for checking: which veil, how strong
      if (final) el.dataset.toneReady = "";
    };
    if (!img) { set(force ?? "white", 0); return; }
    let data: ImageData | null = null, raf = 0, dead = false, gaveUp = hinted;

    const read = () => {
      raf = 0;
      if (dead) return;
      const css = getComputedStyle(el);
      const WHITE = parseColor(css.getPropertyValue("--paper-0"), [245, 244, 241]), INK = parseColor(css.getPropertyValue("--ink"), [38, 38, 38]);
      const rootBox = el.getBoundingClientRect(), io = offsetIn(img, el);
      const imgBox = new DOMRect(rootBox.left + io.x, rootBox.top + io.y, img.offsetWidth, img.offsetHeight);
      const bits = zones.flatMap((z) => [...el.querySelectorAll<HTMLElement>(z.sel)].flatMap((n) => pieces(n, el, rootBox).map((r) => ({ z, r }))));
      if (!bits.length) { set(prefer ?? "white", 0); return; }
      const main = bits.filter(({ z }) => !z.own);
      const u = (main.length ? main : bits).reduce((a, { r }) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }), { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity });
      const f = Math.min(160, Math.max(40, 0.4 * Math.min(u.r - u.l, u.b - u.t)));
      const box = { x: u.l - rootBox.left - PAD - f, y: u.t - rootBox.top - PAD - f, w: u.r - u.l + 2 * (PAD + f), h: u.b - u.t + 2 * (PAD + f), f };
      if (!data) { set(prefer ?? "white", hintVeil ?? 0.5, box, gaveUp); return; }
      // the veil each tone needs: the most any one word or line needs, for its brightness and (D265) for the detail behind it
      const under = bits.map(({ z, r }) => { const u = pixelsUnder(data!, r, img, imgBox); const b = busyness(u.px, u.cols); return { z, px: u.px, b, floor: busyFloor(b) }; });
      const need = (t: RGB, v: RGB) => Math.max(...under.map(({ z, px, floor }) => Math.max(floor, veilFor(px, t, z.alpha ?? 1, v, z.large ? TARGET.large : TARGET.small))));
      const white = force === "ink" ? Infinity : need(WHITE, DARK_VEIL), ink = force === "white" ? Infinity : need(INK, LIGHT_VEIL);
      const c = choose(white, ink, prefer);
      set(c.tone, c.veil, box);
      el.dataset.toneBusy = String(Math.max(...under.map((u) => u.floor)));   // for checking: the veil the detail alone asks for
      el.dataset.toneEdges = String(Math.round(Math.max(...under.map((u) => u.b)) * 1000) / 1000);   // for checking: the busiest piece's edge share
    };
    const later = () => { if (!raf) raf = requestAnimationFrame(read); };

    const load = () => {
      try {
        const k = Math.min(1, 1600 / img.naturalWidth), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        const g = c.getContext("2d", { willReadFrequently: true })!;
        g.drawImage(img, 0, 0, c.width, c.height);
        data = g.getImageData(0, 0, c.width, c.height);
      } catch { data = null; gaveUp = true; }   // another origin without CORS: the hint or the safe default
      later();
    };
    const fail = () => { gaveUp = true; later(); };
    if (img.complete && img.naturalWidth) load(); else img.addEventListener("load", load, { once: true });
    img.addEventListener("error", fail, { once: true });
    // a lazy picture (Up next) loads only near the view: with a hint the text already shows; without one, stop waiting after 2.5 s
    const timer = hinted ? 0 : window.setTimeout(fail, 2500);
    // and once more after the cover's settle and the title's rise (about 2.3 s), in case anything measured mid-way (D265)
    const settle = window.setTimeout(later, 2600);
    const ro = new ResizeObserver(later);
    ro.observe(el);
    document.fonts?.ready.then(later);
    later();
    return () => { dead = true; cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(settle); ro.disconnect(); img.removeEventListener("load", load); img.removeEventListener("error", fail); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zones are fixed per layout; `key` stands for them
  }, [root, imgSel, key, force, prefer, hintVeil]);
}

/** an element's offset inside `root`, summed over offsetParents: its layout position, ignoring transforms */
function offsetIn(n: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0, cur: HTMLElement | null = n;
  while (cur && cur !== root) { x += cur.offsetLeft; y += cur.offsetTop; cur = cur.offsetParent as HTMLElement | null; if (cur && !root.contains(cur)) break; }
  if (cur !== root) { const a = n.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top }; }
  return { x, y };
}
function layoutBox(n: HTMLElement, root: HTMLElement, rootBox: DOMRect) {
  const o = offsetIn(n, root);
  return new DOMRect(rootBox.left + o.x, rootBox.top + o.y, n.offsetWidth, n.offsetHeight);
}
