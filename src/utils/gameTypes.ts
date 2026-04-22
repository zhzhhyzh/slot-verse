// ─── Game Type System ───
// Base types shared by ALL casino games for lobby display and routing.

export type GameType =
  | 'slot'
  | 'blackjack'
  | 'baccarat'
  | 'three-card-poker'
  | 'video-poker'
  | 'vegas-solitaire'
  | 'roulette'
  | 'craps'
  | 'sic-bo'
  | 'crash'
  | 'keno'
  | 'scratch-card'
  | 'pachinko';

export type GameCategory = 'slots' | 'cards' | 'table' | 'specialty';

export interface BaseGameConfig {
  id: string;
  name: string;
  description: string;
  type: GameType;
  category: GameCategory;
  thumbnail: string;
  themeColor: string;
  minBet: number;
  maxBet: number;
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  slots: 'Slots',
  cards: 'Card Games',
  table: 'Table Games',
  specialty: 'Specialty',
};

export const CATEGORY_ICONS: Record<GameCategory, string> = {
  slots: '\uD83C\uDFB0',
  cards: '\uD83C\uDCA0',
  table: '\uD83C\uDFB2',
  specialty: '\u2B50',
};
