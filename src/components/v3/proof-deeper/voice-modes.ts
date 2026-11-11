// v4's options for the voices (ProofDeeper's data-vmode) that play without v3's long scene (the bleed is one screen, the photo the plain bleed's):
//   - marquee: two rows of glass cards slide across in opposite directions; scrolling pushes them faster for a moment; pointing at a row slows it to a stop;
//   - pins: each voice is a pin on the ridges; the one on turns green and its ring fills while it plays (6 s, then the next); a line draws from it up to
//     its words, which come in word by word out of a blur; the photo leans a little towards it. Pointing at or focusing a pin shows that voice and holds it.
// Reduced motion: both stay as plain lists (voice-modes.css).
export function mountVoiceMode(vb: HTMLElement, mode: string, reduced: boolean): () => void {
  if (reduced) return () => {};
  return mode === "pins" ? mountPins(vb) : mountMarquee(vb);
}

/** watches whether the section is in view (half of it, or the whole screen) */
function watch(el: HTMLElement, set: (v: boolean) => void) {
  const io = new IntersectionObserver(([e]) => set(e.isIntersecting && e.intersectionRect.height > Math.min(innerHeight, e.boundingClientRect.height) * 0.5), { threshold: [0, 0.25, 0.5, 0.75, 1] });
  io.observe(el);
  return io;
}

function mountMarquee(vb: HTMLElement) {
  const ac = new AbortController(), on = { signal: ac.signal }, onP = { signal: ac.signal, passive: true };
  const rows = [...vb.querySelectorAll<HTMLElement>(".l-mq__row")].map((r, k) => ({
    r, tr: r.querySelector<HTMLElement>(".l-mq__track")!, dir: k ? -1 : 1, x: 0, w: 0, hold: false, sp: 1,
  }));
  const SPEED = 36;   // px a second at rest
  let boost = 0, lastY = scrollY, last = performance.now(), seen = false, raf = 0;
  vb.classList.add("is-mode");
  const measure = () => rows.forEach((o, k) => { o.w = o.tr.scrollWidth / 3; if (!o.x) o.x = k ? o.w * 0.5 : 0; });
  measure();
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - last) / 1000; last = now;
    if (!seen) return;
    boost *= Math.pow(0.04, dt);   // the push fades in about a second
    rows.forEach((o) => {
      o.sp += ((o.hold ? 0 : 1) - o.sp) * Math.min(1, dt * 5);
      if (!o.w) return;
      o.x = (((o.x + o.dir * (SPEED + boost) * o.sp * dt) % o.w) + o.w) % o.w;
      o.tr.style.transform = `translate3d(${(-o.x).toFixed(2)}px,0,0)`;
    });
  };
  addEventListener("scroll", () => { const y = scrollY; boost = Math.min(900, boost + Math.abs(y - lastY) * 4); lastY = y; }, onP);
  addEventListener("resize", measure, onP);
  document.fonts?.ready.then(measure);
  rows.forEach((o) => {
    o.r.addEventListener("pointerenter", () => { o.hold = true; }, on);
    o.r.addEventListener("pointerleave", () => { o.hold = false; }, on);
  });
  const io = watch(vb, (v) => { seen = v; if (v) last = performance.now(); });
  raf = requestAnimationFrame(loop);
  return () => {
    ac.abort(); io.disconnect(); cancelAnimationFrame(raf); vb.classList.remove("is-mode");
    rows.forEach((o) => { o.tr.style.transform = ""; });
  };
}

/** the words of a quote, each in its own span (.l-w, --i its place) so they can come in one after another; a no-break group stays one. Returns the undo. */
function splitWords(p: HTMLElement): () => void {
  const html = p.innerHTML, frag = document.createDocumentFragment();
  let k = 0;
  const word = (n: Node) => { const s = document.createElement("span"); s.className = "l-w"; s.style.setProperty("--i", String(k++)); s.append(n); frag.append(s); };
  [...p.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) (n.textContent || "").split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) frag.append(" "); else word(document.createTextNode(t)); });
    else word(n.cloneNode(true));
  });
  p.replaceChildren(frag);
  return () => { p.innerHTML = html; };
}

/** where an element sits inside `root` (layout offsets: transforms and translate do not count, so a quote still moving in measures at rest) */
function offs(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0, e: HTMLElement | null = el;
  while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent as HTMLElement | null; }
  return { x, y };
}

