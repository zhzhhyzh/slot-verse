import type { BaseGameConfig } from '../../utils/gameTypes';
export const baccaratConfig: BaseGameConfig = {
  id: 'baccarat', name: 'Baccarat',
  description: 'The game of high rollers. Bet on Player, Banker, or Tie. Third card rules apply.',
  type: 'baccarat', category: 'cards', thumbnail: '\uD83C\uDCA0', themeColor: '#9b59b6',
  minBet: 10, maxBet: 20000,
};
