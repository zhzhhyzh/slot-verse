import { useState, useRef, useEffect, useCallback } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playCrashRising, playCrashExplosion, playCashOut, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'rising' | 'crashed' | 'cashed-out';

function generateCrashPoint(): number {
  // House edge ~4%. E = 1 / (1 - 0.04) ≈ 1.04
  const r = Math.random();
  if (r < 0.01) return 1.0; // instant crash
  return Math.max(1.0, Math.floor(100 / (r * 100)) * 100 / 100);
}

export function CrashGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedAt, setCashedAt] = useState(0);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const crashPointRef = useRef(0);

  const startRound = () => {
    if (balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    crashPointRef.current = cp;
    setMultiplier(1.0);
    setCashedAt(0);
    setResult(''); setWinAmount(0);
    setPhase('rising');
    startTimeRef.current = Date.now();
  };

  const cashOut = useCallback(() => {
    if (phase !== 'rising') return;
    playCashOut();
    const win = Math.floor(bet * multiplier);
    addWinRef.current(win);
    setCashedAt(multiplier);
    setWinAmount(win);
    setResult(`Cashed out at ${multiplier.toFixed(2)}x! +${win.toLocaleString()}`);
    if (multiplier >= 5) playBigWin();
    else if (multiplier >= 2) playMediumWin();
    else playSmallWin();
    setPhase('cashed-out');
  }, [phase, multiplier, bet]);

  useEffect(() => {
    if (phase !== 'rising') return;
    let soundTick = 0;
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const m = 1 + elapsed * 0.5 + elapsed * elapsed * 0.05; // accelerating multiplier
      const rounded = Math.floor(m * 100) / 100;

      if (rounded >= crashPointRef.current) {
        setMultiplier(crashPointRef.current);
        playCrashExplosion();
        playNoWin();
        setResult(`Crashed at ${crashPointRef.current.toFixed(2)}x!`);
        setHistory(h => [crashPointRef.current, ...h].slice(0, 15));
        setPhase('crashed');
        return;
      }

      setMultiplier(rounded);
      soundTick++;
      if (soundTick % 20 === 0) playCrashRising();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  const getMultColor = (m: number) => {
    if (m < 1.5) return '#2ecc71';
    if (m < 3) return '#f39c12';
    if (m < 5) return '#e67e22';
    return '#e74c3c';
  };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table" style={{ textAlign: 'center', padding: '40px 30px' }}>
        {/* Multiplier display */}
        <div style={{ fontSize: 64, fontWeight: 900, color: phase === 'crashed' ? '#c0504d' : getMultColor(multiplier), transition: 'color 0.3s', fontFamily: 'monospace', textShadow: phase === 'rising' ? `0 0 30px ${getMultColor(multiplier)}40` : 'none' }}>
          {multiplier.toFixed(2)}x
        </div>
        {phase === 'crashed' && (
          <div style={{ fontSize: 20, color: '#c0504d', fontWeight: 700, marginTop: 8, animation: 'popIn 0.3s ease' }}>
            CRASHED!
          </div>
        )}
        {phase === 'cashed-out' && (
          <div style={{ fontSize: 20, color: '#f0d078', fontWeight: 700, marginTop: 8, animation: 'popIn 0.3s ease' }}>
            CASHED OUT
          </div>
        )}
        {/* Graph area (simplified bar) */}
        <div style={{ height: 60, background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginTop: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: `${Math.min(multiplier / 10 * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${getMultColor(multiplier)}40, ${getMultColor(multiplier)}80)`, transition: 'width 0.1s linear', borderRadius: 8 }} />
          {/* Rocket emoji */}
          <div style={{ position: 'absolute', bottom: '50%', left: `${Math.min(multiplier / 10 * 100, 95)}%`, transform: 'translateY(50%)', fontSize: 24, transition: 'left 0.1s linear' }}>🚀</div>
        </div>
        {/* History */}
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {history.map((h, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 700, color: h >= 2 ? '#2ecc71' : '#c0504d', padding: '2px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                {h.toFixed(2)}x
              </span>
            ))}
          </div>
        )}
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'crashed' || phase === 'cashed-out') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={startRound} disabled={balance < bet}>
              Start Round
            </button>
          </>
        )}
        {phase === 'rising' && (
          <button className="casino-btn primary" onClick={cashOut}
            style={{ fontSize: 18, padding: '14px 40px', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', borderColor: '#2ecc71' }}>
            Cash Out ({Math.floor(bet * multiplier).toLocaleString()})
          </button>
        )}
      </div>
    </div>
  );
}
