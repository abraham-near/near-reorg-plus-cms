import type { Metadata } from "next";
import { Header } from "@/components/shared/header/Header";
import { Footer } from "@/components/shared/footer/Footer";
import { VersionSwitch } from "@/components/shared/VersionSwitch";
import { ProofStrip } from "@/components/shared/proof/ProofStrip";
import { GoDeeper } from "@/components/shared/go-deeper/GoDeeper";
import { Origin } from "@/components/shared/origin/Origin";
import { Voices } from "@/components/shared/voices/Voices";
import { GetIntoNear } from "@/components/shared/get-into/GetIntoNear";
import { Close } from "@/components/shared/close/Close";

export const metadata: Metadata = { title: "Page template" };

// The starting point for new pages: only shared pieces (components/shared), so the page renders in either direction. ?v=1 / ?v=2 or the switch
// (bottom left) picks it; styles/versions.css holds what changes. Copy this route, keep the header, the footer and the switch, swap the sections.
export default function Template() {
  return (
    <>
      <Header />
      <main id="main">
        <ProofStrip />
        <GoDeeper />
        <Origin />
        <Voices />
        <GetIntoNear />
        <Close />
      </main>
      <Footer />
      <VersionSwitch />
    </>
  );
}
