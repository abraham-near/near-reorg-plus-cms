"use client";
// The <html> attributes the site's inline scripts set before first paint (data-js from (site)/layout.tsx, data-version from <FixVersion>), set again
// from React. Needed by (site)/not-found.tsx: a notFound() thrown while the page renders (an unknown /blog/[slug]) reaches the browser as an empty
// error shell that React then renders on the client, and inline scripts rendered on the client never run (components/InlineScript.tsx), so without
// this the 404 would show with no header and the v1 buttons. On a server-rendered page the scripts already did it and this changes nothing.
import { useLayoutEffect } from "react";
import type { Version } from "@/components/shared/version";

export function RootFlags({ version }: { version: Version }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-js", "");
    root.setAttribute("data-version", version);
  }, [version]);
  return null;
}
