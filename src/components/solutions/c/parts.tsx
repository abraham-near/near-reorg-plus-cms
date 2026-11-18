// Solutions C, the small pieces: the drawn arrows (the fonts have no arrow glyphs), a link that knows whether it leaves the site, a heading with its one
// Kepler word (and the green square), a figure split into its number and its unit, a number that counts once, the words of a line that is wiped from
// faint to full, and a black-and-white photo on its plate.
import { Fragment } from "react";

export const Arrow = ({ className = "sl-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "sl-c-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const isExt = (href: string) => /^https?:/.test(href);

/** a button or a text link: an external one opens in a new tab with the diagonal arrow; a page of the site is a plain <a> with the straight one */
export function Go({ href, label, className }: { href: string; label: string; className: string }) {
  return isExt(href)
    ? <a className={className} href={href} {...ext}><span>{label}</span><Ext /><NewTab /></a>
    : <a className={className} href={href}><span>{label}</span><Arrow /></a>;
}

/** a heading's words with one of them in Kepler (`a`, its last occurrence). `sq`: the green square at the heading's end, as on the homepage's heroes */
export function Acc({ t, a, sq = false }: { t: string; a: string; sq?: boolean }) {
  const i = t.lastIndexOf(a);
  const square = sq ? <span className="sl-c-sq" data-sq="" aria-hidden="true" /> : null;
  if (i < 0) return <>{t}{square}</>;
  return <>{t.slice(0, i)}<span className="accent">{a}</span>{t.slice(i + a.length)}{square}</>;
}

/** a number that counts up once (motion.ts): the final value is in the markup (SSR, reduced motion); the whole figure is read once by Figure's sr-only copy */
export const Count = ({ v }: { v: string }) => <span data-count={v}>{v}</span>;

/**
 * A proof figure, set large: its number (counted) and, on its own line in Kepler, its unit ("30+" / "chains"); a figure with no number ("Sub-cent") is set
 * whole in Kepler. The text is the doc's, verbatim: screen readers get it in one piece, the split copy is aria-hidden.
 */
export function Figure({ v, className = "" }: { v: string; className?: string }) {
  const m = /^(\$?[\d.,]+[A-Z]*\+?)(?:\s+(.+))?$/.exec(v);
  return (
    <span className={`sl-c-fig ${className}`}>
      <span className="sr-only">{v}</span>
      {m
        ? <span aria-hidden="true"><span className="sl-c-fig__n"><Count v={m[1]} /></span>{m[2] && <> <span className="sl-c-fig__u">{m[2]}</span></>}</span>
        : <span aria-hidden="true" className="sl-c-fig__w">{v}</span>}
    </span>
  );
}

/** a line split into words for the wipe (motion.ts sets each word's --k, 0 faint → 1 full); the text reads the same with or without it */
export const WipeWords = ({ text }: { text: string }) => (
  <>{text.split(" ").map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="sl-c-ww">{w}</span></Fragment>)}</>
);

/**
 * A black-and-white photo on its plate: the frame crops, the plate drifts against the page as it passes (motion.ts, [data-par]). `open`: the frame opens
 * from the page's gutters to the screen's edges as it comes up (motion.ts, [data-open]).
 */
export function Photo({ src, alt, w, h, className = "", open = false }: { src: string; alt: string; w: number; h: number; className?: string; open?: boolean }) {
  return (
    <figure className={`sl-c-photo${open ? " sl-c-bleed" : ""} ${className}`} data-open={open ? "" : undefined}>
      <div className="sl-c-plate" data-par="">
        {/* eslint-disable-next-line @next/next/no-img-element -- the site's own bw stills (public/images), already sized WebP */}
        <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
      </div>
    </figure>
  );
}
