import { useState, useRef, useEffect } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playPinBounce, playSlotLand, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'dropping' | 'result';

const SLOTS = [
  { label: '100x', mult: 100, color: '#e74c3c' },
  { label: '10x', mult: 10, color: '#e67e22' },
  { label: '3x', mult: 3, color: '#f39c12' },
  { label: '1x', mult: 1, color: '#27ae60' },
  { label: '0.5x', mult: 0.5, color: '#2ecc71' },
  { label: '1x', mult: 1, color: '#27ae60' },
  { label: '0.5x', mult: 0.5, color: '#2ecc71' },
  { label: '1x', mult: 1, color: '#27ae60' },
  { label: '3x', mult: 3, color: '#f39c12' },
  { label: '10x', mult: 10, color: '#e67e22' },
  { label: '100x', mult: 100, color: '#e74c3c' },
];

// Weighted probabilities for each slot (higher for center/low multiplier)
const WEIGHTS = [1, 3, 8, 15, 23, 15, 23, 15, 8, 3, 1];
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0);

function dropBall(): number {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return Math.floor(SLOTS.length / 2);
}

interface BallAnim {
  id: number;
  x: number;
  y: number;
  targetSlot: number;
  done: boolean;
  bounces: { x: number; y: number }[];
  step: number;
}

let ballCounter = 0;

export function PachinkoGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [ballCount, setBallCount] = useState(5);
  const [balls, setBalls] = useState<BallAnim[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;
  const animRef = useRef<number>(0);

  function generateBounces(targetSlot: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const startX = 50;
    const endX = (targetSlot / (SLOTS.length - 1)) * 80 + 10;
    const steps = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30 * (1 - t);
      const y = t * 85 + 5;
      points.push({ x: Math.max(5, Math.min(95, x)), y });
    }
    return points;
  }

  const drop = () => {
    const totalCost = bet * ballCount;
    if (balance < totalCost) return;
    if (!placeBet(totalCost)) return;
    playClick();
    setPhase('dropping');
    setResult(''); setWinAmount(0); setResults([]);

    const newBalls: BallAnim[] = [];
    for (let i = 0; i < ballCount; i++) {
      const target = dropBall();
      newBalls.push({
        id: ++ballCounter,
        x: 50, y: 0,
        targetSlot: target,
        done: false,
        bounces: generateBounces(target),
        step: 0,
      });
    }
    setBalls(newBalls);
  };

  useEffect(() => {
    if (phase !== 'dropping' || balls.length === 0) return;
    let frame = 0;
    const animate = () => {
      frame++;
      setBalls(prev => {
        const next = prev.map((b, idx) => {
          if (b.done) return b;
          // Stagger balls
          const effectiveFrame = frame - idx * 8;
          if (effectiveFrame < 0) return b;
          const step = Math.min(Math.floor(effectiveFrame / 3), b.bounces.length - 1);
          if (step !== b.step && step < b.bounces.length) {
            playPinBounce();
          }
          if (step >= b.bounces.length - 1) {
            if (!b.done) {
              playSlotLand();
              setResults(r => [...r, b.targetSlot]);
            }
            return { ...b, x: b.bounces[b.bounces.length - 1].x, y: b.bounces[b.bounces.length - 1].y, done: true, step };
          }
          return { ...b, x: b.bounces[step].x, y: b.bounces[step].y, step };
        });
        if (next.every(b => b.done)) {
          setTimeout(() => resolve(next.map(b => b.targetSlot)), 500);
        }
        return next;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, balls.length]);

  const resolve = (slotResults: number[]) => {
    let total = 0;
    for (const s of slotResults) {
      total += Math.floor(bet * SLOTS[s].mult);
    }
    if (total > 0) {
      addWinRef.current(total);
      setWinAmount(total);
      setResult(`${ballCount} balls dropped! Won ${total.toLocaleString()} credits!`);
      if (total >= bet * ballCount * 5) playBigWin();
      else if (total >= bet * ballCount * 2) playMediumWin();
      else playSmallWin();
    } else {
      setResult('No wins this round.');
      playNoWin();
    }
    setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table" style={{ maxWidth: 500, padding: 16, position: 'relative', minHeight: 400 }}>
        {/* Pin grid (decorative) */}
        <div style={{ position: 'relative', width: '100%', height: 320 }}>
          {[1,2,3,4,5,6,7].map(row => (
            <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: `${60 - row * 4}px`, marginBottom: 8 }}>
              {Array.from({ length: row + 3 }, (_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(184,148,60,0.4)', boxShadow: '0 0 3px rgba(184,148,60,0.2)' }} />
              ))}
            </div>
          ))}
          {/* Animated balls */}
          {balls.map(b => !b.done && (
            <div key={b.id} style={{
              position: 'absolute', width: 14, height: 14, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #f0d078, #d4a94a)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              left: `${b.x}%`, top: `${b.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.08s ease, top 0.08s ease',
              zIndex: 10,
            }} />
          ))}
        </div>
        {/* Bottom slots */}
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {SLOTS.map((s, i) => {
            const hitCount = results.filter(r => r === i).length;
            return (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '8px 2px', borderRadius: 4,
                background: hitCount > 0 ? `${s.color}30` : 'rgba(0,0,0,0.3)',
                border: hitCount > 0 ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.1)',
                color: s.color, fontWeight: 700, fontSize: 10,
                boxShadow: hitCount > 0 ? `0 0 10px ${s.color}40` : 'none',
              }}>
                {s.label}
                {hitCount > 0 && <div style={{ fontSize: 8, color: '#f0d078' }}>x{hitCount}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet/ball</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Balls</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,3,5,10].map(n => (
                  <button key={n} className={`casino-btn ${ballCount === n ? 'primary' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => { playClick(); setBallCount(n); }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button className="casino-btn primary" onClick={drop}
              disabled={balance < bet * ballCount}>
              Drop ({(bet * ballCount).toLocaleString()})
            </button>
          </>
        )}
        {phase === 'dropping' && <span className="casino-status">Dropping balls...</span>}
      </div>
    </div>
  );
}
