# Approval Queue: Actions Awaiting Owner Authorization

**Status:** 5 Actions Staged and Ready for Owner Review  
**Governance:** Under our operating rules, no public post, directory submission, or production code change occurs without explicit owner approval.

---

## Quick Decision Table

| Item ID | Proposed Action | Destination / Target | Impact | Risk | Approval Status |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **APV-001** | Commit & Deploy Technical SEO Assets & Metadata | Git `main` & Vercel Production (`https://www.brawldoku.fun/`) | High | Negligible | ⏳ Awaiting Approval to Deploy |
| **APV-002** | Submit to Daily Puzzle Directories | DailyDoku, Playlin, Dailydles, Listdle, Alldle | High | Negligible | ⏳ Awaiting Approval |
| **APV-003** | Publish OC Community Showcase | `r/Brawlstars` | High | Low | ⏳ Awaiting Approval |
| **APV-004** | Publish Developer Showcase | `r/WebGames` | Medium | Low | ⏳ Awaiting Approval |
| **APV-005** | Add Google Search Console Property | Google Search Console DNS / Meta Tag | High | Negligible | ⏳ Awaiting Approval |

---

## Detailed Action Items

### Item APV-001: Commit & Deploy Technical SEO Assets & Metadata
- **Status:** **Implemented & Verified Locally** (Passed all 24 unit tests, `vite build`, and verified on dev server).
- **Proposed Production Action:** Commit the new `public/` assets (`robots.txt`, `sitemap.xml`, `favicon.svg`, `og-image.png`, `apple-touch-icon.png`, `site.webmanifest`) and modified `index.html` to Git, and trigger a Vercel production deployment.
- **Rationale:** The production site currently returns HTTP 404 for `robots.txt` and `sitemap.xml`, has no canonical link, and generates blank link previews when players share their scores on Discord or social networks. Deploying this immediately resolves crawler indexing and provides rich visual preview cards.
- **Exact Code Changes:** Documented in [`SEO_PLAN.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/SEO_PLAN.md#2-technical-seo-audit--proposed-fixes) and [`CHANGELOG.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CHANGELOG.md).
- **Exact Approval Required:** *"Approved to commit and deploy technical SEO assets to production."*

---

### Item APV-002: Submit to Free Daily Game Directories
- **Proposed Action:** Submit Brawldoku to the 5 top verified daily game directories:
  1. **DailyDoku** (`https://daily-doku.com`) via "Suggest a game".
  2. **Playlin** (`https://playlin.io`) via "Submit your game".
  3. **Dailydles** (`https://dailydles.com`) via submission form.
  4. **Listdle** (`https://listdle.com`) via game URL input.
  5. **Alldle** (`https://alldle.net`) via developer listing.
- **Rationale:** These directories cater directly to players seeking new daily puzzles. Listing is 100% free, permanent, and drives high-intent recurring traffic.
- **Exact Submission Copy:** Documented in [`DIRECTORY_TRACKER.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/DIRECTORY_TRACKER.md).
- **Exact Approval Required:** *"Approved to submit to directories [All or specify]." (The owner may perform the submissions manually using our ready-made copy or authorize the agent to assist where technically feasible).*

---

### Item APV-003: Publish Community Showcase on r/Brawlstars
- **Proposed Action:** Post an authentic, high-effort showcase introducing Brawldoku to the 1.8M-member Brawl Stars subreddit.
- **Destination:** `https://reddit.com/r/Brawlstars/`
- **Rationale:** Massive concentration of target players. When framed as a free, fan-made tribute complying with Supercell's Fan Content Policy and Rule 6, original fan creations frequently reach the front page.
- **Draft Post:**
  > **Title:** I made Brawldoku — a free daily 3×3 category puzzle for Brawl Stars (like PokeDoku / Immaculate Grid) [OC]
  > 
  > **Post Body:**
  > Hey r/Brawlstars!
  > 
  > I've been playing daily category puzzles like PokeDoku for months, and I wanted one built specifically for the Brawl Stars universe.
  > 
  > So I built **Brawldoku** (`https://www.brawldoku.fun/`).
  > 
  > **How it works:**
  > - You get a 3×3 grid with 9 intersecting categories (e.g. *Damage Dealer + Released in 2019*, *Has Hypercharge + Fast Reload*, *Marksman + Single Shot*).
  > - You have 9 guesses to fill all 9 cells using the full roster of 106 brawlers.
  > - Real-time community obscurity scoring: after each correct pick, see what percentage of other players chose the same brawler. Hunt for the rarest valid picks!
  > - A brand new board generates automatically every day at midnight UTC.
  > 
  > It is 100% free, has no ads, no logins, and runs straight in your mobile or desktop browser.
  > 
  > I’d love to hear your thoughts, category suggestions, and what scores you get on today's grid!
  > 
  > *Disclaimer: Fan-made puzzle game. This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it.*
- **Exact Approval Required:** *"Approved to post to r/Brawlstars with the provided draft."*

---

### Item APV-004: Publish Developer Showcase on r/WebGames
- **Proposed Action:** Post a developer showcase thread on `r/WebGames`.
- **Destination:** `https://reddit.com/r/WebGames/`
- **Rationale:** Reaches 600k+ players who love browser games. Strictly permits developer promotion when tagged `[DEV]` and when the game requires no downloads or accounts.
- **Draft Post:**
  > **Title:** [DEV] Brawldoku — A daily 3×3 category grid puzzle for Brawl Stars fans (free, no ads, resets daily)
  > 
  > **Commentary:**
  > Link: https://www.brawldoku.fun/
  > 
  > Hey r/WebGames! I built Brawldoku, a daily category-matching puzzle inspired by PokeDoku and Immaculate Grid. Match 9 intersecting criteria from a roster of 106 characters. Features real-time obscurity scoring powered by Upstash Redis. Built with React and Tailwind. Free, no ads, no signups. Feedback on puzzle difficulty is very welcome!
- **Exact Approval Required:** *"Approved to post to r/WebGames."*

---

### Item APV-005: Setup Google Search Console Verification
- **Proposed Action:** The owner adds `https://www.brawldoku.fun/` to Google Search Console to monitor keyword rankings, crawl errors, and search impressions.
- **Rationale:** Necessary to track organic search performance and ensure rapid indexing of the canonical domain.
- **Exact Approval Required:** Owner confirms whether GSC is already active or requests DNS/HTML meta tag instructions.
