import { Fragment, type ReactNode } from "react";

// Server-side character split for the anthem's colour wipe. Screen readers get the sentence once (sr-only);
// the split copy is aria-hidden. Words stay unbreakable; "\n" marks a desktop line break. With `indentClass`, every line after a
// break starts with an empty indent span (data-l = its line index), so the CSS can stagger the lines; it holds no characters,
// so the wipe (which reads the chars as span > span) never sees it.
type Part = { text: string; className?: string };

export function SplitText({ parts, wordClass, charClass, breakClass, indentClass }: { parts: Part[]; wordClass: string; charClass: string; breakClass: string; indentClass?: string }) {
  const sentence = parts.map((p) => p.text).join("").replace(/\s+/g, " ").trim();
  let key = 0, line = 0;
  const words: ReactNode[] = [];
  for (const part of parts) {
    for (const token of part.text.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        words.push(token.includes("\n") ? <Fragment key={key++}>{" "}<br className={breakClass} />{indentClass && <span className={indentClass} data-l={++line} />}</Fragment> : " ");
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
