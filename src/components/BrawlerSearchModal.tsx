import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { BRAWLERS } from '../data/brawlers';
import { CATEGORY_BY_ID } from '../engine/categories';
import { BrawlerAvatar } from './BrawlerAvatar';
import { Modal } from './Modal';

interface BrawlerSearchModalProps {
  row: number;
  col: number;
  rowCategoryId: string;
  colCategoryId: string;
  usedBrawlerIds: Set<number>;
  guessesRemaining: number;
  onSelectBrawler: (brawlerId: number) => void;
  onClose: () => void;
}

export const BrawlerSearchModal: React.FC<BrawlerSearchModalProps> = ({
  rowCategoryId,
  colCategoryId,
  usedBrawlerIds,
  guessesRemaining,
  onSelectBrawler,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const submittedRef = useRef(false);

  const rowCat = CATEGORY_BY_ID[rowCategoryId];
  const colCat = CATEGORY_BY_ID[colCategoryId];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredBrawlers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...BRAWLERS].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((b) => b.name.toLowerCase().includes(q) || b.slug.includes(q));
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.children[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const handleChooseBrawler = (brawlerId: number) => {
    if (submittedRef.current || usedBrawlerIds.has(brawlerId)) return;
    submittedRef.current = true;
    onSelectBrawler(brawlerId);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (filteredBrawlers.length > 0 ? (prev + 1) % filteredBrawlers.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredBrawlers.length > 0 ? (prev - 1 + filteredBrawlers.length) % filteredBrawlers.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredBrawlers[highlightedIndex];
      if (target && !usedBrawlerIds.has(target.id)) {
        handleChooseBrawler(target.id);
      }
    }
  };

  return (
    <Modal
      title="Choose a Brawler"
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-1.5 category-label">
          <span className="rounded border border-brawl-navy bg-brawl-yellow px-1.5 py-0.5 font-display text-[11px] uppercase tracking-wide text-brawl-navy category-label">
            {rowCat.label}
          </span>
          <span className="font-display text-white">×</span>
          <span className="rounded border border-brawl-navy bg-brawl-yellow px-1.5 py-0.5 font-display text-[11px] uppercase tracking-wide text-brawl-navy category-label">
            {colCat.label}
          </span>
          <span className="mx-1">·</span>
          <span className="font-display uppercase tracking-wide text-white category-label">
            {guessesRemaining} {guessesRemaining === 1 ? 'guess' : 'guesses'} left
          </span>
        </span>
      }
      onClose={onClose}
      align="top"
    >
      <div>
        <label className="flex h-12 items-center gap-2.5 rounded-xl border-[2.5px] border-brawl-navy bg-brawl-blue-sky px-3.5 shadow-brawl-xs transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-brawl-yellow">
          <Search className="h-5 w-5 shrink-0 stroke-[2.5] text-brawl-navy" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search brawlers..."
            aria-label="Search brawlers"
            role="combobox"
            aria-expanded="true"
            aria-controls="brawler-results"
            className="min-w-0 flex-1 bg-transparent font-extrabold text-[15px] text-brawl-navy placeholder:text-brawl-navy/50 outline-none focus-visible:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="rounded-lg p-1 text-brawl-navy/60 hover:bg-brawl-navy/10 hover:text-brawl-navy"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </label>

        {filteredBrawlers.length === 0 ? (
          <p className="py-10 text-center font-display text-base uppercase tracking-wide text-brawl-navy/60">
            No brawlers match “{query}”.
          </p>
        ) : (
          <ul id="brawler-results" ref={listRef} role="listbox" className="mt-3 max-h-[50dvh] space-y-1.5 overflow-y-auto pr-0.5">
            {filteredBrawlers.map((brawler, idx) => {
              const isUsed = usedBrawlerIds.has(brawler.id);
              const isHighlighted = idx === highlightedIndex;
              return (
                <li key={brawler.id} role="option" aria-selected={isHighlighted} aria-disabled={isUsed}>
                  <button
                    type="button"
                    disabled={isUsed}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleChooseBrawler(brawler.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                      isUsed
                        ? 'border-brawl-navy/20 bg-brawl-blue-sky/40 opacity-55'
                        : isHighlighted
                        ? 'border-brawl-navy bg-brawl-yellow-pale shadow-brawl-xs'
                        : 'border-transparent bg-white hover:border-brawl-navy/30'
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brawl-navy bg-brawl-blue-sky p-1">
                      <BrawlerAvatar brawler={brawler} size="cell" />
                    </span>
                    <span className="flex-1 truncate font-display text-base uppercase tracking-[0.02em] text-brawl-navy">
                      {brawler.name}
                    </span>
                    {isUsed ? (
                      <span className="rounded-lg border-2 border-brawl-navy/40 bg-white px-2.5 py-1 font-display text-[11px] uppercase tracking-wide text-brawl-navy/60">
                        Used
                      </span>
                    ) : (
                      <span
                        className={`rounded-lg border-2 border-brawl-navy px-3 py-1 font-display text-xs uppercase tracking-wide transition-colors ${
                          isHighlighted ? 'bg-brawl-yellow text-brawl-navy shadow-brawl-xs' : 'bg-brawl-blue text-white'
                        }`}
                      >
                        Select
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};
