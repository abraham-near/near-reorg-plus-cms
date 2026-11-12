"use client";
// Blog I · Atlas. The index as a loose composition on paper rather than a grid: foundation-d's world (fields of dots, the rail's dark tags, small isometric
// drawings) with the posts laid out like prints on a table.
//   - the head: the heading among a few of the posts' pictures, scattered at different depths over a field of dots; they drift at their own speeds as you
//     scroll (and lean a little toward the pointer);
//   - the board: every post as a print of its own size and shape, set off a 12-column measure in a repeating, uneven pattern (big, small, set down, set in),
//     each drifting at its own depth; a print tilts toward the pointer. Dots and drawings sit behind them.
//   - the filters and the view sit in a small dock that stays at the foot of the screen while the board is in view: All · Stories · Read · Watch, and
//     Collage / List. List is the same posts as a plain numbered list, for reading or for anyone who prefers it.
// Phones: one column, the prints alternating left and right. Reduced motion: nothing drifts or tilts; the same composition, finished. Motion: ./motion.ts.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useScrollMotion } from "@/lib/motion/scroll";
import { ACTION, POSTS, SHORT_LABEL, byType, href, img, idx, type FilterKey, type Post } from "../data";
import { Arrow, ExtSr, Tabs } from "../parts";
import { COUNTS, End, Kind, Tag } from "../loose";
import { IsoStack, IsoDesk } from "./iso";
import { mount } from "./motion";
import "./blog-i.css";

type View = "collage" | "list";
/** the board's pattern, eight prints over three rows (desktop): its row in the pattern, where it starts on the 12 columns, how wide, its shape, how far
 *  it is set down, its depth (how slowly it drifts) */
const SLOTS = [
  { r: 0, c: 1, s: 5, ar: "4 / 3", dy: 0, z: 0.04, big: true },
  { r: 0, c: 7, s: 3, ar: "4 / 5", dy: 150, z: 0.18 },
  { r: 0, c: 10, s: 3, ar: "1 / 1", dy: 36, z: 0.3 },
  { r: 1, c: 2, s: 4, ar: "3 / 4", dy: 40, z: 0.22 },
  { r: 1, c: 7, s: 6, ar: "16 / 10", dy: 120, z: 0.08, big: true },
  { r: 2, c: 1, s: 3, ar: "1 / 1", dy: 70, z: 0.28 },
  { r: 2, c: 5, s: 4, ar: "3 / 2", dy: 0, z: 0.12 },
  { r: 2, c: 10, s: 3, ar: "4 / 5", dy: 170, z: 0.2 },
];
const ROWS = 3;
const rowOf = (k: number) => Math.floor(k / SLOTS.length) * ROWS + SLOTS[k % SLOTS.length].r + 1;
/** a free span of four columns in the board's last row, for the drawing (0: none) */
function freeSpan(n: number) {
  if (!n) return 0;
  const last = rowOf(n - 1), used = Array.from({ length: n }, (_, k) => k).filter((k) => rowOf(k) === last).map((k) => SLOTS[k % SLOTS.length]);
  return [9, 8, 7, 6, 5, 2].find((c) => used.every((s) => c + 3 < s.c || c > s.c + s.s - 1)) ?? 0;
}
/** the head's scattered pictures (decorative: the same posts are on the board); a negative depth: nearer, so they leave faster than the page */
const FLOAT = [
  { id: "venice", t: "story", cls: "bli-fl--a", z: -0.22 },
  { id: "nearvana", t: "watch", cls: "bli-fl--b", z: -0.5 },
  { id: "agent-economy", t: "read", cls: "bli-fl--c", z: -0.32 },
  { id: "zodl", t: "story", cls: "bli-fl--d", z: -0.7 },
] as const;
const v = (o: Record<string, string | number>) => o as CSSProperties;

function Print({ p, k }: { p: Post; k: number }) {
  const s = SLOTS[k % SLOTS.length], u = href(p);
  return (
    <li className={`bli-card${s.big ? " bli-card--big" : ""}`} data-in=""
      style={v({ "--c": s.c, "--s": s.s, "--ar": s.ar, "--dy": `${s.dy}px`, "--row": rowOf(k), "--d": ((k % 3) * 0.1).toFixed(2) })}>
      <div className="bli-card__par" data-depth={s.z}>
        <a className="bli-card__a" href={u}>
          <span className="bli-card__ph">
            <img src={img(p.id)} alt="" loading={k < 2 ? "eager" : "lazy"} decoding="async" />
            <Tag cls="bli-card__tag">{SHORT_LABEL[p.type]}</Tag>
            {p.type === "watch" && <span className="bli-play" aria-hidden="true"><i /></span>}
          </span>
          <span className="bli-card__meta"><span className="bli-card__n" aria-hidden="true">{idx(POSTS.indexOf(p))} / {idx(POSTS.length - 1)}</span><span>{p.source}</span></span>
          <span className="bli-card__t">{p.title}<ExtSr h={u} /></span>
          <span className="bli-card__go" aria-hidden="true">{ACTION[p.type]}<Arrow /></span>
        </a>
        {p.note && <p className="bli-card__note">{p.note}</p>}
      </div>
    </li>
  );
}