function mountPins(vb: HTMLElement) {
  const ac = new AbortController(), on = { signal: ac.signal }, onP = { signal: ac.signal, passive: true };
  const stage = vb.querySelector<HTMLElement>(".l-voices__stage")!;
  const qs = [...vb.querySelectorAll<HTMLElement>(".l-vq")], pins = [...vb.querySelectorAll<HTMLButtonElement>(".l-pin")];
  const rings = pins.map((b) => b.querySelector<SVGRectElement>(".l-pin__ring rect")!);
  const svg = vb.querySelector<SVGSVGElement>(".l-pinline"), path = svg?.querySelector("path"), dot = svg?.querySelector("circle");
  const nn = vb.querySelector<HTMLElement>(".l-voices__nn");
  const n = qs.length, DUR = 6000;
  let i = -1, t = 0, last = performance.now(), seen = false, hold = false, raf = 0;
  vb.classList.add("is-mode");
  const undo = qs.map((q) => splitWords(q.querySelector("p")!));
  path?.setAttribute("pathLength", "1");
  /* the line: from just above the pin, up to the caption's height, then across to the end of the caption */
  const line = (draw: boolean) => {
    if (!svg || !path || !dot || i < 0) return;
    const pin = pins[i], q = qs[i], who = q.querySelector<HTMLElement>(".l-who"), end = who?.lastElementChild as HTMLElement | null;
    if (!who || !end) return;
    const pc = offs(pin, stage), e = offs(end, stage), w = offs(who, stage);
    const px = pc.x, py = pc.y - 14, tx = e.x + end.offsetWidth + 18, ty = w.y + who.offsetHeight / 2;
    path.setAttribute("d", `M${px.toFixed(1)} ${py.toFixed(1)} V${ty.toFixed(1)} H${tx.toFixed(1)}`);
    dot.setAttribute("cx", tx.toFixed(1)); dot.setAttribute("cy", ty.toFixed(1));
    if (draw) { svg.classList.remove("is-draw"); void svg.getBoundingClientRect(); svg.classList.add("is-draw"); }
  };
  const ring = () => rings.forEach((r, k) => { r.style.strokeDashoffset = k === i ? (1 - Math.min(1, t / DUR)).toFixed(4) : "1"; });
  const go = (j: number) => {
    if (j === i) return;
    qs.forEach((q, k) => {
      if (k === j) { q.removeAttribute("data-out"); q.setAttribute("data-on", ""); }
      else if (q.hasAttribute("data-on")) { q.removeAttribute("data-on"); q.setAttribute("data-out", ""); }
      else q.removeAttribute("data-out");
    });
    pins.forEach((b, k) => b.toggleAttribute("aria-current", k === j));
    if (nn) nn.style.transform = `translateY(${(-100 * j) / n}%)`;
    /* the photo leans towards the pin */
    const x = parseFloat(pins[j].style.left) || 50, y = parseFloat(pins[j].style.top) || 50;
    vb.style.setProperty("--px", `${((50 - x) * 0.05).toFixed(2)}%`); vb.style.setProperty("--py", `${((50 - y) * 0.04).toFixed(2)}%`);
    i = j; t = 0; ring(); line(true);
  };
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - last); last = now;
    if (!seen || hold || document.hidden) return;
    t += dt;
    if (t >= DUR) go((i + 1) % n); else ring();
  };
  pins.forEach((b, k) => {
    b.addEventListener("pointerenter", () => { hold = true; go(k); }, on);
    b.addEventListener("pointerleave", () => { hold = false; }, on);
    b.addEventListener("focus", () => { hold = true; go(k); }, on);
    b.addEventListener("blur", () => { hold = false; }, on);
    b.addEventListener("click", () => go(k), on);
  });
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = window.setTimeout(() => line(false), 120); }, onP);
  document.fonts?.ready.then(() => line(false));
  const io = watch(vb, (v) => { seen = v; if (v) last = performance.now(); if (v && i < 0) go(0); });
  raf = requestAnimationFrame(loop);
  return () => {
    ac.abort(); io.disconnect(); cancelAnimationFrame(raf); clearTimeout(rz); vb.classList.remove("is-mode");
    undo.forEach((f) => f());
    qs.forEach((q) => { q.removeAttribute("data-on"); q.removeAttribute("data-out"); });
    pins.forEach((b) => b.removeAttribute("aria-current")); rings.forEach((r) => { r.style.strokeDashoffset = ""; });
    svg?.classList.remove("is-draw"); vb.style.removeProperty("--px"); vb.style.removeProperty("--py");
    if (nn) nn.style.transform = "";
  };
}
