# Measurement Plan: Analytics, Funnels & Search Tracking

**Status:** Plan Formulated | Existing Setup Audited | Enhancements Staged  
**Core Goal:** Accurately measure organic acquisition, puzzle engagement, and player retention with zero financial cost and zero violation of user privacy.

---

## 1. Current Measurement Setup & Capabilities

### What is Currently Live:
- **Provider:** `@vercel/analytics/react` (configured in `src/App.tsx`).
- **Data Collected in Owner's Vercel Dashboard:**
  - Pageviews and unique visitor counts.
  - Referrer domains (tracking which directories, subreddits, or social platforms drive traffic).
  - Geographies (top countries/regions playing).
  - Device and operating system breakdowns (Mobile iOS/Android vs. Desktop).
- **Privacy Standard:** 100% cookieless and GDPR/CCPA compliant out of the box. No cookie banner required.

---

## 2. Identified Measurement Gaps

While Vercel Analytics records high-level page visits, it currently records **zero granular engagement events**. As a result, we cannot currently measure:
1. **Puzzle Starts:** How many visitors actually make their first brawler guess?
2. **Puzzle Completions:** What percentage of players finish all 9 cells (or exhaust all 9 guesses)?
3. **Win Rate:** How many games end in Victory vs. Game Over?
4. **Share Virality:** How many players tap the "Share" or "Copy Score" button in `PostGameModal` or `HeaderHUD`?
5. **Obscurity Engagement:** How many players inspect cell answer breakdowns via `CellAnswersModal`?

---

## 3. Zero-Cost Event Tracking Proposal (Vercel Custom Events)

To measure the full player conversion funnel without adding third-party trackers, we propose leveraging `@vercel/analytics`'s native, lightweight `track` function:

```typescript
import { track } from '@vercel/analytics';

// When player makes their first guess:
track('puzzle_start', { puzzleNumber: gameState.puzzleNumber });

// When game reaches terminal state (won or lost):
track('puzzle_complete', { 
  puzzleNumber: gameState.puzzleNumber, 
  status: gameState.status, 
  score: gameState.score,
  filledCells: filledCount 
});

// When player clicks Share / Copy Score:
track('score_shared', { 
  puzzleNumber: gameState.puzzleNumber, 
  method: isNavigatorShare ? 'native_share' : 'clipboard' 
});
```

*Note: In accordance with our Operating Rules, modifying application code to install custom events requires explicit owner sign-off before implementation.*

---

## 4. Search Engine Measurement Setup

To track organic search discovery and keyword indexation:

### Google Search Console (GSC):
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Add Property: `https://www.brawldoku.fun/`.
3. Verification: Add the verification DNS TXT record or HTML meta tag provided by GSC.
4. Submit Sitemap: Enter `https://www.brawldoku.fun/sitemap.xml`.
5. Key Metrics to Monitor:
   - Search Queries (impressions, clicks, average position for "Brawldoku", "Brawl Stars puzzle", etc.).
   - Index Coverage (ensuring `https://www.brawldoku.fun/` is indexed without errors).

### Bing Webmaster Tools:
1. Sign in to Bing Webmaster Tools and import the verified Google Search Console property with one click.
2. Ensures discovery across Bing, Yahoo, and DuckDuckGo.

---

## 5. Experimentation Framework & Decision Rules

Every marketing campaign in `CAMPAIGN_TRACKER.csv` follows a structured evaluation rule:

| Channel / Campaign | Primary KPI | Minimum Viable Threshold | Decision Rule |
| :--- | :--- | :--- | :--- |
| **Directory Submissions** | Referral visits in Vercel Analytics | >25 unique visitors / week per directory | If threshold met, expand to secondary directories. If 0 visits after 21 days, archive directory. |
| **Reddit Launch Post** | Total visits & Upvote Ratio | >200 visits & >85% upvote ratio | If positive, make weekly Saturday puzzle discussions a permanent habit. If removed by mods, refine approach. |
| **Creator Outreach** | Response rate & video mentions | ≥1 positive reply per 5 creator pitches | If a creator covers the game, prepare a dedicated custom board or rarity stat showcase for their audience. |
| **Score Sharing** | Share click conversion rate | >15% of puzzle completers clicking Share | If <10%, test more provocative share copy in `buildPostGameShareText`. |
