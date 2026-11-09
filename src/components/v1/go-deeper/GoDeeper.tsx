"use client";
// Go deeper (r17 v1): the filter's first item large on the left, the rest a hairline list on the right; ARIA tabs All / Stories / Read / Watch mirrored in ?type=.
// Every panel stays in the DOM (one grid cell; the hidden ones inert) so the section keeps the tallest filter's height and the motion finds them all.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useScrollMotion } from "@/components/v1/motion";
import { PANELS, type Item, type Panel } from "./content";
import { mount, FILTER_EVENT, type FilterDetail } from "./motion";
import "./go-deeper.css";

type Key = Panel["key"];
const KEYS = PANELS.map((p) => p.key);
const isKey = (k: string | null): k is Key => !!k && (KEYS as string[]).includes(k);
const idx = (n: number) => String(n).padStart(2, "0");

function Meta({ n, item }: { n: number; item: Item }) {
  return (
    <p className="gd-meta"><span className="gd-idx" aria-hidden="true">{idx(n)}</span><span className="gd-type">{item.type}</span><span className="gd-src">{item.src}</span></p>
  );
}
function Link({ item }: { item: Item }) {
  return <a href={item.href} className="gd-stretch">{item.title}{item.external && <span className="sr-only"> (another site)</span>}</a>;
}

export function GoDeeper() {
  const ref = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState<Key>("all");
  const last = useRef<{ key: Key; replay: boolean }>({ key: "all", replay: false });

  const choose = (k: Key) => {
    last.current.replay = true;
    setActive(k);
    const u = new URL(window.location.href);
    if (k === "all") u.searchParams.delete("type"); else u.searchParams.set("type", k);
    window.history.replaceState(window.history.state, "", u);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = KEYS.length;
    const to = ({ ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault(); choose(KEYS[to]); tabs.current[to]?.focus();
  };

  // ?type= on load (no replay: the photo simply comes in with the scroll)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("type");
    // the URL only exists on the client: reading it after hydration keeps the server render ("all") and the first client render identical
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isKey(q)) { last.current.replay = false; setActive(q); }
  }, []);

  // tell the motion the panel changed, once the DOM shows it
  useEffect(() => {
    if (last.current.key === active) return;
    last.current.key = active;
    const detail: FilterDetail = { replay: last.current.replay };
    ref.current?.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail }));
  }, [active]);

  useScrollMotion(ref, mount);

  return (
    <section ref={ref} className="gd" id="deeper" aria-labelledby="deeper-title">
      <div className="gd-inner">
        <header className="gd-head">
          <h2 id="deeper-title" className="gd-h2">Go <span className="acc">deeper</span></h2>
          <div className="gd-filters" role="tablist" aria-label="Filter by type">
            {PANELS.map((p, i) => {
              const on = p.key === active;
              return (
                <button key={p.key} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`deeper-tab-${p.key}`} aria-controls={`deeper-panel-${p.key}`}
                  aria-selected={on} tabIndex={on ? 0 : -1} className="gd-filter" data-key={p.key} onClick={() => choose(p.key)} onKeyDown={(e) => onKey(e, i)}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </header>
        <div className="gd-panels">
          {PANELS.map((p) => {
            const on = p.key === active;
            return (
              <div key={p.key} role="tabpanel" id={`deeper-panel-${p.key}`} aria-labelledby={`deeper-tab-${p.key}`} className="gd-panel"
                data-active={on ? "" : undefined} inert={!on} data-count={p.rows.length + 1}>
                <article className="gd-feat">
                  <div className="gd-media" data-media><img className="gd-img" src={p.feat.img} alt="" width={1600} height={905} loading="lazy" decoding="async" /></div>
                  <div className="gd-featText">
                    <Meta n={1} item={p.feat} />
                    <h3 className="gd-featTitle"><Link item={p.feat} /></h3>
                    {p.feat.note && <p className="gd-note">{p.feat.note}</p>}
                  </div>
                </article>
                {p.rows.length ? (
                  // the window (desktop, motion): the list scrolls inside it beside our bar; elsewhere these are plain blocks and the bar is hidden
                  <div className="gd-winbox">
                    <div className="gd-win" tabIndex={-1}>
                      <ol className="gd-list" role="list" aria-label={`More in ${p.label}`}>
                        {p.rows.map((r, j) => (
                          <li key={r.title} className="gd-row gd-row--img">
                            <div className="gd-rowText">
                              <Meta n={j + 2} item={r} />
                              <h3 className="gd-rowTitle"><Link item={r} /></h3>
                              {r.note && <p className="gd-note">{r.note}</p>}
                            </div>
                            <div className="gd-thumb"><img src={r.img} alt="" width={1600} height={905} loading="lazy" decoding="async" /></div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="gd-sb" aria-hidden="true"><i className="gd-sb-th" /></div>
                  </div>
                ) : (
                  <p className="gd-empty">{p.empty}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="gd-foot"><a href="/blog" className="gd-all">View everything</a></div>
      </div>
    </section>
  );
}
