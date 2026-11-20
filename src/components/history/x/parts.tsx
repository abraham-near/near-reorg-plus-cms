// History X, the small pieces: the drawn arrow (the fonts have no arrow glyphs) and a heading with its one Kepler word. Copied from ../c/parts.tsx so X
// stands on its own.

export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);

/** a heading from the content file with its Kepler word marked (the last occurrence of `a`) */
export const Acc = ({ h, a }: { h: string; a: string }) => {
  const i = h.lastIndexOf(a);
  return i < 0 ? <>{h}</> : <>{h.slice(0, i)}<span className="accent">{a}</span>{h.slice(i + a.length)}</>;
};
