// The archive: /signal — every piece ever published, filterable by beat, searchable.
import { loadIndex, esc, SITE, BYLINE, BEATS, beatById } from "./lib/store.mjs";
import { head, topbar, subscribeBox, featured, card, footer } from "./lib/page.mjs";
import { imageOf } from "./lib/images.mjs";

const PAGE = 24;

export default async (req) => {
  const url = new URL(req.url);
  const beat = url.searchParams.get("beat") || "";
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const all = await loadIndex();
  let list = all;
  if (beat) list = list.filter(s => s.beat === beat);
  if (q) list = list.filter(s => (s.headline + " " + s.dek + " " + (s.tags || []).join(" ")).toLowerCase().includes(q));
  const b = beat ? beatById(beat) : null;
  const title = (b ? b.label + " — " : "") + "The Corybuilt Signal";
  const desc = b ? b.blurb : "Original, plain-English editorials all day, every day: new AI tools, tech money, Trump and tech policy, and using AI to support your family. By " + BYLINE + ".";
  const canon = SITE + "/signal" + (beat ? "?beat=" + beat : "");
  const lead = !q ? list[0] : null;                 // featured story (search results are a plain grid)
  const rest = lead ? list.slice(1, PAGE) : list.slice(0, PAGE);

  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "CollectionPage", "name": title, "description": desc, "url": canon,
    "publisher": { "@type": "Organization", "name": "CoryBuilt", "url": SITE + "/" },
    "hasPart": list.slice(0, 20).map(s => ({ "@type": "NewsArticle", "headline": s.headline, "url": SITE + "/signal/" + s.slug, "datePublished": new Date(s.date).toISOString(), "image": imageOf(s).src }))
  });

  const heading = q ? `Results for &ldquo;${esc(q)}&rdquo;` : (b ? b.label : "The Signal");
  const kick = q ? "search the wire" : (b ? b.kicker : "original editorials, all day, every day");

  const html = head({ title, desc, url: canon, image: lead ? imageOf(lead).src : undefined, extra: `<script type="application/ld+json">${ld}</script>` }) +
    topbar(beat, q) + `
<div class="wrap">
  <div class="phead">
    <div><div class="kick">the signal &mdash; ${esc(kick)}</div><h1>${heading}</h1>${!q ? `<p class="lede" style="margin-top:12px">${esc(desc)}</p>` : ""}</div>
    <div class="count">${list.length} ${list.length === 1 ? "piece" : "pieces"}${b ? " in this beat" : ""}</div>
  </div>
  ${lead ? featured(lead) : ""}
  <div class="grid" id="grid">${rest.map(card).join("")}</div>
  ${!list.length ? `<p class="empty">Nothing here yet. The engine publishes around the clock &mdash; check back in an hour.</p>` : ""}
  ${list.length > PAGE ? `<button class="more" id="more" data-offset="${PAGE}">LOAD MORE &darr;</button>` : ""}
  ${subscribeBox()}
<script>
(function(){var m=document.getElementById('more'),g=document.getElementById('grid');if(!m)return;
var esc=function(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var labels=${JSON.stringify(Object.fromEntries(BEATS.map(x => [x.id, x.label])))};
var ago=function(ms){var mi=Math.max(1,Math.round((Date.now()-ms)/60000));if(mi<60)return mi+'m ago';var h=Math.round(mi/60);if(h<36)return h+'h ago';return Math.round(h/24)+'d ago'};
var card=function(s){var im=s.image&&s.image.url?s.image.url:'/signal-cover/'+encodeURIComponent(s.slug)+'.svg';var alt=s.image&&s.image.alt?s.image.alt:s.headline;var src=(s.sources||[])[0];
return '<a class="card" href="/signal/'+esc(s.slug)+'"><div class="im"><img src="'+esc(im)+'" alt="'+esc(alt)+'" width="1200" height="675" loading="lazy"></div><div class="bd"><div class="meta"><span class="beat'+((s.beat==='policy'||s.beat==='family')?' o':'')+'">'+esc(labels[s.beat]||'')+'</span><span>'+ago(s.date)+'</span></div><h3>'+esc(s.headline)+'</h3><p>'+esc(s.dek)+'</p><div class="ft"><span>${esc(BYLINE)}</span>'+(src?'<span>via '+esc(src)+'</span>':'')+'</div></div></a>'};
m.addEventListener('click',async function(){var off=+m.dataset.offset;m.textContent='LOADING';
try{var r=await fetch('/.netlify/functions/signal-feed?limit=${PAGE}&offset='+off+'&beat=${esc(beat)}&q=${encodeURIComponent(q)}');var d=await r.json();
(d.items||[]).forEach(function(s){g.insertAdjacentHTML('beforeend',card(s))});
m.dataset.offset=off+${PAGE};m.textContent='LOAD MORE \\u2193';if(off+${PAGE}>=d.total)m.remove();}catch(e){m.textContent='LOAD MORE \\u2193';}});})();
</script>
${footer()}`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=120, s-maxage=300" } });
};
export const config = { path: "/signal" };
