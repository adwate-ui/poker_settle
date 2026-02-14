// Performance utilities for optimization

/**
 * Debounce function for optimizing frequent events like scrolling, resizing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for rate-limiting events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if device prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Lazy load images with intersection observer
 */
export const lazyLoadImage = (img: HTMLImageElement): void => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            if (target.dataset.src) {
              target.src = target.dataset.src;
              observer.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Load images 50px before they're visible
        threshold: 0.01,
      }
    );

    observer.observe(img);
  } else {
    // Fallback for older browsers
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  }
};

/**
 * Batch multiple DOM reads to prevent layout thrashing
 */
export const batchedRead = <T>(reads: (() => T)[]): T[] => {
  return reads.map(read => read());
};

/**
 * Batch multiple DOM writes to prevent layout thrashing
 */
export const batchedWrite = (writes: (() => void)[]): void => {
  requestAnimationFrame(() => {
    writes.forEach(write => write());
  });
};

/**
 * Create a memoized function that caches results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const memoize = <Args extends any[], Result>(
  fn: (...args: Args) => Result
): ((...args: Args) => Result) => {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
