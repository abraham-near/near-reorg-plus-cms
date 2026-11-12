// A CMS post body (sanitized HTML from the editor) made ready for the post layouts (components/v3/post): sanitized once more here (the site does not
// trust what it did not write), then given the pb-* markup the layouts already style: numbered h2s with ids (for the contents and scroll-spy), paragraphs,
// lists, quotes, figures and code. Tags with no pb-* twin (tables, h4, hr, inline code…) are styled under .pb-body--html (post.css).
// Plus the small text helpers: heading ids, word count, reading time. Runs on the server only (jsdom, through isomorphic-dompurify).
import DOMPurify from "isomorphic-dompurify";

export type Section = { id: string; t: string };
/** what the Media table knows about an image, by its URL */
export type MediaInfo = { w: number | null; h: number | null; alt: string | null };
export type PreparedBody = { html: string; sections: Section[]; words: number; readMin: number; summary: string };

/** ids the page around the body already uses */
const RESERVED = ["main", "pa-t", "pa-more-t", "pbv-t", "pbv-next-t", "pc-t", "pc-more-t"];

/** a heading's text as an id: lower case, ascii, words joined by "-" */
export function slugify(text: string) {
  const s = text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return s || "section";
}

/** hands out ids, each once: a repeat gets -2, -3… */
export function idMaker(taken: Iterable<string> = RESERVED) {
  const used = new Set(taken);
  return (text: string) => {
    const base = slugify(text);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
}

export const countWords = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
/** minutes at ~220 words a minute, never under one */
export const readMinutes = (words: number) => Math.max(1, Math.round(words / 220));

/** the first ~160 characters of a text, cut at a word */
export function summarize(text: string, max = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1), at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** the URLs of a body's images (to look their sizes up in the Media table) */
export const imageUrls = (html: string) => [...html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/gi)].map((m) => m[1]);

