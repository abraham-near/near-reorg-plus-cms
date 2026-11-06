// Picks this page load's hero version (D90) and points the poster at its still. Runs twice over: as an inline script
// right after the poster while the HTML is parsed (so the chosen still is the first paint, before React hydrates; the
// server writes this function's own source into the page), and from RandomHero after a client-side navigation, when
// that script never runs. It must stay self-contained: no imports, no closures, only browser globals.
// ?hero=<key> forces a version (review links); ?hero=random, any other value or none picks one at random, each equally
// likely. Nothing is remembered between loads.
export type PosterSet = Record<string, { src: string; srcSet?: string }>;

// D107: the random pick draws only from `pool` (the ring heroes); ?hero= may still name any version in `set`.
export function choose(set: PosterSet, img: HTMLImageElement, pool: string[]): string {
  const keys = Object.keys(set);
  const m = /[?&]hero=([a-z0-9-]+)/.exec(location.search);
  const key = m && keys.indexOf(m[1]) >= 0 ? m[1] : pool[Math.floor(Math.random() * pool.length)];
  const p = set[key];
  if (p.srcSet) img.srcset = p.srcSet;
  img.src = p.src;
  img.setAttribute("data-hero", key);
  document.documentElement.setAttribute("data-hero", key);
  return key;
}
