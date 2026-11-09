import { clamp, io2, mulberry32, s01 } from "@/lib/motion/math";
import { scrub, setter, type Mount } from "@/lib/motion/scroll";

/**
 * The Stack's outro and the strip's entry, unpinned and scrubbed (reversible).
 * 1. The Stack's dark runs on into the strip's top padding as a dot field (13 px grid, 11 on phones) whose dots shrink from the bottom up while the section's top
 *    goes from the bottom of the screen to 45 % of it (a straight front with a little per-dot jitter): the paper rises under them, the air is clean before the figures.
 * 2. Each figure fades in, a beat after the one before it, as its rule draws left -> right and its tick appears.
 */
export const mount: Mount = (root, { reduced }) => {
  if (reduced) return;
  const figs = root.querySelector<HTMLElement>(".pf-figs");
  if (!figs) return;
  root.setAttribute("data-pf", "");

  // the dot field: a canvas over the top padding
  const cv = document.createElement("canvas");
  cv.className = "pf-band"; cv.setAttribute("aria-hidden", "true");
  root.prepend(cv);
  const c2 = cv.getContext("2d");
  const dark = getComputedStyle(root).getPropertyValue("--dark").trim() || "#262626";

  type Grid = { W: number; H: number; cs: number; R0: number; nx: number; ny: number; jit: Float32Array; ox: number };
  let G: Grid | null = null, dpr = 1, q = 0, lastQ = -1;

  function layout() {
    const W = root.clientWidth, H = parseFloat(getComputedStyle(root).paddingTop) || 120;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
    const cs = W <= 760 ? 11 : 13, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 1;
    const rnd = mulberry32(1517), jit = new Float32Array(nx * ny);
    for (let k = 0; k < jit.length; k++) jit[k] = rnd();
    G = { W, H, cs, R0: cs * 0.75, nx, ny, jit, ox: (((W / 2) % cs) + cs) % cs - cs };
    lastQ = -1; draw();
  }

  function draw() {
    if (!G || !c2 || q === lastQ) return;
    lastQ = q;
    const { W, H, cs, R0, nx, ny, jit, ox } = G, c = c2;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (q >= 1) return;
    // the front: per row from the bottom, a band 70 % of the air wide, jittered (t 0 = dark, 1 = gone)
    const F = q * 1.9;
    c.fillStyle = dark; c.beginPath();
    for (let j = 0; j < ny; j++) {
      const y = j * cs, fromBottom = 1 - y / H;
      for (let i = 0; i < nx; i++) {
        const t = clamp((F - fromBottom * 0.9 - jit[j * nx + i] * 0.25) / 0.7, 0, 1);
        const r = R0 * (1 - s01(t)); if (r < 0.25) continue;
        const x = ox + i * cs; c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832);
      }
    }
    c.fill();
  }

  scrub(root, "top bottom", "top 45%", (p) => { q = p; draw(); }, layout);

  // the figures: fade in one after another while their rules draw
  const cells = [...root.querySelectorAll<HTMLElement>(".pf-cell")].map((cell) => ({ cell, val: cell.querySelector<HTMLElement>(".pf-value") }));
  const set = setter();
  const run = (p: number) => cells.forEach(({ cell, val }, i) => {
    const a = s01((p - i * 0.12) / 0.5), r = io2((p - 0.05 - i * 0.12) / 0.5);
    set(cell, "--a", a); set(cell, "--y", 1 - a);
    if (val) { set(val, "--rl", r); set(val, "--tk", clamp(r * 4, 0, 1)); }
  });
  scrub(figs, "clamp(top 88%)", "clamp(top 52%)", run);

  let tm = 0;
  const onResize = () => { window.clearTimeout(tm); tm = window.setTimeout(layout, 200); };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize); window.clearTimeout(tm);
    cv.remove(); root.removeAttribute("data-pf");
    cells.forEach(({ cell, val }) => { ["--a", "--y"].forEach((k) => cell.style.removeProperty(k)); if (val) ["--rl", "--tk"].forEach((k) => val.style.removeProperty(k)); });
  };
};
