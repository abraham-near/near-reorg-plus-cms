// Home v1 = near-reorg r17 v1 "Carril vivo" (sites/r17/v1), whole: b8's header, the globe intro and hero, the statement, the living rail with the
// Figma isometrics, the Stack, the proof strip, Go deeper, Origin, the voices, Get into NEAR, Close and the CMS footer.
// Its sections are its own copies (components/v1/*): v2 can change without touching it. Links into and out of it are plain <a> (full page loads),
// so its global CSS and its boot never meet v2's.
import { InlineScript } from "@/components/InlineScript";
import { Header } from "./header/Header";
import { Footer } from "./footer/Footer";
import { World } from "./world/World";
import { Rail } from "./rail/Rail";
import { Stack } from "./stack/Stack";
import { ProofStrip } from "./proof/ProofStrip";
import { GoDeeper } from "./go-deeper/GoDeeper";
import { Origin } from "./origin/Origin";
import { Voices } from "./voices/Voices";
import { GetIntoNear } from "./get-into/GetIntoNear";
import { Close } from "./close/Close";
import { V1Boot } from "./V1Boot";
import { HEAD } from "./world/head";

export function V1Page() {
  return (
    <>
      <InlineScript html={HEAD} />
      <Header />
      <main id="main">
        <World />
        <Rail />
        <Stack />
        <ProofStrip />
        <GoDeeper />
        <Origin />
        <Voices />
        <GetIntoNear />
        <Close />
      </main>
      <Footer />
      <V1Boot />
    </>
  );
}
