# Approval Queue: Actions Awaiting Owner Authorization

**Status:** 5 Actions Staged and Ready for Owner Review  
**Governance:** Under our operating rules, no public post, directory submission, or production code change occurs without explicit owner approval.

---

## Quick Decision Table

| Item ID | Proposed Action | Destination / Target | Impact | Risk | Approval Status |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **APV-001** | Commit & Deploy Technical SEO Assets & Metadata | Git `main` & Vercel Production (`https://www.brawldoku.fun/`) | High | Negligible | ✅ **Completed & Live** (Commit `55c4fe2`) |
| **APV-002** | Submit to 5 Verified Daily Game Directories | DailyDoku, Dailydles, Playlin, Listdle, Alldle | High | Negligible | ✅ **4 Submitted & Confirmed** (Playlin on Hold) |
| **APV-003** | Publish OC Community Showcase | `r/Brawlstars` | High | Low | ⏳ Awaiting Approval |
| **APV-004** | Publish Developer Showcase | `r/WebGames` | Medium | Low | ✅ **Completed** |
| **APV-005** | Add Google Search Console Property | Google Search Console DNS TXT Record | High | Negligible | ⏳ In Progress (Owner Step) |
| **APV-006** | Creator Outreach Pitch Delivery (Batch 1) | YouTube / Instagram / TikTok Creators | Very High | Negligible | ⏳ **Staged in `CREATOR_OUTREACH.md`** (Awaiting Approval) |

---

## Detailed Action Items

### Item APV-001: Commit & Deploy Technical SEO Assets & Metadata
- **Status:** ✅ **Completed & Deployed to Production** (Verified live on `https://www.brawldoku.fun/`).
- **Results:** `robots.txt` (200), `sitemap.xml` (200), `og-image.png` (200), canonical link verified live.

---

### Item APV-002: Submit to Free Daily Game Directories
- **Status:** **All 5 Forms Filled & Staged** (Verified via headless Chrome inspection; proof screenshots captured in artifacts directory; final submit buttons NOT clicked).
- **Sub-Items for Individual Sign-Off:**
  - **Item 2A: DailyDoku** (`https://www.daily-doku.com/`)
    - *Staged Fields:* Name: `Brawldoku`, URL: `https://www.brawldoku.fun/`
    - *Contact info:* None needed. Submit button enabled.
    - *Approval needed:* "Approved to submit DailyDoku."
  - **Item 2B: Dailydles** (`https://dailydles.com/submit`)
    - *Staged Fields:* URL: `https://www.brawldoku.fun/`, Name: `Brawldoku`, Category: `🎮 Gaming`, Tagline & Notes filled, Optional email left blank, Honeypot empty.
    - *Contact info:* None required. Submit button enabled.
    - *Approval needed:* "Approved to submit Dailydles."
  - **Item 2C: Playlin** (`https://playlin.io/submit/`)
    - *Staged Fields:* URL: `https://www.brawldoku.fun/`, Name: `Brawldoku`, Comments filled, Optional fields blank, Honeypot empty.
    - *Contact info:* `submitter_email` is required by Playlin's form.
    - *Approval needed:* User provides contact email, then approves submission.
  - **Item 2D: Listdle** (`https://listdle.com/submit`)
    - *Staged Fields:* URL: `https://www.brawldoku.fun/`, Checked: "I made this game".
    - *Contact info:* None needed on initial step. Continue button ready.
    - *Approval needed:* "Approved to submit Listdle."
  - **Item 2E: Alldle** (`https://www.alldle.net/submit`)
    - *Staged Fields:* URL: `https://www.brawldoku.fun/`, Name: `Brawldoku`.
    - *Contact info:* None needed. Send suggestion button enabled.
    - *Approval needed:* "Approved to submit Alldle."

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

---

### Item APV-006: Creator Outreach Dispatch (Batch 1: 5 Targeted Creators)
- **Proposed Action:** Send personalized pitches to an initial batch of 5 high-affinity creators who regularly produce Brawl Stars guessing, speedrun, and trivia videos.
- **Recommended Initial Batch:**
  1. **Kevin Brawl Stars** (`@KevinFBrawlStars`, 36K subs) — Brawldoku Speedrun & Obscurity Challenge
  2. **Brainyz Quiz** (`@BrainyzQuiz`, 66K subs) — Interactive 3x3 category intersection quiz
  3. **Chapkin3000** (`@Chapkin3000`, 30K subs) — "Can I beat the 3x3 Brawl Stars Sudoku with only Legendary picks?"
  4. **Chiken - Brawl Stars** (`@ChikenBrawl`, 54K subs) — 60-Second Brawldoku Rapid Fire Clear
  5. **Skycoach Brawl Community** (`@skycoach.gg`, 35K followers) — Daily Instagram Story / Reel interactive trivia sticker
- **Draft Messages & Angles:** Fully drafted in [`marketing/CREATOR_OUTREACH.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CREATOR_OUTREACH.md).
- **Exact Approval Required:** *"Approved to dispatch Creator Outreach Batch 1."* (Or specify individual creators to contact).

