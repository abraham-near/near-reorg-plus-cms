import type { HTMLAttributes } from "react";
import styles from "./OwnArt.module.css";

// One small hairline drawing per "Own your …" word (D18, after Tempo's animated vector cards): ink lines, one green
// element, dark tags that restate PRODUCT.md facts. Decorative: the words beside them carry the meaning. Drawn at
// 240 × 180; the Chapter 1 thread runs down through x = 120, so each object hangs on it.
// Without data-play every drawing shows its end state (phones, reduced motion, no JS). ChapterOneMotion sets data-play
// as a word arrives, which runs the drawing's one small move.
export type OwnKey = "data" | "assets" | "intelligence" | "identity";

const Tag = ({ x, y, w, text, dot = false, className = "" }: { x: number; y: number; w: number; text: string; dot?: boolean; className?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className={`${styles.tag} ${className}`}>
      <rect width={w} height="20" rx="4" />
      {dot && <circle className={styles.g} cx="10" cy="10" r="3" />}
      <text x={dot ? 18 : 9} y="13.5">{text}</text>
    </g>
  </g>
);

// Data: a note whose lines turn to dots; a "Private" tag arrives
const ROWS = [80, 88, 64, 76];
function Data() {
  return (
    <>
      <path className={styles.k} d="M60 30h96l24 24v96H60z" />
      <path className={styles.kn} d="M156 30v24h24" />
      <path className={`${styles.soft} ${styles.lines}`} d={ROWS.map((l, i) => `M76 ${72 + i * 16}h${l}`).join("")} />
      <g className={styles.dots}>
        {ROWS.map((l, i) => Array.from({ length: Math.round(l / 9) }, (_, j) => <circle key={`${i}-${j}`} cx={78 + j * 9} cy={72 + i * 16} r="2.2" />))}
      </g>
      <Tag x={124} y={138} w={66} text="Private" dot className={styles.arrive} />
    </>
  );
}

// Assets: one account (a wallet card over the cards behind it); a "Swap" tag rides just outside the arc from one coin
// to the other, which turns green
function Assets() {
  return (
    <>
      <rect className={styles.k} x="50" y="20" width="140" height="110" rx="6" />
      <rect className={styles.k} x="44" y="36" width="152" height="118" rx="6" />
      <rect className={styles.k} x="38" y="52" width="164" height="124" rx="6" />
      <path className={styles.soft} d="M54 72h44" />
      <path className={styles.dash} d="M74 148A53.85 53.85 0 0 1 166 148" />
      <circle className={styles.k} cx="74" cy="148" r="12" /><circle className={styles.kn} cx="74" cy="148" r="7" />
      <circle className={styles.k} cx="166" cy="148" r="12" /><circle className={`${styles.kn} ${styles.coin}`} cx="166" cy="148" r="7" />
      <g className={styles.orbit}>
        <g transform="translate(48.4 132.4)">
          <g className={styles.upright}>
            <g className={styles.tag}><rect x="-22" y="-10" width="44" height="20" rx="4" /><text x="0" y="3.5" textAnchor="middle">Swap</text></g>
          </g>
        </g>
      </g>
    </>
  );
}

// Intelligence: a message drops into the enclave and a signed receipt slides out underneath
function Intelligence() {
  return (
    <>
      <g className={styles.receipt}>
        <path className={styles.k} d="M98 120V156l5.5-4 5.5 4 5.5-4 5.5 4 5.5-4 5.5 4 5.5-4 5.5 4V120z" />
        <path className={styles.soft} d="M106 130h28M106 138h20" />
        <g className={styles.tick}><circle className={styles.g} cx="132" cy="146" r="6" /><path className={styles.tickMark} d="M129 146l2 2 4-4" /></g>
      </g>
      <rect className={styles.k} x="70" y="70" width="100" height="74" rx="6" />
      <path className={styles.kn} d="M70 86h100" />
      <path className={`${styles.kn} ${styles.slot}`} d="M108 70h24" />
      <circle className={styles.kn} cx="120" cy="108" r="5" /><path className={styles.kn} d="M118 112l-2 10h8l-2-10" />
      <g className={styles.bubble}>
        <path className={styles.k} d="M98 18h44a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8h-14l-8 8v-8H98a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z" />
        <circle className={styles.ink} cx="110" cy="32" r="2" /><circle className={styles.ink} cx="120" cy="32" r="2" /><circle className={styles.ink} cx="130" cy="32" r="2" />
      </g>
      <Tag x={146} y={152} w={84} text="Signed proof" dot className={styles.arrive} />
    </>
  );
}

// Identity: an ID badge on a key ring; the key turns away and a new (green) one takes its place
function Identity() {
  const key = (cls: string) => (
    <g className={cls}>
      <circle className={styles.k} cx="146" cy="30" r="9" /><circle className={styles.kn} cx="146" cy="30" r="3" />
      <path className={styles.kn} d="M155 30h44M187 30v8M195 30v6" />
    </g>
  );
  return (
    <>
      <path className={styles.kn} d="M120 38v14" />
      <rect className={styles.k} x="70" y="52" width="100" height="94" rx="8" />
      <rect className={styles.kn} x="108" y="59" width="24" height="5" rx="2.5" />
      <circle className={styles.kn} cx="120" cy="86" r="11" />
      <path className={styles.kn} d="M112.5 94a8 6 0 0 1 15 0" />
      <text className={styles.name} x="120" y="118" textAnchor="middle">your-name</text>
      <text className={`${styles.name} ${styles.muted}`} x="120" y="133" textAnchor="middle">.near</text>
      <circle className={styles.kn} cx="120" cy="26" r="12" />
      {key(styles.oldKey)}
      {key(styles.newKey)}
      <Tag x={128} y={152} w={74} text="35+ chains" className={styles.arrive} />
    </>
  );
}

const ART = { data: Data, assets: Assets, intelligence: Intelligence, identity: Identity };

export function OwnArt({ which, className = "", ...rest }: { which: OwnKey } & HTMLAttributes<HTMLDivElement>) {
  const Art = ART[which];
  return (
    <div className={`${styles.art} ${className}`} data-art={which} aria-hidden="true" {...rest}>
      <svg viewBox="0 0 240 180" focusable="false"><Art /></svg>
    </div>
  );
}
