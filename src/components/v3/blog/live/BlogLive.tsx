// The blog index fed by the CMS (/blog): Blog A's ruled grid and cards (a/blog-a.css), server-rendered. The heading row, a count, the newest post as
// the lead (photo edge to edge in its cell, its excerpt and Read), then the rest as cards three to a row. No filters or Load more: the list is short
// for now, and the index directions are being designed separately (/blog-a…).
import { chunk } from "../data";
import { Arrow, Photo } from "../parts";
import { MoreCard } from "../../post/Body";
import { longDate, postHref, toMore } from "@/lib/blog/article";
import type { PostCard } from "@/lib/blog/posts";
import { GridMotion } from "./GridMotion";
import "../../post/post.css";
import "../a/blog-a.css";
import "./blog-live.css";

export function BlogLive({ posts }: { posts: PostCard[] }) {
  const [lead, ...rest] = posts, rows = chunk(rest, 3);
  return (
    <GridMotion className="bl bl-a bl-live">
      <section aria-labelledby="bl-live-t">
        <div className="bl-row bl-a__head" data-row="" data-start="">
          <div className="bl-cell bl-a__title">
            <h1 id="bl-live-t" className="bl-display bl-a__h1">The NEAR <span className="accent">blog</span></h1>
          </div>
          <div className="bl-cell bl-a__intro">
            <p className="bl-lede" data-rv="">News, reads and notes from the people building NEAR.</p>
          </div>
        </div>
        <div className="bl-row bl-a__bar" data-row="">
          <div className="bl-cell bl-a__bar-cell">
            <p className="bl-a__count t-label">{posts.length === 1 ? "1 post" : `${posts.length} posts`}</p>
          </div>
        </div>
      </section>

      {lead ? (
        <article className={`bl-row bl-a__lead${rows.length ? "" : " bl-row--end"}`} data-row="">
          <div className="bl-cell bl-a__lead-ph">
            <a href={postHref(lead.slug)} tabIndex={-1} aria-hidden="true" className="bl-a__lead-pa">
              {lead.image ? <Photo src={lead.image.src} cls="bl-a__ph" eager /> : <div className="bl-ph bl-a__ph pb-noimg" />}
            </a>
          </div>
          <div className="bl-cell bl-a__lead-body">
            <a className="bl-a__lead-a" href={postHref(lead.slug)}>
              <span className="bl-meta t-label" data-rv="">Latest{lead.category && ` · ${lead.category.name}`}</span>
              <h2 className="bl-h2 bl-a__lead-t bl-live__lead-t" data-rv="">{lead.title}</h2>
              <span className="bl-a__lead-src" data-rv="">
                {lead.excerpt && <span className="bl-live__ex">{lead.excerpt}</span>}
                <time dateTime={lead.publishedAt}>{longDate(lead.publishedAt)}</time>{lead.author && ` · ${lead.author}`}
              </span>
              <span className="bl-btn bl-a__lead-go" data-rv=""><span>Read</span><Arrow /></span>
            </a>
          </div>
        </article>
      ) : (
        <div className="bl-row bl-row--end" data-row="">
          <p className="bl-cell bl-live__empty">No posts yet. Posts published in the CMS appear here.</p>
        </div>
      )}

      {rows.map((row, r) => (
        <div key={r} className={`bl-row bl-a__cards${r === rows.length - 1 ? " bl-row--end" : ""}`} data-row="">
          {row.map((p, j) => <div key={p.slug} className="bl-cell bl-a__cell"><MoreCard p={toMore(p)} j={j} /></div>)}
          {Array.from({ length: 3 - row.length }, (_, k) => <div key={`e${k}`} className="bl-cell bl-a__cell bl-a__cell--empty" aria-hidden="true" />)}
        </div>
      ))}
    </GridMotion>
  );
}
