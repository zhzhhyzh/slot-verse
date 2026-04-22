import { useMemo } from 'react';
import type { SlotSymbol, SpinState } from '../utils/types';
import './SlotReel.css';

interface Props {
  symbols: string[];
  allSymbols: SlotSymbol[];
  reelIndex: number;
  spinState: SpinState;
  winPositions?: Set<number>;
}

export function SlotReel({ symbols, allSymbols, reelIndex, spinState, winPositions }: Props) {
  const symbolMap = useMemo(() => new Map(allSymbols.map(s => [s.id, s])), [allSymbols]);
  const isSpinning = spinState === 'spinning';
  const isRevealing = spinState === 'revealing';

  // Generate extra random symbols for the spinning animation
  const spinSymbols = useMemo(() => {
    const extra: SlotSymbol[] = [];
    for (let i = 0; i < 12; i++) {
      extra.push(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }
    return extra;
  }, [allSymbols, isSpinning]); // eslint-disable-line react-hooks/exhaustive-deps

  const reelDelay = reelIndex * 0.15;
  const stopDelay = reelIndex * 0.3;

  return (
    <div className="slot-reel-container">
      <div
        className={`slot-reel ${isSpinning ? 'spinning' : ''} ${isRevealing ? 'revealing' : ''}`}
        style={{
          animationDelay: isSpinning ? `${reelDelay}s` : `${stopDelay}s`,
        }}
      >
        {isSpinning && spinSymbols.map((sym, i) => (
          <div key={`spin-${i}`} className="slot-symbol blur">
            <span className="symbol-icon">{sym.svg}</span>
          </div>
        ))}
        {!isSpinning && symbols.map((symId, rowIdx) => {
          const sym = symbolMap.get(symId);
          const isWin = winPositions?.has(rowIdx);
          return (
            <div
              key={`${symId}-${rowIdx}`}
              className={`slot-symbol ${isWin ? 'winning' : ''}`}
              style={{ animationDelay: `${stopDelay + rowIdx * 0.1}s` }}
            >
              <span className="symbol-icon" style={{ filter: sym?.isWild ? 'drop-shadow(0 0 8px gold)' : undefined }}>
                {sym?.svg ?? '?'}
              </span>
              {sym?.isWild && <span className="wild-badge">WILD</span>}
              {sym?.isScatter && <span className="scatter-badge">SCATTER</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
