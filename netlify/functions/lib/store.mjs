// THE SIGNAL — shared library: beats, storage, distribution.
// Not a function itself (lives in lib/), imported by the signal-* functions.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { SEED } from "../signal-seed.mjs";

export const SITE = (process.env.SITE_URL || "https://corybuilt.com").replace(/\/$/, "");
export const AUTHOR = "Cory Suida";
export const BYLINE = "Creator | Cory Suida";
export const CREATOR_PHOTO = "/assets/creator.jpg";   // drop your photo at this path
export const OG_IMAGE = "/assets/og-signal.png";
export const INDEXNOW_KEY = "28b5224307d586722360873a607728be"; // must match /<key>.txt at site root

const gn = (q) => "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";

// The four beats. The engine rotates through them in order, one fresh piece per run.
export const BEATS = [
  {
    id: "money",
    label: "Money & Opportunity",
    kicker: "where the money is landing",
    blurb: "IPOs, funding rounds, hiring waves, raises and the side doors that open every time tech money moves.",
    feeds: [
      gn("AI startup funding OR raises OR valuation when:1d"),
      gn("tech IPO OR stock surge AI when:1d"),
      gn("AI jobs hiring salary OR layoffs when:2d"),
      gn("data center OR chips investment billion when:2d")
    ],
    angle: "Land the money angle hard: who is getting paid, which skills or trades are suddenly in demand, what a solo builder or regular worker could do this month to get a piece of it. Name real numbers."
  },
  {
    id: "policy",
    label: "Trump & Tech Policy",
    kicker: "washington vs. the machines",
    blurb: "Executive orders, tariffs, chip rules, AI regulation, antitrust and crypto policy — and what each one does to your job, your rates and your business.",
    feeds: [
      gn("Trump AI when:1d"),
      gn("Trump tariffs chips OR semiconductors OR Nvidia when:2d"),
      gn("White House executive order technology OR AI when:2d"),
      gn("Trump crypto OR bitcoin OR stablecoin policy when:2d"),
      gn("FTC OR DOJ antitrust Google OR Apple OR Meta OR Amazon when:2d")
    ],
    angle: "Report what the policy actually does, who it hits, who it helps, and what it means for a builder, freelancer or small business. Strictly non-partisan: no cheerleading, no bashing, no loaded adjectives. Readers across the spectrum should feel respected. Translate the politics into concrete consequences and moves."
  },
  {
    id: "tools",
    label: "New AI Tools",
    kicker: "try it before everyone else",
    blurb: "Model drops, open-source releases, agent frameworks and dev tools — the stuff that makes you the person at work who already knows.",
    feeds: [
      gn("new AI model released OR launches when:1d"),
      gn("open source AI model OR weights released when:2d"),
      gn("OpenAI OR Anthropic OR Gemini OR Meta AI OR Mistral OR DeepSeek launch when:1d"),
      gn("AI coding agent OR developer tool launch when:2d"),
      "https://techcrunch.com/category/artificial-intelligence/feed/"
    ],
    angle: "Tell a curious nerd exactly what this is, what it can do that yesterday's tools could not, what it costs, and how to try it in the next 10 minutes. Be concrete about capabilities and honest about limits. Include a 'Try it in 10 minutes' section with numbered steps."
  },
  {
    id: "family",
    label: "AI for Your Family",
    kicker: "earn more, spend less, sleep better",
    blurb: "Legit, practical ways regular people are using AI to earn, save, reskill and run a small business — no hype, no get-rich-quick.",
    feeds: [
      gn("AI side hustle OR freelance income real when:3d"),
      gn("small business using AI automation saves when:3d"),
      gn("AI upskilling OR reskilling workers program when:3d"),
      gn("AI tools save money household OR family budget when:3d"),
      gn("AI freelancers earning OR gig economy when:3d")
    ],
    angle: "Focus on legitimate, repeatable ways a parent, worker or small-business owner can use this to earn or save real money. Show the math where possible (hours saved, dollars earned). Call out scams and unrealistic promises. End with one concrete thing they can do this week with free or cheap tools."
  }
];
export const beatById = (id) => BEATS.find(b => b.id === id) || BEATS[0];

// Beats for the five launch editorials (they predate the beat system).
const SEED_BEATS = {
  "ai-pay-raise-nobody-can-explain": "family",
  "eu-label-law-live-aug-2026": "policy",
  "730-billion-ai-buildout-jobs": "money",
  "unitree-ipo-robot-gold-rush": "money",
  "twitch-default-optin-training-data": "tools"
};

const store = () => getStore("signal");
const metaOf = (s) => ({
  slug: s.slug, headline: s.headline, dek: s.dek || "", date: s.date,
  author: s.author || AUTHOR, beat: s.beat || SEED_BEATS[s.slug] || "money",
  tags: s.tags || [], sources: s.sources || [], social: s.social || null,
  seo_title: s.seo_title || s.headline,
  image: s.image || null,                 // { url, large, thumb, alt, credit, creditUrl, link, color, provider }
  image_queries: s.image_queries || []    // Claude's photo search phrases, kept so a re-pick can reuse them
});

// ---- INDEX: metadata for every story ever published (kept forever) ----
export async function loadIndex() {
  const st = store();
  let idx = await st.get("index", { type: "json" });
  if (!idx) {
    // one-time migration from the phase-2 "stories" blob (full objects)
    const legacy = (await st.get("stories", { type: "json" })) || [];
    idx = [];
    for (const s of legacy) {
      idx.push(metaOf(s));
      await st.setJSON("body/" + s.slug, { body_html: s.body_html });
    }
    await st.setJSON("index", idx);
  }
  const seen = new Set(idx.map(s => s.slug));
  const merged = idx.concat(SEED.filter(s => !seen.has(s.slug)).map(metaOf));
  merged.sort((a, b) => b.date - a.date);
  return merged;
}

