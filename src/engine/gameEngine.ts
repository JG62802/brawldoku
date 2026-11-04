import {
  DailyGameState,
  CellState,
  Brawler,
  ObscurityDataStatus,
} from '../types/game.js';
import { BRAWLER_BY_ID } from '../data/brawlers.js';
import { CATEGORY_BY_ID, getMatchingBrawlers } from './categories.js';
import { generateDailyPuzzle } from './puzzleGenerator.js';
import {
  FALLBACK_CELL_POINTS,
  getRarityTierForPercentage,
  getPointsForPercentage,
  recalculateTotalScore,
} from './rarityScoring.js';

export {
  FALLBACK_CELL_POINTS,
  getRarityTierForPercentage,
  getPointsForPercentage,
  recalculateTotalScore,
};

export const BASE_POINTS_PER_CELL = 100;
export const MISTAKE_PENALTY = 25;
export const MAX_GUESSES = 9;

export function createInitialGameState(dateStr: string): DailyGameState {
  const puzzle = generateDailyPuzzle(dateStr);

  const cells: CellState[][] = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => ({
      row: r,
      col: c,
      brawlerId: null,
      pointsEarned: 0,
      obscurityPercent: null,
      obscurityStatus: 'idle',
      validCount: puzzle.cellMatches[r][c].length,
      rarityTier: null,
    }))
  );

  return {
    puzzleDate: dateStr,
    puzzleNumber: puzzle.puzzleNumber,
    rowCategoryIds: [puzzle.rows[0].id, puzzle.rows[1].id, puzzle.rows[2].id],
    colCategoryIds: [puzzle.cols[0].id, puzzle.cols[1].id, puzzle.cols[2].id],
    cells,
    guessesRemaining: MAX_GUESSES,
    maxGuesses: MAX_GUESSES,
    score: 0,
    mistakes: 0,
    streak: 0,
    maxStreak: 0,
    status: 'playing',
    guessHistory: [],
  };
}

/**
 * Validates and reconciles a persisted DailyGameState from storage against the
 * canonical daily puzzle for `dateStr`. Ensures `maxGuesses` is always 9 and
 * `guessesRemaining` is strictly synchronized with `guessHistory` so a fresh or
 * restored game never starts with an invalid or unexpectedly decremented guess count.
 */
export function reconcileSavedGameState(
  raw: unknown,
  dateStr: string
): DailyGameState {
  const fresh = createInitialGameState(dateStr);
  if (!raw || typeof raw !== 'object') return fresh;

  const candidate = raw as Partial<DailyGameState>;
  if (
    candidate.puzzleDate !== dateStr ||
    !Array.isArray(candidate.cells) ||
    candidate.cells.length !== 3 ||
    !Array.isArray(candidate.rowCategoryIds) ||
    !Array.isArray(candidate.colCategoryIds) ||
    candidate.rowCategoryIds.length !== 3 ||
    candidate.colCategoryIds.length !== 3
  ) {
    return fresh;
  }

  // Ensure stored categories match the canonical daily puzzle for this date
  const categoriesMatch =
    candidate.rowCategoryIds.every((id, idx) => id === fresh.rowCategoryIds[idx]) &&
    candidate.colCategoryIds.every((id, idx) => id === fresh.colCategoryIds[idx]);
  if (!categoriesMatch) {
    return fresh;
  }

  const cells: CellState[][] = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => {
      const savedCell = candidate.cells?.[r]?.[c];
      const canonicalCell = fresh.cells[r][c];
      if (!savedCell || typeof savedCell !== 'object') return canonicalCell;

      const brawlerId =
        typeof savedCell.brawlerId === 'number' && BRAWLER_BY_ID[savedCell.brawlerId]
          ? savedCell.brawlerId
          : null;

      const obscurityPercent =
        brawlerId !== null && typeof savedCell.obscurityPercent === 'number'
          ? savedCell.obscurityPercent
          : null;

      const tier = getRarityTierForPercentage(obscurityPercent);
      const pointsEarned =
        brawlerId !== null
          ? tier
            ? tier.points
            : typeof savedCell.pointsEarned === 'number' && savedCell.pointsEarned > 0
            ? savedCell.pointsEarned
            : FALLBACK_CELL_POINTS
          : 0;

      return {
        row: r,
        col: c,
        brawlerId,
        pointsEarned,
        obscurityPercent,
        obscurityStatus: brawlerId !== null ? (savedCell.obscurityStatus ?? 'idle') : 'idle',
        validCount: canonicalCell.validCount,
        rarityTier: tier?.name ?? (savedCell.rarityTier ?? null),
      };
    })
  );

  const validHistory = Array.isArray(candidate.guessHistory)
    ? candidate.guessHistory.filter(
        (g) =>
          g &&
          typeof g.brawlerId === 'number' &&
          Boolean(BRAWLER_BY_ID[g.brawlerId]) &&
          typeof g.row === 'number' &&
          typeof g.col === 'number'
      )
    : [];

  const filledCount = cells.flat().filter((c) => c.brawlerId !== null).length;

  // Ensure guessHistory has at least the solved cells if history was truncated
  const consumedGuesses = Math.max(validHistory.length, filledCount);
  const computedRemaining = Math.max(0, MAX_GUESSES - consumedGuesses);

  let status: DailyGameState['status'] = 'playing';
  if (filledCount === 9) {
    status = 'won';
  } else if (computedRemaining <= 0 || candidate.status === 'game_over') {
    status = 'game_over';
  }

  const guessesRemaining = status === 'game_over' && computedRemaining > 0 ? 0 : computedRemaining;
  const mistakes = validHistory.filter((g) => !g.correct).length;
  const score = recalculateTotalScore(cells, mistakes, MISTAKE_PENALTY);

  return {
    ...fresh,
    cells,
    guessesRemaining,
    maxGuesses: MAX_GUESSES,
    score,
    mistakes,
    streak: typeof candidate.streak === 'number' ? candidate.streak : 0,
    maxStreak: typeof candidate.maxStreak === 'number' ? candidate.maxStreak : 0,
    status,
    guessHistory: validHistory,
  };
}

