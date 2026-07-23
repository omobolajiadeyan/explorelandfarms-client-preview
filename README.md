# ExploreLand Farms — Site Rebuild

Redesigned and rebuilt by **FreNiMi** (frenimi.com). Static HTML/CSS/JS, no build step —
deploys directly to shared hosting (Namecheap cPanel, see project memory for SSH details).

## Status

**Built:** a full multi-page site — Home, About, Properties, Team (all 15 staff), Insights
(all 33 posts), and Contact (with working PHP form handler). Homepage is the flagship
narrative (hero, story, four pillars with custom icons, gallery, values, teasers linking to
each full page). All pages share one design system, a real working navigation with
active-page highlighting, and a compact support hub that combines an instant site guide with
a direct WhatsApp handoff.

## Folder structure

```
public/                      ← deployable site root (this is what goes to public_html)
├── index.html                Homepage
├── about/index.html          Full brand story
├── properties/index.html     All 4 listings, full feature details
├── team/index.html           All 15 staff (5 leadership + 10 team), full background-removed photos
├── insights/index.html       All 33 blog posts as teaser cards
├── contact/index.html        Contact form + info + map
├── contact/send.php          Form mail handler
├── README.md                 This file
└── assets/
    ├── css/
    │   ├── variables.css      Design tokens (colors, type scale, spacing) — sampled from the logo
    │   ├── base.css           Reset + typography + scroll-reveal primitives
    │   ├── components.css     Reusable components (nav, buttons, cards, footer, page-banner, etc.)
    │   └── home.css            Hero, story split, mobile nav — shared across all pages
    ├── js/
    │   └── main.js             Navigation, motion, galleries, and support/WhatsApp hub — vanilla JS
    └── img/
        ├── brand/              Logo (flat SVG + rasterized PNG), leaf mark, favicons
        ├── hero/                Hero background
        ├── farm/                Real farm/land photography (pillars, story, gallery)
        ├── properties/          Property listing photos
        ├── team/                All 15 staff photos — background-removed, unified backdrop
        └── blog/                Insight/blog post header images

Individual blog **post** pages (33 separate articles) were not built — the Insights page is
a listing/teaser grid only. That's the next logical phase if needed.
```

`content-audit/` (sibling folder, not part of the deployable site) is the source-of-truth
archive pulled from the old live site — see `content-audit/SUMMARY.md`.

## Design system

Colors were sampled directly from the client's logo (`logo.png`) — see `assets/css/variables.css`
for the exact hex values pulled from the leaf mark and wordmark, extended into a full warm/organic
palette (deep greens, bright lime accent, cream backgrounds instead of clinical white).

Typography pairs **Fraunces** (display serif, for headings — warm/editorial, not a generic SaaS
sans) with **Manrope** (body). Motion is deliberate and restrained: scroll-reveal on every section,
a slow Ken Burns hero, an infinite marquee for core values, and hover-lift on cards — all disabled
automatically for users with `prefers-reduced-motion`.

## Known content gaps (flagged honestly, not papered over)

- **No real cattle-rearing photography** exists in the client's source material — the Cattle
  Rearing pillar currently reuses a general land photo and says so directly on the page. Flag
  this to the client; a dedicated herd photoshoot would fix it.
- The three testimonials published on the legacy homepage are represented on the new homepage.
- Property listings should be reconfirmed as currently available before this goes live — real
  estate listings go stale fast and the source data is from the old site.
- **Two team photos appear swapped on the legacy site**: the file named `ALUKO-BABATUNDE-1.png`
  shows a man in an Exploreland-branded t-shirt, while `folashade-gabriel.png` (a typically
  feminine Yoruba name) shows a different man in a business suit. Used as labeled since there's
  no way to independently verify the correct pairing — flagged on the Team page itself and here
  for the client to confirm.
- **Official logo**: all headers, footers, and organization metadata use
  `assets/img/brand/logo-official.png`. CSS applies a white treatment on dark page banners and
  footers while preserving the original green artwork on white backgrounds.

## Local preview

No build step required. From this folder:

```
php -S localhost:8090
```

Then open `http://localhost:8090` in a browser.

## Deploy

Upload the contents of `public/` to `public_html/` on the Namecheap hosting account via SFTP
(see the `reference_explorelandfarms_hosting` memory for credentials).
