// Home v6 (Lawrence001) = home v5 with Lawrence's ridges hero (D108): the scroll-scrubbed take j film and its tracked plexus-and-dust layer from home-v2's
// original, in place of v5's still forest photo, with v5's copy. Everything else is v5's: the page keeps html[data-home="v5"], so v5.css applies as it is,
// and the hero's own styles are scoped under .hero--v6 (./v6.css).
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "../v3/header/Header";
import { ProofDeeper } from "../v3/proof-deeper/ProofDeeper";
import { V3Footer } from "../v3/footer/Footer";
import { RailV4 } from "../v4/Rail";
import { StackV4 } from "../v4/Stack";
import { V4_DEEPER } from "../v4/content";
import { ORIGIN_RATIO } from "../v4/revenue/variants";
import { RevenueD } from "../v4/revenue/d/RevenueD";
import { WorldV6 } from "./World";
import { StackArtV6 } from "./stack/StackArtV6";
import { StackEnterV6 } from "./stack/StackEnterV6";
import type { TxKey } from "./tx";
import type { StKey } from "./intro";
import "../v3/buttons.css";
import "../v3/globe.css";
import "../v5/v5.css";
import "../v5/rail-v5.css";
import "../v5/statement-v5.css";
import "./v6.css";
import "./rail-v6.css";

const REV = "a" as const;   /* v5's revenue band and Origin; the voices are v6's own ("timer": on a clock, not the scroll; D135) */

/** tx: one of the hero-to-intro transition studies (D109), at /home-v6/<key>; st: one of the intro layout studies (D144), at /home-v6/intro/<key> */
export function V6Page({ tx, st }: { tx?: TxKey; st?: StKey } = {}) {
  return (
    <>
      {/* as v5: no globe, and v5's style scope */}
      <InlineScript html="document.documentElement.setAttribute('data-gl','off');document.documentElement.setAttribute('data-home','v5')" />
      <V1Page v="v3" header={<V3Header home="/home-v6" spread stay soft />} world={<WorldV6 tx={tx} st={st} />} rail={<RailV4 exit="wipe" steps="tiles" beats="split" back="ridges" near="out" square="early" type="even" words="lines" />} stack={<StackV4 still steps stick enter="tide" art={<><StackArtV6 /><StackEnterV6 /></>} />}
        afterStack={<ProofDeeper content={{ ...V4_DEEPER, lead: <RevenueD flat />, voicesMode: "timer", originRatio: ORIGIN_RATIO[REV], scope: "v6" }} />} footer={<V3Footer />} />
    </>
  );
}
