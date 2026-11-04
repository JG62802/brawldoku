/**
 * Rarity-Based Scoring System for Brawldoku.
 *
 * Replaces the static base 100 points per solved cell with a dynamic tier based on
 * community pick rarity (obscurity percentage):
 *
 * - 0% – 29.99%:  Legendary (200 pts) - Ultra-rare community pick
 * - 30% – 49.99%: Mythic    (175 pts) - Uncommon / clever pick
 * - 50% – 69.99%: Epic      (150 pts) - Solid pick
 * - 70% – 89.99%: Rare      (125 pts) - Frequent pick
 * - 90% – 100%:   Common    (110 pts) - Most obvious community pick
 *
 * When live obscurity statistics are loading, pending, or unavailable (or for fresh practice grids),
 * cells conservatively fall back to baseline 100 points without inflating player scores.
 */

export type RarityTierName = 'Legendary' | 'Mythic' | 'Epic' | 'Rare' | 'Common';

export interface RarityTierDefinition {
  name: RarityTierName;
  minPercent: number; // inclusive
  maxPercent: number; // exclusive except for Common which includes 100
  points: number;
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  description: string;
}

export const FALLBACK_CELL_POINTS = 100;

export const RARITY_TIERS: Record<RarityTierName, RarityTierDefinition> = {
  Legendary: {
    name: 'Legendary',
    minPercent: 0,
    maxPercent: 30, // [0, 30) i.e. 0% to 29.99%
    points: 200,
    label: 'Legendary',
    badgeBg: 'bg-amber-100',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-400',
    accentColor: '#EAB308',
    description: '0% – 29.99% (Ultra-rare pick)',
  },
  Mythic: {
    name: 'Mythic',
    minPercent: 30,
    maxPercent: 50, // [30, 50) i.e. 30% to 49.99%
    points: 175,
    label: 'Mythic',
    badgeBg: 'bg-rose-100',
    textColor: 'text-rose-900',
    borderColor: 'border-rose-400',
    accentColor: '#EF4444',
    description: '30% – 49.99% (Rarer pick)',
  },
  Epic: {
    name: 'Epic',
    minPercent: 50,
    maxPercent: 70, // [50, 70) i.e. 50% to 69.99%
    points: 150,
    label: 'Epic',
    badgeBg: 'bg-purple-100',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-400',
    accentColor: '#A855F7',
    description: '50% – 69.99% (Smart pick)',
  },
  Rare: {
    name: 'Rare',
    minPercent: 70,
    maxPercent: 90, // [70, 90) i.e. 70% to 89.99%
    points: 125,
    label: 'Rare',
    badgeBg: 'bg-emerald-100',
    textColor: 'text-emerald-900',
    borderColor: 'border-emerald-400',
    accentColor: '#22C55E',
    description: '70% – 89.99% (Popular pick)',
  },
  Common: {
    name: 'Common',
    minPercent: 90,
    maxPercent: 100, // [90, 100]
    points: 110,
    label: 'Common',
    badgeBg: 'bg-slate-100',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-300',
    accentColor: '#64748B',
    description: '90% – 100% (Most common pick)',
  },
};

/**
 * Returns the rarity tier for a given obscurity percentage, or null if percentage is missing / invalid.
 * Clamps input to [0, 100].
 */
export function getRarityTierForPercentage(
  percent: number | null | undefined
): RarityTierDefinition | null {
  if (percent === null || percent === undefined || Number.isNaN(percent) || !Number.isFinite(percent)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, percent));

  if (clamped < 30) {
    return RARITY_TIERS.Legendary;
  }
  if (clamped < 50) {
    return RARITY_TIERS.Mythic;
  }
  if (clamped < 70) {
    return RARITY_TIERS.Epic;
  }
  if (clamped < 90) {
    return RARITY_TIERS.Rare;
  }
  return RARITY_TIERS.Common;
}

/**
 * Returns the exact total points for a cell based on obscurity percentage.
 * If percentage is missing/null/loading/unavailable, safely returns baseline FALLBACK_CELL_POINTS (100).
 */
export function getPointsForPercentage(percent: number | null | undefined): number {
  const tier = getRarityTierForPercentage(percent);
  return tier ? tier.points : FALLBACK_CELL_POINTS;
}

/**
 * Recalculates total game score from individual cell points and mistakes.
 * Invariant: Score is always max(0, sum(cell.pointsEarned) - mistakes * 25).
 */
export function recalculateTotalScore(
  cells: Array<Array<{ brawlerId: number | null; pointsEarned: number }>>,
  mistakes: number,
  mistakePenalty = 25
): number {
  let cellPointsSum = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (cell.brawlerId !== null) {
        cellPointsSum += cell.pointsEarned || 0;
      }
    }
  }
  return Math.max(0, cellPointsSum - (mistakes || 0) * mistakePenalty);
}
