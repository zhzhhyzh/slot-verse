import type { SlotGameConfig } from '../../utils/types';

const paylineColors = ['#00bcd4', '#0097a7', '#00838f', '#26c6da', '#4dd0e1', '#80deea', '#00acc1', '#0277bd', '#01579b', '#039be5'];

export const oceanGemsConfig: SlotGameConfig = {
  id: 'ocean-gems',
  name: 'Ocean Gems',
  description: 'Dive deep into the ocean for hidden gems! Scatter bonus triggers a pick-a-prize game.',
  type: 'slot',
  category: 'slots',
  reels: 5,
  rows: 3,
  symbols: [
    { id: 'fish', name: 'Fish', svg: '\ud83d\udc1f', color: '#f39c12' },
    { id: 'shell', name: 'Shell', svg: '\ud83d\udc1a', color: '#e8b4b8' },
    { id: 'seahorse', name: 'Seahorse', svg: '\ud83e\udddc\u200d\u2640\ufe0f', color: '#1abc9c' },
    { id: 'starfish', name: 'Starfish', svg: '\u2b50', color: '#f1c40f' },
    { id: 'octopus', name: 'Octopus', svg: '\ud83d\udc19', color: '#9b59b6' },
    { id: 'whale', name: 'Whale', svg: '\ud83d\udc33', color: '#3498db' },
    { id: 'pearl', name: 'Pearl', svg: '\ud83e\uddca', color: '#ecf0f1' },
    { id: 'trident', name: 'Trident (Wild)', svg: '\ud83d\udd31', color: '#2ecc71', isWild: true },
    { id: 'ocean-scatter', name: 'Treasure Chest (Scatter)', svg: '\ud83e\uddf0', color: '#e74c3c', isScatter: true },
  ],
  paylines: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    positions: generateOceanPaylines(i, 5, 3),
    color: paylineColors[i],
  })),
  payoutTable: [
    { symbolId: 'fish', count: 3, multiplier: 3 },
    { symbolId: 'fish', count: 4, multiplier: 8 },
    { symbolId: 'fish', count: 5, multiplier: 15 },
    { symbolId: 'shell', count: 3, multiplier: 4 },
    { symbolId: 'shell', count: 4, multiplier: 10 },
    { symbolId: 'shell', count: 5, multiplier: 20 },
    { symbolId: 'seahorse', count: 3, multiplier: 5 },
    { symbolId: 'seahorse', count: 4, multiplier: 12 },
    { symbolId: 'seahorse', count: 5, multiplier: 25 },
    { symbolId: 'starfish', count: 3, multiplier: 6 },
    { symbolId: 'starfish', count: 4, multiplier: 15 },
    { symbolId: 'starfish', count: 5, multiplier: 35 },
    { symbolId: 'octopus', count: 3, multiplier: 8 },
    { symbolId: 'octopus', count: 4, multiplier: 20 },
    { symbolId: 'octopus', count: 5, multiplier: 50 },
    { symbolId: 'whale', count: 3, multiplier: 12 },
    { symbolId: 'whale', count: 4, multiplier: 30 },
    { symbolId: 'whale', count: 5, multiplier: 75 },
    { symbolId: 'pearl', count: 3, multiplier: 15 },
    { symbolId: 'pearl', count: 4, multiplier: 40 },
    { symbolId: 'pearl', count: 5, multiplier: 120 },
    { symbolId: 'trident', count: 3, multiplier: 20 },
    { symbolId: 'trident', count: 4, multiplier: 50 },
    { symbolId: 'trident', count: 5, multiplier: 200 },
    { symbolId: 'ocean-scatter', count: 3, multiplier: 5 },
    { symbolId: 'ocean-scatter', count: 4, multiplier: 20 },
    { symbolId: 'ocean-scatter', count: 5, multiplier: 75 },
  ],
  minBet: 15,
  maxBet: 20000,
  betStep: 15,
  features: ['wilds', 'scatters', 'pick-bonus'],
  thumbnail: '\ud83d\udc33',
  themeColor: '#00bcd4',
  reelWeights: {
    fish: 15, shell: 14, seahorse: 12, starfish: 10,
    octopus: 8, whale: 6, pearl: 4, trident: 3, 'ocean-scatter': 2,
  },
};

function generateOceanPaylines(index: number, reels: number, rows: number): number[] {
  const patterns: number[][] = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
    [0, 1, 1, 1, 0],
  ];
  const p = patterns[index % patterns.length];
  return p.slice(0, reels).map(v => Math.min(v, rows - 1));
}
