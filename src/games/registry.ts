import type { SlotGameConfig } from '../utils/types';
import { classicFruitsConfig } from './classic-fruits/config';
import { treasureHuntConfig } from './treasure-hunt/config';
import { neonRushConfig } from './neon-rush/config';
import { oceanGemsConfig } from './ocean-gems/config';
import { wildWestConfig } from './wild-west/config';

export const allGames: SlotGameConfig[] = [
  classicFruitsConfig,
  treasureHuntConfig,
  neonRushConfig,
  oceanGemsConfig,
  wildWestConfig,
];

export function getGameById(id: string): SlotGameConfig | undefined {
  return allGames.find(g => g.id === id);
}
