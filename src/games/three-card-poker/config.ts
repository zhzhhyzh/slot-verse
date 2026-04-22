import type { BaseGameConfig } from '../../utils/gameTypes';
export const threeCardPokerConfig: BaseGameConfig = {
  id: 'three-card-poker', name: 'Three Card Poker',
  description: 'Ante up and beat the dealer with just 3 cards. Pair Plus side bet available.',
  type: 'three-card-poker', category: 'cards', thumbnail: '🃏', themeColor: '#e67e22',
  minBet: 10, maxBet: 20000,
};
