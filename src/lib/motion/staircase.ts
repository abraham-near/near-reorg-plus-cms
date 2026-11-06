import { out3, s01 } from "./math";

// The staircase: the words of an element into windows (<span.gx-w><span.gx-wi>word</span></span>); spaces stay text, nested no-wrap spans stay one window, an
// .acc phrase is split inside its own span. render(P): P = 0..1 of the whole climb; the delay grows along the line and from line to line.
// Needs the global .gx-w / .gx-wi rules (globals.css). revert() puts the original nodes back.
export type Staircase = { measure: () => void; render: (p?: number) => void; revert: () => void };
export function staircase(el: HTMLElement, { dw = 0.18, dl = 0.42, dur = 1.5, span = 3.6 } = {}): Staircase {
  const original = el.innerHTML;
  const wrap = (node: Node): HTMLElement[] => {
    const out: HTMLElement[] = [];
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        (n as Text).data.split(/([ \t\n\r]+)/).forEach((t) => {
          if (!t) return;
          if (/^[ \t\n\r]+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
          const w = document.createElement("span"), i = document.createElement("span");
          w.className = "gx-w"; i.className = "gx-wi"; i.textContent = t; w.appendChild(i); f.appendChild(w); out.push(w);
        });
        (n as Text).replaceWith(f);
      } else if (n.nodeType === 1) {
        const e = n as HTMLElement;
        if (e.classList.contains("acc")) { out.push(...wrap(e)); return; }
        const w = document.createElement("span"), i = document.createElement("span");
        w.className = "gx-w"; i.className = "gx-wi"; e.replaceWith(w); i.appendChild(e); w.appendChild(i); out.push(w);
      }
    });
    return out;
  };
  const ws = wrap(el).map((w) => ({ w, i: w.firstChild as HTMLElement, L: 0, J: 0, k: -1 }));
  let fs = 1, P = 1;
  const measure = () => {
    let line = -1, top = -1e9, j = 0, mx = 0;
    ws.forEach((o) => { const t = o.w.getBoundingClientRect().top; if (t - top > 3) { line++; j = 0; top = t; } o.L = line; o.J = j++; o.k = -1; mx = Math.max(mx, o.L * dl + o.J * dw); });
    fs = Math.min(1, (span - dur) / Math.max(mx, 1e-3));
  };
  const word = (o: (typeof ws)[number], a: number) => {
    const key = Math.round(a * 240); if (o.k === key) return; o.k = key;
    const s = o.i.style;
    if (a >= 1) { s.transform = ""; s.opacity = ""; s.visibility = ""; return; }
    if (a <= 0) { s.visibility = "hidden"; return; }
    s.visibility = ""; s.transform = `translate3d(0,${((1 - out3(a)) * 105).toFixed(2)}%,0)`; s.opacity = s01(a * 1.5).toFixed(3);
  };
  const render = (p?: number) => { if (p !== undefined) P = p; const T = P * span; ws.forEach((o) => word(o, (T - (o.L * dl + o.J * dw) * fs) / dur)); };
  measure();
  return { measure, render, revert: () => { el.innerHTML = original; } };
}
