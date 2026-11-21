// Type over a photo (D262, D264): the contrast arithmetic shared by the browser (components/v3/post/tone.ts, on the pixels behind each word at the
// crop on screen) and the server (tone-hint.ts, a first guess from the photo alone, rendered into the HTML so the page never shows the wrong tone).
export type TextTone = "white" | "ink";
export type RGB = [number, number, number];
/** the tone a photo starts in and the veil it starts with, before the browser measures the actual crop */
export type ToneHint = { tone: TextTone; veil: number };

export const DARK_VEIL: RGB = [13, 15, 14];       // under white type
export const LIGHT_VEIL: RGB = [255, 255, 255];   // under ink type: white, not grey
export const PCT = 0.98;                          // the share of pixels behind a piece of text that must reach the target (D265: was 0.95)
export const TARGET = { large: 3.4, small: 4.9 }; // WCAG 3:1 (large) and 4.5:1 (normal), with margin for what the sampling misses (D265: was 3.1, 4.6)
export const MAX_VEIL = 0.9;

const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** the contrast of text (colour t at opacity ta) over the photo's pixel p once a veil (colour v, opacity a) is laid over it */
export function contrastAt(p: RGB, t: RGB, ta: number, v: RGB, a: number) {
  const bg: RGB = [p[0] * (1 - a) + v[0] * a, p[1] * (1 - a) + v[1] * a, p[2] * (1 - a) + v[2] * a];
  const fg: RGB = [t[0] * ta + bg[0] * (1 - ta), t[1] * ta + bg[1] * (1 - ta), t[2] * ta + bg[2] * (1 - ta)];
  return ratio(lum(...fg), lum(...bg));
}

/** the least veil (0…MAX_VEIL, steps of 0.02) at which PCT of the pixels reach `target`; Infinity when even MAX_VEIL doesn't */
export function veilFor(px: RGB[], t: RGB, ta: number, v: RGB, target: number) {
  if (!px.length) return 0;
  const allow = Math.floor(px.length * (1 - PCT));
  const ok = (a: number) => {
    let bad = 0;
    for (const p of px) if (contrastAt(p, t, ta, v, a) < target && ++bad > allow) return false;
    return true;
  };
  for (let i = 0; i <= Math.round(MAX_VEIL * 50); i++) if (ok(i / 50)) return i / 50;
  return Infinity;
}

/**
 * Which tone, given the veil each needs. `prefer` (a post's forced tone, or the photo's hint) wins unless the other tone needs clearly less
 * veil (0.3 or more), so a photo keeps one tone across screen sizes where it can, and a crop that puts the text over the other kind of area
 * still gets readable type without a heavy veil.
 */
export function choose(white: number, ink: number, prefer?: TextTone): { tone: TextTone; veil: number } {
  const best: TextTone = ink < white ? "ink" : "white";
  const tone = prefer && (prefer === best || needOf(prefer) <= needOf(best) + 0.3) ? prefer : best;
  const veil = needOf(tone);
  return { tone, veil: Number.isFinite(veil) ? veil : MAX_VEIL };
  function needOf(t: TextTone) { return t === "ink" ? ink : white; }
}

/**
 * How busy the photo is behind a piece of text (D265): the share of neighbouring samples of `px` (a grid `cols` wide, sampled about 2 CSS px
 * apart) whose lightness (CIE L*, 0…100) jumps by more than BUSY.jump. Brightness alone passes thin sharp detail (glass edges running through a
 * word), which still makes type hard to read. A plain or softly graded area scores near 0; edges, text and texture behind a word score 0.05 and up.
 */
export function busyness(px: RGB[], cols: number) {
  if (cols < 2 || px.length < 2 * cols) return 0;
  const L = px.map((p) => { const y = lum(...p); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; });
  let hit = 0, n = 0;
  for (let i = 0; i < L.length; i++) {
    if ((i + 1) % cols) { n++; if (Math.abs(L[i] - L[i + 1]) > BUSY.jump) hit++; }
    if (i + cols < L.length) { n++; if (Math.abs(L[i] - L[i + cols]) > BUSY.jump) hit++; }
  }
  return n ? hit / n : 0;
}
/** the least veil a piece of text gets for the detail behind it: none below BUSY.from, rising by BUSY.per for each 0.1 of busyness, at most BUSY.max */
export const BUSY = { jump: 8, from: 0.02, per: 0.35, max: 0.5 };
export const busyFloor = (b: number) => Math.round(Math.min(BUSY.max, Math.max(0, ((b - BUSY.from) / 0.1) * BUSY.per)) * 50) / 50;

export function parseColor(s: string, fallback: RGB): RGB {
  s = s.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
}
