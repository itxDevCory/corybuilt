// Shared HTML chrome for The Signal pages (archive + article).
// Design: a flat, dark news reader. Solid background, rounded cards, one strong photo per story,
// no canvas, parallax, grain or scroll effects — the reading surface stays still.
import { esc, SITE, BYLINE, CREATOR_PHOTO, OG_IMAGE, BEATS, beatById, ago } from "./store.mjs";
import { imageOf } from "./images.mjs";

export const CSS = `
:root{--bg:#0c0c11;--card:#14141b;--card2:#1b1b24;--tx:#f3f3f7;--dim:#a8a8b8;--mute:#73738a;--line:rgba(255,255,255,.08);
--cyan:#00f3ff;--orange:#ff5e3a;--mono:ui-monospace,'SF Mono',SFMono-Regular,Menlo,monospace;--ff:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:auto;-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--tx);font-family:var(--ff);-webkit-font-smoothing:antialiased;line-height:1.5}
::selection{background:var(--cyan);color:#000}
a{color:inherit}
img{display:block;max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:28px 24px 80px}
/* top bar */
.top{position:sticky;top:0;z-index:20;background:rgba(12,12,17,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.top-in{max-width:1180px;margin:0 auto;padding:0 24px;min-height:62px;display:flex;align-items:center;gap:16px}
.top .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:.24em;font-size:12px;white-space:nowrap}
.top .sep{width:1px;height:20px;background:var(--line);flex:none}
.top .brand{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.01em;font-size:16px;white-space:nowrap}
.top .brand i{color:var(--orange);font-style:normal}
.tabs{display:flex;gap:2px;margin-left:auto;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
.tabs::-webkit-scrollbar{display:none}
.tabs a{white-space:nowrap;padding:8px 12px;border-radius:999px;font-size:13px;color:var(--dim);text-decoration:none;transition:background .15s,color .15s}
.tabs a:hover{color:#fff;background:rgba(255,255,255,.05)}
.tabs a.on{color:#fff;background:rgba(255,255,255,.1)}
.search{position:relative;flex:none}
.search input{width:190px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:9px 14px 9px 34px;color:#fff;font-family:var(--ff);font-size:13px;outline:none;transition:border-color .15s,width .2s}
.search input:focus{border-color:rgba(0,243,255,.6);width:240px}
.search input::placeholder{color:var(--mute)}
.search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;stroke:var(--mute);fill:none;stroke-width:2;pointer-events:none}
.rss{font-family:var(--mono);font-size:11px;letter-spacing:.2em;color:var(--dim);text-decoration:none;white-space:nowrap}
.rss:hover{color:var(--orange)}
/* page header */
.phead{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin:10px 0 26px}
.kick{font-family:var(--mono);font-size:11px;letter-spacing:.3em;color:var(--orange);text-transform:uppercase;margin-bottom:12px}
.kick a{color:inherit;text-decoration:none}
h1{font-size:clamp(2rem,4.6vw,3rem);font-weight:700;letter-spacing:-.03em;line-height:1.05}
.lede{color:var(--dim);font-size:1.05rem;line-height:1.6;max-width:560px}
.count{font-family:var(--mono);font-size:11px;letter-spacing:.2em;color:var(--mute);text-transform:uppercase;white-space:nowrap;padding-bottom:6px}
/* meta line shared by cards */
.meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.beat{display:inline-flex;align-items:center;gap:7px;color:var(--cyan);font-weight:500}
.beat::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.beat.o{color:var(--orange)}
/* featured story */
.feat{display:grid;grid-template-columns:1.3fr 1fr;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:#fff;margin-bottom:22px;transition:border-color .2s}
.feat:hover{border-color:rgba(255,255,255,.22)}
.feat .im{aspect-ratio:16/9;background:#101018;min-height:100%}
.feat .im img{width:100%;height:100%;object-fit:cover}
@media(max-width:860px){.feat .im{min-height:0}.feat .im img{height:auto;aspect-ratio:16/9}}
.feat .bd{padding:36px 38px;display:flex;flex-direction:column;justify-content:center;gap:14px}
.feat h2{font-size:clamp(1.45rem,2.4vw,2.05rem);line-height:1.15;letter-spacing:-.025em;font-weight:700}
.feat p{color:var(--dim);font-size:1.02rem;line-height:1.6}
.feat .read{font-family:var(--mono);font-size:11px;letter-spacing:.22em;color:var(--cyan);text-transform:uppercase;margin-top:6px}
/* card grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}
.card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:#fff;transition:border-color .2s,background .2s}
.card:hover{border-color:rgba(255,255,255,.22);background:var(--card2)}
.card .im{aspect-ratio:16/9;background:#101018;overflow:hidden}
.card .im img{width:100%;height:100%;object-fit:cover}
.card .bd{padding:18px 20px 20px;display:flex;flex-direction:column;gap:10px;flex:1}
.card h3{font-size:1.12rem;line-height:1.3;letter-spacing:-.015em;font-weight:700}
.card p{color:var(--dim);font-size:.95rem;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card .ft{margin-top:auto;padding-top:10px;display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.card .ft span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.card .ft span:first-child{flex:none}
.empty{color:var(--dim);padding:40px 0}
.more{display:block;margin:34px auto 0;font-family:var(--mono);font-size:11px;letter-spacing:.3em;color:#fff;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:14px 28px;cursor:pointer}
.more:hover{border-color:var(--cyan);color:var(--cyan)}
/* article */
.article{max-width:820px;margin:0 auto}
.article h1{font-size:clamp(1.9rem,5vw,3.1rem);margin-bottom:16px}
.dek{color:var(--dim);font-size:1.2rem;line-height:1.6;margin-bottom:22px}
.author{display:flex;align-items:center;gap:14px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:14px 0;flex-wrap:wrap}
.author img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#1a1a23;border:1px solid var(--line)}
.author .who{flex:1;min-width:200px}
.author .name{font-family:var(--mono);font-size:11px;letter-spacing:.22em;color:#fff;text-transform:uppercase}
.author .when{font-family:var(--mono);font-size:10px;letter-spacing:.18em;color:var(--mute);text-transform:uppercase;margin-top:5px}
.author .when b{color:var(--orange);font-weight:500}
.hero{margin:26px 0 34px}
.hero .im{border-radius:16px;overflow:hidden;background:#101018}
.hero img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.hero figcaption{font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--mute);text-transform:uppercase;padding:10px 2px 0}
.hero figcaption a{color:var(--dim);text-decoration:none}
article p{color:#e6e6ee;font-size:1.13rem;line-height:1.85;margin-bottom:22px}
article h2{font-size:1.32rem;letter-spacing:-.01em;margin:34px 0 14px;padding-left:14px;border-left:3px solid var(--orange);line-height:1.3}
article ul,article ol{margin:0 0 22px 24px;color:#e6e6ee;font-size:1.08rem;line-height:1.8}
article li{margin-bottom:8px}
article b{color:#fff}article em{color:var(--cyan);font-style:normal}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin:30px 0}
.tag{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:7px 12px;text-transform:uppercase;text-decoration:none}
.tag:hover{color:#fff;border-color:rgba(255,255,255,.3)}
.share{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:22px 0 8px}
.share span{font-family:var(--mono);font-size:10px;letter-spacing:.3em;color:var(--mute);text-transform:uppercase;margin-right:6px}
.share a,.share button{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:#fff;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:9px 14px;text-decoration:none;cursor:pointer}
.share a:hover,.share button:hover{border-color:var(--cyan);color:var(--cyan)}
.src{border-top:1px solid var(--line);padding-top:18px;font-size:.95rem;color:var(--dim);line-height:1.8;margin-top:22px}
.src a{color:var(--cyan);text-decoration:none}
.sub{margin-top:48px;border:1px solid var(--line);border-radius:16px;padding:32px 30px;background:var(--card)}
.sub h2{font-size:1.4rem;letter-spacing:-.01em;margin-bottom:8px}
.sub p{color:var(--dim);line-height:1.65;margin-bottom:18px}
.sf{display:flex;gap:10px;flex-wrap:wrap}
.sf input{flex:1;min-width:200px;background:var(--bg);border:1px solid var(--line);border-radius:999px;color:#fff;font-family:var(--mono);font-size:14px;padding:14px 20px;outline:none}
.sf input:focus{border-color:var(--cyan)}
.sf button{border:1px solid rgba(0,243,255,.5);background:none;color:#fff;border-radius:999px;padding:14px 26px;letter-spacing:.25em;font-size:11px;cursor:pointer;font-family:var(--ff)}
.sf button:hover{background:var(--cyan);color:#000}
.ok{color:var(--cyan);margin-top:12px;display:none}
.rel{margin-top:52px}
.rel h2{font-family:var(--mono);font-size:11px;letter-spacing:.35em;color:var(--orange);text-transform:uppercase;margin-bottom:16px}
.rel .grid{grid-template-columns:repeat(3,1fr);gap:14px}
.rel .card h3{font-size:1rem}
.rel .card p{-webkit-line-clamp:2;font-size:.9rem}
.rel .card .bd{padding:14px 16px 16px}
.rel .card .ft span:last-child{display:none}
.foot{margin-top:56px;padding-top:22px;border-top:1px solid var(--line);font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--mute);text-transform:uppercase;line-height:2.1}
.foot a{color:inherit;text-decoration:none}
.foot a:hover{color:#fff}
@media(max-width:860px){
  .top-in{flex-wrap:wrap;padding:10px 16px;gap:10px 14px}
  .tabs{order:5;width:100%;margin-left:0;padding-bottom:2px}
  .search{margin-left:auto}
  .search input{width:150px}
  .wrap{padding:18px 16px 60px}
  .feat{grid-template-columns:1fr}
  .feat .bd{padding:22px 22px 26px}
  .grid,.rel .grid{grid-template-columns:1fr 1fr;gap:14px}
}
@media(max-width:560px){
  .grid,.rel .grid{grid-template-columns:1fr}
  .top .brand{font-size:15px}
  .top .sep{display:none}
  .top .logo{display:none}
  .search input{width:120px}
  .search input:focus{width:160px}
}
`;

