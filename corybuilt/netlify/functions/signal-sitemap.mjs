// /sitemap.xml (everything) and /news-sitemap.xml (Google News format, last 48 hours).
import { loadIndex, SITE, esc, beatById, BEATS } from "./lib/store.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const news = url.pathname.includes("news");
  const list = await loadIndex();
  let xml;
  if (news) {
    const cutoff = Date.now() - 48 * 3600 * 1000;
    const recent = list.filter(s => s.date >= cutoff).slice(0, 1000);
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recent.map(s => `<url><loc>${SITE}/signal/${esc(s.slug)}</loc><news:news><news:publication><news:name>The Corybuilt Signal</news:name><news:language>en</news:language></news:publication><news:publication_date>${new Date(s.date).toISOString()}</news:publication_date><news:title>${esc(s.headline)}</news:title><news:keywords>${esc((s.tags || []).concat(beatById(s.beat).label).join(", "))}</news:keywords></news:news></url>`).join("\n")}
</urlset>`;
  } else {
    const iso = (ms) => new Date(ms).toISOString();
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
<url><loc>${SITE}/signal</loc><lastmod>${iso(list[0] ? list[0].date : Date.now())}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
${BEATS.map(b => `<url><loc>${SITE}/signal?beat=${b.id}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`).join("\n")}
${list.map(s => `<url><loc>${SITE}/signal/${esc(s.slug)}</loc><lastmod>${iso(s.date)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n")}
</urlset>`;
  }
  return new Response(xml, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
};
export const config = { path: ["/sitemap.xml", "/news-sitemap.xml"] };
