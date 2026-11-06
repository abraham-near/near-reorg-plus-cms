"use client";

import { useCallback, useId, useRef, type HTMLAttributes } from "react";
import s from "../../../orbit.module.css";
import l from "./layer.module.css";
import { circlePath, SQUARE, STAR } from "../geo";
import { Stage, type K } from "../index";
import { LAYER, layerPose, layerVectors, type LayerPose, type Spring } from "./layer.scene";

// The layer moments (D86, design B "Glass tokens"): the rail's problem and answer in real-time 3D, in the stations'
// studio. See layer.scene.ts for the scene, the change and the vectors.
//
// The change is driven from outside: the element carries `--own` (0 the problem, 1 the answer), which the rail's
// scrubbed timeline sets (StoryRailMotion); every frame reads it and chases it with a spring. Without it (the static
// reading, reduced motion, other pages) the drawing is the answer, and its still is the answer at rest. On the rail
// (`from="problem"`) it starts as the problem instead: that still and those vectors show until the first live frame, so
// the answer never flashes up and resets as the layer slides in (D56).
export const name = "Glass tokens";
export const note =
  "Your data as six clear glass tokens round a frosted core on a brushed aluminium plate, with transactions running between them; as the layer becomes the user's, the tokens draw in, the core grows over them, turns NEAR green and takes three people inlaid in polished metal, and the data inside is blurred out of sight.";

const REST = { answer: layerVectors(layerPose(0, 0, 1)), problem: layerVectors(layerPose(0, 0, 0)) };
const STILL = { answer: "layer", problem: "layer-problem" };
const load = () => import("./layer.gl").then((g) => g.layerView);
const ARROW = "M0 0l-3.8-1.45v2.9z";
const TINY = "M-1.15 -1.15h2.3v2.3h-2.3z";

export function LayerArt({ from = "answer", className = "", style, ...props }: { from?: "problem" | "answer" } & HTMLAttributes<HTMLDivElement>) {
  const start = from === "problem" ? 0 : 1;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const springs = useRef<{ turn: Spring; own: Spring }>({ turn: { y: 0, v: 0, t: -1 }, own: { y: start, v: 0, t: -1 } });
  const pose = useCallback((slide: number, t: number) => {
    const v = wrap.current?.style.getPropertyValue("--own");
    const own = v ? parseFloat(v) : start;
    return layerPose(slide, t, Number.isFinite(own) ? own : start, springs.current);
  }, [start]);
  const lanes = LAYER.token.at.flatMap((_, i) => [`${i}0`, `${i}1`]);
  return (
    <div ref={wrap} className={className} style={style} {...props}>
      <Stage<LayerPose>
        which="layer" rest={REST[from]} still={STILL[from]} props={from === "problem" ? { className: l.instant } : {}} pose={pose} vectors={layerVectors} load={load}
        under={(k: K) => <path {...k("eclip", s.faint)} />}
        over={(k: K) => (
          <>
            <defs>
              {/* each transaction line joins the core and a token: strongest at both ends */}
              {lanes.map((key) => (
                <linearGradient key={key} id={`lay${id}${key}`} gradientUnits="userSpaceOnUse" {...k(`lg${key}`, "")}>
                  <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0.9" />
                  <stop offset="0.5" stopColor="var(--color-ink)" stopOpacity="0.22" />
                  <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0.9" />
                </linearGradient>
              ))}
            </defs>
            <path {...k("dialArc", s.faint)} />
            <path {...k("dialTicks", s.fine)} />
            <path {...k("rimTicks", s.fine)} />
            {[0, 1, 2, 3].map((i) => <g key={i} {...k(`cross${i}`, "")}><path className={s.hair} d={STAR} /></g>)}
            <path {...k("track", s.dots)} />
            <g {...k("tm0", "")}><path className={s.marker} d={circlePath(2.2)} /></g>
            <g {...k("tm1", "")}><path className={s.marker} d={SQUARE} /></g>
            {lanes.map((key) => (
              <g key={key}>
                <path {...k(`ln${key}`, s.hair)} style={{ stroke: `url(#lay${id}${key})` }} />
                <g {...k(`ah${key}`, "")}><path className={s.inkFill} d={ARROW} /></g>
                <g {...k(`lm${key}`, "")}>
                  {(Number(key[0]) + Number(key[1])) % 2 ? <path className={s.inkFill} d={TINY} /> : <path className={s.inkFill} d={circlePath(1.25)} />}
                </g>
              </g>
            ))}
            {[0, 1, 2, 3].map((i) => <path key={i} {...k(`il${i}`, s.faint)} />)}
            {[0, 1].map((i) => <g key={i} {...k(`im${i}`, "")}><path className={s.inkFill} d={circlePath(0.8)} /></g>)}
          </>
        )}
        labels={null}
      />
    </div>
  );
}
