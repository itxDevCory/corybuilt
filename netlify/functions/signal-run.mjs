// Manual controls for The Signal. Protected by env var SIGNAL_TOKEN (any password you choose).
//   /signal-admin/run?token=...&count=1&beat=tools   -> write new piece(s) now (beat optional: money|policy|tools|family)
//   /signal-admin/status?token=...                   -> what the engine has been doing
//   /signal-admin/images?token=...&limit=40          -> give every story without a photo one (needs PEXELS_API_KEY)
//   /signal-admin/images?token=...&slug=<slug>&q=<search phrase>  -> hand-pick a different photo for one story
//   /signal-admin/images?token=...&slug=<slug>&force=1            -> re-pick that story's photo automatically
import { internalToken, getJSON, loadIndex, SITE, BEATS } from "./lib/store.mjs";
import { backfillImages, attachPhoto } from "./lib/images.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const token = process.env.SIGNAL_TOKEN;
  if (!token || url.searchParams.get("token") !== token) {
    return new Response("Set SIGNAL_TOKEN in Netlify env vars and pass ?token=", { status: 401 });
  }
  const action = url.pathname.split("/").pop();
  if (action === "status") {
    const cursor = await getJSON("cursor", {});
    const index = await loadIndex();
    const body = {
      apiKey: !!process.env.ANTHROPIC_API_KEY, pexelsKey: !!process.env.PEXELS_API_KEY, socialWebhook: !!process.env.SOCIAL_WEBHOOK_URL,
      totalStories: index.length, storiesWithPhoto: index.filter(s => s.image).length, newest: index.slice(0, 5).map(s => ({ slug: s.slug, headline: s.headline, beat: s.beat, date: new Date(s.date).toISOString() })),
      nextBeat: BEATS[(cursor.beatIdx || 0) % BEATS.length].id, runs: cursor.runs || 0,
      lastRun: cursor.lastRun ? new Date(cursor.lastRun).toISOString() : null, log: cursor.log || []
    };
    return new Response(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json" } });
  }
  if (action === "images") {
    if (!process.env.PEXELS_API_KEY) return new Response("Set PEXELS_API_KEY in Netlify env vars first (free key at pexels.com/api).", { status: 400 });
    const slug = url.searchParams.get("slug");
    if (slug) {
      const index = await loadIndex();
      const s = index.find(x => x.slug === slug);
      if (!s) return new Response("no such story", { status: 404 });
      const q = url.searchParams.get("q");
      const img = await attachPhoto(s, q ? { queries: [q], max: 1 } : {});
      return new Response(JSON.stringify({ slug, image: img }, null, 2), { headers: { "content-type": "application/json" } });
    }
    const out = await backfillImages(Math.min(Number(url.searchParams.get("limit")) || 40, 150));
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  }
  if (action === "run") {
    if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY not set", { status: 400 });
    const base = (process.env.URL || SITE).replace(/\/$/, "");
    const payload = { count: Math.min(Number(url.searchParams.get("count")) || 1, 8) };
    if (url.searchParams.get("beat")) payload.beat = url.searchParams.get("beat");
    const r = await fetch(base + "/.netlify/functions/signal-writer-background", {
      method: "POST", headers: { "content-type": "application/json", "x-signal-token": internalToken() }, body: JSON.stringify(payload)
    });
    return new Response("Writer started (" + r.status + "). New pieces appear at /signal within a minute or two. Check /signal-admin/status?token=... for the log.", { status: 200 });
  }
  return new Response("unknown action", { status: 404 });
};

export const config = { path: "/signal-admin/:action" };
