import { Redis } from '@upstash/redis';
import { CellIdentifier, CellObscurityStats } from '../types/game.js';
import { BRAWLER_BY_ID } from '../data/brawlers.js';
import { generateDailyPuzzle } from '../engine/puzzleGenerator.js';

export const VALID_CELL_IDS: CellIdentifier[] = [
  '0-0', '0-1', '0-2',
  '1-0', '1-1', '1-2',
  '2-0', '2-1', '2-2',
];

export const VALID_CELL_SET = new Set<CellIdentifier>(VALID_CELL_IDS);

// Retention policy: statistics for daily puzzles expire after 90 days (7,776,000 seconds)
export const OBSCURITY_KEY_TTL_SECONDS = 90 * 24 * 60 * 60;

export class ObscurityConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObscurityConfigError';
  }
}

export interface SubmissionPayload {
  puzzleId: string;
  cellId: CellIdentifier;
  brawlerId: number;
  playerId?: string;
  submittedAt?: string;
}

export interface SubmissionResult {
  cellStats: CellObscurityStats;
  alreadySubmitted: boolean;
}

export interface IObscurityStore {
  getPuzzleSummary(puzzleId: string): Promise<Record<CellIdentifier, CellObscurityStats>>;
  getCellStats(puzzleId: string, cellId: CellIdentifier): Promise<CellObscurityStats>;
  recordSubmission(payload: SubmissionPayload): Promise<SubmissionResult>;
}

/**
 * Validates whether an anonymous player ID matches a safe token format (alphanumeric, dashes, underscores).
 * Prevents arbitrary or oversized strings from being written into Redis sets.
 */
