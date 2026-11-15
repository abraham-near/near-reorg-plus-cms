"use client";
// Analytics B, the small instruments: the counting figure, the delta chip, the revenue chart (crosshair + readout) and a service's 60-day uptime strip.
// Every one is readable without colour or motion: the figure's text is the final value, the chips say up / down, the charts carry a text summary.
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";

/* ─────────────────────────────────────────── icons (the fonts have no arrow / triangle glyphs) */
export const Arrow = () => (
  <svg className="l-arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
export const Ext = ({ className = "ab-ext" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" /></svg>
);
const Tri = ({ dir }: { dir: number }) =>
  dir === 0 ? <svg className="ab-tri" viewBox="0 0 8 8" aria-hidden="true" focusable="false"><rect x="1" y="3.25" width="6" height="1.5" /></svg>
    : <svg className="ab-tri" viewBox="0 0 8 8" aria-hidden="true" focusable="false"><path d={dir > 0 ? "M4 1.2 7.2 6.6H.8Z" : "M4 6.8.8 1.4h6.4Z"} /></svg>;

/* ─────────────────────────────────────────── a figure that counts up (motion.ts); its width is held by the final value, so nothing moves around it */
export function Num({ value, delay = 0, className = "" }: { value: string; delay?: number; className?: string }) {
  return (
    <span className={`ab-num ${className}`} data-count={value} data-delay={delay}>
      <span className="ab-num__ghost" aria-hidden="true">{value}</span>
      <span className="ab-num__live" aria-hidden="true">{value}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

/* ─────────────────────────────────────────── "24h ▲ 0.8%" */
export function Chip({ k, v }: { k: string; v: number }) {
  const dir = Math.sign(v), word = dir > 0 ? "up" : dir < 0 ? "down" : "flat";
  return (
    <span className={`ab-chip ab-chip--${word}`}>
      <span className="ab-chip__k">{k}</span>
      <Tri dir={dir} />
      <span className="sr-only">{word} </span>
      <span className="ab-chip__v">{Math.abs(v).toFixed(1)}%</span>
    </span>
  );
}

/* a monotone cubic through the points (no overshoot: the line never shows a value the data does not have) */
function monotone(p: [number, number][]) {
  const n = p.length, f = (x: number) => x.toFixed(3);
  if (n < 2) return "";
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]));
  m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  let s = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) { const h = (p[i + 1][0] - p[i][0]) / 3; s += `C${f(p[i][0] + h)},${f(p[i][1] + m[i] * h)} ${f(p[i + 1][0] - h)},${f(p[i + 1][1] - m[i + 1] * h)} ${f(p[i + 1][0])},${f(p[i + 1][1])}`; }
  return s;
}

/** pointer and keys over a strip of n steps: the step under the pointer, arrows / Home / End when focused */
function useScrub(n: number, start: number) {
  const [i, setI] = useState<number | null>(null);
  const at = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setI(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
  };
  const key = (e: KeyboardEvent<HTMLElement>) => {
    const c = i ?? start;
    const k = { ArrowLeft: c - 1, ArrowDown: c - 1, ArrowRight: c + 1, ArrowUp: c + 1, Home: 0, End: n - 1 }[e.key];
    if (k === undefined) { if (e.key === "Escape") setI(null); return; }
    e.preventDefault(); setI(Math.max(0, Math.min(n - 1, k)));
  };
  return {
    i,
    on: { onPointerMove: at, onPointerDown: at, onPointerLeave: () => setI(null), onKeyDown: key, onFocus: () => setI((v) => v ?? start), onBlur: () => setI(null) },
  };
}

/* ─────────────────────────────────────────── the revenue preview: the share of fees captured as protocol revenue, week by week */
const Y0 = 35, Y1 = 65, TICKS = [40, 50, 60];
const yPct = (v: number) => (1 - (v - Y0) / (Y1 - Y0)) * 100;
const weeks = (n: number, i: number) => { const w = n - 1 - i; return w === 0 ? "This week" : `${w} wk${w > 1 ? "s" : ""} ago`; };

