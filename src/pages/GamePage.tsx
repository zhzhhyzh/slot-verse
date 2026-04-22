import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../games/registry';
import { useSlotMachine } from '../hooks/useSlotMachine';
import { useCredit } from '../context/CreditContext';
import { SlotReel } from '../components/SlotReel';
import { PaytableModal } from '../components/PaytableModal';
import {
  playSpinStart, playReelStop, playWinSound, playNoWin,
  playClick, startMusic, playCoinSound,
} from '../utils/soundManager';
import './GamePage.css';

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const config = getGameById(gameId || '');

  if (!config) {
    return (
      <div className="game-not-found">
        <h2>Game not found</h2>
        <button onClick={() => navigate('/')}>Back to Lobby</button>
      </div>
    );
  }

  return <GamePlayInner config={config} />;
}

function GamePlayInner({ config }: { config: import('../utils/types').SlotGameConfig }) {
  const { balance, placeBet, addWinnings } = useCredit();
  const { grid, spinState, lastResult, spin } = useSlotMachine(config);
  const MAX_BET = 20000;
  const [bet, setBet] = useState(config.minBet);
  const [betInput, setBetInput] = useState(String(config.minBet));
  const [showPaytable, setShowPaytable] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [autoSpinRemaining, setAutoSpinRemaining] = useState(0);
  const [idlePulse, setIdlePulse] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs for values needed inside the spin callback to avoid stale closures
  const addWinningsRef = useRef(addWinnings);
  addWinningsRef.current = addWinnings;
  const betRef = useRef(bet);
  betRef.current = bet;

  // Start music on first interaction with game page
  useEffect(() => {
    const handleFirstClick = () => {
      startMusic();
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  // Idle pulse animation — triggers after 5s of no activity
  useEffect(() => {
    if (spinState === 'idle') {
      idleTimerRef.current = setTimeout(() => setIdlePulse(true), 5000);
    } else {
      setIdlePulse(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [spinState]);

  // Play reel stop sounds during reveal
  useEffect(() => {
    if (spinState === 'revealing') {
      for (let i = 0; i < config.reels; i++) {
        playReelStop(i);
      }
    }
  }, [spinState, config.reels]);

  const winPositionsByReel = useMemo(() => {
    if (!lastResult || lastResult.totalWin === 0) return new Map<number, Set<number>>();
    const map = new Map<number, Set<number>>();
    for (const win of lastResult.winnings) {
      for (const pos of win.positions) {
        if (!map.has(pos.reel)) map.set(pos.reel, new Set());
        map.get(pos.reel)!.add(pos.row);
      }
    }
    return map;
  }, [lastResult]);

  // Stable callback that handles win results — called once from inside the hook
  const onSpinResult = useCallback((result: import('../utils/types').SpinResult) => {
    if (result.totalWin > 0) {
      addWinningsRef.current(result.totalWin);
      setLastWinAmount(result.totalWin);
      setShowWinPopup(true);
      setShowConfetti(true);
      // Play win sound based on win magnitude
      playWinSound(result.totalWin, betRef.current);
      setTimeout(() => setShowWinPopup(false), 2500);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setLastWinAmount(0);
      setShowWinPopup(false);
      playNoWin();
    }
  }, []);

  const handleSpin = useCallback(() => {
    if (spinState !== 'idle') return;
    if (balance < bet) return;
    const ok = placeBet(bet);
    if (!ok) return;
    setLastWinAmount(0);
    setShowWinPopup(false);
    setShowConfetti(false);
    playSpinStart();
    spin(bet, onSpinResult);
  }, [spinState, balance, bet, placeBet, spin, onSpinResult]);

  // Auto-spin logic
  useEffect(() => {
    if (autoSpinRemaining > 0 && spinState === 'idle') {
      const timer = setTimeout(() => {
        if (balance >= bet) {
          setAutoSpinRemaining(prev => prev - 1);
          handleSpin();
        } else {
          setAutoSpinRemaining(0);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoSpinRemaining, spinState, balance, bet, handleSpin]);

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setBetInput(val);
  };

  const commitBet = () => {
    let num = Number(betInput);
    if (!num || num < config.minBet) num = config.minBet;
    if (num > MAX_BET) num = MAX_BET;
    setBet(num);
    setBetInput(String(num));
  };

  const handleBetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitBet();
      (e.target as HTMLInputElement).blur();
    }
  };

  const startAutoSpin = () => {
    if (autoSpinCount > 0) {
      playClick();
      setAutoSpinRemaining(autoSpinCount);
    }
  };

  const stopAutoSpin = () => {
    playClick();
    setAutoSpinRemaining(0);
  };

  const isSpinDisabled = spinState !== 'idle' || balance < bet;

  return (
    <div className={`game-page ${spinState === 'win-display' ? 'win-state' : ''}`} style={{ '--theme-color': config.themeColor } as React.CSSProperties}>
      <div className="game-title-bar">
        <h2>{config.thumbnail} {config.name}</h2>
        <button className="info-btn" onClick={() => { playClick(); setShowPaytable(true); }}>
          Paytable
        </button>
      </div>

      {/* Confetti overlay */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                backgroundColor: ['#f0d078', '#d4a94a', '#b8943c', '#c0c0c0', '#a0a0a0', '#e8d5a0'][i % 6],
              }}
            />
          ))}
        </div>
      )}

      {/* Slot Machine */}
      <div className={`slot-machine ${spinState === 'spinning' ? 'is-spinning' : ''} ${spinState === 'win-display' ? 'is-winning' : ''} ${idlePulse ? 'idle-pulse' : ''}`}>
        <div className="slot-frame" style={{ borderColor: config.themeColor }}>
          <div className="reels-container">
            {grid.map((reelSymbols, reelIdx) => (
              <SlotReel
                key={reelIdx}
                symbols={reelSymbols}
                allSymbols={config.symbols}
                reelIndex={reelIdx}
                spinState={spinState}
                winPositions={winPositionsByReel.get(reelIdx)}
              />
            ))}
          </div>
        </div>

        {/* Win Popup */}
        {showWinPopup && lastWinAmount > 0 && (
          <div className="win-popup">
            <span className="win-label">WIN!</span>
            <span className="win-amount">{lastWinAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Free Spins Indicator */}
      {lastResult && lastResult.freeSpinsAwarded > 0 && (
        <div className="free-spins-banner">
          Free Spins Awarded: {lastResult.freeSpinsAwarded}!
        </div>
      )}

      {/* Win Details */}
      {lastResult && lastResult.winnings.length > 0 && (
        <div className="win-details">
          {lastResult.winnings.map((w, i) => {
            const sym = config.symbols.find(s => s.id === w.symbolId);
            return (
              <span key={i} className="win-detail-item">
                {sym?.svg} x{w.count} = {w.payout.toLocaleString()}
              </span>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="game-controls">
        <div className="bet-controls">
          <span className="bet-label">BET</span>
          <input
            type="text"
            inputMode="numeric"
            className="bet-input"
            value={betInput}
            onChange={handleBetInputChange}
            onBlur={commitBet}
            onKeyDown={handleBetKeyDown}
            disabled={spinState !== 'idle'}
            maxLength={5}
          />
          <span className="bet-range">Min {config.minBet} / Max {MAX_BET.toLocaleString()}</span>
        </div>

        <button
          className={`spin-btn ${spinState === 'spinning' ? 'spinning' : ''} ${idlePulse ? 'idle-glow' : ''}`}
          onClick={handleSpin}
          disabled={isSpinDisabled}
          style={{ background: isSpinDisabled ? '#333' : config.themeColor }}
        >
          {spinState === 'spinning' ? 'SPINNING...' : spinState === 'revealing' ? 'REVEALING...' : 'SPIN'}
        </button>

        <div className="auto-spin-controls">
          <select
            value={autoSpinCount}
            onChange={e => setAutoSpinCount(Number(e.target.value))}
            disabled={autoSpinRemaining > 0}
          >
            <option value={0}>Auto</option>
            <option value={10}>10x</option>
            <option value={25}>25x</option>
            <option value={50}>50x</option>
            <option value={100}>100x</option>
          </select>
          {autoSpinRemaining > 0 ? (
            <button className="auto-btn stop" onClick={stopAutoSpin}>
              Stop ({autoSpinRemaining})
            </button>
          ) : (
            <button className="auto-btn" onClick={startAutoSpin} disabled={autoSpinCount === 0 || balance < bet}>
              Start
            </button>
          )}
        </div>
      </div>

      {balance < config.minBet && (
        <div className="low-balance-warning">
          Insufficient credits! Add more to continue playing.
        </div>
      )}

      <PaytableModal config={config} isOpen={showPaytable} onClose={() => setShowPaytable(false)} />
    </div>
  );
}
