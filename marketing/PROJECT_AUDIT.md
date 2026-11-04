# Project Audit: Brawldoku

**Audit Date:** November 3, 2026  
**Auditor:** Autonomous Growth & Marketing Agent  
**Status:** Complete baseline technical & market discovery audit

---

## 1. Executive Summary

**Brawldoku** is an active, publicly deployed, daily 3×3 grid trivia puzzle game based on Supercell's *Brawl Stars*. Players match 9 intersecting criteria (3 rows × 3 columns) using unique brawlers from a verified roster of 106 characters. 

The game features an authentic daily challenge seeded deterministically by date (`YYYY-MM-DD`), persistent local storage for daily streaks and guesses, and a live production serverless obscurity API powered by Upstash Redis that calculates community rarity percentages per cell.

While the game engine, user experience, and rarity tracking are production-ready, **the website currently lacks fundamental search engine optimization (SEO) and social preview infrastructure**, significantly depressing organic search discovery and viral social referrals.

---

## 2. Verified Facts vs. Hypotheses vs. Unknowns

### Verified Facts (Confirmed via Codebase & Live Server Checks)
1. **Public URL & Hosting:**
   - Production domain: `https://www.brawldoku.fun/` (Apex `https://brawldoku.fun` redirects via HTTP 308 to `www.brawldoku.fun`).
   - Alternative Vercel alias: `https://brawldoku.vercel.app` (Returns HTTP 200).
   - Hosted on: **Vercel** edge infrastructure (`server: Vercel`, HTTP/2, SSL enabled).
2. **Git Repository:**
   - Remote origin: `https://github.com/JG62802/brawldoku.git` (main branch).
3. **Core Gameplay & Mechanics:**
   - Grid format: Strict **3×3 grid** (9 intersections).
   - Character roster: Exactly **106 playable brawlers** cataloged with complete metadata in [`src/data/brawlers.ts`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/src/data/brawlers.ts).
   - Category engine: 40+ category filters in [`src/engine/categories.ts`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/src/engine/categories.ts), including Class/Type (Damage Dealer, Tank, Assassin, Marksman, Controller, Support, Artillery), Rarity (Rare, Super Rare, Epic, Mythic, Legendary), Attack Range, Ammo/Reload mechanics, Gender/Species, Release Year (2017 to 2026), Weapon characteristics (Pets, Single-shot, AoE, Melee, Gun, Throwable), Hypercharges, Buffies, and Special Mechanics (Healer, Shield).
   - Rarity / Obscurity system: Real-time community calculation via Upstash Redis hash storage (`api/obscurity.ts` and `src/server/obscurityStore.ts`).
   - Daily puzzle seeding: Deterministic daily seed generated via `BRAWLDOKU_DAILY_V1_${dateStr}` with automatic midnight UTC rollover.
   - Sharing mechanic: Native Web Share API + clipboard fallback. Generates the exact share text:
     ```text
     LOOK AT MY SCORE! [score] BET YOU CAN'T BEAT IT!

     Brawldoku #[puzzleNumber] ([filledCount]/9)
     🟨🟨🟨
     🟨🟨🟨
     🟨🟨🟨
     https://www.brawldoku.fun/
     ```
4. **Analytics:**
   - `@vercel/analytics/react` is imported and mounted inside `<App />` (`src/App.tsx`).

### Reasonable Hypotheses
1. Vercel Web Analytics is actively recording pageviews, unique visitors, and referrers in the owner's Vercel dashboard.
2. The current daily active user (DAU) base is primarily driven by direct testing and word of mouth, as no crawlable links or directory listings exist yet.
3. Adding rich social preview cards (`og:image`) will dramatically increase the click-through rate when players share their scores on Discord, Reddit, or X/Twitter.

### Critical Unknowns (Requiring Owner Clarification)
1. Has the domain `https://www.brawldoku.fun/` been verified in **Google Search Console** or **Bing Webmaster Tools**?
2. Does the owner have established social handles (X/Twitter, TikTok, YouTube, Reddit, Discord) for Brawldoku, or should campaigns originate from the developer's personal accounts?
3. What is the current daily visitor baseline in the Vercel Analytics dashboard?

---

## 3. Technology Stack & Architecture

- **Frontend Framework:** React 18.3.1 with TypeScript 5.6.2
- **Bundler & Build Tool:** Vite 6.0.5
- **Styling:** Tailwind CSS 3.4.17 with custom Lilita One and Nunito Sans typography
- **Icons:** Lucide React (`Check`, `Share2`, etc.)
- **Serverless Backend:** Vercel Serverless Functions (`/api/obscurity.ts`) using `@vercel/node`
- **Database:** Atomic Upstash Redis pipeline (`@upstash/redis` 1.41.0) storing submissions, totals, and obscurity counts
- **Client Analytics:** `@vercel/analytics` 2.0.1
- **Testing Suite:** Vitest 2.1.8 with automated engine & obscurity integration tests

