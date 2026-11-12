"use client";
// Post C · Notebook. A reference read, set like good documentation: a split opening (the title, dek and facts on the left, the photo tall on the right),
// then a sticky rail beside the text: the contents with a line that fills section by section, the reading time left, the takeaways and share. Notes sit in
// boxes under their paragraph, the figures as cards, the code as a panel. Ends on tags, the author and the next posts as a numbered list.
// Motion: the photo opens and drifts, the blocks arrive (hooks.ts), the rail follows the reading.
import { useEffect, useRef } from "react";
import { POSTS, TYPE_LABEL, href, img } from "../../blog/data";
import { Arrow } from "../../blog/parts";
import { ARTICLE, READ_MIN, RELATED, SECTIONS } from "../article";
import { Avatar, Body, Share, Tags } from "../Body";
import { useActiveSection, useReadProgress, useReveal } from "../hooks";
import "../post.css";
import "./post-c.css";

const IDS = SECTIONS.map((s) => s.id);
const MORE = RELATED.map((id) => POSTS.find((p) => p.id === id)!).filter(Boolean);

export function PostC() {
  const ref = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), rail = useRef<HTMLElement>(null), left = useRef<HTMLSpanElement>(null);
  useReveal(ref);
  useReadProgress(art, rail);
  const active = useActiveSection(IDS);
  const at = IDS.indexOf(active);

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
  }, []);

  return (
    <div ref={ref} className="bl pst pst-c">
      <article aria-labelledby="pc-t">
        <header className="pc-open">
          <div className="pc-open__text">
            <p className="pc-crumb"><a href="/blog-a">Blog</a><span aria-hidden="true">→</span><span>{ARTICLE.category}</span></p>
            <h1 id="pc-t" className="pc-h1">{ARTICLE.title}</h1>
            <p className="pc-dek">{ARTICLE.dek}</p>
            <dl className="pc-facts">
              <div className="pc-facts__by"><Avatar /><div><dt className="sr-only">Author</dt><dd>{ARTICLE.author.name}</dd><dd className="pc-facts__sub">{ARTICLE.author.role}</dd></div></div>
              <div><dt>Published</dt><dd><time dateTime={ARTICLE.dateIso}>{ARTICLE.date}</time></dd></div>
              <div><dt>Read</dt><dd>{READ_MIN} min</dd></div>
            </dl>
          </div>
          <figure className="pc-open__fig">
            <div className="pc-open__ph"><img src={ARTICLE.hero.src} alt={ARTICLE.hero.alt} /></div>
            <figcaption className="pb-cap">{ARTICLE.hero.cap}</figcaption>
          </figure>
        </header>

        <div className="pc-grid">
          <aside ref={rail} className="pc-rail" aria-label="Article tools">
            <div className="pc-rail__in">
              <nav aria-label="In this article">
                <p className="pc-rail__h">Contents</p>
                <ol className="pc-toc">
                  {SECTIONS.map((s, i) => (
                    <li key={s.id} className={i < at ? "is-done" : undefined}>
                      <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}><span className="pc-toc__dot" aria-hidden="true" />{s.t}</a>
                    </li>
                  ))}
                </ol>
              </nav>
              <p className="pc-left"><span className="pc-left__bar" aria-hidden="true"><i /></span><span ref={left}>{READ_MIN} min left</span></p>
              <div className="pc-keys">
                <p className="pc-rail__h">In short</p>
                <ul>{ARTICLE.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
              <Share cls="pc-rail__share" />
            </div>
          </aside>

          <div ref={art} className="pc-main">
            <Body notes="aside" />
            <footer className="pc-foot">
              <Tags />
              <div className="pc-author">
                <Avatar cls="pc-author__av" />
                <div>
                  <p className="pc-author__n">Written by {ARTICLE.author.name}</p>
                  <p className="pc-author__b">Placeholder author for this example. A real post shows the writer’s name, role and a line about what they work on.</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </article>

      <section className="pc-more" aria-labelledby="pc-more-t">
        <div className="pc-more__head">
          <h2 id="pc-more-t" className="pc-more__t">Related reading</h2>
          <a className="bl-link" href="/blog-a"><span>All posts</span><Arrow /></a>
        </div>
        <ol className="pc-more__list">
          {MORE.map((p, i) => (
            <li key={p.id}>
              <a className="pc-more__a" href={href(p)}>
                <span className="pc-more__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-more__l">{TYPE_LABEL[p.type]}</span>
                <span className="pc-more__title">{p.title}</span>
                <span className="pc-more__ph" aria-hidden="true"><img src={img(p.id)} alt="" loading="lazy" /></span>
                <span className="pc-more__go" aria-hidden="true"><Arrow /></span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
