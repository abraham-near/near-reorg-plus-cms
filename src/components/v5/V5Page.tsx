// Home v5 = home v4 with: the header spread at the top (home v1's effect on v4's pill), no globe (the hero on a forest photo), the intro as one left-aligned
// paragraph, the isometrics without their viewfinder corners, the rail's line / art / station copy lower with more air, and the rail's thesis at the intro's size.
// The Stack's drawing stands still (no build-in, no live loop). The rail hands over to the Stack with option D's exit (the ruler: its ticks grow down and merge into the dark). Everything else is v4's (rail, Stack,
// sections, voices and Origin as option A, footer). The revenue band is option D (its scroll story carries the transition from the Stack) with its chart flat (2D). v5's own styles: ./v5.css, scoped under html[data-home="v5"].
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "../v3/header/Header";
import { ProofDeeper } from "../v3/proof-deeper/ProofDeeper";
import { V3Footer } from "../v3/footer/Footer";
import { RailV4 } from "../v4/Rail";
import { StackV4 } from "../v4/Stack";
import { V4_DEEPER } from "../v4/content";
import { RAIL_EXIT, VOICES_MODE, ORIGIN_RATIO } from "../v4/revenue/variants";
import { RevenueD } from "../v4/revenue/d/RevenueD";
import { WorldV5 } from "./World";
import "../v3/buttons.css";
import "../v3/globe.css";
import "./v5.css";
import "./rail-v5.css";   /* the rail's ridges and the split beats (beats="split" back="ridges" below; layer.ts reads them) */

const REV = "a" as const;

export function V5Page() {
  return (
    <>
      {/* before V1Page's head script: no globe (it reads data-gl="off" as ?gl=0) and v5's style scope */}
      <InlineScript html="document.documentElement.setAttribute('data-gl','off');document.documentElement.setAttribute('data-home','v5')" />
      <V1Page v="v3" header={<V3Header home="/home-v5" spread stay soft />} world={<WorldV5 />} rail={<RailV4 exit={RAIL_EXIT.d} steps="tiles" beats="split" back="ridges" />} stack={<StackV4 still />}
        afterStack={<ProofDeeper content={{ ...V4_DEEPER, lead: <RevenueD flat />, voicesMode: VOICES_MODE[REV], originRatio: ORIGIN_RATIO[REV] }} />} footer={<V3Footer />} />
    </>
  );
}
