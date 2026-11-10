// Home v3 = home v1 (near-reorg r17 v1 "Carril vivo") with b10's header in our black (./header), b10's buttons (./buttons.css) and b10's globe size (./globe.css),
// both under html[data-version="v3"], b10's spin before the break: html[data-world-spin] (v1/world/transition.ts), b10's proof strip, Go deeper, Origin, voices and Close with our Get into NEAR on b10's grid (./proof-deeper), and b10's footer (./footer).
import { InlineScript } from "@/components/InlineScript";
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "./header/Header";
import { ProofDeeper } from "./proof-deeper/ProofDeeper";
import { V3Footer } from "./footer/Footer";
import "./buttons.css";
import "./globe.css";

export function V3Page() {
  return (
    <>
      <InlineScript html="document.documentElement.setAttribute('data-world-spin','')" />
      <V1Page v="v3" header={<V3Header home="/home-v3" />} afterStack={<ProofDeeper />} footer={<V3Footer />} />
    </>
  );
}
