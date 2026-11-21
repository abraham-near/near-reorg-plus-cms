import { describe, expect, it } from "vitest";
import { DARK_VEIL, LIGHT_VEIL, TARGET, busyFloor, busyness, choose, contrastAt, parseColor, veilFor, type RGB } from "@/lib/blog/tone-math";

// Type over a photo (D262, D264): the contrast arithmetic behind the measured tone and veil.
const WHITE: RGB = [245, 244, 241], INK: RGB = [38, 38, 38];
const fill = (c: RGB, n = 200): RGB[] => Array.from({ length: n }, () => c);

describe("tone math", () => {
  it("needs no veil where the type already reads", () => {
    expect(veilFor(fill([10, 10, 10]), WHITE, 1, DARK_VEIL, TARGET.small)).toBe(0);
    expect(veilFor(fill([235, 235, 235]), INK, 1, LIGHT_VEIL, TARGET.small)).toBe(0);
  });
  it("finds the least veil that reaches the target, and it does reach it", () => {
    const mid = fill([150, 150, 150]);
    const a = veilFor(mid, WHITE, 1, DARK_VEIL, TARGET.small);
    expect(a).toBeGreaterThan(0);
    expect(contrastAt(mid[0], WHITE, 1, DARK_VEIL, a)).toBeGreaterThanOrEqual(TARGET.small);
    expect(contrastAt(mid[0], WHITE, 1, DARK_VEIL, a - 0.02)).toBeLessThan(TARGET.small);
  });
  it("lets 2% of the pixels miss (a highlight under one letter), not more", () => {
    const px = [...fill([10, 10, 10], 99), ...fill([250, 250, 250], 1)];
    expect(veilFor(px, WHITE, 1, DARK_VEIL, TARGET.small)).toBe(0);
    const worse = [...fill([10, 10, 10], 95), ...fill([250, 250, 250], 5)];
    expect(veilFor(worse, WHITE, 1, DARK_VEIL, TARGET.small)).toBeGreaterThan(0);
  });
  it("picks the tone that needs less veil, but keeps a preferred tone unless the other is clearly cheaper", () => {
    expect(choose(0.4, 0, undefined)).toEqual({ tone: "ink", veil: 0 });
    expect(choose(0.2, 0, "white")).toEqual({ tone: "white", veil: 0.2 });
    expect(choose(0.5, 0, "white")).toEqual({ tone: "ink", veil: 0 });
    expect(choose(Infinity, Infinity, undefined).veil).toBe(0.9);
  });
  it("asks for a veil where thin detail runs behind the type, none on a plain area (D265)", () => {
    const plain = fill([220, 220, 220], 400);
    expect(busyFloor(busyness(plain, 20))).toBe(0);
    // light grey with a dark one-pixel line every fifth column: glass edges
    const edges = Array.from({ length: 400 }, (_, i): RGB => (i % 5 === 0 ? [60, 90, 80] : [220, 220, 220]));
    expect(busyness(edges, 20)).toBeGreaterThan(0.15);
    expect(busyFloor(busyness(edges, 20))).toBeGreaterThan(0.3);
  });
  it("reads the colour tokens", () => {
    expect(parseColor("#262626", WHITE)).toEqual([38, 38, 38]);
    expect(parseColor(" #fff", INK)).toEqual([255, 255, 255]);
    expect(parseColor("rgb(245 244 241)", INK)).toEqual([245, 244, 241]);
    expect(parseColor("nonsense", INK)).toEqual(INK);
  });
});
