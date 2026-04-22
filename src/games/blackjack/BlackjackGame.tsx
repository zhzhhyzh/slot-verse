import { useState, useCallback, useRef } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { PlayingCard } from '../../components/PlayingCard';
import { Shoe, type Card, cardValue } from '../../utils/cardDeck';
import { playCardDeal, playCardFlip, playSmallWin, playMediumWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'playing' | 'dealer-turn' | 'result';

function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (!c.faceUp) continue;
    if (c.rank === 'A') { aces++; total += 11; }
    else total += cardValue(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 };
}

function totalStr(cards: Card[]): string {
  const { total, soft } = handTotal(cards);
  if (cards.some(c => !c.faceUp)) return total + ' + ?';
  return soft && total <= 21 ? `Soft ${total}` : String(total);
}

const shoe = new Shoe(6);

export function BlackjackGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [canDouble, setCanDouble] = useState(false);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;

  const deal = useCallback(() => {
    if (balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    if (shoe.needsReshuffle) shoe.reshuffle();
    const p = [shoe.draw(), shoe.draw()];
    const d = [shoe.draw(), shoe.draw(false)];
    setPlayerCards(p);
    setDealerCards(d);
    setResult('');
    setWinAmount(0);
    setCanDouble(balance >= bet);
    playCardDeal();
    // Check for natural blackjack
    const pt = handTotal(p).total;
    if (pt === 21) {
      setTimeout(() => finishRound(p, d), 600);
    } else {
      setPhase('playing');
    }
  }, [balance, bet, placeBet]);

  const hit = useCallback(() => {
    playCardDeal();
    const newCards = [...playerCards, shoe.draw()];
    setPlayerCards(newCards);
    setCanDouble(false);
    if (handTotal(newCards).total >= 21) {
      setTimeout(() => stand(newCards), 400);
    }
  }, [playerCards]);

  const stand = useCallback((cards?: Card[]) => {
    const pc = cards || playerCards;
    setPhase('dealer-turn');
    // Reveal dealer hole card
    const revealed = dealerCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(revealed);
    playCardFlip();
    // Dealer draws
    let dc = [...revealed];
    const drawDealer = (idx: number) => {
      if (handTotal(dc).total < 17) {
        setTimeout(() => {
          dc = [...dc, shoe.draw()];
          setDealerCards([...dc]);
          playCardDeal();
          drawDealer(idx + 1);
        }, 500);
      } else {
        setTimeout(() => finishRound(pc, dc), 400);
      }
    };
    drawDealer(0);
  }, [playerCards, dealerCards]);

  const doubleDown = useCallback(() => {
    if (!placeBet(bet)) return;
    playClick();
    const newCards = [...playerCards, shoe.draw()];
    setPlayerCards(newCards);
    setCanDouble(false);
    setTimeout(() => {
      setPhase('dealer-turn');
      const revealed = dealerCards.map(c => ({ ...c, faceUp: true }));
      setDealerCards(revealed);
      playCardFlip();
      let dc = [...revealed];
      const drawDealer = () => {
        if (handTotal(dc).total < 17) {
          setTimeout(() => {
            dc = [...dc, shoe.draw()];
            setDealerCards([...dc]);
            playCardDeal();
            drawDealer();
          }, 500);
        } else {
          setTimeout(() => finishRound(newCards, dc, true), 400);
        }
      };
      drawDealer();
    }, 400);
  }, [playerCards, dealerCards, bet, placeBet]);

  const finishRound = (pc: Card[], dc: Card[], doubled = false) => {
    const pt = handTotal(pc).total;
    const dt = handTotal(dc).total;
    const totalBet = doubled ? bet * 2 : bet;
    const isPlayerBJ = pc.length === 2 && pt === 21;
    const isDealerBJ = dc.length === 2 && dt === 21;

    let msg = '';
    let win = 0;

    if (pt > 21) {
      msg = 'Bust! You lose.';
      playNoWin();
    } else if (isPlayerBJ && !isDealerBJ) {
      win = Math.floor(totalBet * 2.5);
      msg = `Blackjack! You win ${win.toLocaleString()}!`;
      playMediumWin();
    } else if (dt > 21) {
      win = totalBet * 2;
      msg = `Dealer busts! You win ${win.toLocaleString()}!`;
      playSmallWin();
    } else if (pt > dt) {
      win = totalBet * 2;
      msg = `You win ${win.toLocaleString()}!`;
      playSmallWin();
    } else if (pt === dt) {
      win = totalBet;
      msg = 'Push! Bet returned.';
    } else {
      msg = 'Dealer wins.';
      playNoWin();
    }

    if (win > 0) addWinRef.current(win);
    setWinAmount(win);
    setResult(msg);
    setPhase('result');
  };

  const commitBet = () => {
    let n = Number(betInput);
    if (!n || n < config.minBet) n = config.minBet;
    if (n > config.maxBet) n = config.maxBet;
    setBet(n);
    setBetInput(String(n));
  };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      <div className="casino-table">
        <div>
          <div className="hand-label">Dealer {dealerCards.length > 0 && `(${totalStr(dealerCards)})`}</div>
          <div className="hand-area">
            {dealerCards.map((c, i) => <PlayingCard key={i} card={c} className="deal-anim" />)}
            {dealerCards.length === 0 && <span style={{ color: '#5a7a5a' }}>Waiting...</span>}
          </div>
        </div>
        <div style={{ margin: '20px 0', borderTop: '1px solid rgba(184,148,60,0.15)' }} />
        <div>
          <div className="hand-label">Your Hand {playerCards.length > 0 && `(${totalStr(playerCards)})`}</div>
          <div className="hand-area">
            {playerCards.map((c, i) => <PlayingCard key={i} card={c} className="deal-anim" />)}
            {playerCards.length === 0 && <span style={{ color: '#5a7a5a' }}>Place your bet</span>}
          </div>
        </div>
      </div>

      {result && (
        <div className={`casino-result ${winAmount > 0 ? (result.includes('Push') ? 'push' : 'win') : 'lose'}`}>
          {result}
        </div>
      )}

      <div className="casino-controls">
        {phase === 'betting' || phase === 'result' ? (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Bet</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g, ''))}
                onBlur={commitBet} onKeyDown={e => e.key === 'Enter' && commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={deal} disabled={balance < bet}>Deal</button>
          </>
        ) : phase === 'playing' ? (
          <>
            <button className="casino-btn primary" onClick={hit}>Hit</button>
            <button className="casino-btn" onClick={() => stand()}>Stand</button>
            {canDouble && <button className="casino-btn" onClick={doubleDown}>Double</button>}
          </>
        ) : (
          <span className="casino-status">Dealer drawing...</span>
        )}
      </div>
    </div>
  );
}
