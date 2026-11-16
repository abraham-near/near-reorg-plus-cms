// Home v7 (Lawrence001, D153) = home v6 as committed in 5316b50, copied whole so the next changes land here and /home-v6 stays as it was. Its class
// names and attributes are v6's renamed (stk7, s7-, hero--v7, data-scope v7); the comments below still tell v6's history, which this carries.
// Home v6 (Lawrence001) = home v5 with Lawrence's ridges hero (D108): the scroll-scrubbed take j film and its tracked plexus-and-dust layer from home-v2's
// original, in place of v5's still forest photo, with v5's copy. Everything else is v5's: the page keeps html[data-home="v5"], so v5.css applies as it is,
// and the hero's own styles are scoped under .hero--v7 (./v7.css).
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "../v3/header/Header";
import { ProofDeeper } from "../v3/proof-deeper/ProofDeeper";
import { V3Footer } from "../v3/footer/Footer";
import { RailV4 } from "../v4/Rail";
import { StackV4 } from "../v4/Stack";
import { V4_DEEPER } from "../v4/content";
import { RevenueD } from "../v4/revenue/d/RevenueD";
import { WorldV7, type HeroAlt } from "./World";
import { StackArtV7 } from "./stack/StackArtV7";
import { StackEnterV7 } from "./stack/StackEnterV7";
import type { TxKey } from "./tx";
import type { StKey } from "./intro";
import "../v3/buttons.css";
import "../v3/globe.css";
import "../v5/v5.css";
import "../v5/rail-v5.css";
import "../v5/statement-v5.css";
import "./v7.css";
import "./rail-v7.css";

const ORIGIN_RATIO = "4/3" as const;   /* v5's Origin photo (revenue option A's shape, ../v4/revenue/variants.tsx); the voices are v6's own ("timer": on a clock, not the scroll; D135) */

/** hero: another hero in place of the ridges (the hero options sheet, D155); tx: one of the hero-to-intro transition studies (D109), at /home-v6/<key>; st: one of the intro layout studies (D144), at /home-v6/intro/<key> */
export function V7Page({ tx, st, hero }: { tx?: TxKey; st?: StKey; hero?: HeroAlt } = {}) {
  return (
    <>
      {/* as v5: no globe, and v5's style scope */}
      <InlineScript html="document.documentElement.setAttribute('data-gl','off');document.documentElement.setAttribute('data-home','v5')" />
      <V1Page v="v3" header={<V3Header home="/" spread stay soft />} world={<WorldV7 tx={tx} st={st} hero={hero} />} rail={<RailV4 exit="wipe" steps="tiles" beats="split" back="ridges" near="out" square="early" type="even" words="lines" />} stack={<StackV4 still steps stick enter="tide" art={<><StackArtV7 look="matte" /><StackEnterV7 /></>} />}
        afterStack={<ProofDeeper content={{ ...V4_DEEPER, lead: <RevenueD flat />, voicesMode: "timer", originRatio: ORIGIN_RATIO, scope: "v7" }} />} footer={<V3Footer />} />
    </>
  );
}
