// THE SIGNAL — WRITER (background function: runs up to 15 minutes, returns 202 immediately).
// Triggered by signal-engine (schedule) or signal-run (manual). Picks the next beat, pulls the
// freshest candidate stories, has Claude choose the most click-worthy one and write an ORIGINAL
// editorial, publishes it, then announces it (IndexNow, WebSub, optional social webhook).
import {
  BEATS, beatById, loadIndex, saveStory, getJSON, setJSON, parseItems, keyOf, slugify,
  internalToken, announce, AUTHOR, BYLINE, SITE
} from "./lib/store.mjs";
import { SEED } from "./signal-seed.mjs";
import { pickPhoto, rememberPhoto, backfillImages } from "./lib/images.mjs";

const KEEP_COVERED = 3000;
const CANDIDATES = 8;

const EDITORIAL = `You are the editorial engine of THE CORYBUILT SIGNAL (corybuilt.com/signal), a free wire for self-taught builders, working parents and curious nerds who want to stay ahead of everyone else. Every piece carries the byline "${BYLINE}".

You receive a list of CANDIDATE stories (headline, source, link, snippet) for one beat. Your job:
1) PICK the single most click-worthy candidate: the one with the biggest real stakes, a surprising number, a named player, or a direct consequence for the reader's wallet, job or tools. Ignore duplicates, press-release fluff, opinion columns about other columns, and anything you cannot write 350 words about from the material given. If nothing is worth it, return {"pick": -1}.
2) WRITE a wholly ORIGINAL editorial about it.

HARD RULES (originality and honesty):
- Never copy or closely paraphrase any sentence, phrase or headline from the sources. Restate every fact in your own words and your own structure.
- Use only facts present in the material. Reasoning beyond them must be framed as analysis ("Here's my read", "Expect", "My bet").
- No fabricated quotes, numbers, names or dates. If the snippet is thin, write a shorter, tighter piece rather than inventing.
- The headline must be original, never a reword of the source headline, and must be TRUE to the body.

CLICK-WORTHY HEADLINE RULES: under 80 characters. Lead with the concrete thing: a number, a name, a consequence. Open a curiosity gap that the first paragraph pays off. Patterns that work: "X just did Y. Here's who gets paid", "The $N question nobody at Z will answer", "Why your [job/rent/tools] change on [date]". Banned: "you won't believe", "shocking", "game-changer", "revolutionary", clickbait that the body does not deliver on, ALL CAPS, exclamation marks.

VOICE: plain English, direct, a little wry, zero jargon unless explained in one clause. Talk to smart people who did not go to school for this. Short paragraphs. Bold the one or two numbers that matter with <b>. Use <em> for the single most important phrase in the piece.

STRUCTURE (350-520 words): a one-sentence hook, then a <h2> for each of: what actually happened (your own words), why it matters to the reader, and "The move" (one concrete, doable action for this week). Beat-specific instructions may add a section. Sources are credited automatically below the piece; do not add a sources list or links in the body.

OUTPUT: reply with STRICT JSON only, no markdown fences, no commentary:
{"pick": <index of chosen candidate>, "headline": "...", "seo_title": "under 60 chars, keyword-first version of the headline", "dek": "one-sentence subheadline, under 160 chars, adds a fact the headline withholds", "body_html": "<p>...</p><h2>...</h2><p>...</p> using only p h2 b em ul ol li", "tags": ["3-5 short lowercase strings"], "keywords": ["5-8 search phrases people would type"], "social": {"x": "post under 240 chars, first-person voice of Cory, no link (added automatically), 2 hashtags max", "linkedin": "2-3 sentence post, no link, professional but human"}, "image_queries": ["3 stock-photo search phrases, 2-4 words each, describing a real, literal, photographable scene that fits the story: a place, object or activity (e.g. 'data center corridor', 'capitol building dusk', 'robot arm factory'). No brand names, no people's names, no abstract words like innovation or future."]}`;

async function fetchPool(beat) {
  let pool = [];
  await Promise.all(beat.feeds.map(async (u) => {
    try {
      const r = await fetch(u, { headers: { "user-agent": "CorybuiltSignal/2.0 (+https://corybuilt.com)" }, signal: AbortSignal.timeout(9000) });
      if (r.ok) pool = pool.concat(parseItems(await r.text()));
    } catch (e) { console.log("feed fail", u.slice(0, 60), e.message); }
  }));
  return pool.sort((a, b) => b.pub - a.pub);
}

async function callClaude(apiKey, model, system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 2400, temperature: 0.8, system, messages: [{ role: "user", content: user }] })
  });
  const text = await res.text();
  if (!res.ok) throw new Error("anthropic " + res.status + " " + text.slice(0, 300));
  const data = JSON.parse(text);
  return (data.content || []).map(c => c.type === "text" ? c.text : "").join("");
}

