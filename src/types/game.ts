export type BrawlerClass =
  | 'Damage Dealer'
  | 'Tank'
  | 'Assassin'
  | 'Marksman'
  | 'Controller'
  | 'Support'
  | 'Artillery';

export type BrawlerRarity =
  | 'Starting Brawler'
  | 'Rare'
  | 'Super Rare'
  | 'Epic'
  | 'Mythic'
  | 'Legendary';

export type RangeType = 'Short' | 'Normal' | 'Long' | 'Very Long';

export type ReloadSpeedType = 'Very Fast' | 'Fast' | 'Normal' | 'Slow' | 'Very Slow';

export type GenderType = 'Male' | 'Female' | 'Robot / Non-Human';

export type WeaponType = 'Melee' | 'Gun' | 'Throwable' | 'Other';

export interface Brawler {
  id: number;
  slug: string;
  name: string;
  brawlerType: BrawlerClass;
  rarity: BrawlerRarity;
  range: RangeType;
  ammoAmount: number; // 1, 3, 4, or 40 (Fuel bar)
  reloadSpeed: ReloadSpeedType;
  gender: GenderType;
  releaseYear: number;
  hasPets: boolean;
  singleShot: boolean;
  isAoE: boolean;
  weaponType: WeaponType;
  hasHypercharge: boolean;
  hasBuffies: boolean;
  isHealer: boolean;
  usesShield: boolean;
  flies: boolean;
  jumpingUltimate: boolean;
  imageUrl: string;
  trio: string;
}

export type CategoryGroup =
  | 'BrawlerType'
  | 'Rarity'
  | 'Range'
  | 'AmmoAmount'
  | 'ReloadSpeed'
  | 'Gender'
  | 'ReleaseYear'
  | 'HasPets'
  | 'SingleShot'
  | 'AoE'
  | 'WeaponType'
  | 'HasHypercharge'
  | 'HasBuffies'
  | 'Healer'
  | 'UsesShield'
  | 'Flies'
  | 'JumpingUltimate';

export interface CategoryDefinition {
  id: string;
  label: string;
  shortLabel: string;
  group: CategoryGroup;
  section:
    | 'Brawler Characteristics'
    | 'Attacks and Weapons'
    | 'Progression and Equipment'
    | 'Abilities and Mechanics';
  description: string;
  badgeColor: string;
  predicate: (brawler: Brawler) => boolean;
}

export type CellIdentifier = `${number}-${number}`;

/**
 * Anonymous submission record stored by the backend database.
 * Never includes player identity, IP, or session tokens.
 */
export interface ObscuritySubmissionRecord {
  puzzleId: string;
  cellId: CellIdentifier;
  brawlerId: number;
  submittedAt: string; // ISO-8601 timestamp
}

/**
 * Aggregated obscurity statistics for a single grid cell.
 */
export interface CellObscurityStats {
  puzzleId: string;
  cellId: CellIdentifier;
  totalValidSubmissions: number;
  brawlerCounts: Record<number, number>;
}

/**
 * Aggregated obscurity statistics for an entire daily puzzle.
 */
export interface PuzzleObscuritySummary {
  puzzleId: string;
  cells: Record<CellIdentifier, CellObscurityStats>;
  source: 'remote_api' | 'unavailable';
}

export type ObscurityDataStatus = 'idle' | 'loading' | 'available' | 'unavailable';

export type RarityTierName = 'Legendary' | 'Mythic' | 'Epic' | 'Rare' | 'Common';

export interface CellState {
  row: number;
  col: number;
  brawlerId: number | null;
  pointsEarned: number;
  obscurityPercent: number | null;
  obscurityStatus: ObscurityDataStatus;
  validCount: number;
  rarityTier?: RarityTierName | null;
}

export interface GuessRecord {
  row: number;
  col: number;
  brawlerId: number;
  brawlerName: string;
  correct: boolean;
  points: number;
  timestamp: number;
}

export interface DailyGameState {
  puzzleDate: string;
  puzzleNumber: number;
  rowCategoryIds: [string, string, string];
  colCategoryIds: [string, string, string];
  cells: CellState[][]; // 3x3
  guessesRemaining: number;
  maxGuesses: number;
  score: number;
  mistakes: number;
  streak: number;
  maxStreak: number;
  status: 'playing' | 'won' | 'game_over';
  guessHistory: GuessRecord[];
}
