// Serves /feed.xml (and /signal/feed?beat=...) built from the latest original editorials.
import { loadIndex, getStory, SITE, BYLINE, beatById, esc } from "./lib/store.mjs";
import { imageOf } from "./lib/images.mjs";

const cdata = (x) => "<![CDATA[" + String(x || "").replace(/\]\]>/g, "]]]]><![CDATA[>") + "]]>";

export default async (req) => {
  const url = new URL(req.url);
  const beat = url.searchParams.get("beat") || "";
  let list = await loadIndex();
  if (beat) list = list.filter(s => s.beat === beat);
  const top = list.slice(0, 30);
  // full text for the newest 12 so aggregators (Feedly, Flipboard, etc.) show the whole piece
  const bodies = await Promise.all(top.slice(0, 12).map(s => getStory(s.slug).catch(() => null)));

  const items = top.map((s, i) => {
    const b = beatById(s.beat);
    const link = SITE + "/signal/" + s.slug;
    const full = bodies[i] && bodies[i].body_html;
    const im = imageOf(s);
    const media = im.photo ? `\n<media:content url="${esc(im.src)}" medium="image" width="1200" height="627"><media:credit>${esc(im.credit)}</media:credit></media:content>\n<enclosure url="${esc(im.src)}" type="image/jpeg" length="0"/>` : "";
    return `<item>
<title>${esc(s.headline)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
<pubDate>${new Date(s.date).toUTCString()}</pubDate>
<dc:creator>${esc(BYLINE)}</dc:creator>
<category>${esc(b.label)}</category>${(s.tags || []).map(t => "<category>" + esc(t) + "</category>").join("")}
<description>${esc(s.dek)}</description>${media}${full ? "\n<content:encoded>" + cdata((im.photo ? '<p><img src="' + esc(im.src) + '" alt="' + esc(im.alt) + '"></p>' : "") + full + '<p><a href="' + link + '">Read on corybuilt.com</a></p>') + "</content:encoded>" : ""}
</item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>The Corybuilt Signal${beat ? " — " + esc(beatById(beat).label) : ""}</title>
<link>${SITE}/signal</link>
<atom:link href="${SITE}/feed.xml${beat ? "?beat=" + beat : ""}" rel="self" type="application/rss+xml"/>
<atom:link href="https://pubsubhubbub.appspot.com/" rel="hub"/>
<description>Original plain-English editorials all day, every day: new AI tools, tech money, Trump and tech policy, and using AI to support your family. By ${esc(BYLINE)}.</description>
<language>en-us</language>
<image><url>${SITE}/assets/og-signal.png</url><title>The Corybuilt Signal</title><link>${SITE}/signal</link></image>
<lastBuildDate>${new Date(top[0] ? top[0].date : Date.now()).toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;
  return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
};
