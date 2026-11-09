import type { Metadata } from "next";
import { V3Page } from "@/components/v3/V3Page";

export const metadata: Metadata = {
  title: "Home v3",
  description: "As AI starts acting for you, NEAR keeps you in control of your data, your assets, and your intelligence.",
};

export default function HomeV3() {
  return <V3Page />;
}
