import React, { useState } from 'react';
import { Check, HelpCircle, Share2 } from 'lucide-react';
import { DailyGameState } from '../types/game';

interface HeaderHUDProps {
  gameState: DailyGameState;
  onOpenHelp: () => void;
  onOpenGlossary?: () => void;
}

function formatPuzzleDate(dateStr: string): string | null {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Brawl Stars-inspired color-blocked header bar: expressive wordmark + date on the left, flat navigation controls on the right. */
export const HeaderHUD: React.FC<HeaderHUDProps> = ({ gameState, onOpenHelp }) => {
  const [copiedSite, setCopiedSite] = useState(false);
  const dateLabel = formatPuzzleDate(gameState.puzzleDate);

  const handleShareWebsite = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Brawldoku — Daily Brawl Stars Grid Puzzle',
      text: 'Play Brawldoku, the daily Brawl Stars grid puzzle!',
      url: shareUrl,
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
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedSite(true);
    setTimeout(() => setCopiedSite(false), 2500);
  };

  return (
    <header className="w-full bg-brawl-blue text-white">
      <div className="flex h-16 sm:h-[70px] w-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-start self-start pt-2 sm:pt-2.5">
          <div>
            <div className="font-display text-2xl sm:text-[30px] uppercase leading-none tracking-[0.02em] text-outline">
              <span className="text-white">BRAWL</span>
              <span className="text-brawl-yellow">DOKU</span>
            </div>
            {dateLabel && (
              <div className="mt-0.5 truncate text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-white/85">
                {dateLabel}
              </div>
            )}
          </div>
        </div>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex h-9 items-center justify-center gap-2 border-0 bg-transparent px-2.5 sm:px-3.5 font-display text-[13px] uppercase tracking-[0.03em] text-white shadow-none transition-opacity duration-100 hover:opacity-80 select-none"
            aria-label="How to play"
          >
            <HelpCircle className="h-4 w-4 stroke-[2.5] text-white" />
            <span className="hidden sm:inline">How to play</span>
          </button>
          <button
            type="button"
            onClick={handleShareWebsite}
            className="inline-flex h-9 items-center justify-center gap-2 border-0 bg-transparent px-2.5 sm:px-3.5 font-display text-[13px] uppercase tracking-[0.03em] text-white shadow-none transition-opacity duration-100 hover:opacity-80 select-none"
            aria-label="Share website"
          >
            {copiedSite ? (
              <Check className="h-4 w-4 stroke-[3] text-white" />
            ) : (
              <Share2 className="h-4 w-4 stroke-[2.5] text-white" />
            )}
            <span>{copiedSite ? 'Copied!' : 'Share'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

/** Four-column statistics strip rendered directly on the page background without enclosing cards, borders, or shadows. */
export const Scoreboard: React.FC<{ gameState: DailyGameState }> = ({ gameState }) => {
  const filled = gameState.cells.flat().filter((c) => c.brawlerId !== null).length;
  const attempts = gameState.guessHistory.length;
  const accuracy = attempts > 0 ? `${Math.round((filled / attempts) * 100)}%` : '—';
  const lowGuesses = gameState.status === 'playing' && gameState.guessesRemaining <= 2;

  const items: { label: string; value: React.ReactNode; valueColor: string }[] = [
    {
      label: 'Score',
      value: gameState.score,
      valueColor: 'text-brawl-navy',
    },
    {
      label: 'Guesses left',
      value: (
        <>
          {gameState.guessesRemaining}
          <span className="text-brawl-navy/50 text-base sm:text-lg">/{gameState.maxGuesses}</span>
        </>
      ),
      valueColor: lowGuesses ? 'text-brawl-red' : 'text-brawl-navy',
    },
    {
      label: 'Solved',
      value: (
        <>
          {filled}
          <span className="text-brawl-navy/50 text-base sm:text-lg">/9</span>
        </>
      ),
      valueColor: filled === 9 ? 'text-brawl-green-dark' : 'text-brawl-navy',
    },
    {
      label: 'Accuracy',
      value: accuracy,
      valueColor: 'text-brawl-navy',
    },
  ];

  return (
    <dl className="mx-auto my-0 flex w-fit max-w-full items-center justify-center gap-5 py-2 sm:gap-10 sm:py-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex shrink-0 flex-col items-center justify-center text-center"
        >
          <dt className="text-center font-display text-[10px] sm:text-[12px] uppercase leading-tight tracking-[0.05em] text-brawl-navy/75 whitespace-nowrap">
            {item.label}
          </dt>
          <dd
            className={`m-0 mt-1 flex items-baseline justify-center text-center font-display text-xl sm:text-2xl leading-none tabular ${item.valueColor}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
