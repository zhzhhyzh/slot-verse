import type { BaseGameConfig } from '../../utils/gameTypes';
export const rouletteConfig: BaseGameConfig = {
  id: 'roulette', name: 'Roulette',
  description: 'European roulette with 37 pockets. Bet on numbers, colors, odds/evens, and more.',
  type: 'roulette', category: 'table', thumbnail: '🎡', themeColor: '#c0392b',
  minBet: 10, maxBet: 20000,
};
