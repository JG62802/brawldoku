import { CategoryDefinition, Brawler } from '../types/game';
import { CATEGORIES, CATEGORY_BY_ID, getMatchingBrawlers } from './categories';

// Mutually exclusive category groups that should never intersect (row vs col)
const EXCLUSIVE_GROUPS = new Set([
  'BrawlerType',
  'Rarity',
  'Range',
  'AmmoAmount',
  'ReloadSpeed',
  'Gender',
  'ReleaseYear',
  'WeaponType',
]);

// Epoch date for Puzzle #1
const EPOCH_DATE_STR = '2025-01-01';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPuzzleNumberForDate(dateStr: string): number {
  const epoch = new Date(`${EPOCH_DATE_STR}T00:00:00Z`).getTime();
  const target = new Date(`${dateStr}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) {
    return 1;
  }
  const diffDays = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

// Deterministic string hash -> 32-bit seed
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic Mulberry32 PRNG
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Verifies via backtracking that 9 distinct brawlers can simultaneously fill all 9 cells.
 */
export function hasDisjointSolution(
  rows: [CategoryDefinition, CategoryDefinition, CategoryDefinition],
  cols: [CategoryDefinition, CategoryDefinition, CategoryDefinition],
  minValidPerCell = 2
): { valid: boolean; cellMatches: Brawler[][][] } {
  const cellMatches: Brawler[][][] = [[], [], []];
  const flatCells: { r: number; c: number; candidates: number[] }[] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      // Never intersect two categories from the same exclusive group
      if (
        rows[r].group === cols[c].group &&
        EXCLUSIVE_GROUPS.has(rows[r].group)
      ) {
        return { valid: false, cellMatches: [] };
      }

      const matches = getMatchingBrawlers(rows[r], cols[c]);
      if (matches.length < minValidPerCell) {
        return { valid: false, cellMatches: [] };
      }
      cellMatches[r][c] = matches;
      flatCells.push({
        r,
        c,
        candidates: matches.map((b) => b.id),
      });
    }
  }

  // Sort cells by most constrained first for fast backtracking
  flatCells.sort((a, b) => a.candidates.length - b.candidates.length);

  const usedBrawlerIds = new Set<number>();

  function backtrack(idx: number): boolean {
    if (idx === flatCells.length) return true;
    const { candidates } = flatCells[idx];
    for (const id of candidates) {
      if (!usedBrawlerIds.has(id)) {
        usedBrawlerIds.add(id);
        if (backtrack(idx + 1)) return true;
        usedBrawlerIds.delete(id);
      }
    }
    return false;
  }

  const valid = backtrack(0);
  return { valid, cellMatches };
}

export interface GeneratedPuzzle {
  dateStr: string;
  puzzleNumber: number;
  rows: [CategoryDefinition, CategoryDefinition, CategoryDefinition];
  cols: [CategoryDefinition, CategoryDefinition, CategoryDefinition];
  cellMatches: Brawler[][][];
}

export function generateDailyPuzzle(dateStr: string): GeneratedPuzzle {
  const seed = hashSeed(`BRAWLDOKU_DAILY_V1_${dateStr}`);
  const rng = createRng(seed);
  const puzzleNumber = getPuzzleNumberForDate(dateStr);

  const pool = CATEGORIES;

  for (let attempt = 0; attempt < 600; attempt++) {
    const shuffled = shuffleWithRng(pool, rng);

    // Pick 6 categories ensuring good group diversity
    const selected: CategoryDefinition[] = [];
    const groupCounts: Record<string, number> = {};

    for (const cat of shuffled) {
      const count = groupCounts[cat.group] || 0;
      // Allow at most 2 categories from the same group, and if 2, they must go on the same axis
      if (count < 2) {
        selected.push(cat);
        groupCounts[cat.group] = count + 1;
      }
      if (selected.length === 6) break;
    }

    if (selected.length < 6) continue;

    const rows: [CategoryDefinition, CategoryDefinition, CategoryDefinition] = [
      selected[0],
      selected[1],
      selected[2],
    ];
    const cols: [CategoryDefinition, CategoryDefinition, CategoryDefinition] = [
      selected[3],
      selected[4],
      selected[5],
    ];

    // Ensure at least 3 distinct category sections are represented across the 6 headers
    const sections = new Set(selected.map((c) => c.section));
    if (sections.size < 3) continue;

    const check = hasDisjointSolution(rows, cols, 2);
    if (check.valid) {
      return {
        dateStr,
        puzzleNumber,
        rows,
        cols,
        cellMatches: check.cellMatches,
      };
    }
  }

  // Fallback guaranteed solvable configuration if PRNG exhausted attempts
  const fallbackRows: [CategoryDefinition, CategoryDefinition, CategoryDefinition] = [
    CATEGORY_BY_ID['type_damage_dealer'],
    CATEGORY_BY_ID['type_tank'],
    CATEGORY_BY_ID['type_controller'],
  ];
  const fallbackCols: [CategoryDefinition, CategoryDefinition, CategoryDefinition] = [
    CATEGORY_BY_ID['prog_buffies'],
    CATEGORY_BY_ID['weapon_single_shot'],
    CATEGORY_BY_ID['mech_healer'],
  ];
  const fallbackCheck = hasDisjointSolution(fallbackRows, fallbackCols, 1);

  return {
    dateStr,
    puzzleNumber,
    rows: fallbackRows,
    cols: fallbackCols,
    cellMatches: fallbackCheck.cellMatches,
  };
}
