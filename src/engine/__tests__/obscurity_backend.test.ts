import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MemoryStore,
  VALID_CELL_IDS,
  validateCellSubmission,
  setObscurityStoreForTesting,
  getObscurityStore,
  ObscurityConfigError,
} from '../../server/obscurityStore';
import handler from '../../../api/obscurity';
import { calculateObscurityFromStats } from '../../services/obscurityService';
import { generateDailyPuzzle } from '../puzzleGenerator';
import { createInitialGameState, updateCellObscurity } from '../gameEngine';

describe('Production Obscurity Backend Final Review Verification', () => {
  let store: MemoryStore;
  const testDate = '2026-11-03';
  const puzzle = generateDailyPuzzle(testDate);
  const validCell00Brawler = puzzle.cellMatches[0][0][0];
  const validCell00AltBrawler = puzzle.cellMatches[0][0][1];

  const originalEnv = { ...process.env };

  beforeEach(() => {
    store = new MemoryStore();
    setObscurityStoreForTesting(store);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setObscurityStoreForTesting(null);
  });

  function createMockReqRes(options: {
    method: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  }) {
    let statusCode = 200;
    let responseBody: unknown = null;
    const headers: Record<string, string> = {};

    const req = {
      method: options.method,
      query: options.query ?? {},
      headers: options.headers ?? {},
      body: options.body,
    } as any;

    const res = {
      setHeader(key: string, val: string) {
        headers[key] = val;
        return res;
      },
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: unknown) {
        responseBody = data;
        return res;
      },
      end() {
        return res;
      },
    } as any;

    return {
      req,
      res,
      getStatus: () => statusCode,
      getBody: () => responseBody,
      getHeaders: () => headers,
    };
  }

  it('1. GET returns an empty but valid summary for a new puzzle', async () => {
    const summary = await store.getPuzzleSummary(testDate);
    expect(summary).toBeDefined();

    for (const cellId of VALID_CELL_IDS) {
      const cell = summary[cellId];
      expect(cell).toBeDefined();
      expect(cell.puzzleId).toBe(testDate);
      expect(cell.cellId).toBe(cellId);
      expect(cell.totalValidSubmissions).toBe(0);
      expect(cell.brawlerCounts).toEqual({});
    }
  });

  it('2. POST successfully records a valid submission', async () => {
    const result = await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-1',
    });

    expect(result.alreadySubmitted).toBe(false);
    expect(result.cellStats.totalValidSubmissions).toBe(1);
    expect(result.cellStats.brawlerCounts[validCell00Brawler.id]).toBe(1);
  });

  it('3. GET reflects the new submission', async () => {
    await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-1',
    });

    const summary = await store.getPuzzleSummary(testDate);
    expect(summary['0-0'].totalValidSubmissions).toBe(1);
    expect(summary['0-0'].brawlerCounts[validCell00Brawler.id]).toBe(1);
    expect(summary['0-1'].totalValidSubmissions).toBe(0);
  });

  it('4. Two different players selecting the same brawler produce the correct percentage', async () => {
    await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-1',
    });

    await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-2',
    });

    const stats = await store.getCellStats(testDate, '0-0');
    expect(stats.totalValidSubmissions).toBe(2);
    expect(stats.brawlerCounts[validCell00Brawler.id]).toBe(2);

    const calc = calculateObscurityFromStats(stats, validCell00Brawler.id);
    expect(calc.status).toBe('available');
    expect(calc.percentage).toBe(100);
    expect(calc.totalSubmissions).toBe(2);
    expect(calc.brawlerSelections).toBe(2);
  });

  it('5. Different brawlers produce the correct distribution', async () => {
    for (let i = 1; i <= 3; i++) {
      await store.recordSubmission({
        puzzleId: testDate,
        cellId: '0-0',
        brawlerId: validCell00Brawler.id,
        playerId: `player-${i}`,
      });
    }

    await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00AltBrawler.id,
      playerId: 'player-4',
    });

    const stats = await store.getCellStats(testDate, '0-0');
    expect(stats.totalValidSubmissions).toBe(4);
    expect(stats.brawlerCounts[validCell00Brawler.id]).toBe(3);
    expect(stats.brawlerCounts[validCell00AltBrawler.id]).toBe(1);

    const calcA = calculateObscurityFromStats(stats, validCell00Brawler.id);
    expect(calcA.percentage).toBe(75);

    const calcB = calculateObscurityFromStats(stats, validCell00AltBrawler.id);
    expect(calcB.percentage).toBe(25);
  });

  it('6. A genuine 0% result displays as 0%', async () => {
    await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-1',
    });

    const stats = await store.getCellStats(testDate, '0-0');
    const calc = calculateObscurityFromStats(stats, validCell00AltBrawler.id);
    expect(calc.status).toBe('available');
    expect(calc.percentage).toBe(0);
    expect(calc.totalSubmissions).toBe(1);
    expect(calc.brawlerSelections).toBe(0);
  });

  it('7. No submissions display as N/A', async () => {
    const stats = await store.getCellStats(testDate, '0-0');
    expect(stats.totalValidSubmissions).toBe(0);

    const calc = calculateObscurityFromStats(stats, validCell00Brawler.id);
    expect(calc.status).toBe('unavailable');
    expect(calc.percentage).toBeNull();
  });

  it('8. Duplicate submissions from the same player and cell are safely ignored (idempotent)', async () => {
    const res1 = await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-unique-123',
    });
    expect(res1.alreadySubmitted).toBe(false);
    expect(res1.cellStats.totalValidSubmissions).toBe(1);

    const res2 = await store.recordSubmission({
      puzzleId: testDate,
      cellId: '0-0',
      brawlerId: validCell00Brawler.id,
      playerId: 'player-unique-123',
    });
    expect(res2.alreadySubmitted).toBe(true);
    expect(res2.cellStats.totalValidSubmissions).toBe(1);
    expect(res2.cellStats.brawlerCounts[validCell00Brawler.id]).toBe(1);
  });

  it('9. Concurrent submissions do not corrupt counts', async () => {
    const promises = Array.from({ length: 20 }, (_, idx) =>
      store.recordSubmission({
        puzzleId: testDate,
        cellId: '0-0',
        brawlerId: validCell00Brawler.id,
        playerId: `concurrent-player-${idx}`,
      })
    );

    await Promise.all(promises);

    const stats = await store.getCellStats(testDate, '0-0');
    expect(stats.totalValidSubmissions).toBe(20);
    expect(stats.brawlerCounts[validCell00Brawler.id]).toBe(20);
  });

  it('10. Invalid brawler IDs, coordinates, and mismatched categories are rejected server-side', () => {
    const resCell = validateCellSubmission(testDate, '3-0', validCell00Brawler.id);
    expect(resCell.valid).toBe(false);

    const resBrawler = validateCellSubmission(testDate, '0-0', 99999999);
    expect(resBrawler.valid).toBe(false);

    const candidateInvalid = [16000000, 16000001, 16000002, 16000003].find(
      (id) => !puzzle.cellMatches[0][0].some((b) => b.id === id)
    )!;

    const resMismatch = validateCellSubmission(testDate, '0-0', candidateInvalid);
    expect(resMismatch.valid).toBe(false);
  });

  it('11. In production, missing Redis credentials throws ObscurityConfigError and handler returns 503', async () => {
    setObscurityStoreForTesting(null);
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    expect(() => getObscurityStore()).toThrow(ObscurityConfigError);

    const mockGet = createMockReqRes({
      method: 'GET',
      query: { puzzleId: testDate },
    });
    await handler(mockGet.req, mockGet.res);
    expect(mockGet.getStatus()).toBe(503);
    const body = mockGet.getBody() as any;
    expect(body.code).toBe('STORAGE_NOT_CONFIGURED');
  });

  it('12. Origin restrictions: only trusted origins receive CORS headers', async () => {
    // Trusted origin
    const mockTrusted = createMockReqRes({
      method: 'GET',
      query: { puzzleId: testDate },
      headers: { origin: 'https://brawldoku.fun' },
    });
    await handler(mockTrusted.req, mockTrusted.res);
    expect(mockTrusted.getHeaders()['Access-Control-Allow-Origin']).toBe('https://brawldoku.fun');

    // Untrusted origin
    const mockUntrusted = createMockReqRes({
      method: 'GET',
      query: { puzzleId: testDate },
      headers: { origin: 'https://malicious-scam.com' },
    });
    await handler(mockUntrusted.req, mockUntrusted.res);
    expect(mockUntrusted.getHeaders()['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('13. Unsupported HTTP methods (PUT, DELETE) return 405 Method Not Allowed', async () => {
    const mockPut = createMockReqRes({ method: 'PUT' });
    await handler(mockPut.req, mockPut.res);
    expect(mockPut.getStatus()).toBe(405);

    const mockDelete = createMockReqRes({ method: 'DELETE' });
    await handler(mockDelete.req, mockDelete.res);
    expect(mockDelete.getStatus()).toBe(405);
  });

  it('14. Oversized payload returns 413 Payload Too Large', async () => {
    const giantPayload = 'x'.repeat(10000);
    const mockLarge = createMockReqRes({
      method: 'POST',
      body: giantPayload,
    });
    await handler(mockLarge.req, mockLarge.res);
    expect(mockLarge.getStatus()).toBe(413);
  });

  it('15. Frontend state remains completely uncorrupted when obscurity service is unavailable', () => {
    const initial = createInitialGameState(testDate);
    expect(initial.score).toBe(0);
    expect(initial.guessesRemaining).toBe(9);
    expect(initial.status).toBe('playing');

    // Simulate backend obscurity failure for cell 0,0
    const nextState = updateCellObscurity(initial, 0, 0, null, 'unavailable');
    expect(nextState.score).toBe(initial.score);
    expect(nextState.guessesRemaining).toBe(initial.guessesRemaining);
    expect(nextState.status).toBe(initial.status);
    expect(nextState.mistakes).toBe(initial.mistakes);
    expect(nextState.streak).toBe(initial.streak);
  });
});
