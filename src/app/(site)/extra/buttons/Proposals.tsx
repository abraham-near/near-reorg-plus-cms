import type { ReactNode } from "react";
import s from "./proposals.module.css";

// Button proposals for the unification: pills, links and other variants, each live (CSS-only hovers, no client JS), shown on paper and on the dark band.
// Faithful = a cleaned-up, unified version of what the live pages already do; Creative = new, still in the brand's language. Styles: proposals.module.css.

type Tone = "l" | "d";
type Option = { code: string; name: string; tag: "Faithful" | "Creative"; demo: (t: Tone) => ReactNode; states: string; timing: string };

const Arrow = ({ c }: { c?: string }) => (
  <svg className={`${s.arr}${c ? ` ${c}` : ""}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg>
);
const Ext = () => (
  <svg className={s.ext} viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" /></svg>
);
const Head = () => <svg className={s.head} viewBox="0 0 8 12" aria-hidden="true" focusable="false"><path d="M1.5 1.5 6.5 6l-5 4.5" /></svg>;
const H = "#proposals";

// an arrow pair: one leaves right, the next comes in from the left (P4, L3)
const Swap = () => <span className={s.swap} aria-hidden="true"><Arrow c={s.a1} /><Arrow c={s.a2} /></span>;

// P7: the pill's content twice: the real one, and an aria-hidden copy in the swept colours whose clip grows from `from` (the dot, the left edge, the arrow,
// the centre), so type flips exactly where the fill passes
type From = "dot" | "left" | "arrow" | "icon";
const FROM: Record<From, string> = { dot: s.fDot, left: s.fLeft, arrow: s.fArrow, icon: s.fIcon };
function Sweep({ from, dot, arrow, label, sec }: { from: From; dot?: boolean; arrow?: boolean; label?: string; sec?: boolean }) {
  const inner = <>{dot && <i className={s.dot} />}{label && <span>{label}</span>}{arrow && <Arrow />}</>;
  return (
    <a className={`${s.btn} ${s.p7} ${FROM[from]}${sec ? ` ${s.sec}` : ""}${label ? "" : ` ${s.ico}`}`} href={H} aria-label={label ? undefined : "Continue"}>
      {inner}<span className={s.p7f} aria-hidden="true">{inner}</span>
    </a>
  );
}

const PILLS: Option[] = [
  {
    code: "P1", name: "Ink pill · dot opens", tag: "Faithful",
    demo: () => <>
      <a className={`${s.btn} ${s.p1}`} href={H}><span>Get started</span><Arrow /></a>
      <a className={`${s.btn} ${s.p1} ${s.sec}`} href={H}><span>Read the docs</span><Arrow /></a>
    </>,
    states: "Rest: a 48 px ink pill (outline for secondary) with the drawn arrow. Hover: the emerald dot opens before the label, the label makes room, the arrow steps 3 px; the outline one fills ink. Focus: 2 px ring, 3 px off. Press: scales to 0.97.",
    timing: "fill 240ms tick · dot + padding 320ms settle",
  },
  {
    code: "P2", name: "Dot-led pill", tag: "Faithful",
    demo: () => <>
      <a className={`${s.btn} ${s.p2}`} href={H}><i className={s.dot} aria-hidden="true" /><span>Get started</span></a>
      <a className={`${s.btn} ${s.p2} ${s.sec}`} href={H}><i className={s.dot} aria-hidden="true" /><span>Join the Legion</span></a>
    </>,
    states: "Rest: the header's Get started; the emerald dot always leads. Hover: the pill goes a step deeper and the dot breathes out a soft green halo; the ghost's hairline darkens. Focus: ring. Press: 0.97.",
    timing: "240ms tick",
  },
  {
    code: "P3", name: "Square fill", tag: "Creative",
    demo: () => <>
      <a className={`${s.btn} ${s.p3}`} href={H}><span>Start building</span></a>
      <a className={`${s.btn} ${s.p3} ${s.sec}`} href={H}><span>Talk to us</span></a>
    </>,
    states: "Rest: a square-cornered box on a hairline, a small square at its left (emerald for primary, ink for secondary). Hover: the square grows into the whole fill; the label turns to read on it. Focus: ring. Press: 0.97. Reduced motion: the fill swaps in, no growth.",
    timing: "clip-path 480ms settle",
  },
  {
    code: "P4", name: "Roll and swap", tag: "Creative",
    demo: () => <>
      <a className={`${s.btn} ${s.p4}`} href={H}><span className={s.roll}><span>Get started</span></span><Swap /></a>
      <a className={`${s.btn} ${s.p4} ${s.sec}`} href={H}><span className={s.roll}><span>See the stack</span></span><Swap /></a>
    </>,
    states: "Rest: the ink pill. Hover: the label rolls up to its duplicate (a text-shadow copy, so screen readers hear it once) while the arrow leaves right and a new one slides in from the left. Focus: ring. Press: 0.97.",
    timing: "roll 420ms settle · arrows 420ms settle, 60ms apart",
  },
  {
    code: "P5", name: "Crosshair box", tag: "Creative",
    demo: () => <>
      <a className={`${s.btn} ${s.p5}`} href={H}><i className={s.cross} aria-hidden="true" /><span>Explore NEAR</span><Arrow /></a>
      <a className={`${s.btn} ${s.p5} ${s.sec}`} href={H}><i className={s.cross} aria-hidden="true" /><i className={s.draw} aria-hidden="true" /><span>View the grid</span></a>
    </>,
    states: "Rest: a square box with the ruled grid's tiny + at each corner. Hover: the crosshairs spread 4 px out (primary) / an ink hairline draws itself round the box in two strokes, top and bottom then the sides (secondary). Focus: ring past the crosses. Press: 0.97.",
    timing: "crosses 360ms settle · frame 2 × 260ms tick, staggered",
  },
  {
    code: "P6", name: "Dot opens, label rolls", tag: "Creative",
    demo: () => <>
      <a className={`${s.btn} ${s.p6}`} href={H}><span className={s.roll}><span>Get started</span></span><Swap /></a>
      <a className={`${s.btn} ${s.p6} ${s.sec}`} href={H}><span className={s.roll}><span>Read the docs</span></span><Swap /></a>
    </>,
    states: "P1 + P4 as one move. Hover: the dot opens and the pill makes room first; the label rolls up to its copy a beat later while the arrow leaves right; the new arrow lands last. Leave runs it backwards (arrow, label, then the dot closes). Outline fills ink. Focus: ring. Press: 0.97. Reduced: colour only.",
    timing: "dot + room 0–320ms settle · roll 80–500ms settle · arrow out 0–240ms tick, in 160–580ms settle",
  },
  {
    code: "P7", name: "Dot-led sweep", tag: "Creative",
    demo: () => <>
      <div className={s.row}>
        <Sweep from="dot" dot label="Get started" />
        <Sweep from="dot" dot arrow label="Get started" />
        <Sweep from="left" label="Get started" />
        <Sweep from="arrow" arrow label="Get started" />
        <Sweep from="icon" arrow />
      </div>
      <div className={s.row}>
        <Sweep sec from="dot" dot label="Join the Legion" />
        <Sweep sec from="dot" dot arrow label="Join the Legion" />
        <Sweep sec from="left" label="Join the Legion" />
        <Sweep sec from="arrow" arrow label="Join the Legion" />
        <Sweep sec from="icon" arrow />
      </div>
    </>,
    states: "Row 1 primary, row 2 secondary: (a) dot + label, (b) dot + label + arrow: the fill grows out of the dot and sweeps right; (c) label only: it wipes in from the left edge; (d) label + arrow: it grows out of the arrow and sweeps left; (e) icon only: it opens from the centre. Primary sweeps emerald (ink type), secondary sweeps ink. Type and dot flip exactly where the fill edge passes (a clipped copy of the content rides the fill), so every letter stays legible. Leave recedes the same way. Focus: ring. Press: 0.97. Reduced: the fill cross-fades.",
    timing: "sweep 520ms settle in · 420ms settle out",
  },
];

const LINKS: Option[] = [
  {
    code: "L1", name: "Underline draws", tag: "Faithful",
    demo: () => <>
      <a className={`${s.lk} ${s.l1}`} href={H}><span className={s.u}>See upcoming events</span><Arrow /></a>
      <a className={`${s.lk} ${s.l1}`} href={H}><span className={s.u}>Learn more</span><Arrow /></a>
    </>,
    states: "Rest: label + drawn arrow, no rule. Hover: a 1 px rule draws under the label from the left, the arrow steps 4 px. Focus: ring around the link. Press: dims to 60 %.",
    timing: "rule 400ms settle · arrow 240ms tick",
  },
  {
    code: "L2", name: "Quiet and mono", tag: "Faithful",
    demo: () => <>
      <a className={`${s.lk} ${s.l2}`} href={H}><span className={s.u}>Read the paper</span><Ext /></a>
      <a className={`${s.lk} ${s.l2} ${s.mono}`} href={H}><span>All posts</span><Arrow /></a>
    </>,
    states: "Rest: muted text on a faint hairline (inline / external), or a mono uppercase label (index links). Hover: text and rule ink up; ↗ steps 2 px up-right, → steps 3 px. Focus: ring. Press: 60 %.",
    timing: "240ms tick",
  },
  {
    code: "L3", name: "Arrow relay", tag: "Creative",
    demo: () => <>
      <a className={`${s.lk} ${s.l3}`} href={H}><span className={s.u}>Read the docs</span><Swap /></a>
      <a className={`${s.lk} ${s.l3}`} href={H}><span className={s.u}>Browse the ecosystem</span><Swap /></a>
    </>,
    states: "Rest: label + arrow. Hover: the arrow runs out right while a new one arrives from the left; the rule enters from the left and, on leaving, exits to the right (never rewinds). Focus: ring. Press: 60 %.",
    timing: "420ms settle",
  },
  {
    code: "L4", name: "Dot lands", tag: "Creative",
    demo: () => <>
      <a className={`${s.lk} ${s.l4}`} href={H}><i className={s.dot} aria-hidden="true" /><span>Find your local crew</span><Arrow /></a>
      <a className={`${s.lk} ${s.l4}`} href={H}><i className={s.dot} aria-hidden="true" /><span>Apply for a grant</span><Arrow /></a>
    </>,
    states: "Rest: the label alone, the arrow hidden. Hover: the emerald dot (you) lands in the left gutter, the label steps 14 px right, the arrow fades in. Focus: as hover, plus ring. Press: 60 %. Reduced: dot and arrow fade in, nothing moves.",
    timing: "dot 320ms settle · label + arrow 240ms tick",
  },
  {
    code: "L5", name: "Index line", tag: "Creative",
    demo: () => <>
      <a className={`${s.lk} ${s.l5}`} href={H}><span className={s.n}>01</span><span>Protocol</span><span className={s.ln} aria-hidden="true" /><Head /></a>
      <a className={`${s.lk} ${s.l5}`} href={H}><span className={s.n}>02</span><span>Research</span><span className={s.ln} aria-hidden="true" /><Head /></a>
    </>,
    states: "Rest: a mono index, the label, and a short muted hairline ending in a chevron. Hover: the line stretches from 20 to 56 px and inks up, carrying the chevron; the index goes green. Focus: ring. Press: 60 %.",
    timing: "480ms settle",
  },
];

const OTHERS: Option[] = [
  {
    code: "O1", name: "Icon buttons", tag: "Faithful",
    demo: () => <>
      <button type="button" className={`${s.ib} ${s.ibPrev}`} aria-label="Previous"><Arrow /></button>
      <button type="button" className={s.ib} aria-label="Next"><Arrow /></button>
      <button type="button" className={`${s.ib} ${s.ibX}`} aria-label="Close"><svg className={s.x} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg></button>
      <button type="button" className={`${s.ib} ${s.ibPlay}`} aria-label="Play video"><svg className={s.play} viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 3.2v9.6L12.8 8z" /></svg></button>
    </>,
    states: "Rest: 48 px squares on a hairline. Hover: fill ink; the arrow steps 3 px its way, the × turns 90°, the play triangle goes emerald. Focus: ring. Press: 0.94.",
    timing: "fill 240ms tick · glyph 360ms settle",
  },
  {
    code: "O2", name: "Segmented control", tag: "Faithful",
    demo: (t) => (
      <fieldset className={s.seg}>
        <legend className={s.sr}>View</legend>
        {["Grid", "List", "Map"].map((v, i) => (
          <label key={v}><input type="radio" name={`o2-${t}`} defaultChecked={i === 0} /><i className={s.dot} aria-hidden="true" /><span>{v}</span></label>
        ))}
      </fieldset>
    ),
    states: "Rest: mono uppercase segments in one hairline box. Hover: a 6 % ink tint. Selected: ink fill with the emerald dot. Focus (arrow keys move it): ring on the segment. Real radios, no JS.",
    timing: "200ms tick",
  },
  {
    code: "O3", name: "Filter chips", tag: "Faithful",
    demo: (t) => (
      <fieldset className={s.chips}>
        <legend className={s.sr}>Topics</legend>
        {["AI", "Privacy", "Chain signatures", "DeFi"].map((v, i) => (
          <label key={v}><input type="checkbox" name={`o3-${t}`} defaultChecked={i === 1} /><i className={s.sq} aria-hidden="true" /><span>{v}</span></label>
        ))}
      </fieldset>
    ),
    states: "Rest: square-cornered mono chips, 36 px (hit area 44). Hover: the hairline inks. On: the emerald square opens before the label, border ink. Focus: ring. Press: 0.97. Real checkboxes.",
    timing: "square 320ms settle · border 200ms tick",
  },
  {
    code: "O4", name: "Sliding tabs", tag: "Creative",
    demo: (t) => (
      <fieldset className={s.tabs}>
        <legend className={s.sr}>Section</legend>
        {["Overview", "Builders", "Events"].map((v, i) => (
          <label key={v}><input type="radio" name={`o4-${t}`} defaultChecked={i === 0} /><span>{v}</span></label>
        ))}
        <i className={s.bar} aria-hidden="true" />
      </fieldset>
    ),
    states: "Rest: three tabs on a hairline; the muted ones ink up on hover. Selected: an ink bar with an emerald square at its head slides under the chosen tab. Focus: ring. Reduced: the bar jumps, no slide.",
    timing: "bar 520ms settle · text 200ms tick",
  },
  {
    code: "O5", name: "Isometric press", tag: "Creative",
    demo: () => <>
      <a className={`${s.btn} ${s.iso}`} href={H}><span>Deploy a contract</span><Arrow /></a>
      <button type="button" className={`${s.btn} ${s.iso} ${s.sec}`}><span>Run the demo</span></button>
    </>,
    states: "Rest: a square box sitting on a hatched isometric shadow, like the line drawings. Hover: it sinks 3 px into the shadow. Press: lands flush on it. Focus: ring. Reduced: no sinking; the box tints instead.",
    timing: "sink 280ms settle · press 120ms tick",
  },
  {
    code: "O6", name: "Sizes", tag: "Faithful",
    demo: () => <>
      <a className={`${s.btn} ${s.p1}`} href={H}><span>Large 48</span><Arrow /></a>
      <a className={`${s.btn} ${s.p1} ${s.md}`} href={H}><span>Medium 40</span><Arrow /></a>
      <a className={`${s.btn} ${s.p1} ${s.sm} ${s.sec}`} href={H}><span>Small 32</span></a>
    </>,
    states: "The P1 pill at 48 (page CTAs), 40 (header, cards) and 32 (inline, tables). Below 44 px the hit area is extended by an invisible ring, so touch never misses. Same hover, focus and press at every size.",
    timing: "as P1",
  },
];

const GROUPS = [
  { id: "pills", title: "Pills · primary calls to action", intro: "The filled and outlined buttons. Primary first, secondary next to it, each on paper and on the dark band.", items: PILLS },
  { id: "links", title: "Links · text buttons", intro: "A word or two and an arrow, no box. The touch target stays 44 px tall even though the rule sits close under the text.", items: LINKS },
  { id: "others", title: "Other variants", intro: "Icon buttons, controls that pick one or many, an isometric box and the size scale.", items: OTHERS },
];

function Cell({ o }: { o: Option }) {
  return (
    <li className={s.cell} id={`prop-${o.code.toLowerCase()}`}>
      <h4 className={s.name}><span className={s.code}>{o.code}</span> · {o.name}<span className={`${s.tag}${o.tag === "Creative" ? ` ${s.tagC}` : ""}`}>{o.tag}</span></h4>
      <div className={s.stages}>
        <div className={s.stage}><span className={s.lab}>Paper</span><div className={s.demo}>{o.demo("l")}</div></div>
        <div className={`${s.stage} ${s.dark}`}><span className={s.lab}>Dark band</span><div className={s.demo}>{o.demo("d")}</div></div>
      </div>
      <p className={s.states}>{o.states}</p>
      <p className={s.timing}>{o.timing}</p>
    </li>
  );
}

export function Proposals() {
  return (
    <div className={s.root}>
      {GROUPS.map((g) => (
        <section key={g.id} className={s.group} aria-labelledby={`prop-${g.id}`}>
          <h3 id={`prop-${g.id}`} className={s.gh}>{g.title}</h3>
          <p className={s.gi}>{g.intro}</p>
          <ul className={s.grid}>{g.items.map((o) => <Cell key={o.code} o={o} />)}</ul>
        </section>
      ))}
    </div>
  );
}
