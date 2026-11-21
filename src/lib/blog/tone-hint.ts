import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { Article } from "@/components/v3/post/article";
import { DARK_VEIL, LIGHT_VEIL, TARGET, choose, veilFor, type RGB, type ToneHint } from "./tone-math";

// A first guess at the type's tone over a photo (D264), from the photo alone: the area a cover's text usually covers (the lower left), the
// title's 3:1 target. Rendered into the HTML so the cover opens in the right tone, and used as the photo's preferred tone so it keeps one tone
// across screen sizes; the browser then measures the real crop and words (components/v3/post/tone.ts). Only photos served from public/ are
// read; any other gets no hint (the browser decides alone). Cached per src for the life of the server.
const WHITE: RGB = [245, 244, 241], INK: RGB = [38, 38, 38];   // the blog's --paper-0 and --ink (v3/blog/blog.css)
const cache = new Map<string, Promise<ToneHint | undefined>>();

async function compute(src: string): Promise<ToneHint | undefined> {
  if (!src.startsWith("/") || src.startsWith("//") || src.includes("..")) return undefined;
  const file = path.join(process.cwd(), "public", decodeURIComponent(src.split(/[?#]/)[0]));
  const buf = await readFile(file).catch(() => null);
  if (!buf) return undefined;
  const { data, info } = await sharp(buf).resize(160).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px: RGB[] = [];
  for (let y = Math.floor(info.height * 0.45); y < Math.floor(info.height * 0.92); y++)
    for (let x = 0; x < Math.floor(info.width * 0.62); x++) { const i = (y * info.width + x) * 3; px.push([data[i], data[i + 1], data[i + 2]]); }
  return choose(veilFor(px, WHITE, 1, DARK_VEIL, TARGET.large), veilFor(px, INK, 1, LIGHT_VEIL, TARGET.large));
}

export function toneHint(src: string | null | undefined) {
  if (!src) return Promise.resolve(undefined);
  let p = cache.get(src);
  if (!p) { p = compute(src).catch(() => undefined); cache.set(src, p); }
  return p;
}

/** the article with tone hints on its cover and its more posts' pictures */
export async function withToneHints(a: Article): Promise<Article> {
  const [hero, more] = await Promise.all([toneHint(a.hero?.src), Promise.all(a.more.map((m) => toneHint(m.img)))]);
  return { ...a, hero: a.hero && { ...a.hero, hint: hero }, more: a.more.map((m, i) => ({ ...m, imgHint: more[i] })) };
}
