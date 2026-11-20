"use client";
// Post V · Video. A video post (the CMS's Format: Video) on Post A's ruled grid, kept simple: the title row, the facts row (author, date, where it plays,
// share), the video edge to edge in its own row, then the text that goes with it (optional) in one centred column, and the same foot as A: tags, the
// author and three more posts as the index's cards. The video is either an uploaded MP4/WebM (<video>, the cover as its poster) or a YouTube/Vimeo player
// (<iframe>); both only as lib/blog/video.ts rebuilt them. Nothing autoplays. Motion: A's (grid.ts + the title word by word + the body's blocks).
// The video row is not a [data-ph] photo, so grid.ts's drift never moves the player.
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion, type MotionCtx } from "@/lib/motion/scroll";
import type { Video } from "@/lib/blog/video";
import { mountGrid } from "../../blog/grid";
import type { Article } from "../article";
import { Avatar, Body, Footnotes, MoreCard, Share, Tags, htmlNotes } from "../Body";
import { useReveal } from "../hooks";
import "../post.css";
import "../a/post-a.css";
import "./post-v.css";

function mount(root: HTMLElement, ctx: MotionCtx) {
  const grid = mountGrid(root, ctx);
  let split: SplitText | null = null;
  const h = root.querySelector<HTMLElement>(".pa-h1");
  if (h && !ctx.reduced) {
    ctx.gsap.registerPlugin(SplitText);
    split = SplitText.create(h, { type: "words", wordsClass: "pa-w" });
    ctx.gsap.from(split.words, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.045, delay: 0.1 });
  }
  return () => { split?.revert(); grid.dispose(); };
}

const source = (v: Video) => (v.kind === "file" ? "Video" : v.src.includes("vimeo") ? "Vimeo" : "YouTube");

export function Player({ video, title, poster }: { video: Video; title: string; poster?: string }) {
  return (
    <div className="pb-embed pv-player">
      {video.kind === "file"
        ? <video src={video.src} poster={poster} controls playsInline preload="metadata" aria-label={title} />
        : <iframe src={video.src} title={title} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media" />}
    </div>
  );
}

export function PostV({ article: A }: { article: Article }) {
  const ref = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  useReveal(art);
  const text = "html" in A.body ? A.body.html.trim() !== "" : A.body.blocks.length > 0;

  return (
    <div ref={ref} className="bl pst pst-a pst-v">
      <article aria-labelledby="pa-t">
        <header>
          <div className="bl-row pa-head" data-row="" data-start="">
            <div className="bl-cell pa-title">
              <p className="pa-crumb t-label" data-rv=""><a href={A.blogHref}>Blog</a><span aria-hidden="true">/</span><span>{A.category || "Watch"}</span></p>
              <h1 id="pa-t" className="pa-h1">{A.title}</h1>
            </div>
            <div className="bl-cell pa-dek">
              {A.dek && <p className="bl-lede" data-rv="">{A.dek}</p>}
            </div>
          </div>
          <div className="bl-row pa-facts" data-row="">
            <div className="bl-cell pa-fact pa-fact--by" data-rv="">
              <Avatar article={A} />
              <span><span className="pa-fact__v">{A.author.name}</span>{A.author.role && <span className="pa-fact__l">{A.author.role}</span>}</span>
            </div>
            <div className="bl-cell pa-fact" data-rv=""><span className="pa-fact__l">Published</span><time className="pa-fact__v" dateTime={A.dateIso}>{A.date}</time></div>
            <div className="bl-cell pa-fact" data-rv=""><span className="pa-fact__l">Watch</span><span className="pa-fact__v">{A.video ? source(A.video) : "Video"}</span></div>
            <div className="bl-cell pa-fact pa-fact--share" data-rv=""><Share title={A.title} /></div>
          </div>
          {A.video && (
            <div className="bl-row pa-hero" data-row="">
              <div className="bl-cell pa-hero__cell">
                <Player video={A.video} title={A.title} poster={A.hero?.src} />
              </div>
            </div>
          )}
        </header>

        {(text || A.takeaways.length > 0) && (
          <div className="bl-row pv-read" data-row="">
            <div ref={art} className="bl-cell pa-main pv-main">
              {A.takeaways.length > 0 && (
                <aside className="pa-keys" data-reveal="">
                  <p className="pa-keys__h t-label">Key takeaways</p>
                  <ul>{A.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
                </aside>
              )}
              {text && <Body article={A} notes="foot" />}
              {htmlNotes(A) && <Footnotes article={A} />}
            </div>
          </div>
        )}

        <footer>
          <div className="bl-row pa-end" data-row="">
            <div className="bl-cell pa-end__tags" data-rv=""><Tags article={A} /></div>
            <div className="bl-cell pa-end__share" data-rv=""><Share title={A.title} /></div>
          </div>
          <div className="bl-row pa-author" data-row="">
            <div className="bl-cell pa-author__cell" data-rv="">
              <Avatar article={A} cls="pa-author__av" />
              <div>
                <p className="pa-author__n">{A.author.name}</p>
                {A.author.bio && <p className="pa-author__b">{A.author.bio}</p>}
              </div>
            </div>
          </div>
        </footer>
      </article>

      {A.more.length > 0 && <section aria-labelledby="pa-more-t">
        <div className="bl-row pa-more-h" data-row="">
          <div className="bl-cell pa-more-h__cell">
            <h2 id="pa-more-t" className="pa-more-t" data-rv="">Keep watching and reading</h2>
            <a className="bl-link" href={A.blogHref} data-rv=""><span>All posts</span><svg className="bl-arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" /></svg></a>
          </div>
        </div>
        <div className="bl-row bl-row--end pa-more" data-row="">
          {A.more.map((p, j) => <div key={p.key} className="bl-cell pa-more__cell"><MoreCard p={p} j={j} /></div>)}
          {Array.from({ length: (3 - (A.more.length % 3)) % 3 }, (_, k) => <div key={`e${k}`} className="bl-cell pa-more__cell pa-more__cell--empty" aria-hidden="true" />)}
        </div>
      </section>}
    </div>
  );
}
