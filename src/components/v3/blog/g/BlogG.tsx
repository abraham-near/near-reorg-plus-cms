"use client";
// Blog G · Feature stream. No ruled cells: one editorial column read beside one picture.
//   - the stream (desktop): a sticky frame on the left holds the picture of whichever post is in the middle of the view; as you read down the column on
//     the right, the next picture wipes up over the last (a counter and a green line say where you are). The column opens on the page's heading and the
//     newest post at display size, then the customer stories, alternating large and small, set in and out, so the column has a rhythm, not a grid.
//   - Inside NEAR (the talks): a dark band; on desktop the band holds while the talks slide past sideways (scrubbed), the green line filling as they go.
//   - the jump links under the heading (Read · Stories · Watch, with counts) follow where you are.
// Phones: each post carries its own picture, the talks scroll sideways by hand. Reduced motion: the same layout, pictures switch without a wipe, the band
// is a plain sideways list. Motion: ./motion.ts.
import { useRef } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { ACTION, POSTS, href, img, idx, type Post } from "../data";
import { Arrow, ExtSr } from "../parts";
import { COUNTS, End, Kind } from "../loose";
import { mount } from "./motion";
import "./blog-g.css";

const LEAD = POSTS[0];   // the newest post (a read)
const STORIES = POSTS.filter((p) => p.type === "story"), TALKS = POSTS.filter((p) => p.type === "watch");
const STREAM = [LEAD, ...STORIES];
const JUMPS = [
  { href: "#blg-lead", label: "Read", n: COUNTS.read },
  { href: "#blg-stories", label: "Stories", n: COUNTS.story },
  { href: "#blg-talks", label: "Watch", n: COUNTS.watch },
];

/** one post in the column: the title is the link (it covers the whole entry); its own picture shows on phones */
function Entry({ p, i, big }: { p: Post; i: number; big: boolean }) {
  const u = href(p);
  return (
    <li className={`blg-entry ${big ? "blg-entry--big" : "blg-entry--small"}`} data-i={i}>
      <div className="blg-entry__ph" aria-hidden="true"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /></div>
      <div className="blg-entry__tx">
        <p className="blg-entry__top"><span className="blg-n">{idx(i)}</span><Kind t={p.type} /></p>
        <h3 className="blg-entry__t"><a className="blg-entry__a" href={u}>{p.title}<ExtSr h={u} /></a></h3>
        <p className="blg-entry__src">{p.source}</p>
        {p.note && <p className="blg-entry__note">{p.note}</p>}
        <span className="blg-go" aria-hidden="true">{ACTION[p.type]}<Arrow /></span>
      </div>
    </li>
  );
}

export function BlogG() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMotion(ref, mount);
  const lu = href(LEAD);
  return (
    <div ref={ref} className="bl bl-g">
      <div className="blg-split">
        {/* the frame: the picture of the post being read (decorative: every post's title is its link) */}
        <div className="blg-media" aria-hidden="true">
          <div className="blg-frame">
            {STREAM.map((p, i) => (
              <div key={p.id} className={`blg-slide${i === 0 ? " is-on" : ""}`} data-i={i}>
                <img src={img(p.id)} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
              </div>
            ))}
            <span className="blg-frame__tag"><i />{"Latest"}</span>
          </div>
          <div className="blg-cap">
            <span className="blg-cap__n"><b className="blg-cap__i">01</b> / {idx(STREAM.length - 1)}</span>
            <span className="blg-cap__bar"><b /></span>
            <span className="blg-cap__src">{LEAD.source}</span>
          </div>
        </div>

        <div className="blg-col">
          {/* the opening: the page's heading, then the newest post at display size */}
          <article className="blg-lead" id="blg-lead" data-i={0} aria-labelledby="blg-lead-t">
            <div className="blg-lead__head">
              <h1 className="blg-h1">The NEAR <span className="accent">blog</span></h1>
              <p className="blg-lede">Customer stories, reads and talks from across the NEAR ecosystem.</p>
              <nav className="blg-jump" aria-label="Jump to">
                {JUMPS.map((j) => <a key={j.href} className="blg-jump__a" href={j.href}>{j.label}<span className="blg-jump__n">{j.n}</span></a>)}
              </nav>
            </div>
            <div className="blg-entry__ph blg-lead__ph" aria-hidden="true"><img src={img(LEAD.id)} alt="" decoding="async" /></div>
            <div className="blg-lead__tx">
              <p className="blg-entry__top"><span className="blg-n">Latest</span><Kind t={LEAD.type} /></p>
              <h2 id="blg-lead-t" className="blg-lead__t"><a className="blg-entry__a" href={lu}>{LEAD.title}<ExtSr h={lu} /></a></h2>
              <p className="blg-entry__src">{LEAD.source}</p>
              <span className="blg-go" aria-hidden="true">{ACTION[LEAD.type]}<Arrow /></span>
            </div>
          </article>

          <section className="blg-stories" id="blg-stories" aria-labelledby="blg-stories-t">
            <h2 id="blg-stories-t" className="blg-sub"><span>Customer <span className="accent">stories</span></span><span className="blg-sub__n t-label">{COUNTS.story} stories</span></h2>
            <ol className="blg-list">
              {STORIES.map((p, k) => <Entry key={p.id} p={p} i={k + 1} big={k % 2 === 0} />)}
            </ol>
          </section>
        </div>
      </div>

      {/* Inside NEAR: the talks, a dark band that slides sideways */}
      <section className="blg-talks" id="blg-talks" data-nav-tone="dark" aria-labelledby="blg-talks-t">
        <div className="blg-talks__pin">
          <div className="blg-talks__head">
            <div>
              <p className="t-label blg-talks__k">Watch · {COUNTS.watch} talks</p>
              <h2 id="blg-talks-t" className="bl-h2">Inside <span className="accent">NEAR</span></h2>
            </div>
            <div className="blg-talks__prog" aria-hidden="true"><span className="blg-talks__i">01</span><span className="blg-talks__bar"><b /></span><span>{idx(TALKS.length - 1)}</span></div>
          </div>
          <ol className="blg-talks__track">
            {TALKS.map((p, k) => {
              const u = href(p);
              return (
                <li key={p.id} className="blg-talk" data-k={k}>
                  <a className="blg-talk__a" href={u}>
                    <span className="blg-talk__ph"><img src={img(p.id)} alt="" loading="lazy" decoding="async" /><span className="blg-talk__play" aria-hidden="true"><i /></span></span>
                    <span className="blg-talk__n" aria-hidden="true">{idx(k)}</span>
                    <span className="blg-talk__t">{p.title}<ExtSr h={u} /></span>
                    <span className="blg-talk__src">{p.source}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <End id="blg-end-t" />
    </div>
  );
}
