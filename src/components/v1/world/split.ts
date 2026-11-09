// The statement's words (r13/lib/split.js).
// splitStatement(section) wraps every word of the statement <h2> in a mask: <span class="st__w"><span class="st__wi">word</span></span> (whitespace stays real text nodes between them,
// so the accessible text of the <h2> is unchanged and whole). visual = the words grouped by what you SEE, one array per visual line (regroup() recomputes it: on desktop the
// 5 .st__l lines, on phones the text re-wraps and they are found by position). undo() puts the original text nodes back (React owns them).
export type WordInner = HTMLElement & { _li?: number; _wi?: number };
export type Statement = {
  el: HTMLElement; h2: HTMLElement; lines: HTMLElement[]; words: HTMLElement[]; inner: WordInner[];
  mark: HTMLElement | null; nmark: SVGSVGElement | null; visual: WordInner[][];
  regroup(): WordInner[][]; undo(): void;
};

export function splitStatement(section: HTMLElement): Statement {
  const h2 = section.querySelector<HTMLElement>(".st")!, lines = [...h2.querySelectorAll<HTMLElement>(".st__l")], words: HTMLElement[] = [], inner: WordInner[] = [];
  const walker = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT), nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const swaps: { node: Text; parts: Node[] }[] = [];
  for (const node of nodes) {
    const parts = (node.nodeValue || "").split(/(\s+)/);
    if (parts.length === 1 && !parts[0].trim()) continue;
    const frag = document.createDocumentFragment(), made: Node[] = [];
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { const t = document.createTextNode(" "); frag.appendChild(t); made.push(t); continue; }
      const w = document.createElement("span"), i = document.createElement("span");
      w.className = "st__w"; i.className = "st__wi"; i.textContent = p;
      w.appendChild(i); frag.appendChild(w); words.push(w); inner.push(i); made.push(w);
    }
    if (!made.length) continue;
    node.parentNode!.replaceChild(frag, node);
    swaps.push({ node, parts: made });
  }
  const api: Statement = {
    el: section, h2, lines, words, inner, mark: h2.querySelector<HTMLElement>(".st__mark"), nmark: section.querySelector<SVGSVGElement>(".statement__n"), visual: [], regroup,
    undo() {
      for (const { node, parts } of swaps) { const first = parts[0]; if (first.parentNode) first.parentNode.insertBefore(node, first); parts.forEach((p) => p.parentNode?.removeChild(p)); }
      swaps.length = 0;
    },
  };
  function regroup() {
    const v: WordInner[][] = []; let top = -1e9;
    for (const w of words) {
      const t = w.getBoundingClientRect().top;       // the mask wrappers never carry transforms
      if (Math.abs(t - top) > 6) { v.push([]); top = t; }
      v[v.length - 1].push(w.firstChild as WordInner);
    }
    api.visual = v;
    v.forEach((row, li) => row.forEach((el, wi) => { el._li = li; el._wi = wi; }));
    return v;
  }
  regroup();
  return api;
}
