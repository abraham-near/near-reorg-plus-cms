import type { Metadata } from "next";
import "@/components/v2/v2.css";
import { FixVersion } from "@/components/shared/version";
import { Header } from "@/components/shared/header/Header";
import { Footer } from "@/components/shared/footer/Footer";
import { ProofStrip } from "@/components/shared/proof/ProofStrip";
import { GoDeeper } from "@/components/shared/go-deeper/GoDeeper";
import { Origin } from "@/components/shared/origin/Origin";
import { Voices } from "@/components/shared/voices/Voices";
import { GetIntoNear } from "@/components/shared/get-into/GetIntoNear";
import { Close } from "@/components/shared/close/Close";
import { ChapterOne } from "@/components/v2/chapter-one/ChapterOne";
import { StoryRail } from "@/components/v2/story/StoryRail";
import { StackSection } from "@/components/v2/stack/StackSection";

export const metadata: Metadata = { title: "Home v2" };

// Home v2. Hero -> Stack: Lawrence's (near-org-site, direction-b @ a4d088b; components/v2): one of his five heroes at random, the rail in its Horizon
// look with the live Orbit stations, the Stack. The header, the sections after the Stack and the footer are the shared ones (components/shared),
// in v2's values (data-version="v2", styles/versions.css).
export default function HomeV2() {
  return (
    <>
      <FixVersion v="v2" />
      <Header home="/home-v2" />
      <main id="main">
        <ChapterOne hero="random" />
        <StoryRail look="horizon" art="orbit-live" />
        <StackSection />
        <ProofStrip />
        <GoDeeper />
        <Origin />
        <Voices />
        <GetIntoNear />
        <Close />
      </main>
      <Footer />
    </>
  );
}
