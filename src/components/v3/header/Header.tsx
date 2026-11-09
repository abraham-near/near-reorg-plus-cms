"use client";
// v3's header: b10's nav (near-homepage-directions /b10, round 22–23 "F"), in our black.
// Desktop: one centred floating pill from the first frame (the N, the four menus, Get started with the emerald dot); a menu unfolds the black panel
// out of the pill. Phone: the N and one Menu button; Menu opens the full-screen map. Behaviour: ./motion.ts, the panels' icons: ./icons.ts.
import { useRef } from "react";
import { InlineScript } from "@/components/InlineScript";
import { useScrollMotion } from "@/lib/motion/scroll";
import { GROUPS, isExt, type Item } from "./links";
import { mount } from "./motion";
import { montrealNav } from "./font";
import "./header.css";

// the NEAR mark: b10's geometry (nav-pre.js), the N alone in currentColor
const N_PATH = "M72.2 4.6L53.4 32.5c-1.3 1.9 1.2 4.2 3 2.6L74.9 19c.5-.4 1.2-.1 1.2.6v50.3c0 .7-.9 1-1.3.5l-56-67C17 1.2 14.4 0 11.5 0h-2C4.3 0 0 4.3 0 9.6v70.8C0 85.7 4.3 90 9.6 90c3.3 0 6.4-1.7 8.2-4.6l18.8-27.9c1.3-1.9-1.2-4.2-3-2.6L15.1 71c-.5.4-1.2.1-1.2-.6V20.1c0-.7.9-1 1.3-.5l56 67c1.8 2.2 4.5 3.4 7.3 3.4h2c5.3 0 9.6-4.3 9.6-9.6V9.6c0-5.3-4.3-9.6-9.6-9.6-3.4 0-6.5 1.7-8.3 4.6z";
const MARK = (
  <svg className="nv-n" viewBox="0 0 90 90" aria-hidden="true" focusable="false"><path d={N_PATH} /></svg>
);
// microcopy that is ours, not the client's (b10's UI strings)
const UI = { menu: "Menu", close: "Close", home: "NEAR home", map: "Map of NEAR", ext: " (another NEAR site)" };
const SPRITE = "/nav/sprite.svg";
/** every Get started goes to Get into NEAR on the page (b10: #start); motion.ts falls back to near.com where a page has none */
const START = "#paths";

const Ext = () => (
  <>
    <svg className="nv-ext" viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false">
      <path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
    <span className="sr-only">{UI.ext}</span>
  </>
);
/** a link's name: the hover dot (you), the name, the ↗ for another NEAR site */
const Name = ({ it }: { it: Item }) => (
  <span className="nv-nm"><i className="nv-you" aria-hidden="true" /><span className="nv-nm-t">{it.name}</span>{isExt(it.href) && <Ext />}</span>
);
const Icon = ({ id, size }: { id: string; size: number }) => (
  <svg className="icon" width={size} height={size} aria-hidden="true" focusable="false"><use href={`${SPRITE}#i-${id}`} /></svg>
);
const MenuIco = () => <span className="nv-menu-ico" aria-hidden="true"><i /><i /><i /></span>;
const Dot = () => <i className="nv-dot" aria-hidden="true" />;

/* the map: importance = size (Products > Stack > Resources > About). One rule for every block: the icon top-left (one size per tier),
   the group label once per group (its first block), so titles share one baseline per row */
