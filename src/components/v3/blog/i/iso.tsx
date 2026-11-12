// Blog I's two small drawings, in foundation-d's isometric hand (../../../foundation/d/iso.tsx, reused as is; colours: blog-i.css .bli-iso).
// IsoStack (the head): prints stacked on a dotted floor, the top one marked green, a reader beside them, a dark tag.
// IsoDesk (the board): prints laid out on a floor, one green, a dashed arc between two, a reader.
import { Box, Chip, Coin, DotFloor, Floor, P, Person, Quad, arc, chipW, vb, type V } from "../../../foundation/d/iso";

const Svg = ({ view, children }: { view: string; children: React.ReactNode }) => (
  <svg className="bli-iso" viewBox={view} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">{children}</svg>
);

export function IsoStack() {
  const chip: V = [P(0, 0)[0] - 10, P(40, 30, 64)[1] - 34];
  const F: V[] = [P(0, 0), P(150, 0), P(150, 120), P(0, 120), P(40, 30, 64), chip, [chip[0] + chipW("NEAR BLOG"), chip[1]]];
  return (
    <Svg view={vb(F, 8)}>
      <DotFloor w={150} d={120} step={7} />
      <Box x={30} y={26} w={70} d={52} h={6} />
      <Box x={36} y={22} z={8} w={64} d={48} h={6} />
      <Box x={28} y={30} z={16} w={66} d={46} h={6} />
      <Box x={34} y={26} z={24} w={60} d={44} h={6} tone="green" />
      <Quad x={42} y={34} z={30} w={30} d={4} cls="i-slot" />
      <Quad x={42} y={42} z={30} w={40} d={2.5} cls="i-slot" />
      <Quad x={42} y={48} z={30} w={34} d={2.5} cls="i-slot" />
      <Coin x={118} y={40} r={8} h={4} />
      <Coin x={118} y={40} z={4} r={8} h={4} tone="green" />
      <Person x={112} y={92} />
      <Chip at={chip} label="NEAR BLOG" />
    </Svg>
  );
}

export function IsoDesk() {
  const a = P(44, 46, 4), b = P(150, 92, 4);
  const F: V[] = [P(0, 0), P(200, 0), P(200, 150), P(0, 150), [a[0], a[1] - 60]];
  return (
    <Svg view={vb(F, 8)}>
      <Floor w={200} d={150} n={10} />
      <Box x={22} y={24} w={44} d={44} h={4} />
      <Box x={92} y={18} w={34} d={52} h={4} />
      <Box x={128} y={74} w={44} d={36} h={4} tone="green" />
      <Box x={40} y={96} w={56} d={34} h={4} />
      <path className="i-arc" d={arc(a, b, 54)} />
      <Person x={110} y={124} green />
      <Person x={176} y={40} />
    </Svg>
  );
}
