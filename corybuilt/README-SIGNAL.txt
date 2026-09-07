THE CORYBUILT SIGNAL — PHASE 3 (Sept 2026)
==========================================
A robot newsroom that publishes ORIGINAL, click-worthy editorials around the
clock, bylined "Creator | Cory Suida", and pushes every piece out to the web.

WHAT IT DOES
 - Every 2 hours (12x/day) it rotates through four beats:
     money   Money & Opportunity   IPOs, funding, hiring, raises, side doors
     policy  Trump & Tech Policy   EOs, tariffs, chips, AI rules, antitrust, crypto
     tools   New AI Tools          model drops, open source, dev tools, "try it in 10 min"
     family  AI for Your Family    legit ways to earn/save with AI, no hype
 - Pulls the freshest headlines for that beat, has Claude pick the single most
   click-worthy story and write a wholly original piece (facts restated, sources
   credited under the article), then publishes it at corybuilt.com/signal/<slug>.
 - Every article shows your photo + "Creator | Cory Suida" at the top, share
   buttons (X, LinkedIn, Facebook, Threads, Reddit, WhatsApp, email), tags, related pieces.
 - Articles are kept FOREVER. Browse all of them at corybuilt.com/signal
   (filter by beat, search). RSS at /feed.xml (full text, per-beat: /feed.xml?beat=tools).
 - GETTING ATTENTION, automatically on every publish:
     * IndexNow ping  -> Bing, Yandex, Naver, Seznam index the URL within minutes
     * WebSub ping    -> RSS readers/aggregators (Feedly, Inoreader...) pull instantly
     * /sitemap.xml + /news-sitemap.xml (Google News format) + NewsArticle schema
     * Social auto-post hook (optional, see below)
 - First run after you add the key writes one piece per beat (4) to fill the site.

TURN IT ON (one time, ~3 minutes)
 1) console.anthropic.com -> API Keys -> Create Key (starts with sk-ant-).
 2) app.netlify.com -> corybuilt -> Site configuration -> Environment variables:
      ANTHROPIC_API_KEY = (the key)
      SIGNAL_TOKEN      = (any password you make up — protects the admin URLs)
 3) Redeploy:  netlify deploy --prod --dir .
 4) Don't want to wait 2 hours? Visit
      https://corybuilt.com/signal-admin/run?token=YOURPASSWORD
    Status / log:
      https://corybuilt.com/signal-admin/status?token=YOURPASSWORD
    Force a beat or several pieces:
      /signal-admin/run?token=...&beat=tools&count=2

PROFESSIONAL PHOTOS ON EVERY PIECE (Pexels, free)
 1) pexels.com/api -> "Get Started" -> copy your API key (free; 200 requests/hour is plenty).
 2) app.netlify.com -> corybuilt -> Site configuration -> Environment variables:
      PEXELS_API_KEY = (the key)
 3) Redeploy:  netlify deploy --prod --dir .
 4) Give the existing pieces a photo right away (otherwise the engine does it a few at a time on
    its next runs):
      https://corybuilt.com/signal-admin/images?token=YOURPASSWORD
 From then on every new editorial gets a licensed, story-matched photo automatically: Claude
 suggests 3 literal scenes for the piece, the engine searches Pexels, skips photos it has already
 used, and stores the picture + photographer credit with the story. Photos show on /signal, on
 every article (with credit), in RSS (so Feedly/Inoreader show them) and as the social share image.
 Without the key, nothing breaks: stories get a generated cover (same art as the homepage wire).
 Don't like a photo? Pick another:
      /signal-admin/images?token=...&slug=<the-slug>&q=data center corridor
 or let it re-pick automatically:  /signal-admin/images?token=...&slug=<the-slug>&force=1
 Status (how many pieces have a photo): /signal-admin/status?token=...

YOUR PHOTO
 Save it as  assets/creator.jpg  (square, ~400x400, under 200 KB) and redeploy.
 Until it exists the byline simply shows without a picture.

AUTO-POST TO X / LINKEDIN / THREADS / FACEBOOK (optional)
 Set env var SOCIAL_WEBHOOK_URL to a webhook from Zapier, Make, n8n, IFTTT,
 Buffer or Postiz. On every publish the engine POSTs JSON:
   { headline, dek, url, beat, tags, image, author, published,
     x: "ready-to-post text", linkedin: "...", threads: "...", facebook: "..." }
 Map those fields to your social accounts in the webhook tool — done.

ONE-TIME SUBMISSIONS WORTH DOING (10 minutes total, big payoff)
 - Google Search Console: add corybuilt.com, submit /sitemap.xml and /news-sitemap.xml
 - Bing Webmaster Tools: add site (IndexNow already pings it; verify to see stats)
 - Google Publisher Center: submit corybuilt.com/feed.xml for Google News
 - Flipboard: create a magazine, add /feed.xml       - Feedly: add /feed.xml

COST / SETTINGS
 ~12 pieces/day on Sonnet ≈ $5–10/month. Env var SIGNAL_MODEL overrides the model.
 Schedule lives in netlify/functions/signal-engine.mjs  ("17 */2 * * *").
 Beats, feeds and angles live in netlify/functions/lib/store.mjs.
 The editorial prompt lives in netlify/functions/signal-writer-background.mjs.

FILES
 netlify/functions/signal-engine.mjs             scheduler (every 2h) -> triggers writer
 netlify/functions/signal-writer-background.mjs  fetch, pick, write, publish, announce
 netlify/functions/signal-run.mjs                /signal-admin/run and /status
 netlify/functions/signal-page.mjs               /signal/<slug> article page
 netlify/functions/signal-index.mjs              /signal archive
 netlify/functions/signal-feed.mjs               JSON (homepage Live Wire, load more)
 netlify/functions/signal-rss.mjs                /feed.xml
 netlify/functions/signal-sitemap.mjs            /sitemap.xml, /news-sitemap.xml
 netlify/functions/signal-seed.mjs               the 5 launch editorials
 netlify/functions/signal-cover.mjs              /signal-cover/<slug>.svg generated cover (no-photo fallback)
 netlify/functions/lib/store.mjs, page.mjs       beats, storage, distribution, HTML chrome (flat dark reader)
 netlify/functions/lib/images.mjs                Pexels photo matching, backfill, credits
 netlify/functions/lib/cover.mjs                 generated cover art (shared with the homepage wire)
 assets/og-signal.png                            social share image
 28b5224307d586722360873a607728be.txt            IndexNow key file (leave it)
