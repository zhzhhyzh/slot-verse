import type { Card } from '../utils/cardDeck';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cardDeck';
import './PlayingCard.css';

interface Props {
  card: Card;
  small?: boolean;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function PlayingCard({ card, small, onClick, selected, className = '' }: Props) {
  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];

  if (!card.faceUp) {
    return (
      <div className={`playing-card face-down ${small ? 'small' : ''} ${className}`} onClick={onClick}>
        <div className="card-back-pattern" />
      </div>
    );
  }

  return (
    <div
      className={`playing-card ${small ? 'small' : ''} ${selected ? 'selected' : ''} ${className}`}
      style={{ color }}
      onClick={onClick}
    >
      <div className="card-corner top-left">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{symbol}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
    </div>
  );
}
