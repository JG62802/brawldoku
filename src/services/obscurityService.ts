import {
  CellIdentifier,
  CellObscurityStats,
  ObscurityDataStatus,
  ObscuritySubmissionRecord,
  PuzzleObscuritySummary,
} from '../types/game';
import { BRAWLER_BY_ID } from '../data/brawlers';
import { CATEGORY_BY_ID } from '../engine/categories';

export interface ObscurityResult {
  percentage: number | null;
  status: ObscurityDataStatus;
  totalSubmissions: number;
  brawlerSelections: number;
}

export function formatCellId(row: number, col: number): CellIdentifier {
  return `${row}-${col}`;
}

/**
 * Validates whether a Brawler is a legitimate answer for the given row and column categories.
 * Only valid submissions may be recorded or counted toward obscurity percentages.
 */
export function isValidBrawlerForCategories(
  brawlerId: number,
  rowCategoryId: string,
  colCategoryId: string
): boolean {
  const brawler = BRAWLER_BY_ID[brawlerId];
  const rowCat = CATEGORY_BY_ID[rowCategoryId];
  const colCat = CATEGORY_BY_ID[colCategoryId];
  if (!brawler || !rowCat || !colCat) return false;
  return rowCat.predicate(brawler) && colCat.predicate(brawler);
}

/**
 * Pure calculation of Obscurity Percentage:
 * (Number of players selecting this Brawler for this cell / Total valid submissions for this cell) * 100
 *
 * Clearly distinguishes unavailable data (null percentage, status: 'unavailable')
 * from a genuine 0% obscurity score (0 percentage, status: 'available').
 */
export function calculateObscurityFromStats(
  stats: CellObscurityStats | null | undefined,
  brawlerId: number
): ObscurityResult {
  if (!stats || stats.totalValidSubmissions <= 0) {
    return {
      percentage: null,
      status: 'unavailable',
      totalSubmissions: 0,
      brawlerSelections: 0,
    };
  }

  const brawlerSelections = stats.brawlerCounts[brawlerId] ?? 0;
  const rawPercentage = (brawlerSelections / stats.totalValidSubmissions) * 100;

  // Preserve 0% only when brawlerSelections === 0; if > 0 but < 1%, round to 1 decimal or 1%
  const percentage =
    brawlerSelections === 0
      ? 0
      : rawPercentage < 1
      ? Number(rawPercentage.toFixed(1))
      : Math.round(rawPercentage);

  return {
    percentage,
    status: 'available',
    totalSubmissions: stats.totalValidSubmissions,
    brawlerSelections,
  };
}

/**
 * Aggregates raw anonymous valid submission records into CellObscurityStats without exposing individual records.
 */
export function aggregateValidSubmissions(
  puzzleId: string,
  cellId: CellIdentifier,
  records: ObscuritySubmissionRecord[],
  rowCategoryId: string,
  colCategoryId: string
): CellObscurityStats {
  const brawlerCounts: Record<number, number> = {};
  let totalValidSubmissions = 0;

  for (const rec of records) {
    if (rec.puzzleId !== puzzleId || rec.cellId !== cellId) continue;
    if (!isValidBrawlerForCategories(rec.brawlerId, rowCategoryId, colCategoryId)) {
      continue;
    }
    brawlerCounts[rec.brawlerId] = (brawlerCounts[rec.brawlerId] ?? 0) + 1;
    totalValidSubmissions += 1;
  }

  return {
    puzzleId,
    cellId,
    totalValidSubmissions,
    brawlerCounts,
  };
}

const API_BASE_URL =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_OBSCURITY_API_URL) || '/api/obscurity';

const PLAYER_ID_STORAGE_KEY = 'brawldoku_anon_player_id_v1';

/**
 * Returns a stable, anonymous browser identifier used exclusively to prevent
 * duplicate submissions from inflating cell counts. Contains no personal information.
 */
export function getOrCreateAnonymousPlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(PLAYER_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'anon-' + Date.now();
  }
}

/**
 * Fetches aggregated obscurity statistics for a daily puzzle from the backend API.
 * If live backend data is unavailable, returns source: 'unavailable' and never fabricates statistics.
 */
export async function fetchPuzzleObscuritySummary(
  puzzleId: string
): Promise<PuzzleObscuritySummary> {
  try {
    const response = await fetch(
      `${API_BASE_URL}?puzzleId=${encodeURIComponent(puzzleId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      return { puzzleId, cells: {} as Record<CellIdentifier, CellObscurityStats>, source: 'unavailable' };
    }

    const data = (await response.json()) as {
      cells?: Record<CellIdentifier, CellObscurityStats>;
    } | null;
    if (!data || !data.cells || typeof data.cells !== 'object') {
      return { puzzleId, cells: {} as Record<CellIdentifier, CellObscurityStats>, source: 'unavailable' };
    }

    return {
      puzzleId,
      cells: data.cells,
      source: 'remote_api',
    };
  } catch {
    return { puzzleId, cells: {} as Record<CellIdentifier, CellObscurityStats>, source: 'unavailable' };
  }
}

/**
 * Submits a validated anonymous cell answer to the backend database and returns updated cell stats.
 * Payload strictly contains only:
 * - puzzleId (Daily puzzle identifier)
 * - cellId (Grid cell identifier)
 * - brawlerId (Selected Brawler identifier)
 * - submittedAt (Submission timestamp)
 */
export async function recordValidCellSubmission(
  submission: ObscuritySubmissionRecord,
  rowCategoryId: string,
  colCategoryId: string
): Promise<{
  cellStats: CellObscurityStats | null;
  obscurity: ObscurityResult;
}> {
  // Enforce client-side validity guard before sending
  if (
    !isValidBrawlerForCategories(submission.brawlerId, rowCategoryId, colCategoryId)
  ) {
    return {
      cellStats: null,
      obscurity: {
        percentage: null,
        status: 'unavailable',
        totalSubmissions: 0,
        brawlerSelections: 0,
      },
    };
  }

  try {
    const playerId = getOrCreateAnonymousPlayerId();
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        puzzleId: submission.puzzleId,
        cellId: submission.cellId,
        brawlerId: submission.brawlerId,
        submittedAt: submission.submittedAt,
        playerId,
      }),
    });

    if (!response.ok) {
      return {
        cellStats: null,
        obscurity: {
          percentage: null,
          status: 'unavailable',
          totalSubmissions: 0,
          brawlerSelections: 0,
        },
      };
    }

    const data = (await response.json()) as { cellStats?: CellObscurityStats };
    const cellStats = data?.cellStats ?? null;
    return {
      cellStats,
      obscurity: calculateObscurityFromStats(cellStats, submission.brawlerId),
    };
  } catch {
    return {
      cellStats: null,
      obscurity: {
        percentage: null,
        status: 'unavailable',
        totalSubmissions: 0,
        brawlerSelections: 0,
      },
    };
  }
}
