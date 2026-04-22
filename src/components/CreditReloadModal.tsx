import { useState } from 'react';
import { useCredit } from '../context/CreditContext';
import { playCoinSound } from '../utils/soundManager';
import './CreditReloadModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RELOAD_AMOUNTS = [1, 5, 10, 20, 50, 100, 1000, 5000, 10000];

export function CreditReloadModal({ isOpen, onClose }: Props) {
  const { balance, addCredits, maxBalance } = useCredit();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);

  if (!isOpen) return null;

  const maxAddable = maxBalance - balance;

  const handleAdd = (amount: number) => {
    if (amount > maxAddable) {
      setError(`Cannot add ${amount.toLocaleString()}. Max you can add is ${maxAddable.toLocaleString()}.`);
      return;
    }
    const ok = addCredits(amount);
    if (ok) {
      playCoinSound();
      setSuccess(true);
      setLastAdded(amount);
      setError('');
      setTimeout(() => {
        setSuccess(false);
        setLastAdded(0);
        onClose();
      }, 1200);
    } else {
      setError('Could not add credits. Balance cap reached.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Add Credits</h2>
        <p className="modal-balance">
          Current Balance: <span>{balance.toLocaleString()}</span>
        </p>
        <p className="modal-max">
          Maximum: {maxBalance.toLocaleString()} | Can add: {maxAddable.toLocaleString()}
        </p>
        <div className="reload-amounts-grid">
          {RELOAD_AMOUNTS.map(amt => (
            <button
              key={amt}
              className="reload-amt-btn"
              disabled={amt > maxAddable || success}
              onClick={() => handleAdd(amt)}
            >
              +{amt.toLocaleString()}
            </button>
          ))}
        </div>
        {error && <p className="modal-error">{error}</p>}
        {success && <p className="modal-success">+{lastAdded.toLocaleString()} credits added!</p>}
      </div>
    </div>
  );
}
