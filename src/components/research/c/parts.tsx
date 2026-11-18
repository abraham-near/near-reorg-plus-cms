// Research C, the small pieces: the drawn arrows (the fonts have no arrow glyphs), the new-tab note, a heading with its one Kepler word (and the green
// square), and a missing value (an em dash on screen, words for screen readers).

export const Arrow = ({ className = "rs-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "rs-c-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/** a value the source doesn't give: the em dash on screen, never an invented one */
export const Missing = () => <><span aria-hidden="true">—</span><span className="sr-only">Not given</span></>;

/**
 * A heading's words with one of them in Kepler (`a`, its last occurrence). `sq`: the green square at the heading's end, as on the homepage's heroes;
 * a full stop at the end is kept for screen readers only (the square stands in for it).
 */
export function Acc({ t, a, sq = false }: { t: string; a: string; sq?: boolean }) {
  const i = t.lastIndexOf(a);
  const body = (s: string) => (sq && s.endsWith(".") ? <>{s.slice(0, -1)}<span className="sr-only">.</span></> : s);
  const square = sq ? <span className="rs-c-sq" data-sq="" aria-hidden="true" /> : null;
  if (i < 0) return <>{body(t)}{square}</>;
  return (
    <>
      {t.slice(0, i)}
      <span className="accent">{a}</span>
      {body(t.slice(i + a.length))}
      {square}
    </>
  );
}
