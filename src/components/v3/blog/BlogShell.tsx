// A v3 blog page: v3's header and footer around the index, in v3's values (html[data-version="v3"], fixed before first paint as /home-v3 does).
// No world, no rail, no Stack: V1Page is not used, so nothing waits for a boot; the page scrolls natively.
import type { ReactNode } from "react";
import { FixVersion } from "@/components/shared/version";
import { ExtraChip } from "@/components/ExtraChip";
import { V3Header } from "../header/Header";
import { V3Footer } from "../footer/Footer";
import "../buttons.css";
import "./blog.css";

export function BlogShell({ children, home = "/home-v3" }: { children: ReactNode; home?: string }) {
  return (
    <>
      <FixVersion v="v3" />
      <V3Header home={home} />
      <main id="main">{children}</main>
      <V3Footer />
      <ExtraChip />{/* temporary way back to /extra: remove this line to drop it */}
    </>
  );
}
