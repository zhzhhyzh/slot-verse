import type { SlotGameConfig } from '../utils/types';
import './PaytableModal.css';

interface Props {
  config: SlotGameConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function PaytableModal({ config, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  // Group payouts by symbol
  const symbolPayouts = new Map<string, { count: number; multiplier: number }[]>();
  for (const entry of config.payoutTable) {
    if (!symbolPayouts.has(entry.symbolId)) {
      symbolPayouts.set(entry.symbolId, []);
    }
    symbolPayouts.get(entry.symbolId)!.push({ count: entry.count, multiplier: entry.multiplier });
  }

  return (
    <div className="paytable-overlay" onClick={onClose}>
      <div className="paytable-content" onClick={e => e.stopPropagation()}>
        <button className="paytable-close" onClick={onClose}>&times;</button>
        <h2>Paytable - {config.name}</h2>

        <div className="paytable-section">
          <h3>Symbol Payouts</h3>
          <p className="paytable-note">Multiplier applied to bet-per-line</p>
          <div className="paytable-grid">
            {config.symbols.map(sym => {
              const payouts = symbolPayouts.get(sym.id);
              if (!payouts) return null;
              return (
                <div key={sym.id} className="paytable-row">
                  <div className="paytable-symbol">
                    <span className="pt-icon">{sym.svg}</span>
                    <span className="pt-name">{sym.name}</span>
                  </div>
                  <div className="paytable-payouts">
                    {payouts
                      .sort((a, b) => a.count - b.count)
                      .map(p => (
                        <span key={p.count} className="pt-payout">
                          x{p.count}: <strong>{p.multiplier}x</strong>
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="paytable-section">
          <h3>Paylines ({config.paylines.length})</h3>
          <div className="payline-diagrams">
            {config.paylines.map(pl => (
              <div key={pl.id} className="payline-diagram">
                <span className="pl-id" style={{ color: pl.color }}>#{pl.id}</span>
                <div className="pl-grid">
                  {Array.from({ length: config.rows }, (_, row) => (
                    <div key={row} className="pl-row">
                      {pl.positions.map((pos, reel) => (
                        <div
                          key={reel}
                          className={`pl-cell ${pos === row ? 'active' : ''}`}
                          style={pos === row ? { background: pl.color } : undefined}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {config.features.length > 0 && (
          <div className="paytable-section">
            <h3>Special Features</h3>
            <div className="feature-list">
              {config.features.includes('wilds') && (
                <div className="feature-item">
                  <strong>Wild Symbol</strong> - Substitutes for any symbol except Scatter to complete winning combinations.
                </div>
              )}
              {config.features.includes('expanding-wilds') && (
                <div className="feature-item">
                  <strong>Expanding Wilds</strong> - Wild symbols expand to cover the entire reel when they appear!
                </div>
              )}
              {config.features.includes('sticky-wilds') && (
                <div className="feature-item">
                  <strong>Sticky Wilds</strong> - Wild symbols stick in place and remain for the next re-spin.
                </div>
              )}
              {config.features.includes('free-spins') && (
                <div className="feature-item">
                  <strong>Free Spins</strong> - 3+ Scatter symbols trigger free spins! 3=5 spins, 4=10 spins, 5=15 spins.
                </div>
              )}
              {config.features.includes('scatters') && (
                <div className="feature-item">
                  <strong>Scatter</strong> - Scatter wins pay on total bet regardless of payline position.
                </div>
              )}
              {config.features.includes('multiplier') && (
                <div className="feature-item">
                  <strong>Multiplier</strong> - Random multipliers up to 5x can be applied to winning spins!
                </div>
              )}
              {config.features.includes('re-spins') && (
                <div className="feature-item">
                  <strong>Re-Spins</strong> - Sticky wilds trigger a free re-spin for another chance to win.
                </div>
              )}
              {config.features.includes('pick-bonus') && (
                <div className="feature-item">
                  <strong>Pick-a-Prize Bonus</strong> - 3+ Scatters trigger a bonus round where you pick hidden prizes!
                </div>
              )}
            </div>
          </div>
        )}

        <div className="paytable-section">
          <h3>Game Info</h3>
          <div className="game-info-table">
            <div><span>Reels:</span> <span>{config.reels}</span></div>
            <div><span>Rows:</span> <span>{config.rows}</span></div>
            <div><span>Paylines:</span> <span>{config.paylines.length}</span></div>
            <div><span>Min Bet:</span> <span>{config.minBet}</span></div>
            <div><span>Max Bet:</span> <span>{config.maxBet.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
