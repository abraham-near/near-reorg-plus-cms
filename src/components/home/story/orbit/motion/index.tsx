import type { HTMLAttributes } from "react";
import type { OwnKey } from "../../../chapter-one/OwnArt";
import { OrbitArt } from "../OrbitArt";
import * as o1 from "./o1";
import * as o2 from "./o2";
import * as o3 from "./o3";
import { GimbalArt } from "./o3/identity/gimbal";

// The motion options for Orbit's data and assets stations (D72): the frosted disc that turns flat to camera as it
// reaches the centre with the green ball looping behind it, and the two equal balls orbiting their angled ring in a
// seamless loop. Each option exports `DataArt`, `AssetsArt`, `name` and `note`; the other two stations stay Orbit's.
// 1 live glass (rendered stills animated in the browser), 2 rendered film (Higgsfield video), 3 real-time 3D (WebGL).
export const MOTION = { 1: o1, 2: o2, 3: o3 } as const;
export type MotionKey = keyof typeof MOTION;

// Lawrence's picks (D73, D78, D81): the data station from option 1 (live glass), the assets and intelligence stations
// from option 3 (real-time 3D), and identity the gimbal (real-time 3D, D81)
export function liveArt() {
  return function LiveArt({ which, ...rest }: { which: OwnKey } & HTMLAttributes<HTMLDivElement>) {
    if (which === "data") return <o1.DataArt {...rest} />;
    if (which === "assets") return <o3.AssetsArt {...rest} />;
    if (which === "intelligence") return <o3.IntelligenceArt {...rest} />;
    if (which === "identity") return <GimbalArt {...rest} />;
    return <OrbitArt which={which} {...rest} />;
  };
}

export function motionArt(n: MotionKey) {
  const o = MOTION[n];
  return function MotionArt({ which, ...rest }: { which: OwnKey } & HTMLAttributes<HTMLDivElement>) {
    if (which === "data") return <o.DataArt {...rest} />;
    if (which === "assets") return <o.AssetsArt {...rest} />;
    return <OrbitArt which={which} {...rest} />;
  };
}
