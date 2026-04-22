import type { SlotGameConfig } from '../../utils/types';

const paylineColors = ['#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ff6600', '#0066ff', '#ffff00', '#ff0000', '#00ff66', '#6600ff', '#ff3399', '#33ff99', '#9933ff', '#ff9933', '#33ccff'];

export const neonRushConfig: SlotGameConfig = {
  id: 'neon-rush',
  name: 'Neon Rush',
  description: 'Enter the cyberpunk city! 5x4 grid with expanding wilds and multipliers up to 5x.',
  reels: 5,
  rows: 4,
  symbols: [
    { id: 'neon-a', name: 'Neon A', svg: '\ud83c\udd70\ufe0f', color: '#ff00ff' },
    { id: 'neon-k', name: 'Neon K', svg: '\ud83c\udd96', color: '#00ffff' },
    { id: 'neon-q', name: 'Neon Q', svg: '\ud83c\udd97', color: '#ff6600' },
    { id: 'neon-j', name: 'Neon J', svg: '\ud83c\udd95', color: '#66ff00' },
    { id: 'robot', name: 'Robot', svg: '\ud83e\udd16', color: '#bdc3c7' },
    { id: 'lightning', name: 'Lightning', svg: '\u26a1', color: '#f1c40f' },
    { id: 'rocket', name: 'Rocket', svg: '\ud83d\ude80', color: '#e74c3c' },
    { id: 'crystal', name: 'Crystal', svg: '\ud83d\udd2e', color: '#9b59b6' },
    { id: 'neon-wild', name: 'Neon Wild', svg: '\ud83c\udf1f', color: '#ff00ff', isWild: true },
    { id: 'neon-scatter', name: 'Bonus Orb', svg: '\ud83d\udcab', color: '#00ffff', isScatter: true },
  ],
  paylines: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    positions: generateNeonPaylines(i, 5, 4),
    color: paylineColors[i],
  })),
  payoutTable: [
    { symbolId: 'neon-a', count: 3, multiplier: 2 },
    { symbolId: 'neon-a', count: 4, multiplier: 5 },
    { symbolId: 'neon-a', count: 5, multiplier: 10 },
    { symbolId: 'neon-k', count: 3, multiplier: 2 },
    { symbolId: 'neon-k', count: 4, multiplier: 5 },
    { symbolId: 'neon-k', count: 5, multiplier: 10 },
    { symbolId: 'neon-q', count: 3, multiplier: 3 },
    { symbolId: 'neon-q', count: 4, multiplier: 6 },
    { symbolId: 'neon-q', count: 5, multiplier: 12 },
    { symbolId: 'neon-j', count: 3, multiplier: 3 },
    { symbolId: 'neon-j', count: 4, multiplier: 6 },
    { symbolId: 'neon-j', count: 5, multiplier: 12 },
    { symbolId: 'robot', count: 3, multiplier: 5 },
    { symbolId: 'robot', count: 4, multiplier: 15 },
    { symbolId: 'robot', count: 5, multiplier: 30 },
    { symbolId: 'lightning', count: 3, multiplier: 8 },
    { symbolId: 'lightning', count: 4, multiplier: 20 },
    { symbolId: 'lightning', count: 5, multiplier: 50 },
    { symbolId: 'rocket', count: 3, multiplier: 10 },
    { symbolId: 'rocket', count: 4, multiplier: 30 },
    { symbolId: 'rocket', count: 5, multiplier: 75 },
    { symbolId: 'crystal', count: 3, multiplier: 15 },
    { symbolId: 'crystal', count: 4, multiplier: 40 },
    { symbolId: 'crystal', count: 5, multiplier: 100 },
    { symbolId: 'neon-wild', count: 3, multiplier: 20 },
    { symbolId: 'neon-wild', count: 4, multiplier: 60 },
    { symbolId: 'neon-wild', count: 5, multiplier: 250 },
    { symbolId: 'neon-scatter', count: 3, multiplier: 5 },
    { symbolId: 'neon-scatter', count: 4, multiplier: 25 },
    { symbolId: 'neon-scatter', count: 5, multiplier: 100 },
  ],
  minBet: 25,
  maxBet: 20000,
  betStep: 25,
  features: ['expanding-wilds', 'multiplier', 'scatters'],
  thumbnail: '\ud83d\ude80',
  themeColor: '#ff00ff',
  reelWeights: {
    'neon-a': 14, 'neon-k': 14, 'neon-q': 13, 'neon-j': 13,
    robot: 10, lightning: 8, rocket: 6, crystal: 4,
    'neon-wild': 2, 'neon-scatter': 2,
  },
};

function generateNeonPaylines(index: number, reels: number, rows: number): number[] {
  const patterns: number[][] = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3],
    [0, 1, 2, 1, 0], [3, 2, 1, 2, 3], [0, 0, 1, 2, 2], [3, 3, 2, 1, 1],
    [1, 0, 0, 0, 1], [2, 3, 3, 3, 2], [0, 1, 1, 1, 0], [3, 2, 2, 2, 3],
    [1, 2, 3, 2, 1], [2, 1, 0, 1, 2], [0, 2, 0, 2, 0],
  ];
  const p = patterns[index % patterns.length];
  return p.slice(0, reels).map(v => Math.min(v, rows - 1));
}
