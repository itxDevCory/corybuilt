// THE SIGNAL — professional imagery. One licensed Pexels photo per story, matched to what the
// piece is actually about. Needs env var PEXELS_API_KEY (free: https://www.pexels.com/api/).
// Without the key every story falls back to a generated cover (see cover.mjs) — nothing breaks.
import { getJSON, setJSON, loadIndex, updateStoryMeta, beatById, SITE } from "./store.mjs";

const API = "https://api.pexels.com/v1/search";
const USED_KEY = "used_photos";          // last N photo ids so the archive never repeats a picture
const USED_MAX = 400;

// Photographable scenes for the things this wire writes about. First match wins per group;
// several groups can match one story, and the strongest matches are tried first.
const SCENES = [
  [/robot|humanoid|unitree|android/i,                                  "humanoid robot"],
  [/data ?cent|server room|racks|capex|infrastructure|build-?out/i,     "data center server room", 1.3],
  [/\bchips?\b|semiconductor|nvidia|\bgpus?\b|tsmc|wafer/i,             "semiconductor chip closeup"],
  [/paycheck|salary|raise|wage|\bpay\b|compensation/i,                  "paycheck payroll office desk"],
  [/\bjobs?\b|hiring|layoff|worker|employ|career|recruit/i,             "office workers meeting", 0.7],
  [/trump|white house|executive order|oval office/i,                    "white house washington dc"],
  [/congress|senate|\blaw\b|regulat|\bact\b|policy|legislat|bill\b/i,   "capitol building washington dc"],
  [/europe|\beu\b|brussels|european/i,                                  "european parliament flags"],
  [/court|lawsuit|judge|antitrust|\bftc\b|\bdoj\b|ruling/i,             "courthouse columns gavel"],
  [/tariff|trade war|shipping|import|export|customs/i,                  "shipping containers port cranes"],
  [/\bipo\b|stock|shares|market|nasdaq|valuation|debut|wall street|investor/i, "stock market trading screen"],
  [/crypto|bitcoin|stablecoin|blockchain|ethereum/i,                    "bitcoin cryptocurrency coin"],
  [/privacy|surveil|consent|training data|opt[- ]?in|tracking|scrap/i,  "security camera surveillance"],
  [/openai|anthropic|chatgpt|claude|gemini|\bllm|chatbot|language model/i, "artificial intelligence laptop screen"],
  [/open[- ]source|github|developer|coding|\bcode\b|software|agent/i,   "developer coding laptop dark"],
  [/family|parent|kids|children|household|home budget/i,                "family kitchen table laptop"],
  [/side hustle|freelanc|\bgig\b|small business|entrepreneur|shop owner/i, "small business owner laptop workshop"],
  [/school|student|teacher|education|learn|upskill|reskill|course|degree/i, "student studying laptop library"],
  [/tesla|autonomous|self-driving|robotaxi|electric vehicle|\bev\b/i,    "electric car charging station"],
  [/drone/i,                                                            "drone flying aerial"],
  [/iphone|smartphone|android phone|\bapp\b|apps\b/i,                   "smartphone hands apps"],
  [/amazon|warehouse|delivery|logistics/i,                              "warehouse logistics packages"],
  [/google|apple|meta\b|microsoft|big tech|silicon valley/i,            "tech company headquarters glass building"],
  [/energy|power grid|electricity|nuclear|solar|utility/i,              "power lines electricity sunset"],
  [/health|hospital|doctor|medical|patient/i,                           "doctor hospital tablet"],
  [/\bbank\b|loan|mortgage|\bfed\b|interest rate|inflation|treasury/i,  "bank building columns"],
  [/twitch|stream|creator|youtube|podcast|video/i,                      "streaming setup microphone camera"],
  [/music|song|artist|record label/i,                                   "music studio headphones"],
  [/factory|manufactur|assembly line|plant\b/i,                         "factory assembly line"],
  [/money|billion|trillion|funding|invest|dollar|cash|revenue|profit/i, "hundred dollar bills stack", 0.6]
];
// third column: optional weight — concrete scenes (a data center) beat generic ones (a pile of cash).

const BEAT_SCENES = {
  money:  ["city skyline business district", "stock market chart screen", "cash money desk"],
  policy: ["capitol building washington dc", "white house washington", "government building columns"],
  tools:  ["laptop code screen developer", "circuit board technology closeup", "modern office computer screen"],
  family: ["family laptop kitchen", "parent working from home", "home office desk"]
};

