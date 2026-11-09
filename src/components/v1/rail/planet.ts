// r17 v1 js/planet.js: the lattice under the line that the tide is made of (only the transition into the Stack uses it).
// A stateless hex lattice: row k at y_k = lineY + gap + (k - 1) pr (pr = pitch x .866), odd rows offset by half a step; rows k = -1, 0 sit between the first row and the line. The lattice is in
// WORLD px along the line (x = cx + (j + off) pa - Xc, Xc = the world position under the screen centre, px), so it slides with the rail; it runs on below the stage (o.extra px: the part the
// rising tide brings up). Only the cells on screen are visited per frame.
export type Row = { k: number; y: number; off: number };
export type Lattice = { rows: Row[]; W: number; H: number; cx: number; lineY: number; gap: number; pr: number; pa: number };

export function makeLattice(o: { W: number; H: number; cx: number; lineY: number; pa: number; gap?: number; extra?: number }): Lattice {
  const { W, H, cx, lineY, pa } = o, gap = o.gap == null ? 14 : o.gap, extra = o.extra || 0, pr = pa * 0.866, rows: Row[] = [];
  for (let k = -1; ; k++) {
    const y = lineY + gap + (k - 1) * pr;
    if (y > H + extra + 6) break;
    rows.push({ k, y, off: k & 1 ? 0.5 : 0 });
  }
  return { rows, W, H, cx, lineY, gap, pr, pa };
}
/** where cell j of row g is on screen when the world sits at Xc (px) */
export const xOf = (P: Lattice, g: Row, j: number, Xc: number) => P.cx + (j + g.off) * P.pa - Xc;
/** the cells of row g within `span` px of the screen centre */
export const jRange = (P: Lattice, g: Row, Xc: number, span: number): [number, number] => [Math.ceil((Xc - span) / P.pa - g.off), Math.floor((Xc + span) / P.pa - g.off)];
