import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playDiceRoll, playDiceLand, playSmallWin, playMediumWin, playNoWin, playClick, playChipPlace } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'rolling' | 'point' | 'result';
type BetSide = 'pass' | 'dont-pass' | null;

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

function rollDice(): [number, number] {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

export function CrapsGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [betSide, setBetSide] = useState<BetSide>(null);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [point, setPoint] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const roll = () => {
    if (phase === 'betting') {
      if (!betSide || balance < bet) return;
      if (!placeBet(bet)) return;
      playChipPlace();
    }
    playDiceRoll();
    setPhase('rolling');
    setResult(''); setWinAmount(0);

    // Animate dice
    let rolls = 0;
    const interval = setInterval(() => {
      setDice(rollDice());
      rolls++;
      if (rolls >= 8) {
        clearInterval(interval);
        const d = rollDice();
        setDice(d);
        playDiceLand();
        setTimeout(() => resolveRoll(d[0] + d[1]), 400);
      }
    }, 80);
  };

  const resolveRoll = (total: number) => {
    const h = [...history];
    if (point === null) {
      // Come-out roll
      h.push(`Come-out: ${total}`);
      if (total === 7 || total === 11) {
        const win = betSide === 'pass';
        if (win) {
          addWinRef.current(bet * 2);
          setWinAmount(bet * 2);
          setResult(`${total}! Pass line wins! +${(bet * 2).toLocaleString()}`);
          playSmallWin();
        } else {
          setResult(`${total}! Don't Pass loses.`);
          playNoWin();
        }
        setPhase('result');
      } else if (total === 2 || total === 3 || total === 12) {
        if (total === 12) {
          // Push on don't pass
          if (betSide === 'dont-pass') {
            addWinRef.current(bet);
            setWinAmount(bet);
            setResult(`${total}! Push on Don't Pass. Bet returned.`);
          } else {
            setResult(`${total}! Craps! Pass line loses.`);
            playNoWin();
          }
          setPhase('result');
        } else {
          const win = betSide === 'dont-pass';
          if (win) {
            addWinRef.current(bet * 2);
            setWinAmount(bet * 2);
            setResult(`${total}! Craps! Don't Pass wins! +${(bet * 2).toLocaleString()}`);
            playSmallWin();
          } else {
            setResult(`${total}! Craps! Pass line loses.`);
            playNoWin();
          }
          setPhase('result');
        }
      } else {
        setPoint(total);
        setResult(`Point is ${total}. Roll again!`);
        setPhase('point');
      }
    } else {
      // Point phase
      h.push(`Roll: ${total}`);
      if (total === point) {
        const win = betSide === 'pass';
        if (win) {
          addWinRef.current(bet * 2);
          setWinAmount(bet * 2);
          setResult(`${total}! Point hit! Pass line wins! +${(bet * 2).toLocaleString()}`);
          playMediumWin();
        } else {
          setResult(`${total}! Point hit. Don't Pass loses.`);
          playNoWin();
        }
        setPoint(null);
        setPhase('result');
      } else if (total === 7) {
        const win = betSide === 'dont-pass';
        if (win) {
          addWinRef.current(bet * 2);
          setWinAmount(bet * 2);
          setResult(`7 out! Don't Pass wins! +${(bet * 2).toLocaleString()}`);
          playMediumWin();
        } else {
          setResult(`7 out! Pass line loses.`);
          playNoWin();
        }
        setPoint(null);
        setPhase('result');
      } else {
        setResult(`Rolled ${total}. Point is still ${point}. Roll again!`);
        setPhase('point');
      }
    }
    setHistory(h.slice(-8));
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table">
        {/* Dice display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 64, margin: '20px 0' }}>
          <span style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{DICE_FACES[dice[0]-1]}</span>
          <span style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{DICE_FACES[dice[1]-1]}</span>
        </div>
        <div style={{ textAlign: 'center', color: '#f0d078', fontSize: 24, fontWeight: 800 }}>
          {dice[0] + dice[1]}
        </div>
        {point !== null && (
          <div style={{ textAlign: 'center', margin: '8px 0', color: '#d4a94a', fontSize: 14, fontWeight: 600 }}>
            POINT: {point}
          </div>
        )}
        {/* Roll history */}
        {history.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 12 }}>
            {history.map((h, i) => (
              <span key={i} style={{ fontSize: 11, color: '#8a7a5a', padding: '2px 6px', border: '1px solid rgba(184,148,60,0.15)', borderRadius: 4 }}>{h}</span>
            ))}
          </div>
        )}
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? (result.includes('Push') ? 'push' : 'win') : (phase === 'point' ? 'push' : 'lose')}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`casino-btn ${betSide === 'pass' ? 'primary' : ''}`}
                onClick={() => { playClick(); setBetSide('pass'); }}>Pass</button>
              <button className={`casino-btn ${betSide === 'dont-pass' ? 'primary' : ''}`}
                onClick={() => { playClick(); setBetSide('dont-pass'); }}>Don't Pass</button>
            </div>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={roll} disabled={!betSide || balance < bet}>Roll</button>
          </>
        )}
        {phase === 'point' && (
          <button className="casino-btn primary" onClick={roll}>Roll Again</button>
        )}
        {phase === 'rolling' && <span className="casino-status">Rolling...</span>}
      </div>
    </div>
  );
}
