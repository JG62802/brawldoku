import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { BRAWLERS } from '../data/brawlers.js';
import { CATEGORY_BY_ID } from '../engine/categories.js';
import { Brawler } from '../types/game.js';
import { BrawlerAvatar } from './BrawlerAvatar.js';
import { Modal } from './Modal.js';

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

// Pre-sort brawlers alphabetically once at module load time to avoid expensive repeated sorting
const ALL_BRAWLERS_SORTED: Brawler[] = [...BRAWLERS].sort((a, b) => a.name.localeCompare(b.name));

// Exact physical height per row (62px item height + 6px vertical gap)
const ROW_HEIGHT = 68;
const OVERSCAN = 4;

interface BrawlerRowProps {
  brawler: Brawler;
  index: number;
  isUsed: boolean;
  isHighlighted: boolean;
  onSelect: (brawlerId: number) => void;
  onHighlight: (index: number) => void;
}

const BrawlerRow = React.memo<BrawlerRowProps>(({
  brawler,
  index,
  isUsed,
  isHighlighted,
  onSelect,
  onHighlight,
}) => {
  return (
    <li
      id={`brawler-opt-${brawler.id}`}
      role="option"
      aria-selected={isHighlighted}
      aria-disabled={isUsed}
      className="list-none w-full h-full"
    >
      <button
        type="button"
        disabled={isUsed}
        onMouseEnter={() => onHighlight(index)}
        onClick={() => onSelect(brawler.id)}
        className={`flex h-full w-full items-center gap-3 rounded-xl border-2 px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed ${
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
              isHighlighted
                ? 'bg-brawl-yellow text-brawl-navy shadow-brawl-xs'
                : 'bg-brawl-blue text-white'
            }`}
          >
            Select
          </span>
        )}
      </button>
    </li>
  );
});

BrawlerRow.displayName = 'BrawlerRow';

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
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(360);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const submittedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const rowCat = CATEGORY_BY_ID[rowCategoryId];
  const colCat = CATEGORY_BY_ID[colCategoryId];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Dynamically track visible container height with ResizeObserver
  useEffect(() => {
    if (!listRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 50) {
          setViewportHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(listRef.current);
    return () => {
      observer.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Filter brawlers using pre-sorted array
  const filteredBrawlers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_BRAWLERS_SORTED;
    return ALL_BRAWLERS_SORTED.filter(
      (b) => b.name.toLowerCase().includes(q) || b.slug.includes(q)
    );
  }, [query]);

  // Reset scroll and highlight when search query changes
  useEffect(() => {
    setHighlightedIndex(0);
    setScrollTop(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [query]);

  const handleChooseBrawler = useCallback(
    (brawlerId: number) => {
      if (submittedRef.current || usedBrawlerIds.has(brawlerId)) return;
      submittedRef.current = true;
      onSelectBrawler(brawlerId);
    },
    [onSelectBrawler, usedBrawlerIds]
  );

  const handleRowHighlight = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  // Scroll index into view during keyboard navigation without forced layout thrashing
  const ensureIndexVisible = useCallback((index: number) => {
    if (!listRef.current) return;
    const itemTop = index * ROW_HEIGHT;
    const itemBottom = itemTop + ROW_HEIGHT;
    const currentTop = listRef.current.scrollTop;
    const clientH = listRef.current.clientHeight || 360;

    if (itemTop < currentTop) {
      listRef.current.scrollTop = itemTop;
      setScrollTop(itemTop);
    } else if (itemBottom > currentTop + clientH) {
      const nextTop = itemBottom - clientH;
      listRef.current.scrollTop = nextTop;
      setScrollTop(nextTop);
    }
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = filteredBrawlers.length > 0 ? (highlightedIndex + 1) % filteredBrawlers.length : 0;
      setHighlightedIndex(nextIdx);
      ensureIndexVisible(nextIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx =
        filteredBrawlers.length > 0
          ? (highlightedIndex - 1 + filteredBrawlers.length) % filteredBrawlers.length
          : 0;
      setHighlightedIndex(nextIdx);
      ensureIndexVisible(nextIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredBrawlers[highlightedIndex];
      if (target && !usedBrawlerIds.has(target.id)) {
        handleChooseBrawler(target.id);
      }
    }
  };

  // Passive, rAF-throttled scroll handler
  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      setScrollTop(nextTop);
    });
  };

  // Virtual windowing calculations
  const totalCount = filteredBrawlers.length;
  const totalHeight = totalCount * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalCount - 1,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );

  const visibleRows = useMemo(() => {
    if (totalCount === 0) return [];
    const rows = [];
    for (let i = startIndex; i <= endIndex; i++) {
      rows.push({
        brawler: filteredBrawlers[i],
        index: i,
        top: i * ROW_HEIGHT,
      });
    }
    return rows;
  }, [filteredBrawlers, startIndex, endIndex, totalCount]);

  const activeDescendantId =
    filteredBrawlers[highlightedIndex] ? `brawler-opt-${filteredBrawlers[highlightedIndex].id}` : undefined;

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
            aria-activedescendant={activeDescendantId}
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
          <ul
            id="brawler-results"
            ref={listRef}
            role="listbox"
            onScroll={handleScroll}
            className="mt-3 max-h-[50dvh] overflow-y-auto overscroll-contain pr-0.5"
            style={{
              position: 'relative',
              contain: 'content',
              willChange: 'scroll-position',
            }}
          >
            <div
              style={{
                height: `${totalHeight}px`,
                position: 'relative',
                width: '100%',
              }}
            >
              {visibleRows.map(({ brawler, index, top }) => (
                <div
                  key={brawler.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${ROW_HEIGHT - 6}px`,
                    transform: `translate3d(0, ${top}px, 0)`,
                    contain: 'layout style',
                  }}
                >
                  <BrawlerRow
                    brawler={brawler}
                    index={index}
                    isUsed={usedBrawlerIds.has(brawler.id)}
                    isHighlighted={index === highlightedIndex}
                    onSelect={handleChooseBrawler}
                    onHighlight={handleRowHighlight}
                  />
                </div>
              ))}
            </div>
          </ul>
        )}
      </div>
    </Modal>
  );
};
