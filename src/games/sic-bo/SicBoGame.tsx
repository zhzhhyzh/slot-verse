import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { playDiceRoll, playDiceLand, playSmallWin, playMediumWin, playBigWin, playNoWin, playChipPlace } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'rolling' | 'result';
interface SicBoBet { type: string; label: string; payout: number; check: (d: number[]) => boolean }

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

const BET_OPTIONS: SicBoBet[] = [
  { type: 'big', label: 'Big (11-17)', payout: 2, check: d => { const t = d[0]+d[1]+d[2]; return t >= 11 && t <= 17 && !(d[0]===d[1]&&d[1]===d[2]); }},
  { type: 'small', label: 'Small (4-10)', payout: 2, check: d => { const t = d[0]+d[1]+d[2]; return t >= 4 && t <= 10 && !(d[0]===d[1]&&d[1]===d[2]); }},
  { type: 'odd', label: 'Odd', payout: 2, check: d => { const t = d[0]+d[1]+d[2]; return t % 2 === 1 && !(d[0]===d[1]&&d[1]===d[2]); }},
  { type: 'even', label: 'Even', payout: 2, check: d => { const t = d[0]+d[1]+d[2]; return t % 2 === 0 && !(d[0]===d[1]&&d[1]===d[2]); }},
  { type: 'triple', label: 'Any Triple', payout: 30, check: d => d[0]===d[1]&&d[1]===d[2] },
  { type: 'double', label: 'Any Double', payout: 8, check: d => d[0]===d[1]||d[1]===d[2]||d[0]===d[2] },
  { type: 'total4-17', label: 'Total 4/17', payout: 50, check: d => { const t = d[0]+d[1]+d[2]; return t === 4 || t === 17; }},
  { type: 'total5-16', label: 'Total 5/16', payout: 18, check: d => { const t = d[0]+d[1]+d[2]; return t === 5 || t === 16; }},
  { type: 'total6-15', label: 'Total 6/15', payout: 14, check: d => { const t = d[0]+d[1]+d[2]; return t === 6 || t === 15; }},
  { type: 'total7-14', label: 'Total 7/14', payout: 12, check: d => { const t = d[0]+d[1]+d[2]; return t === 7 || t === 14; }},
  { type: 'total8-13', label: 'Total 8/13', payout: 8, check: d => { const t = d[0]+d[1]+d[2]; return t === 8 || t === 13; }},
  { type: 'total9-12', label: 'Total 9/12', payout: 6, check: d => { const t = d[0]+d[1]+d[2]; return t === 9 || t === 12; }},
  { type: 'total10-11', label: 'Total 10/11', payout: 6, check: d => { const t = d[0]+d[1]+d[2]; return t === 10 || t === 11; }},
];

export function SicBoGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [dice, setDice] = useState([1, 1, 1]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const toggleBet = (type: string) => {
    playChipPlace();
    const s = new Set(selectedBets);
    if (s.has(type)) s.delete(type); else s.add(type);
    setSelectedBets(s);
  };

  const roll = () => {
    if (selectedBets.size === 0) return;
    const totalCost = bet * selectedBets.size;
    if (balance < totalCost) return;
    if (!placeBet(totalCost)) return;
    playDiceRoll();
    setPhase('rolling');
    setResult(''); setWinAmount(0);

    let rolls = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        const d = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        setDice(d);
        playDiceLand();
        setTimeout(() => resolve(d), 400);
      }
    }, 80);
  };

  const resolve = (d: number[]) => {
    let win = 0;
    const wins: string[] = [];
    const total = d[0] + d[1] + d[2];

    for (const bo of BET_OPTIONS) {
      if (selectedBets.has(bo.type) && bo.check(d)) {
        win += bet * bo.payout;
        wins.push(`${bo.label}: ${bo.payout - 1}:1`);
      }
    }

    if (win > 0) {
      addWinRef.current(win);
      setResult(`Total ${total}! ${wins.join(', ')} — Won ${win.toLocaleString()}`);
      if (win >= bet * 20) playBigWin();
      else if (win >= bet * 5) playMediumWin();
      else playSmallWin();
    } else {
      setResult(`Total ${total}. No winning bets.`);
      playNoWin();
    }
    setWinAmount(win); setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table">
        {/* Dice display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 56, margin: '16px 0' }}>
          {dice.map((d, i) => <span key={i} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{DICE_FACES[d-1]}</span>)}
        </div>
        <div style={{ textAlign: 'center', color: '#f0d078', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
          Total: {dice[0]+dice[1]+dice[2]}
        </div>
        {/* Bet options */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {BET_OPTIONS.map(bo => (
            <button key={bo.type}
              className={`casino-btn ${selectedBets.has(bo.type) ? 'primary' : ''}`}
              style={{ fontSize: 11, padding: '5px 10px' }}
              onClick={() => phase === 'betting' && toggleBet(bo.type)}
              disabled={phase !== 'betting'}>
              {bo.label} ({bo.payout-1}:1)
            </button>
          ))}
        </div>
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
            <button className="casino-btn primary" onClick={roll}
              disabled={selectedBets.size === 0 || balance < bet * selectedBets.size}>
              Roll
            </button>
          </>
        )}
        {phase === 'rolling' && <span className="casino-status">Rolling...</span>}
      </div>
    </div>
  );
}