function Blk({ it, grp, cls, area, size, first }: { it: Item; grp: string; cls: string; area?: string; size: number; first?: boolean }) {
  return (
    <a className={`nv-blk ${cls}`} href={it.href} data-nv-link="" data-grp={grp.toLowerCase()} style={area ? { gridArea: area } : undefined}>
      <span className="nv-blk-hd">
        <span className="nv-blk-gl"><Icon id={it.icon} size={size} /></span>
        <span className="nv-blk-l" aria-hidden={first ? undefined : true} data-rep={first ? undefined : ""}>{grp}</span>
      </span>
      <span className="nv-blk-tx">
        <span className="nv-blk-nm">{it.name}<span className="nv-blk-ar" aria-hidden="true"><Icon id="arrow" size={16} /></span></span>
        <span className="nv-blk-ds">{it.desc}</span>
      </span>
    </a>
  );
}
function MapGrid() {
  const [prod, stack, ...regions] = GROUPS;
  const P = prod.secs[0].items, S = stack.secs[0].items;
  return (
    <div className="nv-map-grid b3map b3map--map">
      <div className="nv-band nv-band--a">
        <Blk it={P[0]} grp="Products" cls="nv-blk--xl" area="a" size={48} first />
        <Blk it={P[1]} grp="Products" cls="nv-blk--l" area="b" size={32} />
        <Blk it={P[2]} grp="Products" cls="nv-blk--l" area="c" size={32} />
        <Blk it={S[0]} grp="Stack" cls="nv-blk--l nv-blk--st" area="d" size={32} first />
        <Blk it={S[1]} grp="Stack" cls="nv-blk--m nv-blk--st" area="e" size={32} />
        <Blk it={S[2]} grp="Stack" cls="nv-blk--m nv-blk--st" area="f" size={32} />
      </div>
      <div className="nv-band nv-band--b">
        {regions.map((g) => (
          <div key={g.id} className={`nv-grp nv-grp--${g.id}`}>
            <span className="nv-region" aria-hidden="true"><span>{g.name}</span></span>
            {g.secs.map((s) => s.items.map((it, n) => (
              <Blk key={it.href} it={it} grp={s.name ?? g.name} cls={`nv-blk--s nv-blk--${g.id}`} size={24} first={n === 0} />
            )))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** home: where the N goes (each version's own home; plain <a>, a full page load, so one version's boot never meets the other's). On that page it scrolls to the top. */
export function V3Header({ home = "/" }: { home?: string }) {
  const ref = useRef<HTMLElement>(null);
  useScrollMotion(ref, mount);
  return (
    <>
      {/* b10's UI face (Montreal Medium) on <html>: v3's buttons across the page use it too (../buttons.css) */}
      <InlineScript html={`document.documentElement.classList.add('${montrealNav.variable}')`} />
      <header ref={ref} className={`nvh ${montrealNav.variable}`}>
        <a className="nv-skip" href="#main">Skip to content</a>
        <div className="nv-bar">
          <div className="nv-pop" aria-hidden="true" />
          <span className="nv-surface" aria-hidden="true" />
          <a className="nv-logo" href={home} data-nv-home="" aria-label={UI.home}><span className="nv-mark">{MARK}</span></a>
          <nav className="nv-nav" aria-label="Primary">
            <ul className="nv-list">
              {GROUPS.map((g) => (
                <li key={g.id}>
                  <button className="nv-trig" type="button" aria-expanded="false" aria-controls={`nv-p-${g.id}`} data-panel={g.id}>
                    <span className="nv-tl">{g.name}</span>
                  </button>
                  <div className={`nv-panel nv-panel--${g.kind}`} id={`nv-p-${g.id}`} role="region" aria-label={g.name} data-panel={g.id}>
                    {g.kind === "cards" ? (
                      // Products and Stack: cards; the line says what the product is
                      <ul className="nv-cards">
                        {g.secs[0].items.map((it) => (
                          <li key={it.href}>
                            <a className="nv-card" href={it.href} data-nv-link="">
                              <i className="nv-ico" data-icon={`menu-${it.icon}`} data-icon-size="32" aria-hidden="true" />
                              <span className="nv-tx"><Name it={it} /><span className="nv-ds">{it.desc}</span></span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Resources and About: name-only rows under the group labels (their descriptions live in the map)
                      <div className="nv-cols">
                        {g.secs.map((s) => (
                          <div key={s.name} className="nv-col">
                            <p className="nv-colh">{s.name}</p>
                            <ul>
                              {s.items.map((it) => (
                                <li key={it.href}>
                                  <a className="nv-link" href={it.href} data-nv-link="">
                                    <i className="nv-ico" data-icon={`menu-${it.icon}`} data-icon-size="20" aria-hidden="true" />
                                    <span className="nv-tx"><Name it={it} /></span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nv-actions">
            <a className="nv-btn nv-cta" href={START} data-nv-start=""><span className="mag-l"><Dot />Get started</span></a>
            <button className="nv-menu" type="button" aria-expanded="false" aria-controls="nv-map" aria-haspopup="dialog">
              <span className="nv-menu-l">{UI.menu}</span><MenuIco />
            </button>
          </div>
        </div>
        <div className="nv-map" id="nv-map" role="dialog" aria-modal="true" aria-label={UI.map} hidden>
          <div className="nv-map-top">
            <a className="nv-logo nv-map-logo" href={home} data-nv-home="" aria-label={UI.home}><span className="nv-mark">{MARK}</span></a>
            <div className="nv-map-act">
              <a className="nv-btn nv-map-cta" href={START} data-nv-start=""><Dot />Get started</a>
              <button className="nv-menu nv-close" type="button" aria-expanded="true" aria-controls="nv-map">
                <span className="nv-menu-l">{UI.close}</span><MenuIco />
              </button>
            </div>
          </div>
          <div className="nv-map-body" data-lenis-prevent=""><MapGrid /></div>
        </div>
      </header>
    </>
  );
}
