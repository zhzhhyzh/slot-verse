import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { PlayingCard } from '../../components/PlayingCard';
import { Shoe, type Card, cardValue } from '../../utils/cardDeck';
import { playCardDeal, playMediumWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type BetType = 'player' | 'banker' | 'tie' | null;

function bacVal(c: Card): number {
  const v = cardValue(c.rank);
  return v >= 10 ? 0 : v === 11 ? 1 : v;
}
function handScore(cards: Card[]): number {
  return cards.reduce((s, c) => s + bacVal(c), 0) % 10;
}

const shoe = new Shoe(8);

export function BaccaratGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<'betting'|'dealing'|'result'>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [betType, setBetType] = useState<BetType>(null);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const deal = () => {
    if (!betType || balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    if (shoe.needsReshuffle) shoe.reshuffle();
    setPhase('dealing');
    setResult(''); setWinAmount(0);

    const pc = [shoe.draw(), shoe.draw()];
    const bc = [shoe.draw(), shoe.draw()];
    setPlayerCards(pc); setBankerCards(bc);
    playCardDeal();

    setTimeout(() => {
      let p = [...pc], b = [...bc];
      const ps = handScore(p), bs = handScore(b);
      // Natural
      if (ps >= 8 || bs >= 8) { resolve(p, b); return; }
      // Player third card rule
      let pThird: Card | null = null;
      if (ps <= 5) { pThird = shoe.draw(); p = [...p, pThird]; setPlayerCards([...p]); playCardDeal(); }
      // Banker third card rule
      if (!pThird) {
        if (bs <= 5) { b = [...b, shoe.draw()]; setBankerCards([...b]); playCardDeal(); }
      } else {
        const ptv = bacVal(pThird);
        const shouldDraw = bs <= 2 ||
          (bs === 3 && ptv !== 8) ||
          (bs === 4 && [2,3,4,5,6,7].includes(ptv)) ||
          (bs === 5 && [4,5,6,7].includes(ptv)) ||
          (bs === 6 && [6,7].includes(ptv));
        if (shouldDraw) { b = [...b, shoe.draw()]; setBankerCards([...b]); playCardDeal(); }
      }
      setTimeout(() => resolve(p, b), 600);
    }, 800);
  };

  const resolve = (p: Card[], b: Card[]) => {
    setPlayerCards(p); setBankerCards(b);
    const ps = handScore(p), bs = handScore(b);
    let winner: 'player'|'banker'|'tie' = ps > bs ? 'player' : bs > ps ? 'banker' : 'tie';
    let win = 0, msg = '';

    if (winner === betType) {
      if (betType === 'player') { win = bet * 2; msg = `Player wins! +${win.toLocaleString()}`; }
      else if (betType === 'banker') { win = Math.floor(bet * 1.95); msg = `Banker wins! +${win.toLocaleString()} (5% commission)`; }
      else { win = bet * 9; msg = `Tie! +${win.toLocaleString()}`; }
      playMediumWin();
    } else if (winner === 'tie' && betType !== 'tie') {
      win = bet; msg = 'Tie! Bet returned.';
    } else {
      msg = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins. You lose.`;
      playNoWin();
    }
    if (win > 0) addWinRef.current(win);
    setWinAmount(win); setResult(msg); setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table">
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="hand-label">Player ({playerCards.length > 0 ? handScore(playerCards) : '-'})</div>
            <div className="hand-area">{playerCards.map((c,i) => <PlayingCard key={i} card={c} small className="deal-anim" />)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="hand-label">Banker ({bankerCards.length > 0 ? handScore(bankerCards) : '-'})</div>
            <div className="hand-area">{bankerCards.map((c,i) => <PlayingCard key={i} card={c} small className="deal-anim" />)}</div>
          </div>
        </div>
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? (result.includes('returned') ? 'push' : 'win') : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['player','banker','tie'] as const).map(t => (
                <button key={t} className={`casino-btn ${betType === t ? 'primary' : ''}`}
                  onClick={() => { playClick(); setBetType(t); }}>
                  {t === 'tie' ? 'Tie (8:1)' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={deal} disabled={!betType || balance < bet}>Deal</button>
          </>
        )}
        {phase === 'dealing' && <span className="casino-status">Dealing...</span>}
      </div>
    </div>
  );
}
