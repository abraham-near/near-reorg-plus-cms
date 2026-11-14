"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { VIEWBOX, PILLAR, CUBES, INTENTS, COM, AI, COVERS, FRONT, type Box } from "./geometry";
import { TIPS, PRODUCTS } from "./tips";
import { EDGES, UNDER_FRONT, fullEdges, type BoxEdges } from "./edges";
import "./stack-v6.css";

// Home v6's Stack drawing (D124), after the near.org CMS preview's "The NEAR Stack": v1's drawing (same geometry, same greens) with
//   - a cream outline on every face;
//   - the build: the pillar stacks up, six cubes dropping in one after another from the foot up; then the rings, green and outlined throughout, fade up
//     as they drop into place. On the pinned desktop band (D125, D127): nothing while the band comes into frame; once it lands, 01 NEAR Protocol lights and
//     the pillar drops in (a canned run); each ring then comes with its row (02 NEAR Intents, 03 NEAR AI, 04 near.com), and scrolling back takes them away.
//     Elsewhere the whole build plays when the drawing comes into view, and is put away when it goes back below;
//   - hover (mouse): everything else goes dark, its outline showing; the pillar's cubes part, the one under the pointer stays green and the others ghost;
//     an AI product lights with the rest of its ring ghosted; a box beside the pointer (the two outer rings: a pill with the name; the cubes and the
//     AI products: a card, tips.ts). Hovering a row in the list does the same for that layer, without a box.
// The pillar is drawn as v1 draws it (behind, then again over the back of each ring, clipped); while it parts, a third copy in front of everything is
// shown instead, and the rings' front boxes again over it, so the depth holds (D127): the parted cubes ghost at half, showing what is behind them. Reduced motion: no build, no transitions; the hover still works.
const H = PILLAR.height / CUBES;
const off = (i: number) => (i - MID) * GAP;            /* a parted cube's shift */
const GAP = 32, MID = 2.2;                           /* the parted cubes' extra spacing (drawing units) and the cube that stays put: more room goes below (the pillar's top is near the screen's) */

const cube = (i: number) => {
  const { half: w, rise: r } = PILLAR, y0 = i * H, y1 = y0 + H;
  return [`${-w},${y1} 0,${y1 + r} 0,${y0 + r} ${-w},${y0}`, `${w},${y1} 0,${y1 + r} 0,${y0 + r} ${w},${y0}`, `0,${y0 - r} ${w},${y0} 0,${y0 + r} ${-w},${y0}`];
};
/* a box: its three faces (fill only), then its outline (.s6-e): the faces' real edges, the joints with the rest of its piece left out (edges.ts, D131) */
const FACE = ["s6-l", "s6-r", "s6-t"];
const Faces = ({ b, e }: { b: Box; e: BoxEdges }) => (
  <>{b.map((f, k) => (e.hide[k] ? null : <polygon key={k} className={FACE[k]} points={f} />))}<path className="s6-e" d={e.e.join("")} /></>
);
/* a cube's outline (its silhouette): where the blurred view behind a ghost cube shows */
const sil = (i: number) => {
  const { half: w, rise: r } = PILLAR, y0 = i * H, y1 = y0 + H;
  return `${-w},${y0} 0,${y0 - r} ${w},${y0} ${w},${y1} 0,${y1 + r} ${-w},${y1}`;
};
/* the N on the cap: the official mark (public/v1/stack/stack-icon.svg, its glyph centred in a square), its square laid on the cap's top face by the face's own
   two edges, so it sits in the face's plane and centre; ICON, the square's share of the face (D130: 0.98, was v1's 0.82, so the N is about a fifth bigger) */
const ICON = 0.98;
const iconAt = (() => { const a = PILLAR.half * ICON, b = PILLAR.rise * ICON; return `matrix(${a},${b},${-a},${b},0,${-b})`; })();
/* the pillar, bottom cube first (each cube's top face is hidden under the cube above it). The N is part of the top cube in every copy, so it moves, fades and
   ghosts with that copy's cube and can't come apart from it (D130; it was a separate piece on top, which lost the cubes' easing and slid off the cap) */
