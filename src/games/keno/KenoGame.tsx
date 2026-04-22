import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playBallDraw, playKenoHit, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'picking' | 'drawing' | 'result';

// Payout table: [picks][matches] = multiplier (0 = no win)
const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 9 },
  3: { 2: 2, 3: 25 },
  4: { 2: 1, 3: 5, 4: 75 },
  5: { 3: 3, 4: 15, 5: 250 },
  6: { 3: 2, 4: 8, 5: 50, 6: 500 },
  7: { 3: 1, 4: 5, 5: 20, 6: 100, 7: 1000 },
  8: { 4: 3, 5: 10, 6: 50, 7: 500, 8: 5000 },
  9: { 4: 2, 5: 6, 6: 25, 7: 150, 8: 1000, 9: 10000 },
  10: { 5: 3, 6: 15, 7: 50, 8: 500, 9: 3000, 10: 50000 },
};

export function KenoGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('picking');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [picks, setPicks] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<Set<number>>(new Set());
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const togglePick = (n: number) => {
    if (phase !== 'picking') return;
    playClick();
    const s = new Set(picks);
    if (s.has(n)) s.delete(n);
    else if (s.size < 10) s.add(n);
    setPicks(s);
  };

  const play = () => {
    if (picks.size === 0 || balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    setDrawn(new Set());
    setResult(''); setWinAmount(0);
    setPhase('drawing');

    // Draw 20 numbers
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    const drawResult: number[] = [];
    for (let i = 0; i < 20; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      drawResult.push(pool[idx]);
      pool.splice(idx, 1);
    }

    // Animate draws
    let idx = 0;
    const interval = setInterval(() => {
      const num = drawResult[idx];
      setDrawn(prev => new Set([...prev, num]));
      if (picks.has(num)) playKenoHit();
      else playBallDraw();
      idx++;
      if (idx >= 20) {
        clearInterval(interval);
        setTimeout(() => resolve(new Set(drawResult)), 300);
      }
    }, 150);
  };

  const resolve = (drawnSet: Set<number>) => {
    const matches = [...picks].filter(n => drawnSet.has(n)).length;
    const payTable = PAYOUTS[picks.size] || {};
    const mult = payTable[matches] || 0;
    let win = 0;

    if (mult > 0) {
      win = bet * mult;
      addWinRef.current(win);
      setResult(`${matches} matches! Won ${win.toLocaleString()} (${mult}x)`);
      if (mult >= 100) playBigWin();
      else if (mult >= 5) playMediumWin();
      else playSmallWin();
    } else {
      setResult(`${matches} match${matches !== 1 ? 'es' : ''}. No win.`);
      playNoWin();
    }
    setWinAmount(win); setPhase('result');
  };

  const clearPicks = () => { playClick(); setPicks(new Set()); };
  const quickPick = () => {
    playClick();
    const count = picks.size || 5;
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    const s = new Set<number>();
    while (s.size < count) {
      const idx = Math.floor(Math.random() * pool.length);
      s.add(pool[idx]);
      pool.splice(idx, 1);
    }
    setPicks(s);
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  const newGame = () => {
    setPhase('picking');
    setDrawn(new Set());
    setResult(''); setWinAmount(0);
  };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div style={{ fontSize: 12, color: '#8a7a5a', marginBottom: 8 }}>
        Picks: {picks.size}/10 {picks.size > 0 && `| Matches to win: ${Object.keys(PAYOUTS[picks.size] || {}).join(', ')}+`}
      </div>
      <div className="casino-table" style={{ maxWidth: 600, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {Array.from({ length: 80 }, (_, i) => {
            const n = i + 1;
            const isPicked = picks.has(n);
            const isDrawn = drawn.has(n);
            const isHit = isPicked && isDrawn;
            return (
              <div key={n} onClick={() => togglePick(n)}
                style={{
                  padding: '6px 0', textAlign: 'center', borderRadius: 4, cursor: phase === 'picking' ? 'pointer' : 'default',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                  background: isHit ? 'linear-gradient(135deg, #f0d078, #d4a94a)' :
                    isPicked ? 'linear-gradient(135deg, #3498db, #2980b9)' :
                    isDrawn ? 'rgba(200, 60, 60, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isHit ? '#0a0a12' : isPicked ? '#fff' : isDrawn ? '#c0504d' : '#8a7a5a',
                  border: isHit ? '2px solid #f0d078' : isPicked ? '1px solid #3498db' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isHit ? '0 0 10px rgba(240,208,120,0.5)' : 'none',
                }}>
                {n}
              </div>
            );
          })}
        </div>
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'picking' || phase === 'result') && (
          <>
            {phase === 'picking' && (
              <>
                <button className="casino-btn" onClick={quickPick}>Quick Pick</button>
                <button className="casino-btn" onClick={clearPicks}>Clear</button>
              </>
            )}
            {phase === 'result' && <button className="casino-btn" onClick={newGame}>New Game</button>}
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={play}
              disabled={picks.size === 0 || balance < bet || phase === 'result'}>
              Play
            </button>
          </>
        )}
        {phase === 'drawing' && <span className="casino-status">Drawing...</span>}
      </div>
    </div>
  );
}
