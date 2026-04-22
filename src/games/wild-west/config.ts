import type { SlotGameConfig } from '../../utils/types';

const paylineColors = ['#d4a574', '#c68c53', '#b8860b', '#cd853f', '#deb887', '#f5deb3', '#8b4513', '#a0522d', '#d2691e', '#bc8f8f'];

export const wildWestConfig: SlotGameConfig = {
  id: 'wild-west',
  name: 'Wild West',
  description: 'Ride into the sunset! Sticky wilds stay for re-spins in this Western-themed adventure.',
  reels: 5,
  rows: 3,
  symbols: [
    { id: 'boot', name: 'Boot', svg: '\ud83e\udd7e', color: '#8b4513' },
    { id: 'hat', name: 'Cowboy Hat', svg: '\ud83e\ude60', color: '#d4a574' },
    { id: 'cactus', name: 'Cactus', svg: '\ud83c\udf35', color: '#27ae60' },
    { id: 'horseshoe', name: 'Horseshoe', svg: '\ud83e\udea8', color: '#bdc3c7' },
    { id: 'dynamite', name: 'Dynamite', svg: '\ud83e\udde8', color: '#e74c3c' },
    { id: 'revolver', name: 'Revolver', svg: '\ud83d\udd2b', color: '#7f8c8d' },
    { id: 'sheriff', name: 'Sheriff Badge', svg: '\u2b50', color: '#f1c40f' },
    { id: 'gold', name: 'Gold Nugget', svg: '\ud83e\udea9', color: '#ffd700' },
    { id: 'cowboy-wild', name: 'Cowboy (Wild)', svg: '\ud83e\udda0', color: '#d4a574', isWild: true },
    { id: 'west-scatter', name: 'Wanted Poster (Scatter)', svg: '\ud83d\udcf0', color: '#e74c3c', isScatter: true },
  ],
  paylines: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    positions: generateWestPaylines(i, 5, 3),
    color: paylineColors[i],
  })),
  payoutTable: [
    { symbolId: 'boot', count: 3, multiplier: 3 },
    { symbolId: 'boot', count: 4, multiplier: 8 },
    { symbolId: 'boot', count: 5, multiplier: 15 },
    { symbolId: 'hat', count: 3, multiplier: 4 },
    { symbolId: 'hat', count: 4, multiplier: 10 },
    { symbolId: 'hat', count: 5, multiplier: 20 },
    { symbolId: 'cactus', count: 3, multiplier: 5 },
    { symbolId: 'cactus', count: 4, multiplier: 12 },
    { symbolId: 'cactus', count: 5, multiplier: 25 },
    { symbolId: 'horseshoe', count: 3, multiplier: 6 },
    { symbolId: 'horseshoe', count: 4, multiplier: 15 },
    { symbolId: 'horseshoe', count: 5, multiplier: 35 },
    { symbolId: 'dynamite', count: 3, multiplier: 8 },
    { symbolId: 'dynamite', count: 4, multiplier: 20 },
    { symbolId: 'dynamite', count: 5, multiplier: 50 },
    { symbolId: 'revolver', count: 3, multiplier: 10 },
    { symbolId: 'revolver', count: 4, multiplier: 25 },
    { symbolId: 'revolver', count: 5, multiplier: 60 },
    { symbolId: 'sheriff', count: 3, multiplier: 12 },
    { symbolId: 'sheriff', count: 4, multiplier: 35 },
    { symbolId: 'sheriff', count: 5, multiplier: 80 },
    { symbolId: 'gold', count: 3, multiplier: 15 },
    { symbolId: 'gold', count: 4, multiplier: 40 },
    { symbolId: 'gold', count: 5, multiplier: 120 },
    { symbolId: 'cowboy-wild', count: 3, multiplier: 20 },
    { symbolId: 'cowboy-wild', count: 4, multiplier: 50 },
    { symbolId: 'cowboy-wild', count: 5, multiplier: 200 },
    { symbolId: 'west-scatter', count: 3, multiplier: 5 },
    { symbolId: 'west-scatter', count: 4, multiplier: 20 },
    { symbolId: 'west-scatter', count: 5, multiplier: 60 },
  ],
  minBet: 20,
  maxBet: 20000,
  betStep: 20,
  features: ['sticky-wilds', 're-spins', 'scatters'],
  thumbnail: '\ud83e\ude60',
  themeColor: '#d4a574',
  reelWeights: {
    boot: 14, hat: 13, cactus: 12, horseshoe: 10,
    dynamite: 8, revolver: 7, sheriff: 5, gold: 4,
    'cowboy-wild': 3, 'west-scatter': 2,
  },
};

function generateWestPaylines(index: number, reels: number, rows: number): number[] {
  const patterns: number[][] = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
    [0, 1, 1, 1, 0],
  ];
  const p = patterns[index % patterns.length];
  return p.slice(0, reels).map(v => Math.min(v, rows - 1));
}
