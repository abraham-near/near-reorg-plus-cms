// Home v4 = home v3's design (same header, globe, rail, Stack, sections and footer, in v3's values: data-version="v3") with the October 2026 copy
// (near.org-airnauts doc): the hero's line, the intro as the statement, the rail, the Stack, a revenue row, the figures, Origin and six voices.
// Only the copy is v4's: World / Rail / Stack here are v1's markup with new text, and ProofDeeper takes V4_DEEPER.
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "../v3/header/Header";
import { ProofDeeper } from "../v3/proof-deeper/ProofDeeper";
import { V3Footer } from "../v3/footer/Footer";
import { WorldV4 } from "./World";
import { RailV4 } from "./Rail";
import { StackV4 } from "./Stack";
import { V4_DEEPER } from "./content";
import { RAIL_EXIT, RAIL_STEPS, REV_VARIANTS, VOICES_MODE, ORIGIN_RATIO, type RevKey } from "./revenue/variants";
import { RevSwitch } from "./revenue/RevSwitch";
import "../v3/buttons.css";
import "../v3/globe.css";

/** rev: which option of the revenue band (the hinge between the Stack and the figures) shows; /home-v4/[rev] */
export function V4Page({ rev = "a" }: { rev?: RevKey }) {
  const Lead = REV_VARIANTS[rev];
  return (
    <>
      <InlineScript html="document.documentElement.setAttribute('data-world-spin','')" />
      <V1Page v="v3" header={<V3Header home="/home-v4" />} world={<WorldV4 />} rail={<RailV4 exit={RAIL_EXIT[rev]} steps={RAIL_STEPS[rev]} />} stack={<StackV4 />}
        afterStack={<ProofDeeper content={{ ...V4_DEEPER, lead: <Lead key={rev} />, voicesMode: VOICES_MODE[rev], originRatio: ORIGIN_RATIO[rev] }} />} footer={<V3Footer />} />
      <RevSwitch on={rev} />
    </>
  );
}
