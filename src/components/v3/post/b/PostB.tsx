"use client";
// Post B · Cover. A magazine feature: the photo fills the first screen with the title set over it, a thin green line at the top fills as you read.
// Then one centred column: the dek large, the takeaways in three, the text with a drop cap, big outlined section numbers, pictures that step out of the
// column (wide) or across the whole screen (bleed), the quote set large, the figures on an ink band, numbered footnotes. Ends on the author, the tags
// and Up next: the next post across the screen, two more under it.
// Motion: the cover settles as you leave it (scale + fade, scroll-linked), the title rises word by word, the blocks arrive (hooks.ts).
// Without a photo the cover is a plain dark panel (.pbv-cover--plain); without takeaways or more posts, their parts are left out.
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { useScrollMotion, type MotionCtx } from "@/lib/motion/scroll";
import { Arrow } from "../../blog/parts";
import type { Article } from "../article";
import { Avatar, Body, Footnotes, Share, Tags } from "../Body";
import { useReadProgress, useReveal } from "../hooks";
import "../post.css";
import "./post-b.css";

function mount(root: HTMLElement, ctx: MotionCtx) {
  const cover = root.querySelector<HTMLElement>(".pb-cover");
  const h = root.querySelector<HTMLElement>(".pbv-h1");
  let split: SplitText | null = null;
  if (ctx.reduced || !cover) return;
  ctx.gsap.registerPlugin(SplitText);
  if (h) {
    split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "pbv-w" });
    ctx.gsap.from(split.words, { yPercent: 115, duration: 1.3, ease: "expo.out", stagger: 0.05, delay: 0.2 });
  }
  ctx.gsap.from(root.querySelectorAll(".pbv-cover__meta > *, .pbv-cover__label"), { opacity: 0, y: 14, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.7 });
  const img = root.querySelector(".pbv-cover__img");
  if (img) ctx.gsap.from(img, { scale: 1.12, duration: 2.2, ease: "expo.out" });
  // leaving the cover: the photo sinks and dims, the words lift away
  ctx.gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "bottom top", scrub: true } })
    .to(root.querySelector(".pbv-cover__ph"), { yPercent: 18, scale: 1.06, ease: "none" }, 0)
    .to(root.querySelector(".pbv-cover__veil"), { opacity: 0.85, ease: "none" }, 0)
    .to(root.querySelector(".pbv-cover__in"), { yPercent: -30, opacity: 0, ease: "none" }, 0);
  return () => split?.revert();
}

export function PostB({ article: A }: { article: Article }) {
  const ref = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), bar = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  useReveal(ref);
  useReadProgress(art, bar);
  const [next, ...rest] = A.more;
  const label = [A.type, A.category].filter(Boolean).join(" · ");

  return (
    <div ref={ref} className="bl pst pst-b">
      <div ref={bar} className="pbv-bar" aria-hidden="true"><i /></div>
      <article aria-labelledby="pbv-t">
        <header className={`pb-cover pbv-cover${A.hero ? "" : " pbv-cover--plain"}`}>
          <div className="pbv-cover__ph">{A.hero && <img className="pbv-cover__img" src={A.hero.src} alt={A.hero.alt} />}</div>
          <div className="pbv-cover__veil" aria-hidden="true" />
          <div className="pbv-cover__in">
            {label && <p className="pbv-cover__label"><span className="pbv-dot" aria-hidden="true" />{label}</p>}
            <h1 id="pbv-t" className="pbv-h1">{A.title}</h1>
            <div className="pbv-cover__meta">
              <span className="pbv-by"><Avatar article={A} />{A.author.name}</span>
              <time dateTime={A.dateIso}>{A.date}</time>
              <span>{A.readMin} min read</span>
            </div>
          </div>
          {A.hero?.cap && <p className="pbv-cover__cap">{A.hero.cap}</p>}
          <span className="pbv-cue" aria-hidden="true"><i /></span>
        </header>

        {(A.dek || A.takeaways.length > 0) && (
          <div className="pbv-intro">
            {A.dek && <p className="pbv-dek" data-reveal="">{A.dek}</p>}
            {A.takeaways.length > 0 && (
              <ol className="pbv-keys" data-reveal="" aria-label="Key takeaways">
                {A.takeaways.map((t, i) => <li key={t}><span className="pbv-keys__n">{String(i + 1).padStart(2, "0")}</span>{t}</li>)}
              </ol>
            )}
          </div>
        )}

        <div ref={art} className="pbv-col">
          <Body article={A} notes="foot" />
          <Footnotes article={A} />
        </div>

        <footer className="pbv-foot">
          <div className="pbv-author" data-reveal="">
            <Avatar article={A} cls="pbv-author__av" />
            <p className="pbv-author__n">{A.author.name}</p>
            {A.author.bio && <p className="pbv-author__b">{A.author.bio}</p>}
          </div>
          <div className="pbv-foot__row" data-reveal="">
            <Tags article={A} />
            <Share title={A.title} />
          </div>
        </footer>
      </article>

      {next && (
        <section className="pbv-next" aria-labelledby="pbv-next-t">
          <a className="pbv-next__a" href={next.href}>
            <div className="pbv-next__ph">{next.img && <img src={next.img} alt="" loading="lazy" />}</div>
            <div className="pbv-next__in">
              <p className="pbv-next__l">Up next · {next.label}</p>
              <h2 id="pbv-next-t" className="pbv-next__t">{next.title}</h2>
              <span className="bl-btn bl-btn--paper pbv-next__go"><span>Read next</span><Arrow /></span>
            </div>
          </a>
        </section>
      )}
      {rest.length > 0 && <ul className="pbv-rest" aria-label="More posts">
        {rest.map((p) => (
          <li key={p.key}>
            <a className="pbv-rest__a" href={p.href}>
              <div className="pbv-rest__ph">{p.img && <img src={p.img} alt="" loading="lazy" />}</div>
              <p className="pbv-rest__l">{p.label}</p>
              <p className="pbv-rest__t">{p.title}</p>
            </a>
          </li>
        ))}
      </ul>}
    </div>
  );
}
