import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../Selector.module.css";
import s from "./StackLooks.module.css";
import { LOOKS } from "@/components/v6/stack/looks";
import { StackLookSvg } from "@/components/v6/stack/looks/StackLookSvg";

export const metadata: Metadata = { title: "Home v6 · Stack looks" };

// The Stack drawing in other looks (D148): still frames, on the band's grey, in the selector's language (../../Selector.module.css). The 3D ones are
// path-traced stills (public/stack-looks); the SVG ones are drawn here. /home-v6 is unchanged.
export default function StackLooks() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/" aria-label="Homepage directions"><img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} /></Link>
        <div className={styles.topr}>
          <a className={styles.toplink} href="/home-v6">/home-v6 <span aria-hidden="true">→</span></a>
          <Link className={styles.toplink} href="/"><span aria-hidden="true">←</span> Homepage directions</Link>
        </div>
      </header>

      <div className={styles.intro}>
        <h1 className={styles.h}>The Stack, six looks<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>The same drawing, the same view and framing, on the band’s grey: today’s, then five others, each with today’s in its corner to compare. The 3D ones are rendered from the drawing’s own model with real light, so they sit exactly where today’s does; the SVG ones are drawn here. Still frames: no build, no hover. /home-v6 is unchanged.</p>
      </div>

      <ul className={s.grid}>
        {LOOKS.map((l, i) => (
          <li key={l.key} className={s.item}>
            <div className={s.frame}>
              {l.img
                ? <img className={s.art} src={`/stack-looks/stack-look-${l.key}.webp`} alt={`The Stack drawing, ${l.name.toLowerCase()}`} width={1316} height={1566} loading={i < 3 ? "eager" : "lazy"} />
                : l.svg && <StackLookSvg className={s.art} look={l.svg} id={`sl-${l.key}`} />}
              {l.key !== "now" && (
                <span className={s.today} aria-hidden="true"><StackLookSvg className={s.art} look="flat" id={`sl-${l.key}-today`} /><span className={s.tl}>Today</span></span>
              )}
            </div>
            <div className={styles.meta}>
              <span className={styles.n}>{String(i).padStart(2, "0")}</span>
              <span className={styles.path}>{l.img ? "Rendered" : "SVG"}</span>
            </div>
            <h2 className={s.name}>{l.name}</h2>
            <p className={styles.note}>{l.note}</p>
            <p className={s.ships}><span className={s.k}>Ships as</span>{l.ships}</p>
            {l.tag && <span className={styles.tags}><span className={styles.tag}>{l.tag}</span></span>}
            {l.refs.length > 0 && (
              <ul className={s.refs} aria-label={`References for ${l.name}`}>
                {l.refs.map((r) => <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer">{r.label} <span aria-hidden="true">↗</span></a></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
