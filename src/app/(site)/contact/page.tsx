import type { Metadata } from "next";
import { Contact } from "@/components/contact/Contact";

// Contact: in the official pages' hand (home v5's header and footer, Blog J's head, rail and open feed; components/contact). The routes link out to
// near.org's family; the form checks itself and shows its success in place. No backend: nothing is sent.
export const metadata: Metadata = {
  title: "Contact",
  description: "Ways to reach NEAR: builders, press, partnerships, careers and community. Or write to us.",
};

export default function ContactPage() {
  return <Contact />;
}
