"use client";
// Post A · Ruled. The blog index's ruled grid carried into the article: the title in its row, a row of facts (author, date, reading time, share), the
// photo edge to edge in its cell, then the reading row in three columns: the contents on the left (sticky, the section being read inked, a hairline
// that fills as you read), the text in the middle, its notes in the right margin. Closes on tags, the author and three more posts as the index's cards.
// Motion: grid.ts (rows draw, crosshairs, photos drift) + the title rises word by word + the body's blocks arrive (hooks.ts).
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion, type MotionCtx } from "@/lib/motion/scroll";
import { mountGrid } from "../../blog/grid";
import { POSTS } from "../../blog/data";
import { Card, Photo } from "../../blog/parts";
import { ARTICLE, READ_MIN, RELATED, SECTIONS } from "../article";
import { Avatar, Body, Share, Tags } from "../Body";
import { useActiveSection, useReadProgress, useReveal } from "../hooks";
import "../post.css";
import "./post-a.css";

const IDS = SECTIONS.map((s) => s.id);
const MORE = RELATED.map((id) => POSTS.find((p) => p.id === id)!).filter(Boolean);

function mount(root: HTMLElement, ctx: MotionCtx) {
  const grid = mountGrid(root, ctx);
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".pa-h1");
  if (h && !ctx.reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "pa-w" });
    ctx.gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.045, delay: 0.1 });
  }
  return () => { split?.revert(); grid.dispose(); };
}

export function PostA() {
  const ref = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), toc = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  useReveal(art);
  useReadProgress(art, toc);
  const active = useActiveSection(IDS);

  return (
    <div ref={ref} className="bl pst pst-a">
      <article aria-labelledby="pa-t">
        <header>
          <div className="bl-row pa-head" data-row="" data-start="">
            <div className="bl-cell pa-title">
              <p className="pa-crumb t-label" data-rv=""><a href="/blog-a">Blog</a><span aria-hidden="true">/</span><span>{ARTICLE.category}</span></p>
              <h1 id="pa-t" className="pa-h1">{ARTICLE.title}</h1>
            </div>
            <div className="bl-cell pa-dek">
              <p className="bl-lede" data-rv="">{ARTICLE.dek}</p>
            </div>
          </div>
          <div className="bl-row pa-facts" data-row="">
            <div className="bl-cell pa-fact pa-fact--by" data-rv="">
              <Avatar />
              <span><span className="pa-fact__v">{ARTICLE.author.name}</span><span className="pa-fact__l">{ARTICLE.author.role}</span></span>
            </div>
            <div className="bl-cell pa-fact" data-rv=""><span className="pa-fact__l">Published</span><time className="pa-fact__v" dateTime={ARTICLE.dateIso}>{ARTICLE.date}</time></div>
            <div className="bl-cell pa-fact" data-rv=""><span className="pa-fact__l">Reading time</span><span className="pa-fact__v">{READ_MIN} min read</span></div>
            <div className="bl-cell pa-fact pa-fact--share" data-rv=""><Share /></div>
          </div>
          <div className="bl-row pa-hero" data-row="">
            <div className="bl-cell pa-hero__cell">
              <Photo src={ARTICLE.hero.src} cls="pa-hero__ph" eager />
            </div>
          </div>
          <div className="bl-row pa-cap" data-row="">
            <p className="bl-cell pa-cap__t" data-rv="">{ARTICLE.hero.cap}</p>
          </div>
        </header>

        <div className="bl-row pa-read" data-row="">
          <div className="bl-cell pa-side">
            <nav ref={toc} className="pa-toc" aria-label="In this article">
              <p className="pa-toc__h t-label">In this article</p>
              <ol>
                {SECTIONS.map((s, i) => (
                  <li key={s.id}><a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}><span className="pa-toc__n">{String(i + 1).padStart(2, "0")}</span>{s.t}</a></li>
                ))}
              </ol>
              <span className="pa-toc__bar" aria-hidden="true"><i /></span>
            </nav>
          </div>
          <div ref={art} className="bl-cell pa-main">
            <aside className="pa-keys" data-reveal="">
              <p className="pa-keys__h t-label">Key takeaways</p>
              <ul>{ARTICLE.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
            </aside>
            <Body notes="margin" />
          </div>
          <div className="bl-cell pa-margin" aria-hidden="true" />
        </div>

        <footer>
          <div className="bl-row pa-end" data-row="">
            <div className="bl-cell pa-end__tags" data-rv=""><Tags /></div>
            <div className="bl-cell pa-end__share" data-rv=""><Share /></div>
          </div>
          <div className="bl-row pa-author" data-row="">
            <div className="bl-cell pa-author__cell" data-rv="">
              <Avatar cls="pa-author__av" />
              <div>
                <p className="pa-author__n">{ARTICLE.author.name}</p>
                <p className="pa-author__b">Placeholder author for this example. A real post shows the writer’s name, role and a line about what they work on.</p>
              </div>
            </div>
          </div>
        </footer>
      </article>

      <section aria-labelledby="pa-more-t">
        <div className="bl-row pa-more-h" data-row="">
          <div className="bl-cell pa-more-h__cell">
            <h2 id="pa-more-t" className="pa-more-t" data-rv="">Keep reading</h2>
            <a className="bl-link" href="/blog-a" data-rv=""><span>All posts</span><svg className="bl-arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg></a>
          </div>
        </div>
        <div className="bl-row bl-row--end pa-more" data-row="">
          {MORE.map((p, j) => <div key={p.id} className="bl-cell pa-more__cell"><Card p={p} j={j} /></div>)}
        </div>
      </section>
    </div>
  );
}
