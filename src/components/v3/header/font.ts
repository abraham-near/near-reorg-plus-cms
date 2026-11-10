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

// v3's large Kepler accents (styles/versions.css --font-acc: the hero's "world.", the rail, Origin, Get into NEAR, Close, the footer): Light Italic,
// lighter than the Italic at those sizes. Subset to Latin from KeplerStd-LightIt.otf. The small accents ("deeper", the Stack) stay in Italic.
export const keplerLight = localFont({
  src: "../../../fonts/KeplerStd-LightIt.woff2",
  weight: "300",
  style: "italic",
  variable: "--font-kepler-light",
  display: "swap",
});
