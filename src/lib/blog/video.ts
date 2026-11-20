// A video post's video (the CMS's Post.video), checked again on the site's side: the site does not import the CMS
// (src/cms/lib/posts/video.ts stores it), and a stored value is never trusted as markup. Only two shapes play:
//   file  — an MP4/WebM of the media library, "/cms/<name>.mp4|webm" (a <video>)
//   embed — a YouTube (privacy mode) or Vimeo player, rebuilt here keeping only its start time / private hash (an <iframe>)

export type Video = { kind: "file" | "embed"; src: string };

const FILE = /^\/cms\/[A-Za-z0-9_-]+\.(mp4|webm)$/;

export function safeVideo(value: string | null | undefined): Video | null {
  if (!value) return null;
  if (FILE.test(value)) return { kind: "file", src: value };
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const yt = /^\/embed\/([\w-]{11})$/.exec(url.pathname);
  if (url.hostname === "www.youtube-nocookie.com" && yt && yt[1] !== "videoseries") {
    const start = url.searchParams.get("start");
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${yt[1]}${start && /^\d+$/.test(start) ? `?start=${start}` : ""}` };
  }
  const vm = /^\/video\/(\d+)$/.exec(url.pathname);
  if (url.hostname === "player.vimeo.com" && vm) {
    const h = url.searchParams.get("h");
    return { kind: "embed", src: `https://player.vimeo.com/video/${vm[1]}${h && /^[0-9a-f]+$/i.test(h) ? `?h=${h}` : ""}` };
  }
  return null;
}

/** the type an Open Graph video entry gives (a player page, or the file's own type) */
export const videoMime = (v: Video) => (v.kind === "embed" ? "text/html" : v.src.endsWith(".webm") ? "video/webm" : "video/mp4");
