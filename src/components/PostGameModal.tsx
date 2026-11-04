import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { DailyGameState } from '../types/game';
import { buildPostGameShareText } from '../engine/gameEngine';
import { BRAWLER_BY_ID } from '../data/brawlers';
import { BrawlerAvatar } from './BrawlerAvatar';
import { ObscurityValue } from './PuzzleGrid';
import { Modal } from './Modal';

interface PostGameModalProps {
  gameState: DailyGameState;
  onClose: () => void;
  onInspectCell: (row: number, col: number) => void;
}

export const PostGameModal: React.FC<PostGameModalProps> = ({ gameState, onClose, onInspectCell }) => {
  const [copied, setCopied] = useState(false);

  const filledCells = gameState.cells.flat().filter((c) => c.brawlerId !== null).length;
  const attempts = gameState.guessHistory.length;
  const accuracy = attempts > 0 ? `${Math.round((filledCells / attempts) * 100)}%` : '—';
  const siteUrl = window.location.origin + window.location.pathname;
  const fullSharePayload = buildPostGameShareText(gameState, siteUrl);

  const handleShareScore = async () => {
    const shareData = {
      title: `Brawldoku #${gameState.puzzleNumber}`,
      text: fullSharePayload,
      url: siteUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(fullSharePayload);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullSharePayload;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const title =
    gameState.status === 'won' ? 'Victory! Grid Complete' : gameState.status === 'game_over' ? 'Run Complete' : 'Your Progress';

  return (
    <Modal
      title={title}
      subtitle={`Brawldoku No. ${gameState.puzzleNumber}`}
      onClose={onClose}
      footer={(close) => (
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button type="button" onClick={handleShareScore} className="btn-primary h-12 flex-1 text-base">
            {copied ? <Check className="h-5 w-5 stroke-[3]" /> : <Share2 className="h-5 w-5 stroke-[2.5]" />}
            {copied ? 'Copied Score & Link!' : 'Share Score'}
          </button>
          <button
            type="button"
            onClick={close}
            className="btn-secondary h-12 text-base sm:w-auto"
          >
            Close
          </button>
        </div>
      )}
    >
      <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border-[3px] border-brawl-navy bg-brawl-navy gap-[2.5px] shadow-brawl-sm">
        {[
          { label: 'Final Score', value: String(gameState.score), bg: 'bg-brawl-yellow' },
          { label: 'Solved', value: `${filledCells}/9`, bg: 'bg-white' },
          { label: 'Accuracy', value: accuracy, bg: 'bg-white' },
        ].map((item) => (
          <div key={item.label} className={`px-2 py-3 text-center ${item.bg}`}>
            <dt className="font-display text-[11px] uppercase tracking-wider text-brawl-navy/75">{item.label}</dt>
            <dd className="mt-1 font-display text-2xl sm:text-3xl leading-none text-brawl-navy tabular">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="caption">Your Grid</h3>
          <span className="text-xs font-extrabold text-brawl-navy/70">Tap a cell to inspect answers</span>
        </div>
        <div className="mx-auto mt-3 grid max-w-[300px] grid-cols-3 gap-2">
          {gameState.cells.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const brawler = cell.brawlerId !== null ? BRAWLER_BY_ID[cell.brawlerId] : null;
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  onClick={() => {
                    onClose();
                    onInspectCell(rIdx, cIdx);
                  }}
                  aria-label={brawler ? `${brawler.name}, inspect answers` : 'Unsolved, inspect answers'}
                  className={`flex aspect-square flex-col rounded-xl border-[2.5px] border-brawl-navy p-1.5 shadow-brawl-xs transition-colors overflow-hidden ${
                    brawler
                      ? 'bg-brawl-green-pale ring-2 ring-inset ring-brawl-green hover:bg-[#bbf7d0]'
                      : 'bg-brawl-blue-sky hover:bg-brawl-yellow-pale'
                  }`}
                >
                  {brawler ? (
                    <>
                      <div className="relative flex min-h-0 flex-1 w-full items-center justify-center p-0.5">
                        <BrawlerAvatar brawler={brawler} size="cell" />
                        <div className="absolute top-0 right-0 z-10 pointer-events-none">
                          <ObscurityValue cell={cell} />
                        </div>
                      </div>
                      <div className="mt-1 w-full text-center leading-tight">
                        <span className="block truncate font-display text-[9px] sm:text-[11px] uppercase tracking-[0.02em] text-brawl-navy">
                          {brawler.name}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="m-auto font-display text-sm text-brawl-navy/50">—</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
