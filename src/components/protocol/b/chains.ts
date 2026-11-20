// Protocol B · Chain Signatures, drawn in the page's lanes: the NEAR lane at the top (600 ms chunks), the MPC signers under it, and other chains' lanes
// below, each closing blocks at its own pace. Every few blocks a NEAR account asks for a signature: the request leaves its chunk at the now line, a
// threshold of the MPC signers lights, and the signature goes down to the next chain in turn, where it lands as that chain's own native transaction
// (green) and rides into its next block. No bridge on the way. Time runs right to left, as in the hero. Illustrative: the chains' block paces are
// scaled for the picture, not their real ones.
import { clamp01, hash, lerp, smooth } from "./stage";
import { BT } from "./net";

const CHAINS = [
  { name: "BITCOIN", scheme: "ECDSA", every: 4.2 },
  { name: "ETHEREUM", scheme: "ECDSA", every: 1.8 },
  { name: "SOLANA", scheme: "EDDSA", every: 0.6 },
];
const ASK = 6;                       // a request every 6 NEAR blocks
const NODES = 8, THRESHOLD = 5;      // MPC signers, and how many must sign
const T_DOWN = 0.32, T_SIGN = 0.8, T_LAND = 1.25;   // after the request's chunk: at the signers, signed, landed

export function createChains({ mono, sans }: { mono: string; sans: string }) {
  const ink = (a: number) => `rgba(38,38,38,${a})`;
  const GREEN = "#00dc8d", GREEN_T = "#00a86b", GROUND = "#f5f4f1";
  const font = (c: CanvasRenderingContext2D, px: number, m = true) => {
    c.font = `${px}px ${m ? mono : sans}`;
    if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = m ? "0.06em" : "0px";
  };

  return function draw(c: CanvasRenderingContext2D, w: number, h: number, T: number) {
    const narrow = w < 560;
    const padL = narrow ? 70 : 96, padR = 12, top = 30, bottom = h - 14;
    const bw = narrow ? 14 : 20, slot = bw + 4, speed = slot / BT;
    const nowX = padL + (w - padL - padR) * 0.66, xEnd = w - padR;
    // the rows: NEAR, the signers' band, each chain, then "and more"
    const rowsN = CHAINS.length + 3, rh = (bottom - top) / rowsN;
    const yNear = top + rh * 0.5, yMpc = top + rh * 1.6, yChain = (i: number) => top + rh * (2.75 + i), yMore = top + rh * (2.75 + CHAINS.length);
    const visSecs = (nowX - padL) / speed + 0.6;
    const ch = Math.min(16, rh * 0.42);

    /* the now line */
    c.strokeStyle = ink(0.4); c.lineWidth = 1; c.beginPath(); c.moveTo(nowX + 0.5, top - 16); c.lineTo(nowX + 0.5, bottom); c.stroke();
    font(c, 10); c.textBaseline = "bottom"; c.textAlign = "left"; c.fillStyle = ink(0.75); c.fillText("NOW", nowX + 6, top - 6);

    /* lane lines and names */
    const rowLine = (y: number, a: number, dash = false) => { c.strokeStyle = ink(a); if (dash) c.setLineDash([2, 4]); c.beginPath(); c.moveTo(padL, y); c.lineTo(xEnd, y); c.stroke(); c.setLineDash([]); };
    rowLine(yNear, 0.14); CHAINS.forEach((_, i) => rowLine(yChain(i), 0.14)); rowLine(yMore, 0.2, true);
    font(c, 10); c.textAlign = "right"; c.textBaseline = "middle";
    c.fillStyle = ink(0.85); c.fillText("NEAR", padL - 12, yNear);
    c.fillStyle = ink(0.55); c.fillText("MPC", padL - 12, yMpc);
    CHAINS.forEach((ch2, i) => {
      c.fillStyle = ink(0.75); c.fillText(ch2.name, padL - 12, yChain(i) - 6);
      c.fillStyle = ink(0.42); c.fillText(ch2.scheme, padL - 12, yChain(i) + 7);
    });
    c.fillStyle = ink(0.42); c.fillText(narrow ? "+ MORE" : "30+ CHAINS", padL - 12, yMore);

    /* NEAR's chunks; the ones that carry a request are marked green */
    const kNow = Math.floor(T / BT), kMin = Math.floor((T - visSecs) / BT);
    for (let k = kMin; k <= kNow; k++) {
      const age = T - k * BT, xr = nowX - age * speed, xl = xr - bw;
      if (xr < padL) continue;
      const x0 = Math.max(xl, padL), hh = ch * smooth(age / 0.2);
      c.globalAlpha = clamp01((xl - padL) / 30 + 0.35);
      c.fillStyle = "#fff"; c.fillRect(x0, yNear - hh / 2, xr - x0, hh);
      c.strokeStyle = ink(0.8); c.strokeRect(x0 + 0.5, yNear - hh / 2 + 0.5, xr - x0 - 1, hh - 1);
      if (k % ASK === 0) { c.fillStyle = GREEN; c.fillRect(xl + bw / 2 - 2.5, yNear - 2.5, 5, 5); }
      else { c.fillStyle = ink(0.55); const n = Math.floor(hash(7, k) * 4); for (let i = 0; i < n; i++) c.fillRect(xl + 3 + i * 4.5, yNear - 0.8, 1.6, 1.6); }
    }
    c.globalAlpha = 1;

    /* the signers: a row of nodes across the now line; a threshold of them lights for each request */
    const nx = (j: number) => nowX + (j - (NODES - 1) / 2) * (narrow ? 11 : 15);
    const kr = Math.floor(kNow / ASK) * ASK, ra = T - kr * BT;   // the latest request, and its age
    const lit = (j: number) => {
      const order = Math.floor(hash(kr, j + 3) * 1000);   // which signers take part this time: the THRESHOLD smallest of a shuffle
      const rank = Array.from({ length: NODES }, (_, q) => Math.floor(hash(kr, q + 3) * 1000)).filter((v) => v < order).length;
      if (rank >= THRESHOLD) return 0;
      return smooth((ra - T_DOWN - rank * 0.06) / 0.12) * (1 - smooth((ra - T_SIGN - 0.9) / 0.4));
    };
    c.strokeStyle = ink(0.16); c.beginPath(); c.moveTo(nx(0) - 10, yMpc); c.lineTo(nx(NODES - 1) + 10, yMpc); c.stroke();
    for (let j = 0; j < NODES; j++) {
      const l = lit(j);
      c.fillStyle = l > 0.5 ? GREEN : GROUND; c.strokeStyle = ink(0.85);
      c.beginPath(); c.arc(nx(j), yMpc, narrow ? 3.6 : 4.4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    if (!narrow) {
      const a = smooth((ra - T_DOWN) / 0.2) * (1 - smooth((ra - 2.2) / 0.4));
      c.globalAlpha = a; font(c, 10); c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = ink(0.7);
      c.fillText(`THRESHOLD SIGNATURE · ${THRESHOLD} OF ${NODES}`, nx(NODES - 1) + 16, yMpc); c.globalAlpha = 1;
    }

    /* the request going down, then the signature going on to its chain */
    const target = (kq: number) => (kq / ASK) % CHAINS.length;
    const dot = (x: number, y: number, r = 3.4) => { c.fillStyle = GREEN; c.strokeStyle = ink(0.9); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke(); };
    if (ra > 0.05 && ra < T_DOWN) dot(nowX, lerp(yNear, yMpc, smooth((ra - 0.05) / (T_DOWN - 0.05))));
    if (ra > T_SIGN && ra < T_LAND) dot(nowX, lerp(yMpc, yChain(target(kr)), smooth((ra - T_SIGN) / (T_LAND - T_SIGN))));

    /* each chain's blocks, at its own pace; a landed signature waits at the now line, then rides in the chain's next block */
    CHAINS.forEach((chn, i) => {
      const y = yChain(i), P = chn.every, off = i * 0.37;
      const bMin = Math.floor((T - visSecs - off) / P), bNow = Math.floor((T - off) / P);
      // the requests sent to this chain that are still on the picture: where each one is
      const landed: number[] = [];
      for (let kq = Math.floor((T - visSecs - P - 2) / BT / ASK) * ASK; kq <= kNow; kq += ASK) {
        if (kq < 0) continue;
        if (target(kq) !== i) continue;
        const tl = kq * BT + T_LAND; if (tl > T) continue;
        landed.push(tl);
      }
      for (let b = bMin; b <= bNow; b++) {
        const tb = b * P + off, age = T - tb, xr = nowX - age * speed, xl = xr - bw;
        if (xr < padL || age < 0) continue;
        const x0 = Math.max(xl, padL), hh = ch * smooth(age / 0.25);
        c.globalAlpha = clamp01((xl - padL) / 30 + 0.35);
        c.fillStyle = "#fff"; c.fillRect(x0, y - hh / 2, xr - x0, hh);
        c.strokeStyle = ink(0.75); c.strokeRect(x0 + 0.5, y - hh / 2 + 0.5, xr - x0 - 1, hh - 1);
        const n = Math.floor(hash(i + 20, b) * 3) + 1;
        c.fillStyle = ink(0.5); for (let q = 0; q < n; q++) c.fillRect(xl + 3 + q * 4.5, y - 0.8, 1.6, 1.6);
        // a signature that landed in (the block before this one, this one]: it is inside this block
        if (landed.some((tl) => tl <= tb && tl > tb - P)) { c.fillStyle = GREEN; c.fillRect(xr - 8, y - 2.5, 5, 5); }
      }
      c.globalAlpha = 1;
      // waiting at the now line for this chain's next block
      const nextB = (bNow + 1) * P + off;
      landed.forEach((tl) => { if (tl > nextB - P && tl <= T) dot(nowX + 7, y, 3); });
      const last = landed.length ? landed[landed.length - 1] : -1e9;
      if (!narrow && T - last < 2.4) {
        c.globalAlpha = 1 - smooth((T - last - 1.6) / 0.8); font(c, 10); c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = GREEN_T;
        c.fillText("NATIVE TX · NO BRIDGE", nowX + 18, y); c.globalAlpha = 1;
      }
    });
  };
}
