import type { SlotGameConfig, SpinResult, WinResult } from './types';

/**
 * Win rate controller.
 * Starts at 40%, halves after each win (40 -> 20 -> 10 -> 5 min).
 * Persisted per-session via this module-level state.
 */
const MIN_WIN_RATE = 0.05;
const INITIAL_WIN_RATE = 0.40;
const winRateState: Record<string, number> = {}; // gameId -> current win rate

export function getWinRate(gameId: string): number {
  return winRateState[gameId] ?? INITIAL_WIN_RATE;
}

export function resetWinRate(gameId: string): void {
  winRateState[gameId] = INITIAL_WIN_RATE;
}

function recordWin(gameId: string): void {
  const current = winRateState[gameId] ?? INITIAL_WIN_RATE;
  winRateState[gameId] = Math.max(current / 2, MIN_WIN_RATE);
}

function recordLoss(gameId: string): void {
  // On loss, slowly recover toward initial rate (add 1% per loss, capped at initial)
  const current = winRateState[gameId] ?? INITIAL_WIN_RATE;
  winRateState[gameId] = Math.min(current + 0.01, INITIAL_WIN_RATE);
}

/** Generate a random grid based on config and optional reel weights */
export function generateGrid(config: SlotGameConfig): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < config.reels; r++) {
    const reel: string[] = [];
    for (let row = 0; row < config.rows; row++) {
      reel.push(pickWeightedSymbol(config));
    }
    grid.push(reel);
  }
  return grid;
}

/**
 * Controlled spin: generates a grid and evaluates it, but uses the win-rate
 * controller to decide whether a winning result is actually awarded.
 */
export function controlledSpin(config: SlotGameConfig, bet: number): SpinResult {
  const targetWinRate = getWinRate(config.id);
  const shouldWin = Math.random() < targetWinRate;

  // Try up to 20 times to get a result matching the desired outcome
  const MAX_ATTEMPTS = 20;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid = generateGrid(config);
    const result = evaluateSpin(config, grid, bet);
    const isWin = result.totalWin > 0;

    if (isWin === shouldWin) {
      if (isWin) {
        recordWin(config.id);
      } else {
        recordLoss(config.id);
      }
      return result;
    }
  }

  // Fallback: use whatever the last attempt gave us
  const grid = generateGrid(config);
  const result = evaluateSpin(config, grid, bet);
  if (result.totalWin > 0) {
    recordWin(config.id);
  } else {
    recordLoss(config.id);
  }
  return result;
}

function pickWeightedSymbol(config: SlotGameConfig): string {
  const weights = config.reelWeights;
  if (!weights) {
    return config.symbols[Math.floor(Math.random() * config.symbols.length)].id;
  }
  const entries = config.symbols.map(s => ({
    id: s.id,
    weight: weights[s.id] ?? 1,
  }));
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const entry of entries) {
    rand -= entry.weight;
    if (rand <= 0) return entry.id;
  }
  return entries[entries.length - 1].id;
}

/** Evaluate all paylines against the grid and return results */
export function evaluateSpin(config: SlotGameConfig, grid: string[][], bet: number): SpinResult {
  const winnings: WinResult[] = [];
  const symbolMap = new Map(config.symbols.map(s => [s.id, s]));
  const betPerLine = bet / config.paylines.length;

  for (const payline of config.paylines) {
    const symbolsOnLine = payline.positions.map((rowIdx, reelIdx) => grid[reelIdx][rowIdx]);
    const result = evaluatePayline(config, symbolMap, symbolsOnLine, payline, betPerLine);
    if (result) winnings.push(result);
  }

  // Check scatter wins (anywhere on grid)
  const scatterSymbols = config.symbols.filter(s => s.isScatter);
  let freeSpinsAwarded = 0;
  for (const scatter of scatterSymbols) {
    let count = 0;
    const positions: { reel: number; row: number }[] = [];
    for (let r = 0; r < config.reels; r++) {
      for (let row = 0; row < config.rows; row++) {
        if (grid[r][row] === scatter.id) {
          count++;
          positions.push({ reel: r, row });
        }
      }
    }
    if (count >= 3) {
      const payoutEntry = config.payoutTable.find(p => p.symbolId === scatter.id && p.count <= count);
      if (payoutEntry) {
        winnings.push({
          paylineId: -1,
          symbolId: scatter.id,
          count,
          multiplier: payoutEntry.multiplier,
          payout: Math.floor(bet * payoutEntry.multiplier),
          positions,
        });
      }
      if (config.features.includes('free-spins')) {
        freeSpinsAwarded = count >= 5 ? 15 : count >= 4 ? 10 : 5;
      }
    }
  }

  const totalWin = winnings.reduce((sum, w) => sum + w.payout, 0);

  return { grid, winnings, totalWin, freeSpinsAwarded };
}

function evaluatePayline(
  config: SlotGameConfig,
  symbolMap: Map<string, import('./types').SlotSymbol>,
  symbolsOnLine: string[],
  payline: import('./types').PaylineDefinition,
  betPerLine: number,
): WinResult | null {
  // Find the first non-wild symbol
  let baseSymbol: string | null = null;
  for (const sid of symbolsOnLine) {
    const sym = symbolMap.get(sid);
    if (sym && !sym.isWild) {
      baseSymbol = sid;
      break;
    }
  }
  if (!baseSymbol) {
    // All wilds - use highest payout wild
    baseSymbol = symbolsOnLine[0];
  }

  // Count consecutive matches from left
  let matchCount = 0;
  for (const sid of symbolsOnLine) {
    const sym = symbolMap.get(sid);
    if (sid === baseSymbol || (sym && sym.isWild)) {
      matchCount++;
    } else {
      break;
    }
  }

  if (matchCount < 2) return null;

  // Find best payout
  const applicablePayouts = config.payoutTable
    .filter(p => p.symbolId === baseSymbol && p.count <= matchCount)
    .sort((a, b) => b.multiplier - a.multiplier);

  if (applicablePayouts.length === 0) return null;

  const best = applicablePayouts[0];
  const payout = Math.floor(betPerLine * best.multiplier);

  const positions = symbolsOnLine.slice(0, matchCount).map((_, i) => ({
    reel: i,
    row: payline.positions[i],
  }));

  return {
    paylineId: payline.id,
    symbolId: baseSymbol,
    count: matchCount,
    multiplier: best.multiplier,
    payout,
    positions,
  };
}
