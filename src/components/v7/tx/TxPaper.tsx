"use client";

import { useHeroTx, track, ease } from "./common";

// D · Paper over (D109): the intro is a sheet of paper that slides up over the pinned picture with a hard edge and a hairline on top (the grid's
// rule, with its + at the page margins); the film keeps running under it and drifts up a little slower than the sheet, so the picture slides
// away beneath the words rather than scrolling off with them. After GSAP's "layered pinning" (pinSpacing: false). The overlap itself is CSS
// (tx.css: the intro pulls up one screen over the stage on this page); this only moves the picture under it. Transform only.
export function TxPaper({ pin }: { pin: number; end: number }) {
  const ref = useHeroTx(({ hero, stage }) => {
    const media = stage.querySelector<HTMLElement>(".hero6__media");
    if (!media) return;
    // the last screen of the pin is the sheet covering it: the picture drifts up 25 % of a screen and settles back a touch in scale
    const off = track(hero, `top -${pin - 100}%`, `top -${pin}%`, (v) => {
      const k = ease.io1(v);
      media.style.transform = `translateY(${-25 * k}vh) scale(${1 + 0.04 * k})`;
    });
    return () => { off(); media.style.removeProperty("transform"); };
  });
  return <span ref={ref} hidden />;
}
