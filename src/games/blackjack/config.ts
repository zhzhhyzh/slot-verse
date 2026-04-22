import type { BaseGameConfig } from '../../utils/gameTypes';

export const blackjackConfig: BaseGameConfig = {
  id: 'blackjack',
  name: 'Blackjack',
  description: 'Beat the dealer by getting as close to 21 as possible. 6-deck shoe, 3:2 Blackjack, split & double down.',
  type: 'blackjack',
  category: 'cards',
  thumbnail: '\uD83C\uDCA1',
  themeColor: '#2ecc71',
  minBet: 10,
  maxBet: 20000,
};