// The CMS's own sanitizer settings (src/cms/lib/sanitize.ts), and its embed hosts: an iframe from anywhere else is dropped.
const PURIFY = {
  ADD_TAGS: ["iframe", "figure", "figcaption", "video", "source"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target", "rel", "controls", "loop", "muted", "playsinline", "poster", "colspan", "rowspan", "data-type", "data-callout", "data-footnote"],
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "object", "embed", "base", "meta", "link"],
  FORBID_ATTR: ["style"],
  ALLOW_DATA_ATTR: false,
};
const EMBED_HOSTS = new Set(["www.youtube-nocookie.com", "www.youtube.com", "youtube.com", "player.vimeo.com", "lu.ma", "luma.com", "open.spotify.com", "w.soundcloud.com", "docs.google.com"]);
const embedOk = (src: string | null) => {
  try { const u = new URL(src || ""); return u.protocol === "https:" && EMBED_HOSTS.has(u.hostname); } catch { return false; }
};
const safeSrc = (v: string | null) => !!v && ((v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//i.test(v));

const text = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();
const isBlank = (el: Element) => !text(el) && !el.querySelector("img, iframe, video");
/** the text of a tree with a space between blocks (textContent runs "Title</h2><p>Text" together) */
const BLOCK = /^(P|H[1-6]|LI|BLOCKQUOTE|PRE|TD|TH|FIGCAPTION|FIGURE|DIV|UL|OL|TABLE|TR|BR|HR)$/;
function plain(node: Node): string {
  let s = "";
  node.childNodes.forEach((c) => {
    if (c.nodeType === 3) s += c.nodeValue;
    else if (c.nodeType === 1) { const pad = BLOCK.test((c as Element).tagName) ? " " : ""; s += pad + plain(c) + pad; }
  });
  return s;
}

export function prepareBody(html: string, media: Record<string, MediaInfo> = {}, opts: { dek?: string } = {}): PreparedBody {
  const frag = DOMPurify.sanitize(html, { ...PURIFY, RETURN_DOM_FRAGMENT: true }) as DocumentFragment;
  const doc = frag.ownerDocument;
  const el = (tag: string, cls?: string) => { const e = doc.createElement(tag); if (cls) e.className = cls; return e; };
  const rename = (from: Element, tag: string) => {
    const to = el(tag);
    for (const a of [...from.attributes]) to.setAttribute(a.name, a.value);
    to.append(...from.childNodes);
    from.replaceWith(to);
    return to;
  };

  // iframes only from the embed hosts, every src / href safe
  frag.querySelectorAll("iframe").forEach((f) => { if (!embedOk(f.getAttribute("src"))) f.remove(); });
  frag.querySelectorAll("[src]").forEach((e) => { if (!safeSrc(e.getAttribute("src"))) e.removeAttribute("src"); });
  frag.querySelectorAll("a[target=_blank]").forEach((a) => a.setAttribute("rel", "noopener noreferrer"));

  // blocks: empty paragraphs go, an h1 in the body becomes an h2 (the page has its own h1)
  for (const b of [...frag.children]) {
    if ((b.tagName === "P" || /^H[1-6]$/.test(b.tagName)) && isBlank(b)) b.remove();
    else if (b.tagName === "H1") rename(b, "h2");
  }

  const all = plain(frag);
  const summary = summarize(all), words = countWords(`${opts.dek || ""} ${all}`);

  // h2s: an id from the text, the layouts' number + title spans
  const nextId = idMaker();
  const sections: Section[] = [];
  frag.querySelectorAll("h2").forEach((h, i) => {
    const t = text(h), id = nextId(t);
    sections.push({ id, t });
    const n = el("span", "pb-h2__n"); n.setAttribute("aria-hidden", "true"); n.textContent = String(i + 1).padStart(2, "0");
    const span = el("span", "pb-h2__t"); span.append(...h.childNodes);
    h.id = id; h.className = "pb-h2"; h.setAttribute("data-reveal", "");
    h.replaceChildren(n, span);
  });
  frag.querySelectorAll("h3").forEach((h) => h.classList.add("pb-h3"));

  // images: lazy, async, their size and alt from the Media table when known
  frag.querySelectorAll("img").forEach((img) => {
    if (!img.getAttribute("src")) { img.remove(); return; }
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    const m = media[img.getAttribute("src")!];
    if (m?.w && m.h && !img.hasAttribute("width") && !img.hasAttribute("height")) { img.setAttribute("width", String(m.w)); img.setAttribute("height", String(m.h)); }
    if (!img.getAttribute("alt")) img.setAttribute("alt", m?.alt || "");
  });

  // a figure in the layouts' markup around one image (its own proportions: .pb-fig--free)
  const figure = (img: Element, cap: string | null) => {
    const fig = el("figure", "pb-fig pb-fig--free"); fig.setAttribute("data-size", "col"); fig.setAttribute("data-reveal", "");
    const ph = el("div", "pb-fig__ph"); img.classList.add("pb-fig__img"); ph.append(img); fig.append(ph);
    if (cap) { const c = el("figcaption", "pb-cap"); c.textContent = cap; fig.append(c); }
    return fig;
  };

  for (const b of [...frag.children]) {
    switch (b.tagName) {
      case "P": {
        // a paragraph that only holds images (the editor's inline images): one figure each, the title as its caption
        const imgs = [...b.querySelectorAll("img")];
        if (imgs.length && !text(b) && [...b.children].every((c) => c.tagName === "IMG" || c.tagName === "BR")) {
          b.replaceWith(...imgs.map((img) => { const cap = img.getAttribute("title"); img.removeAttribute("title"); return figure(img, cap); }));
        } else b.classList.add("pb-p");
        break;
      }
      case "UL": case "OL": {
        if (b.getAttribute("data-type") === "taskList") { b.classList.add("pb-tasks"); break; }
        b.classList.add("pb-list");
        if (b.tagName === "OL") {
          b.classList.add("pb-list--ol");
          const start = parseInt(b.getAttribute("start") || "1", 10);
          if (start > 1) b.setAttribute("style", `counter-reset: pb ${start - 1}`);
        }
        break;
      }
      case "BLOCKQUOTE": {
        // the quote in a figure; a last paragraph that starts with a dash is its attribution
        const fig = el("figure", "pb-quote"); fig.setAttribute("data-reveal", "");
        b.replaceWith(fig); fig.append(b);
        const ps = [...b.children].filter((c) => c.tagName === "P");
        const last = ps.at(-1);
        if (ps.length > 1 && last && /^[—–-]\s*/.test(text(last))) {
          const by = el("figcaption", "pb-quote__by"); by.textContent = text(last).replace(/^[—–-]\s*/, ""); last.remove(); fig.append(by);
        }
        break;
      }
      case "FIGURE": {
        if (b.querySelector("iframe, video")) { b.classList.add("pb-embed"); break; }
        const img = b.querySelector("img");
        if (!img) break;
        const cap = b.querySelector("figcaption");
        b.replaceWith(figure(img, cap ? text(cap) : null));
        break;
      }
      case "PRE": {
        b.classList.add("pb-code");
        const lang = /(?:^|\s)language-([\w+#-]+)/.exec(b.querySelector("code")?.className || "")?.[1];
        if (lang && lang !== "plaintext") b.setAttribute("data-lang", lang);
        break;
      }
      case "TABLE": {
        // tables scroll sideways inside their own box, never the page
        b.removeAttribute("class");
        const box = el("div", "pb-table"); box.setAttribute("role", "region"); box.setAttribute("aria-label", "Table"); box.setAttribute("tabindex", "0");
        b.replaceWith(box); box.append(b);
        break;
      }
      case "DIV": {
        if (b.getAttribute("data-type") === "embed-block") {
          if (!b.querySelector("iframe")) b.remove();
          else { b.className = "pb-embed"; b.querySelector("iframe")!.removeAttribute("class"); }
        } else if (b.hasAttribute("data-callout")) b.classList.add("pb-callout");
        break;
      }
      case "ASIDE": if (b.hasAttribute("data-callout")) b.classList.add("pb-callout"); break;
    }
  }

  const box = doc.createElement("div");
  box.append(frag);
  return { html: box.innerHTML, sections, words, readMin: readMinutes(words), summary };
}
