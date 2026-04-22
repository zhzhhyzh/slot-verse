export interface SlotSymbol {
  id: string;
  name: string;
  svg: string;      // SVG string or emoji fallback
  color: string;
  isWild?: boolean;
  isScatter?: boolean;
}

export interface PaylineDefinition {
  id: number;
  positions: number[]; // index per reel (row index), e.g. [1,1,1,1,1] = middle row
  color: string;
}

export interface PayoutEntry {
  symbolId: string;
  count: number; // minimum matching symbols on a payline
  multiplier: number; // payout = bet * multiplier
}

export interface SlotGameConfig {
  id: string;
  name: string;
  description: string;
  reels: number;
  rows: number;
  symbols: SlotSymbol[];
  paylines: PaylineDefinition[];
  payoutTable: PayoutEntry[];
  minBet: number;
  maxBet: number;
  betStep: number;
  features: GameFeature[];
  thumbnail: string; // emoji or SVG
  themeColor: string;
  reelWeights?: Record<string, number>; // symbolId -> weight for probability
}

export type GameFeature = 'wilds' | 'scatters' | 'free-spins' | 'multiplier' | 'expanding-wilds' | 'sticky-wilds' | 're-spins' | 'pick-bonus';

export interface SpinResult {
  grid: string[][]; // grid[reel][row] = symbolId
  winnings: WinResult[];
  totalWin: number;
  freeSpinsAwarded: number;
}

export interface WinResult {
  paylineId: number;
  symbolId: string;
  count: number;
  multiplier: number;
  payout: number;
  positions: { reel: number; row: number }[];
}

export type SpinState = 'idle' | 'spinning' | 'revealing' | 'win-display';
