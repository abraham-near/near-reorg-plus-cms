"use client";
import { useRef, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { FEATURED, MORE, TITLE, type Voice } from "./data";
import { mount } from "./motion";
import "./voices.css";

/** a phrase of `text` wrapped in an element (its first occurrence), the rest left as plain strings */
function wrapPhrase(parts: ReactNode[], phrase: string | undefined, wrap: (s: string) => ReactNode): ReactNode[] {
  if (!phrase) return parts;
  return parts.flatMap((p) => {
    if (typeof p !== "string") return [p];
    const i = p.indexOf(phrase);
    if (i < 0) return [p];
    return [p.slice(0, i), wrap(phrase), p.slice(i + phrase.length)].filter((s) => s !== "");
  });
}

/** the quote: the hanging opening mark, the text with its marked (and no-wrap) phrase, the closing mark joined to the last text */
function Quote({ v, underline }: { v: Voice; underline: boolean }) {
  let parts: ReactNode[] = [v.text + "”"];
  parts = wrapPhrase(parts, v.mark, (s) => <mark key="mk" className={underline ? "vx-mk vx-mk--u" : "vx-mk"}>{s}</mark>);
  parts = wrapPhrase(parts, v.nw, (s) => <span key="nw" className="vx-nw">{s}</span>);
  return (
    <p>
      <span className="vx-hang">“</span>
      {parts}
    </p>
  );
}

function By({ v }: { v: Voice }) {
  return (
    <figcaption className="vx-by">
      <span className="vx-name">{v.name}</span>
      {v.role ? <> <span className="vx-role">{v.role}</span></> : null}
    </figcaption>
  );
}

// Testimonials, "What the world is saying about NEAR": the heading top-left, one featured voice large on the left, three more stacked on the right on hairlines.
export function Voices() {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <section ref={ref} className="vx" id="voices" aria-labelledby="voices-title" data-voices="">
      <div className="vx-inner">
        <h2 className="vx-title" id="voices-title">{TITLE}</h2>
        <figure className="vx-feat">
          <blockquote className="vx-fq"><Quote v={FEATURED} underline={false} /></blockquote>
          <By v={FEATURED} />
        </figure>
        <ul className="vx-list" role="list">
          {MORE.map((v) => (
            <li className="vx-item" key={v.id}>
              <figure className="vx-q">
                <blockquote><Quote v={v} underline /></blockquote>
                <By v={v} />
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
