import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allGames, getGamesByCategory } from '../games/registry';
import type { GameCategory } from '../utils/gameTypes';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../utils/gameTypes';
import type { SlotGameConfig } from '../utils/types';
import { playHover, playClick, playNavigate, startMusic } from '../utils/soundManager';
import './Lobby.css';

const CATEGORIES: ('all' | GameCategory)[] = ['all', 'slots', 'cards', 'table', 'specialty'];

export function Lobby() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | GameCategory>('all');

  const games = activeCategory === 'all' ? allGames : getGamesByCategory(activeCategory);

  const handleCardClick = (gameId: string) => {
    playNavigate();
    startMusic();
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="lobby">
      <div className="lobby-hero">
        <h2>Welcome to SlotVerse</h2>
        <p>Choose your game and try your luck!</p>
      </div>
      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => { playClick(); setActiveCategory(cat); }}>
            {cat === 'all' ? '🎪 All Games' : `${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
          </button>
        ))}
      </div>
      <div className="game-grid">
        {games.map((game, index) => {
          const isSlot = game.type === 'slot';
          const slotConfig = isSlot ? (game as SlotGameConfig) : null;
          return (
            <div
              key={game.id}
              className="game-card"
              style={{ borderColor: game.themeColor, animationDelay: `${index * 0.08}s` } as React.CSSProperties}
              onClick={() => handleCardClick(game.id)}
              onMouseEnter={() => playHover()}
            >
              <div className="game-card-thumbnail" style={{ background: `linear-gradient(135deg, ${game.themeColor}22, ${game.themeColor}44)` }}>
                <span className="game-card-icon">{game.thumbnail}</span>
              </div>
              <div className="game-card-info">
                <h3>{game.name}</h3>
                <p className="game-card-desc">{game.description}</p>
                <div className="game-card-meta">
                  {isSlot && slotConfig ? (
                    <>
                      <span>{slotConfig.reels}x{slotConfig.rows}</span>
                      <span>{slotConfig.paylines.length} lines</span>
                    </>
                  ) : (
                    <span className="game-type-badge" style={{ borderColor: game.themeColor, color: game.themeColor }}>
                      {CATEGORY_LABELS[game.category]}
                    </span>
                  )}
                  <span>Bet: {game.minBet}-{game.maxBet.toLocaleString()}</span>
                </div>
                {isSlot && slotConfig && (
                  <div className="game-card-features">
                    {slotConfig.features.map(f => (
                      <span key={f} className="feature-tag" style={{ borderColor: game.themeColor, color: game.themeColor }}>
                        {f.replace(/-/g, ' ')}
                      </span>
                    ))}
                    {slotConfig.features.length === 0 && (
                      <span className="feature-tag classic">classic</span>
                    )}
                  </div>
                )}
              </div>
              <button className="play-btn" style={{ background: game.themeColor }}>
                Play Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
