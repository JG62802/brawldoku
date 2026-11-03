import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  CellIdentifier,
  CellObscurityStats,
  ObscuritySubmissionRecord,
} from '../types/game.js';
import { generateDailyPuzzle } from '../engine/puzzleGenerator.js';

const VALID_CELL_IDS = new Set<CellIdentifier>([
  '0-0', '0-1', '0-2',
  '1-0', '1-1', '1-2',
  '2-0', '2-1', '2-2',
]);

export class ObscurityDatabaseStore {
  private dbFilePath: string;
  private records: ObscuritySubmissionRecord[] = [];

  constructor(dbFilePath: string) {
    this.dbFilePath = dbFilePath;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed;
        }
      }
    } catch {
      this.records = [];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch {
      // Ignore write failures in read-only environments
    }
  }

  /**
   * Validates that a submission is a legitimate answer for the puzzle's cell
   * before recording it into the database.
   */
  public insertValidSubmission(record: ObscuritySubmissionRecord): CellObscurityStats | null {
    if (
      !record.puzzleId ||
      !VALID_CELL_IDS.has(record.cellId) ||
      typeof record.brawlerId !== 'number' ||
      !record.submittedAt
    ) {
      return null;
    }

    const [rowStr, colStr] = record.cellId.split('-');
    const row = Number(rowStr);
    const col = Number(colStr);

    // Server-side validation against deterministic puzzle definition
    const puzzle = generateDailyPuzzle(record.puzzleId);
    const validMatches = puzzle.cellMatches[row]?.[col] ?? [];
    const isValid = validMatches.some((b) => b.id === record.brawlerId);

    if (!isValid) {
      return null;
    }

    // Store strictly anonymous record (only the 4 required schema fields)
    const sanitizedRecord: ObscuritySubmissionRecord = {
      puzzleId: String(record.puzzleId),
      cellId: record.cellId,
      brawlerId: Number(record.brawlerId),
      submittedAt: new Date(record.submittedAt).toISOString(),
    };

    this.records.push(sanitizedRecord);
    this.saveToDisk();

    return this.getCellStats(sanitizedRecord.puzzleId, sanitizedRecord.cellId);
  }

  public getCellStats(puzzleId: string, cellId: CellIdentifier): CellObscurityStats {
    const brawlerCounts: Record<number, number> = {};
    let totalValidSubmissions = 0;

    for (const r of this.records) {
      if (r.puzzleId === puzzleId && r.cellId === cellId) {
        brawlerCounts[r.brawlerId] = (brawlerCounts[r.brawlerId] ?? 0) + 1;
        totalValidSubmissions += 1;
      }
    }

    return {
      puzzleId,
      cellId,
      totalValidSubmissions,
      brawlerCounts,
    };
  }

  public getPuzzleSummary(puzzleId: string): Record<CellIdentifier, CellObscurityStats> {
    const cells: Partial<Record<CellIdentifier, CellObscurityStats>> = {};
    for (const cellId of VALID_CELL_IDS) {
      cells[cellId] = this.getCellStats(puzzleId, cellId);
    }
    return cells as Record<CellIdentifier, CellObscurityStats>;
  }
}

import { getObscurityStore, validateCellSubmission } from './obscurityStore.js';

export function obscurityApiPlugin(): Plugin {
  return {
    name: 'brawldoku-obscurity-api',
    configureServer(server) {
      // Lazy store retrieval so vite build does not instantiate store at config load time
      let store: ReturnType<typeof getObscurityStore>;
      try {
        store = getObscurityStore();
      } catch {
        // In local dev without credentials if NODE_ENV was set to prod, fall back safely
        store = new ObscurityDatabaseStore(path.resolve(process.cwd(), 'data/obscurity.json')) as unknown as ReturnType<typeof getObscurityStore>;
      }
      server.middlewares.use('/api/obscurity', async (req, res, next) => {
        if (!req.url) return next();

        const urlObj = new URL(req.url, 'http://localhost');

        if (req.method === 'GET') {
          const puzzleId = urlObj.searchParams.get('puzzleId');
          if (!puzzleId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing puzzleId query parameter' }));
            return;
          }

          try {
            const cells = await store.getPuzzleSummary(puzzleId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ puzzleId, cells }));
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to retrieve puzzle summary' }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body) as {
                puzzleId: string;
                cellId: CellIdentifier;
                brawlerId: number;
                playerId?: string;
                submittedAt?: string;
              };

              const validation = validateCellSubmission(
                payload.puzzleId,
                payload.cellId,
                payload.brawlerId
              );

              if (!validation.valid) {
                res.statusCode = 422;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: validation.error }));
                return;
              }

              const { cellStats, alreadySubmitted } = await store.recordSubmission(payload);

              res.statusCode = alreadySubmitted ? 200 : 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ cellStats, alreadySubmitted }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Malformed JSON body' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
