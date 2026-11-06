import Image from "next/image";
import { OwnArt } from "../chapter-one/OwnArt";
import { OrbitArt } from "./orbit/OrbitArt";
import { liveArt, motionArt } from "./orbit/motion";
import { OwnReplay } from "../chapter-one/OwnReplay";
import { ANSWER, CONNECT, MEET, OWN, PROBLEM } from "./copy";
import { LayerArt } from "./orbit/motion/o3/layer/layer";
import { StoryStatic } from "./StoryStatic";
import { StoryRailMotion } from "./StoryRailMotion";
import { RailBack, RailDetail, RailOver, type RailLook } from "./RailLooks";
import base from "./Story.module.css";
import styles from "./StoryRail.module.css";

// Story option C, "The rail" (D29, reworked in D38): one horizontal line carries the story sideways while the reader
// scrolls down. It draws from AI on one side and blockchain on the other into a green NEAR tile under the three lines
// ("where they connect"). The three lines leave and the world slides to the layer beneath your agents, drawn on the line
// (LayerArt, real-time 3D, D86) while the problem is read; the problem gives way to the answer in the same place, the
// layer becomes the user's, and the line runs on green to four stations, one for each thing you own: the drawing above the line, the words
// below; only the station being read shows (its neighbours are dots on the line). The answer stays at the top
// throughout. Positions on the track are in vw (StoryRail.module.css: --x on each element). `look` adds a cinematic
// layer (D32, RailLooks.tsx). At the end the line hands over to the Stack: it lifts off as the nearest layer, the
// Stack's dark hanging under it, and rises over the world behind (StoryRailMotion).
const words = (s: string) => s.split(" ").map((w, i) => <span key={i} className={styles.pw}>{w} </span>);

export const RAIL = { gate: 150, stations: [235, 290, 345, 400], end: 470 };
// The hand-over to the Stack (StoryRailMotion): the extra scroll, in vh, added to the 620vh the story itself runs on. The
// line rises from 64% of the screen to its top: the first 12vh of scroll ease it up to the page's speed (covering 6vh of
// the rise), the other 58vh carry it the rest of the way at that speed (64 + 6). Stack.module.css overlaps the Stack's
// band with the track's end (keep the two together).
export const HANDOVER = 70;

// `art` picks the "Own your" drawings: today's line drawings (D18) or Orbit's rendered chrome and glass (D56), which
// take a larger 420 × 315 slot
// D72: "orbit-1|2|3", Orbit with one of the motion options on the data and assets stations
// "orbit-live": the picks (D73), option 1's data and option 3's assets
export type RailArt = "line" | "orbit" | "orbit-live" | "orbit-1" | "orbit-2" | "orbit-3";

// The drawing component for each `art`
export function artOf(art: RailArt) {
  return art === "line" ? OwnArt : art === "orbit" ? OrbitArt : art === "orbit-live" ? liveArt() : motionArt(Number(art.slice(-1)) as 1 | 2 | 3);
}

export function StoryRail({ look = "plain", art = "line" }: { look?: RailLook; art?: RailArt }) {
  const Own = artOf(art);
  return (
    <section className={base.story} aria-labelledby="story-title" data-story="rail">
      <StoryStatic titleId="story-title" art={art} />
      <div className={base.track} style={{ "--story-h": `${620 + HANDOVER}vh` } as React.CSSProperties} aria-hidden="true">
        <div className={`${base.stage} ${styles.stage}`} data-s="stage" data-look={look} data-art-kind={art}>
          <RailBack look={look} />
          <div className={styles.world} style={{ "--end": `${RAIL.end}vw` } as React.CSSProperties} data-s="world">
            <RailDetail look={look} gate={RAIL.gate} stations={RAIL.stations} />
            <span className={styles.rail} data-s="rail" />
            <span className={`${styles.green} ${styles.greenL}`} data-s="greenL" />
            <span className={`${styles.green} ${styles.greenR}`} data-s="greenR" />
            <span className={styles.end} style={{ "--x": "5vw" } as React.CSSProperties} data-s="end">AI <em>the frontend</em></span>
            <span className={`${styles.end} ${styles.endR}`} style={{ "--x": "95vw" } as React.CSSProperties} data-s="end">Blockchain <em>the backend</em></span>
            {/* Where the two sides meet: NEAR's tile on the line (the official black N on green) */}
            <span className={styles.hub} style={{ "--x": "50vw" } as React.CSSProperties} data-s="hub">
              <Image src="/brand/icon.svg" alt="" width={639} height={639} className={styles.hubMark} unoptimized />
            </span>

            {/* D95: at the layer, NEAR's tile again, landing on the line (in the playhead's box) as the disc turns green */}
            <span className={styles.hub} style={{ "--x": `${RAIL.gate}vw` } as React.CSSProperties} data-s="gateTile">
              <Image src="/brand/icon.svg" alt="" width={639} height={639} className={styles.hubMark} unoptimized />
            </span>

            {/* The layer beneath your agents, on the line: someone else's while the problem is read, the user's with the
                answer (D86: real-time 3D, the rail's timeline drives its change through --own) */}
            <div className={`${styles.artSlot} ${styles.gateSlot}`} style={{ "--x": `${RAIL.gate}vw` } as React.CSSProperties} data-own-stage data-large>
              <LayerArt from="problem" className={styles.art} data-s="near" />
            </div>

            {/* The hand-over (StoryRailMotion): the Stack's dark, hung from the line under the last station; it drops to
                the foot of the screen and rises with the line over everything behind it */}
            <span className={styles.curtain} style={{ "--x": `${RAIL.stations[RAIL.stations.length - 1]}vw` } as React.CSSProperties} data-s="curtain" />

            {OWN.map((o, i) => (
              <div key={o.key} className={styles.station} style={{ "--x": `${RAIL.stations[i]}vw` } as React.CSSProperties} data-s="station">
                <div className={styles.artSlot} data-own-stage data-large={art !== "line" || undefined}>
                  <Own which={o.key} className={styles.art} />
                </div>
                <span className={styles.dot} data-s="dot">
                  <Image src="/brand/icon.svg" alt="" width={639} height={639} className={styles.dotMark} unoptimized />
                </span>
                <p className={styles.title} data-s="words">Own your <span className="accent">{o.word}</span></p>
                <p className={`t-lede ${styles.line}`} data-s="words">{o.line}</p>
              </div>
            ))}
          </div>

          {/* Fixed on the stage: the three lines; then the problem, and the answer in its place, which stays */}
          <div className={styles.connect}>
            {/* D96: each line rises into place as the section scrolls in (the inner span; the line itself leaves later) */}
            {CONNECT.map((s, i) => <p key={s} className={styles.cline} data-s={`c${i}`}><span className={styles.clineIn} data-s="cin">{s}</span></p>)}
            <p className={styles.cline} data-s="c2"><span className={styles.clineIn} data-s="cin">{MEET.near}{MEET.rest}</span></p>
          </div>
          <p className={styles.problem} data-s="problem">{words(PROBLEM)}</p>
          <p className={styles.answer} data-s="answer">
            {words(`${ANSWER.pre}${ANSWER.near}${ANSWER.mid}`.trimEnd())}<span className={`${styles.pw} ${styles.owned}`}>{ANSWER.owned}</span>
          </p>
          <RailOver look={look} />
        </div>
      </div>
      <StoryRailMotion gate={RAIL.gate} stations={RAIL.stations} end={RAIL.end} handover={HANDOVER} look={look} />
      <OwnReplay />
    </section>
  );
}
