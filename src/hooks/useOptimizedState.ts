import { useCallback, useRef, useState } from 'react';

/**
 * Custom hook for batch state updates to reduce re-renders
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBatchedState<T extends Record<string, any>>(
  initialState: T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): [T, (updates: Partial<T>) => void, (key: keyof T, value: any) => void] {
  const [state, setState] = useState<T>(initialState);
  
  const updateBatch = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSingle = useCallback((key: keyof T, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);
  
  return [state, updateBatch, updateSingle];
}

/**
 * Custom hook that prevents unnecessary re-renders for frequently updated values
 */
export function useThrottledState<T>(
  initialValue: T,
  throttleMs: number = 100
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T>(initialValue);
  
  const setThrottledState = useCallback((value: T) => {
    pendingValueRef.current = value;
    
    if (timeoutRef.current === null) {
      setState(value);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (pendingValueRef.current !== value) {
          setState(pendingValueRef.current);
        }
      }, throttleMs);
    }
  }, [throttleMs]);
  
  return [state, setThrottledState];
}

/**
 * Memoize expensive computations with dependency tracking
 */
export function useComputedValue<T>(
  compute: () => T,
  deps: React.DependencyList
): T {
  const memoRef = useRef<{ value: T; deps: React.DependencyList }>({
    value: compute(),
    deps: [],
  });
  
  const depsChanged = deps.some((dep, i) => dep !== memoRef.current.deps[i]);
  
  if (depsChanged) {
    memoRef.current = {
      value: compute(),
      deps,
    };
  }
  
  return memoRef.current.value;
}
