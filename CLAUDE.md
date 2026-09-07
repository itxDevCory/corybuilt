# CORYBUILT — project notes for Claude

Read this before touching anything. It captures how the site is built,
how it deploys, and the mistakes that already took the site down once.

## What this is

corybuilt.com — a single-file landing page (`index.html`) plus
"The Corybuilt Signal", a robot newsroom running on Netlify Functions.
Owner: Cory Suida (corysuida@gmail.com). GitHub: itxDevCory.

- `index.html` — the whole homepage (markup, CSS, JS, animation) in one file.
- `netlify/functions/*.mjs` — the Signal: scheduler, writer, article pages,
  archive, RSS, sitemaps, cover art, Pexels photo matching.
- `netlify/functions/lib/store.mjs` — beats, feeds, storage (Netlify Blobs),
  distribution (IndexNow, WebSub). `page.mjs` — HTML chrome for Signal pages.
- `28b5224307d586722360873a607728be.txt` — IndexNow key file, served at the
  site root on purpose. Leave it; it must match `INDEXNOW_KEY` in store.mjs.
- `README-SIGNAL.txt` — full description of the Signal engine and its admin URLs.
- `netlify.toml` — publish dir `.`, functions dir `netlify/functions`,
  esbuild bundler, redirects for /feed.xml and sitemaps.

## Hosting (Netlify)

- Project name `corybuilt`, team `itxdevcory`, site ID
  `35a8bbe8-b462-499f-9ec3-1236b1f691f0`, dashboard
  https://app.netlify.com/projects/corybuilt
- Production branch: `master`. Auto-publish is ON: every push to `master`
  builds and goes live. There is no build command; Netlify runs `npm install`
  from `package.json` (needed for `@netlify/blobs`) and bundles the functions.
- Fallback / manual deploy from this folder: `netlify deploy --prod --dir .`
  (the folder is linked to the site via `.netlify/state.json`).
- Environment variables live ONLY in Netlify (Project configuration →
  Environment variables), never in the repo: `ANTHROPIC_API_KEY`,
  `SIGNAL_TOKEN`, `PEXELS_API_KEY`, optional `SIGNAL_MODEL`, `SOCIAL_WEBHOOK_URL`.

## DNS and HTTPS — do not "fix" what is already right

- DNS for corybuilt.com is at **Hostinger** (nameservers
  `nebula.dns-parking.com` / `aurora.dns-parking.com`). Records:
  `A corybuilt.com → 75.2.60.5` (Netlify load balancer),
  `CNAME www → corybuilt.netlify.app`, `MX → mx1/mx2.hostinger.com` (email).
- **Never add an AAAA record** for corybuilt.com. A stray Hostinger AAAA
  (`2a02:4780:...`) once sent IPv6 traffic to Hostinger and broke
  Let's Encrypt validation.
- **Never create a Netlify DNS zone for corybuilt.com** unless the nameservers
  are actually moved to Netlify (and the MX/SPF/DKIM records copied first).
  An inactive Netlify DNS zone makes certificate provisioning fail.
- The TLS certificate is Let's Encrypt via Netlify, covers apex + www,
  auto-renews. If it ever fails: Domain management → Verify DNS configuration.
- ezcheatsheets.com is a DIFFERENT site whose DNS really is on Netlify DNS.
  Do not confuse the two.

## The incident of 2026-09-06 (why the rules above exist)

The Netlify project was linked to the wrong GitHub repo
(`itxDevCory/microsaas-acad`, an old Next.js app called "AIWebology").
A git build fired and auto-published over the real site. Fix was:
republish the last good CLI deploy, unlink that repo. Rules:

- The ONLY repo that may be linked to the `corybuilt` Netlify project is
  `github.com/itxDevCory/corybuilt` (this repo).
- Before linking or changing repos, build settings, or DNS, ask Cory.
- If the live site ever shows the wrong content, check
  Deploys → which deploy is "Published", and republish the last good one.

## How to ship a change

1. Edit files in this repo (prefer editing existing files over adding new ones).
2. Commit with a clear message and push to `master`.
3. Watch the build: https://app.netlify.com/projects/corybuilt/deploys
   (or the Netlify integration). A build takes well under a minute.
4. Verify in a browser before saying it is done:
   - https://corybuilt.com → title "CORYBUILT — Can a machine build a business?"
   - https://www.corybuilt.com → redirects to the apex, no certificate warning
   - https://corybuilt.com/signal → archive loads; open one article
   - https://corybuilt.com/feed.xml → RSS renders (function, not a static file)
5. If a function crashes with "Cannot find package '@netlify/blobs'", the
   deploy was made without dependencies: make sure `package.json` is in the
   repo (it is) and that the deploy came from git, or run `npm install` before
   a CLI deploy.

## Signal admin (needs SIGNAL_TOKEN from Netlify env; never commit it)

- Run now: `https://corybuilt.com/signal-admin/run?token=…` (`&beat=tools&count=2`)
- Status/log: `https://corybuilt.com/signal-admin/status?token=…`
- Photos: `https://corybuilt.com/signal-admin/images?token=…`
  (`&slug=<slug>&q=<search>` to swap one, `&force=1` to re-pick)
- Schedule: `17 */2 * * *` in `signal-engine.mjs` (every 2 hours, 4 beats).

## Conventions

- Keep the site static-first: one `index.html`, functions only for the Signal.
- Don't commit `node_modules`, `.netlify`, `.DS_Store`, or any `.env*`.
- Don't add new top-level files unless there is no existing place for them.
- Anything that changes hosting, DNS, domains, or env vars: confirm with Cory first.
