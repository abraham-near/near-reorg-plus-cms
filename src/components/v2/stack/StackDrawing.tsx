import { buildStack } from "./geometry";
import styles from "./Stack.module.css";

// The isometric Stack (D6, D7, D18), rendered on the server as plain SVG: decorative (aria-hidden); the text blocks
// carry the content. Flat faces per layer (tokens: --stack-<layer>-t/l/r).
// Each layer is one group (D21): the outer group lifts on hover/selection, the inner one builds in, so a ring fades
// on as one flat image and its hidden faces never show through. After each ring, the pillar is drawn again, clipped
// to that ring's back edges (geometry.ts covers), so it stays in front of them; the cover shows with its ring.
const G = buildStack();

export function StackDrawing() {
  return (
    <svg className={styles.iso} viewBox={G.viewBox} aria-hidden="true" focusable="false" data-iso>
      <defs>
        {G.covers.map((c) => (
          <clipPath key={c.id} id={c.id}>{c.clip.map((pts, i) => <polygon key={i} points={pts} />)}</clipPath>
        ))}
      </defs>
      {G.layers.map((l) => (
        <g key={l.layer}>
          <g className={styles.c} data-tone={l.layer} data-li={l.index}>
            <g className={styles.b}>
              {l.pieces.map((p) => (
                <g key={p.key}>{p.faces.map((f) => <polygon key={f.kind} className={styles[f.kind]} points={f.points} />)}</g>
              ))}
            </g>
          </g>
          {G.covers.filter((c) => c.ring === l.index).map((c) => (
            <g key={c.id} className={styles.c} data-tone={c.layer} data-li={c.ring}>
              <g className={styles.cover} clipPath={`url(#${c.id})`}>
                {c.faces.map((f) => <polygon key={f.kind} className={styles[f.kind]} points={f.points} />)}
              </g>
            </g>
          ))}
        </g>
      ))}
      <g className={styles.c} data-tone="protocol" data-li="0">
        <g className={styles.b}>
          <image href="/brand/icon.svg" width="1" height="1" transform={G.markTransform} preserveAspectRatio="xMidYMid meet" />
        </g>
      </g>
      <g className={`${styles.c} ${styles.thread}`} data-tone="protocol" data-thread>
        <line x1={G.thread.x} y1={G.thread.y1} x2={G.thread.x} y2={G.thread.y2} />
        <circle cx={G.thread.x} cy={G.thread.y2} r="4" />
      </g>
    </svg>
  );
}
