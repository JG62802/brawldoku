import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { CATEGORIES } from '../engine/categories';
import { BRAWLERS, BRAWLER_BY_ID } from '../data/brawlers';
import { BASE_POINTS_PER_CELL, MISTAKE_PENALTY } from '../engine/gameEngine';
import { BrawlerAvatar } from './BrawlerAvatar';
import { Modal } from './Modal';

const SCORING_RULES: { label: string; badge: string; tone: 'green' | 'red' | 'yellow'; detail: string }[] = [
  {
    label: 'Correct guess',
    badge: `+${BASE_POINTS_PER_CELL} PTS`,
    tone: 'green',
    detail: 'Locks the Brawler into the cell and consumes 1 guess.',
  },
  {
    label: 'Incorrect guess',
    badge: `−${MISTAKE_PENALTY} PTS`,
    tone: 'red',
    detail: 'Deducts 25 points (score never drops below 0) and consumes 1 guess.',
  },
  {
    label: 'Duplicate Brawler',
    badge: 'Blocked',
    tone: 'yellow',
    detail: 'Each Brawler can only be used once per grid. Duplicates do not cost a guess.',
  },
  {
    label: 'Obscurity %',
    badge: 'Bottom-right',
    tone: 'yellow',
    detail:
      'Shows the percentage of valid player submissions for that cell that chose the same Brawler (or N/A when live stats are unavailable). Lower % = rarer pick.',
  },
];

