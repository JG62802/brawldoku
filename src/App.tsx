import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DailyGameState, CellObscurityStats, CellIdentifier } from './types/game';
import { getTodayDateString } from './engine/puzzleGenerator';
import {
  createInitialGameState,
  reconcileSavedGameState,
  submitGuess,
  giveUpGame,
  getUsedBrawlerIds,
  updateCellObscurity,
} from './engine/gameEngine';
import { CATEGORY_BY_ID } from './engine/categories';
import {
  fetchPuzzleObscuritySummary,
  recordValidCellSubmission,
  calculateObscurityFromStats,
  formatCellId,
} from './services/obscurityService';
import { HeaderHUD, Scoreboard } from './components/HeaderHUD';
import { PuzzleGrid } from './components/PuzzleGrid';
import { BrawlerSearchModal } from './components/BrawlerSearchModal';
import { PostGameModal } from './components/PostGameModal';
import { CellAnswersModal } from './components/CellAnswersModal';
import { HowToPlayModal, CategoryGlossaryModal } from './components/InfoModals';
import { Analytics } from '@vercel/analytics/react';

const STORAGE_PREFIX = 'brawldoku_daily_v5_';
const DONT_SHOW_TUTORIAL_KEY = 'brawldoku_dont_show_tutorial_v2';

function shouldShowTutorialOnLoad(): boolean {
  try {
    return localStorage.getItem(DONT_SHOW_TUTORIAL_KEY) !== '1';
  } catch {
    return true;
  }
}

