"use client";
// Post C · Notebook. A reference read, set like good documentation: a split opening (the title, dek and facts on the left, the photo tall on the right),
// then a sticky rail beside the text: the contents with a line that fills section by section, the reading time left, the takeaways and share. Notes sit in
// boxes under their paragraph, the figures as cards, the code as a panel. Ends on tags, the author and the next posts as a numbered list.
// Motion: the photo opens and drifts, the blocks arrive (hooks.ts), the rail follows the reading.
// Without a photo the opening is one column (.pc-open--plain); without sections, takeaways or more posts, their parts are left out.
import { useEffect, useMemo, useRef } from "react";
import { Arrow } from "../../blog/parts";
import type { Article } from "../article";
import { Avatar, Body, Share, Tags } from "../Body";
import { useActiveSection, useReadProgress, useReveal } from "../hooks";
import "../post.css";
import "./post-c.css";

export function PostC({ article: A }: { article: Article }) {
  const ref = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), rail = useRef<HTMLElement>(null), left = useRef<HTMLSpanElement>(null);
  useReveal(ref);
  useReadProgress(art, rail);
  const ids = useMemo(() => A.sections.map((s) => s.id), [A.sections]);
  const active = useActiveSection(ids);
  const at = ids.indexOf(active);
  const READ_MIN = A.readMin;

  // minutes left, from the same --read the rail draws with
  useEffect(() => {
    const r = rail.current, out = left.current; if (!r || !out) return;
    const mo = new MutationObserver(() => {
      const p = parseFloat(r.style.getPropertyValue("--read") || "0");
      const m = Math.max(0, Math.ceil(READ_MIN * (1 - p)));
      out.textContent = p >= 0.995 ? "Finished" : `${m} min left`;
    });
    mo.observe(r, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, [READ_MIN]);

  return (
    <div ref={ref} className="bl pst pst-c">
      <article aria-labelledby="pc-t">
        <header className={`pc-open${A.hero ? "" : " pc-open--plain"}`}>
          <div className="pc-open__text">
            <p className="pc-crumb"><a href={A.blogHref}>Blog</a>{A.category && <><span aria-hidden="true">→</span><span>{A.category}</span></>}</p>
            <h1 id="pc-t" className="pc-h1">{A.title}</h1>
            {A.dek && <p className="pc-dek">{A.dek}</p>}
            <dl className="pc-facts">
              <div className="pc-facts__by"><Avatar article={A} /><div><dt className="sr-only">Author</dt><dd>{A.author.name}</dd>{A.author.role && <dd className="pc-facts__sub">{A.author.role}</dd>}</div></div>
              <div><dt>Published</dt><dd><time dateTime={A.dateIso}>{A.date}</time></dd></div>
              <div><dt>Read</dt><dd>{READ_MIN} min</dd></div>
            </dl>
          </div>
          {A.hero && (
            <figure className="pc-open__fig">
              <div className="pc-open__ph"><img src={A.hero.src} alt={A.hero.alt} /></div>
              {A.hero.cap && <figcaption className="pb-cap">{A.hero.cap}</figcaption>}
            </figure>
          )}
        </header>

        <div className="pc-grid">
          <aside ref={rail} className="pc-rail" aria-label="Article tools">
            <div className="pc-rail__in">
              {A.sections.length > 0 && <nav aria-label="In this article">
                <p className="pc-rail__h">Contents</p>
                <ol className="pc-toc">
                  {A.sections.map((s, i) => (
                    <li key={s.id} className={i < at ? "is-done" : undefined}>
                      <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}><span className="pc-toc__dot" aria-hidden="true" />{s.t}</a>
                    </li>
                  ))}
                </ol>
              </nav>}
              <p className="pc-left"><span className="pc-left__bar" aria-hidden="true"><i /></span><span ref={left}>{READ_MIN} min left</span></p>
              {A.takeaways.length > 0 && (
                <div className="pc-keys">
                  <p className="pc-rail__h">In short</p>
                  <ul>{A.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              )}
              <Share title={A.title} cls="pc-rail__share" />
            </div>
          </aside>

          <div ref={art} className="pc-main">
            <Body article={A} notes="aside" />
            <footer className="pc-foot">
              <Tags article={A} />
              <div className="pc-author">
                <Avatar article={A} cls="pc-author__av" />
                <div>
                  <p className="pc-author__n">Written by {A.author.name}</p>
                  {A.author.bio && <p className="pc-author__b">{A.author.bio}</p>}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </article>

      {A.more.length > 0 && <section className="pc-more" aria-labelledby="pc-more-t">
        <div className="pc-more__head">
          <h2 id="pc-more-t" className="pc-more__t">Related reading</h2>
          <a className="bl-link" href={A.blogHref}><span>All posts</span><Arrow /></a>
        </div>
        <ol className="pc-more__list">
          {A.more.map((p, i) => (
            <li key={p.key}>
              <a className="pc-more__a" href={p.href}>
                <span className="pc-more__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-more__l">{p.label}</span>
                <span className="pc-more__title">{p.title}</span>
                <span className="pc-more__ph" aria-hidden="true">{p.img && <img src={p.img} alt="" loading="lazy" />}</span>
                <span className="pc-more__go" aria-hidden="true"><Arrow /></span>
              </a>
            </li>
          ))}
        </ol>
      </section>}
    </div>
  );
}
