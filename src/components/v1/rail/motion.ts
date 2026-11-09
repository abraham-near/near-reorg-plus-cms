// r17 v1 js/layer.js mount(ctx): the pinned rail (rail/layer.ts), its idle loop, and the static stacked page with reduced motion. Called once by V1Boot after the world's boot.
import type { V1Ctx, Dispose } from "../ctx";
import { mountLayer } from "./layer";

export async function mountRail(ctx: V1Ctx): Promise<Dispose | null> {
  return mountLayer(ctx);
}
