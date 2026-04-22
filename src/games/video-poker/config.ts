import type { BaseGameConfig } from '../../utils/gameTypes';
export const videoPokerConfig: BaseGameConfig = {
  id: 'video-poker', name: 'Video Poker',
  description: 'Jacks or Better — 5-card draw poker. Hold the best cards and draw for a winning hand.',
  type: 'video-poker', category: 'cards', thumbnail: '🎰', themeColor: '#e74c3c',
  minBet: 10, maxBet: 20000,
};
