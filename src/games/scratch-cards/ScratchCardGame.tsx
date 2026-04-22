import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playScratchReveal, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'buying' | 'scratching' | 'result';

interface ScratchCell {
  symbol: string;
  multiplier: number;
  revealed: boolean;
}

const SYMBOLS = [
  { symbol: '💎', multiplier: 100, weight: 1 },
  { symbol: '🏆', multiplier: 50, weight: 2 },
  { symbol: '⭐', multiplier: 20, weight: 4 },
  { symbol: '🍀', multiplier: 10, weight: 8 },
  { symbol: '🎯', multiplier: 5, weight: 15 },
  { symbol: '🍒', multiplier: 2, weight: 25 },
  { symbol: '🔔', multiplier: 1, weight: 20 },
  { symbol: '❌', multiplier: 0, weight: 25 },
];

function generateCard(): ScratchCell[] {
  const cells: ScratchCell[] = [];
  const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  for (let i = 0; i < 9; i++) {
    let r = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) {
        cells.push({ symbol: sym.symbol, multiplier: sym.multiplier, revealed: false });
        break;
      }
    }
  }
  return cells;
}

function evaluateCard(cells: ScratchCell[]): { winSymbol: string; count: number; multiplier: number } | null {
  const counts: Record<string, { count: number; mult: number }> = {};
  for (const c of cells) {
    if (c.multiplier === 0) continue;
    if (!counts[c.symbol]) counts[c.symbol] = { count: 0, mult: c.multiplier };
    counts[c.symbol].count++;
  }
  let best: { winSymbol: string; count: number; multiplier: number } | null = null;
  for (const [sym, data] of Object.entries(counts)) {
    if (data.count >= 3 && (!best || data.mult > best.multiplier)) {
      best = { winSymbol: sym, count: data.count, multiplier: data.mult };
    }
  }
  return best;
}

export function ScratchCardGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('buying');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [cells, setCells] = useState<ScratchCell[]>([]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const buyCard = () => {
    if (balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    setCells(generateCard());
    setResult(''); setWinAmount(0);
    setPhase('scratching');
  };

  const scratch = (idx: number) => {
    if (phase !== 'scratching' || cells[idx].revealed) return;
    playScratchReveal();
    const newCells = [...cells];
    newCells[idx] = { ...newCells[idx], revealed: true };
    setCells(newCells);

    // Check if all revealed
    if (newCells.every(c => c.revealed)) {
      setTimeout(() => resolve(newCells), 300);
    }
  };

  const revealAll = () => {
    if (phase !== 'scratching') return;
    const newCells = cells.map(c => ({ ...c, revealed: true }));
    setCells(newCells);
    playScratchReveal();
    setTimeout(() => resolve(newCells), 300);
  };

  const resolve = (finalCells: ScratchCell[]) => {
    const win = evaluateCard(finalCells);
    if (win) {
      const amount = bet * win.multiplier;
      addWinRef.current(amount);
      setWinAmount(amount);
      setResult(`${win.count}x ${win.winSymbol} — Won ${amount.toLocaleString()} (${win.multiplier}x)!`);
      if (win.multiplier >= 50) playBigWin();
      else if (win.multiplier >= 5) playMediumWin();
      else playSmallWin();
    } else {
      setResult('No match. Better luck next time!');
      playNoWin();
    }
    setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div style={{ fontSize: 12, color: '#8a7a5a', marginBottom: 8 }}>
        Match 3 or more of the same symbol to win!
      </div>
      <div className="casino-table" style={{ maxWidth: 400, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {cells.map((cell, i) => (
            <div key={i} onClick={() => scratch(i)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: cell.revealed ? 36 : 24, cursor: phase === 'scratching' && !cell.revealed ? 'pointer' : 'default',
                background: cell.revealed
                  ? cell.multiplier > 0 ? 'linear-gradient(135deg, rgba(240,208,120,0.15), rgba(184,148,60,0.1))' : 'rgba(0,0,0,0.2)'
                  : 'linear-gradient(145deg, #2a2940, #1e1d2e)',
                border: cell.revealed && cell.multiplier > 0 ? '2px solid rgba(184,148,60,0.3)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
                transform: cell.revealed ? 'scale(1)' : 'scale(1)',
                boxShadow: cell.revealed && cell.multiplier >= 20 ? '0 0 15px rgba(240,208,120,0.3)' : 'none',
              }}>
              {cell.revealed ? (
                <span>{cell.symbol}</span>
              ) : (
                <span style={{ color: '#5a5a6a' }}>?</span>
              )}
            </div>
          ))}
        </div>
        {phase === 'buying' && (
          <div style={{ textAlign: 'center', color: '#5a7a5a', marginTop: 16, fontSize: 14 }}>
            Buy a card to start scratching!
          </div>
        )}
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'buying' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Price</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={buyCard} disabled={balance < bet}>Buy Card</button>
          </>
        )}
        {phase === 'scratching' && (
          <button className="casino-btn" onClick={revealAll}>Reveal All</button>
        )}
      </div>
    </div>
  );
}
