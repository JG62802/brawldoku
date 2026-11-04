# Category Combination Audit: Solvability & Answer-Coverage

> **Project:** Brawldoku (`https://www.brawldoku.fun/`)  
> **Audited Dataset:** 42 Categories (`src/engine/categories.ts`) × 106 Brawlers (`src/data/brawlers.ts`)  
> **Combinatorial Space:** $\frac{42 \times 41}{2} = 861$ unique unordered category pairs  
> **Standard:** Minimum 2 valid answers required for game inclusion. Combinations with 0 or 1 valid answer are classified as non-viable.

---

## 1. Global Combination Summary

Every pairwise intersection of the 42 supported categories was evaluated against the authoritative 106-brawler dataset:

| Category Pair Answer Count | Number of Combinations | Percentage of Total Space | Engine Viability |
| :--- | :---: | :---: | :--- |
| **0 Valid Brawlers (Intra-group exclusive)** | **60** | **6.97%** | ❌ Excluded by `EXCLUSIVE_GROUPS` rule |
| **0 Valid Brawlers (Cross-group impossible)** | **47** | **5.46%** | ❌ Excluded by `minValidPerCell = 2` filter |
| **1 Valid Brawler (Single-answer bottleneck)** | **53** | **6.16%** | ❌ Excluded by `minValidPerCell = 2` filter |
| **2 Valid Brawlers (Meets minimum standard)** | **83** | **9.64%** | ✅ Eligible for puzzle generation |
| **3+ Valid Brawlers (Preferred coverage)** | **618** | **71.78%** | ✅ Eligible for puzzle generation |
| **TOTAL UNIQUE COMBINATIONS** | **861** | **100.00%** | **701 viable (81.42%) / 160 non-viable (18.58%)** |

---

## 2. All 107 Combinations with ZERO Valid Answers

### A. Intra-Group Exclusive Combinations (60 Pairs)
In Brawl Stars game architecture, certain attribute dimensions are mutually exclusive single-value enums. A brawler cannot have two classes, two rarities, two base ranges, two ammo capacities, two reload speeds, two genders, two release year windows, or two primary weapon types:

1. **BrawlerType Class Mutual Exclusivity (21 pairs):**
   - Damage Dealer × {Tank, Assassin, Marksman, Controller, Support, Artillery} (6 pairs)
   - Tank × {Assassin, Marksman, Controller, Support, Artillery} (5 pairs)
   - Assassin × {Marksman, Controller, Support, Artillery} (4 pairs)
   - Marksman × {Controller, Support, Artillery} (3 pairs)
   - Controller × {Support, Artillery} (2 pairs)
   - Support × Artillery (1 pair)
2. **Rarity Mutual Exclusivity (10 pairs):**
   - Rare × {Super Rare, Epic, Mythic, Legendary} (4 pairs)
   - Super Rare × {Epic, Mythic, Legendary} (3 pairs)
   - Epic × {Mythic, Legendary} (2 pairs)
   - Mythic × Legendary (1 pair)
3. **Range Mutual Exclusivity (6 pairs):**
   - Short × {Normal, Long, Very Long} (3 pairs)
   - Normal × {Long, Very Long} (2 pairs)
   - Long × Very Long (1 pair)
4. **Ammo Amount Mutual Exclusivity (1 pair):**
   - Non-3 Ammo (1 / 4 / Fuel) × 3 Ammo Slots (1 pair)
5. **Reload Speed Mutual Exclusivity (6 pairs):**
   - Very Fast × {Fast, Normal, Slow/Very Slow} (3 pairs)
   - Fast × {Normal, Slow/Very Slow} (2 pairs)
   - Normal × Slow/Very Slow (1 pair)
6. **Gender Mutual Exclusivity (3 pairs):**
   - Male × {Female, Robot/Non-Human} (2 pairs)
   - Female × Robot/Non-Human (1 pair)
