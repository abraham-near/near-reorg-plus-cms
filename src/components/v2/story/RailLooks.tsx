import type { CSSProperties } from "react";
import styles from "./RailLooks.module.css";

// The rail's cinematic looks (D32), all on the same story and timeline (StoryRail; their moves are in lookMotion.ts).
// Each look adds:
// - Back: layers fixed to the stage behind the track, each moved at its own share of the track's travel (data-depth),
//   faded out at the screen's edges so the world seems to slide in from beyond the frame.
// - Detail: hairline graphics on the track itself (they travel 1:1 with the line).
// - Over: marks fixed to the stage (a playhead, viewfinder corners).
// Everything is decorative (the stage is aria-hidden), moves only with the reader's scroll, and is transform/opacity.
// Horizon (after Park Stuttgart and Arc'teryx): the hero's ridges return as a faint panorama sitting on the line, so the
//   line becomes their horizon; a surveyor's layer of hairlines, nodes and ticks rides the track; corners lock on.
// Window (after Arc'teryx's framed reveal and Snow Fall; lab only): a framed window onto the ridges, greyed and darkened
//   while someone else runs the layer; once the answer has formed, the frame opens out to the whole sky above the line.
// Drafting (after Monad, Fractalized, Oryzo and Tempo): no photograph; depth from line work: a dot grid, hairlines
//   converging into NEAR's point, a selection frame that locks onto the layer drawing (D38), orbit rings around the station being read.
export type RailLook = "plain" | "horizon" | "window" | "drafting";

const x = (vw: number) => ({ "--x": `${vw}vw` }) as CSSProperties;
const CORNERS = ["tl", "tr", "bl", "br"] as const;

export function RailBack({ look }: { look: RailLook }) {
  if (look === "horizon") {
    return (
      <div className={styles.back}>
        <div className={styles.horizon} data-depth="0.3"><div className={styles.horizonPlate} data-s="plate" /></div>
        <div className={styles.mistLayer} data-depth="0.6">
          <span className={styles.mist} style={x(10)} />
          <span className={styles.mist} style={x(150)} />
          <span className={styles.mist} style={x(290)} />
        </div>
      </div>
    );
  }
  if (look === "window") {
    // The frame is the sky band above the line, scaled down to the window and back out (its plate counter-scaled, so the
    // picture never stretches); the grey view is a second plate faded over the clear one
    return (
      <div className={styles.back}>
        <div className={styles.windowFrame} data-s="window">
          <div className={styles.windowInner} data-s="windowInner">
            <div className={styles.plate} />
            <div className={`${styles.plate} ${styles.plateDark}`} data-s="windowDark" />
          </div>
        </div>
        {CORNERS.map((c) => <span key={c} className={`${styles.corner} ${styles.wc} ${styles[c]}`} data-s="wcorner" data-c={c} />)}
      </div>
    );
  }
  if (look === "drafting") {
    return (
      <div className={styles.back}>
        <div className={styles.dots} data-depth="0.25" />
      </div>
    );
  }
  return null;
}

export function RailDetail({ look, gate, stations }: { look: RailLook; gate: number; stations: number[] }) {
  if (look === "horizon") {
    // Survey hairlines every 25vw with a node on the line, kept clear of NEAR's tile, the layer drawing and the stations
    const busy = [50, gate, ...stations];
    const survey = Array.from({ length: 19 }, (_, i) => i * 25 + 12.5).filter((v) => busy.every((b) => Math.abs(v - b) > 16));
    return (
      <>
        <span className={styles.ticks} data-s="ticks" />
        {/* The same scale in the light, under the line once the Stack's dark hangs from it (the hand-over) */}
        <span className={`${styles.ticks} ${styles.ticksDark}`} data-s="ticksDark" />
        {survey.map((v) => <span key={v} className={styles.survey} style={x(v)}><span className={styles.node} /></span>)}
      </>
    );
  }
  if (look === "drafting") {
    // Beat 1: a few hairlines fan in from both edges to NEAR's point, below the heading (drawn in by the timeline)
    const fan = [-16, -8, 0, 8, 16];
    return (
      <>
        <svg className={styles.fan} viewBox="0 0 100 100" preserveAspectRatio="none" data-s="fan">
          {fan.map((o) => <path key={`l${o}`} d={`M0 ${64 + o} C 22 ${64 + o} 36 64 50 64`} pathLength={1} />)}
          {fan.map((o) => <path key={`r${o}`} d={`M100 ${64 + o} C 78 ${64 + o} 64 64 50 64`} pathLength={1} />)}
        </svg>
        {/* Faint orbit rings (Tempo) around the point, then around each station while it is read */}
        {[50, ...stations].map((v) => (
          <span key={v} className={styles.orbits} style={x(v)} data-s="orbits">
            <span /><span /><span />
          </span>
        ))}
        {/* The selection frame that locks onto the layer drawing while the problem is read (Oryzo) */}
        <span className={styles.select} style={x(gate)} data-s="select">
          <span className={styles.ruler} />
          {CORNERS.map((c) => <span key={c} className={`${styles.cross} ${styles[c]}`} />)}
        </span>
      </>
    );
  }
  return null;
}

export function RailOver({ look }: { look: RailLook }) {
  if (look === "horizon") {
    return (
      <>
        {/* The box's lower half turns light where the Stack's dark comes under the line (the hand-over) */}
        <span className={styles.playhead} data-s="playhead"><span className={styles.playheadDark} data-s="playheadDark" /></span>
        <span className={styles.finder} data-s="finder">
          {CORNERS.map((c) => <span key={c} className={`${styles.corner} ${styles[c]}`} />)}
        </span>
      </>
    );
  }
  return null;
}
