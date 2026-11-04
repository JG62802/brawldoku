import { describe, it, expect } from 'vitest';
import {
  getRarityTierForPercentage,
  getPointsForPercentage,
  recalculateTotalScore,
  FALLBACK_CELL_POINTS,
} from '../rarityScoring';
import {
  createInitialGameState,
  submitGuess,
  updateCellObscurity,
  reconcileSavedGameState,
  buildPostGameShareText,
  getValidBrawlersForCell,
} from '../gameEngine';
import { BRAWLERS } from '../../data/brawlers';

describe('Rarity-Based Scoring System Unit Tests', () => {
  describe('Boundary and Threshold Tests', () => {
    it('accurately maps boundary percentages to the exact expected rarity tiers and points', () => {
      const expectations: Array<[number, string, number]> = [
        [0, 'Legendary', 200],
        [15.5, 'Legendary', 200],
        [29.99, 'Legendary', 200],
        [30, 'Mythic', 175],
        [42.0, 'Mythic', 175],
        [49.99, 'Mythic', 175],
        [50, 'Epic', 150],
        [61.3, 'Epic', 150],
        [69.99, 'Epic', 150],
        [70, 'Rare', 125],
        [80.0, 'Rare', 125],
        [89.99, 'Rare', 125],
        [90, 'Common', 110],
        [95.4, 'Common', 110],
        [100, 'Common', 110],
      ];

      for (const [percent, expectedTierName, expectedPoints] of expectations) {
        const tier = getRarityTierForPercentage(percent);
        expect(tier, `Expected tier for ${percent}%`).not.toBeNull();
        expect(tier!.name, `Wrong tier name for ${percent}%`).toBe(expectedTierName);
        expect(tier!.points, `Wrong tier points for ${percent}%`).toBe(expectedPoints);

        const points = getPointsForPercentage(percent);
        expect(points, `getPointsForPercentage returned wrong points for ${percent}%`).toBe(
          expectedPoints
        );
      }
    });

    it('clamps negative percentages to 0% and percentages above 100% to 100%', () => {
      // Underflow clamped to 0% (Legendary, 200 pts)
      const underflowTier = getRarityTierForPercentage(-10);
      expect(underflowTier).not.toBeNull();
      expect(underflowTier!.name).toBe('Legendary');
      expect(getPointsForPercentage(-10)).toBe(200);

      const tinyNegTier = getRarityTierForPercentage(-0.0001);
      expect(tinyNegTier!.name).toBe('Legendary');
      expect(getPointsForPercentage(-0.0001)).toBe(200);

      // Overflow clamped to 100% (Common, 110 pts)
      const overflowTier = getRarityTierForPercentage(150);
      expect(overflowTier).not.toBeNull();
      expect(overflowTier!.name).toBe('Common');
      expect(getPointsForPercentage(150)).toBe(110);

      const tinyOverflowTier = getRarityTierForPercentage(100.01);
      expect(tinyOverflowTier!.name).toBe('Common');
      expect(getPointsForPercentage(100.01)).toBe(110);
    });

    it('safely handles null, undefined, NaN, and Infinity by falling back to baseline 100 pts without throwing', () => {
      expect(getRarityTierForPercentage(null)).toBeNull();
      expect(getPointsForPercentage(null)).toBe(FALLBACK_CELL_POINTS);
      expect(FALLBACK_CELL_POINTS).toBe(100);

      expect(getRarityTierForPercentage(undefined)).toBeNull();
      expect(getPointsForPercentage(undefined)).toBe(100);

      expect(getRarityTierForPercentage(NaN)).toBeNull();
      expect(getPointsForPercentage(NaN)).toBe(100);

      expect(getRarityTierForPercentage(Infinity)).toBeNull();
      expect(getPointsForPercentage(Infinity)).toBe(100);

      expect(getRarityTierForPercentage(-Infinity)).toBeNull();
      expect(getPointsForPercentage(-Infinity)).toBe(100);
    });
  });

  describe('Total Score Recalculation & Invariant Verification', () => {
    it('verifies score invariant: max(0, sum(cell.pointsEarned) - mistakes * 25)', () => {
      const mockCells = [
        [
          { brawlerId: 1, pointsEarned: 200 }, // Legendary
          { brawlerId: 2, pointsEarned: 175 }, // Mythic
          { brawlerId: 3, pointsEarned: 150 }, // Epic
        ],
        [
          { brawlerId: 4, pointsEarned: 125 }, // Rare
          { brawlerId: 5, pointsEarned: 110 }, // Common
          { brawlerId: 6, pointsEarned: 100 }, // Baseline fallback
        ],
        [
          { brawlerId: null, pointsEarned: 0 },
          { brawlerId: null, pointsEarned: 0 },
          { brawlerId: null, pointsEarned: 0 },
        ],
      ];

      // Sum of 6 filled cells = 200 + 175 + 150 + 125 + 110 + 100 = 860
      expect(recalculateTotalScore(mockCells, 0)).toBe(860);

      // 1 mistake (-25)
      expect(recalculateTotalScore(mockCells, 1)).toBe(835);

      // 2 mistakes (-50)
      expect(recalculateTotalScore(mockCells, 2)).toBe(810);

      // Excessive mistakes never drive score below 0
      expect(recalculateTotalScore(mockCells, 100)).toBe(0);
    });

    it('calculates the theoretical maximum score of 1800 points for a perfect 9-cell Legendary grid', () => {
      const perfectCells = [0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => ({
          brawlerId: r * 3 + c + 1,
          pointsEarned: 200,
        }))
      );
      expect(recalculateTotalScore(perfectCells, 0)).toBe(1800);
    });
  });

  describe('Game Engine State Transitions with Rarity Scoring', () => {
    it('awards baseline 100 pts on initial guess and dynamically upgrades score when obscurity arrives', () => {
      const dateStr = '2026-11-04';
      let state = createInitialGameState(dateStr);
      const validBrawler = getValidBrawlersForCell(state, 0, 0)[0];

      // Guess with unknown obscurity (null)
      const res = submitGuess(state, 0, 0, validBrawler.id);
      expect(res.correct).toBe(true);
      expect(res.pointsDelta).toBe(100);
      expect(res.nextState.cells[0][0].pointsEarned).toBe(100);
      expect(res.nextState.score).toBe(100);
      state = res.nextState;

      // Obscurity arrives: community chose this brawler only 12% of the time (Legendary!)
      const updated = updateCellObscurity(state, 0, 0, 12, 'available');
      expect(updated.cells[0][0].obscurityPercent).toBe(12);
      expect(updated.cells[0][0].rarityTier).toBe('Legendary');
      expect(updated.cells[0][0].pointsEarned).toBe(200);
      expect(updated.score).toBe(200);

      // Calling updateCellObscurity again with the same value is strictly idempotent
      const updatedAgain = updateCellObscurity(updated, 0, 0, 12, 'available');
      expect(updatedAgain.cells[0][0].pointsEarned).toBe(200);
      expect(updatedAgain.score).toBe(200);
    });

    it('supports pre-calculated obscurity on submitGuess without delaying score update', () => {
      const dateStr = '2026-11-04';
      const state = createInitialGameState(dateStr);
      const validBrawler = getValidBrawlersForCell(state, 0, 0)[0];

      // Pre-calculated obscurity percentage is 35% (Mythic, 175 pts)
      const res = submitGuess(state, 0, 0, validBrawler.id, 35);
      expect(res.correct).toBe(true);
      expect(res.pointsDelta).toBe(175);
      expect(res.nextState.cells[0][0].rarityTier).toBe('Mythic');
      expect(res.nextState.cells[0][0].pointsEarned).toBe(175);
      expect(res.nextState.score).toBe(175);
    });

    it('deducts mistake penalty correctly against rarity scores', () => {
      const dateStr = '2026-11-04';
      let state = createInitialGameState(dateStr);
      const validBrawler = getValidBrawlersForCell(state, 0, 0)[0];

      // Correct Legendary guess: +200
      const res1 = submitGuess(state, 0, 0, validBrawler.id, 5);
      state = res1.nextState;
      expect(state.score).toBe(200);

      // Wrong guess on cell (0, 1): -25 penalty
      const invalidBrawler = BRAWLERS.find((b) => b.id !== validBrawler.id)!;
      const res2 = submitGuess(state, 0, 1, invalidBrawler.id);
      state = res2.nextState;

      // If invalid, score should be 200 - 25 = 175
      if (!res2.correct) {
        expect(state.mistakes).toBe(1);
        expect(state.score).toBe(175);
      }
    });
  });

  describe('Saved State Reconciliation & Post-Game Share', () => {
    it('reconciles legacy or persisted saved state and recalculates rarity-based scores accurately', () => {
      const dateStr = '2026-11-04';
      const fresh = createInitialGameState(dateStr);
      const validBrawler00 = getValidBrawlersForCell(fresh, 0, 0)[0];
      const validBrawler01 = getValidBrawlersForCell(fresh, 0, 1)[0];

      const savedJson = {
        puzzleDate: dateStr,
        puzzleNumber: fresh.puzzleNumber,
        rowCategoryIds: fresh.rowCategoryIds,
        colCategoryIds: fresh.colCategoryIds,
        cells: [
          [
            {
              row: 0,
              col: 0,
              brawlerId: validBrawler00.id,
              pointsEarned: 100, // old baseline points in storage
              obscurityPercent: 18, // 18% should reconcile to Legendary (200 pts)
              obscurityStatus: 'available',
            },
            {
              row: 0,
              col: 1,
              brawlerId: validBrawler01.id,
              pointsEarned: 100, // old baseline points in storage
              obscurityPercent: 92, // 92% should reconcile to Common (110 pts)
              obscurityStatus: 'available',
            },
            { row: 0, col: 2, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
          ],
          [
            { row: 1, col: 0, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
            { row: 1, col: 1, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
            { row: 1, col: 2, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
          ],
          [
            { row: 2, col: 0, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
            { row: 2, col: 1, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
            { row: 2, col: 2, brawlerId: null, pointsEarned: 0, obscurityPercent: null, obscurityStatus: 'idle' },
          ],
        ],
        guessHistory: [
          { row: 0, col: 0, brawlerId: validBrawler00.id, correct: true, points: 100, timestamp: 1 },
          { row: 0, col: 1, brawlerId: validBrawler01.id, correct: true, points: 100, timestamp: 2 },
          { row: 0, col: 2, brawlerId: BRAWLERS[5].id, correct: false, points: -25, timestamp: 3 }, // 1 mistake with real brawler ID
        ],
        mistakes: 1,
        score: 175, // Old score was 100 + 100 - 25 = 175
        status: 'playing',
      };

      const reconciled = reconcileSavedGameState(savedJson, dateStr);

      // Cell (0,0) with 18% obscurity must now be Legendary (200 pts)
      expect(reconciled.cells[0][0].rarityTier).toBe('Legendary');
      expect(reconciled.cells[0][0].pointsEarned).toBe(200);

      // Cell (0,1) with 92% obscurity must now be Common (110 pts)
      expect(reconciled.cells[0][1].rarityTier).toBe('Common');
      expect(reconciled.cells[0][1].pointsEarned).toBe(110);

      // Total score must be: 200 + 110 - 25 = 285
      expect(reconciled.score).toBe(285);
    });

    it('preserves the exact required post-game share CTA format with updated total score', () => {
      const dateStr = '2026-11-04';
      const state = createInitialGameState(dateStr);
      state.score = 635;
      state.cells[0][0].brawlerId = 16000000;
      state.cells[1][1].brawlerId = 16000001;

      const shareText = buildPostGameShareText(state, 'https://www.brawldoku.fun/');
      expect(shareText).toContain("LOOK AT MY SCORE! 635 BET YOU CAN'T BEAT IT!");
      expect(shareText).toContain('https://www.brawldoku.fun/');
    });
  });
});
