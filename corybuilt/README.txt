CORYBUILT.COM — LANDING PAGE
============================

WHAT THIS IS
One file: index.html. The entire site — visuals, animation,
liquid background, everything — lives in that single file.
To preview it right now: double-click index.html. It opens
in your browser. No installs needed.

PUT IT ONLINE (one command)
1. Unzip this folder.
2. Open Terminal. Type  cd  followed by a space, drag the
   unzipped "corybuilt" folder onto the Terminal window,
   press Return.
3. Paste this single command and press Return:

   npm install -g netlify-cli && netlify login && netlify deploy --prod --dir .

   - A browser tab opens -> click "Authorize".
   - Terminal asks "Create & configure a new project?" ->
     press Return to say yes, name it  corybuilt , and press
     Return through the remaining prompts.
4. Terminal prints a "Website URL". That is your live site.

CONNECT THE CORYBUILT.COM DOMAIN
Netlify dashboard -> the new "corybuilt" site -> Domain
management -> "Add a domain" -> type corybuilt.com -> follow
the DNS records it shows you (you add those two records at
the registrar where you bought the domain). HTTPS switches
on by itself within about an hour.

TWO THINGS TO SWAP BEFORE SHARING
Open index.html in any text editor and use Find & Replace:
1. admin@corybuilt.com  -> your real inbox (appears 7 times)
2. admin@corybuilt.com  -> your real inbox (appears 1 time)
Prices, product names and all wording are plain text in the
middle of the file — change any of it, save, then re-run just:
   netlify deploy --prod --dir .

WHAT'S BUILT IN
- WebGL liquid-fabric background (cyan/orange, mouse + scroll reactive)
- Inertial smooth scrolling with full iPhone touch support
- 3D parallax hero with letter-by-letter intro + preloader
- Spotlight product cards, magnetic CTA button, custom cursor
- Section counter, progress bar, film grain, marquee
- Falls back gracefully on old browsers, respects reduced-motion

THE SIGNAL (subscribers)
Every email submitted through "JOIN THE SIGNAL" is captured by
Netlify Forms. To see and export them: app.netlify.com -> your
corybuilt site -> Forms -> "signal" -> Export CSV.
Note: capture only works on the Netlify-hosted site (corybuilt.com),
not on preview copies. First 100 signups/month are free on Netlify.

PHASE 2 - THE SIGNAL ENGINE (original editorials, byline Cory Suida)
The site now ships with a robot newsroom. Every 2 hours it:
 1) pulls the freshest AI / regulation / jobs headlines,
 2) writes a brand-new original editorial about each one (facts
    restated in our own words, original headline, sources credited
    at the bottom of every article - this is what keeps it clean
    of plagiarism),
 3) publishes it at corybuilt.com/signal/<slug> with full SEO,
 4) rebuilds the RSS feed at /feed.xml automatically,
 5) shows the newest pieces in the LIVE WIRE panel on the homepage.

TO TURN THE ENGINE ON (one-time, ~2 minutes):
 1) Go to console.anthropic.com -> API Keys -> Create Key.
    Copy the key (it starts with sk-ant-).
 2) Go to app.netlify.com -> your corybuilt site ->
    Site configuration -> Environment variables -> Add a variable.
    Key:   ANTHROPIC_API_KEY
    Value: (paste the key)  -> Save.
 3) Redeploy the site:  netlify deploy --prod
The first editorials appear within 2 hours of deploy.
Running cost: roughly a few dollars a month at this pace.
Without the key the site still works; the wire just shows raw
headlines instead of our own editorials.

LAUNCH EDITORIALS (already in the database)
Five original pieces, written by Cory Suida, ship with the site and
are live the moment you deploy - no API key needed for these:
  /signal/ai-pay-raise-nobody-can-explain
  /signal/eu-label-law-live-aug-2026
  /signal/730-billion-ai-buildout-jobs
  /signal/unitree-ipo-robot-gold-rush
  /signal/twitch-default-optin-training-data
They appear in the LIVE WIRE panel, in /feed.xml, and each has its
own SEO page. The API key is only needed for the auto-pilot engine
that adds NEW pieces every 2 hours on top of these.
