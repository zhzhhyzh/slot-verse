import type { BaseGameConfig, GameCategory } from '../utils/gameTypes';
import type { SlotGameConfig } from '../utils/types';
import { classicFruitsConfig } from './classic-fruits/config';
import { treasureHuntConfig } from './treasure-hunt/config';
import { neonRushConfig } from './neon-rush/config';
import { oceanGemsConfig } from './ocean-gems/config';
import { wildWestConfig } from './wild-west/config';
import { blackjackConfig } from './blackjack/config';
import { baccaratConfig } from './baccarat/config';
import { threeCardPokerConfig } from './three-card-poker/config';
import { videoPokerConfig } from './video-poker/config';
import { vegasSolitaireConfig } from './vegas-solitaire/config';
import { rouletteConfig } from './roulette/config';
import { crapsConfig } from './craps/config';
import { sicBoConfig } from './sic-bo/config';
import { crashConfig } from './crash/config';
import { kenoConfig } from './keno/config';
import { scratchCardConfig } from './scratch-cards/config';
import { pachinkoConfig } from './pachinko/config';

// ─── All games in display order ───
export const allGames: BaseGameConfig[] = [
  // Slots
  classicFruitsConfig,
  treasureHuntConfig,
  neonRushConfig,
  oceanGemsConfig,
  wildWestConfig,
  // Card Games
  blackjackConfig,
  baccaratConfig,
  threeCardPokerConfig,
  videoPokerConfig,
  vegasSolitaireConfig,
  // Table Games
  rouletteConfig,
  crapsConfig,
  sicBoConfig,
  // Specialty
  crashConfig,
  kenoConfig,
  scratchCardConfig,
  pachinkoConfig,
];

export function getGameById(id: string): BaseGameConfig | undefined {
  return allGames.find(g => g.id === id);
}

export function getSlotGameById(id: string): SlotGameConfig | undefined {
  const g = allGames.find(g => g.id === id && g.type === 'slot');
  return g as SlotGameConfig | undefined;
}

export function getGamesByCategory(category: GameCategory): BaseGameConfig[] {
  return allGames.filter(g => g.category === category);
}
