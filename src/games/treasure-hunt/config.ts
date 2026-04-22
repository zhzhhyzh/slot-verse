import type { SlotGameConfig } from '../../utils/types';

const paylineColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#ff5722'];

export const treasureHuntConfig: SlotGameConfig = {
  id: 'treasure-hunt',
  name: 'Treasure Hunt',
  description: 'Set sail for pirate treasure! Wild symbols and free spins await brave adventurers.',
  reels: 5,
  rows: 3,
  symbols: [
    { id: 'skull', name: 'Skull', svg: '\ud83d\udc80', color: '#bdc3c7' },
    { id: 'anchor', name: 'Anchor', svg: '\u2693', color: '#2c3e50' },
    { id: 'sword', name: 'Sword', svg: '\u2694\ufe0f', color: '#7f8c8d' },
    { id: 'parrot', name: 'Parrot', svg: '\ud83e\udd9c', color: '#27ae60' },
    { id: 'compass', name: 'Compass', svg: '\ud83e\udded', color: '#2980b9' },
    { id: 'map', name: 'Map', svg: '\ud83d\uddfa\ufe0f', color: '#d4a574' },
    { id: 'chest', name: 'Treasure Chest', svg: '\ud83e\uddf0', color: '#f39c12' },
    { id: 'diamond', name: 'Diamond', svg: '\ud83d\udc8e', color: '#3498db' },
    { id: 'pirate', name: 'Pirate (Wild)', svg: '\ud83c\udff4\u200d\u2620\ufe0f', color: '#2c3e50', isWild: true },
    { id: 'treasure-scatter', name: 'Treasure Map (Scatter)', svg: '\ud83d\udcdc', color: '#e74c3c', isScatter: true },
  ],
  paylines: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    positions: generatePaylinePositions(i, 5, 3),
    color: paylineColors[i],
  })),
  payoutTable: [
    { symbolId: 'skull', count: 3, multiplier: 3 },
    { symbolId: 'skull', count: 4, multiplier: 8 },
    { symbolId: 'skull', count: 5, multiplier: 15 },
    { symbolId: 'anchor', count: 3, multiplier: 4 },
    { symbolId: 'anchor', count: 4, multiplier: 10 },
    { symbolId: 'anchor', count: 5, multiplier: 20 },
    { symbolId: 'sword', count: 3, multiplier: 5 },
    { symbolId: 'sword', count: 4, multiplier: 12 },
    { symbolId: 'sword', count: 5, multiplier: 25 },
    { symbolId: 'parrot', count: 3, multiplier: 6 },
    { symbolId: 'parrot', count: 4, multiplier: 15 },
    { symbolId: 'parrot', count: 5, multiplier: 30 },
    { symbolId: 'compass', count: 3, multiplier: 8 },
    { symbolId: 'compass', count: 4, multiplier: 20 },
    { symbolId: 'compass', count: 5, multiplier: 40 },
    { symbolId: 'map', count: 3, multiplier: 10 },
    { symbolId: 'map', count: 4, multiplier: 25 },
    { symbolId: 'map', count: 5, multiplier: 50 },
    { symbolId: 'chest', count: 3, multiplier: 15 },
    { symbolId: 'chest', count: 4, multiplier: 40 },
    { symbolId: 'chest', count: 5, multiplier: 100 },
    { symbolId: 'diamond', count: 3, multiplier: 20 },
    { symbolId: 'diamond', count: 4, multiplier: 50 },
    { symbolId: 'diamond', count: 5, multiplier: 150 },
    { symbolId: 'pirate', count: 3, multiplier: 25 },
    { symbolId: 'pirate', count: 4, multiplier: 60 },
    { symbolId: 'pirate', count: 5, multiplier: 200 },
    { symbolId: 'treasure-scatter', count: 3, multiplier: 5 },
    { symbolId: 'treasure-scatter', count: 4, multiplier: 20 },
    { symbolId: 'treasure-scatter', count: 5, multiplier: 50 },
  ],
  minBet: 20,
  maxBet: 20000,
  betStep: 20,
  features: ['wilds', 'free-spins', 'scatters'],
  thumbnail: '\ud83c\udff4\u200d\u2620\ufe0f',
  themeColor: '#d4a574',
  reelWeights: {
    skull: 15, anchor: 14, sword: 13, parrot: 11,
    compass: 10, map: 8, chest: 5, diamond: 4,
    pirate: 3, 'treasure-scatter': 2,
  },
};

function generatePaylinePositions(index: number, reels: number, rows: number): number[] {
  const patterns: number[][] = [
    [1, 1, 1, 1, 1],  // middle
    [0, 0, 0, 0, 0],  // top
    [2, 2, 2, 2, 2],  // bottom
    [0, 1, 2, 1, 0],  // V shape
    [2, 1, 0, 1, 2],  // inverted V
    [0, 0, 1, 2, 2],  // diagonal down
    [2, 2, 1, 0, 0],  // diagonal up
    [1, 0, 0, 0, 1],  // U shape top
    [1, 2, 2, 2, 1],  // U shape bottom
    [0, 1, 1, 1, 0],  // flat middle dip
  ];
  const p = patterns[index % patterns.length];
  return p.slice(0, reels).map(v => Math.min(v, rows - 1));
}
