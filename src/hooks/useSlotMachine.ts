import { useState, useCallback, useRef } from 'react';
import type { SlotGameConfig, SpinResult, SpinState } from '../utils/types';
import { generateGrid, controlledSpin } from '../utils/slotEngine';

interface UseSlotMachineReturn {
  grid: string[][];
  spinState: SpinState;
  lastResult: SpinResult | null;
  spin: (bet: number, onResult: (result: SpinResult) => void) => void;
  freeSpins: number;
}

export function useSlotMachine(config: SlotGameConfig): UseSlotMachineReturn {
  const [grid, setGrid] = useState<string[][]>(() => generateGrid(config));
  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const spinningRef = useRef(false);

  const spin = useCallback((bet: number, onResult: (result: SpinResult) => void) => {
    if (spinningRef.current) return;
    spinningRef.current = true;

    setSpinState('spinning');
    setLastResult(null);

    // Simulate reel spinning delay
    setTimeout(() => {
      const result = controlledSpin(config, bet);

      setGrid(result.grid);
      setSpinState('revealing');

      // Staggered reveal then show result
      setTimeout(() => {
        setLastResult(result);

        // Call the result callback ONCE here — no useEffect needed
        onResult(result);

        if (result.freeSpinsAwarded > 0) {
          setFreeSpins(prev => prev + result.freeSpinsAwarded);
        }

        if (result.totalWin > 0) {
          setSpinState('win-display');
          setTimeout(() => {
            setSpinState('idle');
            spinningRef.current = false;
          }, 2000);
        } else {
          setSpinState('idle');
          spinningRef.current = false;
        }
      }, config.reels * 300);
    }, 500);
  }, [config]);

  return {
    grid,
    spinState,
    lastResult,
    spin,
    freeSpins,
  };
}
