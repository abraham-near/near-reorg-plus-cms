// The homepage's frame, from home v1 (near-reorg r17 v1 "Carril vivo"): the header, then (behind V1Gate, which waits for the world, the rail and the
// Stack) the world, the rail, the Stack, what follows the Stack and the footer, then V1Boot (the world, rail and Stack motion). Home v7 fills every slot.
import type { ReactNode } from "react";
import { InlineScript } from "@/components/InlineScript";
import { FixVersion, type Version } from "@/components/shared/version";
import { V1Boot } from "./V1Boot";
import { V1Gate } from "./V1Gate";
import { HEAD } from "./world/head";

/** The page's frame: every slot is the caller's (home v7: components/v7/V7Page.tsx). There are no defaults on purpose: a default here is imported, and
 *  so bundled, even when the caller replaces it. world, rail and stack keep v1's classes, so boot / rail / stack motion run on them unchanged. */
/** stackFirst (home v10, D239): the Stack right after the world, then `between` (the Real Usage band), then the rail, then the rest */
export function V1Page({ v = "v1", header, afterStack, footer, world, rail, stack, stackFirst, between }: {
  v?: Version; header: ReactNode; afterStack: ReactNode; footer: ReactNode; world: ReactNode; rail: ReactNode; stack: ReactNode; stackFirst?: boolean; between?: ReactNode;
}) {
  return (
    <>
      <FixVersion v={v} />
      <InlineScript html={HEAD} />
      {header}
      <V1Gate>
        <main id="main">
          {world}
          {stackFirst ? <>{stack}{between}{rail}</> : <>{rail}{stack}</>}
          {afterStack}
        </main>
        {footer}
      </V1Gate>
      <V1Boot />
    </>
  );
}
