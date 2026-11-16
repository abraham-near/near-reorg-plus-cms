import localFont from "next/font/local";

// Licensed fonts (D2). Files in src/fonts/, every one subset to Latin (the full originals are in Work Local/Fonts): Montreal Book to Regular's
// characters plus the arrows and marks the copy uses (48 → 25 KB), Kepler Medium Condensed to the Kepler cuts' (126 → 28 KB). Bold isn't loaded:
// nothing uses it, and every preloaded face costs first paint. Kepler Italic and Italic Display were dropped: every accent is Medium Condensed.
export const montreal = localFont({
  src: [
    { path: "../fonts/PPNeueMontreal-Regular.woff2", weight: "400", style: "normal" },
    // No Medium on the page: weight 500 (headings, labels, buttons) is drawn with the Regular cut too.
    { path: "../fonts/PPNeueMontreal-Regular.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-montreal",
  display: "swap",
});

export const montrealMono = localFont({
  src: "../fonts/PPNeueMontrealMono-Regular.woff2",
  weight: "400",
  variable: "--font-montreal-mono",
  display: "swap",
  preload: false,
});

// Abraham's text face (the header, the sections after the Stack, the footer): PP Neue Montreal Book, the 400 r17 uses (--font-text in tokens.css).
export const montrealBook = localFont({
  src: "../fonts/PPNeueMontreal-Book.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-montreal-book",
  display: "swap",
});

// Abraham's accent (the sections after the Stack): Kepler Medium Condensed Italic Display, the cut r17 uses (--font-acc in tokens.css).
export const keplerCondensed = localFont({
  src: "../fonts/KeplerStd-MediumCnItDisp.woff2",
  weight: "500",
  style: "italic",
  variable: "--font-kepler-cn",
  display: "swap",
});

export const fontVariables = [montreal.variable, montrealMono.variable, montrealBook.variable, keplerCondensed.variable].join(" ");
