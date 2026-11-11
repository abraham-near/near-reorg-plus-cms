"use client";
// Blog B · Magazine. The heading row (The NEAR blog, and the sections as a short contents list), then the lead post over a full-bleed photo: it starts at
// the grid's width and opens to the whole screen as you scroll (the stage holds while it is open, then closes again as it leaves: motion.ts), the headline
// in the sky. Then the sections by type, each a ruled head row and a row of three cards (photos drift inside their frames) with the rest of the type as
// compact rows under it; Inside NEAR (the talks) opens on its own bleed over the ridges. Ends on a row that sends you to the blog.
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { ACTION, BLOG, POSTS, SHORT_LABEL, TYPE_LABEL, href, img, type Post } from "../data";
import { Arrow, Card, ExtSr, Photo } from "../parts";
import { mount } from "./motion";
import "./blog-b.css";

const LEAD = POSTS[0];   // the newest post (a read): the cover
const STORIES = POSTS.filter((p) => p.type === "story"), TALKS = POSTS.filter((p) => p.type === "watch");

/** a compact row: the thumbnail, the label, the title and the source */
function Brief({ p, j }: { p: Post; j: number }) {
  const u = href(p);
  return (
    <div className="bl-cell bl-b__brief" style={{ ["--j" as string]: j }}>
      <a className="bl-b__brief-a" href={u}>
        <Photo src={img(p.id)} cls="bl-b__brief-ph" />
        <span className="bl-b__brief-tx" data-rv="">
          <span className="bl-meta t-label"><i className="bl-glyph" data-icon={`deeper-${p.type}`} aria-hidden="true" />{SHORT_LABEL[p.type]}</span>
          <span className="bl-b__brief-t">{p.title}<ExtSr h={u} /></span>
          <span className="bl-b__brief-src">{p.source}</span>
        </span>
        <span className="bl-b__brief-go" aria-hidden="true"><Arrow /></span>
      </a>
      {p.note && <p className="bl-b__brief-note">{p.note}</p>}
    </div>
  );
}

/** a section: its head row, three cards, the rest as compact rows (an empty cell keeps the row's three columns) */
function Section({ id, title, count, posts, children }: { id: string; title: ReactNode; count: string; posts: Post[]; children?: ReactNode }) {
  const top = posts.slice(0, 3), more = posts.slice(3);
  return (
    <section className="bl-b__sec" id={id} aria-labelledby={`${id}-t`}>
      {children ?? (
        <div className="bl-row bl-b__head" data-row="">
          <div className="bl-cell bl-b__head-cell">
            <h2 id={`${id}-t`} className="bl-h2" data-rv="">{title}</h2>
            <p className="t-label" data-rv="">{count}</p>
          </div>
        </div>
      )}
      <div className="bl-row bl-b__cards" data-row="">
        {top.map((p, j) => <div key={p.id} className="bl-cell bl-b__cell"><Card p={p} j={j} /></div>)}
      </div>
      {more.length > 0 && (
        <div className="bl-row bl-b__briefs" data-row="">
          {more.map((p, j) => <Brief key={p.id} p={p} j={j} />)}
          {more.length < 3 && (
            <div className="bl-cell bl-b__brief bl-b__brief--all">
              <a className="bl-link" href={BLOG} data-rv=""><span>View everything</span><Arrow /><span className="sr-only"> (another site)</span></a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function BlogB() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const u = href(LEAD);
  return (
    <div ref={ref} className="bl bl-b">
      <section className="bl-b__open" aria-labelledby="bl-b-t">
        <div className="bl-row bl-b__top" data-row="" data-start="">
          <div className="bl-cell bl-b__title">
            <h1 id="bl-b-t" className="bl-h2 bl-b__h1" data-rv="">The NEAR <span className="accent">blog</span></h1>
          </div>
          <nav className="bl-cell bl-b__toc" aria-label="In this issue">
            <p className="t-label" data-rv="">In this issue</p>
            <ol data-rv="">
              <li><a className="bl-link" href="#bl-b-lead"><span>{TYPE_LABEL[LEAD.type]}: the cover</span></a></li>
              <li><a className="bl-link" href="#bl-b-stories"><span>Customer stories</span></a></li>
              <li><a className="bl-link" href="#bl-b-talks"><span>Inside NEAR</span></a></li>
            </ol>
          </nav>
        </div>

        {/* the cover: the grid's top rule runs over the bleed's top edge; the frame opens past it (motion.ts) */}
        <div className="bl-bleed-wrap" id="bl-b-lead">
          <article className="bl-bleed bl-b__cover" data-row="" data-no-x="" data-bleed="cover" aria-labelledby="bl-b-lead-t">
            <div className="bl-bleed__stage">
              <div className="bl-ph bl-bleed__ph" data-ph="" data-still=""><div className="bl-plate"><img className="bl-img" src={img(LEAD.id)} alt="" decoding="async" /></div></div>
              <div className="bl-bleed__in bl-b__cover-in">
                <p className="bl-meta t-label bl-b__kicker" data-rv=""><i className="bl-glyph" data-icon={`deeper-${LEAD.type}`} aria-hidden="true" />The cover · {TYPE_LABEL[LEAD.type]}</p>
                <h2 id="bl-b-lead-t" className="bl-display bl-b__cover-t" data-rv="">{LEAD.title}</h2>
                <p className="bl-b__cover-src" data-rv="">{LEAD.source}</p>
                <p className="bl-b__cover-go" data-rv=""><a className="bl-btn bl-btn--ink" href={u}><span>{ACTION[LEAD.type]}</span><Arrow /><ExtSr h={u} /></a></p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <Section id="bl-b-stories" title={<>Customer <span className="accent">stories</span></>} count={`${STORIES.length} stories`} posts={STORIES} />

      <Section id="bl-b-talks" title={null} count="" posts={TALKS}>
        <div className="bl-row bl-b__spacer" data-row="" aria-hidden="true"><div className="bl-cell" /></div>
        <div className="bl-bleed-wrap">
          <div className="bl-bleed bl-b__talks" data-row="" data-no-x="" data-bleed="talks">
            <div className="bl-bleed__stage">
              <div className="bl-ph bl-bleed__ph" data-ph="" data-still=""><div className="bl-plate"><img className="bl-img" src="/v3/bleed-ridges.webp" alt="" loading="lazy" decoding="async" /></div></div>
              <div className="bl-bleed__in bl-b__talks-in">
                <p className="t-label bl-b__kicker" data-rv="">{TALKS.length} talks</p>
                <h2 id="bl-b-talks-t" className="bl-display bl-b__talks-t" data-rv="">Inside <span className="accent">NEAR</span></h2>
                <p className="bl-lede bl-b__talks-l" data-rv="">Talks from Inside NEAR: private money, the rails AI runs on, quantum readiness and the sovereign economy.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <section className="bl-b__end" aria-labelledby="bl-b-end-t">
        <div className="bl-row bl-row--end bl-b__end-row" data-row="">
          <div className="bl-cell bl-b__end-cell">
            <h2 id="bl-b-end-t" className="bl-h2" data-rv="">More on the <span className="accent">blog</span></h2>
            <p data-rv=""><a className="bl-btn" href={BLOG}><span>Visit near.org/blog</span><Arrow /><span className="sr-only"> (another site)</span></a></p>
          </div>
        </div>
      </section>
    </div>
  );
}