7. **Release Year Mutual Exclusivity (10 pairs):**
   - 2017–2018 × {2019–2020, 2021–2022, 2023–2024, 2025–2026} (4 pairs)
   - 2019–2020 × {2021–2022, 2023–2024, 2025–2026} (3 pairs)
   - 2021–2022 × {2023–2024, 2025–2026} (2 pairs)
   - 2023–2024 × 2025–2026 (1 pair)
8. **Weapon Type Mutual Exclusivity (3 pairs):**
   - Melee × Gun, Melee × Throwable, Gun × Throwable (3 pairs)

*Engine Safeguard:* The puzzle generator explicitly disallows placing two categories from the same `EXCLUSIVE_GROUPS` family across opposing axes (`puzzleGenerator.ts` line 83).

---

### B. Cross-Group Combinations with Zero Matches (47 Pairs)
These 47 combinations represent valid category dimensions from different groups, but **zero brawlers exist in the current 106-character roster** that satisfy both traits simultaneously:

| # | Category 1 (Group) | Category 2 (Group) | Reason for 0 Matches in 106-Roster |
| :---: | :--- | :--- | :--- |
| **1** | Damage Dealer (`BrawlerType`) | Short Range (`Range`) | All Damage Dealers have Normal, Long, or Very Long range. |
| **2** | Tank Class (`BrawlerType`) | Very Long Range (`Range`) | Tanks are close/mid-range; none possess Sniper-tier range. |
| **3** | Tank Class (`BrawlerType`) | Throwable Weapon (`WeaponType`) | All Tanks use Melee, Guns, or unique bodies; none are throwers. |
| **4** | Assassin Class (`BrawlerType`) | Rare (`Rarity`) | No Assassins exist in the Rare rarity pool. |
| **5** | Assassin Class (`BrawlerType`) | Super Rare (`Rarity`) | No Assassins exist in Super Rare (closest are Epic: Stu, Edgar). |
| **6** | Assassin Class (`BrawlerType`) | Very Long Range (`Range`) | Assassins rely on mobility; none have sniper-grade base range. |
| **7** | Assassin Class (`BrawlerType`) | Gun / Firearm (`WeaponType`) | Assassins utilize blades, daggers, dashes, or punches, not firearms. |
| **8** | Marksman Class (`BrawlerType`) | Super Rare (`Rarity`) | Marksmen are concentrated in Epic/Mythic; none in Super Rare. |
| **9** | Marksman Class (`BrawlerType`) | Short Range (`Range`) | Contradicts Marksman definition (all are Long or Very Long). |
| **10** | Marksman Class (`BrawlerType`) | Normal Range (`Range`) | Contradicts Marksman definition (all are Long or Very Long). |
| **11** | Marksman Class (`BrawlerType`) | Melee Weapon (`WeaponType`) | Snipers cannot be melee brawlers. |
| **12** | Marksman Class (`BrawlerType`) | Throwable Weapon (`WeaponType`) | Lobbed attacks belong to Artillery, not Marksman. |
| **13** | Controller Class (`BrawlerType`) | Rare (`Rarity`) | No Controllers exist in the Rare pool. |
| **14** | Controller Class (`BrawlerType`) | Short Range (`Range`) | Controllers exert area denial at mid/long range. |
| **15** | Controller Class (`BrawlerType`) | Very Long Range (`Range`) | Controllers operate at Normal/Long range; none have Sniper range. |
| **16** | Controller Class (`BrawlerType`) | Melee Weapon (`WeaponType`) | Controllers control space from range; none use melee attacks. |
| **17** | Controller Class (`BrawlerType`) | Jumping Ultimate (`JumpingUltimate`) | No Controllers possess a leap/flight super (Crow/Piper/El Primo). |
| **18** | Artillery Class (`BrawlerType`) | Legendary (`Rarity`) | No throwers exist in Legendary (Dynamike=Super Rare, Sprout=Mythic). |
| **19** | Artillery Class (`BrawlerType`) | Short Range (`Range`) | Artillery lob attacks over walls; none are short-range. |
| **20** | Artillery Class (`BrawlerType`) | Normal Range (`Range`) | All Artillery have Long range. |
| **21** | Artillery Class (`BrawlerType`) | Very Long Range (`Range`) | Artillery attack distance is capped below sniper range. |
| **22** | Artillery Class (`BrawlerType`) | Non-3 Ammo (`AmmoAmount`) | All 7 Artillery brawlers possess standard 3 ammo slots. |
| **23** | Artillery Class (`BrawlerType`) | Very Fast Reload (`ReloadSpeed`) | Artillery have Normal/Slow reload to balance area denial. |
| **24** | Artillery Class (`BrawlerType`) | Fast Reload (`ReloadSpeed`) | Artillery reload speeds are Normal, Slow, or Very Slow. |
| **25** | Artillery Class (`BrawlerType`) | Released 2025–2026 (`ReleaseYear`) | No new Artillery brawlers were introduced in 2025–2026. |
| **26** | Artillery Class (`BrawlerType`) | Melee Weapon (`WeaponType`) | Lobbers cannot be melee characters. |
| **27** | Artillery Class (`BrawlerType`) | Gun / Firearm (`WeaponType`) | Artillery throw projectiles; none fire firearms. |
| **28** | Artillery Class (`BrawlerType`) | Has Buffies (`HasBuffies`) | None of the 9 Buffie trios currently include an Artillery brawler. |
| **29** | Rare (`Rarity`) | Very Long Range (`Range`) | No Rare brawlers have Piper/Mandy tier range. |
| **30** | Rare (`Rarity`) | Non-3 Ammo (`AmmoAmount`) | All 8 Rare brawlers have 3 ammo slots. |
| **31** | Rare (`Rarity`) | Fast Reload (`ReloadSpeed`) | Rare reload speeds are Very Fast (El Primo), Normal, or Slow. |
| **32** | Rare (`Rarity`) | Released 2021–2022 (`ReleaseYear`) | Supercell did not release any Rare brawlers in 2021–2022. |
| **33** | Rare (`Rarity`) | Released 2023–2024 (`ReleaseYear`) | Supercell did not release any Rare brawlers in 2023–2024. |
| **34** | Rare (`Rarity`) | Released 2025–2026 (`ReleaseYear`) | Supercell did not release any Rare brawlers in 2025–2026. |
| **35** | Super Rare (`Rarity`) | Very Long Range (`Range`) | No Super Rare brawlers have Very Long range. |
| **36** | Super Rare (`Rarity`) | Very Fast Reload (`ReloadSpeed`) | No Super Rare brawlers reload at Very Fast speed. |
| **37** | Super Rare (`Rarity`) | Released 2023–2024 (`ReleaseYear`) | No Super Rare brawlers were released in 2023–2024. |
| **38** | Super Rare (`Rarity`) | Released 2025–2026 (`ReleaseYear`) | No Super Rare brawlers were released in 2025–2026. |
| **39** | Super Rare (`Rarity`) | Flies / Airborne (`Flies`) | No Super Rare brawlers possess flight mechanics. |
| **40** | Short Range (`Range`) | Throwable Weapon (`WeaponType`) | Throwers inherently lob at distance; none are short-range. |
| **41** | Very Long Range (`Range`) | Melee Weapon (`WeaponType`) | Direct physical contradiction (melee = close contact). |
| **42** | Very Long Range (`Range`) | Throwable Weapon (`WeaponType`) | Thrower ranges are capped at Long; none reach Very Long. |
| **43** | Very Long Range (`Range`) | Has Buffies (`HasBuffies`) | No current Buffie brawlers have Very Long range. |
| **44** | Non-3 Ammo (`AmmoAmount`) | Slow / Very Slow Reload (`ReloadSpeed`) | 1-ammo and 4-ammo brawlers have Fast, Very Fast, or Normal reload. |
| **45** | Non-3 Ammo (`AmmoAmount`) | Male Brawler (`Gender`) | All 10 non-3 ammo brawlers are Female, Robot, or Creature. |
| **46** | Non-3 Ammo (`AmmoAmount`) | Released 2017–2018 (`ReleaseYear`) | Non-standard ammo mechanics were introduced after 2018 (Carl=2019). |
| **47** | Released 2025–2026 (`ReleaseYear`) | Has Buffies (`HasBuffies`) | Buffies were assigned to classic legacy trios, not 2025–2026 brawlers. |

