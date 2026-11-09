import localFont from "next/font/local";

// b10's nav type: Montreal Regular for 400 and the Medium cut for its 500 UI text (menus, Get started, names). Only v3's header loads it.
export const montrealNav = localFont({
  src: [
    { path: "../../../fonts/PPNeueMontreal-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../fonts/PPNeueMontreal-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-montreal-nav",
  display: "swap",
});
