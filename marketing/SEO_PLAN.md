# SEO Plan: Brawldoku Search Engine Optimization

**Status:** Plan & Remediation Assets Ready (Awaiting Owner Approval)  
**Primary Objective:** Maximize high-intent organic search discoverability for players searching for Brawl Stars puzzles, trivia, and daily games without spending money.

---

## 1. Keyword Strategy & Search Intent

### Tier 1: Core Brand & Genre Intent (High Relevance, High Intent)
*These represent searches by users actively seeking a daily category puzzle or Brawl Stars puzzle.*

| Target Keyword Phrase | Search Intent | Target Page | User Goal |
| :--- | :--- | :--- | :--- |
| **brawldoku** | Navigational | Homepage (`/`) | Access the game directly. |
| **brawl stars daily puzzle** | Transactional / Habitual | Homepage (`/`) | Play today's new puzzle. |
| **brawl stars pokedoku** | Comparative / Direct | Homepage (`/`) | Find the Brawl Stars equivalent of PokeDoku. |
| **brawl stars grid puzzle** | Informational / Gaming | Homepage (`/`) | Play a 3×3 category grid game. |
| **brawl stars guessing game** | Entertainment | Homepage (`/`) | Test character knowledge. |

### Tier 2: Broader Fandom & Trivia Intent (High Volume, Moderate Intent)
*These represent broader fan searches where Brawldoku can capture organic attention.*

| Target Keyword Phrase | Search Intent | Content / Angle |
| :--- | :--- | :--- |
| **brawl stars trivia game** | Entertainment / Gaming | "Test your brawler knowledge with daily 3x3 category challenges." |
| **brawler quiz online** | Casual Gaming | Fast browser-based brawler quiz with no download required. |
| **brawl stars character test** | Community / Trivia | Identify brawlers by traits, release year, ammo, and attack types. |
| **brawl stars daily challenge** | Retention / Gaming | Free daily challenge resetting midnight UTC every day. |

---

## 2. Technical SEO Audit & Proposed Fixes

Our audit of the live deployment (`https://www.brawldoku.fun/`) revealed four critical SEO blockers:
1. **Missing Canonical URL Tag:** Risk of duplicate indexing between `brawldoku.fun` and `brawldoku.vercel.app`.
2. **Missing `robots.txt`:** Returns HTTP 404, providing no crawl guidelines or sitemap pointer.
3. **Missing `sitemap.xml`:** Returns HTTP 404, preventing Google Search Console from inspecting the site's authoritative URL.
4. **Missing Open Graph & Social Sharing Metadata:** Sharing links on Discord, Reddit, or X generates a blank or unstyled text preview.

### Proposed Fix 1: Optimized `index.html` Metadata

```html
<!-- Proposed additions inside <head> of index.html -->
<title>Brawldoku — Daily Brawl Stars Grid Puzzle & Trivia Game</title>
<meta name="description" content="Play Brawldoku, the free daily 3×3 Brawl Stars grid puzzle! Test your trivia knowledge, match brawler categories, and discover rare answers. Resets daily at midnight UTC." />
<meta name="keywords" content="Brawldoku, Brawl Stars puzzle, daily Brawl Stars game, Brawl Stars pokedoku, brawler guessing game, Brawl Stars trivia, 3x3 grid puzzle" />
<link rel="canonical" href="https://www.brawldoku.fun/" />

<!-- Open Graph / Facebook / Discord / Reddit Embeds -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.brawldoku.fun/" />
<meta property="og:title" content="Brawldoku — Daily Brawl Stars Grid Puzzle" />
<meta property="og:description" content="Can you solve today's 3×3 Brawl Stars grid? Match brawlers by weapon, reload, release year, and class. Play free in your browser!" />
<meta property="og:image" content="https://www.brawldoku.fun/og-image.png" />
<meta property="og:site_name" content="Brawldoku" />

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Brawldoku — Daily Brawl Stars Grid Puzzle" />
<meta name="twitter:description" content="A daily 3×3 Brawl Stars grid puzzle. Test your knowledge, hunt rare brawlers, and challenge your friends!" />
<meta name="twitter:image" content="https://www.brawldoku.fun/og-image.png" />

<!-- JSON-LD Structured Data for Search Engine Rich Snippets -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Brawldoku",
  "url": "https://www.brawldoku.fun/",
  "applicationCategory": "GameApplication",
  "genre": "Puzzle",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "description": "A daily 3×3 Brawl Stars trivia grid puzzle game where players match brawlers to intersecting categories.",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

### Proposed Fix 2: `public/robots.txt`

```text
User-agent: *
Allow: /

Sitemap: https://www.brawldoku.fun/sitemap.xml
```

### Proposed Fix 3: `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.brawldoku.fun/</loc>
    <lastmod>2026-11-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## 3. Crawlable Content Strategy (SPA Friendly)

Because Brawldoku is a client-side React single-page application (SPA), web crawlers that do not execute JavaScript immediately see an empty `<div id="root"></div>`.

### Crawlable Descriptive Footer Recommendation:
Without impacting the visual aesthetic of the game for human players, include descriptive crawler-accessible HTML inside `index.html` (or fallback `<noscript>` block):
```html
<noscript>
  <div style="padding: 20px; font-family: sans-serif; text-align: center; color: #333;">
    <h1>Brawldoku — Daily Brawl Stars Grid Puzzle</h1>
    <p>Brawldoku is a free daily trivia guessing game for Brawl Stars fans. Complete the 3×3 grid by finding brawlers that match both intersecting categories. Please enable JavaScript to play.</p>
  </div>
</noscript>
```

---

## 4. Measurement & Verification Checklist

1. **Google Search Console (GSC):**
   - Add property `https://www.brawldoku.fun/` in GSC.
   - Verify ownership via DNS TXT record or HTML meta tag.
   - Submit `https://www.brawldoku.fun/sitemap.xml` for indexing.
2. **Bing Webmaster Tools:**
   - Import property directly from GSC for instant verification on Bing and Yahoo search engines.
3. **Key Performance Indicators (KPIs):**
   - Indexed URLs: Target 100% indexation of canonical root.
   - Search Impressions: Track weekly growth across "Brawl Stars puzzle" and "Brawldoku".
   - Organic Search Clicks: Monitor weekly click volume into the puzzle.

---

## 5. Dependencies & Approvals

- **Approval Requirement:** Modifying `index.html` and creating files in `public/` directly changes production web assets.
- **Action:** Staged as **Item 1** in [`APPROVAL_QUEUE.md`](file:///Users/jonathangalarza/.gemini/antigravity/scratch/brawldoku/marketing/APPROVAL_QUEUE.md). Requires explicit developer approval prior to file modification.
