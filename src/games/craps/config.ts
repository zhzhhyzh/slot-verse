import type { BaseGameConfig } from '../../utils/gameTypes';
export const crapsConfig: BaseGameConfig = {
  id: 'craps', name: 'Craps',
  description: 'Roll the dice! Pass/Don\'t Pass bets with full come-out and point phases.',
  type: 'craps', category: 'table', thumbnail: '🎲', themeColor: '#d35400',
  minBet: 10, maxBet: 20000,
};
