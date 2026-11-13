"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroTx, track, overlay, span, ease } from "./common";

// C · Horizon (D109): the picture closes onto a ridge. Two paper curtains scale in from the top and the bottom until only a slit of the film is
// left along the horizon (the plexus and dust fold into it with the picture); the slit becomes a hairline rule across the screen, the rule draws in
// to the page margins and takes the grid's + at each end, and as the intro rises the rule comes to rest just above it: the horizon becomes the
// first rule of the intro's column. After the bramus.style "image reveal" exit (inset to a 1 px slit) and the line-draw hand-off, transform only.
const AT = 0.46;   /* the horizon: a fraction of the screen's height (the mid ridges through the move) */

export function TxHorizon({ end }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage, statement, H }) => {
    const tile = statement?.querySelector<HTMLElement>(".statement__tile");
    if (!tile) return;
    const top = overlay(stage, "txh-curtain txh-curtain--t");
    const bot = overlay(stage, "txh-curtain txh-curtain--b");
    const rule = document.createElement("div");
    rule.className = "txh-rule";
    rule.setAttribute("aria-hidden", "true");
    rule.innerHTML = '<i class="txh-rule__line"></i><i class="txh-x txh-x--l"></i><i class="txh-x txh-x--r"></i>';
    document.body.appendChild(rule);
    const line = rule.children[0] as HTMLElement, xl = rule.children[1] as HTMLElement, xr = rule.children[2] as HTMLElement;

    let Y = 0, M = 80;
    const layout = () => {
      const h = H();
      Y = Math.round(h * AT);
      top.style.height = `${Y}px`;
      bot.style.height = `${h - Y}px`;
      M = Math.round(tile.getBoundingClientRect().left) || 80;   /* the intro's column */
    };
    layout();

    const p = { close: 0, draw: 0 };
    const render = () => {
      const c = ease.io1(p.close);
      top.style.transform = bot.style.transform = `scaleY(${c})`;
      // the rule takes over from the slit once the curtains have met; it draws in from the screen's edges to the intro's column
      const w = document.documentElement.clientWidth, inset = M * ease.io(p.draw);
      const shown = c >= 0.995;
      // its height: the horizon until the intro comes up to it, then 48 px above the N tile, riding with the intro
      const tileTop = tile.getBoundingClientRect().top, rest = tileTop - 56;
      // (fixed to the screen: it holds the horizon while the paper of the released stage scrolls on, until the intro's rest line comes up to it)
      const y = Math.min(Y, Math.max(rest, -10));
      rule.style.visibility = shown && y > -2 ? "visible" : "hidden";
      rule.style.transform = `translateY(${y}px)`;
      line.style.transform = `translateX(${inset}px) scaleX(${(w - 2 * inset) / w})`;
      const k = ease.out(span(p.draw, 0.45, 1));
      [xl, xr].forEach((x, i) => {
        x.style.transform = `translate(${i ? w - inset : inset}px, 0) translate(-50%, -50%) scale(${0.2 + 0.8 * k}) rotate(${(1 - k) * -90}deg)`;
        x.style.opacity = k > 0.02 ? "1" : "0";
      });
    };

    const offs = [
      track(hero, "top -70%", `top -${end - 10}%`, (v) => { p.close = v; render(); }),
      track(hero, `top -${end - 10}%`, `top -${end}%`, (v) => { p.draw = v; render(); }),
    ];
    const st = ScrollTrigger.create({ trigger: hero, start: "top top", endTrigger: statement!, end: "bottom top", onUpdate: render });
    ScrollTrigger.addEventListener("refresh", layout);
    return () => {
      offs.forEach((f) => f()); st.kill();
      ScrollTrigger.removeEventListener("refresh", layout);
      top.remove(); bot.remove(); rule.remove();
    };
  });
  return <span ref={ref} hidden />;
}
