import type { Metadata } from "next";
import { Contact } from "@/components/contact/Contact";

// Contact: in the official pages' hand (the homepage's header and footer; components/contact): a short about, the form and NEAR's social links. The form
// checks itself and shows its success in place. No backend: nothing is sent.
export const metadata: Metadata = {
  title: "Contact",
  description: "Write to NEAR about questions, press or partnerships, or follow NEAR on X, Discord, Telegram, GitHub, YouTube and LinkedIn.",
};

export default function ContactPage() {
  return <Contact />;
}
