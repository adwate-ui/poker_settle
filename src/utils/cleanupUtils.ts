/**
 * Utility functions for proper cleanup and memory leak prevention
 *
 * MEMORY LEAK PREVENTION PATTERN:
 *
 * When using async operations in useEffect, always:
 * 1. Create an AbortController
 * 2. Pass signal to async operations
 * 3. Cleanup on unmount
 * 4. Handle AbortError gracefully
 *
 * Example:
 * ```typescript
 * useEffect(() => {
 *   const abortController = new AbortController();
 *
 *   async function fetchData() {
 *     try {
 *       const { data } = await supabase
 *         .from('table')
 *         .select('*')
 *         .abortSignal(abortController.signal);
 *
 *       setState(data);
 *     } catch (error) {
 *       if (error.name !== 'AbortError') {
 *         // Handle real errors
 *       }
 *     }
 *   }
 *
 *   fetchData();
 *
 *   return () => {
 *     abortController.abort();
 *   };
 * }, []);
 * ```
 */

/**
 * Check if an error is an AbortError
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Safe error handler that ignores abort errors
 */
export function handleAsyncError(
  error: unknown,
  onError: (error: Error) => void
): void {
  if (isAbortError(error)) {
    // Silently ignore aborted requests
    return;
  }

  if (error instanceof Error) {
    onError(error);
  } else {
    onError(new Error(String(error)));
  }
}

/**
 * Create a cleanup-aware async wrapper
 *
 * Usage:
 * ```typescript
 * const { execute, cleanup } = createCleanupAwareAsync();
 *
 * useEffect(() => {
 *   execute(async (signal) => {
 *     const data = await supabase
 *       .from('table')
 *       .select('*')
 *       .abortSignal(signal);
 *     setState(data);
 *   });
 *
 *   return cleanup;
 * }, []);
 * ```
 */
export function createCleanupAwareAsync() {
  const abortController = new AbortController();

  return {
    signal: abortController.signal,
    execute: async <T>(
      asyncFn: (signal: AbortSignal) => Promise<T>
    ): Promise<T | undefined> => {
      try {
        return await asyncFn(abortController.signal);
      } catch (error) {
        if (!isAbortError(error)) {
          throw error;
        }
        return undefined;
      }
    },
    cleanup: () => {
      abortController.abort();
    },
  };
}

/**
 * Hook to create a stable abort controller
 *
 * Usage:
 * ```typescript
 * const { signal, cleanup } = useAbortController();
 *
 * useEffect(() => {
 *   fetchData(signal);
 *   return cleanup;
 * }, [signal, cleanup]);
 * ```
 */
export function useAbortController() {
  const abortControllerRef = { current: new AbortController() };

  return {
    signal: abortControllerRef.current.signal,
    cleanup: () => {
      abortControllerRef.current.abort();
    },
  };
}
