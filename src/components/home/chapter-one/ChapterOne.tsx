import type { ReactNode } from "react";
import Image from "next/image";
import { SplitText } from "./SplitText";
import { ChapterOneMotion } from "./ChapterOneMotion";
import { HeroInView } from "./HeroInView";
import { HeroVideo, HERO_VIDEO } from "./HeroVideo";
import { RandomPoster, HERO_POSTERS, HERO_FOCAL_CSS, HERO_THREADS } from "./heroes/RandomPoster";
import { focalStyle, threadAttr, type HeroFocal, type HeroThread } from "./heroes/framing";
import { RandomHero } from "./heroes/RandomHero";
import { GoArrow } from "@/components/GoArrow";
import styles from "./ChapterOne.module.css";

// Section 1 (spec/pages/home.md §1): "Own your world", the claim and the anthem. The story that follows (the mission line
// and "Own your") is its own section since D29 (components/home/story).
// Desktop with motion: a pinned stage under scrolling beats (GSAP, D8); the hero is a scroll-scrubbed camera move down
// the ridges (D29). Otherwise: plain stacked beats with a static green rule. All copy is server-rendered.
// `hero` is one hero version (D90: heroes/), or a lab route's camera move (its poster must be that video's first frame)
// and a graphic layer over it. "random" (the homepage) shows one of the versions at random on each load (RandomPoster,
// RandomHero). A poster with no video is a still (a version still in the making); no poster at all is the crane default.
// `fps` is the clip's frame rate (24 by default); any length works. `focal` and `thread` frame the photo band and place
// the green line for a version (heroes/framing.ts).
export type HeroOptions = { poster?: string; video?: string; fps?: number; layer?: ReactNode; focal?: HeroFocal; thread?: HeroThread };

export function ChapterOne({ hero = {} }: { hero?: HeroOptions | "random" }) {
  const random = hero === "random", fixed = random ? {} : hero;
  const { poster = "/images/home/home-hero-ridges-v2.webp", video = fixed.poster ? undefined : HERO_VIDEO, fps, layer, focal, thread } = fixed;
  return (
    <section className={styles.chapter} data-ch="root" aria-label="Own your world">
      {/* Each version's crop of the photo band, applied once the poster's script has picked one (before first paint) */}
      {random && HERO_FOCAL_CSS && <style dangerouslySetInnerHTML={{ __html: HERO_FOCAL_CSS }} />}
      {/* The stage: decorative (every word lives in the beats). Pinned on desktop; a photo band on phones. */}
      <div className={styles.stage} data-ch="stage" aria-hidden="true" style={random ? undefined : focalStyle(focal)}>
        <div className={styles.photo} data-ch="photo">
          <div className={styles.media} data-ch="media">
            {/* The video's first frame, so the swap to the video is invisible; first paint and LCP */}
            {random ? <RandomPoster className={styles.photoImg} />
              : <Image src={poster} alt="" fill sizes="100vw" quality={75} preload fetchPriority="high" className={styles.photoImg} />}
            {/* Desktop with motion only: HeroVideo gives it a source and scrubs it with the scroll (never plays on its own) */}
            <video className={styles.video} data-ch="video" muted playsInline preload="none" tabIndex={-1} />
            {random ? <RandomHero posters={HERO_POSTERS} /> : <><HeroVideo src={video} fps={fps} />{layer}</>}
          </div>
          {/* The close-in: two surface curtains scale in from the edges until only the line is left (transform only). */}
          <span className={`${styles.curtain} ${styles.curtainL}`} data-ch="curtain-l" />
          <span className={`${styles.curtain} ${styles.curtainR}`} data-ch="curtain-r" />
        </div>
        <svg className={styles.lines} data-ch="lines" data-thread={random ? HERO_THREADS : threadAttr({ "*": thread })} />
      </div>

      <div className={styles.beats} data-ch="beats">
        <div className={`${styles.beat} ${styles.beatClaim}`} data-beat="claim">
          <div className={styles.copy} data-ch="copy">
            <h1 className="t-display">
              Own your <span className="accent">world.</span>
            </h1>
            <p className={`t-lede ${styles.lede}`}>AI is starting to act for you. NEAR keeps your money, your data and your AI in your&nbsp;hands.</p>
            <a className={`btn btn-primary ${styles.cta}`} href="https://near.com">Get started<GoArrow /></a>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatAnthem}`} data-beat="anthem">
          <div className={styles.anthem}>
            {/* D29: larger, and the N in its black tile hangs two lines deep to the left of "NEAR" */}
            <h2 className={styles.statement} data-wipe>
              <Image src="/brand/icon_tile.svg" alt="" width={160} height={160} className={styles.anthemMark} data-ch="mark" unoptimized />
              <SplitText
                wordClass={styles.wd}
                charClass={styles.ch}
                breakClass={styles.lb}
                indentClass={styles.ind}
                parts={[
                  // Desktop line breaks ("\n"): Abraham's five staggered lines (r17), the green phrase closing the last one
                  { text: "NEAR is open infrastructure powering\nthe agent economy. Confidential by\ndesign and secured for the quantum era,\nit lets you trade anything, anywhere,\nand " },
                  { text: "own your intelligence.", className: styles.hl },
                ]}
              />
            </h2>
          </div>
        </div>
      </div>

      <ChapterOneMotion />
      <HeroInView />
    </section>
  );
}
