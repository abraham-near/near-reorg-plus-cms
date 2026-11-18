// Brand C, the small pieces: the drawn glyphs (the fonts have no arrows, ticks or crosses), and a heading with its one Kepler word (and the green square).

export const Arrow = ({ className = "br-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
/** the download glyph: an arrow down onto a line */
export const Down = ({ className = "br-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2v9M3.8 7 8 11.2 12.2 7M2.5 14h11" /></svg>
);
/** the copy glyph: two sheets */
export const Copy = ({ className = "br-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3" /></svg>
);
export const Tick = ({ className = "br-c-mark" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12.5 9.5 18 20 6" /></svg>
);
export const Cross = ({ className = "br-c-mark" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5 5 19" /></svg>
);

/**
 * A heading's words with one of them in Kepler (`a`, its last occurrence). `sq`: the green square at the heading's end, as on the homepage's heroes;
 * a full stop at the end is kept for screen readers only (the square stands in for it).
 */
export function Acc({ t, a, sq = false }: { t: string; a: string; sq?: boolean }) {
  const i = t.lastIndexOf(a);
  const body = (s: string) => (sq && s.endsWith(".") ? <>{s.slice(0, -1)}<span className="sr-only">.</span></> : s);
  const square = sq ? <span className="br-c-sq" data-sq="" aria-hidden="true" /> : null;
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