export function head({ title, desc, url, image, extra = "" }) {
  const img = image || SITE + OG_IMAGE;
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" type="application/rss+xml" title="The Corybuilt Signal" href="/feed.xml">
<meta property="og:site_name" content="The Corybuilt Signal">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#0c0c11">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.pexels.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
${extra}
<style>${CSS}</style></head><body>`;
}

const searchIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;

// Sticky top bar: logo · The Signal · beat tabs · search · RSS
export function topbar(beat = "", q = "") {
  return `<header class="top"><div class="top-in">
<a class="logo" href="/">CORYBUILT</a><span class="sep"></span>
<a class="brand" href="/signal">The Signal<i>.</i></a>
<nav class="tabs" aria-label="Beats">
<a href="/signal" class="${!beat ? "on" : ""}">All</a>
${BEATS.map(x => `<a href="/signal?beat=${x.id}" class="${beat === x.id ? "on" : ""}">${esc(x.label)}</a>`).join("")}
</nav>
<form class="search" method="GET" action="/signal" role="search">${beat ? `<input type="hidden" name="beat" value="${esc(beat)}">` : ""}${searchIcon}<input name="q" value="${esc(q)}" placeholder="Search the wire" aria-label="Search"></form>
<a class="rss" href="/feed.xml">RSS</a>
</div></header>`;
}

export const beatClass = (id) => (id === "policy" || id === "family") ? "beat o" : "beat";

export function metaLine(s, extra = "") {
  const b = beatById(s.beat);
  return `<div class="meta"><span class="${beatClass(b.id)}">${esc(b.label)}</span><span>${esc(ago(s.date))}</span>${extra}</div>`;
}

export function authorCard(dateMs, beatId) {
  const beat = beatById(beatId);
  return `<div class="author">
<img src="${CREATOR_PHOTO}" alt="${esc(BYLINE)}" width="48" height="48" loading="eager" onerror="this.style.display='none'">
<div class="who"><div class="name">${esc(BYLINE)}</div>
<div class="when">${esc(new Date(dateMs).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))} &middot; <b>${esc(beat.label)}</b> &middot; original editorial</div></div>
</div>`;
}

export function heroFigure(s) {
  const im = imageOf(s);
  const credit = im.photo
    ? `<figcaption>Photo: ${im.creditUrl ? `<a href="${esc(im.creditUrl)}" target="_blank" rel="noopener nofollow">${esc(im.credit)}</a>` : esc(im.credit)} &middot; <a href="${esc(im.link || "https://www.pexels.com")}" target="_blank" rel="noopener nofollow">Pexels</a></figcaption>`
    : `<figcaption>Cover: The Signal</figcaption>`;
  return `<figure class="hero"><div class="im"><img src="${esc(im.large)}" alt="${esc(im.alt)}" width="1200" height="675" loading="eager" fetchpriority="high"></div>${credit}</figure>`;
}

