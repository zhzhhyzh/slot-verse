import type { BaseGameConfig } from '../../utils/gameTypes';
export const sicBoConfig: BaseGameConfig = {
  id: 'sic-bo', name: 'Sic Bo',
  description: 'Ancient Chinese dice game. Bet on outcomes of three dice — Big/Small, triples, totals, and more.',
  type: 'sic-bo', category: 'table', thumbnail: '🀄', themeColor: '#8e44ad',
  minBet: 10, maxBet: 20000,
};
