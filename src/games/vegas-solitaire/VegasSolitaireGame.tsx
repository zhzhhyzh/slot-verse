import { useState, useRef, useCallback, useEffect } from 'react';
import type { BaseGameConfig } from '../../utils/gameTypes';
import { useCredit } from '../../context/CreditContext';
import { createDeck, shuffleDeck, type Card, type Suit, SUIT_SYMBOLS, SUIT_COLORS, rankOrder } from '../../utils/cardDeck';
import { playCardDeal, playCardFlip, playSmallWin, playMediumWin, playNoWin, playClick } from '../../utils/soundManager';
import '../../styles/casino-shared.css';

type Phase = 'betting' | 'playing' | 'result';

const FOUNDATION_ORDER = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const isRed = (s: Suit) => s === 'hearts' || s === 'diamonds';

interface GameState {
  tableau: Card[][]; // 7 columns
  foundation: Card[][]; // 4 piles (hearts, diamonds, clubs, spades)
  stock: Card[];
  waste: Card[];
  moves: number;
  earned: number;
}

function initGame(): GameState {
  const deck = shuffleDeck(createDeck());
  const tableau: Card[][] = [];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    const pile: Card[] = [];
    for (let row = 0; row <= col; row++) {
      pile.push({ ...deck[idx], faceUp: row === col });
      idx++;
    }
    tableau.push(pile);
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
  return { tableau, foundation: [[], [], [], []], stock, waste: [], moves: 0, earned: 0 };
}

function canPlaceOnTableau(card: Card, target: Card[]): boolean {
  if (target.length === 0) return card.rank === 'K';
  const top = target[target.length - 1];
  if (!top.faceUp) return false;
  return isRed(card.suit) !== isRed(top.suit) && rankOrder(card.rank) === rankOrder(top.rank) - 1;
}

function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 'A';
  const top = pile[pile.length - 1];
  return card.suit === top.suit && FOUNDATION_ORDER.indexOf(card.rank) === FOUNDATION_ORDER.indexOf(top.rank) + 1;
}

