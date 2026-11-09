// The vignettes' shared bits: loading the art (public/v1/vig2/<key>.svg, the Figma exports regrouped with hooks) and a small mount for each module.
import type { VigKey } from "./index";

const cache = new Map<VigKey, Promise<string>>();

/** the svg's text, fetched once per key per page (a failed fetch is forgotten so the next instance retries) */
function fetchArt(key: VigKey): Promise<string> {
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/v1/vig2/${key}.svg`).then((r) => {
      if (!r.ok) throw new Error(`/v1/vig2/${key}.svg ${r.status}`);
      return r.text();
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/** The module's root: <div class="v2 v2--key"> in the host, the svg injected into it when it lands (onSvg then builds the module and applies the
 *  playhead remembered so far). Returns the root and a kill: cancels the pending load, disconnects the observers added with observe(), removes the root. */
export function mountArt(key: VigKey, host: HTMLElement, onSvg: (svg: SVGSVGElement, txt: string) => void, transform?: (txt: string) => string) {
  const el = document.createElement("div");
  el.className = `v2 v2--${key}`;
  host.appendChild(el);
  let dead = false;
  const obs: ResizeObserver[] = [];
  fetchArt(key)
    .then((txt) => {
      if (dead) return;
      el.innerHTML = transform ? transform(txt) : txt;
      const svg = el.querySelector("svg");
      if (svg) onSvg(svg, txt);
    })
    .catch((e) => { if (!dead) console.warn(`[vig2 ${key}]`, e); });
  return {
    el,
    dead: () => dead,
    /** a ResizeObserver that dies with the vignette */
    observe(target: Element, cb: (w: number, h: number) => void) {
      if (dead || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver((es) => { const r = es[0].contentRect; cb(r.width, r.height); });
      ro.observe(target); obs.push(ro);
    },
    kill() {
      if (dead) return;
      dead = true;
      for (const ro of obs) ro.disconnect();
      obs.length = 0;
      el.remove();
    },
  };
}

/** a live SVGTransform on a node (its first, created if it has none) */
export function liveTf(svg: SVGSVGElement, n: SVGGraphicsElement): SVGTransform {
  const l = n.transform.baseVal;
  if (!l.numberOfItems) l.initialize(svg.createSVGTransform());
  return l.getItem(0);
}

/** querySelector / querySelectorAll on the art, typed; a missing hook throws (the art and its module go together) */
export function q(svg: SVGSVGElement) {
  return {
    $<T extends SVGElement = SVGGraphicsElement>(s: string): T {
      const e = svg.querySelector<T>(s);
      if (!e) throw new Error(`no ${s}`);
      return e;
    },
    $$<T extends SVGElement = SVGGraphicsElement>(s: string): T[] {
      return Array.prototype.slice.call(svg.querySelectorAll<T>(s));
    },
  };
}
