"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { playSteps } from "./steps";
import { addLook } from "./lookMotion";
import type { RailLook } from "./RailLooks";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOTION = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

// D97: every block of words on the rail comes on and goes off the same way, line by line: each line rises 70% of its
// height into place as it fades in, the next a beat later; leaving, each lifts 40 px as it fades. ON and OFF are the
// tweens; GAP_ON and GAP_OFF the beats between lines (timeline units, 100 in all).
const ON = { yPercent: 0, autoAlpha: 1, duration: 3, ease: "power3.out" } as const;
const FROM = { yPercent: 70, autoAlpha: 0 } as const;
const OFF = { y: -40, autoAlpha: 0, duration: 2.4, ease: "power1.in" } as const;
const GAP_ON = 0.9, GAP_OFF = 0.5;
// Words (inline-block spans) grouped into the lines they wrap onto
function lines(words: HTMLElement[]) {
  const rows = new Map<number, HTMLElement[]>();
  words.forEach((w) => { const k = Math.round(w.offsetTop); rows.set(k, [...(rows.get(k) ?? []), w]); });
  return [...rows.keys()].sort((x, y) => x - y).map((k) => rows.get(k)!);
}
// The hand-over (see StoryRailMotion): depth as a share of the line's rise. The line, its green, the tiles, the box and
// the dark hung from it are nearest (1, so they move with the page); the world's drawing, words and hairlines and the
// answer behind them a third of that; the ridges and mist, farthest, a seventh. EASE_IN: the vh over which the line
// gets up to the page's speed (it covers half of it, so the rise is HANDOVER - EASE_IN at full speed).
const DEPTH = { near: 1, mid: 0.32, far: 0.14 } as const;
const EASE_IN = 12;
// The Stack's arrival after the hand-over. Its band overlaps the track's end by OVERLAP vh (Stack.module.css), so its
// top is FAR = handover + 100 - OVERLAP vh down the screen as the hand-over starts. Each block of the section starts
// LOW vh further below its resting place (on top of the band's own travel) and settles into it; the lower blocks come
// from further down, so they close up into place behind the heading, and the drawing grows from SCALE. Where the
// section pins (tall screens) its blocks land at rest; elsewhere they land already moving with the page.
const OVERLAP = 47;
const LOW = { head: 75, intro: 82, list: 95, panels: 100, art: 85 } as const;
const SCALE = 0.9;
const PINNED = "(min-width: 1280px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
const SHORT = "(min-width: 1280px) and (max-height: 759px) and (prefers-reduced-motion: no-preference)";
// A block's offset from its place in the band, as an ease over the arrival (t: 0 → 1). With u = 1 - t (the band's top,
// as a share of FAR), the block sits LOW·u² below its resting place on the screen, so it closes in fastest early on
// and comes to rest with no speed left where the section pins; on short screens it keeps the page's speed as it
// lands (the extra term), since the section scrolls on from there.
const settle = (low: number, far: number, pinned: boolean) => (t: number) => {
  const u = 1 - t, off = low * u * u - far * u + (pinned ? 0 : far * u * (1 - u) ** 4);
  return 1 - off / (low - far);
};
const comeOn = (tl: gsap.core.Timeline, rows: Element[][], at: number) =>
  rows.forEach((r, i) => tl.fromTo(r, FROM, { ...ON, immediateRender: false }, at + i * GAP_ON));
const goOff = (tl: gsap.core.Timeline, rows: Element[][], at: number) =>
  rows.forEach((r, i) => tl.to(r, OFF, at + i * GAP_OFF));

