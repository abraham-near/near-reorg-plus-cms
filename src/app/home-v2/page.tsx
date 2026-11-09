import type { Metadata } from "next";
import { Header } from "@/components/site/header/Header";
import { Footer } from "@/components/site/footer/Footer";
import { ChapterOne } from "@/components/home/chapter-one/ChapterOne";
import { StoryRail } from "@/components/home/story/StoryRail";
import { StackSection } from "@/components/home/stack/StackSection";
import { ProofStrip } from "@/components/home/proof/ProofStrip";
import { GoDeeper } from "@/components/home/go-deeper/GoDeeper";
import { Origin } from "@/components/home/origin/Origin";
import { Voices } from "@/components/home/voices/Voices";
import { GetIntoNear } from "@/components/home/get-into/GetIntoNear";
import { Close } from "@/components/home/close/Close";

export const metadata: Metadata = { title: "Home v2" };

// Home v2. Hero -> Stack: Lawrence's (near-org-site, direction-b @ a4d088b): one of his five heroes at random, the rail in its Horizon look with the
// live Orbit stations, the Stack. After the Stack: Abraham's (near-reorg r17 v1): the proof strip, Go deeper, Origin, the voices, Get into NEAR, Close.
export default function HomeV2() {
  return (
    <>
      <Header />
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
