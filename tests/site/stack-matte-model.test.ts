import { describe, expect, it } from 'vitest'
import { PIECES, BOX_COUNT, CUBES } from '@/components/v6/stack/matte/model'
import { INTENTS, AI, COM, PILLAR } from '@/components/v6/stack/geometry'

// Home v6's lit matte Stack (D149) draws a 3D model over the iso drawing; this checks the model is the drawing: every box of v6's lists is in it, in the
// right piece, and lands on the drawing's faces when projected.
const C = Math.cos(Math.PI / 6)
/* three's axes (Y up) to the drawing: x' = (X - Z) cos30, y' = (X + Z) / 2 - Y */
const proj = (X: number, Y: number, Z: number) => [(X - Z) * C, (X + Z) * 0.5 - Y]
const key = (pts: number[][]) => pts.map(([x, y]) => `${Math.round(+x.toFixed(1))},${Math.round(+y.toFixed(1))}`).sort().join(' ')
const faces = (b: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }) => [
  [proj(b.x0, b.y0, b.z1), proj(b.x1, b.y0, b.z1), proj(b.x1, b.y1, b.z1), proj(b.x0, b.y1, b.z1)],
  [proj(b.x1, b.y0, b.z0), proj(b.x1, b.y0, b.z1), proj(b.x1, b.y1, b.z1), proj(b.x1, b.y1, b.z0)],
  [proj(b.x0, b.y1, b.z0), proj(b.x1, b.y1, b.z0), proj(b.x1, b.y1, b.z1), proj(b.x0, b.y1, b.z1)],
].map(key).join('|')
const listed = (boxes: string[][]) => boxes.map((b) => b.map((f) => key(f.split(' ').map((p) => p.split(',').map(Number)))).join('|'))

describe('the lit matte Stack model', () => {
  it('has the pillar as six cubes and every ring box', () => {
    expect(PIECES.filter((p) => p.cube !== undefined)).toHaveLength(CUBES)
    expect(BOX_COUNT).toBe(CUBES + INTENTS.length + AI.length + COM.length)
  })
  it('puts each NEAR AI box in its product, as v6 lists them', () => {
    for (const seg of ['ironclaw', 'cloud', 'market'] as const) {
      const want = AI.filter(([s]) => s === seg).map(([, ...b]) => b as string[])
      const got = PIECES.find((p) => p.seg === seg)!.boxes.map(faces)
      expect(new Set(got)).toEqual(new Set(listed(want)))
    }
  })
  it('projects each ring onto the drawing, box for box', () => {
    for (const [k, list] of [['intents', INTENTS], ['com', COM]] as const) {
      expect(new Set(PIECES.find((p) => p.key === k)!.boxes.map(faces))).toEqual(new Set(listed(list as string[][])))
    }
  })
  it('stacks the pillar from the cap (Y 0) down the drawing\'s height', () => {
    const cubes = PIECES.filter((p) => p.cube !== undefined).map((p) => p.boxes[0])
    expect(Math.max(...cubes.map((b) => b.y1))).toBeCloseTo(0)
    expect(Math.min(...cubes.map((b) => b.y0))).toBeCloseTo(-PILLAR.height)
  })
})
