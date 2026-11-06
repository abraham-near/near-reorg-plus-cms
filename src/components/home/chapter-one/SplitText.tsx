import { Fragment, type ReactNode } from "react";

// Server-side character split for the anthem's colour wipe. Screen readers get the sentence once (sr-only);
// the split copy is aria-hidden. Words stay unbreakable; "\n" marks a desktop line break.
type Part = { text: string; className?: string };

export function SplitText({ parts, wordClass, charClass, breakClass }: { parts: Part[]; wordClass: string; charClass: string; breakClass: string }) {
  const sentence = parts.map((p) => p.text).join("").replace(/\s+/g, " ").trim();
  let key = 0;
  const words: ReactNode[] = [];
  for (const part of parts) {
    for (const token of part.text.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        words.push(token.includes("\n") ? <Fragment key={key++}>{" "}<br className={breakClass} /></Fragment> : " ");
        continue;
      }
      words.push(
        <span key={key++} className={`${wordClass} ${part.className ?? ""}`}>
          {[...token].map((ch, i) => <span key={i} className={charClass}>{ch}</span>)}
        </span>,
      );
    }
  }
  return (
    <>
      <span className="sr-only">{sentence}</span>
      <span aria-hidden="true">{words}</span>
    </>
  );
}
