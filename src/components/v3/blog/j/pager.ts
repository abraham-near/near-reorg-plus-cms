// The numbered pages at the feed's foot, compact: the first and the last page always, the current one with a neighbour on each side,
// and a gap ("…") for each run left out. A gap of one page shows that page instead (a "…" standing for a single number saves nothing).
//   pageItems(5, 37) → [1, "gap", 4, 5, 6, "gap", 37]
export type PageItem = number | "gap";

export function pageItems(current: number, pages: number, around = 1): PageItem[] {
  if (pages <= 1) return [1];
  const keep = new Set([1, pages]);
  for (let n = current - around; n <= current + around; n++) if (n >= 1 && n <= pages) keep.add(n);
  const nums = [...keep].sort((a, b) => a - b);
  const out: PageItem[] = [];
  nums.forEach((n, i) => {
    const prev = nums[i - 1];
    if (prev !== undefined && n - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && n - prev > 2) out.push("gap");
    out.push(n);
  });
  return out;
}