export function RevenueChart({ data, label }: { data: number[]; label: string }) {
  const n = data.length, last = n - 1;
  const pts = data.map((v, i): [number, number] => [(i / last) * 100, yPct(v)]);
  const line = monotone(pts), area = `${line}L100,100L0,100Z`;
  const { i, on } = useScrub(n, last);
  const id = useId();
  const sum = `${label}, ${n} weeks of sample figures: from ${data[0]}% to ${data[last]}%, low ${Math.min(...data)}%, high ${Math.max(...data)}%.`;
  const show = i ?? last;
  return (
    <figure className="ab-ch">
      <div className="ab-ch__plot" tabIndex={0} role="group" aria-label={`${label}: weekly trend. Arrow keys step through the weeks.`} aria-describedby={`${id}-s`} data-on={i !== null ? "" : undefined} {...on}>
        {TICKS.map((t) => (
          <div key={t} className="ab-ch__grid" style={{ top: `${yPct(t)}%` }} aria-hidden="true"><span>{t}%</span></div>
        ))}
        <div className="ab-ch__draw" aria-hidden="true">
          <svg className="ab-ch__svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00dc8d" stopOpacity="0.32" /><stop offset="1" stopColor="#00dc8d" stopOpacity="0" /></linearGradient>
            </defs>
            <path className="ab-ch__area" d={area} fill={`url(#${id}-g)`} />
            <path className="ab-ch__line" d={line} />
          </svg>
          {/* a tick per week on the baseline */}
          <div className="ab-ch__ticks">{data.map((_, k) => <i key={k} style={{ left: `${(k / last) * 100}%` }} />)}</div>
        </div>
        <i className="ab-ch__end" style={{ left: "100%", top: `${yPct(data[last])}%` }} aria-hidden="true" />
        <div className="ab-ch__x" style={{ left: `${(show / last) * 100}%`, ["--x" as string]: show / last }} aria-hidden="true">
          <i className="ab-ch__dot" style={{ top: `${yPct(data[show])}%` }} />
          <span className="ab-ch__tag"><b>{data[show]}%</b> <span>{weeks(n, show)}</span></span>
        </div>
      </div>
      <div className="ab-ch__axis" aria-hidden="true"><span>{n} wks ago</span><span>This week</span></div>
      <figcaption id={`${id}-s`} className="sr-only">{sum}</figcaption>
      <p className="sr-only" aria-live="polite">{i !== null ? `${weeks(n, i)}: ${data[i]}%` : ""}</p>
    </figure>
  );
}

/* ─────────────────────────────────────────── a service: its name, its 60-day uptime and the strip of days (status.near.org's, compact) */
const STATE = (d: number) => (d >= 1 ? "up" : d > 0 ? "deg" : "down");
const STATE_TXT = { up: "Operational", deg: "Degraded performance", down: "Outage" } as const;
const dayLabel = (ago: number) => ago === 0 ? "Today"
  : new Date(Date.now() - ago * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function Service({ name, uptime, days, order }: { name: string; uptime: number; days: number[]; order: number }) {
  const n = days.length;
  const { i, on } = useScrub(n, n - 1);
  const deg = days.filter((d) => d > 0 && d < 1).length, down = days.filter((d) => d <= 0).length;
  const sum = `${uptime.toFixed(2)}% uptime over the last ${n} days: ${deg ? `${deg} day${deg > 1 ? "s" : ""} of degraded performance` : "no degraded days"}, ${down ? `${down} outage day${down > 1 ? "s" : ""}` : "no outages"}.`;
  const st = i !== null ? STATE(days[i]) : null;
  return (
    <li className="ab-svc" style={{ ["--s" as string]: order }}>
      <p className="ab-svc__top"><span className="ab-svc__n">{name}</span><span className="ab-svc__u">{uptime.toFixed(2)}%</span></p>
      <div className="ab-svc__bars" tabIndex={0} role="group" aria-label={`${name}: ${sum} Arrow keys step through the days.`} data-on={i !== null ? "" : undefined} {...on}>
        {days.map((d, k) => <i key={k} className={`is-${STATE(d)}`} data-hl={k === i ? "" : undefined} style={{ ["--i" as string]: k }} aria-hidden="true" />)}
        {i !== null && st && (
          <span className="ab-tip" style={{ left: `${((i + 0.5) / n) * 100}%`, ["--x" as string]: i / (n - 1) }} aria-hidden="true">
            <i className={`ab-key is-${st}`} /><b>{dayLabel(n - 1 - i)}</b> {STATE_TXT[st]}
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{i !== null && st ? `${dayLabel(n - 1 - i)}: ${STATE_TXT[st]}` : ""}</p>
    </li>
  );
}
