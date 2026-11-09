// Home v3 = home v1 (near-reorg r17 v1 "Carril vivo") with b10's header in our black (./header) and b10's buttons (./buttons.css, under html[data-version="v3"]).
import { V1Page } from "@/components/v1/V1Page";
import { V3Header } from "./header/Header";
import "./buttons.css";

export function V3Page() {
  return <V1Page v="v3" header={<V3Header home="/home-v3" />} />;
}