async function writeOne(beat, candidates, apiKey) {
  const user = "BEAT: " + beat.label + "\nBEAT ANGLE: " + beat.angle +
    "\n\nCANDIDATES (choose one, write from it):\n" +
    JSON.stringify(candidates.map((c, i) => ({ index: i, headline: c.title, source: c.source, link: c.link,
      published: new Date(c.pub).toUTCString(), snippet: c.snippet })), null, 1);
  const models = [process.env.SIGNAL_MODEL || "claude-sonnet-4-6", "claude-sonnet-4-5", "claude-3-7-sonnet-latest"];
  let text, lastErr;
  for (const m of models) {
    try { text = await callClaude(apiKey, m, EDITORIAL, user); break; }
    catch (e) { lastErr = e; if (!/404|not_found|model/i.test(e.message)) throw e; }
  }
  if (!text) throw lastErr;
  const clean = text.replace(/```json|```/g, "").trim();
  const art = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
  if (art.pick === -1 || art.pick == null) return null;
  if (!art.headline || !art.body_html) throw new Error("bad editorial JSON");
  // strip anything outside the allowed tags
  art.body_html = String(art.body_html)
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(?!\/?(p|h2|b|em|ul|ol|li)\b)[^>]*>/gi, "")
    .replace(/<(p|h2|b|em|ul|ol|li)\s[^>]*>/gi, "<$1>");
  return art;
}

export default async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  if ((req.headers.get("x-signal-token") || "") !== internalToken()) return new Response("nope", { status: 401 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("idle: no ANTHROPIC_API_KEY", { status: 200 });

  const body = await req.json().catch(() => ({}));
  const cursor = await getJSON("cursor", { beatIdx: 0, runs: 0, log: [] });
  const covered = await getJSON("covered", []);
  const coveredSet = new Set(covered);
  const index = await loadIndex();
  const published = new Set(index.map(s => keyOf(s.headline)));

  // How many pieces this run: normally 1. On the very first real run, one per beat so the site fills up.
  const seedSlugs = new Set(SEED.map(s => s.slug));
  const engineCount = index.filter(s => !seedSlugs.has(s.slug)).length;
  let count = Math.min(Number(body.count) || (engineCount === 0 ? BEATS.length : 1), 8);
  if (body.count === "auto") count = engineCount === 0 ? BEATS.length : 1;
  const forcedBeat = body.beat ? beatById(body.beat) : null;

  const made = [];
  for (let n = 0; n < count; n++) {
    const beat = forcedBeat || BEATS[cursor.beatIdx % BEATS.length];
    if (!forcedBeat) cursor.beatIdx = (cursor.beatIdx + 1) % BEATS.length;
    cursor.runs++;
    try {
      const pool = await fetchPool(beat);
      const fresh = []; const seen = new Set();
      for (const it of pool) {
        const k = keyOf(it.title);
        if (!k || seen.has(k) || coveredSet.has(k) || published.has(k)) continue;
        seen.add(k); fresh.push(it);
        if (fresh.length >= CANDIDATES) break;
      }
      if (!fresh.length) { cursor.log.unshift({ t: Date.now(), beat: beat.id, r: "no fresh candidates" }); continue; }

      const art = await writeOne(beat, fresh, apiKey);
      if (!art) { fresh.forEach(f => coveredSet.add(keyOf(f.title))); cursor.log.unshift({ t: Date.now(), beat: beat.id, r: "nothing worth writing" }); continue; }
      const src = fresh[Math.max(0, Math.min(fresh.length - 1, Number(art.pick) || 0))];
      if (published.has(keyOf(art.headline))) { coveredSet.add(keyOf(src.title)); cursor.log.unshift({ t: Date.now(), beat: beat.id, r: "duplicate headline, skipped" }); continue; }

      const story = {
        slug: slugify(art.headline), headline: art.headline, seo_title: art.seo_title || art.headline,
        dek: art.dek || "", body_html: art.body_html, beat: beat.id,
        tags: Array.isArray(art.tags) ? art.tags.slice(0, 5) : [],
        keywords: Array.isArray(art.keywords) ? art.keywords.slice(0, 8) : [],
        social: art.social || null, date: Date.now(), author: AUTHOR,
        sources: [{ name: src.source, link: src.link }],
        image_queries: Array.isArray(art.image_queries) ? art.image_queries.filter(q => typeof q === "string").slice(0, 3) : [],
        image: null
      };
      // professional photo, matched to the piece (needs PEXELS_API_KEY; silently skipped without it)
      try { story.image = await pickPhoto(story); if (story.image) await rememberPhoto(story.image); }
      catch (e) { console.log("photo skipped", e.message); }
      await saveStory(story);
      coveredSet.add(keyOf(src.title)); coveredSet.add(keyOf(art.headline));
      published.add(keyOf(art.headline));
      const dist = await announce(story);
      cursor.log.unshift({ t: Date.now(), beat: beat.id, slug: story.slug, dist });
      made.push(story.slug);
    } catch (e) {
      console.log("writer error", beat.id, e.message);
      cursor.log.unshift({ t: Date.now(), beat: beat.id, r: "error: " + e.message.slice(0, 200) });
    }
  }
  // give older pieces (and the launch editorials) a photo too, a few per run
  try { const bf = await backfillImages(6); if (bf.done) console.log("backfilled photos:", bf.done); } catch (e) { console.log("backfill skipped", e.message); }
  cursor.lastRun = Date.now();
  cursor.log = cursor.log.slice(0, 60);
  await setJSON("cursor", cursor);
  await setJSON("covered", Array.from(coveredSet).slice(-KEEP_COVERED));
  console.log("SIGNAL WRITER done. published:", made.join(", ") || "none");
  return new Response("ok " + made.length, { status: 200 });
};
