"use client";
// Post D · Poster. A post page in the October 2026 Figma's language (2026_10_Near_Web: the blog frames 980:723 and 756:41, the cover art 725:18 / 739:51):
// the light grey ground, white boxes with a hairline, mono labels after a green square, thin ink rules between the parts, outlined pills.
//   - the opening is the post's cover art, boxed as the index's lead card: the photo at 16:9 with the type chip, the NEAR logo, the "NEAR blog" kicker and
//     the title set on it (the dark cover's treatment, so any photo carries it); under it, in the same box, the dek and the facts (author, date, read);
//   - then one centred column: the takeaways in a white box, the text (sections under an ink rule with their mono number, figures boxed like the cards,
//     wide ones out of the column), numbered footnotes;
//   - then tags and share as pills, the author in a box, and "Keep reading": the Figma's boxed cards, three to a row, with their Read pills.
// Below 720 px the title leaves the photo and sits under it, in ink. Without a photo the cover is a plain ink panel; without takeaways or more posts,
// their parts are left out. Motion: the cover settles in, the blocks and cards arrive (hooks.ts); none with reduced motion.
import { useRef } from "react";
import { Arrow } from "../../blog/parts";
import type { Article } from "../article";
import { Avatar, Body, Footnotes, Tags } from "../Body";
import { useReveal } from "../hooks";
import { Card, Label, SharePills, accented } from "./parts";
import "../post.css";
import "./post-d.css";

export function PostD({ article: A }: { article: Article }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const chip = A.category || A.type || "Blog";

  return (
    <div ref={ref} className="bl pst pst-d">
      <article aria-labelledby="pd-t">
        <header className="pd-lead pd-box">
          <div className={`pd-poster${A.hero ? "" : " pd-poster--plain"}`}>
            <div className="pd-poster__ph">{A.hero && <img src={A.hero.src} alt={A.hero.alt} fetchPriority="high" decoding="async" style={A.hero.focus ? { objectPosition: A.hero.focus } : undefined} />}</div>
            <div className="pd-poster__veil" aria-hidden="true" />
            <span className="pd-chip"><i aria-hidden="true" />{chip}</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- the brand's reversed logo, a small static SVG, as on the Figma's dark cover */}
            <img className="pd-poster__logo" src="/brand/logo_rev.svg" alt="" width={1656} height={567} />
            <div className="pd-poster__copy">
              <p className="pd-kicker"><i aria-hidden="true" /><a href={A.blogHref}>News from NEAR</a></p>
              <h1 id="pd-t" className="pd-h1">{accented(A.title)}</h1>
            </div>
          </div>
          <div className="pd-lead__body">
            {A.dek && <p className="pd-dek">{A.dek}</p>}
            <dl className="pd-facts">
              <div className="pd-facts__by">
                <Avatar article={A} />
                <div><dt className="sr-only">Author</dt><dd>{A.author.name}</dd>{A.author.role && <dd className="pd-facts__sub">{A.author.role}</dd>}</div>
              </div>
              <div><dt>Published</dt><dd><time dateTime={A.dateIso}>{A.date}</time></dd></div>
              <div><dt>Read</dt><dd>{A.readMin} min</dd></div>
            </dl>
          </div>
        </header>
        {A.hero?.cap && <p className="pd-cap">{A.hero.cap}</p>}

        <div className="pd-col">
          {A.takeaways.length > 0 && (
            <section className="pd-keys pd-box" aria-labelledby="pd-keys-t" data-reveal="">
              <Label cls="pd-keys__h"><span id="pd-keys-t">Key takeaways</span></Label>
              <ol>{A.takeaways.map((t, i) => <li key={t}><span className="pd-keys__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{t}</li>)}</ol>
            </section>
          )}

          <Body article={A} notes="foot" />
          <Footnotes article={A} />

          <footer className="pd-foot">
            {A.tags.length > 0 && <div className="pd-foot__row"><Label cls="pd-foot__l">Tags</Label><Tags article={A} cls="pd-tags" /></div>}
            <div className="pd-foot__row"><Label cls="pd-foot__l">Share</Label><SharePills title={A.title} /></div>
            <div className="pd-author pd-box" data-reveal="">
              <Avatar article={A} cls="pd-author__av" />
              <div>
                <Label>Written by</Label>
                <p className="pd-author__n">{A.author.name}</p>
                {A.author.bio && <p className="pd-author__b">{A.author.bio}</p>}
              </div>
            </div>
          </footer>
        </div>
      </article>

      {A.more.length > 0 && (
        <section className="pd-more" aria-labelledby="pd-more-t">
          <div className="pd-more__head">
            <div>
              <Label>News from NEAR</Label>
              <h2 id="pd-more-t" className="pd-more__t">Keep <span className="accent">reading</span></h2>
            </div>
            <a className="pd-pill pd-pill--ink" href={A.blogHref}><span>All posts</span><Arrow /></a>
          </div>
          <div className="pd-grid">{A.more.slice(0, 3).map((p, j) => <Card key={p.key} p={p} j={j} />)}</div>
        </section>
      )}
    </div>
  );
}