export function getUsedBrawlerIds(state: DailyGameState): Set<number> {
  const used = new Set<number>();
  for (const row of state.cells) {
    for (const cell of row) {
      if (cell.brawlerId !== null) {
        used.add(cell.brawlerId);
      }
    }
  }
  return used;
}

export function getValidBrawlersForCell(
  state: DailyGameState,
  row: number,
  col: number
): Brawler[] {
  const rowCat = CATEGORY_BY_ID[state.rowCategoryIds[row]];
  const colCat = CATEGORY_BY_ID[state.colCategoryIds[col]];
  if (!rowCat || !colCat) return [];
  return getMatchingBrawlers(rowCat, colCat);
}

/**
 * Updates a specific cell's obscurity percentage and status after fetching or recording
 * actual player submission counts.
 */
export function updateCellObscurity(
  state: DailyGameState,
  row: number,
  col: number,
  obscurityPercent: number | null,
  obscurityStatus: ObscurityDataStatus
): DailyGameState {
  const nextCells = state.cells.map((r, rIdx) =>
    r.map((cell, cIdx) => {
      if (rIdx === row && cIdx === col) {
        // Obscurity only applies to filled cells
        if (cell.brawlerId === null) return cell;
        const tier = getRarityTierForPercentage(obscurityPercent);
        const pointsEarned = tier ? tier.points : FALLBACK_CELL_POINTS;
        return {
          ...cell,
          obscurityPercent,
          obscurityStatus,
          pointsEarned,
          rarityTier: tier?.name ?? null,
        };
      }
      return cell;
    })
  );

  return {
    ...state,
    cells: nextCells,
    score: recalculateTotalScore(nextCells, state.mistakes, MISTAKE_PENALTY),
  };
}

export interface SubmitGuessResult {
  nextState: DailyGameState;
  correct: boolean;
  error?: string;
  pointsDelta: number;
  brawler?: Brawler;
}

