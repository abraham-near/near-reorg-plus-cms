"use client";
// Blog A · Editorial index. On the ruled grid of /home-v3: the heading in its row (The NEAR blog, its accent in Kepler Light Italic) with a short lede,
// the filters on their own row (Go deeper's tablist: the green dot slides), then the lead post (the first of the filter) large, photo edge to edge in
// its cell, then the rest as cards three to a ruled row, and Load more at the foot (three more at a time; at the end, View everything on near.org).
// Motion: grid.ts (rows draw, crosshairs, photos drift) + the heading rises word by word (gsap SplitText). A filter change re-shows the panel in place.
import { useEffect, useRef, useState } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion, type MotionCtx } from "@/lib/motion/scroll";
import { mountGrid, type Grid } from "../grid";
import { ACTION, BLOG, FILTERS, TYPE_LABEL, byType, chunk, href, img, type FilterKey } from "../data";
import { Arrow, Card, ExtSr, Photo, Tabs } from "../parts";
import "./blog-a.css";

const FIRST = 6, STEP = 3;   // cards on arrival (two rows), then a row at a time
const COUNTS = Object.fromEntries(FILTERS.map((f) => [f.key, byType(f.key).length])) as Record<FilterKey, number>;

function mount(root: HTMLElement, ctx: MotionCtx) {
  const grid = mountGrid(root, ctx);
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".bl-a__h1");
  if (h && !ctx.reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "bl-a__w" });
    ctx.gsap.from(split.words, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.15 });
  }
  return { grid, dispose: () => { split?.revert(); grid.dispose(); } };
}

export function BlogA() {
  const ref = useRef<HTMLDivElement>(null), grid = useRef<Grid | null>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [n, setN] = useState(FIRST);
  const [shown, setShown] = useState(false);   // a filter has changed: the panel re-shows (its photos open, its text rises)
  const focusFrom = useRef(-1);                // Load more: focus moves to the first new card
  useScrollMotion(ref, (root, ctx) => { const m = mount(root, ctx); grid.current = m.grid; return () => { m.dispose(); grid.current = null; }; });

  const list = byType(f), lead = list[0], rest = list.slice(1), cards = rest.slice(0, n), rows = chunk(cards, 3);
  const choose = (k: FilterKey) => { if (k === f) return; setF(k); setN(FIRST); setShown(true); };

  useEffect(() => { grid.current?.sync(true); }, [f]);
  useEffect(() => {
    grid.current?.sync();
    if (focusFrom.current >= 0) { ref.current?.querySelectorAll<HTMLElement>(".bl-a__cards .bl-card__a")[focusFrom.current]?.focus({ preventScroll: false }); focusFrom.current = -1; }
  }, [n]);

  const label = FILTERS.find((x) => x.key === f)!.label;
  const showing = (lead ? 1 : 0) + cards.length;
  return (
    <div ref={ref} className="bl bl-a">
      <section aria-labelledby="bl-a-t">
        <div className="bl-row bl-a__head" data-row="" data-start="">
          <div className="bl-cell bl-a__title">
            <h1 id="bl-a-t" className="bl-display bl-a__h1">The NEAR <span className="accent">blog</span></h1>
          </div>
          <div className="bl-cell bl-a__intro">
            <p className="bl-lede" data-rv="">Customer stories from teams building with NEAR, reads on the agent economy and talks from Inside NEAR.</p>
          </div>
        </div>
        <div className="bl-row bl-a__bar" data-row="">
          <div className="bl-cell bl-a__bar-cell">
            <Tabs value={f} onChange={choose} id="bl-a-tab" controls="bl-a-panel" counts={COUNTS} />
            <p className="bl-a__count t-label" aria-live="polite">Showing {showing} of {list.length}</p>
          </div>
        </div>
      </section>

      <div key={f} id="bl-a-panel" role="tabpanel" aria-labelledby={`bl-a-tab-${f}`} className={`bl-a__panel${shown ? " is-shown" : ""}`}>
        {lead && (
          <article className="bl-row bl-a__lead" data-row="">
            <div className="bl-cell bl-a__lead-ph">
              <a href={href(lead)} tabIndex={-1} aria-hidden="true" className="bl-a__lead-pa">
                <Photo src={img(lead.id)} cls="bl-a__ph" eager />
                {lead.type === "watch" && <span className="bl-play" aria-hidden="true"><i data-icon="play" /></span>}
              </a>
            </div>
            <div className="bl-cell bl-a__lead-body">
              <a className="bl-a__lead-a" href={href(lead)}>
                <span className="bl-meta t-label" data-rv="" data-rise=""><i className="bl-glyph" data-icon={`deeper-${lead.type}`} aria-hidden="true" />Featured · {TYPE_LABEL[lead.type]}</span>
                <h2 className="bl-h2 bl-a__lead-t" data-rv="" data-rise="">{lead.title}<ExtSr h={href(lead)} /></h2>
                <span className="bl-a__lead-src" data-rv="" data-rise="">{lead.source}</span>
                <span className="bl-btn bl-a__lead-go" data-rv="" data-rise=""><span>{ACTION[lead.type]}</span><Arrow /></span>
              </a>
              {lead.note && <p className="bl-a__note" data-rv="" data-rise="">{lead.note}</p>}
            </div>
          </article>
        )}
        {rows.map((row, r) => (
          <div key={r} className={`bl-row bl-a__cards${r * 3 >= FIRST ? " is-shown" : ""}`} data-row="">
            {row.map((p, j) => <div key={p.id} className="bl-cell bl-a__cell"><Card p={p} j={j} /></div>)}
            {Array.from({ length: 3 - row.length }, (_, k) => <div key={`e${k}`} className="bl-cell bl-a__cell bl-a__cell--empty" aria-hidden="true" />)}
          </div>
        ))}
      </div>

      <div className="bl-row bl-row--end bl-a__more" data-row="">
        <div className="bl-cell bl-a__more-cell">
          {cards.length < rest.length ? (
            <>
              <p className="bl-a__more-n">{rest.length - cards.length} more in {label}</p>
              <button type="button" className="bl-btn" onClick={() => { focusFrom.current = cards.length; setN((x) => x + STEP); }}><span>Load more</span></button>
            </>
          ) : (
            <>
              <p className="bl-a__more-n">That’s everything in {label} for now.</p>
              <a className="bl-link" href={BLOG}><span>View everything on near.org</span><Arrow /><span className="sr-only"> (another site)</span></a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