---

## 3. All 53 Combinations with Exactly ONE Valid Answer

These 53 combinations have exactly one valid brawler in the game. While logically possible, they fail the Brawldoku 2-answer standard and must never be permitted in puzzle cells:

| # | Category 1 | Category 2 | The Single Matching Brawler | Brawler ID |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Damage Dealer | Very Long Range | **R-T** | 16000067 |
| **2** | Tank Class | Long Range | **Meg** | 16000053 |
| **3** | Tank Class | Non-3 Ammo (1 / 4 / Fuel) | **Hank** | 16000069 |
| **4** | Tank Class | Fast Reload | **Ash** | 16000052 |
| **5** | Assassin Class | Non-3 Ammo (1 / 4 / Fuel) | **Lily** | 16000078 |
| **6** | Assassin Class | Released 2019–2020 | **Edgar** | 16000043 |
| **7** | Marksman Class | Rare | **Brock** | 16000003 |
| **8** | Marksman Class | Mythic | **Janet** | 16000057 |
| **9** | Marksman Class | Legendary | **Pierce** | 16000095 |
| **10** | Marksman Class | Released 2025–2026 | **Pierce** | 16000095 |
| **11** | Marksman Class | Has Buffies | **Brock** | 16000003 |
| **12** | Marksman Class | Healer Ability | **Angelo** | 16000076 |
| **13** | Controller Class | Flies / Airborne | **Chuck** | 16000073 |
| **14** | Support Class | Rare | **Poco** | 16000008 |
| **15** | Support Class | Super Rare | **Gus** | 16000061 |
| **16** | Support Class | Legendary | **Kit** | 16000075 |
| **17** | Support Class | Very Long Range | **Byron** | 16000044 |
| **18** | Support Class | Non-3 Ammo (1 / 4 / Fuel) | **Max** | 16000033 |
| **19** | Support Class | Flies / Airborne | **Kit** | 16000075 |
| **20** | Artillery Class | Rare | **Barley** | 16000004 |
| **21** | Artillery Class | Female Brawler | **Juju** | 16000084 |
| **22** | Artillery Class | Released 2021–2022 | **Grom** | 16000055 |
| **23** | Artillery Class | Flies / Airborne | **Juju** | 16000084 |
| **24** | Artillery Class | Jumping Ultimate | **Dynamike** | 16000005 |
| **25** | Rare | Normal Range | **Nita** | 16000006 |
| **26** | Rare | Slow / Very Slow Reload | **Brock** | 16000003 |
| **27** | Rare | Released 2019–2020 | **Rosa** | 16000025 |
| **28** | Rare | Has Pet(s) / Spawnable | **Nita** | 16000006 |
| **29** | Rare | Throwable Weapon | **Barley** | 16000004 |
| **30** | Rare | Flies / Airborne | **El Primo** | 16000007 |
| **31** | Rare | Jumping Ultimate | **El Primo** | 16000007 |
| **32** | Super Rare | Short Range | **Jacky** | 16000036 |
| **33** | Super Rare | Normal Range | **Darryl** | 16000010 |
| **34** | Super Rare | Non-3 Ammo (1 / 4 / Fuel) | **Carl** | 16000024 |
| **35** | Super Rare | Released 2021–2022 | **Gus** | 16000061 |
| **36** | Super Rare | Melee Weapon | **Jacky** | 16000036 |
| **37** | Super Rare | Healer Ability | **Gus** | 16000061 |
| **38** | Super Rare | Jumping Ultimate | **Dynamike** | 16000005 |
| **39** | Legendary | Very Long Range | **Pierce** | 16000095 |
| **40** | Legendary | Non-3 Ammo (1 / 4 / Fuel) | **Amber** | 16000041 |
| **41** | Short Range | Non-3 Ammo (1 / 4 / Fuel) | **Lily** | 16000078 |
| **42** | Short Range | Gun / Firearm | **Bull** | 16000002 |
| **43** | Long Range | Melee Weapon | **Fang** | 16000054 |
| **44** | Very Long Range | Fast Reload | **Belle** | 16000047 |
| **45** | Very Long Range | Released 2017–2018 | **Piper** | 16000011 |
| **46** | Very Long Range | Released 2025–2026 | **Pierce** | 16000095 |
| **47** | Very Long Range | Jumping Ultimate | **Piper** | 16000011 |
| **48** | Non-3 Ammo (1 / 4 / Fuel) | Fast Reload | **Bonnie** | 16000058 |
| **49** | Non-3 Ammo (1 / 4 / Fuel) | Normal Reload | **Carl** | 16000024 |
| **50** | Non-3 Ammo (1 / 4 / Fuel) | Released 2021–2022 | **Bonnie** | 16000058 |
| **51** | Non-3 Ammo (1 / 4 / Fuel) | Released 2025–2026 | **Lumi** | 16000090 |
| **52** | Non-3 Ammo (1 / 4 / Fuel) | Melee Weapon | **Lily** | 16000078 |
| **53** | Has Pet(s) / Spawnable | Jumping Ultimate | **Janet** | 16000057 |