export function sanitizePlayerId(id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

/**
 * Server-authoritative validation for cell submissions:
 * - puzzleId must be a valid YYYY-MM-DD calendar date
 * - cellId must be a valid coordinate (0-0 through 2-2)
 * - brawlerId must be an authentic brawler in the verified roster
 * - The brawler must satisfy the intersecting row and column categories for this specific daily puzzle
 */
export function validateCellSubmission(
  puzzleId: string,
  cellId: string,
  brawlerId: number
): { valid: true; row: number; col: number } | { valid: false; error: string } {
  if (!puzzleId || !/^\d{4}-\d{2}-\d{2}$/.test(puzzleId)) {
    return { valid: false, error: 'Invalid puzzleId format. Expected YYYY-MM-DD.' };
  }

  if (!VALID_CELL_SET.has(cellId as CellIdentifier)) {
    return { valid: false, error: `Invalid cellId "${cellId}". Must be 0-0 through 2-2.` };
  }

  if (typeof brawlerId !== 'number' || !Number.isInteger(brawlerId)) {
    return { valid: false, error: 'Invalid brawlerId format. Expected integer.' };
  }

  const brawler = BRAWLER_BY_ID[brawlerId];
  if (!brawler) {
    return { valid: false, error: `Unknown Brawler ID "${brawlerId}".` };
  }

  const [rowStr, colStr] = cellId.split('-');
  const row = Number(rowStr);
  const col = Number(colStr);

  const puzzle = generateDailyPuzzle(puzzleId);
  const validMatches = puzzle.cellMatches[row]?.[col] ?? [];
  const matches = validMatches.some((b) => b.id === brawlerId);

  if (!matches) {
    return {
      valid: false,
      error: `Brawler "${brawler.name}" does not satisfy the categories for cell ${cellId} on ${puzzleId}.`,
    };
  }

  return { valid: true, row, col };
}

/**
 * Atomic Redis Lua Script for concurrent submission recording:
 * KEYS[1]: players set (brawldoku:v1:<puzzleId>:<cellId>:players)
 * KEYS[2]: counts hash (brawldoku:v1:<puzzleId>:<cellId>:counts)
 * KEYS[3]: total counter (brawldoku:v1:<puzzleId>:<cellId>:total)
 * ARGV[1]: playerId (sanitized string or empty)
 * ARGV[2]: brawlerId (string integer)
 * ARGV[3]: ttlSeconds (integer)
 *
 * Returns:
 * 1 if duplicate (already submitted by this player)
 * 0 if successfully recorded
 */
const ATOMIC_SUBMISSION_LUA = `
local playersKey = KEYS[1]
local countsKey  = KEYS[2]
local totalKey   = KEYS[3]

local playerId   = ARGV[1]
local brawlerId  = ARGV[2]
local ttlSeconds = tonumber(ARGV[3])

if playerId and playerId ~= "" then
  local isMember = redis.call('SISMEMBER', playersKey, playerId)
  if isMember == 1 then
    return 1
  end
  redis.call('SADD', playersKey, playerId)
end

redis.call('HINCRBY', countsKey, brawlerId, 1)
redis.call('INCR', totalKey)

if ttlSeconds and ttlSeconds > 0 then
  redis.call('EXPIRE', playersKey, ttlSeconds)
  redis.call('EXPIRE', countsKey, ttlSeconds)
  redis.call('EXPIRE', totalKey, ttlSeconds)
end

return 0
`;

/**
 * Production-ready Persistent Storage Adapter using Upstash Redis / Vercel KV.
 * Executes atomic Lua scripts over HTTPS to guarantee race-free, idempotent submissions.
 */
export class UpstashRedisStore implements IObscurityStore {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  public async getPuzzleSummary(puzzleId: string): Promise<Record<CellIdentifier, CellObscurityStats>> {
    const summary: Partial<Record<CellIdentifier, CellObscurityStats>> = {};

    const pipeline = this.redis.pipeline();
    for (const cellId of VALID_CELL_IDS) {
      pipeline.get<number | string>(`brawldoku:v1:${puzzleId}:${cellId}:total`);
      pipeline.hgetall<Record<string, number | string>>(`brawldoku:v1:${puzzleId}:${cellId}:counts`);
    }

    const results = await pipeline.exec();

    for (let i = 0; i < VALID_CELL_IDS.length; i++) {
      const cellId = VALID_CELL_IDS[i];
      const rawTotal = results[i * 2] as number | string | null;
      const rawCounts = (results[i * 2 + 1] as Record<string, number | string> | null) ?? {};

      const totalValidSubmissions = rawTotal !== null ? Number(rawTotal) || 0 : 0;
      const brawlerCounts: Record<number, number> = {};

      if (rawCounts && typeof rawCounts === 'object') {
        for (const [idStr, count] of Object.entries(rawCounts)) {
          const bId = Number(idStr);
          if (!Number.isNaN(bId)) {
            brawlerCounts[bId] = Number(count) || 0;
          }
        }
      }

      summary[cellId] = {
        puzzleId,
        cellId,
        totalValidSubmissions,
        brawlerCounts,
      };
    }

    return summary as Record<CellIdentifier, CellObscurityStats>;
  }

  public async getCellStats(puzzleId: string, cellId: CellIdentifier): Promise<CellObscurityStats> {
    const [rawTotal, rawCounts] = await Promise.all([
      this.redis.get<number | string>(`brawldoku:v1:${puzzleId}:${cellId}:total`),
      this.redis.hgetall<Record<string, number | string>>(`brawldoku:v1:${puzzleId}:${cellId}:counts`),
    ]);

    const totalValidSubmissions = rawTotal !== null ? Number(rawTotal) || 0 : 0;
    const brawlerCounts: Record<number, number> = {};

    if (rawCounts && typeof rawCounts === 'object') {
      for (const [idStr, count] of Object.entries(rawCounts)) {
        const bId = Number(idStr);
        if (!Number.isNaN(bId)) {
          brawlerCounts[bId] = Number(count) || 0;
        }
      }
    }

    return {
      puzzleId,
      cellId,
      totalValidSubmissions,
      brawlerCounts,
    };
  }

  public async recordSubmission(payload: SubmissionPayload): Promise<SubmissionResult> {
    const { puzzleId, cellId, brawlerId, playerId } = payload;
    const safePlayerId = sanitizePlayerId(playerId) ?? '';

    const playersKey = `brawldoku:v1:${puzzleId}:${cellId}:players`;
    const countsKey = `brawldoku:v1:${puzzleId}:${cellId}:counts`;
    const totalKey = `brawldoku:v1:${puzzleId}:${cellId}:total`;

    const evalResult = Number(
      await this.redis.eval(
        ATOMIC_SUBMISSION_LUA,
        [playersKey, countsKey, totalKey],
        [safePlayerId, String(brawlerId), String(OBSCURITY_KEY_TTL_SECONDS)]
      )
    );

    const alreadySubmitted = evalResult === 1;
    const cellStats = await this.getCellStats(puzzleId, cellId);
    return { cellStats, alreadySubmitted };
  }
}

/**
 * In-Memory Store Adapter for unit tests and local development.
 * Simulates atomic Redis operations without network requirements.
 */
export class MemoryStore implements IObscurityStore {
  private totals = new Map<string, number>();
  private counts = new Map<string, Map<number, number>>();
  private players = new Map<string, Set<string>>();

  private cellKey(puzzleId: string, cellId: string): string {
    return `${puzzleId}:${cellId}`;
  }

  public async getPuzzleSummary(puzzleId: string): Promise<Record<CellIdentifier, CellObscurityStats>> {
    const summary: Partial<Record<CellIdentifier, CellObscurityStats>> = {};
    for (const cellId of VALID_CELL_IDS) {
      summary[cellId] = await this.getCellStats(puzzleId, cellId);
    }
    return summary as Record<CellIdentifier, CellObscurityStats>;
  }

  public async getCellStats(puzzleId: string, cellId: CellIdentifier): Promise<CellObscurityStats> {
    const key = this.cellKey(puzzleId, cellId);
    const totalValidSubmissions = this.totals.get(key) ?? 0;
    const countMap = this.counts.get(key) ?? new Map<number, number>();
    const brawlerCounts: Record<number, number> = {};
    for (const [bId, c] of countMap.entries()) {
      brawlerCounts[bId] = c;
    }

    return {
      puzzleId,
      cellId,
      totalValidSubmissions,
      brawlerCounts,
    };
  }

  public async recordSubmission(payload: SubmissionPayload): Promise<SubmissionResult> {
    const { puzzleId, cellId, brawlerId, playerId } = payload;
    const key = this.cellKey(puzzleId, cellId);
    const safePlayerId = sanitizePlayerId(playerId);

    let alreadySubmitted = false;
    if (safePlayerId) {
      let playerSet = this.players.get(key);
      if (!playerSet) {
        playerSet = new Set<string>();
        this.players.set(key, playerSet);
      }
      if (playerSet.has(safePlayerId)) {
        alreadySubmitted = true;
      } else {
        playerSet.add(safePlayerId);
      }
    }

    if (!alreadySubmitted) {
      this.totals.set(key, (this.totals.get(key) ?? 0) + 1);
      let countMap = this.counts.get(key);
      if (!countMap) {
        countMap = new Map<number, number>();
        this.counts.set(key, countMap);
      }
      countMap.set(brawlerId, (countMap.get(brawlerId) ?? 0) + 1);
    }

    const cellStats = await this.getCellStats(puzzleId, cellId);
    return { cellStats, alreadySubmitted };
  }

  public reset(): void {
    this.totals.clear();
    this.counts.clear();
    this.players.clear();
  }
}

let activeStore: IObscurityStore | null = null;

export function getObscurityStore(): IObscurityStore {
  if (activeStore) return activeStore;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    activeStore = new UpstashRedisStore(redis);
    return activeStore;
  }

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    process.env.VERCEL_ENV === 'production';

  if (isProduction) {
    console.error(
      '[Obscurity Error] Missing Redis credentials in production environment. ' +
      'Please configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel environment variables.'
    );
    throw new ObscurityConfigError(
      'Obscurity persistent storage is not configured in production.'
    );
  }

  // In local development or testing without credentials, use MemoryStore
  activeStore = new MemoryStore();
  return activeStore;
}

export function setObscurityStoreForTesting(store: IObscurityStore | null): void {
  activeStore = store;
}
