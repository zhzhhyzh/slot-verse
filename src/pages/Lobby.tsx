import { useNavigate } from 'react-router-dom';
import { allGames } from '../games/registry';
import { playHover, playClick, playNavigate, startMusic } from '../utils/soundManager';
import './Lobby.css';

export function Lobby() {
  const navigate = useNavigate();

  const handleCardClick = (gameId: string) => {
    playNavigate();
    startMusic();
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="lobby">
      <div className="lobby-hero">
        <h2>Welcome to SlotVerse</h2>
        <p>Choose your game and spin to win!</p>
      </div>
      <div className="game-grid">
        {allGames.map((game, index) => (
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
                <span>{game.reels}x{game.rows}</span>
                <span>{game.paylines.length} lines</span>
                <span>Bet: {game.minBet}-{game.maxBet.toLocaleString()}</span>
              </div>
              <div className="game-card-features">
                {game.features.map(f => (
                  <span key={f} className="feature-tag" style={{ borderColor: game.themeColor, color: game.themeColor }}>
                    {f.replace(/-/g, ' ')}
                  </span>
                ))}
                {game.features.length === 0 && (
                  <span className="feature-tag classic">classic</span>
                )}
              </div>
            </div>
            <button className="play-btn" style={{ background: game.themeColor }}>
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
