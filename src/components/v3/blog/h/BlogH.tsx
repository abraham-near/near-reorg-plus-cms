"use client";
// Blog H · Chapters. The index set as type, in three chapters by format: Customer stories, Reads, Talks. No cells and no lines between posts.
//   - the head: the page's heading and lede, then the filters (All · Stories · Read · Watch, with counts), which show one chapter or all three;
//   - a chapter opens on its title at poster size; as you read on (desktop) it shrinks into a small label that sticks at the top left while its posts pass
//     beside it, then leaves with the chapter;
//   - the posts are free rows of type: the number, the title, the source, an arrow. Hovering one (fine pointers) brings its picture out to follow the
//     cursor and quiets the other rows; a row focused by keyboard shows its picture beside it. Touch screens show a small picture in the row instead.
// Reduced motion: the titles stay at full size and in place, the picture appears without following. Motion: ./motion.ts.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { POSTS, href, img, idx, type FilterKey, type Post, type Type } from "../data";
import { Arrow, ExtSr, Tabs } from "../parts";
import { COUNTS, End, Kind } from "../loose";
import { mount } from "./motion";
import "./blog-h.css";

const CHAPTERS: { t: Type; id: string; title: ReactNode; sr: string; unit: [string, string] }[] = [
  { t: "story", id: "blh-stories", title: <>Customer <span className="accent">stories</span></>, sr: "Customer stories", unit: ["story", "stories"] },
  { t: "read", id: "blh-reads", title: <>Long <span className="accent">reads</span></>, sr: "Long reads", unit: ["read", "reads"] },
  { t: "watch", id: "blh-talks", title: <>Inside NEAR <span className="accent">talks</span></>, sr: "Inside NEAR talks", unit: ["talk", "talks"] },
];

function Row({ p, k }: { p: Post; k: number }) {
  const u = href(p);
  return (
    <li className="blh-row" style={{ ["--d" as string]: (0.06 * k).toFixed(2) }} data-in="">
      <a className="blh-row__a" href={u} data-pic={p.id}>
        <span className="blh-row__n" aria-hidden="true">{idx(k)}</span>
        <span className="blh-row__t">{p.title}<ExtSr h={u} /></span>
        <span className="blh-row__src">{p.source}</span>
        <span className="blh-row__go" aria-hidden="true"><Arrow /></span>
        <span className="blh-row__thumb" aria-hidden="true"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></span>
      </a>
      {p.note && <p className="blh-row__note">{p.note}</p>}
    </li>
  );
}

export function BlogH() {
  const ref = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const first = useRef(true);
  useScrollMotion(ref, mount);
  // a filter change: the chapters it shows are new, so the motion picks them up (their titles, icons and arrivals)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    ref.current?.dispatchEvent(new CustomEvent("blh:sync"));
  }, [f]);
  const shown = CHAPTERS.filter((c) => f === "all" || c.t === f);
  return (
    <div ref={ref} className="bl bl-h">
      <header className="blh-head">
        <h1 className="blh-h1">The NEAR <span className="accent">blog</span></h1>
        <p className="blh-lede">Customer stories, reads and talks from across the NEAR ecosystem, in three chapters.</p>
        <div className="blh-filters"><Tabs value={f} onChange={setF} id="blh-f" controls="blh-chapters" label="Show a chapter" counts={COUNTS} /></div>
      </header>

      <div id="blh-chapters" className="blh-chapters" role="tabpanel" aria-labelledby={`blh-f-${f}`}>
        {shown.map((c) => {
          const posts = POSTS.filter((p) => p.type === c.t), cn = CHAPTERS.indexOf(c);
          return (
            <section key={c.id + f} className="blh-ch" id={c.id} aria-labelledby={`${c.id}-t`}>
              <div className="blh-ch__head" data-in="">
                <h2 id={`${c.id}-t`} className="blh-ch__t"><span className="blh-ch__name">{c.title}</span></h2>
                <p className="blh-ch__meta">
                  <span className="blh-ch__no">Chapter {idx(cn)}</span><Kind t={c.t} /><span className="blh-ch__count">{posts.length} {c.unit[posts.length === 1 ? 0 : 1]}</span>
                </p>
              </div>
              <ol className={`blh-rows${posts.length === 1 ? " blh-rows--one" : ""}`} aria-label={c.sr}>
                {posts.map((p, k) => <Row key={p.id} p={p} k={k} />)}
              </ol>
            </section>
          );
        })}
      </div>

      {/* the picture that follows the cursor over a row (decorative: the row is the link) */}
      <div className="blh-pic" aria-hidden="true">
        <div className="blh-pic__in">
          {POSTS.map((p) => <img key={p.id} src={img(p.id)} alt="" data-pic={p.id} loading="lazy" decoding="async" />)}
        </div>
      </div>

      <End id="blh-end-t" />
    </div>
  );
}
