// Small easing / mapping helpers shared by the sections' scroll motion (pure, allocation free).
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** where v sits between a and b, clamped to 0..1 */
export const sat = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
export const s01 = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const out3 = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const io2 = (t: number) => { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
/** a seeded PRNG (deterministic jitter) */
export function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