const Pillar = ({ copy, clip }: { copy: string; clip?: string }) => (
  <g className={`s6-col s6-${copy}`} data-tone="protocol" clipPath={clip ? `url(#${clip})` : undefined}>
    {Array.from({ length: CUBES }, (_, k) => CUBES - 1 - k).map((i) => (
      <g key={i} className="s6-cube" data-cube={i} style={{ "--i": i } as CSSProperties}>
        <Faces b={cube(i) as Box} e={fullEdges(cube(i) as Box)} />
        {i === 0 && <image className="s6-icon" href="/v1/stack/stack-icon.svg" width="1" height="1" transform={iconAt} preserveAspectRatio="xMidYMid meet" />}
      </g>
    ))}
  </g>
);
/* the parted pillar's backdrop (D130): what is behind the pillar, a little blurred, shown only through its cubes (clipped to their outlines, which part with
   them), so what shows through a ghost cube is soft. Behind the pillar: the band and the rings' back boxes (their front boxes are drawn over it, sharp) */
const SOFT = 1.8;   /* the blur, in drawing units (about 1.6 px at 1440; the critic found 1.4 all but invisible at 1x) */
/* the rings' front boxes (FRONT): their faces, and their extent (the backdrop's blur region) */
const FRONT_FACES = (["intents", "ai", "com"] as const).flatMap((k) => FRONT[k].flatMap((i) => (k === "ai" ? AI[i].slice(1) : k === "intents" ? INTENTS[i] : COM[i]) as string[]));
const FRONT_BOX = (() => {
  const p = FRONT_FACES.flatMap((f) => f.split(" ").map((q) => q.split(",").map(Number)));
  const pad = 12, x = Math.min(...p.map((q) => q[0])) - pad, y = Math.min(...p.map((q) => q[1])) - pad;
  return { x, y, width: Math.max(...p.map((q) => q[0])) + pad - x, height: Math.max(...p.map((q) => q[1])) + pad - y };
})();
/* under the rings' front boxes (D131): the pillar as it is (a copy that parts and ghosts with the front copy), and the band, softened; seen through a dark
   (see-through) front box, as a ghost cube shows what is behind it. Not the rings' own back boxes: a front box is part of a tube, with no inside of its own
   piece to see (D131 critic); no other ring lies under one */
const Under = () => {
  const [x, y, vw, vh] = VIEWBOX.split(" ").map(Number);
  return (
    <g className="s6-under" clipPath="url(#stk6-under)" aria-hidden="true">
      <g filter="url(#stk6-soft-front)">
        <rect className="s6-see__bg" x={x} y={y} width={vw} height={vh} />
        <Pillar copy="behind" />
      </g>
    </g>
  );
};
/* the NEAR AI ring's extent (its blur's region) */
const AI_BOX = (() => {
  const xs: number[] = [], ys: number[] = [];
  AI.forEach(([, ...b]) => b.forEach((f) => f.split(" ").forEach((pt) => { const [x, y] = pt.split(",").map(Number); xs.push(x); ys.push(y); })));
  const pad = 12, x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
})();
/* the same behind the NEAR AI ring's ghost products (a product lit, the others ghost at a quarter): what is drawn before the ring (the band, the pillar, NEAR
   Intents), softened, seen only through the ghost boxes (the clip holds every product's boxes; the lit one's are taken out, stack-v6.css) */
const SeenAI = () => {
  const [x, y, vw, vh] = VIEWBOX.split(" ").map(Number);
  return (
    <g className="s6-see-ai" clipPath="url(#stk6-see-ai)" aria-hidden="true">
      <g filter="url(#stk6-soft-ai)">
        <rect className="s6-see__bg" x={x} y={y} width={vw} height={vh} />
        <Pillar copy="seen" />
        <Ring k="intents" />
        <Pillar copy="seen" clip="stk6-cover-intents" />
      </g>
    </g>
  );
};
const Seen = () => {
  const [x, y, vw, vh] = VIEWBOX.split(" ").map(Number);
  const back = (k: keyof typeof FRONT) => BOXES[k].map((_, i) => i).filter((i) => !FRONT[k].includes(i));
  return (
    <g className="s6-see" clipPath="url(#stk6-see)" aria-hidden="true">
      <g filter="url(#stk6-soft)">
        <rect className="s6-see__bg" x={x} y={y} width={vw} height={vh} />
        <Ring k="intents" only={back("intents")} />
        <Ring k="ai" only={back("ai")} />
        <Ring k="com" only={back("com")} />
      </g>
    </g>
  );
};

