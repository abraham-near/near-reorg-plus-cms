"use client";

import { useCallback, useId, useRef, type HTMLAttributes } from "react";
import s from "../../../orbit.module.css";
import { circlePath, SQUARE, STAR } from "../geo";
import { Stage, type K } from "../index";
import { gimbalPose, gimbalVectors, type GimbalPose, type Spring } from "./gimbal.scene";

// The identity station, the gimbal (D80, D81): real-time 3D like the assets and intelligence stations, on the rail
// through `liveArt` and on /lab/identity. See gimbal.scene.ts for the instrument, its motion and its vectors.
export const name = "The gimbal";
export const note =
  "The green ball, the account, held at the exact centre of a precision gimbal: two thin chrome rings on fine machined pins, square to each other, inside a thin frosted glass frame with graduations cut into its face. As the station arrives the inner ring makes its one turn about the ball from a hairline ghost of where it was, and the dial on the rim reads it: the keys rotate, the account stays exactly as it was.";

const REST = gimbalVectors(gimbalPose(0, 0));
const load = () => import("./gimbal.gl").then((g) => g.gimbalView);

export function GimbalArt(props: HTMLAttributes<HTMLDivElement>) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reading = `gimbalRead${id}`;
  // the turn's spring, one per drawing (as the intelligence station's)
  const spring = useRef<Spring>({ y: 0, v: 0, t: -1 });
  const pose = useCallback((slide: number, t: number) => gimbalPose(slide, t, spring.current), []);
  return (
    <Stage<GimbalPose>
      which="identity" rest={REST} still="identity-gimbal" props={props} pose={pose} vectors={gimbalVectors} load={load}
      under={(k: K) => <path {...k("ecliptic", s.faint)} />}
      over={(k: K) => (
        <>
          <defs>
            {/* the turn, between the two pointers: strongest at both ends */}
            <linearGradient id={reading} gradientUnits="userSpaceOnUse" {...k("turnGrad", "")}>
              <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0.85" />
              <stop offset="0.5" stopColor="var(--color-ink)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path {...k("wide", s.faint)} />
          <path {...k("footArc", s.faint)} />
          <path {...k("footTicks", s.fine)} />
          <path {...k("dash0", s.dash)} />
          <path {...k("dash1", s.dash)} />
          <path {...k("dash2", s.dash)} />
          <path {...k("axisI", s.dash)} />
          <path {...k("ghost", s.ghost)} />
          <path {...k("dialArc", s.faint)} />
          <path {...k("dialTicks", s.fine)} />
          <path {...k("was", s.ghost)} />
          <path {...k("now", s.hair)} />
          <path {...k("turn", s.hair)} style={{ stroke: `url(#${reading})` }} />
          <g {...k("from", "")}><path className={s.inkFill} d={circlePath(1.3)} /></g>
          <g {...k("to", "")}><path className={s.inkFill} d={circlePath(1.3)} /></g>
          <g {...k("hub", "")}><path className={s.inkFill} d={circlePath(1.6)} /></g>
          <g {...k("endI", "")}><path className={s.marker} d={SQUARE} /></g>
          <path {...k("mt0", s.fine)} />
          <g {...k("mk0", "")}><path className={s.marker} d={circlePath(2.2)} /></g>
          <path {...k("mt1", s.fine)} />
          <g {...k("mk1", "")}><path className={s.hair} d={STAR} /></g>
        </>
      )}
      labels={null}
    />
  );
}

// the lab page (/lab/identity) shows the same drawing
export const Art = GimbalArt;
