// r17 v1 js/sample.js: sampling helpers, glyphs and polylines -> dots (positions in px, relative to the stage's top left).
export type Pt = [number, number];
export type Org = { left: number; top: number };

export function mulberry32(a: number): () => number {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** a hex grid of points inside the glyphs of `node` (its own font); `scale` = the transform scale the node is drawn at */
export function sampleText(node: Element, pitch: number, org: Org, scale = 1): Pt[] {
  const r = node.getBoundingClientRect(), cs = getComputedStyle(node);
  const SC = 3, pad = 4, w = Math.ceil(r.width + 2 * pad), h = Math.ceil(r.height + 2 * pad);
  if (w < 6 || h < 6) return [];
  const pl = (parseFloat(cs.paddingLeft) || 0) * scale, pt = (parseFloat(cs.paddingTop) || 0) * scale, pb = (parseFloat(cs.paddingBottom) || 0) * scale;
  const cv = document.createElement("canvas"); cv.width = w * SC; cv.height = h * SC;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) return [];
  cx.scale(SC, SC); cx.fillStyle = "#000"; cx.textBaseline = "alphabetic";
  cx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * scale}px ${cs.fontFamily}`;
  if ("letterSpacing" in cx) cx.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * scale + "px";
  const text = (node.textContent || "").trim(), m = cx.measureText(text);
  const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
  cx.fillText(text, pad + pl, pad + pt + (r.height - pt - pb - (asc + desc)) / 2 + asc);
  const img = cx.getImageData(0, 0, cv.width, cv.height).data, pts: Pt[] = [], rowH = pitch * 0.866;
  for (let y = rowH * 0.5, row = 0; y < h; y += rowH, row++) {
    const off = row & 1 ? pitch * 0.5 : 0;
    for (let x = off + pitch * 0.25; x < w; x += pitch) {
      if (img[4 * (Math.min(cv.height - 1, Math.round(y * SC)) * cv.width + Math.min(cv.width - 1, Math.round(x * SC))) + 3] > 127) pts.push([r.left - pad + x - org.left, r.top - pad + y - org.top]);
    }
  }
  return pts;
}

/** points along a polyline given in px */
export function samplePoly(poly: Pt[], pitch: number, closed = false): Pt[] {
  const pts: Pt[] = [], P = closed ? poly.concat([poly[0]]) : poly;
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1], [x1, y1] = P[i], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(d / pitch));
    for (let k = 0; k < n; k++) pts.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  if (!closed) pts.push(P[P.length - 1]);
  return pts;
}
