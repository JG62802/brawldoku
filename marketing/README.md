# Brawldoku Marketing & Growth System

Welcome to the autonomous marketing, growth research, and campaign operations workspace for **Brawldoku** (`https://www.brawldoku.fun/`), the daily 3×3 Brawl Stars category grid puzzle game.

---

## 1. Mission & Operating Philosophy

1. **Strict $0 Budget:** Every strategy, tool, and channel relies exclusively on organic discovery, free web directories, public search visibility, and community engagement. No paid advertisements, subscriptions, or paid backlinks.
2. **Player-First Focus:** Our goal is not vanity traffic, but acquiring passionate Brawl Stars players who play the daily puzzle, share their scores, and return daily.
3. **Non-Invasive Game Integrity:** As a marketing system, we respect strict gameplay isolation:
   - We **never** alter game rules, scoring, 3×3 grid mechanics, rarity algorithms, category validation, or the visual UI without explicit developer directives.
   - All marketing documents, campaign trackers, and creative assets live inside this isolated `marketing/` folder.
   - Any production-facing modifications (e.g., SEO metadata in `index.html`, `robots.txt`, `sitemap.xml`, or analytics tracking events) are staged in our `APPROVAL_QUEUE.md` and require explicit owner sign-off.
4. **Transparent Community Standing:** Brawldoku complies with Supercell's Fan Content Policy: it is 100% free, fan-made, non-commercial, and not officially affiliated with or endorsed by Supercell.

---

## 2. Workspace File Map

| File | Purpose |
| :--- | :--- |
| [`README.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/README.md) | Operating manual, system architecture, and owner quick-start guide. |
| [`PROJECT_AUDIT.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/PROJECT_AUDIT.md) | Technical audit of the live site, technology stack, SEO infrastructure, and analytics. |
| [`MARKET_RESEARCH.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/MARKET_RESEARCH.md) | Competitive analysis (GachaGrid, Brawldle, PokeDoku), search queries, and player psychology. |
| [`SEO_PLAN.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/SEO_PLAN.md) | Target keywords, search intent, technical SEO fixes (OG tags, Schema, sitemap), and content strategy. |
| [`DIRECTORY_TRACKER.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/DIRECTORY_TRACKER.md) | Verified free puzzle directories (DailyDoku, Playlin, Dailydles, etc.) and submission status. |
| [`COMMUNITY_OPPORTUNITIES.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/COMMUNITY_OPPORTUNITIES.md) | Community mapping (Reddit, Discord, Creators), anti-spam rules, and outreach strategy. |
| [`CONTENT_LIBRARY.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CONTENT_LIBRARY.md) | Ready-to-use copy across 6 pillars (Daily Challenges, Obscurity, Trivia, Friend Challenges, etc.). |
| [`CONTENT_CALENDAR.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CONTENT_CALENDAR.md) | Actionable 14-day rolling schedule for community engagement and submissions. |
| [`CAMPAIGN_TRACKER.csv`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CAMPAIGN_TRACKER.csv) | Machine-readable spreadsheet tracking hypotheses, status, traffic, and conversion metrics. |
| [`MEASUREMENT_PLAN.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/MEASUREMENT_PLAN.md) | Analytics auditing, conversion funnel event definitions, and GSC setup guide. |
| [`WEEKLY_REPORT_TEMPLATE.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/WEEKLY_REPORT_TEMPLATE.md) | Standardized executive review template for weekly progress assessments. |
| [`BACKLOG.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/BACKLOG.md) | Prioritized task queue ranked by impact vs. effort with dependencies. |
| [`APPROVAL_QUEUE.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/APPROVAL_QUEUE.md) | Ready-to-execute items awaiting explicit owner authorization. |
| [`CHANGELOG.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CHANGELOG.md) | Historical record of marketing decisions, asset deployments, and updates. |

---

## 3. Autonomous Workflow & Governance

The autonomous marketing agent operates under a strict two-tier permission protocol:

```
┌────────────────────────────────────────────────────────┐
│               TIER 1: AUTONOMOUS ACTIONS               │
│  • Inspect project codebase & dependencies             │
│  • Conduct market & competitor research via web search │
│  • Formulate SEO strategies & metadata recommendations │
│  • Draft copy, directory submission kits & posts       │
│  • Update marketing docs, backlog, and trackers        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ Produces Proposals in
               ┌───────────────────────┐
               │   APPROVAL_QUEUE.md   │
               └───────────┬───────────┘
                           │
                           ▼ Requires Owner Approval
┌────────────────────────────────────────────────────────┐
│               TIER 2: APPROVAL REQUIRED                │
│  • Publishing posts to Reddit, X/Twitter, or Discord   │
│  • Submitting game listings to web directories         │
│  • Reaching out to YouTube/TikTok content creators     │
│  • Modifying production code (`index.html`, `public/`) │
│  • Creating accounts or changing hosting/DNS settings  │
└────────────────────────────────────────────────────────┘
```

---

## 4. How the Owner Resumes the Workflow

When you activate or converse with the marketing agent:
1. **Review Approvals:** Open [`APPROVAL_QUEUE.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/APPROVAL_QUEUE.md). Approve, reject, or modify queued items (e.g., "Approve Item 1: SEO files" or "Proceed with DailyDoku submission").
2. **Review Progress:** Check [`CAMPAIGN_TRACKER.csv`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/CAMPAIGN_TRACKER.csv) and [`BACKLOG.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/BACKLOG.md).
3. **Trigger Next Steps:** Instruct the agent to execute approved items or conduct targeted research on a new opportunity.
