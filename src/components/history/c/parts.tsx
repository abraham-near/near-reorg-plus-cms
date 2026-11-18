// History C, the small pieces: the drawn arrows (the fonts have no arrow glyphs), a heading with its one Kepler word,
// the words of a statement that is wiped from faint to paper, and the year that rolls digit by digit (each digit a column of 0–9 behind a window).
import { Fragment, type CSSProperties } from "react";

export const Arrow = ({ className = "hs-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "hs-c-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/** A heading's words with one of them in Kepler (`a`, its last occurrence). */
export function Acc({ t, a }: { t: string; a: string }) {
  const i = t.lastIndexOf(a);
  if (i < 0) return <>{t}</>;
  return <>{t.slice(0, i)}<span className="accent">{a}</span>{t.slice(i + a.length)}</>;
}

/** a statement split into words for the wipe (motion.ts sets each word's --k, 0 faint → 1 paper); the text reads the same with or without it */
export const WipeWords = ({ text }: { text: string }) => (
  <>{text.split(" ").map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="hs-c-ww">{w}</span></Fragment>)}</>
);

/**
 * A year set as four rolling digits (aria-hidden: the reader gets the year in the text beside it). Each digit is a column of 0–9 in a 1 em window; the
 * column sits at its digit by --d (server-rendered, so the year is right before any script); motion.ts changes --d and the CSS rolls it.
 */
export function Roll({ year, className = "" }: { year: string; className?: string }) {
  return (
    <span className={`hs-c-roll ${className}`} data-roll={year} aria-hidden="true">
      {[...year].map((d, i) => (
        <span key={i} className="hs-c-roll__s" style={{ "--d": d, "--i": i } as CSSProperties}>
          <span className="hs-c-roll__c">{"0123456789".split("").map((n) => <span key={n}>{n}</span>)}</span>
        </span>
      ))}
    </span>
  );
}
/** set a Roll's digits (motion.ts) */
export function setRoll(el: Element, year: string) {
  el.setAttribute("data-roll", year);
  [...el.children].forEach((s, i) => (s as HTMLElement).style.setProperty("--d", year[i] ?? "0"));
}
