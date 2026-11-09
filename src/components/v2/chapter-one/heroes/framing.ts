import type { CSSProperties } from "react";

// How a hero version is framed outside the desktop camera move, and where the green thread hangs (D90). Each version
// may set these in its index.tsx; the original sets neither and stays exactly as it was.
//   focal:  the photo band's crop (phones, tablets, reduced motion, no JS): object-fit cover at x, y (fractions of the
//           picture, 0.78 and 0.5 by default). On phones only x matters (the band is narrower than the picture); on wide
//           screens with reduced motion only y does. `clear` starts the photo below the floating nav bar, for a subject
//           that sits high in the frame. `dx`, `dy`: the desktop camera move's crop (poster and video; 0.3 and 0.5 by
//           default), which the layers read live from the picture's object-position.
//   thread: the green line (ChapterOneMotion) that hangs in the photo right of the claim and carries on to the anthem.
//           `x`: a fraction of the stage's width or a CSS length; it never moves left of the anthem's longest line (+48 px)
//           or past the stage's edge (−24 px), since the line keeps its x into the anthem. `false`: kept off the photo,
//           it fades in as the curtains finish closing on it (off the subject), so the anthem keeps its line.
// They reach the CSS as custom properties on the stage (--focal-x, --focal-y, --focal-clear, --focal-dx, --focal-dy). ChapterOne.module.css
// turns them into --hero-fx and --hero-fy, the crop every picture and every layer's still uses in each mode.
export type HeroFocal = { x?: number; y?: number; clear?: boolean; dx?: number; dy?: number };
export type HeroThread = { x?: number | string } | false;

// The floating nav bar's foot (SiteHeader: its frame's top padding plus the bar's height) and a small gap
const CLEAR = "calc(var(--space-4) + var(--space-8) + var(--space-3))";

const decls = (f?: HeroFocal): [string, string][] => {
  if (!f) return [];
  const d: [string, string][] = [];
  if (f.x !== undefined) d.push(["--focal-x", String(f.x)]);
  if (f.y !== undefined) d.push(["--focal-y", String(f.y)]);
  if (f.clear) d.push(["--focal-clear", CLEAR]);
  if (f.dx !== undefined) d.push(["--focal-dx", String(f.dx)]);
  if (f.dy !== undefined) d.push(["--focal-dy", String(f.dy)]);
  return d;
};

// A fixed hero: inline on the stage
export const focalStyle = (f?: HeroFocal) => Object.fromEntries(decls(f)) as CSSProperties;

// The random hero: one rule per version, keyed off html[data-hero] (set by the poster's inline script before paint)
export const focalCss = (all: Record<string, HeroFocal | undefined>) =>
  Object.entries(all).map(([k, f]) => {
    const d = decls(f);
    return d.length ? `html[data-hero="${k}"] [data-ch="stage"]{${d.map(([p, v]) => `${p}:${v}`).join(";")}}` : "";
  }).join("");

// The thread's settings for ChapterOneMotion, as a data attribute: one per version ("*" for a fixed hero)
export const threadAttr = (all: Record<string, HeroThread | undefined>) => {
  const set = Object.fromEntries(Object.entries(all).filter(([, t]) => t !== undefined));
  return Object.keys(set).length ? JSON.stringify(set) : undefined;
};
