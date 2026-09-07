// JSON feed of editorials. Used by the homepage Live Wire and the /signal "load more".
//   ?limit=10&offset=0&beat=money&q=search
// Legacy shape (plain array) is returned when no offset/limit is given, so the homepage keeps working.
import { loadIndex, beatById } from "./lib/store.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const beat = url.searchParams.get("beat") || "";
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const paged = url.searchParams.has("limit") || url.searchParams.has("offset");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 100);
  const offset = Number(url.searchParams.get("offset")) || 0;

  let list = await loadIndex();
  if (beat) list = list.filter(s => s.beat === beat);
  if (q) list = list.filter(s => (s.headline + " " + s.dek + " " + (s.tags || []).join(" ")).toLowerCase().includes(q));
  const items = list.slice(offset, offset + limit).map(s => ({
    slug: s.slug, headline: s.headline, dek: s.dek, date: s.date, beat: s.beat, beatLabel: beatById(s.beat).label,
    author: s.author, tags: s.tags, sources: (s.sources || []).map(x => x.name), url: "https://corybuilt.com/signal/" + s.slug,
    image: s.image ? { url: s.image.url, thumb: s.image.thumb, alt: s.image.alt, credit: s.image.credit } : null
  }));
  const body = paged ? { total: list.length, offset, limit, items } : items;
  return new Response(JSON.stringify(body), {
    status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=120", "access-control-allow-origin": "*" }
  });
};
