// Home v1 = near-reorg r17 v1 "Carril vivo" (sites/r17/v1): b8's header, the globe intro and hero, the statement, the living rail with the
// Figma isometrics, the Stack, the proof strip, Go deeper, Origin, the voices, Get into NEAR, Close and the CMS footer.
// Its own pieces (world/, rail/, stack/) live here; the header, the sections after the Stack and the footer are the shared ones (components/shared),
// in v1's values (data-version="v1", styles/versions.css). They wait for the world, the rail and the Stack (V1Gate).
import type { ReactNode } from "react";
import { InlineScript } from "@/components/InlineScript";
import { FixVersion, type Version } from "@/components/shared/version";
import { Header } from "@/components/shared/header/Header";
import { Footer } from "@/components/shared/footer/Footer";
import { ProofStrip } from "@/components/shared/proof/ProofStrip";
import { GoDeeper } from "@/components/shared/go-deeper/GoDeeper";
import { Origin } from "@/components/shared/origin/Origin";
import { Voices } from "@/components/shared/voices/Voices";
import { GetIntoNear } from "@/components/shared/get-into/GetIntoNear";
import { Close } from "@/components/shared/close/Close";
import { World } from "./world/World";
import { Rail } from "./rail/Rail";
import { Stack } from "./stack/Stack";
import { V1Boot } from "./V1Boot";
import { V1Gate } from "./V1Gate";
import { HEAD } from "./world/head";

/** v, header, afterStack and footer: v3 is this page in its own values (data-version="v3") with its own header and its own proof strip, Go deeper, Origin, voices, Get into NEAR and Close, and its own footer (components/v3).
 *  world, rail and stack: the same pieces with other copy (v4: components/v4), same classes, so boot / rail / stack motion run on them unchanged. */
export function V1Page({ v = "v1", header, afterStack, footer, world, rail, stack }: {
  v?: Version; header?: ReactNode; afterStack?: ReactNode; footer?: ReactNode; world?: ReactNode; rail?: ReactNode; stack?: ReactNode;
}) {
  return (
    <>
      <FixVersion v={v} />
      <InlineScript html={HEAD} />
      {header ?? <Header home="/home-v1" />}
      <V1Gate>
        <main id="main">
          {world ?? <World />}
          {rail ?? <Rail />}
          {stack ?? <Stack />}
          {afterStack ?? (
            <>
              <ProofStrip />
              <GoDeeper />
              <Origin />
              <Voices />
              <GetIntoNear />
              <Close />
            </>
          )}
        </main>
        {footer ?? <Footer />}
      </V1Gate>
      <V1Boot />
    </>
  );
}
