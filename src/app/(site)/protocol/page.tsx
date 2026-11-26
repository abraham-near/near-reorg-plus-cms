import type { Metadata } from "next";
import { connection } from "next/server";
import { og } from "@/lib/site";
import { BlogShell } from "@/components/v3/blog/BlogShell";
import { ProtocolFinal } from "@/components/protocol/final/ProtocolFinal";
import { deeperPosts } from "@/components/protocol/final/deeper";
import { CLOSE, META } from "@/components/protocol/content";
import { CloseScene } from "@/components/shared/CloseScene";

// near.org/protocol, the final page (components/protocol/final, since Nov 25, 2026), the one in the menu: the Vercel page's hero, index, Speed. Scale. Access. and its run
// of quantum, Chain Signatures and developers (in light), with version B's chapter (Nightshade 3.0, dynamic resharding and the private shard on the live
// lanes), lower sections and Go deeper, after the team's Figma collage; on v3's shell, closing with the homepage's scene. B stays at /protocol-b. Copy: components/protocol/content.ts.
// Go deeper lists the CMS's newest posts: rendered on request as /blog is (the database is not reachable at build), the read cached by the CMS's tags.
export const instant = false;

export const metadata: Metadata = {
  title: META.title,
  description: META.description,
  alternates: { canonical: "/protocol" },
  openGraph: og({ url: "/protocol" }),
};

export default async function ProtocolPage() {
  await connection();
  const deeper = await deeperPosts();
  return <BlogShell home="/"><ProtocolFinal deeper={deeper} /><CloseScene sub={CLOSE.sub} primary={CLOSE.primary} ruled /></BlogShell>;
}
