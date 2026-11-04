# Marketing System Changelog

All notable changes, strategic deployments, and operational updates to the Brawldoku marketing system are documented in this file.

---

## [2026-11-03] - Marketing Operations Initialization & Discovery Sprint

### Added
- **Marketing Workspace Infrastructure:** Created isolated `/marketing` directory containing 14 operational files.
- **Project Audit (`PROJECT_AUDIT.md`):** Verified live URL `https://www.brawldoku.fun/` (Vercel edge hosting, apex 308 redirect, 106 brawlers, 40+ categories, Upstash Redis obscurity store). Identified critical SEO gaps (404 on `robots.txt`/`sitemap.xml`, missing canonical and Open Graph metadata).
- **Market & Competitor Research (`MARKET_RESEARCH.md`):** Conducted thorough web research identifying direct competitors (GachaGrid Brawl Stars, Brawldle.gg), benchmark platforms (PokeDoku), daily puzzle directories, and creator ecosystems (CarnageGame, Lex, Rey).
- **Technical SEO Plan (`SEO_PLAN.md`):** Formulated target keywords, drafted crawlable metadata for `index.html`, and authored production-ready `robots.txt` and `sitemap.xml`.
- **Directory Tracker (`DIRECTORY_TRACKER.md`):** Cataloged 5 high-relevance, 100% free daily puzzle directories (DailyDoku, Playlin, Dailydles, Listdle, Alldle) with complete submission drafts.
- **Community Opportunities (`COMMUNITY_OPPORTUNITIES.md`):** Mapped rules and strategies for `r/Brawlstars` (Rule 6 compliance), `r/BrawlStarsCompetitive`, `r/WebGames` (`[DEV]` post format), and YouTube/TikTok creator challenge outreach.
- **Content Library (`CONTENT_LIBRARY.md`):** Authored reusable copy across 6 distinct pillars (Daily Challenges, Obscurity Flexes, Trivia, Friend Challenges, Educational Guides, and Indie Launch Stories).
- **Content Calendar (`CONTENT_CALENDAR.md`):** Established a sustainable 14-day rolling campaign schedule.
- **Campaign Tracker (`CAMPAIGN_TRACKER.csv`):** Formatted and seeded initial campaigns (CMP-001 through CMP-005) with clear hypothesis, cost ($0), and measurement states.
- **Measurement Plan (`MEASUREMENT_PLAN.md`):** Audited `@vercel/analytics`, formulated funnel tracking enhancements (puzzle start, completion, score share), and documented GSC/Bing verification procedures.
- **Weekly Review Template (`WEEKLY_REPORT_TEMPLATE.md`):** Created standardized executive reporting framework.
- **Prioritized Backlog (`BACKLOG.md`):** Ranked 16 growth tasks across high, medium, and long-term horizons.
- **Approval Queue (`APPROVAL_QUEUE.md`):** Staged 5 concrete execution items ready for owner sign-off.

### Security & Integrity Maintained
- 100% game code and gameplay mechanics preserved intact.
- Zero secrets or API keys exposed.
- All marketing operations strictly isolated in `marketing/`.
- Strict $0 budget maintained.

### [2026-11-03] - Local Technical SEO Implementation & Asset Generation

#### Added
- **Production Asset Directory (`/public`):** Created `public/` with all critical discovery assets.
- **Search Engine Directives (`public/robots.txt`):** Allows search indexing and points crawlers to canonical sitemap.
- **Canonical Sitemap (`public/sitemap.xml`):** Declares daily change frequency and top priority for `https://www.brawldoku.fun/`.
- **Branded Social Preview Image (`public/og-image.png`):** Generated a 1200×630 high-resolution branded preview card showcasing the Brawldoku logo, 3×3 grid, obscurity tags, and brawl theme.
- **App Icons & Web Manifest (`public/favicon.svg`, `public/apple-touch-icon.png`, `public/site.webmanifest`):** Created vector favicon and 192×192 Apple touch icon with PWA manifest.

#### Changed
- **HTML Document Metadata (`index.html`):**
  - Added canonical URL `<link rel="canonical" href="https://www.brawldoku.fun/" />`.
  - Added full Open Graph metadata (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`).
  - Added Twitter summary_large_image card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
  - Added Schema.org JSON-LD structured data (`WebApplication` / `VideoGame`, free-to-play).
  - Added semantic `<noscript>` fallback for search bot crawlers that run without client-side JavaScript execution.
- **Verification:** Tested with `npm test` (all 24 tests passing) and `npm run build` (all assets bundled into `dist/`). Verified locally on dev server (`http://localhost:5173/`).

