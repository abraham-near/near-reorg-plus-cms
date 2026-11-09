// Which homepage direction a page renders in: <html data-version="v1|v2">, set before first paint. styles/versions.css holds what it changes.
//  - /home-v1 and /home-v2 fix their own (<FixVersion>).
//  - Any other page follows ?v=1 / ?v=2, remembered in localStorage, else DEFAULT_VERSION (the root layout's head script).
import { InlineScript } from "@/components/InlineScript";

export type Version = "v1" | "v2";
export const DEFAULT_VERSION: Version = "v1";
const KEY = "near-version";

/** the root layout's head script */
export const VERSION_HEAD =
  `(function(){var v;try{var q=new URLSearchParams(location.search).get('v');` +
  `if(q==='1'||q==='2'){v='v'+q;localStorage.setItem('${KEY}',v)}else{v=localStorage.getItem('${KEY}')}}catch(e){}` +
  `document.documentElement.setAttribute('data-version',v==='v1'||v==='v2'?v:'${DEFAULT_VERSION}')})()`;

/** a page that belongs to one version: rendered first in the page, so it runs before the page's own markup paints */
export function FixVersion({ v }: { v: Version }) {
  return <InlineScript html={`document.documentElement.setAttribute('data-version','${v}')`} />;
}