---

## 4. Technical SEO & Discovery Audit

| SEO Factor | Current State | Status | Impact |
| :--- | :--- | :---: | :--- |
| **Page Title** | `<title>Brawldoku — Daily Brawl Stars Grid Puzzle</title>` | ⚠️ Fair | Good, but misses high-intent keywords like "Trivia Game", "Brawler Quiz", or "Pokedoku". |
| **Meta Description** | `<meta name="description" content="A daily 3×3 Brawl Stars grid puzzle. Find a Brawler that fits both categories." />` | ⚠️ Fair | Clear, but lacks call-to-action ("Play today's free daily puzzle!"). |
| **Canonical URL** | Missing (`<link rel="canonical">` not declared) | ❌ Critical | Search engines might index both `brawldoku.fun` and `brawldoku.vercel.app`, diluting domain authority. |
| **Robots.txt** | HTTP 404 Not Found (`/robots.txt` does not exist) | ❌ Critical | Crawlers receive no explicit indexing instructions or sitemap location. |
| **Sitemap.xml** | HTTP 404 Not Found (`/sitemap.xml` does not exist) | ❌ Critical | Search engine crawlers have no structured map to verify crawl priority and change frequency. |
| **Open Graph (OG)** | Completely missing (`og:title`, `og:description`, `og:image`, `og:url`) | ❌ Critical | When shared on Discord, Reddit, WhatsApp, or X, the link renders as a bland naked URL with no visual card. |
| **Twitter Card** | Completely missing (`twitter:card`, `twitter:image`, etc.) | ❌ Critical | No rich summary card generated on X/Twitter. |
| **Favicon / App Icon** | Missing standard favicon links in `index.html` | ⚠️ Medium | Appears with generic browser globe icon in tabs and bookmarks. |
| **Structured Data** | Missing JSON-LD (`WebApplication` / `VideoGame` schema) | ⚠️ Medium | Search engines cannot display rich search snippets (e.g. Free, Browser Game, Puzzle). |
| **Crawlable Text** | Client-rendered SPA inside `<div id="root"></div>` | ⚠️ Medium | Crawlers with delayed JS rendering see an empty body without descriptive textual cues. |

---

## 5. Analytics & Measurement Assessment

1. **Installed:** `@vercel/analytics` provides essential traffic measurement (visitor counts, geographic distribution, top referrers, device types) without requiring third-party cookie banners.
2. **Missing Custom Events:** The application does not currently dispatch custom funnel tracking events (e.g., `puzzle_started`, `cell_filled`, `puzzle_completed`, `score_shared`, `cell_inspected`). 
3. **Recommendation:** Maintain privacy by keeping `@vercel/analytics` and adding lightweight custom event tracking via `va.track(...)` once approved by the owner.

---

## 6. Integrations & Credentials Safety Check

- **Local Workspace Permissions:** Read/Write within project directory.
- **Network / Tooling:** Web search tools and read-only curl inspection are active.
- **Account Sign-ins:** No external plugin accounts or social media API tokens are loaded in the environment.
- **Credentials Policy:** No Redis tokens, Vercel secrets, or personal keys are printed or committed to marketing documents.

---

## 7. Ranked High-Impact Growth Opportunities

| Rank | Opportunity | Channel | Expected Benefit | Effort | Owner Approval Needed? |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Deploy Essential SEO & Social Metadata** (`robots.txt`, `sitemap.xml`, Canonical, Open Graph) | Technical SEO / Viral Sharing | Immediate crawlability by Google/Bing; rich cards when players share scores on Discord/Reddit. | Low | **Yes** (modifies web assets) |
| **2** | **Submit to Free Daily Game Directories** (DailyDoku, Playlin, Dailydles, Listdle, Alldle) | Niche Web Directories | Direct, permanent influx of engaged daily puzzle players looking for new daily games. | Low | **Yes** (external submission) |
| **3** | **Launch Showcase on r/Brawlstars & r/WebGames** | Reddit Communities | Exposure to 1.8M+ Brawl Stars fans and indie web gamers via high-effort, Rule 6-compliant OC posts. | Medium | **Yes** (community posting) |
| **4** | **Establish Brawl Stars Discord & Fan Hub Presence** | Community Gaming | Direct word-of-mouth in fan communities, competitive leagues, and tier-list discussions. | Medium | **Yes** (community interaction) |
| **5** | **Creator Outreach (Brawl Stars Trivia Challenges)** | YouTube / TikTok Creators | Exponential viral reach by getting a prominent creator (e.g., CarnageGame, Lex, Rey) to solve Brawldoku on video. | High | **Yes** (creator outreach) |
