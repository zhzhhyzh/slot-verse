import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';

const MAX_BALANCE = 9_999_999;
const STORAGE_KEY = 'casino-balance';

interface CreditState {
  balance: number;
}

type CreditAction =
  | { type: 'ADD_CREDITS'; amount: number }
  | { type: 'PLACE_BET'; amount: number }
  | { type: 'ADD_WINNINGS'; amount: number };

interface CreditContextValue {
  balance: number;
  addCredits: (amount: number) => boolean;
  placeBet: (amount: number) => boolean;
  addWinnings: (amount: number) => void;
  maxBalance: number;
}

const CreditContext = createContext<CreditContextValue | null>(null);

function creditReducer(state: CreditState, action: CreditAction): CreditState {
  switch (action.type) {
    case 'ADD_CREDITS': {
      const newBalance = Math.min(state.balance + action.amount, MAX_BALANCE);
      return { balance: newBalance };
    }
    case 'PLACE_BET': {
      const newBalance = state.balance - action.amount;
      if (newBalance < 0) return state;
      return { balance: newBalance };
    }
    case 'ADD_WINNINGS': {
      const newBalance = Math.min(state.balance + action.amount, MAX_BALANCE);
      return { balance: newBalance };
    }
    default:
      return state;
  }
}

function loadBalance(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const val = Number(stored);
      if (!isNaN(val) && val >= 0) return Math.min(val, MAX_BALANCE);
    }
  } catch {}
  return 0;
}

export function CreditProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(creditReducer, { balance: loadBalance() });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(state.balance));
  }, [state.balance]);

  const addCredits = useCallback((amount: number): boolean => {
    if (amount <= 0 || !Number.isFinite(amount)) return false;
    // We dispatch and let the reducer clamp. The check here is best-effort.
    dispatch({ type: 'ADD_CREDITS', amount: Math.floor(amount) });
    return true;
  }, []);

  const placeBet = useCallback((amount: number): boolean => {
    if (amount <= 0) return false;
    dispatch({ type: 'PLACE_BET', amount });
    return true;
  }, []);

  const addWinnings = useCallback((amount: number): void => {
    if (amount > 0) {
      dispatch({ type: 'ADD_WINNINGS', amount: Math.floor(amount) });
    }
  }, []);

  return (
    <CreditContext.Provider value={{ balance: state.balance, addCredits, placeBet, addWinnings, maxBalance: MAX_BALANCE }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredit(): CreditContextValue {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error('useCredit must be used within CreditProvider');
  return ctx;
}