export function VegasSolitaireGame({ config }: { config: BaseGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [gs, setGs] = useState<GameState>(initGame);
  const [selected, setSelected] = useState<{ source: string; idx: number; cardIdx: number } | null>(null);
  const addWinRef = useRef(addWinnings);
  addWinRef.current = addWinnings;
  const perCard = Math.floor(bet / 5);

  const startGame = () => {
    if (balance < bet) return;
    if (!placeBet(bet)) return;
    playClick();
    setGs(initGame());
    setPhase('playing');
    setSelected(null);
    playCardDeal();
  };

  const drawStock = () => {
    if (phase !== 'playing') return;
    playCardFlip();
    const s = { ...gs };
    if (s.stock.length === 0) {
      // Flip waste back to stock (only once in Vegas rules)
      s.stock = [...s.waste].reverse().map(c => ({ ...c, faceUp: false }));
      s.waste = [];
    } else {
      const card = s.stock.pop()!;
      card.faceUp = true;
      s.waste = [...s.waste, card];
    }
    s.moves++;
    setGs({ ...s });
    setSelected(null);
  };

  const tryAutoFoundation = useCallback((state: GameState, card: Card, removeFrom: () => GameState): GameState | null => {
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, state.foundation[f])) {
        const ns = removeFrom();
        ns.foundation[f] = [...ns.foundation[f], card];
        ns.earned += perCard;
        ns.moves++;
        addWinRef.current(perCard);
        playSmallWin();
        return ns;
      }
    }
    return null;
  }, [perCard]);

  const handleCardClick = (source: string, idx: number, cardIdx: number) => {
    if (phase !== 'playing') return;
    playClick();

    // Double-click auto-foundation
    if (selected && selected.source === source && selected.idx === idx && selected.cardIdx === cardIdx) {
      let card: Card;
      if (source === 'waste') {
        card = gs.waste[gs.waste.length - 1];
        const res = tryAutoFoundation(gs, card, () => {
          const ns = { ...gs }; ns.waste = gs.waste.slice(0, -1); return ns;
        });
        if (res) { setGs(res); setSelected(null); return; }
      } else if (source === 'tableau') {
        const pile = gs.tableau[idx];
        card = pile[cardIdx];
        if (cardIdx === pile.length - 1) {
          const res = tryAutoFoundation(gs, card, () => {
            const ns = { ...gs };
            const np = [...pile]; np.pop();
            if (np.length > 0 && !np[np.length-1].faceUp) np[np.length-1] = { ...np[np.length-1], faceUp: true };
            ns.tableau = [...gs.tableau]; ns.tableau[idx] = np;
            return ns;
          });
          if (res) { setGs(res); setSelected(null); return; }
        }
      }
      setSelected(null);
      return;
    }

    // Select or move
    if (!selected) {
      setSelected({ source, idx, cardIdx });
      return;
    }

    // Attempt move to tableau
    if (source === 'tableau') {
      const targetPile = gs.tableau[idx];
      let movingCards: Card[];
      let newState = { ...gs };

      if (selected.source === 'waste') {
        movingCards = [gs.waste[gs.waste.length - 1]];
        if (canPlaceOnTableau(movingCards[0], targetPile)) {
          newState.waste = gs.waste.slice(0, -1);
          newState.tableau = [...gs.tableau];
          newState.tableau[idx] = [...targetPile, ...movingCards];
          newState.moves++;
          playCardDeal();
          setGs(newState); setSelected(null); return;
        }
      } else if (selected.source === 'tableau') {
        const srcPile = gs.tableau[selected.idx];
        movingCards = srcPile.slice(selected.cardIdx);
        if (movingCards.length > 0 && canPlaceOnTableau(movingCards[0], targetPile)) {
          newState.tableau = [...gs.tableau];
          const np = srcPile.slice(0, selected.cardIdx);
          if (np.length > 0 && !np[np.length-1].faceUp) np[np.length-1] = { ...np[np.length-1], faceUp: true };
          newState.tableau[selected.idx] = np;
          newState.tableau[idx] = [...targetPile, ...movingCards];
          newState.moves++;
          playCardDeal();
          setGs(newState); setSelected(null); return;
        }
      }
    }

    setSelected({ source, idx, cardIdx });
  };

  const [resultMsg, setResultMsg] = useState('');

  const cashOut = () => {
    playClick();
    setResultMsg(`Game over. Earned: ${gs.earned.toLocaleString()} credits in ${gs.moves} moves.`);
    setPhase('result');
  };

  // Check for win
  useEffect(() => {
    if (phase === 'playing' && gs.foundation.every(f => f.length === 13)) {
      playMediumWin();
      setResultMsg(`You won! All cards placed. Earned: ${gs.earned.toLocaleString()}`);
      setPhase('result');
    }
  }, [gs, phase]);

  const commitBet = () => { let n = Number(betInput); if(!n||n<config.minBet)n=config.minBet; if(n>config.maxBet)n=config.maxBet; setBet(n); setBetInput(String(n)); };

  return (
    <div className="casino-game">
      <h2 className="casino-game-title">{config.thumbnail} {config.name}</h2>
      {phase === 'playing' && (
        <div style={{ fontSize: 13, color: '#8a7a5a', marginBottom: 8 }}>
          Earned: <span style={{ color: '#f0d078' }}>{gs.earned.toLocaleString()}</span> | Moves: {gs.moves} | Per card: {perCard}
        </div>
      )}
      {phase === 'playing' && (
        <div style={{ width: '100%', maxWidth: 700 }}>
          {/* Foundation + Stock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div onClick={drawStock} style={{ width: 56, height: 78, borderRadius: 6, border: '2px dashed rgba(184,148,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: gs.stock.length > 0 ? 'linear-gradient(145deg, #1a1930, #12111a)' : 'transparent', color: '#8a7a5a', fontSize: 11 }}>
                {gs.stock.length > 0 ? `${gs.stock.length}` : '↺'}
              </div>
              {gs.waste.length > 0 ? (
                <div onClick={() => handleCardClick('waste', 0, gs.waste.length - 1)} style={{ cursor: 'pointer' }}>
                  <MiniCard card={gs.waste[gs.waste.length - 1]} sel={selected?.source === 'waste'} />
                </div>
              ) : <div style={{ width: 56, height: 78 }} />}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {gs.foundation.map((f, i) => (
                <div key={i} style={{ width: 56, height: 78, borderRadius: 6, border: '1px solid rgba(184,148,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7a5a', fontSize: 20, background: 'rgba(0,0,0,0.2)' }}
                  onClick={() => { if (selected) handleCardClick('foundation', i, 0); }}>
                  {f.length > 0 ? <MiniCard card={f[f.length-1]} sel={false} /> : (['♥','♦','♣','♠'][i])}
                </div>
              ))}
            </div>
          </div>
          {/* Tableau */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            {gs.tableau.map((pile, col) => (
              <div key={col} style={{ flex: 1, position: 'relative', minHeight: 100 }}>
                {pile.length === 0 && (
                  <div onClick={() => handleCardClick('tableau', col, 0)} style={{ width: '100%', height: 78, borderRadius: 6, border: '1px dashed rgba(184,148,60,0.15)', cursor: 'pointer' }} />
                )}
                {pile.map((card, ci) => (
                  <div key={ci} style={{ position: ci > 0 ? 'relative' : 'relative', marginTop: ci > 0 ? -58 : 0, zIndex: ci, cursor: card.faceUp ? 'pointer' : 'default' }}
                    onClick={() => card.faceUp && handleCardClick('tableau', col, ci)}>
                    <MiniCard card={card} sel={selected?.source === 'tableau' && selected.idx === col && ci >= selected.cardIdx} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {resultMsg && <div className={`casino-result ${gs.earned > bet ? 'win' : gs.earned > 0 ? 'push' : 'lose'}`}>{resultMsg}</div>}
      <div className="casino-controls">
        {(phase === 'betting' || phase === 'result') && (
          <>
            <div className="casino-bet-area">
              <span className="casino-bet-label">Buy-in</span>
              <input className="casino-bet-input" value={betInput}
                onChange={e => setBetInput(e.target.value.replace(/\D/g,''))}
                onBlur={commitBet} onKeyDown={e => e.key==='Enter'&&commitBet()} />
            </div>
            <button className="casino-btn primary" onClick={startGame} disabled={balance < bet}>New Game</button>
          </>
        )}
        {phase === 'playing' && <button className="casino-btn danger" onClick={cashOut}>Cash Out</button>}
      </div>
    </div>
  );
}

function MiniCard({ card, sel }: { card: Card; sel: boolean }) {
  if (!card.faceUp) {
    return <div style={{ width: 56, height: 78, borderRadius: 6, background: 'linear-gradient(145deg, #1a1930, #12111a)', border: '1px solid rgba(184,148,60,0.3)', flexShrink: 0 }} />;
  }
  const color = SUIT_COLORS[card.suit];
  return (
    <div style={{ width: 56, height: 78, borderRadius: 6, background: 'linear-gradient(145deg, #f5f0e8, #e8e0d0)', border: sel ? '2px solid #d4a94a' : '1px solid rgba(184,148,60,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: sel ? '0 0 10px rgba(184,148,60,0.4)' : '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.15s' }}>
      <span>{card.rank}</span>
      <span style={{ fontSize: 16 }}>{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}
