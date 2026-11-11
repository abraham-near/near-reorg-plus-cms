import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { V4Page } from "@/components/v4/V4Page";
import { REV_KEYS, type RevKey } from "@/components/v4/revenue/variants";

// /home-v4/a…d: home v4 with each option of the revenue band (components/v4/revenue/variants.tsx). The four are prerendered (generateStaticParams);
// cacheComponents wants the params read under a Suspense boundary (its fallback never shows for a prerendered option).
export const metadata: Metadata = { title: "Home v4" };
export function generateStaticParams() { return REV_KEYS.map((rev) => ({ rev })); }

async function Page({ params }: { params: Promise<{ rev: string }> }) {
  const { rev } = await params;
  if (!(REV_KEYS as readonly string[]).includes(rev)) notFound();
  return <V4Page rev={rev as RevKey} />;
}

export default function HomeV4Rev({ params }: { params: Promise<{ rev: string }> }) {
  return <Suspense fallback={null}><Page params={params} /></Suspense>;
}
