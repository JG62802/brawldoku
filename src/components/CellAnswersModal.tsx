import React from 'react';
import { CellObscurityStats } from '../types/game';
import { CATEGORY_BY_ID, getMatchingBrawlers } from '../engine/categories';
import { calculateObscurityFromStats } from '../services/obscurityService';
import { getRarityTierForPercentage } from '../engine/rarityScoring';
import { BrawlerAvatar } from './BrawlerAvatar';
import { Modal } from './Modal';

interface CellAnswersModalProps {
  rowCategoryId: string;
  colCategoryId: string;
  pickedBrawlerId: number | null;
  cellStats: CellObscurityStats | null;
  onClose: () => void;
}

/** Every valid answer for one cell, with real obscurity percentages where player data exists. */
export const CellAnswersModal: React.FC<CellAnswersModalProps> = ({
  rowCategoryId,
  colCategoryId,
  pickedBrawlerId,
  cellStats,
  onClose,
}) => {
  const rowCat = CATEGORY_BY_ID[rowCategoryId];
  const colCat = CATEGORY_BY_ID[colCategoryId];
  const validBrawlers = getMatchingBrawlers(rowCat, colCat).sort((a, b) => a.name.localeCompare(b.name));
  const hasSubmissionData = Boolean(cellStats && cellStats.totalValidSubmissions > 0);

  return (
    <Modal
      title={`${rowCat.label} × ${colCat.label}`}
      subtitle={
        <>
          {validBrawlers.length} valid brawler{validBrawlers.length === 1 ? '' : 's'}
          <span className="mx-1.5">·</span>
          {hasSubmissionData
            ? `${cellStats!.totalValidSubmissions} player submission${cellStats!.totalValidSubmissions === 1 ? '' : 's'}`
            : 'No player statistics yet'}
        </>
      }
      onClose={onClose}
    >
      <div className="mb-2.5 flex items-center justify-between px-2">
        <span className="caption">Brawler</span>
        <span className="caption">Picked by</span>
      </div>
      <ul className="space-y-1.5">
        {validBrawlers.map((brawler) => {
          const isPicked = brawler.id === pickedBrawlerId;
          const obscurity = calculateObscurityFromStats(cellStats, brawler.id);
          const tier = getRarityTierForPercentage(obscurity.percentage);
          return (
            <li
              key={brawler.id}
              className={`flex items-center gap-3 rounded-xl border-2 border-brawl-navy px-3 py-2 shadow-brawl-xs ${
                isPicked ? 'bg-brawl-green-pale ring-2 ring-inset ring-brawl-green' : 'bg-white'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brawl-navy bg-brawl-blue-sky p-1">
                <BrawlerAvatar brawler={brawler} size="cell" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base uppercase tracking-[0.02em] text-brawl-navy">
                  {brawler.name}
                </span>
                {isPicked && (
                  <span className="inline-block rounded border border-brawl-navy bg-brawl-green px-1.5 py-0.5 font-display text-[10px] uppercase tracking-wider text-white">
                    Your Pick
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {tier && (
                  <span
                    className={`rounded-lg border px-2 py-0.5 font-display text-[11px] sm:text-xs uppercase tracking-wide ${tier.badgeBg} ${tier.textColor} ${tier.borderColor}`}
                    title={`${tier.name}: +${tier.points} pts`}
                  >
                    {tier.name} · +{tier.points}
                  </span>
                )}
                <span
                  className={`rounded-lg border-2 border-brawl-navy px-2.5 py-1 font-display text-sm tabular ${
                    obscurity.status === 'available'
                      ? 'bg-brawl-navy text-brawl-yellow'
                      : 'bg-brawl-blue-sky text-brawl-navy/65'
                  }`}
                  title={obscurity.status === 'available' ? 'Share of valid submissions for this cell' : 'No player statistics yet'}
                >
                  {obscurity.status === 'available' && obscurity.percentage !== null ? `${obscurity.percentage}%` : 'N/A'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};
