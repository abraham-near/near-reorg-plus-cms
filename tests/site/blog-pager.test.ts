import { describe, expect, it } from 'vitest'
import { pageItems } from '@/components/v3/blog/j/pager'

// The blog index's numbered pages (src/components/v3/blog/j/pager.ts): compact however many posts there are.
describe('blog pager', () => {
  it('shows every page when there are few', () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps the first, the last and the current page with its neighbours, with gaps between', () => {
    expect(pageItems(1, 37)).toEqual([1, 2, 'gap', 37])
    expect(pageItems(5, 37)).toEqual([1, 'gap', 4, 5, 6, 'gap', 37])
    expect(pageItems(37, 37)).toEqual([1, 'gap', 36, 37])
  })

  it('shows a single left-out page instead of a gap', () => {
    expect(pageItems(4, 37)).toEqual([1, 2, 3, 4, 5, 'gap', 37])
    expect(pageItems(34, 37)).toEqual([1, 'gap', 33, 34, 35, 36, 37])
  })
})
