// 404 proposal B · "404 in blocks": one calm screen on paper (home v5). The number drawn as extruded blocks in the rail's isometric hand (./Art.tsx), a one-line
// headline with one Kepler accent, and the "Back home" pill. Motion is CSS only (./notfound-b.css): the blocks rise into place once; reduced motion shows them still.
// The shell is v3's (FixVersion, v5's spread header, V3Footer, the Extra chip), as components/v3/blog/BlogShell.tsx does it.
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "@/components/v3/header/Header";
import { V3Footer } from "@/components/v3/footer/Footer";
import { ArtB } from "./Art";
import "@/components/v3/buttons.css";
import "./notfound-b.css";

export function NotFoundB({ home = "/home-v5" }: { home?: string }) {
  return (
    <>
      <FixVersion v="v3" />
      <V3Header home={home} spread stay soft />
      <main id="main" className="nfb-main">
        <section className="nfb" aria-labelledby="nfb-h">
          <div className="nfb__art"><ArtB /></div>
          <h1 className="nfb__title" id="nfb-h"><span className="nfb__sr">Error 404. </span>This page doesn&rsquo;t <span className="acc">exist.</span></h1>
          <a className="nfb__pill" href={home}><i className="nfb__dot" aria-hidden="true" />Back home<i className="nfb__arr" aria-hidden="true" /></a>
        </section>
      </main>
      <V3Footer />
      <ExtraChip />{/* temporary way back to /extra: remove this line to drop it */}
    </>
  );
}
