// The script that runs before first paint on /home-v1 (r17 v1's <head> script): the <html> flags the CSS and the boot read.
// ?rm=1 / prefers-reduced-motion: data-rm (no pin, no morph, a still world, the copy at once). Otherwise data-ownanim (the rail is one pinned stage).
// ?gl=0, or data-gl="off" already set by the page (home v5: no globe at all): data-gl="off" (the SVG poster instead of the globe). Neither: data-pin (the hero is pinned) + data-intro="wait" (the copy waits for the globe; never more than 7 s)
// + data-r16-intro="run" (the orbital-dawn intro hides the header and the copy until it has played; never more than 5.5 s), or "done" with ?intro=0 (skip it).
export const HEAD = `(function(){var d=document.documentElement,q=location.search;
d.setAttribute('data-lwh','');d.setAttribute('data-hero','letra');d.setAttribute('data-stk-enter','rise');
var rm=/[?&]rm=1\\b/.test(q)||matchMedia('(prefers-reduced-motion: reduce)').matches,off=/[?&]gl=0\\b/.test(q)||d.getAttribute('data-gl')==='off';
if(rm)d.setAttribute('data-rm','');else d.setAttribute('data-ownanim','');
if(off)d.setAttribute('data-gl','off');
if(!rm&&!off){d.setAttribute('data-pin','');d.setAttribute('data-intro','wait');setTimeout(function(){if(d.getAttribute('data-intro')==='wait')d.setAttribute('data-intro','done')},7000);
var skip=/[?&]intro=0\\b/.test(q);d.setAttribute('data-r16-intro',skip?'done':'run');setTimeout(function(){if(d.getAttribute('data-r16-intro')==='run')d.setAttribute('data-r16-intro','done');d.setAttribute('data-r16-live','')},5500)}})();`;
