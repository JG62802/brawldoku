import React, { useRef, useState } from 'react';
import { DailyGameState, CategoryDefinition, CellState, RarityTierName } from '../types/game';
import { CATEGORY_BY_ID } from '../engine/categories';
import { BRAWLER_BY_ID } from '../data/brawlers';
import {
  FALLBACK_CELL_POINTS,
  getRarityTierForPercentage,
  TIER_BADGE_STYLES,
} from '../engine/rarityScoring';
import { BrawlerAvatar } from './BrawlerAvatar';

interface PuzzleGridProps {
  gameState: DailyGameState;
  activeCell: { row: number; col: number } | null;
  wrongCellFlash: { row: number; col: number } | null;
  onSelectCell: (row: number, col: number) => void;
  onInspectCellAnswers: (row: number, col: number) => void;
}

/** Real obscurity percentage with Brawl Stars rarity tier badge, or loading/fallback status without overcrowding. */
export function ObscurityValue({ cell }: { cell: CellState }) {
  if (cell.obscurityStatus === 'loading') {
    return (
      <span
        className="inline-flex items-center rounded-full border border-brawl-navy bg-brawl-navy px-1.5 py-0.5 font-display text-[9px] sm:text-[10px] leading-none text-white tabular shadow-brawl-xs"
        title="Loading player statistics"
      >
        …
      </span>
    );
  }
  if (cell.obscurityStatus === 'available' && cell.obscurityPercent !== null) {
    const tier = getRarityTierForPercentage(cell.obscurityPercent);
    const tierName: RarityTierName = tier?.name ?? 'Common';
    const points = cell.pointsEarned || (tier ? tier.points : FALLBACK_CELL_POINTS);
    const style = TIER_BADGE_STYLES[tierName];

    return (
      <span
        className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-full border ${style.border} ${style.bg} px-1.5 py-0.5 font-display text-[9px] sm:text-[10px] leading-none ${style.text} tabular shadow-brawl-xs`}
        title={`${tierName} tier: +${points} pts (${cell.obscurityPercent}% of players chose this)`}
      >
        <span className="hidden sm:inline uppercase text-[9px] font-black tracking-tight">{tierName}</span>
        <span className="sm:hidden uppercase text-[8px] font-black">{tierName.slice(0, 3)}</span>
        <span className="font-bold">+{points}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-brawl-navy bg-white/95 px-1.5 py-0.5 font-display text-[9px] sm:text-[10px] leading-none text-brawl-navy/70 tabular shadow-brawl-xs"
      title="Player statistics unavailable (+100 pts fallback)"
    >
      <span>+100</span>
    </span>
  );
}

const CategoryLabel: React.FC<{
  category: CategoryDefinition;
  highlighted: boolean;
  open: boolean;
  align: 'center' | 'right';
  onClick: () => void;
}> = ({ category, open, align, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    title={category.description}
    className={`w-full bg-transparent border-0 px-1 py-1.5 sm:px-2 sm:py-2 font-display text-[10px] sm:text-[13px] uppercase leading-tight tracking-[0.02em] text-brawl-navy transition-opacity duration-100 hover:opacity-80 category-label select-none ${
      align === 'right' ? 'text-right' : 'text-center'
    } ${open ? 'underline decoration-2 underline-offset-4' : ''}`}
  >
    <span className="sm:hidden">{category.shortLabel}</span>
    <span className="hidden sm:inline">{category.label}</span>
  </button>
);

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({
  gameState,
  activeCell,
  wrongCellFlash,
  onSelectCell,
  onInspectCellAnswers,
}) => {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [infoCategory, setInfoCategory] = useState<CategoryDefinition | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const rowCategories = gameState.rowCategoryIds.map((id) => CATEGORY_BY_ID[id]);
  const colCategories = gameState.colCategoryIds.map((id) => CATEGORY_BY_ID[id]);
  const isFinished = gameState.status !== 'playing';
  const pointer = focusedCell ?? activeCell;

  const toggleInfo = (cat: CategoryDefinition) => setInfoCategory((prev) => (prev?.id === cat.id ? null : cat));

  const handleArrowKeys = (e: React.KeyboardEvent, row: number, col: number) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const r = Math.min(2, Math.max(0, row + move[0]));
    const c = Math.min(2, Math.max(0, col + move[1]));
    cellRefs.current[r * 3 + c]?.focus();
  };

  return (
    <div className="mx-auto w-full">
      {/*
        Symmetric 5-column grid:
        Col 1 (left category track) and Col 5 (right balancing track) have identical track definitions
        so the 3×3 puzzle cells in Cols 2–4 remain horizontally centered at 50% of the container.
      */}
      <div className="grid grid-cols-[minmax(60px,0.64fr)_repeat(3,minmax(0,1fr))_minmax(60px,0.64fr)] sm:grid-cols-[minmax(84px,0.7fr)_repeat(3,minmax(0,1fr))_minmax(84px,0.7fr)] gap-1.5 sm:gap-3 items-center">
        {/* Column headers row */}
        <div aria-hidden="true" />
        {colCategories.map((cat, colIdx) => (
          <div key={cat.id} className="flex items-end justify-center self-stretch">
            <CategoryLabel
              category={cat}
              align="center"
              highlighted={pointer?.col === colIdx}
              open={infoCategory?.id === cat.id}
              onClick={() => toggleInfo(cat)}
            />
          </div>
        ))}
        <div aria-hidden="true" />

        {/* 3 playable rows: left row category + 3 cells + right balancing spacer */}
        {rowCategories.map((rowCat, rowIdx) => (
          <React.Fragment key={rowCat.id}>
            <div className="flex items-center justify-end pr-0.5 sm:pr-1">
              <CategoryLabel
                category={rowCat}
                align="right"
                highlighted={pointer?.row === rowIdx}
                open={infoCategory?.id === rowCat.id}
                onClick={() => toggleInfo(rowCat)}
              />
            </div>

            {[0, 1, 2].map((colIdx) => {
              const cell = gameState.cells[rowIdx][colIdx];
              const brawler = cell.brawlerId !== null ? BRAWLER_BY_ID[cell.brawlerId] : null;
              const isSelected = activeCell?.row === rowIdx && activeCell?.col === colIdx;
              const isWrong = wrongCellFlash?.row === rowIdx && wrongCellFlash?.col === colIdx;

              const stateClass = isWrong
                ? 'bg-brawl-red-pale ring-[3px] ring-inset ring-brawl-red'
                : brawler
                ? 'bg-brawl-green-pale ring-[3px] ring-inset ring-brawl-green hover:bg-[#bbf7d0]'
                : isSelected
                ? 'bg-brawl-yellow-pale ring-[3px] ring-inset ring-brawl-yellow'
                : isFinished
                ? 'bg-white/85 hover:bg-brawl-yellow-pale'
                : 'bg-white hover:bg-brawl-yellow-pale has-[:active]:translate-y-[2px] has-[:active]:shadow-none';

              const accessibleLabel = brawler
                ? `${rowCat.label} and ${colCategories[colIdx].label}, solved with ${brawler.name}. Inspect valid answers`
                : isFinished
                ? `${rowCat.label} and ${colCategories[colIdx].label}, view ${cell.validCount} possible answers`
                : `Select brawler for ${rowCat.label} and ${colCategories[colIdx].label}`;

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`group relative flex aspect-square min-w-0 flex-col overflow-hidden rounded-2xl border-[2.5px] sm:border-[3px] border-brawl-navy p-1.5 sm:p-2.5 text-left shadow-brawl-sm transition-all duration-100 ${stateClass} ${
                    isWrong ? 'motion-safe:animate-[shake_320ms_ease-in-out]' : ''
                  }`}
                >
                  {/* Full-cell invisible interactive button covering 100% of the cell */}
                  <button
                    ref={(el) => {
                      cellRefs.current[rowIdx * 3 + colIdx] = el;
                    }}
                    type="button"
                    onMouseEnter={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                    onMouseLeave={() => setFocusedCell(null)}
                    onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                    onBlur={() => setFocusedCell(null)}
                    onKeyDown={(e) => handleArrowKeys(e, rowIdx, colIdx)}
                    onClick={() => {
                      if (brawler || isFinished) onInspectCellAnswers(rowIdx, colIdx);
                      else onSelectCell(rowIdx, colIdx);
                    }}
                    aria-label={accessibleLabel}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-brawl-yellow"
                  >
                    <span className="sr-only">{accessibleLabel}</span>
                  </button>

                  {brawler ? (
                    <>
                      <div className="pointer-events-none flex justify-center leading-none">
                        <ObscurityValue cell={cell} />
                      </div>
                      <div className="pointer-events-none flex min-h-0 flex-1 w-full items-center justify-center p-0.5">
                        <BrawlerAvatar brawler={brawler} size="cell" className="max-h-[92%] max-w-[92%]" />
                      </div>
                      <div className="pointer-events-none mt-0.5 w-full text-center leading-tight">
                        <span className="block truncate font-display text-[12px] sm:text-[14px] uppercase tracking-[0.02em] text-brawl-navy">
                          {brawler.name}
                        </span>
                      </div>
                    </>
                  ) : isFinished ? (
                    <span className="pointer-events-none m-auto text-center">
                      <span className="block font-display text-lg sm:text-xl leading-none text-brawl-blue tabular">
                        {cell.validCount}
                      </span>
                      <span className="mt-0.5 block font-display text-[10px] sm:text-[11px] uppercase tracking-wider text-brawl-navy/70">
                        possible
                      </span>
                    </span>
                  ) : null}
                </div>
              );
            })}

            <div aria-hidden="true" />
          </React.Fragment>
        ))}

        {/* Category definition banner aligned directly beneath the centered 3×3 cells (Cols 2–4) */}
        <div aria-hidden="true" />
        <div className="col-span-3 mt-2 min-h-[44px]">
          {infoCategory ? (
            <div className="rounded-xl border-[2.5px] border-brawl-navy bg-white px-3.5 py-2.5 text-center text-[13px] sm:text-[14px] font-bold text-brawl-navy shadow-brawl-xs animate-fade-in category-label">
              <span className="mr-1.5 inline-block rounded border border-brawl-navy bg-brawl-yellow px-1.5 py-0.5 font-display text-[11px] uppercase tracking-wide text-brawl-navy category-label">
                {infoCategory.label}
              </span>
              <span className="category-label">{infoCategory.description}</span>
            </div>
          ) : (
            <p className="px-1 py-2 text-center font-display text-[12px] sm:text-[13px] uppercase tracking-[0.04em] text-brawl-navy/70 category-label">
              Tap any category header to view its rule
            </p>
          )}
        </div>
        <div aria-hidden="true" />
      </div>
    </div>
  );
};
