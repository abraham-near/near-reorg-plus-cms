// Community C, the small pieces: the drawn arrows (the fonts have no arrow glyphs), a heading with its one Kepler word (and the hero's green square),
// a figure that counts once, the words of a statement that is wiped from faint to ink, and the "Sample" tag.
import { Fragment } from "react";

export const Arrow = ({ className = "cm-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "cm-c-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/**
 * A heading's words with one of them in Kepler (`a`, its last occurrence). `sq`: the hero's green square after the accent word; a full stop right after
 * it is kept for screen readers only (the square stands in for it, as on the homepage's "Own your world").
 */
export function Acc({ t, a, sq = false }: { t: string; a: string; sq?: boolean }) {
  const i = t.lastIndexOf(a);
  if (i < 0) return <>{t}</>;
  const before = t.slice(0, i), after = t.slice(i + a.length);
  const stop = sq && after === ".";
  return (
    <>
      {before}
      <span className="accent">{a}</span>
      {sq && <span className="cm-c-sq" data-sq="" aria-hidden="true" />}
      {stop ? <span className="sr-only">.</span> : after}
    </>
  );
}

/** a figure that counts up once (motion.ts): the final value is in the markup (SSR, reduced motion, screen readers); the counting copy is aria-hidden */
export const Count = ({ v }: { v: string }) => (
  <><span className="sr-only">{v}</span><span aria-hidden="true" data-count={v}>{v}</span></>
);

/** a statement split into words for the wipe (motion.ts sets each word's --k, 0 faint → 1 ink); the text reads the same with or without it */
export const WipeWords = ({ text }: { text: string }) => (
  <>{text.split(" ").map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="cm-c-ww">{w}</span></Fragment>)}</>
);

export const Sample = ({ children = "Sample" }: { children?: string }) => <span className="cm-c-tag"><i aria-hidden="true" />{children}</span>;
