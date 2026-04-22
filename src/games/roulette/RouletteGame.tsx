import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playWheelTick, playBallDrop, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick, playChipPlace } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'spinning' | 'result';
type BetType = { type: string; label: string; numbers: number[]; payout: number };

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function getColor(n: number): string {
  if (n === 0) return '#0a7a3a';
  return RED_NUMBERS.includes(n) ? '#c0392b' : '#1a1a2e';
}

const OUTSIDE_BETS: BetType[] = [
  { type: 'red', label: '🔴 Red', numbers: RED_NUMBERS, payout: 2 },
  { type: 'black', label: '⚫ Black', numbers: BLACK_NUMBERS, payout: 2 },
  { type: 'odd', label: 'Odd', numbers: Array.from({length:36},(_,i)=>i+1).filter(n=>n%2===1), payout: 2 },
  { type: 'even', label: 'Even', numbers: Array.from({length:36},(_,i)=>i+1).filter(n=>n%2===0), payout: 2 },
  { type: '1-18', label: '1-18', numbers: Array.from({length:18},(_,i)=>i+1), payout: 2 },
  { type: '19-36', label: '19-36', numbers: Array.from({length:18},(_,i)=>i+19), payout: 2 },
  { type: '1st12', label: '1st 12', numbers: Array.from({length:12},(_,i)=>i+1), payout: 3 },
  { type: '2nd12', label: '2nd 12', numbers: Array.from({length:12},(_,i)=>i+13), payout: 3 },
  { type: '3rd12', label: '3rd 12', numbers: Array.from({length:12},(_,i)=>i+25), payout: 3 },
];

export function RouletteGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [selectedBets, setSelectedBets] = useState<Map<string, BetType>>(new Map());
  const [straightNum, setStraightNum] = useState<number | null>(null);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const toggleBet = (bt: BetType) => {
    playChipPlace();
    const m = new Map(selectedBets);
    if (m.has(bt.type)) m.delete(bt.type); else m.set(bt.type, bt);
    setSelectedBets(m);
  };

  const toggleStraight = (n: number) => {
    playChipPlace();
    setStraightNum(straightNum === n ? null : n);
  };

  const spin = () => {
    const totalBets = selectedBets.size + (straightNum !== null ? 1 : 0);
    const totalCost = bet * totalBets;
    if (totalBets === 0 || balance < totalCost) return;
    if (!placeBet(totalCost)) return;
    playClick();
    setPhase('spinning');
    setResult(''); setWinAmount(0);

    // Animate wheel ticks
    let ticks = 0;
    const maxTicks = 15 + Math.floor(Math.random() * 10);
    const tickInterval = setInterval(() => {
      playWheelTick();
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(tickInterval);
        playBallDrop();
        const num = Math.floor(Math.random() * 37);
        setWinningNumber(num);
        setTimeout(() => resolve(num, totalBets), 500);
      }
    }, 100 + ticks * 15);
  };

  const resolve = (num: number, totalBets: number) => {
    let win = 0;
    const wins: string[] = [];

    // Check straight bet
    if (straightNum !== null && straightNum === num) {
      win += bet * 36;
      wins.push(`Straight ${num}: 35:1`);
    }

    // Check outside bets
    for (const [, bt] of selectedBets) {
      if (bt.numbers.includes(num)) {
        win += bet * bt.payout;
        wins.push(`${bt.label}: ${bt.payout - 1}:1`);
      }
    }

    const color = num === 0 ? 'Green' : RED_NUMBERS.includes(num) ? 'Red' : 'Black';
    if (win > 0) {
      addWinRef.current(win);
      setResult(`${num} ${color}! ${wins.join(', ')} — Won ${win.toLocaleString()}`);
      if (win >= bet * 20) playBigWin();
      else if (win >= bet * 5) playMediumWin();
      else playSmallWin();
    } else {
      setResult(`${num} ${color}. No winning bets.`);
      playNoWin();
    }
    setWinAmount(win); setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table" style={{ maxWidth: 800 }}>
        {/* Number grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3, marginBottom: 16 }}>
          <div onClick={() => phase === 'betting' && toggleStraight(0)}
            style={{ gridColumn: '1 / 2', gridRow: '1 / 4', background: getColor(0), borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', border: straightNum === 0 ? '2px solid #f0d078' : '1px solid rgba(255,255,255,0.2)', minHeight: 90 }}>
            0
          </div>
          {[...Array(36)].map((_, i) => {
            const n = i + 1;
            const row = 2 - ((n - 1) % 3);
            const col = Math.floor((n - 1) / 3) + 2;
            return (
              <div key={n} onClick={() => phase === 'betting' && toggleStraight(n)}
                style={{ gridColumn: col, gridRow: row + 1, background: getColor(n), borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 0', border: straightNum === n ? '2px solid #f0d078' : '1px solid rgba(255,255,255,0.15)', boxShadow: winningNumber === n ? '0 0 15px rgba(240,208,120,0.8)' : 'none' }}>
                {n}
              </div>
            );
          })}
        </div>
        {/* Outside bets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {OUTSIDE_BETS.map(bt => (
            <button key={bt.type} className={`casino-btn ${selectedBets.has(bt.type) ? 'primary' : ''}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => phase === 'betting' && toggleBet(bt)}
              disabled={phase !== 'betting'}>
              {bt.label}
            </button>
          ))}
        </div>
        {winningNumber !== null && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 32, fontWeight: 800, color: '#f0d078' }}>
            <span style={{ display: 'inline-block', width: 50, height: 50, lineHeight: '50px', borderRadius: '50%', background: getColor(winningNumber), color: '#fff', boxShadow: '0 0 20px rgba(240,208,120,0.5)' }}>
              {winningNumber}
            </span>
          </div>
        )}
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet/chip</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={spin}
              disabled={selectedBets.size + (straightNum !== null ? 1 : 0) === 0 || balance < bet * (selectedBets.size + (straightNum !== null ? 1 : 0))}>
              Spin
            </button>
          </>
        )}
        {phase === 'spinning' && <span className="casino-status">Spinning...</span>}
      </div>
    </div>
  );
}
