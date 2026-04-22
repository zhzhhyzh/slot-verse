import type { BaseGameConfig } from '../../utils/gameTypes';
export const kenoConfig: BaseGameConfig = {
  id: 'keno', name: 'Keno',
  description: 'Pick up to 10 numbers from 1-80. The more matches, the bigger the payout!',
  type: 'keno', category: 'specialty', thumbnail: '🎱', themeColor: '#3498db',
  minBet: 10, maxBet: 20000,
};