export function shareBar(url, headline, xText) {
  const u = encodeURIComponent(url), t = encodeURIComponent(headline), x = encodeURIComponent((xText || headline) + " " + url);
  return `<div class="share"><span>Share</span>
<a href="https://x.com/intent/post?text=${x}" target="_blank" rel="noopener">X</a>
<a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener">LinkedIn</a>
<a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
<a href="https://www.threads.net/intent/post?text=${x}" target="_blank" rel="noopener">Threads</a>
<a href="https://www.reddit.com/submit?url=${u}&title=${t}" target="_blank" rel="noopener">Reddit</a>
<a href="https://wa.me/?text=${x}" target="_blank" rel="noopener">WhatsApp</a>
<a href="mailto:?subject=${t}&body=${x}">Email</a>
<button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(url)}').then(()=>{this.textContent='Copied'})">Copy link</button>
</div>`;
}

export function subscribeBox() {
  return `<div class="sub">
    <h2>Get the next one free.</h2>
    <p>The Signal drops original, plain-English pieces all day on AI tools, tech money, Washington and the machines, and using AI to support your family. 18+, worldwide, free forever.</p>
    <form class="sf" id="sf" name="signal" method="POST" data-netlify="true">
      <input type="hidden" name="form-name" value="signal">
      <input type="email" name="email" required placeholder="you@anywhere.earth" aria-label="Email">
      <button type="submit">JOIN THE SIGNAL &#8599;</button>
    </form>
    <div class="ok" id="sok">You&rsquo;re in. &#9889;</div>
  </div>
<script>
(function(){var f=document.getElementById('sf'),ok=document.getElementById('sok');if(!f)return;
f.addEventListener('submit',async function(e){e.preventDefault();
var body=new URLSearchParams({'form-name':'signal',email:f.email.value.trim()}).toString();
try{await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body});}catch(err){}
f.style.display='none';ok.style.display='block';});})();
</script>`;
}

