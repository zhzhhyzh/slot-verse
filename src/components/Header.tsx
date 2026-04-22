import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCredit } from '../context/CreditContext';
import { CreditReloadModal } from './CreditReloadModal';
import { toggleMute, isMuted, startMusic, playClick, playNavigate } from '../utils/soundManager';
import './Header.css';

export function Header() {
  const { balance } = useCredit();
  const [showReload, setShowReload] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const navigate = useNavigate();
  const location = useLocation();
  const isLobby = location.pathname === '/';

  const handleToggleSound = () => {
    const nowMuted = toggleMute();
    setMutedState(nowMuted);
    if (!nowMuted) {
      startMusic();
    }
  };

  const handleNavigate = (path: string) => {
    playNavigate();
    navigate(path);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {!isLobby && (
            <button className="back-btn" onClick={() => handleNavigate('/')}>
              &#8592; Lobby
            </button>
          )}
          <h1 className="logo" onClick={() => handleNavigate('/')}>
            <span className="logo-icon">&#9824;</span> SlotVerse
          </h1>
        </div>
        <div className="header-right">
          <button
            className={`sound-toggle-btn ${muted ? 'muted' : ''}`}
            onClick={handleToggleSound}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
          </button>
          <div className="balance-display">
            <span className="balance-label">Credits</span>
            <span className="balance-amount">{balance.toLocaleString()}</span>
          </div>
          <button className="add-credits-btn" onClick={() => { playClick(); setShowReload(true); }}>
            + Add
          </button>
        </div>
      </header>
      <CreditReloadModal isOpen={showReload} onClose={() => setShowReload(false)} />
    </>
  );
}