interface HowToPlayModalProps {
  onClose: () => void;
  onDontShowAgain?: () => void;
  /** Retained for backwards compatibility with existing callers. */
  requireAcknowledgement?: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  onClose,
  onDontShowAgain,
}) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  const colt = BRAWLER_BY_ID[16000001] ?? BRAWLERS[1];
  const shelly = BRAWLER_BY_ID[16000000] ?? BRAWLERS[0];
  const bull = BRAWLER_BY_ID[16000002] ?? BRAWLERS[2];

  const colHeaders = ['Damagers', 'Fast Reload', 'Tanks'];
  const rowHeaders = ['Long Range', 'Rare', '2017'];

  type DemoCell =
    | { kind: 'valid'; brawler: typeof colt; tag?: string }
    | { kind: 'duplicate'; brawler: typeof colt }
    | { kind: 'empty' };

  const demoGrid: DemoCell[][] = [
    [
      { kind: 'valid', brawler: colt, tag: '1st pick' },
      { kind: 'empty' },
      { kind: 'empty' },
    ],
    [
      { kind: 'empty' },
      { kind: 'duplicate', brawler: colt },
      { kind: 'valid', brawler: bull },
    ],
    [
      { kind: 'valid', brawler: shelly },
      { kind: 'empty' },
      { kind: 'empty' },
    ],
  ];

  return (
    <Modal
      title="How to Play Brawldoku"
      onClose={onClose}
      dismissible={true}
      centerHeader={true}
      footer={(close) => (
        <div className="flex flex-row items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              onDontShowAgain?.();
              close();
            }}
            className="btn-secondary h-11 sm:h-12 flex-1 px-3 text-xs sm:text-sm"
          >
            Don&apos;t show again
          </button>
          <button
            type="button"
            onClick={close}
            className="btn-primary h-11 sm:h-12 flex-[1.25] px-4 text-sm sm:text-base"
            autoFocus
          >
            Let&apos;s play!
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* Section 1: Visual 3x3 Mini-Grid Demonstration */}
        <section
          aria-label="Visual gameplay demonstration"
          className="rounded-2xl border-[2.5px] border-brawl-navy bg-brawl-blue-sky/75 p-3 sm:p-4 shadow-brawl-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm sm:text-base uppercase tracking-[0.03em] text-brawl-navy">
              Complete the Board
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-brawl-navy">
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-brawl-navy bg-brawl-green-pale px-1.5 py-0.5 font-display uppercase text-brawl-green-dark">
                <Check className="h-3 w-3 stroke-[3]" /> Valid
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-brawl-navy bg-brawl-red-pale px-1.5 py-0.5 font-display uppercase text-brawl-red">
                <X className="h-3 w-3 stroke-[3]" /> Duplicate
              </span>
            </div>
          </div>

          {/* Compact 3x3 Intersection Mini-Grid */}
          <div className="mx-auto mt-3 max-w-[330px]">
            <div className="grid grid-cols-[68px_repeat(3,minmax(0,1fr))] sm:grid-cols-[76px_repeat(3,minmax(0,1fr))] gap-1.5 items-center">
              <div aria-hidden="true" />
              {colHeaders.map((col) => (
                <div
                  key={col}
                  className="rounded-lg border-2 border-brawl-navy bg-brawl-blue px-1 py-1 text-center font-display text-[10px] sm:text-[11px] uppercase leading-tight tracking-wide text-white"
                >
                  {col}
                </div>
              ))}

              {rowHeaders.map((rowLabel, rIdx) => (
                <React.Fragment key={rowLabel}>
                  <div className="rounded-lg border-2 border-brawl-navy bg-brawl-blue px-1.5 py-2 text-center font-display text-[10px] sm:text-[11px] uppercase leading-tight tracking-wide text-white">
                    {rowLabel}
                  </div>

                  {demoGrid[rIdx].map((cell, cIdx) => {
                    if (cell.kind === 'valid') {
                      const isColtValid = cell.brawler.id === colt.id;
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-xl border-[2.5px] p-1 shadow-brawl-xs ${
                            isColtValid
                              ? 'border-brawl-green bg-brawl-green-pale ring-2 ring-inset ring-brawl-green'
                              : 'border-brawl-navy bg-brawl-green-pale/75'
                          }`}
                        >
                          {isColtValid && (
                            <span
                              className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-brawl-navy bg-brawl-green text-white"
                              title="Valid placement"
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                            </span>
                          )}
                          <div className="flex min-h-0 flex-1 items-center justify-center p-0.5">
                            <BrawlerAvatar brawler={cell.brawler} size="cell" />
                          </div>
                          <span className="w-full truncate text-center font-display text-[9px] sm:text-[10px] uppercase leading-none text-brawl-navy">
                            {cell.brawler.name}
                          </span>
                        </div>
                      );
                    }

                    if (cell.kind === 'duplicate') {
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className="relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-xl border-[2.5px] border-brawl-red bg-brawl-red-pale p-1 ring-2 ring-inset ring-brawl-red shadow-brawl-xs"
                        >
                          <span
                            className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-brawl-navy bg-brawl-red text-white"
                            title="Duplicate Brawler rejected"
                          >
                            <X className="h-2.5 w-2.5 stroke-[3.5]" />
                          </span>
                          <div className="flex min-h-0 flex-1 items-center justify-center p-0.5 opacity-90">
                            <BrawlerAvatar brawler={cell.brawler} size="cell" />
                          </div>
                          <span className="w-full rounded bg-brawl-red px-1 py-0.5 text-center font-display text-[8px] sm:text-[9px] uppercase leading-none text-white">
                            Reused!
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="flex aspect-square items-center justify-center rounded-xl border-2 border-brawl-navy/35 bg-white/80"
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Explanation callout below the mini-grid */}
          <div className="mt-3 rounded-xl border-2 border-brawl-navy bg-white px-3 py-2.5 text-center shadow-brawl-xs">
            <p className="font-display text-sm sm:text-[15px] uppercase tracking-[0.02em] text-brawl-navy">
              Do not reuse Brawlers.
            </p>
            <p className="mt-0.5 text-xs sm:text-[13px] font-bold italic leading-snug text-brawl-navy/85">
              Colt fits both Damagers and Fast Reload, but each Brawler can only be used once per puzzle.
            </p>
          </div>
        </section>

        {/* Section 2: Collapsible Scoring & Obscurity Rules Accordion */}
        <section aria-label="Scoring and obscurity rules">
          <div className="overflow-hidden rounded-xl border-[2.5px] border-brawl-navy bg-white shadow-brawl-xs">
            <button
              type="button"
              onClick={() => setRulesOpen((prev) => !prev)}
              aria-expanded={rulesOpen}
              aria-controls="how-to-play-rules-panel"
              className="flex w-full items-center justify-between gap-3 bg-white px-3.5 py-3 text-left transition-colors hover:bg-brawl-blue-sky/60"
            >
              <span className="font-display text-sm sm:text-[15px] uppercase tracking-[0.03em] text-brawl-navy">
                Scoring &amp; Obscurity Rules
              </span>
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-brawl-navy bg-brawl-yellow text-brawl-navy transition-transform duration-200 ${
                  rulesOpen ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="h-4 w-4 stroke-[3]" />
              </span>
            </button>

            <div
              id="how-to-play-rules-panel"
              role="region"
              aria-hidden={!rulesOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                rulesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <dl className="divide-y-2 divide-brawl-navy/15 border-t-2 border-brawl-navy bg-brawl-blue-sky/40">
                  {SCORING_RULES.map((rule) => {
                    const badgeClass =
                      rule.tone === 'green'
                        ? 'bg-brawl-green text-white'
                        : rule.tone === 'red'
                        ? 'bg-brawl-red text-white'
                        : 'bg-brawl-yellow text-brawl-navy';
                    return (
                      <div key={rule.label} className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <dt className="font-display text-xs sm:text-[13px] uppercase tracking-wide text-brawl-navy">
                            {rule.label}
                          </dt>
                          <dd
                            className={`m-0 shrink-0 rounded-md border-2 border-brawl-navy px-2 py-0.5 font-display text-[11px] uppercase tracking-wide tabular ${badgeClass}`}
                          >
                            {rule.badge}
                          </dd>
                        </div>
                        <p className="mt-1 text-xs font-bold leading-snug text-brawl-navy/80">{rule.detail}</p>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export const CategoryGlossaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const sections = ['All', 'Brawler Characteristics', 'Attacks and Weapons', 'Progression and Equipment', 'Abilities and Mechanics'];
  const shown = sections.filter((s) => s !== 'All' && (selectedSection === 'All' || s === selectedSection));

  return (
    <Modal
      title="Categories"
      subtitle={`Every category is checked against ${BRAWLERS.length} brawlers.`}
      onClose={onClose}
      size="lg"
    >
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1.5">
        {sections.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSelectedSection(sec)}
            className={`h-9 whitespace-nowrap rounded-xl border-2 border-brawl-navy px-3.5 font-display text-[12px] uppercase tracking-wide shadow-brawl-xs transition-colors ${
              selectedSection === sec
                ? 'bg-brawl-yellow text-brawl-navy'
                : 'bg-white text-brawl-navy hover:bg-brawl-blue-sky'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {shown.map((sec) => (
          <section key={sec}>
            <div className="inline-block rounded-lg border-2 border-brawl-navy bg-brawl-orange px-2.5 py-0.5 font-display text-xs uppercase tracking-wider text-white shadow-brawl-xs">
              {sec}
            </div>
            <div className="mt-2.5 overflow-hidden rounded-xl border-[2.5px] border-brawl-navy bg-white divide-y-2 divide-brawl-navy/15 shadow-brawl-xs">
              {CATEGORIES.filter((c) => c.section === sec).map((cat) => (
                <div key={cat.id} className="flex items-start justify-between gap-4 px-3.5 py-3">
                  <div className="min-w-0">
                    <div className="font-display text-[15px] uppercase tracking-[0.02em] text-brawl-navy category-label">
                      {cat.label}
                    </div>
                    <p className="mt-0.5 text-[13px] font-bold leading-snug text-brawl-navy/75 category-label">{cat.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md border-2 border-brawl-navy bg-brawl-blue-sky px-2 py-0.5 font-display text-xs text-brawl-navy tabular">
                    {BRAWLERS.filter((b) => cat.predicate(b)).length}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
};
