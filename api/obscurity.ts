import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getObscurityStore,
  validateCellSubmission,
  sanitizePlayerId,
  ObscurityConfigError,
} from '../src/server/obscurityStore.js';
import { calculateObscurityFromStats } from '../src/services/obscurityService.js';
import type { CellIdentifier } from '../src/types/game.js';

const ALLOWED_ORIGINS = new Set([
  'https://brawldoku.fun',
  'https://www.brawldoku.fun',
  'https://brawldoku.vercel.app',
]);

const MAX_PAYLOAD_BYTES = 8192; // 8 KB safety limit

function applyCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;
  if (!origin) {
    // Same-origin request or non-browser client
    return;
  }

  const isLocalDev =
    process.env.NODE_ENV !== 'production' &&
    (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin));

  if (ALLOWED_ORIGINS.has(origin) || isLocalDev) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Vary', 'Origin');
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Enforce supported HTTP methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({
      error: `Method "${req.method}" not allowed. Only GET and POST are supported.`,
    });
    return;
  }

  // Resolve store adapter with explicit configuration error handling
  let store;
  try {
    store = getObscurityStore();
  } catch (err) {
    if (err instanceof ObscurityConfigError) {
      res.status(503).json({
        error: 'Obscurity service is unavailable in production: database credentials not configured.',
        code: 'STORAGE_NOT_CONFIGURED',
      });
      return;
    }
    res.status(500).json({ error: 'Internal configuration error.' });
    return;
  }

  if (req.method === 'GET') {
    const rawPuzzleId = req.query.puzzleId;
    if (typeof rawPuzzleId !== 'string' || !rawPuzzleId.trim()) {
      res.status(400).json({ error: 'Missing required "puzzleId" query parameter.' });
      return;
    }

    const puzzleId = rawPuzzleId.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzleId)) {
      res.status(400).json({ error: 'Invalid "puzzleId" format. Expected YYYY-MM-DD.' });
      return;
    }

    try {
      const cells = await store.getPuzzleSummary(puzzleId);
      // Fast edge cache: 2s max-age with 5s stale-while-revalidate guarantees near-instant updates
      res.setHeader('Cache-Control', 'public, s-maxage=2, stale-while-revalidate=5');
      res.status(200).json({ puzzleId, cells });
    } catch (err) {
      console.error('[Obscurity GET Error]:', err);
      res.status(500).json({ error: 'Failed to retrieve obscurity summary.' });
    }
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      if (body.length > MAX_PAYLOAD_BYTES) {
        res.status(413).json({ error: 'Payload too large.' });
        return;
      }
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Malformed JSON payload.' });
        return;
      }
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Missing submission payload in request body.' });
      return;
    }

    const { puzzleId, cellId, brawlerId, submittedAt, playerId } = body;

    if (!puzzleId || !cellId || brawlerId === undefined) {
      res.status(400).json({
        error: 'Missing required fields: puzzleId, cellId, and brawlerId are mandatory.',
      });
      return;
    }

    const numBrawlerId = Number(brawlerId);
    if (Number.isNaN(numBrawlerId) || !Number.isInteger(numBrawlerId)) {
      res.status(400).json({ error: 'Invalid "brawlerId". Expected integer.' });
      return;
    }

    // Server-authoritative category and validity check
    const validation = validateCellSubmission(String(puzzleId), String(cellId), numBrawlerId);
    if (validation.valid === false) {
      res.status(422).json({ error: validation.error });
      return;
    }

    const safePlayerId = sanitizePlayerId(playerId);

    try {
      const { cellStats, alreadySubmitted } = await store.recordSubmission({
        puzzleId: String(puzzleId),
        cellId: cellId as CellIdentifier,
        brawlerId: numBrawlerId,
        playerId: safePlayerId,
        submittedAt: typeof submittedAt === 'string' ? submittedAt : new Date().toISOString(),
      });

      const obscurity = calculateObscurityFromStats(cellStats, numBrawlerId);

      res.status(alreadySubmitted ? 200 : 201).json({
        cellStats,
        obscurity,
        alreadySubmitted,
      });
    } catch (err) {
      console.error('[Obscurity POST Error]:', err);
      res.status(500).json({ error: 'Failed to record obscurity submission.' });
    }
    return;
  }
}
