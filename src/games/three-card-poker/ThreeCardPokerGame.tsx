import { useState, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { PlayingCard } from '../../components/PlayingCard';
import { Shoe, type Card, evaluate3CardHand, type ThreeCardHandRank } from '../../utils/cardDeck';
import { playCardDeal, playCardFlip, playSmallWin, playMediumWin, playBigWin, playNoWin, playClick, playChipPlace } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'dealt' | 'result';

const PAIR_PLUS_PAY: Record<ThreeCardHandRank, number> = {
  'straight-flush': 40, 'three-of-a-kind': 30, 'straight': 6,
  'flush': 3, 'pair': 1, 'high-card': 0,
};
const ANTE_BONUS: Record<ThreeCardHandRank, number> = {
  'straight-flush': 5, 'three-of-a-kind': 4, 'straight': 1,
  'flush': 0, 'pair': 0, 'high-card': 0,
};

const shoe = new Shoe(6);

export function ThreeCardPokerGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [ante, setAnte] = useState(config.minBet);
  const [anteInput, setAnteInput] = useState(String(config.minBet));
  const [pairPlus, setPairPlus] = useState(0);
  const [ppInput, setPpInput] = useState('0');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const deal = () => {
    const totalCost = ante + pairPlus;
    if (balance < totalCost) return;
    if (!placeBet(totalCost)) return;
    playChipPlace();
    if (shoe.needsReshuffle) shoe.reshuffle();
    const pc = [shoe.draw(), shoe.draw(), shoe.draw()];
    const dc = [shoe.draw(false), shoe.draw(false), shoe.draw(false)];
    setPlayerCards(pc); setDealerCards(dc);
    setResult(''); setWinAmount(0);
    setPhase('dealt');
    playCardDeal();
  };

  const fold = () => {
    // Player loses ante, but pair plus still evaluated
    playClick();
    const dc = dealerCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(dc);
    let win = 0;
    const msgs: string[] = ['You folded. Ante lost.'];
    if (pairPlus > 0) {
      const ph = evaluate3CardHand(playerCards);
      const ppWin = PAIR_PLUS_PAY[ph.rank];
      if (ppWin > 0) {
        const ppPayout = pairPlus * (ppWin + 1);
        win += ppPayout;
        msgs.push(`Pair Plus: ${ph.rank} +${ppPayout.toLocaleString()}`);
      } else {
        msgs.push('Pair Plus: no win');
      }
    }
    if (win > 0) { addWinRef.current(win); playSmallWin(); }
    else playNoWin();
    setWinAmount(win); setResult(msgs.join(' | ')); setPhase('result');
  };

  const play = () => {
    // Must place Play bet equal to Ante
    if (!placeBet(ante)) return;
    playChipPlace();
    const dc = dealerCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(dc);
    playCardFlip();

    const ph = evaluate3CardHand(playerCards);
    const dh = evaluate3CardHand(dc);
    const dealerQualifies = dh.score >= 1 && (dh.rank !== 'high-card' || dh.highCard >= 12); // Queen high+

    let win = 0;
    const msgs: string[] = [];

    // Pair Plus
    if (pairPlus > 0) {
      const ppWin = PAIR_PLUS_PAY[ph.rank];
      if (ppWin > 0) {
        const ppPayout = pairPlus * (ppWin + 1);
        win += ppPayout;
        msgs.push(`Pair Plus: ${ph.rank} +${ppPayout.toLocaleString()}`);
      } else {
        msgs.push('Pair Plus: no win');
      }
    }

    if (!dealerQualifies) {
      // Ante returned, Play bet push
      win += ante * 2; // ante + play returned
      const bonus = ANTE_BONUS[ph.rank];
      if (bonus > 0) { win += ante * bonus; msgs.push(`Ante Bonus: ${bonus}:1`); }
      msgs.unshift('Dealer doesn\'t qualify! Ante wins, Play pushed.');
    } else {
      const playerWins = ph.score > dh.score || (ph.score === dh.score && ph.highCard > dh.highCard);
      const tie = ph.score === dh.score && ph.highCard === dh.highCard;
      if (playerWins) {
        win += ante * 2 + ante * 2; // ante + play each pay 1:1
        const bonus = ANTE_BONUS[ph.rank];
        if (bonus > 0) { win += ante * bonus; msgs.push(`Ante Bonus: ${bonus}:1`); }
        msgs.unshift(`You win! ${ph.rank} beats ${dh.rank}`);
      } else if (tie) {
        win += ante * 2; // push
        msgs.unshift('Push!');
      } else {
        msgs.unshift(`Dealer wins with ${dh.rank}.`);
      }
    }

    if (win > 0) {
      addWinRef.current(win);
      if (win >= ante * 10) playBigWin();
      else if (win >= ante * 3) playMediumWin();
      else playSmallWin();
    } else {
      playNoWin();
    }
    setWinAmount(win); setResult(msgs.join(' | ')); setPhase('result');
  };

  const commitAnte = () => { let n = Number(anteInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setAnte(n); setAnteInput(String(n)); };
  const commitPP = () => { let n = Number(ppInput); if(n<0)n=0; if(n>config.maxBet)n=config.maxBet; setPairPlus(n); setPpInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table">
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="hand-label">Dealer</div>
            <div className="hand-area">{dealerCards.map((c,i) => <PlayingCard key={i} card={c} className="deal-anim" />)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="hand-label">Your Hand</div>
            <div className="hand-area">{playerCards.map((c,i) => <PlayingCard key={i} card={c} className="deal-anim" />)}</div>
          </div>
        </div>
      </div>
      {result && <div className={`casino-result ${winAmount > 0 ? 'win' : (result.includes('Push') ? 'push' : 'lose')}`}>{result}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Ante</span>
              <input className="casino-bet-input" value={anteInput}
                onChange={e => setAnteInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitAnte} onKeyDown={e => e.key==='Enter'&&commitAnte()} />
            </div>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Pair+</span>
              <input className="casino-bet-input" value={ppInput}
                onChange={e => setPpInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitPP} onKeyDown={e => e.key==='Enter'&&commitPP()} />
            </div>
            <button className="casino-btn primary" onClick={deal} disabled={balance < ante + pairPlus}>Deal</button>
          </>
        )}
        {phase === 'dealt' && (
          <>
            <button className="casino-btn primary" onClick={play} disabled={balance < ante}>Play (Raise)</button>
            <button className="casino-btn danger" onClick={fold}>Fold</button>
          </>
        )}
      </div>
    </div>
  );
}
