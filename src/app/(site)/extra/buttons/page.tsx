import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../Selector.module.css";
import b from "./buttons.module.css";
import { INVENTORY, type Btn, type Kind } from "./inventory";
import { Proposals } from "./Proposals";
import { Button, TextLink } from "@/components/ui";

export const metadata: Metadata = { title: "Buttons" };

// Every button on the live pages (inventory.ts), grouped by kind, each with its crops at rest and on hover, where it appears, its files and what its
// hover does; then the proposals for one system (Proposals.tsx). A working page for the unification, listed at /extra.
const KINDS: { k: Kind; title: string; note: string }[] = [
  { k: "pill", title: "Pills", note: "Filled or outlined buttons with a rounded or boxed shape: the calls to action." },
  { k: "link", title: "Links", note: "Text buttons: a word or two, often with an arrow, no box." },
  { k: "icon", title: "Icon buttons", note: "A glyph alone: arrows, close, play, menu, carousel controls." },
  { k: "tab", title: "Tabs and toggles", note: "Pick one of several: tabs, segmented controls, view switches." },
  { k: "chip", title: "Chips and tags", note: "Small pills that filter or label." },
  { k: "other", title: "Others", note: "Everything that is a button but none of the above." },
];

function Item({ x }: { x: Btn }) {
  const crop = (src: string | undefined, label: string) => (
    <figure className={b.crop}>
      <span>{label}</span>
      <div className={`${b.shot}${x.dark ? ` ${b.dark}` : ""}`}>{src ? <img src={src} alt={`${x.name}, ${label}`} loading="lazy" /> : <i className={b.empty}>no crop</i>}</div>
    </figure>
  );
  const places = <ul className={b.places}>{x.places.map((p, i) => <li key={i}><b>{p.page}</b> · {p.where}</li>)}</ul>;
  return (
    <li className={b.item} id={x.id}>
      <div className={b.crops}>{crop(x.img, "rest")}{crop(x.imgHover, "hover")}</div>
      <h3 className={b.name}>{x.name}<span className={b.tag}>{x.places.length} {x.places.length === 1 ? "place" : "places"}</span></h3>
      <dl className={b.dl}>
        <dt>Label</dt><dd>{x.label}</dd>
        <dt>Look</dt><dd>{x.look}</dd>
        <dt>Hover</dt><dd>{x.hover}</dd>
        <dt>Where</dt><dd>{x.places.length > 5
          ? <details className={b.more}><summary>{x.places.slice(0, 3).map((p) => p.page).join(", ")} and {x.places.length - 3} more</summary>{places}</details>
          : places}</dd>
        <dt>Class</dt><dd className={b.code}>{x.classes}</dd>
        <dt>Files</dt><dd className={b.code}>{x.files.map((f) => <div key={f}>{f}</div>)}</dd>
      </dl>
    </li>
  );
}

export default function ButtonsPage() {
  const groups = KINDS.map((g) => ({ ...g, items: INVENTORY.filter((x) => x.kind === g.k) })).filter((g) => g.items.length);
  const places = INVENTORY.reduce((n, x) => n + x.places.length, 0);
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/extra" aria-label="Extra pages"><img className={styles.logo} src="/brand/logo.svg" alt="NEAR" width={88} height={23} /></Link>
        <Link className={styles.toplink} href="/extra"><span aria-hidden="true">←</span> Extra pages</Link>
      </header>

      <div className={styles.intro}>
        <h1 className={styles.h}>Buttons<span className={styles.sq} aria-hidden="true" /></h1>
        <p className={styles.sub}>{INVENTORY.length} distinct button designs in {places} places across the live pages, then proposals to make them one system.</p>
      </div>

      <section id="system" className={b.sec} aria-labelledby="system-t">
        <h2 id="system-t" className={b.h2}>The system</h2>
        <p className={b.note}>What the site uses now: Button (P1 · ink pill, the dot opens) and TextLink (L3 · arrow relay), from src/components/ui.</p>
        <div className={b.sys}>
          <div className={b.sysRow}>
            <Button href="#system">Get started</Button><Button href="#system" variant="secondary">Read the docs</Button>
            <Button href="#system" size="md">Medium</Button><Button href="#system" size="sm" variant="secondary">Small</Button>
            <Button href="https://near.org" external variant="secondary">near.org</Button>
            <TextLink href="#system">Read the docs</TextLink><TextLink href="https://near.org" external>near.org</TextLink>
          </div>
          <div className={`${b.sysRow} ${b.sysDark}`} data-ui-tone="dark">
            <Button href="#system">Get started</Button><Button href="#system" variant="secondary">Read the docs</Button>
            <Button href="#system" size="md">Medium</Button><Button href="#system" size="sm" variant="secondary">Small</Button>
            <TextLink href="#system">Read the docs</TextLink><TextLink href="https://near.org" external>near.org</TextLink>
          </div>
          <p className={b.note} style={{ maxWidth: "52ch" }}>Inline: the link sits in running text and wraps, <TextLink href="#system" inline>like this link that runs long enough to break onto the next line</TextLink>, and the arrow rides its last line.</p>
        </div>
      </section>

      <nav aria-label="Kinds">
        <ul className={b.kinds}>
          {groups.map((g) => <li key={g.k}><a href={`#k-${g.k}`}>{g.title}<span>{g.items.length}</span></a></li>)}
          <li><a href="#proposals">Proposals</a></li>
          <li><a href="#system">The system</a></li>
        </ul>
      </nav>

      {groups.map((g) => (
        <section key={g.k} id={`k-${g.k}`} className={b.sec} aria-labelledby={`k-${g.k}-t`}>
          <h2 id={`k-${g.k}-t`} className={b.h2}>{g.title}</h2>
          <p className={b.note}>{g.note}</p>
          <ul className={b.list}>{g.items.map((x) => <Item key={x.id} x={x} />)}</ul>
        </section>
      ))}

      <section id="proposals" className={b.sec} aria-labelledby="proposals-t">
        <h2 id="proposals-t" className={b.h2}>Proposals</h2>
        <p className={b.note}>Five pills, five links and other variants: some in the site&apos;s current language, some with more invention. Hover each one.</p>
        <Proposals />
      </section>
    </main>
  );
}