/* a ring, or some of its boxes (only: indices). NEAR AI's boxes go by product, each product one group (D131: so a ghost product fades as one piece, its
   inside faces and lines hidden; the products don't overlap on screen, so the regrouping keeps the depth) */
const BOXES = { intents: INTENTS, com: COM, ai: AI.map(([, ...b]) => b as Box) };
const SEG = AI.map(([seg]) => seg);
/* a piece's boxes: all their faces first, then all their outlines (D131 critic: drawn box by box, the next box's face covered the end of the outline
   before it, a notch at every joint along a straight edge; the outlines already leave out what the piece's later boxes hide, edges.ts) */
const Ring = ({ k, only, mark }: { k: keyof typeof BOXES; only?: number[]; mark?: boolean }) => {
  const idx = only ?? BOXES[k].map((_, i) => i);
  const at = (i: number) => ({ className: mark ? fb(k, i) : undefined, mask: mark && UNDER_FRONT[k].includes(i) ? "url(#stk6-nofront)" : undefined });
  const fill = (i: number) => { const e = EDGES[k][i]; return <g key={i} {...at(i)}>{BOXES[k][i].map((f, j) => (e.hide[j] ? null : <polygon key={j} className={FACE[j]} points={f} />))}</g>; };
  const line = (i: number) => <g key={`e${i}`} {...at(i)}><path className="s6-e" d={EDGES[k][i].e.join("")} /></g>;
  const piece = (ix: number[]) => [...ix.map(fill), ...ix.map(line)];
  return (
    <g className="s6-ring" data-ring={k} data-tone={k}>
      <g className="s6-body">
        {k === "ai" ? [...new Set(idx.map((i) => SEG[i]))].map((seg) => <g key={seg} className="s6-seg" data-seg={seg}>{piece(idx.filter((i) => SEG[i] === seg))}</g>) : piece(idx)}
      </g>
    </g>
  );
};
/* a front box (FRONT): its original hides while the copy over the parted pillar shows, so its outline isn't drawn twice */
const fb = (k: keyof typeof FRONT, i: number) => (FRONT[k].includes(i) ? "s6-fb" : undefined);

