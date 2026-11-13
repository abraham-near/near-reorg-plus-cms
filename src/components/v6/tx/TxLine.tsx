"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroTx, track, overlay, span, ease } from "./common";

// A · The line (D109), after home-v2's original close-in (ChapterOneMotion, D29/D35): a green thread drops into the picture, two paper curtains
// scale in from the edges until only the thread is left, and the thread carries the reader into the intro. Here the thread hangs at the x of the
// intro's N tile, so when the intro rises its head lands on the tile, rides up with it, and draws back into it: the line becomes the N.
// Transform only for the curtains (scaleX from each edge, meeting exactly at the thread, no seam). The thread is fixed to the viewport so it can
// run on past the stage into the intro.
export function TxLine({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage, statement, W, H }) => {
    const tile = statement?.querySelector<HTMLElement>(".statement__tile");
    if (!tile) return;
    const curtL = overlay(stage, "txl-curtain txl-curtain--l");
    const curtR = overlay(stage, "txl-curtain txl-curtain--r");
    const thread = document.createElement("div");
    thread.className = "txl-thread";
    thread.setAttribute("aria-hidden", "true");
    thread.innerHTML = '<i class="txl-thread__line"></i><i class="txl-thread__dot"></i>';
    document.body.appendChild(thread);
    const line = thread.firstElementChild as HTMLElement, dot = thread.lastElementChild as HTMLElement;

    let X = 0;
    const layout = () => {
      const r = tile.getBoundingClientRect(), s = stage.getBoundingClientRect();
      X = Math.round(r.left + r.width / 2 - s.left);
      curtL.style.width = `${X}px`;
      curtR.style.width = `${W() - X}px`;
      thread.style.left = `${Math.round(r.left + r.width / 2)}px`;
    };
    layout();

    const p = { drop: 0, close: 0 };
    const render = () => {
      const c = ease.io1(p.close);
      curtL.style.transform = curtR.style.transform = `scaleX(${c})`;
      // the head: falls to near the screen's foot with the scroll, where the rising tile catches it; from then on it rides the tile
      const h = H(), tileTop = tile.getBoundingClientRect().top, CATCH = h * 0.86;
      const mid = CATCH * ease.out(p.drop);
      const landed = tileTop <= CATCH;
      const head = Math.max(0, landed ? tileTop : mid);
      // and draws back into the tile as the intro rises: the line's top comes down to the head
      const back = landed ? span(CATCH - tileTop, 0, h * 0.5) : 0;
      const top = head * ease.io(back);
      thread.style.visibility = p.drop > 0 && head - top > 0.5 ? "visible" : "hidden";
      line.style.transform = `translateY(${top}px) scaleY(${Math.max(0, head - top)})`;
      dot.style.transform = `translate(-50%, ${head - 5}px) scale(${landed ? 0 : 1})`;
    };

    const offs = [
      track(hero, "top -88%", `top -${end}%`, (v) => { p.drop = v; render(); }),
      track(hero, "top -92%", `top -${end}%`, (v) => { p.close = v; render(); }),
    ];
    // the hand-over follows the tile's live position, so redraw on every scroll from the stage's release until the intro has passed
    const st = ScrollTrigger.create({ trigger: hero, start: "top top", endTrigger: statement!, end: "bottom top", onUpdate: render });
    ScrollTrigger.addEventListener("refresh", layout);
    return () => {
      offs.forEach((f) => f()); st.kill();
      ScrollTrigger.removeEventListener("refresh", layout);
      curtL.remove(); curtR.remove(); thread.remove();
    };
  });
  return <span ref={ref} hidden />;
}
