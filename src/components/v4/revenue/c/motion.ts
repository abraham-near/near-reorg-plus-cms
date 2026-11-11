// Option C's motion. The band (scrubbed by the scroll, worked only while near the view): twelve columns of the Stack's ink, one per grid column (six on
// phones), retract upward as the band rises, the centre ones first and the outer ones after, each foot carrying a fine emerald line while it moves, so
// the paper opens like the bars of a chart; fully open once the band's top is 30 % down the view. The dashboard lights once, calmly, when its row
// arrives: the gauge's dots fill round to the capture share; the chart's columns fill from the foot, then the line runs to the total; the 30-day dot rows
// draw out (CSS, .is-lit). The rows' rules, crosshairs and the text rising are ProofDeeper's (data-row / data-rv). Reduced motion, or a row already above
// the view: the band open (a straight edge between ink and paper) and the final dots.
import type { MotionCtx } from "@/lib/motion/scroll";
import { canvas, drawChart, drawGauge, fit, type Cv } from "./dots";

const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const FROM = 0.92, TO = 0.3;   // the band's top, as a share of the view: the columns start to retract / are all open
const SPREAD = 0.45;           // how much of the scrub the centre-out stagger takes

export function mount(root: HTMLElement, { reduced, gsap, ScrollTrigger }: MotionCtx) {
  const ac = new AbortController();
  let dead = false, raf = 0, near = false;
  const melt = root.querySelector<HTMLElement>(".rvc-melt");
  const chart = canvas(root.querySelector<HTMLCanvasElement>(".rvc-plot__c"));
  const gauge = canvas(root.querySelector<HTMLCanvasElement>(".rvc-dial__c"));
  const st = { chart: 1, gauge: 1 };
  if (!reduced) root.setAttribute("data-armed", "");

  /* ── the band: each column's open share (0 closed .. 1 retracted out of the band), written only when it changes ── */
  const cols = melt ? [...melt.querySelectorAll<HTMLElement>(".rvc-col")] : [];
  const memo = new Map<HTMLElement, string>();
  const paintBand = () => {
    if (!melt || reduced) return;
    const shown = cols.filter((c) => c.offsetWidth > 0), n = shown.length, mid = (n - 1) / 2;
    const vh = innerHeight, top = melt.getBoundingClientRect().top, p = c01((vh * FROM - top) / (vh * (FROM - TO)));
    shown.forEach((c, i) => {
      const d = mid ? Math.abs(i - mid) / mid : 0, k = ease(c01((p - d * SPREAD) / (1 - SPREAD)));
      const v = k.toFixed(4);
      if (memo.get(c) === v) return;
      memo.set(c, v);
      c.style.transform = `translate3d(0, ${(-k * 100).toFixed(3)}%, 0)`;
      c.style.setProperty("--edge", Math.min(1, k * 14, (1 - k) * 14).toFixed(3));
    });
  };
  const frame = () => { raf = 0; if (!dead) paintBand(); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
  if (melt && !reduced) {
    const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) queue(); }, { rootMargin: "200px 0px 200px 0px" });
    io.observe(melt);
    ac.signal.addEventListener("abort", () => io.disconnect());
    addEventListener("scroll", () => { if (near) queue(); }, { passive: true, signal: ac.signal });
    addEventListener("resize", () => { memo.clear(); queue(); }, { passive: true, signal: ac.signal });
    paintBand();
  }

  /* ── sizes (and the first paint): every canvas follows its box ── */
  const paintAll = () => {
    if (chart && fit(chart)) drawChart(chart, st.chart);
    if (gauge && fit(gauge)) drawGauge(gauge, st.gauge);
  };
  const ro = new ResizeObserver(() => { if (!dead) paintAll(); });
  [chart, gauge].forEach((cv) => cv && ro.observe(cv.el));
  ac.signal.addEventListener("abort", () => ro.disconnect());

  /* ── the dashboard lights once ── */
  const rowA = root.querySelector<HTMLElement>(".rvc-a"), rowB = root.querySelector<HTMLElement>(".rvc-b");
  const light = (row: HTMLElement | null, key: "chart" | "gauge", cv: Cv | null, draw: (cv: Cv, p: number) => void, dur: number, ease: string) => {
    if (!row) return;
    const done = () => { row.classList.add("is-lit"); st[key] = 1; if (cv?.w) draw(cv, 1); };
    if (reduced || row.getBoundingClientRect().bottom < 0) { done(); return; }
    st[key] = 0; if (cv?.w) draw(cv, 0);
    ScrollTrigger.create({
      trigger: row, start: "top 72%", once: true,
      onEnter: () => {
        row.classList.add("is-lit");
        const o = { p: 0 };
        gsap.to(o, { p: 1, duration: dur, delay: 0.35, ease, onUpdate: () => { st[key] = o.p; if (cv?.w) draw(cv, o.p); } });
      },
    });
  };
  light(rowA, "gauge", gauge, drawGauge, 1.6, "power2.inOut");
  light(rowB, "chart", chart, drawChart, 2.6, "none");

  paintAll();
  return () => { dead = true; cancelAnimationFrame(raf); ac.abort(); root.removeAttribute("data-armed"); };
}