export function StackArtV6() {
  const svgRef = useRef<SVGSVGElement>(null), tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current, tip = tipRef.current;
    const root = svg?.closest<HTMLElement>("[data-stack]"), art = svg?.parentElement;
    if (!svg || !tip || !root || !art) return;
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const PINNED = matchMedia("(min-width: 1280px) and (min-height: 760px)");   /* motion.ts: the band pins and steps through the layers */
    const rings = (["intents", "ai", "com"] as const).map((k) => [...svg.querySelectorAll<SVGGElement>(`.s6-ring[data-ring="${k}"]`)]);   /* each ring and its front boxes' copy (.s6-over) */
    const all = (sel: string) => svg.querySelectorAll<SVGElement>(sel);

    // ---- the build
    let cubesIn = 0, ringsIn = 0, built = false;
    const showCubes = (n: number) => { cubesIn = n; for (let i = 0; i < CUBES; i++) all(`.s6-cube[data-cube="${i}"]`).forEach((e) => e.toggleAttribute("data-in", i >= CUBES - n)); };
    /* a ring comes in green, outlined, from the first frame (data-fill: it can be hovered), fading up as it drops into place (stack-v6.css; D127: no dark phase) */
    const showRing = (k: number, on: boolean) => rings[k].forEach((r) => { r.toggleAttribute("data-in", on); r.toggleAttribute("data-fill", on); });
    /* the target, from the scroll. Pinned (desktop: motion.ts pins the band for 1.8 screens and steps the list, a quarter each): nothing while the band comes
       into frame (and no row lit: data-s6-pre); once it lands (the pin starts), 01 NEAR Protocol lights and the pillar drops in, a canned run of its six cubes;
       then each ring just after its row takes over (02 NEAR Intents, 03 NEAR AI, 04 near.com). Scrolling back takes them away in the same places (D127).
       Elsewhere: when the drawing comes into view (the observer below), the whole build plays */
    const PIN = 1.8, RINGS = [0.255, 0.505, 0.755];
    let entered = false, landed = false;
    const target = () => {
      if (!PINNED.matches) { root.removeAttribute("data-s6-pre"); return entered ? { c: CUBES, r: 3 } : { c: 0, r: 0 }; }
      const p = -root.getBoundingClientRect().top / (PIN * window.innerHeight);
      landed = p >= (landed ? -0.02 : 0);                       /* landed at the pin's start; let go a little above it, so a to-and-fro on the line doesn't flicker it */
      root.toggleAttribute("data-s6-pre", !landed);
      if (!landed) return { c: 0, r: 0 };
      /* a ring goes only 3 % (about 50 px) back of where it came, so scrolling to and fro on the line doesn't flicker it */
      return { c: CUBES, r: RINGS.filter((t, k) => p >= (k < ringsIn ? t - 0.03 : t)).length };
    };
    /* step toward the target one piece at a time (a jump still shows the pieces one by one): building, the cubes then the rings; taking away, the rings then the cubes */
    let stepping = 0, raf = 0;
    /* once built, a list row hovered meanwhile (data-hl, written while the pillar was still coming in) lights now */
    const setBuilt = () => { const was = built; built = cubesIn === CUBES; if (built && !was) { if (over && lastMove) onMove(lastMove); else syncHl(); } };
    const sync = () => {
      if (RM) return;
      /* the drawing out of sight (a fling past it): no show to play, go straight to the target */
      const sr = svg.getBoundingClientRect();
      if (sr.bottom < 0 || sr.top > window.innerHeight) {
        window.clearTimeout(stepping); stepping = 0;
        const t = target();
        for (let k = 2; k >= t.r; k--) if (k < ringsIn) showRing(k, false);
        ringsIn = Math.min(ringsIn, t.r); showCubes(t.c);
        for (; ringsIn < t.r; ringsIn++) showRing(ringsIn, true);
        setBuilt(); if (!built) setLit(null);
        return;
      }
      /* a step already waiting: it reads the target when it runs, so the scroll doesn't hurry the run (a cube every 190 ms holds while scrolling) */
      if (stepping) return;
      const go = () => {
        stepping = 0;
        const t = target();
        if (ringsIn > t.r || (ringsIn > 0 && cubesIn > t.c)) { ringsIn--; showRing(ringsIn, false); }
        else if (cubesIn > t.c) showCubes(cubesIn - 1);
        else if (cubesIn < t.c) showCubes(cubesIn + 1);
        else if (ringsIn < t.r) { showRing(ringsIn, true); ringsIn++; }
        else { setBuilt(); return; }
        setBuilt();
        if (!built) setLit(null);
        const t2 = target();
        if (t2.c !== cubesIn || t2.r !== ringsIn) stepping = window.setTimeout(go, t2.c > cubesIn ? 190 : t2.c < cubesIn ? 70 : 240);   /* the pillar's canned drop: a cube every 190 ms (D129; was 140), away at 70 */
      };
      go();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); }); };

    let io: IntersectionObserver | null = null, near: IntersectionObserver | null = null;
    if (RM) { showCubes(CUBES); built = true; ringsIn = 0; for (let k = 0; k < 3; k++) { showRing(k, true); ringsIn++; } }
    else {
      svg.setAttribute("data-build", "");
      /* unpinned: built when the drawing's top comes 18 % above the screen's foot, put away when it goes back below it (an observer, not a ScrollTrigger:
         this mounts before the pins above it exist, so a trigger's start would be measured thousands of px early) */
      io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) entered = true; else if (en.boundingClientRect.top > 0) entered = false;
        sync();
      }, { rootMargin: "0px 0px -18% 0px" });
      io.observe(svg);
      /* the scroll is followed only while the band is within a screen and a half (D134: this ran on every scroll of the whole page); leaving, one last sync
         puts the drawing in its state for where the page now is */
      near = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) window.addEventListener("scroll", onScroll, { passive: true });
        else { window.removeEventListener("scroll", onScroll); onScroll(); }
      }, { rootMargin: "150% 0px" });
      near.observe(root);
      window.addEventListener("resize", onScroll);
    }
    const moLayer = new MutationObserver(() => syncHl());
    moLayer.observe(root, { attributes: true, attributeFilter: ["data-hl"] });
    const onPin = () => sync();
    PINNED.addEventListener("change", onPin);

    // ---- the highlight
    let litKey = "", over = false, lastMove: PointerEvent | null = null;   /* the pointer's last place over the drawing: what to light once built, if it's resting there */
    function setLit(kind: string | null, sub?: string) {
      const key = kind ? `${kind}:${sub ?? ""}` : "";
      if (key === litKey) return; litKey = key;
      svg!.querySelectorAll("[data-on]").forEach((e) => e.removeAttribute("data-on"));
      if (kind) svg!.setAttribute("data-lit", kind); else svg!.removeAttribute("data-lit");
      if (kind === "ai" && sub) svg!.setAttribute("data-seg-lit", sub); else svg!.removeAttribute("data-seg-lit");
      if (kind === "cube") all(`.s6-cube[data-cube="${sub}"]`).forEach((e) => e.setAttribute("data-on", ""));
      if (kind === "ai" && sub) all(`.s6-seg[data-seg="${sub}"]`).forEach((e) => e.setAttribute("data-on", ""));
      svg!.toggleAttribute("data-spread", kind === "cube");
      /* the newly lit piece runs hot for a moment, then settles to its own green (D130; stack-v6.css s6-hot) */
      svg!.querySelectorAll("[data-hot]").forEach((e) => e.removeAttribute("data-hot"));
      if (!kind || RM) return;
      const hot = kind === "cube" ? `.s6-cube[data-cube="${sub}"]` : kind === "col" ? ".s6-col .s6-cube" : kind === "ai" && sub ? `.s6-seg[data-seg="${sub}"]` : `.s6-ring[data-ring="${kind}"]`;
      void svg!.getBoundingClientRect();   /* the old state seen, so the same piece lit again runs hot again */
      all(hot).forEach((e) => e.setAttribute("data-hot", ""));
    }
    const onHotEnd = (e: AnimationEvent) => { if (e.animationName === "s6-hot") (e.target as Element).closest("[data-hot]")?.removeAttribute("data-hot"); };
    svg.addEventListener("animationend", onHotEnd);
    /* a row of the list hovered (motion.ts writes the band's data-hl): the same highlight, no box */
    function syncHl() {
      if (over) return;
      const hl = root!.getAttribute("data-hl");
      const k = ["intents", "ai", "com"].indexOf(hl ?? "");
      /* only what has come in: a row for a ring not yet in (or the pillar mid-build) lights nothing, rather than putting the whole drawing out */
      setLit(hl === "protocol" && built ? "col" : k >= 0 && rings[k][0].hasAttribute("data-fill") ? hl : null);
    }
    const [vx, vy, vw, vh] = VIEWBOX.split(" ").map(Number);
    const toDrawing = (e: PointerEvent) => { const r = svg.getBoundingClientRect(); return { x: vx + ((e.clientX - r.left) * vw) / r.width, y: vy + ((e.clientY - r.top) * vh) / r.height }; };
    /* while the cubes are parted, the pointer anywhere over the parted column (gaps too) is on its nearest cube, so the column doesn't fold shut in a gap */
    const partedCube = (x: number, y: number) => {
      if (Math.abs(x) > PILLAR.half) return -1;
      const top = -PILLAR.rise + off(0), bottom = PILLAR.height + PILLAR.rise + off(CUBES - 1);
      if (y < top || y > bottom) return -1;
      let best = 0, d = Infinity;
      for (let i = 0; i < CUBES; i++) { const c = i * H + H / 2 + off(i), dd = Math.abs(y - c); if (dd < d) { d = dd; best = i; } }
      return best;
    };
    const hit = (e: PointerEvent): [string, string?] | null => {
      if (svg.hasAttribute("data-spread")) {
        const p = toDrawing(e), lit = litKey.startsWith("cube:") ? Number(litKey.slice(5)) : -1;
        /* the lit cube holds while the pointer is anywhere it has been on its way out (unparted to parted), so the end cubes, which move furthest, don't slip from under it */
        if (lit >= 0 && Math.abs(p.x) <= PILLAR.half && p.y >= lit * H - PILLAR.rise + Math.min(0, off(lit)) && p.y <= (lit + 1) * H + PILLAR.rise + Math.max(0, off(lit))) return ["cube", String(lit)];
        const i = partedCube(p.x, p.y); if (i >= 0) return ["cube", String(i)];
      }
      const t = e.target instanceof Element ? e.target : null;
      const c = t?.closest<SVGElement>(".s6-cube[data-in]");
      if (c && built) return ["cube", c.dataset.cube];
      const s = t?.closest<SVGElement>(".s6-ring[data-fill] .s6-seg");
      if (s) return PRODUCTS.has(s.dataset.seg!) ? ["ai", s.dataset.seg] : ["ai"];   /* a box that is no product of its own (tips.ts) lights the whole ring */
      const r = t?.closest<SVGElement>(".s6-ring[data-fill]");
      if (r) return [r.dataset.ring!];
      return null;
    };
    const showTip = (key: string | null, e: PointerEvent) => {
      const d = key ? TIPS[key] : null;
      if (!d) { tip.removeAttribute("data-show"); return; }
      if (tip.dataset.key !== key) {
        tip.dataset.key = key!; tip.dataset.kind = d.kind ?? "card";
        tip.querySelector(".s6-tip__t")!.textContent = d.title;
        const set = (sel: string, text?: string) => { const el = tip.querySelector<HTMLElement>(sel)!; el.textContent = text ?? ""; el.hidden = !text; };
        set(".s6-tip__sub", d.sub); set(".s6-tip__body", d.body); set(".s6-tip__note", d.note);
        /* the facts: a row each, label and value (D131) */
        const rows = tip.querySelector<HTMLElement>(".s6-tip__rows")!;
        rows.replaceChildren(...(d.rows ?? []).flatMap(([l, v]) => { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = l; dd.textContent = v; return [dt, dd]; }));
        rows.hidden = !d.rows?.length;
      }
      /* beside the pointer, as on the reference (D127): 16 px right of it, centred on it; left of it where it would run off the screen's right; kept on screen */
      const a = art.getBoundingClientRect(), w = tip.offsetWidth, ht = tip.offsetHeight, gap = 16;
      const x = e.clientX + gap + w <= window.innerWidth - 8 ? e.clientX + gap : e.clientX - gap - w;
      const y = Math.min(Math.max(e.clientY - ht / 2, 8), window.innerHeight - 8 - ht);
      tip.style.transform = `translate(${Math.round(x - a.left)}px, ${Math.round(y - a.top)}px)`;
      tip.setAttribute("data-show", "");
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      over = true; lastMove = e;
      const h = hit(e);
      if (!h) { setLit(null); showTip(null, e); return; }
      setLit(h[0], h[1]);
      showTip(h[0] === "cube" ? `cube${h[1]}` : h[1] ?? h[0], e);
    };
    const onLeave = () => { over = false; lastMove = null; tip.removeAttribute("data-show"); setLit(null); syncHl(); };
    svg.addEventListener("pointermove", onMove);
    /* the drawing moving under a still pointer (a scroll) gives no pointermove, only pointerover: take it as a move. Otherwise motion.ts's pointerover
       writes data-hl, the row's highlight lights the pillar, the lit pillar takes no pointer, the pointer is "out", the light goes off, and round again,
       every frame (the critic's strobe, D130) */
    svg.addEventListener("pointerover", onMove);
    svg.addEventListener("pointerleave", onLeave);

    return () => {
      window.clearTimeout(stepping); cancelAnimationFrame(raf); io?.disconnect(); moLayer.disconnect(); PINNED.removeEventListener("change", onPin);
      near?.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll);
      svg.removeEventListener("pointermove", onMove); svg.removeEventListener("pointerover", onMove); svg.removeEventListener("pointerleave", onLeave); svg.removeEventListener("animationend", onHotEnd);
      svg.removeAttribute("data-build"); root.removeAttribute("data-s6-pre");
    };
  }, []);

  return (
    <>
      <svg ref={svgRef} className="stk-iso stk6" viewBox={VIEWBOX} aria-hidden="true" focusable="false" data-iso="" style={{ "--s6-gap": `${GAP}px`, "--s6-mid": MID } as CSSProperties}>
        <defs>
          {(["intents", "ai", "com"] as const).map((k) => (
            <clipPath key={k} id={`stk6-cover-${k}`}>{COVERS[k].map((p, i) => <polygon key={i} points={p} />)}</clipPath>
          ))}
          <clipPath id="stk6-see">{Array.from({ length: CUBES }, (_, i) => <polygon key={i} className="s6-sil" points={sil(i)} style={{ "--i": i } as CSSProperties} />)}</clipPath>
          {/* the rings' front boxes, cut out of the back boxes they cover (UNDER_FRONT) */}
          <mask id="stk6-nofront" maskUnits="userSpaceOnUse" {...(([x, y, width, height]) => ({ x, y, width, height }))(VIEWBOX.split(" ").map(Number))}>
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="#fff" />
            {/* with the faces' own 1 px same-colour edge (stack-v6.css), so no sliver of the back box is under a see-through front box's edge */}
            {FRONT_FACES.map((f, i) => <polygon key={i} points={f} fill="#000" stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
          </mask>
          <clipPath id="stk6-under">{FRONT_FACES.map((f, i) => <polygon key={i} points={f} />)}</clipPath>
          <filter id="stk6-soft-front" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" {...FRONT_BOX}><feGaussianBlur stdDeviation={SOFT} /></filter>
          <clipPath id="stk6-see-ai">{AI.map(([seg, ...b], i) => b.map((f, j) => <polygon key={`${i}-${j}`} className="s6-sil-ai" data-for={seg} points={f} />))}</clipPath>
          <filter id="stk6-soft-ai" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" {...AI_BOX}><feGaussianBlur stdDeviation={SOFT} /></filter>
          {/* the blur's region: the pillar's column, over the whole of its parting */}
          <filter id="stk6-soft" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" x={-PILLAR.half - 12} y={-PILLAR.rise + off(0) - 12}
            width={2 * PILLAR.half + 24} height={PILLAR.height + 2 * PILLAR.rise + off(CUBES - 1) - off(0) + 24}>
            <feGaussianBlur stdDeviation={SOFT} />
          </filter>
        </defs>
        <Pillar copy="base" />
        <Ring k="intents" mark />
        <Pillar copy="cover" clip="stk6-cover-intents" />
        <SeenAI />
        <Ring k="ai" mark />
        <Pillar copy="cover" clip="stk6-cover-ai" />
        <Ring k="com" mark />
        <Pillar copy="cover" clip="stk6-cover-com" />
        <Seen />
        <Pillar copy="front" />
        {/* the rings' front boxes again, over the parted pillar (shown with it): what is in front of the pillar stays in front while it parts (D127) */}
        <Under />
        <g className="s6-over">
          <Ring k="intents" only={FRONT.intents} />
          <Ring k="ai" only={FRONT.ai} />
          <Ring k="com" only={FRONT.com} />
        </g>
        {/* the hovered cube once more, over everything (the rings' front boxes too): only it shows (D129) */}
        <Pillar copy="top" />
      </svg>
      <div ref={tipRef} className="s6-tip" aria-hidden="true">
        <span className="s6-tip__h"><span className="s6-tip__dot" /><span className="s6-tip__t" /></span>
        <span className="s6-tip__sub" hidden />
        <span className="s6-tip__body" hidden />
        <dl className="s6-tip__rows" hidden />
        <span className="s6-tip__note" hidden />
      </div>
    </>
  );
}
