import type { BaseGameConfig } from '../../utils/gameTypes';
export const pachinkoConfig: BaseGameConfig = {
  id: 'pachinko', name: 'Pachinko',
  description: 'Japanese-style ball drop game! Watch balls bounce through pins and land in prize slots.',
  type: 'pachinko', category: 'specialty', thumbnail: '🏮', themeColor: '#ff6b6b',
  minBet: 10, maxBet: 10000,
};
