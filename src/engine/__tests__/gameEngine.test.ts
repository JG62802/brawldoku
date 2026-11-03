import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { BRAWLERS } from '../../data/brawlers';
import { CATEGORIES, CATEGORY_BY_ID } from '../categories';
import { generateDailyPuzzle, hasDisjointSolution, getPuzzleNumberForDate } from '../puzzleGenerator';
import {
  createInitialGameState,
  reconcileSavedGameState,
  submitGuess,
  buildPostGameShareText,
  getValidBrawlersForCell,
  updateCellObscurity,
} from '../gameEngine';
import {
  calculateObscurityFromStats,
  aggregateValidSubmissions,
} from '../../services/obscurityService';
import { ObscurityDatabaseStore } from '../../server/obscurityApiPlugin';

describe('Brawldoku Engine, Dataset & Obscurity Verification', () => {
  it('contains verified Brawlers including the 27 Buffie Brawlers across 9 Trios and 19 2025-2026 Brawlers', () => {
    expect(BRAWLERS.length).toBe(106);
    const buffieBrawlers = BRAWLERS.filter((b) => b.hasBuffies);
    expect(buffieBrawlers.length).toBe(27);

    const brawlers2025And2026 = BRAWLERS.filter((b) => b.releaseYear === 2025 || b.releaseYear === 2026);
    expect(brawlers2025And2026.length).toBe(19);
    const cat2025_2026 = CATEGORY_BY_ID['year_2025_2026'];
    expect(cat2025_2026).toBeDefined();
    expect(BRAWLERS.filter((b) => cat2025_2026.predicate(b)).length).toBe(19);
  });

  it('ensures every category in the category pool matches at least 1 Brawler', () => {
    for (const cat of CATEGORIES) {
      const matches = BRAWLERS.filter((b) => cat.predicate(b));
      expect(matches.length, `Category ${cat.id} had 0 matches`).toBeGreaterThan(0);
    }
  });

  it('removes RNG Ability completely and implements independent Brawler Rarity categories', () => {
    // Confirm RNG Ability is completely removed
    expect(CATEGORY_BY_ID['mech_rng']).toBeUndefined();
    expect(CATEGORIES.some((c) => c.id === 'mech_rng' || c.label === 'RNG Ability')).toBe(false);

    // Confirm all 5 rarity categories exist and match verified dataset counts
    const expectedRarities: [string, string, number][] = [
      ['rarity_rare', 'Rare', 8],
      ['rarity_super_rare', 'Super Rare', 10],
      ['rarity_epic', 'Epic', 30],
      ['rarity_mythic', 'Mythic', 41],
      ['rarity_legendary', 'Legendary', 16],
    ];

    for (const [id, label, expectedCount] of expectedRarities) {
      const cat = CATEGORY_BY_ID[id];
      expect(cat, `Missing rarity category ${id}`).toBeDefined();
      expect(cat.label).toBe(label);
      expect(cat.group).toBe('Rarity');
      const matching = BRAWLERS.filter((b) => cat.predicate(b));
      expect(matching).toHaveLength(expectedCount);
      expect(matching.every((b) => b.rarity === label)).toBe(true);
    }

    // Mutually exclusive Rarity row x Rarity col must be rejected by hasDisjointSolution
    const conflictCheck = hasDisjointSolution(
      [CATEGORY_BY_ID['rarity_rare'], CATEGORY_BY_ID['type_tank'], CATEGORY_BY_ID['type_marksman']],
      [CATEGORY_BY_ID['rarity_epic'], CATEGORY_BY_ID['ammo_three'], CATEGORY_BY_ID['weapon_gun']],
      2
    );
    expect(conflictCheck.valid).toBe(false);

    // Rarity category on row or column with compatible categories produces a valid 9-brawler disjoint solution
    const validRarityGrid = hasDisjointSolution(
      [CATEGORY_BY_ID['rarity_epic'], CATEGORY_BY_ID['rarity_mythic'], CATEGORY_BY_ID['rarity_legendary']],
      [CATEGORY_BY_ID['ammo_three'], CATEGORY_BY_ID['prog_hypercharge'], CATEGORY_BY_ID['gender_male']],
      2
    );
    expect(validRarityGrid.valid).toBe(true);
  });

  it('generates deterministic, solvable 3x3 daily puzzles across 30 consecutive days', () => {
    const p1 = generateDailyPuzzle('2026-11-02');
    const p2 = generateDailyPuzzle('2026-11-02');
    expect(p1.rows.map((r) => r.id)).toEqual(p2.rows.map((r) => r.id));
    expect(p1.cols.map((c) => c.id)).toEqual(p2.cols.map((c) => c.id));

    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
      const puzzle = generateDailyPuzzle(dateStr);
      expect(puzzle.rows).toHaveLength(3);
      expect(puzzle.cols).toHaveLength(3);

      const check = hasDisjointSolution(puzzle.rows, puzzle.cols, 2);
      expect(check.valid, `Puzzle on ${dateStr} was not solvable with 9 distinct brawlers`).toBe(
        true
      );
    }
  });

  it('validates guesses, prevents duplicate brawlers, updates score, and formats post-game share text', () => {
    let state = createInitialGameState('2026-11-02');
    expect(state.guessesRemaining).toBe(9);
    expect(state.score).toBe(0);

    const validFor00 = getValidBrawlersForCell(state, 0, 0);
    expect(validFor00.length).toBeGreaterThan(0);
    const chosenBrawler = validFor00[0];

    const res1 = submitGuess(state, 0, 0, chosenBrawler.id);
    expect(res1.correct).toBe(true);
    expect(res1.nextState.score).toBe(100);
    expect(res1.nextState.guessesRemaining).toBe(8);
    expect(res1.nextState.cells[0][0].obscurityStatus).toBe('loading');
    expect(res1.nextState.cells[0][0].obscurityPercent).toBeNull();
    state = res1.nextState;

    // Attempting to reuse the same Brawler in cell (0,1) should be rejected without losing a guess
    const resDuplicate = submitGuess(state, 0, 1, chosenBrawler.id);
    expect(resDuplicate.correct).toBe(false);
    expect(resDuplicate.error).toContain('already used');
    expect(resDuplicate.nextState.guessesRemaining).toBe(8);

    // Find an invalid brawler for cell (0,1)
    const rowCat = CATEGORY_BY_ID[state.rowCategoryIds[0]];
    const colCat = CATEGORY_BY_ID[state.colCategoryIds[1]];
    const invalidBrawler = BRAWLERS.find(
      (b) => b.id !== chosenBrawler.id && !(rowCat.predicate(b) && colCat.predicate(b))
    )!;

    const resWrong = submitGuess(state, 0, 1, invalidBrawler.id);
    expect(resWrong.correct).toBe(false);
    expect(resWrong.nextState.guessesRemaining).toBe(7);
    expect(resWrong.nextState.score).toBe(75);
    expect(resWrong.nextState.mistakes).toBe(1);

    const shareText = buildPostGameShareText(resWrong.nextState, 'https://brawldoku.example.com');
    expect(shareText).toContain("LOOK AT MY SCORE! 75 BET YOU CAN'T BEAT IT!");
    expect(shareText).toContain('https://brawldoku.example.com');
  });

  it('calculates obscurity percentage accurately and distinguishes unavailable data from a genuine 0%', () => {
    // Unavailable when stats are null or totalValidSubmissions === 0
    const unavailableNull = calculateObscurityFromStats(null, 16000005);
    expect(unavailableNull.status).toBe('unavailable');
    expect(unavailableNull.percentage).toBeNull();

    const unavailableZeroTotal = calculateObscurityFromStats(
      {
        puzzleId: '2026-11-02',
        cellId: '0-0',
        totalValidSubmissions: 0,
        brawlerCounts: {},
      },
      16000005
    );
    expect(unavailableZeroTotal.status).toBe('unavailable');
    expect(unavailableZeroTotal.percentage).toBeNull();

    // 3 out of 25 valid players selected Spike (16000005) -> 12%
    const statsWith25 = {
      puzzleId: '2026-11-02',
      cellId: '0-0' as const,
      totalValidSubmissions: 25,
      brawlerCounts: {
        16000005: 3,
        16000000: 22,
      },
    };
    const spikeObscurity = calculateObscurityFromStats(statsWith25, 16000005);
    expect(spikeObscurity.status).toBe('available');
    expect(spikeObscurity.percentage).toBe(12);

    // Genuine 0% when totalValidSubmissions > 0 and 0 players selected another valid brawler
    const unpickedObscurity = calculateObscurityFromStats(statsWith25, 16000001);
    expect(unpickedObscurity.status).toBe('available');
    expect(unpickedObscurity.percentage).toBe(0);
  });

  it('only counts valid submissions in both client aggregation and backend ObscurityDatabaseStore', () => {
    const dateStr = '2026-11-02';
    const state = createInitialGameState(dateStr);
    const rowCatId = state.rowCategoryIds[0];
    const colCatId = state.colCategoryIds[0];
    const validBrawlers = getValidBrawlersForCell(state, 0, 0);
    expect(validBrawlers.length).toBeGreaterThanOrEqual(2);

    const brawlerA = validBrawlers[0];
    const brawlerB = validBrawlers[1];
    const invalidBrawler = BRAWLERS.find(
      (b) => !validBrawlers.some((vb) => vb.id === b.id)
    )!;

    // Test pure aggregation
    const agg = aggregateValidSubmissions(
      dateStr,
      '0-0',
      [
        { puzzleId: dateStr, cellId: '0-0', brawlerId: brawlerA.id, submittedAt: '2026-11-02T01:00:00Z' },
        { puzzleId: dateStr, cellId: '0-0', brawlerId: brawlerB.id, submittedAt: '2026-11-02T01:01:00Z' },
        { puzzleId: dateStr, cellId: '0-0', brawlerId: brawlerB.id, submittedAt: '2026-11-02T01:02:00Z' },
        { puzzleId: dateStr, cellId: '0-0', brawlerId: brawlerB.id, submittedAt: '2026-11-02T01:03:00Z' },
        // Invalid brawler should be ignored
        { puzzleId: dateStr, cellId: '0-0', brawlerId: invalidBrawler.id, submittedAt: '2026-11-02T01:04:00Z' },
      ],
      rowCatId,
      colCatId
    );
    expect(agg.totalValidSubmissions).toBe(4);
    expect(calculateObscurityFromStats(agg, brawlerA.id).percentage).toBe(25);
    expect(calculateObscurityFromStats(agg, brawlerB.id).percentage).toBe(75);

    // Test backend ObscurityDatabaseStore
    const tmpFile = path.join(os.tmpdir(), `brawldoku_test_${Date.now()}.json`);
    const store = new ObscurityDatabaseStore(tmpFile);

    const rejected = store.insertValidSubmission({
      puzzleId: dateStr,
      cellId: '0-0',
      brawlerId: invalidBrawler.id,
      submittedAt: '2026-11-02T01:00:00Z',
    });
    expect(rejected).toBeNull();

    const accepted = store.insertValidSubmission({
      puzzleId: dateStr,
      cellId: '0-0',
      brawlerId: brawlerA.id,
      submittedAt: '2026-11-02T01:05:00Z',
    });
    expect(accepted).not.toBeNull();
    expect(accepted!.totalValidSubmissions).toBe(1);
    expect(accepted!.brawlerCounts[brawlerA.id]).toBe(1);

    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  });

  it('guarantees 9/9 starting guesses, decrements by 1 per valid guess down to 0/9, and reconciles persisted state accurately', () => {
    const dateStr = '2026-11-02';
    let state = createInitialGameState(dateStr);
    expect(state.guessesRemaining).toBe(9);
    expect(state.maxGuesses).toBe(9);

    // Corrupted / desynchronized storage state with 0 guesses in history but guessesRemaining = 7 must reconcile back to 9/9
    const desyncedRaw = {
      ...state,
      guessesRemaining: 7,
      guessHistory: [],
    };
    const reconciledFresh = reconcileSavedGameState(desyncedRaw, dateStr);
    expect(reconciledFresh.guessesRemaining).toBe(9);
    expect(reconciledFresh.maxGuesses).toBe(9);

    // Invalid brawler ID should not consume a guess
    const invalidIdRes = submitGuess(state, 0, 0, -999);
    expect(invalidIdRes.nextState.guessesRemaining).toBe(9);

    // Invalid coordinates should not consume a guess
    const invalidCoordRes = submitGuess(state, 5, 5, BRAWLERS[0].id);
    expect(invalidCoordRes.nextState.guessesRemaining).toBe(9);

    // Step through 9 valid guesses (1 correct + 8 incorrect) and verify 9 -> 8 -> 7 -> ... -> 0
    const validFor00 = getValidBrawlersForCell(state, 0, 0)[0];
    const step1 = submitGuess(state, 0, 0, validFor00.id);
    expect(step1.nextState.guessesRemaining).toBe(8);
    state = step1.nextState;

    // Simulate page refresh / state restoration after 1 guess: must stay 8/9 without subtracting again
    const restoredAfter1 = reconcileSavedGameState(JSON.parse(JSON.stringify(state)), dateStr);
    expect(restoredAfter1.guessesRemaining).toBe(8);

    // Guessing on an already-filled cell (0,0) must not consume a guess
    const alreadyFilledRes = submitGuess(state, 0, 0, BRAWLERS[1].id);
    expect(alreadyFilledRes.nextState.guessesRemaining).toBe(8);

    // Find an invalid brawler for cell (0,1) and submit 8 wrong guesses to reach 0/9
    const rowCat = CATEGORY_BY_ID[state.rowCategoryIds[0]];
    const colCat = CATEGORY_BY_ID[state.colCategoryIds[1]];
    const wrongBrawler = BRAWLERS.find(
      (b) => b.id !== validFor00.id && !(rowCat.predicate(b) && colCat.predicate(b))
    )!;

    for (let expectedRemaining = 7; expectedRemaining >= 0; expectedRemaining--) {
      const res = submitGuess(state, 0, 1, wrongBrawler.id);
      expect(res.nextState.guessesRemaining).toBe(expectedRemaining);
      state = res.nextState;
    }

    expect(state.guessesRemaining).toBe(0);
    expect(state.status).toBe('game_over');

    // Attempting further guesses on a game_over state must be strictly rejected
    const postOverRes = submitGuess(state, 1, 1, BRAWLERS[0].id);
    expect(postOverRes.correct).toBe(false);
    expect(postOverRes.error).toContain('already ended');
    expect(postOverRes.nextState.guessesRemaining).toBe(0);
    expect(postOverRes.nextState.status).toBe('game_over');

    // Reloading / reconciling completed game state preserves completed status and 0 guesses remaining
    const restoredCompleted = reconcileSavedGameState(JSON.parse(JSON.stringify(state)), dateStr);
    expect(restoredCompleted.status).toBe('game_over');
    expect(restoredCompleted.guessesRemaining).toBe(0);
    expect(restoredCompleted.mistakes).toBe(8);
  });

  it('enforces that puzzle numbering never yields NaN and obscurity updates ignore empty cells', () => {
    // Non-date string fallback
    expect(getPuzzleNumberForDate('PRACTICE_1730592000000_1234')).toBe(1);
    expect(getPuzzleNumberForDate('invalid-date')).toBe(1);
    expect(Number.isNaN(getPuzzleNumberForDate('2026-11-02'))).toBe(false);

    // Obscurity status update on empty cell must be safely ignored
    const fresh = createInitialGameState('2026-11-02');
    const updated = updateCellObscurity(fresh, 0, 0, 15, 'available');
    expect(updated.cells[0][0].obscurityStatus).toBe('idle');
    expect(updated.cells[0][0].obscurityPercent).toBeNull();
  });
});
