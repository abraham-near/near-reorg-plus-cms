// Revenue A's isometric (IsoBuyback.tsx), in motion. Like the rail's vignettes: the pieces arrive once (the floor's edges draw, its grid comes up line by
// line, the plates settle, the coins drop onto the plate and into the stack, the arc draws, the chips pop, their green dots last), then a quiet loop runs
// only while the art is in view: a fee coin appears on the plate, the stack's top coin lifts up the dotted line and fades (bought back), the fee coin hops
// along the arc into its place; the arc's dashes flow towards the stack. At the loop's seam the hopped coin and the restored top coin are the same picture.
// Reduced motion: nothing runs; the markup is the resting frame.
import type { gsap as G } from "gsap";

export function mountIso(svg: SVGSVGElement, gsap: typeof G, arrive: boolean) {
  const $ = <T extends Element>(s: string) => svg.querySelector<T>(s)!, $$ = (s: string) => [...svg.querySelectorAll<SVGElement>(s)];
  const arc = $<SVGPathElement>(".rva-iso-arc"), am = $<SVGPathElement>(".rva-iso-am"), hop = $<SVGGElement>(".rva-iso-hop"), top = $<SVGGElement>(".rva-iso-top");
  const chips = $$(".rva-iso-chip"), dots = $$(".rva-iso-dot");
  const x0 = Number(svg.dataset.arcX0), y0 = Number(svg.dataset.arcY0), lift = Number(svg.dataset.lift);
  const L = arc.getTotalLength();
  chips.forEach((c) => gsap.set(c, { svgOrigin: `${c.dataset.cx} ${c.dataset.cy}` }));

  /* the loop (paused; played while in view) */
  const o = { t: 0 };
  const place = () => { const p = arc.getPointAtLength(o.t * L); hop.setAttribute("transform", `translate(${(p.x - x0).toFixed(2)} ${(p.y - y0).toFixed(2)})`); };
  const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });
  loop.set(o, { t: 0, onComplete: place }, 0)
    .fromTo(hop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "sine.out" }, 0)
    .to(top, { y: -lift, duration: 1.5, ease: "power2.inOut" }, 0.8)
    .to(top, { opacity: 0, duration: 0.9, ease: "sine.in" }, 1.4)
    .to(dots[1] || [], { scale: 1.6, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.3)
    .to(o, { t: 1, duration: 1.5, ease: "power2.inOut", onUpdate: place }, 1.5)
    .to(dots[0] || [], { scale: 1.6, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.5)
    .set(top, { y: 0, opacity: 1 }, 3.6)
    .set(hop, { opacity: 0 }, 3.6)
    .set(o, { t: 0, onComplete: place }, 3.6);
  const flow = gsap.to(arc, { strokeDashoffset: -6, duration: 1.2, ease: "none", repeat: -1, paused: true });

  let seen = false, ready = !arrive;
  const sync = () => { const on = seen && ready; if (on) { loop.play(); flow.play(); } else { loop.pause(); flow.pause(); } };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.15 });
  io.observe(svg);

  /* the arrival: hidden now, run() brings it in */
  let run = () => {};
  if (arrive) {
    const edges = $$(".rva-iso-edge"), grid = $$(".rva-iso-gl"), plates = $$(".rva-iso-plate"), fees = $$(".rva-iso-fee"), stack = $$(".rva-iso-sc");
    gsap.set(edges, { strokeDasharray: "1 1", strokeDashoffset: 1 });
    const fill = $<SVGElement>(".rva-iso-fill"), guide = $<SVGElement>(".rva-iso-guide");
    gsap.set([fill, guide, ...grid], { opacity: 0 });
    gsap.set(plates, { y: -16, opacity: 0 });
    gsap.set([...fees, ...stack], { y: -14, opacity: 0 });
    gsap.set(am, { strokeDashoffset: 1 });
    gsap.set(chips, { scale: 0.9, opacity: 0 });
    gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
    run = () => {
      const tl = gsap.timeline({ delay: 0.2, onComplete: () => { ready = true; sync(); } });
      tl.to(edges, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0)
        .to(fill, { opacity: 1, duration: 0.6, ease: "sine.out" }, 0.1)
        .to(grid, { opacity: 1, duration: 0.5, ease: "sine.out", stagger: 0.035 }, 0.2)
        .to(plates, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.14 }, 0.45)
        .to(stack, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.09 }, 0.85)
        .to(fees, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.09 }, 0.95)
        .to(am, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 1.4)
        .to(guide, { opacity: 1, duration: 0.6, ease: "sine.out" }, 1.6)
        .to(chips, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.12 }, 1.8)
        .to(dots, { scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 }, 2.05);
    };
  }
  return { run, kill: () => io.disconnect() };
}