// Rank candidate search phrases for a story: Claude's own suggestions first, then keyword scenes
// weighted by where they matched (headline counts most), then generic beat scenes.
export function queriesFor(s) {
  const out = [];
  for (const q of (s.image_queries || [])) if (q && typeof q === "string") out.push(q.trim());
  const hl = s.headline || "", dk = s.dek || "", tg = (s.tags || []).join(" ");
  const scored = [];
  for (const [re, q, w] of SCENES) {
    const score = ((re.test(hl) ? 3 : 0) + (re.test(tg) ? 2 : 0) + (re.test(dk) ? 1 : 0)) * (w || 1);
    if (score) scored.push([score, q]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  for (const [, q] of scored.slice(0, 3)) out.push(q);
  for (const q of (BEAT_SCENES[s.beat] || BEAT_SCENES.money)) out.push(q);
  return Array.from(new Set(out.filter(Boolean)));
}

async function searchPexels(query, key) {
  const u = API + "?query=" + encodeURIComponent(query) + "&per_page=12&orientation=landscape&size=medium";
  const r = await fetch(u, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("pexels " + r.status);
  const d = await r.json();
  return Array.isArray(d.photos) ? d.photos : [];
}

const toImage = (p, query) => ({
  id: p.id,
  url: p.src.landscape || p.src.large,        // 1200x627, right for cards, heroes and og:image
  large: p.src.large2x || p.src.large,
  thumb: p.src.medium,
  alt: p.alt || query,
  credit: p.photographer || "",
  creditUrl: p.photographer_url || "",
  link: p.url || "",
  color: p.avg_color || "#101018",
  q: query,
  provider: "pexels"
});

// Find one good, not-recently-used photo for a story. Returns null when the key is missing or
// every query comes back empty; callers treat null as "use the generated cover".
export async function pickPhoto(s, opts = {}) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const queries = opts.queries && opts.queries.length ? opts.queries : queriesFor(s);
  const used = new Set(await getJSON(USED_KEY, []));
  let fallback = null;
  for (const q of queries.slice(0, opts.max || 5)) {
    let photos = [];
    try { photos = await searchPexels(q, key); } catch (e) { console.log("pexels fail", q, e.message); continue; }
    const good = photos.filter(p => p.width >= 1200 && p.src && p.src.landscape);
    const freshOne = good.find(p => !used.has(p.id));
    if (freshOne) return toImage(freshOne, q);
    if (!fallback && good[0]) fallback = toImage(good[0], q);
  }
  return fallback;
}

export async function rememberPhoto(img) {
  if (!img || !img.id) return;
  const used = await getJSON(USED_KEY, []);
  used.push(img.id);
  await setJSON(USED_KEY, used.slice(-USED_MAX));
}

// Attach a photo to a story that has none (or re-pick with force). Persists to the index.
export async function attachPhoto(s, opts = {}) {
  const img = await pickPhoto(s, opts);
  if (!img) return null;
  await updateStoryMeta(s.slug, { image: img });
  await rememberPhoto(img);
  return img;
}

// Give every story without a picture one. Bounded so it fits inside a function run.
export async function backfillImages(limit = 8) {
  if (!process.env.PEXELS_API_KEY) return { done: 0, skipped: "no PEXELS_API_KEY" };
  const idx = await loadIndex();
  const todo = idx.filter(s => !s.image).slice(0, limit);
  const done = [];
  for (const s of todo) {
    try { const img = await attachPhoto(s); if (img) done.push({ slug: s.slug, q: img.q, credit: img.credit }); }
    catch (e) { console.log("backfill fail", s.slug, e.message); }
  }
  return { done: done.length, remaining: Math.max(0, idx.filter(s => !s.image).length - done.length), items: done };
}

// What to render for a story: the photo when there is one, else the generated cover.
export function imageOf(s) {
  if (s && s.image && s.image.url) {
    return { src: s.image.url, large: s.image.large || s.image.url, thumb: s.image.thumb || s.image.url,
      alt: s.image.alt || s.headline, credit: s.image.credit, creditUrl: s.image.creditUrl, link: s.image.link, photo: true };
  }
  const src = SITE + "/signal-cover/" + encodeURIComponent(s.slug) + ".svg";
  return { src, large: src, thumb: src, alt: (beatById(s.beat).label) + " — " + (s.headline || ""), credit: "", creditUrl: "", link: "", photo: false };
}
