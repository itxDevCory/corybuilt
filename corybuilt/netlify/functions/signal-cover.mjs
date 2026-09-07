// /signal-cover/<slug>.svg — the generated cover for a story without a photo.
import { loadIndex } from "./lib/store.mjs";
import { coverSVG } from "./lib/cover.mjs";

export default async (req, context) => {
  const slug = decodeURIComponent((context.params && context.params.slug) || "").replace(/\.svg$/, "");
  const index = await loadIndex();
  const i = index.findIndex(s => s.slug === slug);
  const s = i >= 0 ? index[i] : { slug, headline: "The Signal", dek: "", beat: "money" };
  const svg = coverSVG(s, i >= 0 ? i : 0);
  return new Response(svg, { status: 200, headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400, s-maxage=604800" } });
};
export const config = { path: "/signal-cover/:slug" };