---

## 4. Assessment of Source Metadata Reliability

A systematic audit was conducted on the source data attributes of all 106 brawlers to ensure no brawler was excluded due to data corruption, missing fields, or incorrect classifications:

1. **Schema Completeness:** 106/106 brawlers possess all required categorical properties (`brawlerType`, `rarity`, `range`, `ammoAmount`, `reloadSpeed`, `gender`, `releaseYear`, `weaponType`, boolean mechanics).
2. **Authoritative Consistency:**
   - In-game class classifications strictly match Supercell's 7 official roles.
   - Brawler rarities correspond to the 5 active post-2023 rarities (Starting Brawler Shelly is categorized as Rare in category predicates for gameplay compatibility).
   - Release years span 2017 to 2026 without gaps.
   - Buffie classifications reflect the 27 designated brawlers across the 9 classic trios.
3. **No Phantom Matches:** Every brawler accepted by category predicates meets the strict criterion defined in the category description. No loose regex or alias matching is used.

---

## 5. Strategic Recommendations for Category Pool Management

1. **Retain the Strict `minValidPerCell = 2` Generator Filter:**
   The generator's current safeguard is 100% effective. It proactively filters out all 107 zero-match and all 53 one-match combinations before candidate grids can be emitted. **Do not relax this check.**
2. **Preserve Specialized Categories for High Obscurity Value:**
   Categories such as `Non-3 Ammo` (10 brawlers) and `Artillery Class` (7 brawlers) create bottleneck combinations when paired with restrictive rarities or ranges, but when paired with broad categories (e.g. `Damage Dealer`, `Single Shot`, `Has Hypercharge`), they generate high-interest, satisfying cells with 2–4 distinct brawlers. They should remain in the pool.
3. **Future Roster Additions:**
   As Supercell introduces new brawlers in 2026–2027, several 1-match bottlenecks (e.g. Marksman × 2025–2026, which currently only matches Pierce) will naturally expand to 2+ answers, increasing the combinatorial density of viable pairs.
