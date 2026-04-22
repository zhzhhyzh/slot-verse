// ─── Shared Card Deck Utilities ───
// Used by Blackjack, Baccarat, Three Card Poker, Video Poker, Vegas Solitaire

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#c0504d',
  diamonds: '#c0504d',
  clubs: '#e8e0d0',
  spades: '#e8e0d0',
};

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank);
}

export function cardDisplay(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function createDeck(numDecks = 1): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, faceUp: true });
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class Shoe {
  private cards: Card[] = [];
  private deckCount: number;

  constructor(numDecks = 6) {
    this.deckCount = numDecks;
    this.reshuffle();
  }

  reshuffle(): void {
    this.cards = shuffleDeck(createDeck(this.deckCount));
  }

  draw(faceUp = true): Card {
    if (this.cards.length < 10) this.reshuffle();
    const card = this.cards.pop()!;
    return { ...card, faceUp };
  }

  get remaining(): number {
    return this.cards.length;
  }

  get needsReshuffle(): boolean {
    return this.cards.length < (this.deckCount * 52 * 0.25);
  }
}

// ─── Hand evaluation helpers for poker ───

export type PokerHandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'jacks-or-better'
  | 'pair'
  | 'high-card';

const RANK_ORDER: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function rankOrder(r: Rank): number {
  return RANK_ORDER[r];
}

export function evaluatePokerHand(cards: Card[]): { rank: PokerHandRank; score: number } {
  const sorted = [...cards].sort((a, b) => rankOrder(b.rank) - rankOrder(a.rank));
  const ranks = sorted.map(c => rankOrder(c.rank));
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isAceLowStraight = ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2;
  const isStraight = isAceLowStraight ||
    (ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1 &&
     ranks[2] - ranks[3] === 1 && ranks[3] - ranks[4] === 1);

  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.values(counts).sort((a, b) => b - a);

  if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 13) return { rank: 'royal-flush', score: 800 };
  if (isFlush && isStraight) return { rank: 'straight-flush', score: 50 };
  if (groups[0] === 4) return { rank: 'four-of-a-kind', score: 25 };
  if (groups[0] === 3 && groups[1] === 2) return { rank: 'full-house', score: 9 };
  if (isFlush) return { rank: 'flush', score: 6 };
  if (isStraight) return { rank: 'straight', score: 4 };
  if (groups[0] === 3) return { rank: 'three-of-a-kind', score: 3 };
  if (groups[0] === 2 && groups[1] === 2) return { rank: 'two-pair', score: 2 };
  if (groups[0] === 2) {
    const pairRank = Number(Object.entries(counts).find(([, c]) => c === 2)![0]);
    if (pairRank >= 11) return { rank: 'jacks-or-better', score: 1 };
    return { rank: 'pair', score: 0 };
  }
  return { rank: 'high-card', score: 0 };
}

// ─── 3-card poker hand evaluation ───
export type ThreeCardHandRank =
  | 'straight-flush' | 'three-of-a-kind' | 'straight'
  | 'flush' | 'pair' | 'high-card';

export function evaluate3CardHand(cards: Card[]): { rank: ThreeCardHandRank; score: number; highCard: number } {
  const sorted = [...cards].sort((a, b) => rankOrder(b.rank) - rankOrder(a.rank));
  const ranks = sorted.map(c => rankOrder(c.rank));
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isAceLow = ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2;
  const isStraight = isAceLow ||
    (ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1);

  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.values(counts).sort((a, b) => b - a);

  const highCard = isAceLow ? 3 : ranks[0];

  if (isFlush && isStraight) return { rank: 'straight-flush', score: 6, highCard };
  if (groups[0] === 3) return { rank: 'three-of-a-kind', score: 5, highCard };
  if (isStraight) return { rank: 'straight', score: 4, highCard };
  if (isFlush) return { rank: 'flush', score: 3, highCard };
  if (groups[0] === 2) return { rank: 'pair', score: 2, highCard };
  return { rank: 'high-card', score: 1, highCard };
}
