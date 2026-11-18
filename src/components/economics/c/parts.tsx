// Economics C, the small pieces: the drawn arrows (the fonts have no arrow glyphs), a heading with its one Kepler word (and the green square), a figure
// that counts once, the words of a line that is wiped from faint to full, and the loop's ring (four nodes, the travelled arc and the dot).
import { Fragment } from "react";

export const Arrow = ({ className = "ec-c-arr" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "ec-c-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/**
 * A heading's words with one of them in Kepler (`a`, its last occurrence). `sq`: the green square at the heading's end, as on the homepage's heroes;
 * a full stop at the end is kept for screen readers only (the square stands in for it).
 */
export function Acc({ t, a, sq = false }: { t: string; a: string; sq?: boolean }) {
  const i = t.lastIndexOf(a);
  const body = (s: string) => (sq && s.endsWith(".") ? <>{s.slice(0, -1)}<span className="sr-only">.</span></> : s);
  const square = sq ? <span className="ec-c-sq" data-sq="" aria-hidden="true" /> : null;
  if (i < 0) return <>{body(t)}{square}</>;
  const before = t.slice(0, i), after = t.slice(i + a.length);
  return (
    <>
      {before}
      <span className="accent">{a}</span>
      {body(after)}
      {square}
    </>
  );
}

/** a figure that counts up once (motion.ts): the final value is in the markup (SSR, reduced motion, screen readers); the counting copy is aria-hidden */
export const Count = ({ v }: { v: string }) => (
  <><span className="sr-only">{v}</span><span aria-hidden="true" data-count={v}>{v}</span></>
);

/** a line split into words for the wipe (motion.ts sets each word's --k, 0 faint → 1 full); the text reads the same with or without it */
export const WipeWords = ({ text }: { text: string }) => (
  <>{text.split(" ").map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="ec-c-ww">{w}</span></Fragment>)}</>
);

/**
 * The loop's drawing: a thin ring, the four steps as nodes at 12, 3, 6 and 9 o'clock, the arc travelled so far and the dot that travels it (motion.ts
 * turns the dot's group and sets the arc's offset). Labels are HTML around the ring; the word in the middle is the step on (pinned only).
 */
export function Ring({ steps }: { steps: readonly { n: string; short: string }[] }) {
  const R = 140, C = 200;
  const at = (k: number) => {
    const t = (k / steps.length) * Math.PI * 2 - Math.PI / 2;
    return { x: C + R * Math.cos(t), y: C + R * Math.sin(t) };
  };
  return (
    <div className="ec-c-ring" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="ec-c-ring__svg" focusable="false">
        <circle className="ec-c-ring__track" cx={C} cy={C} r={R} />
        <circle className="ec-c-ring__arc" cx={C} cy={C} r={R} pathLength={1} data-arc="" />
        {steps.map((s, k) => { const p = at(k); return <circle key={s.n} className="ec-c-ring__node" cx={p.x} cy={p.y} r={7} data-node={k} />; })}
        <g className="ec-c-ring__run"><circle className="ec-c-ring__halo" cx={C} cy={C - R} r={22} /><circle className="ec-c-ring__dot" cx={C} cy={C - R} r={9} /></g>
      </svg>
      {steps.map((s, k) => (
        <span key={s.n} className={`ec-c-ring__lab ec-c-ring__lab--${k}`} data-lab={k}>
          <span className="ec-c-ring__n">{s.n.padStart(2, "0")}</span><span className="ec-c-ring__s">{s.short}</span>
        </span>
      ))}
      <span className="ec-c-ring__mid">
        {steps.map((s, k) => <span key={s.n} className="ec-c-ring__w" data-mid={k}>{s.short}</span>)}
      </span>
    </div>
  );
}
