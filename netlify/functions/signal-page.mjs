// Renders a full article page for each editorial: /signal/:slug
import { getStory, loadIndex, esc, SITE, AUTHOR, BYLINE, CREATOR_PHOTO, OG_IMAGE, beatById, articleUrl } from "./lib/store.mjs";
import { head, topbar, authorCard, heroFigure, shareBar, subscribeBox, card, footer } from "./lib/page.mjs";
import { imageOf } from "./lib/images.mjs";

export default async (req, context) => {
  const slug = context.params && context.params.slug;
  const s = await getStory(slug);
  if (!s) {
    return new Response(head({ title: "Not found — The Corybuilt Signal", desc: "That signal has faded.", url: SITE + "/signal" }) +
      topbar() + `<div class="wrap article"><h1>404</h1><p class="dek">That signal has faded. <a href="/signal">Back to the wire</a></p>${footer()}`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const url = articleUrl(s.slug);
  const beat = beatById(s.beat);
  const d = new Date(s.date);
  const im = imageOf(s);
  const srcHtml = (s.sources || []).map(x => '<a href="' + esc(x.link) + '" target="_blank" rel="noopener nofollow">' + esc(x.name) + "</a>").join(" &middot; ");
  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "NewsArticle",
    "headline": s.headline, "description": s.dek, "articleSection": beat.label,
    "keywords": (s.keywords || s.tags || []).join(", "),
    "datePublished": d.toISOString(), "dateModified": d.toISOString(),
    "image": [im.large, SITE + OG_IMAGE],
    "author": { "@type": "Person", "name": AUTHOR, "jobTitle": "Creator", "url": SITE + "/", "image": SITE + CREATOR_PHOTO },
    "publisher": { "@type": "Organization", "name": "CoryBuilt", "url": SITE + "/", "logo": { "@type": "ImageObject", "url": SITE + OG_IMAGE } },
    "mainEntityOfPage": url, "isAccessibleForFree": true
  });

  // related: same beat first, then newest
  const index = await loadIndex();
  const related = index.filter(x => x.slug !== s.slug).sort((a, b) => (b.beat === s.beat) - (a.beat === s.beat) || b.date - a.date).slice(0, 3);

  const html = head({
    title: s.headline + " — The Corybuilt Signal",
    desc: s.dek, url, image: im.photo ? im.src : undefined,
    extra: `<meta property="og:type" content="article"><meta property="article:published_time" content="${d.toISOString()}"><meta property="article:author" content="${esc(AUTHOR)}"><meta property="article:section" content="${esc(beat.label)}"><meta name="author" content="${esc(AUTHOR)}"><script type="application/ld+json">${ld}</script>`
  }) + topbar(beat.id) + `
<div class="wrap article">
  <div class="kick"><a href="/signal?beat=${beat.id}">${esc(beat.label)}</a> &mdash; ${esc(beat.kicker)}</div>
  <h1>${esc(s.headline)}</h1>
  <p class="dek">${esc(s.dek)}</p>
  ${authorCard(s.date, s.beat)}
  ${heroFigure(s)}
  <article>${s.body_html}</article>
  <div class="tags">${(s.tags || []).map(t => '<a class="tag" href="/signal?q=' + encodeURIComponent(t) + '">' + esc(t) + "</a>").join("")}</div>
  ${shareBar(url, s.headline, s.social && s.social.x)}
  <div class="src"><b style="color:#fff">Reporting via:</b> ${srcHtml || "CoryBuilt research"}<br>Facts credited to the linked publishers. Headline, framing and analysis are original to CoryBuilt. Written and published by ${esc(BYLINE)}.</div>
  ${subscribeBox()}
  ${related.length ? `<div class="rel"><h2>More from the wire</h2><div class="grid">${related.map(card).join("")}</div></div>` : ""}
${footer()}`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=600" } });
};
export const config = { path: "/signal/:slug" };