export async function getStory(slug) {
  const idx = await loadIndex();
  const meta = idx.find(s => s.slug === slug);
  if (!meta) return null;
  const seed = SEED.find(s => s.slug === slug);
  if (seed) return { ...meta, body_html: seed.body_html };
  const body = await store().get("body/" + slug, { type: "json" });
  return body ? { ...meta, body_html: body.body_html } : null;
}

export async function saveStory(story) {
  const st = store();
  const idx = (await st.get("index", { type: "json" })) || [];
  await st.setJSON("body/" + story.slug, { body_html: story.body_html });
  idx.unshift(metaOf(story));
  await st.setJSON("index", idx);
}

// Patch one story's metadata in place (used for photos). A launch editorial that only exists in
// SEED is copied into the index first so the patch has somewhere to live.
export async function updateStoryMeta(slug, patch) {
  const st = store();
  const idx = (await st.get("index", { type: "json" })) || [];
  let i = idx.findIndex(s => s.slug === slug);
  if (i < 0) {
    const seed = SEED.find(s => s.slug === slug);
    if (!seed) return null;
    idx.push(metaOf(seed));
    i = idx.length - 1;
  }
  idx[i] = { ...idx[i], ...patch };
  await st.setJSON("index", idx);
  return idx[i];
}

export async function getJSON(key, fallback) {
  return (await store().get(key, { type: "json" })) ?? fallback;
}
export async function setJSON(key, val) {
  return store().setJSON(key, val);
}

// ---- helpers ----
export const esc = (x) => String(x || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const keyOf = (t) => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
export const slugify = (t) =>
  String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 64).replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);
export const articleUrl = (slug) => SITE + "/signal/" + slug;
export const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
export const ago = (ms) => {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60); if (h < 36) return h + "h ago";
  return Math.round(h / 24) + "d ago";
};

// Internal trigger token: derived from the API key so nothing extra has to be configured.
export const internalToken = () =>
  createHash("sha256").update("signal:" + (process.env.ANTHROPIC_API_KEY || "")).digest("hex").slice(0, 40);

// ---- RSS parsing (RSS 2.0 items) ----
export function parseItems(xml) {
  const out = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const it of items) {
    const pick = (tag) => {
      const m = it.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">"));
      if (!m) return "";
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    };
    const raw = pick("title").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
    if (!raw) continue;
    const cut = raw.lastIndexOf(" - ");
    const src = pick("source");
    out.push({
      title: cut > 20 ? raw.slice(0, cut) : raw,
      source: src || (cut > 20 ? raw.slice(cut + 3) : "Wire"),
      link: pick("link") || (it.match(/<link>([^<]+)/) || [])[1] || "",
      pub: new Date(pick("pubDate") || Date.now()).getTime() || Date.now(),
      snippet: pick("description").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim().slice(0, 600)
    });
  }
  return out;
}

// ---- DISTRIBUTION: tell the world a new piece exists ----
export async function announce(meta) {
  const url = articleUrl(meta.slug);
  const results = {};
  const t = (p, ms = 8000) => Promise.race([p, new Promise(r => setTimeout(() => r("timeout"), ms))]);

  // 1) IndexNow: instant indexing for Bing, Yandex, Naver, Seznam (and Google via crawl of sitemap).
  results.indexnow = await t(fetch("https://api.indexnow.org/indexnow", {
    method: "POST", headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: SITE.replace(/^https?:\/\//, ""), key: INDEXNOW_KEY,
      keyLocation: SITE + "/" + INDEXNOW_KEY + ".txt", urlList: [url, SITE + "/signal", SITE + "/feed.xml", SITE + "/news-sitemap.xml"] })
  }).then(r => r.status).catch(e => "err " + e.message));

  // 2) WebSub hub ping so RSS subscribers/aggregators (Feedly, Inoreader, etc.) pull immediately.
  results.websub = await t(fetch("https://pubsubhubbub.appspot.com/", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "hub.mode=publish&hub.url=" + encodeURIComponent(SITE + "/feed.xml")
  }).then(r => r.status).catch(e => "err " + e.message));

  // 3) Optional social auto-post: set SOCIAL_WEBHOOK_URL (Zapier / Make / IFTTT / Postiz / Buffer / n8n)
  //    and it receives ready-to-post copy for X, LinkedIn, Threads, Facebook.
  const hook = process.env.SOCIAL_WEBHOOK_URL;
  if (hook) {
    const beat = beatById(meta.beat);
    const payload = {
      headline: meta.headline, dek: meta.dek, url, beat: beat.label, tags: meta.tags,
      image: SITE + OG_IMAGE, author: BYLINE, published: new Date(meta.date).toISOString(),
      x: (meta.social && meta.social.x) || (meta.headline + " " + url),
      linkedin: (meta.social && meta.social.linkedin) || (meta.headline + "\n\n" + meta.dek + "\n\n" + url),
      threads: (meta.social && meta.social.x) || (meta.headline + " " + url),
      facebook: (meta.social && meta.social.linkedin) || (meta.headline + "\n\n" + meta.dek + "\n\n" + url)
    };
    results.social = await t(fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      .then(r => r.status).catch(e => "err " + e.message));
  }
  return results;
}
