import type { BaseGameConfig } from '../../utils/gameTypes';
export const scratchCardConfig: BaseGameConfig = {
  id: 'scratch-card', name: 'Scratch Cards',
  description: 'Scratch to reveal prizes! Match 3 symbols to win. Instant fun with big multipliers.',
  type: 'scratch-card', category: 'specialty', thumbnail: '🎫', themeColor: '#e91e63',
  minBet: 10, maxBet: 5000,
};