export function submitGuess(
  state: DailyGameState,
  row: number,
  col: number,
  brawlerId: number,
  knownObscurityPercent?: number | null
): SubmitGuessResult {
  if (state.status !== 'playing') {
    return { nextState: state, correct: false, error: 'Game has already ended.', pointsDelta: 0 };
  }
  if (state.guessesRemaining <= 0) {
    return { nextState: state, correct: false, error: 'No guesses remaining.', pointsDelta: 0 };
  }

  const targetCell = state.cells[row]?.[col];
  if (!targetCell) {
    return { nextState: state, correct: false, error: 'Invalid cell coordinates.', pointsDelta: 0 };
  }
  if (targetCell.brawlerId !== null) {
    return { nextState: state, correct: false, error: 'This cell is already filled.', pointsDelta: 0 };
  }

  const used = getUsedBrawlerIds(state);
  if (used.has(brawlerId)) {
    return {
      nextState: state,
      correct: false,
      error: 'Brawler is already used in another cell!',
      pointsDelta: 0,
    };
  }

  const brawler = BRAWLER_BY_ID[brawlerId];
  if (!brawler) {
    return { nextState: state, correct: false, error: 'Unknown Brawler.', pointsDelta: 0 };
  }

  const rowCat = CATEGORY_BY_ID[state.rowCategoryIds[row]];
  const colCat = CATEGORY_BY_ID[state.colCategoryIds[col]];
  const isValid = rowCat.predicate(brawler) && colCat.predicate(brawler);

  const nextCells = state.cells.map((r) => r.map((c) => ({ ...c })));
  const nextGuessesRemaining = state.guessesRemaining - 1;
  let nextMistakes = state.mistakes;
  let nextStreak = state.streak;
  let nextMaxStreak = state.maxStreak;
  let pointsDelta = 0;

  if (isValid) {
    const validList = getMatchingBrawlers(rowCat, colCat);
    const tier = getRarityTierForPercentage(knownObscurityPercent);
    pointsDelta =
      knownObscurityPercent !== undefined && knownObscurityPercent !== null
        ? tier
          ? tier.points
          : FALLBACK_CELL_POINTS
        : FALLBACK_CELL_POINTS;
    nextStreak = state.streak + 1;
    nextMaxStreak = Math.max(state.maxStreak, nextStreak);

    nextCells[row][col] = {
      ...targetCell,
      brawlerId: brawler.id,
      pointsEarned: pointsDelta,
      obscurityPercent: knownObscurityPercent ?? null,
      obscurityStatus:
        knownObscurityPercent !== undefined && knownObscurityPercent !== null
          ? 'available'
          : 'loading',
      validCount: validList.length,
      rarityTier: tier?.name ?? null,
    };
  } else {
    nextMistakes = state.mistakes + 1;
    nextStreak = 0;
    pointsDelta = -MISTAKE_PENALTY;
  }

  const nextScore = recalculateTotalScore(nextCells, nextMistakes, MISTAKE_PENALTY);

  const filledCount = nextCells.flat().filter((c) => c.brawlerId !== null).length;
  let nextStatus: DailyGameState['status'] = 'playing';
  if (filledCount === 9) {
    nextStatus = 'won';
  } else if (nextGuessesRemaining <= 0) {
    nextStatus = 'game_over';
  }

  const nextState: DailyGameState = {
    ...state,
    cells: nextCells,
    guessesRemaining: nextGuessesRemaining,
    score: nextScore,
    mistakes: nextMistakes,
    streak: nextStreak,
    maxStreak: nextMaxStreak,
    status: nextStatus,
    guessHistory: [
      ...state.guessHistory,
      {
        row,
        col,
        brawlerId: brawler.id,
        brawlerName: brawler.name,
        correct: isValid,
        points: pointsDelta,
        timestamp: Date.now(),
      },
    ],
  };

  return {
    nextState,
    correct: isValid,
    pointsDelta,
    brawler,
  };
}

export function giveUpGame(state: DailyGameState): DailyGameState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    guessesRemaining: 0,
    status: 'game_over',
  };
}

/**
 * Generates the exact required Post-Game Share CTA text format:
 * "LOOK AT MY SCORE! [PLAYER SCORE] BET YOU CAN'T BEAT IT!"
 * plus the website URL.
 */
export function buildPostGameShareText(state: DailyGameState, siteUrl: string): string {
  const headline = `LOOK AT MY SCORE! ${state.score} BET YOU CAN'T BEAT IT!`;
  const gridEmoji = state.cells
    .map((row) => row.map((cell) => (cell.brawlerId !== null ? '🟨' : '⬛')).join(''))
    .join('\n');
  const filledCount = state.cells.flat().filter((c) => c.brawlerId !== null).length;

  return `${headline}\n\nBrawldoku #${state.puzzleNumber} (${filledCount}/9)\n${gridEmoji}\n${siteUrl}`;
}
