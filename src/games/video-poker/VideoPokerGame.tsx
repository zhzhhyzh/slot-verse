import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { PlayingCard } from '../../components/PlayingCard';
import { Shoe, type Card, evaluatePokerHand, type PokerHandRank } from '../../utils/cardDeck';
import { playCardDeal, playCardFlip, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'holding' | 'result';

const PAYTABLE: Record<PokerHandRank, number> = {
  'royal-flush': 800, 'straight-flush': 50, 'four-of-a-kind': 25,
  'full-house': 9, 'flush': 6, 'straight': 4, 'three-of-a-kind': 3,
  'two-pair': 2, 'jacks-or-better': 1, 'pair': 0, 'high-card': 0,
};

const HAND_NAMES: Record<PokerHandRank, string> = {
  'royal-flush': 'Royal Flush', 'straight-flush': 'Straight Flush',
  'four-of-a-kind': 'Four of a Kind', 'full-house': 'Full House',
  'flush': 'Flush', 'straight': 'Straight', 'three-of-a-kind': 'Three of a Kind',
  'two-pair': 'Two Pair', 'jacks-or-better': 'Jacks or Better',
  'pair': 'Low Pair', 'high-card': 'High Card',
};

const shoe = new Shoe(1);

export function VideoPokerGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [cards, setCards] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false,false,false,false,false]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const deal = () => {
    if (balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    shoe.reshuffle();
    const hand = [shoe.draw(), shoe.draw(), shoe.draw(), shoe.draw(), shoe.draw()];
    setCards(hand);
    setHeld([false,false,false,false,false]);
    setResult(''); setWinAmount(0);
    setPhase('holding');
    playCardDeal();
  };

  const toggleHold = (i: number) => {
    if (phase !== 'holding') return;
    playClick();
    const h = [...held];
    h[i] = !h[i];
    setHeld(h);
  };

  const draw = () => {
    playCardFlip();
    const newCards = cards.map((c, i) => held[i] ? c : shoe.draw());
    setCards(newCards);
    const hand = evaluatePokerHand(newCards);
    const mult = PAYTABLE[hand.rank];
    let win = 0;
    if (mult > 0) {
      win = bet * (mult + 1);
      addWinRef.current(win);
      setResult(`${HAND_NAMES[hand.rank]}! +${win.toLocaleString()}`);
      if (mult >= 50) playBigWin();
      else if (mult >= 4) playMediumWin();
      else playSmallWin();
    } else {
      setResult(`${HAND_NAMES[hand.rank]} — No win`);
      playNoWin();
    }
    setWinAmount(win); setPhase('result');
  };

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      {/* Paytable display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 12, fontSize: 11, color: '#8a7a5a' }}>
        {Object.entries(PAYTABLE).filter(([,v]) => v > 0).map(([k,v]) => (
          <span key={k} style={{ padding: '2px 8px', border: '1px solid rgba(184,148,60,0.2)', borderRadius: 4 }}>
            {HAND_NAMES[k as PokerHandRank]}: {v}x
          </span>
        ))}
      </div>
      <div className="casino-table">
        <div className="hand-area" style={{ gap: 12 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <PlayingCard card={c} onClick={() => toggleHold(i)} selected={held[i]} className="deal-anim" />
              {phase === 'holding' && held[i] && (
                <div style={{ color: '#f0d078', fontWeight: 700, fontSize: 12, marginTop: 4 }}>HELD</div>
              )}
            </div>
          ))}
          {cards.length === 0 && <span style={{ color: '#5a7a5a' }}>Place your bet and deal</span>}
        </div>
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : 'lose'}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={deal} disabled={balance < bet}>Deal</button>
          </>
        )}
        {phase === 'holding' && (
          <button className="casino-btn primary" onClick={draw}>Draw</button>
        )}
      </div>
    </div>
  );
}
