import type { Metadata } from "next";
import { V1Page } from "@/components/v1/V1Page";

export const metadata: Metadata = {
  title: "Home v1",
  description: "As AI starts acting for you, NEAR keeps you in control of your data, your assets, and your intelligence.",
};

export default function HomeV1() {
  return <V1Page />;
}
