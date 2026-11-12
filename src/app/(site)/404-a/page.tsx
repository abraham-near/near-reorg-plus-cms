import type { Metadata } from "next";
import { NotFoundA } from "@/components/notfound/a/NotFoundA";

// 404, proposal A "Lost in the mist": home v5's forest hero as the not-found page (components/notfound/a). A preview route; the real not-found can render
// <NotFoundA /> (or <NotFoundAHero /> inside its own shell).
export const metadata: Metadata = {
  title: "404 A",
  description: "This page doesn’t exist, or it moved. Here’s the way back.",
  robots: { index: false, follow: false },
};

export default function NotFoundPageA() {
  return <NotFoundA />;
}