function purgeLegacyStorageKeys(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith('brawldoku_') &&
        !key.startsWith(STORAGE_PREFIX) &&
        key !== DONT_SHOW_TUTORIAL_KEY
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

function loadOrCreateDailyState(dateStr: string): DailyGameState {
  purgeLegacyStorageKeys();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateStr}`);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      return reconcileSavedGameState(parsed, dateStr);
    }
  } catch {
    // Ignore storage read errors
  }
  return createInitialGameState(dateStr);
}

export const App: React.FC = () => {
  const todayStr = getTodayDateString();
  const [gameState, setGameState] = useState<DailyGameState>(() =>
    loadOrCreateDailyState(todayStr)
  );
  const [obscurityCells, setObscurityCells] = useState<
    Record<CellIdentifier, CellObscurityStats>
  >({} as Record<CellIdentifier, CellObscurityStats>);

  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const activeCellLockRef = useRef<{ row: number; col: number } | null>(null);
  const [inspectCell, setInspectCell] = useState<{ row: number; col: number } | null>(null);
  const [wrongCellFlash, setWrongCellFlash] = useState<{ row: number; col: number } | null>(
    null
  );

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Show How to Play automatically on website load unless the player selected "Don't show again"
  const [showHelpModal, setShowHelpModal] = useState(() => shouldShowTutorialOnLoad());

  // Enforce fresh game reset if v5 storage key does not exist yet (handles Vite HMR state preservation)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('reset')) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${todayStr}`);
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        // Ignore
      }
      setGameState(createInitialGameState(todayStr));
      return;
    }

    const raw = localStorage.getItem(`${STORAGE_PREFIX}${todayStr}`);
    if (!raw) {
      setGameState(createInitialGameState(todayStr));
    }
  }, [todayStr]);

  const handleDontShowTutorialAgain = () => {
    try {
      localStorage.setItem(DONT_SHOW_TUTORIAL_KEY, '1');
    } catch {
      // Ignore storage write errors
    }
    setShowHelpModal(false);
  };
  const handleCloseHelpModal = () => {
    setShowHelpModal(false);
  };
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  const [showPostGameModal, setShowPostGameModal] = useState(false);

  // Fetch aggregated obscurity statistics for the active puzzle
  useEffect(() => {
    let cancelled = false;
    fetchPuzzleObscuritySummary(gameState.puzzleDate).then((summary) => {
      if (cancelled) return;
      setObscurityCells(summary.cells);

      setGameState((prev) => {
        if (prev.puzzleDate !== summary.puzzleId) return prev;
        let next = prev;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = next.cells[r][c];
            if (cell.brawlerId !== null) {
              if (summary.source === 'unavailable') {
                next = updateCellObscurity(next, r, c, null, 'unavailable');
              } else {
                const cellId = formatCellId(r, c);
                const cellStats = summary.cells[cellId];
                const calc = calculateObscurityFromStats(cellStats, cell.brawlerId);
                next = updateCellObscurity(next, r, c, calc.percentage, calc.status);
              }
            }
          }
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [gameState.puzzleDate]);

  // Save daily puzzle state to localStorage
  useEffect(() => {
    if (gameState.puzzleDate === todayStr) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${todayStr}`, JSON.stringify(gameState));
      } catch {
        // Ignore storage write errors
      }
    }
  }, [gameState, todayStr]);

  const handleSelectCell = (row: number, col: number) => {
    if (gameState.status !== 'playing') {
      setInspectCell({ row, col });
      return;
    }
    if (gameState.cells[row][col].brawlerId !== null) {
      setInspectCell({ row, col });
      return;
    }
    activeCellLockRef.current = { row, col };
    setActiveCell({ row, col });
  };

  const handleCloseSearchModal = useCallback(() => {
    activeCellLockRef.current = null;
    setActiveCell(null);
  }, []);

  const handleSelectBrawler = (brawlerId: number) => {
    const targetCell = activeCellLockRef.current ?? activeCell;
    if (!targetCell) return;
    // Immediately clear the lock so duplicate events in the same tick cannot consume an extra guess
    activeCellLockRef.current = null;
    const { row, col } = targetCell;

    const cellId = formatCellId(row, col);
    const existingStats = obscurityCells[cellId];
    const precalc = calculateObscurityFromStats(existingStats, brawlerId);
    const knownPercent = precalc.status === 'available' ? precalc.percentage : null;

    const result = submitGuess(gameState, row, col, brawlerId, knownPercent);
    setGameState(result.nextState);
    setActiveCell(null);

    const rowCatId = gameState.rowCategoryIds[row];
    const colCatId = gameState.colCategoryIds[col];
    const rowLabel = CATEGORY_BY_ID[rowCatId].label;
    const colLabel = CATEGORY_BY_ID[colCatId].label;

    if (result.correct && result.brawler) {
      const tierName = result.nextState.cells[row][col].rarityTier;
      const tierBadge = tierName ? ` (${tierName})` : '';
      setFeedbackBanner({
        type: 'success',
        message: `+${result.pointsDelta} PTS${tierBadge} — ${result.brawler.name} fits ${rowLabel} × ${colLabel}`,
      });

      recordValidCellSubmission(
        {
          puzzleId: gameState.puzzleDate,
          cellId,
          brawlerId: result.brawler.id,
          submittedAt: new Date().toISOString(),
        },
        rowCatId,
        colCatId
      ).then(({ cellStats, obscurity }) => {
        if (cellStats) {
          setObscurityCells((prev) => ({
            ...prev,
            [cellId]: cellStats,
          }));
        }
        setGameState((prev) => {
          if (prev.puzzleDate !== gameState.puzzleDate) return prev;
          return updateCellObscurity(prev, row, col, obscurity.percentage, obscurity.status);
        });
      });
    } else if (result.brawler) {
      setWrongCellFlash({ row, col });
      setTimeout(() => setWrongCellFlash(null), 900);
      setFeedbackBanner({
        type: 'error',
        message: `Incorrect — ${result.brawler.name} does not fit ${rowLabel} × ${colLabel}`,
      });
    } else if (result.error) {
      setFeedbackBanner({
        type: 'error',
        message: result.error,
      });
    }

    if (result.nextState.status !== 'playing') {
      setShowPostGameModal(true);
    }
  };

  const handleGiveUp = () => {
    const next = giveUpGame(gameState);
    setGameState(next);
    setShowPostGameModal(true);
  };

  const usedBrawlerIds = useMemo(() => getUsedBrawlerIds(gameState), [gameState]);

  return (
    <div className="flex min-h-screen flex-col bg-brawl-blue-sky text-brawl-navy">
      <HeaderHUD
        gameState={gameState}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenGlossary={() => setShowGlossaryModal(true)}
      />

      <main className="mx-auto w-full max-w-[740px] flex-1 px-2.5 pb-12 pt-5 sm:px-6 sm:pt-7">
        <Scoreboard gameState={gameState} />

        <div className="mt-5 sm:mt-7">
          <PuzzleGrid
            gameState={gameState}
            activeCell={activeCell}
            wrongCellFlash={wrongCellFlash}
            onSelectCell={handleSelectCell}
            onInspectCellAnswers={(r, c) => setInspectCell({ row: r, col: c })}
          />
        </div>

        <div aria-live="polite" className="mt-2 flex min-h-[32px] items-center justify-center">
          {feedbackBanner && (
            <span
              className={`inline-flex items-center rounded-xl border-2 border-brawl-navy px-3.5 py-1 font-display text-xs sm:text-sm uppercase tracking-wide text-white shadow-brawl-xs ${
                feedbackBanner.type === 'success' ? 'bg-brawl-green' : 'bg-brawl-red'
              }`}
            >
              {feedbackBanner.message}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
          {gameState.status === 'playing' ? (
            <button type="button" onClick={handleGiveUp} className="btn-secondary">
              Give up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPostGameModal(true)}
              className="btn-primary"
            >
              View Results
            </button>
          )}
        </div>
      </main>

      <footer className="border-t-[3px] border-brawl-navy bg-brawl-navy text-white">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center text-xs font-extrabold tracking-wide text-white/80 sm:px-6">
          Brawldoku is a fan-made puzzle and is not affiliated with Supercell.
        </div>
      </footer>

      {/* Brawler Search Modal */}
      {activeCell && (
        <BrawlerSearchModal
          row={activeCell.row}
          col={activeCell.col}
          rowCategoryId={gameState.rowCategoryIds[activeCell.row]}
          colCategoryId={gameState.colCategoryIds[activeCell.col]}
          usedBrawlerIds={usedBrawlerIds}
          guessesRemaining={gameState.guessesRemaining}
          onSelectBrawler={handleSelectBrawler}
          onClose={handleCloseSearchModal}
        />
      )}

      {/* Cell Valid Answers Inspector Modal */}
      {inspectCell && (
        <CellAnswersModal
          rowCategoryId={gameState.rowCategoryIds[inspectCell.row]}
          colCategoryId={gameState.colCategoryIds[inspectCell.col]}
          pickedBrawlerId={
            gameState.cells[inspectCell.row][inspectCell.col].brawlerId
          }
          cellStats={
            obscurityCells[formatCellId(inspectCell.row, inspectCell.col)] ?? null
          }
          onClose={() => setInspectCell(null)}
        />
      )}

      {/* Post-Game Summary & Share Modal */}
      {showPostGameModal && (
        <PostGameModal
          gameState={gameState}
          onClose={() => setShowPostGameModal(false)}
          onInspectCell={(r, c) => setInspectCell({ row: r, col: c })}
        />
      )}

      {/* How to Play Modal */}
      {showHelpModal && (
        <HowToPlayModal
          onClose={handleCloseHelpModal}
          onDontShowAgain={handleDontShowTutorialAgain}
        />
      )}

      {/* Category Glossary Modal */}
      {showGlossaryModal && (
        <CategoryGlossaryModal onClose={() => setShowGlossaryModal(false)} />
      )}

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
};

export default App;