export function BlogI() {
  const ref = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<FilterKey>("all");
  const [view, setView] = useState<View>("collage");
  const first = useRef(true);
  useScrollMotion(ref, mount);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    ref.current?.dispatchEvent(new CustomEvent("bli:sync"));
  }, [f, view]);
  const posts = byType(f), free = freeSpan(posts.length);
  return (
    <div ref={ref} className="bl bl-i">
      {/* the head: the heading among scattered pictures, over a field of dots */}
      <section className="bli-hero" aria-labelledby="bli-h1">
        <div className="bli-field" aria-hidden="true">
          <div className="bli-dots bli-dots--far" data-depth="0.1" />
          <div className="bli-dots bli-dots--near" data-depth="0.28" />
          <div className="bli-hero__iso" data-depth="-0.16"><IsoStack /></div>
          {FLOAT.map((x) => (
            <div key={x.id} className={`bli-fl ${x.cls}`} data-depth={x.z} data-lean="">
              <div className="bli-fl__in">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local webp, art-directed by CSS */}
                <img src={img(x.id)} alt="" decoding="async" />
                <span className="bl-tag bli-fl__tag"><i />{SHORT_LABEL[x.t]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bli-hero__copy">
          <p className="bli-kick">
            <span>{COUNTS.all} posts</span><span>{COUNTS.story} stories</span><span>{COUNTS.read} read</span><span>{COUNTS.watch} talks</span>
          </p>
          <h1 id="bli-h1" className="bli-h1">The NEAR <span className="accent">blog</span></h1>
          <p className="bli-lede">Customer stories, reads and talks from across the NEAR ecosystem, laid out to wander through.</p>
        </div>
      </section>

      {/* the board */}
      <section className="bli-board" aria-labelledby="bli-board-t">
        <h2 id="bli-board-t" className="sr-only">All posts</h2>
        <div className="bli-dock">
          <div className="bli-dock__in">
            <Tabs value={f} onChange={setF} id="bli-f" controls="bli-res" counts={COUNTS} />
            <div className="bli-view" role="group" aria-label="View">
              <button type="button" className="bli-view__b" aria-pressed={view === "collage"} onClick={() => setView("collage")}>
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="1.5" y="2" width="7" height="6" /><rect x="10.5" y="4" width="4" height="5" /><rect x="4" y="10.5" width="5" height="4" /></svg>
                <span>Collage</span>
              </button>
              <button type="button" className="bli-view__b" aria-pressed={view === "list"} onClick={() => setView("list")}>
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M1.5 3.5h13M1.5 8h13M1.5 12.5h13" /></svg>
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        <div id="bli-res" role="tabpanel" aria-labelledby={`bli-f-${f}`} className="bli-res">
          <p className="sr-only" aria-live="polite">{posts.length} {posts.length === 1 ? "post" : "posts"}</p>
          {view === "collage" ? (
            <div className="bli-collage" key={"c" + f}>
              <div className="bli-deco" aria-hidden="true">
                <div className="bli-patch bli-patch--1" data-depth="0.34" />
                <div className="bli-patch bli-patch--2" data-depth="0.22" />
                <div className="bli-patch bli-patch--3" data-depth="0.4" />
              </div>
              <ul className="bli-prints">
                {posts.map((p, k) => <Print key={p.id} p={p} k={k} />)}
                {free > 0 && (
                  <li className="bli-card bli-card--iso" role="presentation" aria-hidden="true" style={v({ "--c": free, "--s": 4, "--dy": "80px", "--row": rowOf(posts.length - 1) })}>
                    <div className="bli-card__par" data-depth="0.36"><IsoDesk /></div>
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <ol className="bli-list" key={"l" + f}>
              {posts.map((p, k) => {
                const u = href(p);
                return (
                  <li key={p.id} className="bli-li" data-in="" style={v({ "--d": (k * 0.04).toFixed(2) })}>
                    <a className="bli-li__a" href={u}>
                      <span className="bli-li__n" aria-hidden="true">{idx(k)}</span>
                      <Kind t={p.type} />
                      <span className="bli-li__t">{p.title}<ExtSr h={u} /></span>
                      <span className="bli-li__src">{p.source}</span>
                      <span className="bli-li__go" aria-hidden="true"><Arrow /></span>
                    </a>
                    {p.note && <p className="bli-li__note">{p.note}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <End id="bli-end-t" />
    </div>
  );
}