// Option C's choreography (D29, D38): one scrubbed timeline over the pinned stage, 100 units long (6.2 screens of
// scroll). The world moves in steps (eased between holds), so each thing on the line stops at the centre to be read.
export function StoryRailMotion({ gate, stations, handover, look }: { gate: number; stations: number[]; end?: number; handover: number; look: RailLook }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>("section");
    if (!root) return;
    const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(`[data-s="${s}"]`)!;
    const qa = (s: string) => [...root.querySelectorAll<HTMLElement>(`[data-s="${s}"]`)];

    // The story runs to `handover` vh before the track's end; the hand-over to the Stack takes the rest (5, 6)
    const lead = () => (window.innerHeight * handover) / 100;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const world = q("world"), problem = q("problem"), near = q("near");
      const pWords = [...problem.children], aWords = [...q("answer").children];
      const dots = qa("dot"), stops = qa("station"), arts = [...root.querySelectorAll<HTMLElement>("[data-s='station'] [data-art]")];
      // Bring a point on the track (in vw) to the middle of the screen
      const centre = (at: number) => () => -(window.innerWidth * (at - 50)) / 100;
      gsap.set([q("greenL"), q("greenR")], { scaleX: 0 });
      gsap.set(q("greenL"), { transformOrigin: "0% 50%" });
      gsap.set(q("greenR"), { transformOrigin: "100% 50%" });
      gsap.set([q("hub"), q("gateTile"), ...dots], { scale: 0 });
      gsap.set(qa("end"), { autoAlpha: 0 });
      gsap.set([...pWords, ...aWords], FROM);
      // Only the station being read shows; its neighbours are just their dots on the line (half-drawings cut by the
      // screen's edges read as bugs, and dimmed text would fail contrast)
      const words = stops.map((st) => [...st.querySelectorAll<HTMLElement>("[data-s='words']")]);
      const pics = stops.map((st) => st.querySelector<HTMLElement>("[data-art]")!);
      gsap.set(pics, { autoAlpha: 0 });
      gsap.set(words.flat(), FROM);

      // 0. D96, D97 (Lawrence: "I want this type to animate up into position…"; then "the type should animate on later,
      //    its too soon so I don't see it, it should happen as the scroll starts to ease to its locked position"): the
      //    three lines rise into place one after another over the last stretch before the section locks and the first
      //    moments after, scrubbed (their inner spans, so the lines' own exit on the main timeline is untouched)
      gsap.fromTo(qa("cin"), FROM, {
        ...ON, stagger: 0.3, duration: 1,
        scrollTrigger: { trigger: root, start: "top 30%", end: "top -20%", scrub: 0.6 },
      });

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: root, start: "top top", end: () => `bottom-=${lead()} bottom`, scrub: 0.6, invalidateOnRefresh: true } });
      // 1. The two sides appear and the line draws in from both into NEAR's tile, under the three lines
      tl.to(qa("end"), { autoAlpha: 1, duration: 3, stagger: 1 }, 0)
        .to([q("greenL"), q("greenR")], { scaleX: 1, duration: 7, ease: "power2.inOut" }, 1)
        //    (held on screen a while once the tile has landed: the meeting is the beat)
        .to(q("hub"), { scale: 1, duration: 2, ease: "back.out(1.6)" }, 7.5)
        // 2. The world slides to the layer beneath your agents
        .to(world, { x: centre(gate), duration: 12, ease: "power2.inOut" }, 17)
        //    (D99, Lawrence: "the green line to the right of the near green box can fade out as we start scrolling
        //    leaving the black line": the green that came in from blockchain fades as the slide starts)
        .to(q("greenR"), { autoAlpha: 0, duration: 4, ease: "power1.inOut" }, 17);
      // (D97: every block of words comes on and goes off line by line, the same way; the three lines go first)
      goOff(tl, [[q("c0")], [q("c1")], [q("c2")]], 15);
      // the problem rises on at the top and holds; then lifts off, and the answer rises into its place the moment it
      // has gone (no empty beat, and never the two at once) and stays; the layer becomes the user's
      const pRows = lines(pWords as HTMLElement[]), aRows = lines(aWords as HTMLElement[]);
      comeOn(tl, pRows, 22);
      goOff(tl, pRows, 40);
      comeOn(tl, aRows, 40 + (pRows.length - 1) * GAP_OFF + OFF.duration);
      tl
        //    (D86: the drawing reads --own each frame, 0 the problem, 1 the answer, and eases its own change on a
        //    spring, so the scrub itself runs straight; from-to, so the problem holds before it. It starts as the
        //    problem starts leaving and lands, with the N, as "user-owned." finishes)
        .fromTo(near, { "--own": 0 }, { "--own": 1, duration: 8, ease: "none" }, 40)
        //    (D95: NEAR's tile lands on the line under the layer as its disc turns green; it leaves with the line)
        .to(q("gateTile"), { scale: 1, duration: 2, ease: "back.out(1.6)" }, 45.5);
      // 4. Station by station: the world moves on, the station's dot lands in the box and its drawing plays
      const STEPS = [62, 72, 82, 92];
      STEPS.forEach((at, i) => {
        tl.to(world, { x: centre(stations[i]), duration: 6, ease: "power2.inOut" }, at - 6)
          .to(dots[i], { scale: 1, duration: 2, ease: "back.out(2)" }, at - 1.5)
          .to(pics[i], { autoAlpha: 1, duration: 4 }, at - 4);
        comeOn(tl, words[i].map((w) => [w]), at - 3);
        if (i > 0) {
          tl.to(pics[i - 1], { autoAlpha: 0, duration: 3, ease: "power1.in" }, at - 6);
          goOff(tl, words[i - 1].map((w) => [w]), at - 6);
        }
      });
      tl.to({}, { duration: 2 }, 98);
      // The look's own layers and moves (D32), and its parallax on every update
      const parallax = addLook(look, { tl, root, world, gateX: centre(gate), steps: STEPS });
      // A drawing plays from the moment it starts to fade in (at − 4), so it never shows its end state first and then
      // resets (D56: Orbit's sequence starts from empty)
      // D100 (Lawrence: "the green line should start in the middle of the black box … and extend to the left, we don't
      // see it on the right of it… The behavior of the line in … the Own Your 4 sections is the behavior I want
      // everywhere"): once drawn in from AI, the green rides with the reader, from the left edge to the box's middle,
      // by cancelling the world's travel on it (it stays under the tiles, which are in the world above it)
      const setGreen = gsap.quickSetter(q("greenL"), "x", "px");
      const update = () => { parallax(); setGreen(-Number(gsap.getProperty(world, "x"))); };

      // 5. The hand-over to the Stack (Lawrence: "that line should feel like it's in the foreground and start to move
      //    up over the background and the imagery that's behind it … turn to the dark gray of the four layers, one
      //    system background as a transition from that horizontal line downwards … The green box with the black stroke
      //    around it, that stays in the middle, and we see that the entire time"). Over the track's last `handover` vh,
      //    scrubbed exactly (no smoothing: the line moves with the page, as the Stack's band does below it):
      //    - the line, its green and ticks, the identity tile and the box lift off as one, easing up to the page's
      //      speed and reaching the top of the screen as the stage lets go, so they carry on up with the page;
      //    - the Stack's ink hangs from the line: it drops from the line to the foot of the screen (accelerating away
      //      from the line), then rises with it, covering the words, the drawing, the ridges and the answer;
      //    - everything behind moves up more slowly, by depth (DEPTH), so the line passes over it;
      //    - the box's lower half and the ticks turn light where the ink comes under them.
      //    The band overlaps the track's end (Stack.module.css) and comes up over the stage once the ink fills the
      //    screen below the line (same token, so its edge never shows), bringing its heading up under the line.
      const opt = (s: string) => root.querySelector<HTMLElement>(`[data-s="${s}"]`); // a look's own parts, if it has them
      const rail = q("rail"), curtain = q("curtain");
      const front = [rail, q("greenL"), dots[dots.length - 1], curtain, opt("ticks"), opt("ticksDark")].filter((e): e is HTMLElement => !!e);
      const playhead = opt("playhead"), back = root.querySelector<HTMLElement>("[data-depth]")?.parentElement;
      // The drawing's corners go with the drawing; the answer, high on the screen, hangs back with the ridges, so the
      // line passes over it as it reaches the top rather than the answer leaving first
      const mids = [opt("finder")].filter((e): e is HTMLElement => !!e), fars = [q("answer"), back].filter((e): e is HTMLElement => !!e);
      const vh = (n: number) => (window.innerHeight * n) / 100;
      const ho = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: () => `bottom-=${lead()} bottom`, end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
      });
      // (units: vh of scroll) Each layer rises by its depth's share of the line's rise: the line eases up to the page's
      // speed over EASE_IN (a quadratic, so it covers half of that and leaves at exactly the page's speed), then rides
      // with it to the top of the screen (the line's own top on the stage), arriving as the track ends. Plain tweens
      // (not a proxy read on update), so a refresh restores them with the scroll. The world's own rise is the middle
      // depth, so what is nearest in it moves the rest of the way.
      const rise = (targets: HTMLElement | HTMLElement[], k: number) => {
        if (Array.isArray(targets) && !targets.length) return;
        ho.to(targets, { y: () => -k * vh(EASE_IN / 2), ease: "power1.in", duration: EASE_IN }, 0)
          .to(targets, { y: () => -k * rail.offsetTop, duration: handover - EASE_IN }, EASE_IN);
      };
      rise(world, DEPTH.mid);
      rise(front, DEPTH.near - DEPTH.mid);
      if (playhead) rise(playhead, DEPTH.near);
      rise(mids, DEPTH.mid);
      rise(fars, DEPTH.far);
      // The ink drops from the line to the foot of the screen, accelerating away from it (a cubic): it reaches the foot
      // about 20vh in, before the band comes up behind it (Stack.module.css: 23vh in), so their edges never meet on
      // screen, and the Stack's words start to show on it from 18vh, inside it (6)
      ho.fromTo(curtain, { scaleY: 0 }, { scaleY: 1, ease: "power2.in", duration: 26 }, 0);
      // The ticks (4–10 px under the line) and the box's lower half (28 px) turn light as the ink passes under them
      const ticksDark = opt("ticksDark"), boxDark = opt("playheadDark");
      if (ticksDark) ho.fromTo(ticksDark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2 }, 1);
      if (boxDark) ho.fromTo(boxDark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 3 }, 2.5);
      return playSteps(tl, arts, STEPS.map((s) => (s - 4) / 100), update);
    });
    // 6. The Stack arrives (Lawrence: "tighten it and have it feel like there is depth and the four layers is animating
    //    up into position"): the band's edge still comes up only once the ink fills the screen, but its content travels
    //    ahead of it, over the ink, close under the line: each block from its own depth (LOW), its words line by line
    //    (D97), the drawing growing into place. Scrubbed exactly with the scroll from the hand-over's start until the
    //    band reaches the top of the screen, where the section's own pinned steps take over (StackInteractions).
    const band = root.nextElementSibling instanceof HTMLElement && root.nextElementSibling.matches("[data-stack]") ? root.nextElementSibling : null;
    const arrive = gsap.matchMedia();
    if (band) arrive.add({ pinned: PINNED, short: SHORT }, (ctx) => {
      const pinned = !!ctx.conditions?.pinned;
      const qs = (s: string) => band.querySelector<HTMLElement>(s);
      const head = qs("h2"), intro = qs("header p"), list = qs("[role='tablist']"), panels = qs("[role='tabpanel']")?.parentElement;
      const art = qs("[data-stack-art]"), threads = [...band.querySelectorAll<HTMLElement>("[data-stack-thread]")];
      if (!head || !intro || !list || !panels || !art) return;
      const far = handover + 100 - OVERLAP;
      const vh = (n: number) => (window.innerHeight * n) / 100;
      const at = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: () => `bottom-=${lead()} bottom`, endTrigger: band, end: "top top", scrub: true, invalidateOnRefresh: true },
      });
      // (units: vh of scroll, `far` in all) Each block from its depth to its place
      const place = (el: HTMLElement | HTMLElement[], low: number) =>
        at.fromTo(el, { y: () => vh(low - far) }, { y: 0, duration: far, ease: settle(low, far, pinned) }, 0);
      place(head, LOW.head); place(intro, LOW.intro); place(list, LOW.list); place(panels, LOW.panels);
      place([art, ...threads], LOW.art);
      at.fromTo(art, { scale: SCALE, transformOrigin: "50% 0%" }, { scale: 1, duration: far, ease: settle(LOW.art, far, pinned) }, 0);
      // Shown once the ink is under them: the words line by line (D97), the blocks fading up
      const rowsOf = (el: HTMLElement) => lines([...el.querySelectorAll<HTMLElement>(":scope > *")]);
      const rise = (rows: Element[][], from: number) => rows.forEach((r, i) => at.fromTo(r, FROM, { ...ON, duration: 12, immediateRender: true }, from + i * 4));
      rise(rowsOf(head), 18);
      rise(rowsOf(intro), 22);
      at.fromTo([list, panels], { autoAlpha: 0 }, { autoAlpha: 1, duration: 14, stagger: 3, ease: "power1.out" }, 25)
        .fromTo([art, ...threads], { autoAlpha: 0 }, { autoAlpha: 1, duration: 16, ease: "power1.out" }, 22);
    });
    return () => { mm.revert(); arrive.revert(); };
  }, { scope: anchor });

  return <span ref={anchor} hidden />;
}