// The featured (newest) story on the archive page.
export function featured(s) {
  const im = imageOf(s);
  const src = (s.sources || [])[0];
  return `<a class="feat" href="/signal/${esc(s.slug)}">
<div class="im"><img src="${esc(im.src)}" alt="${esc(im.alt)}" width="1200" height="675" loading="eager" fetchpriority="high"></div>
<div class="bd">${metaLine(s, src ? `<span>via ${esc(src.name)}</span>` : "")}<h2>${esc(s.headline)}</h2><p>${esc(s.dek)}</p><span class="read">Read the piece &rarr;</span></div>
</a>`;
}

export function card(s) {
  const im = imageOf(s);
  const src = (s.sources || [])[0];
  return `<a class="card" href="/signal/${esc(s.slug)}">
<div class="im"><img src="${esc(im.src)}" alt="${esc(im.alt)}" width="1200" height="675" loading="lazy"></div>
<div class="bd">${metaLine(s)}<h3>${esc(s.headline)}</h3><p>${esc(s.dek)}</p><div class="ft"><span>${esc(BYLINE)}</span>${src ? `<span>via ${esc(src.name)}</span>` : ""}</div></div>
</a>`;
}

export function footer() {
  return `<div class="foot">&copy; ${new Date().getFullYear()} CORYBUILT &middot; ${esc(BYLINE)} &middot; <a href="/signal">all signals</a> &middot; <a href="/feed.xml">RSS</a> &middot; <a href="/">home</a><br>Original editorials; facts credited to the linked publishers. Photos via <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>.</div>
</div></body></html>`;
}
