# Directory Tracker: Gaming & Puzzle Directories

**Status:** 4 Approved Submissions Completed & Confirmed | 1 Staged (Playlin)  
**Execution Date:** November 4, 2026  
**Cost:** $0 across all submissions (Zero paid placements; all 100% free).  
**Overview:** All 4 authorized submissions returned HTTP 200/202 confirmation from their production backends. Confirmation screenshots and backend response logs have been preserved in the artifacts directory.

---

## 1. Directory Submissions Status Table

| Directory | Submission Path | Timestamp | Backend Status | Confirmation Message / Reference | Confirmation Screenshot | Current Status |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| **1. DailyDoku** | `https://www.daily-doku.com/` (`app-suggest-dialog`) | 2026-11-04 02:08 UTC-5 | **HTTP 200** (Firestore Write Channel) | Suggestion written to database; modal closed cleanly | `dailydoku_submitted.png` | ✅ **Submitted & In Review** |
| **2. Dailydles** | `https://dailydles.com/submit` | 2026-11-04 02:08 UTC-5 | **HTTP 202 Accepted** (AWS Lambda) | *"Thanks, got it! Every suggestion is played and checked by a human before it goes live, usually within a week."* | `dailydles_submitted.png` | ✅ **Submitted & In Review** |
| **3. Playlin** | `https://playlin.io/submit/` | — | — | **Not submitted** (Staged form retained; requires submitter email) | `playlin_staged.png` | ⏸️ **Staged (Hold)** |
| **4. Listdle** | `https://listdle.com/submit` | 2026-11-04 02:10 UTC-5 | **HTTP 200 OK** | *"Thanks for your submission! We'll review the game and add it to Listdle within a week or so."* | `listdle_submitted.png` | ✅ **Submitted & In Review** |
| **5. Alldle** | `https://www.alldle.net/submit` | 2026-11-04 02:10 UTC-5 | **HTTP 200 OK** (`api.alldle.net/games/submit`) | *"Thanks. Brawldoku is in the queue. A person will check it against the listing rules."* | `alldle_submitted.png` | ✅ **Submitted & In Review** |

---

## 2. Detailed Submission Logs & Verified Payload

### 1. DailyDoku
- **Submission URL:** `https://www.daily-doku.com/`
- **Submitted Payload:**
  - `name`: `Brawldoku`
  - `url`: `https://www.brawldoku.fun/`
- **Backend Response:** `https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel` returned `status: 200`.
- **Confirmation State:** Dialog closed automatically following database commit.
- **Artifact:** [`dailydoku_submitted.png`](file:///Users/jonathangalarza/.gemini/antigravity/brain/fbaf419e-c3a7-4235-bf0b-37261285ffcd/dailydoku_submitted.png)

---

### 2. Dailydles
- **Submission URL:** `https://dailydles.com/submit`
- **Submitted Payload:**
  - `url`: `https://www.brawldoku.fun/`
  - `name`: `Brawldoku`
  - `category`: `🎮 Gaming`
  - `tagline`: `A daily 3×3 Brawl Stars grid puzzle. Match categories, find rare brawlers, and beat community obscurity scores!`
  - `notes`: `Brawldoku is an original daily 3×3 grid trivia puzzle for Brawl Stars fans. Features 106 brawlers, 40+ category filters, persistent daily streaks, and real-time community obscurity percentages. 100% free, no ads, no logins, mobile/desktop responsive, resetting daily at midnight UTC.`
  - `email`: *(Left blank)*
  - `website`: *(Honeypot left empty)*
- **Backend Response:** `https://su4skekh3wcgmh33llbpzg7xxa0edwrg.lambda-url.eu-west-2.on.aws/` returned `status: 202 Accepted`.
- **Confirmation Message:** *"Thanks, got it! Every suggestion is played and checked by a human before it goes live, usually within a week."*
- **Artifact:** [`dailydles_submitted.png`](file:///Users/jonathangalarza/.gemini/antigravity/brain/fbaf419e-c3a7-4235-bf0b-37261285ffcd/dailydles_submitted.png)

---

### 3. Playlin (On Hold)
- **Submission URL:** `https://playlin.io/submit/`
- **Status:** **Not submitted per user instruction.**
- **Staged Form Payload:** Game URL (`https://www.brawldoku.fun/`), Game Name (`Brawldoku`), Comments describing 106 brawlers & daily reset.
- **Outstanding Requirement:** Playlin enforces HTML `required` validation on `submitter_email`. Awaiting user's preferred email if they choose to submit in the future.
- **Artifact:** [`playlin_staged.png`](file:///Users/jonathangalarza/.gemini/antigravity/brain/fbaf419e-c3a7-4235-bf0b-37261285ffcd/playlin_staged.png)

---

### 4. Listdle
- **Submission URL:** `https://listdle.com/submit`
- **Submitted Payload:**
  - `url`: `https://www.brawldoku.fun/`
  - `is_creator`: Checked (`I made this game`)
  - `category`: Selected `VIDEO GAMES`
  - Scraped Metadata Confirmed: Title (`Brawldoku`) and Open Graph description automatically populated by Listdle scraper.
- **Backend Response:** HTTP 200 OK.
- **Confirmation Message:** *"Thanks for your submission! We'll review the game and add it to Listdle within a week or so."*
- **Artifact:** [`listdle_submitted.png`](file:///Users/jonathangalarza/.gemini/antigravity/brain/fbaf419e-c3a7-4235-bf0b-37261285ffcd/listdle_submitted.png)

---

### 5. Alldle
- **Submission URL:** `https://www.alldle.net/submit`
- **Submitted Payload:**
  - `url`: `https://www.brawldoku.fun/`
  - `name`: `Brawldoku`
- **Backend Response:** `https://api.alldle.net/games/submit` returned `status: 200 OK`.
- **Confirmation Message:** *"Thanks. Brawldoku is in the queue. A person will check it against the listing rules. If it fits, it gets its own page and shows up in new releases."*
- **Artifact:** [`alldle_submitted.png`](file:///Users/jonathangalarza/.gemini/antigravity/brain/fbaf419e-c3a7-4235-bf0b-37261285ffcd/alldle_submitted.png)
