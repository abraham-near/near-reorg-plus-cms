// The rail's tide, handed to the Stack band that asks for it (data-enter, home v6: v6/stack/StackEnterV6.tsx). D134: a plain object, not custom properties
// on the band: a custom property set on the band restyled all its ~1,600 elements (the drawing's SVG) every frame of the tide.
//   y  where the green line is on the screen (px)
//   f  where the dark ends (the wipe's edge, or the screen's foot) (px)
//   q  how far the Stack's text has to go (0 at its start, 1 as the line and its tile have left the top)
export type Tide = { y: number; f: number; q: number };
export const TIDES = new WeakMap<HTMLElement, Tide>();
