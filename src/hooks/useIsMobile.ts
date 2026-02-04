import { useState, useEffect, useMemo } from 'react';

/**
 * Breakpoint constants matching tailwind.config.ts
 * Use these for consistent responsive behavior across the app
 */
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * Default breakpoint is 768px (md) - below this is considered mobile
 * Uses debounced resize listener for performance
 */
export const useIsMobile = (breakpoint: number = BREAKPOINTS.md): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Debounced resize handler for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook to get the current breakpoint name
 * Returns: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export const useBreakpoint = (): BreakpointKey => {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return BREAKPOINTS.lg;
    return window.innerWidth;
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWidth(window.innerWidth), 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const breakpoint = useMemo((): BreakpointKey => {
    if (width < BREAKPOINTS.xs) return 'xs';
    if (width < BREAKPOINTS.sm) return 'sm';
    if (width < BREAKPOINTS.md) return 'md';
    if (width < BREAKPOINTS.lg) return 'lg';
    if (width < BREAKPOINTS.xl) return 'xl';
    return '2xl';
  }, [width]);

  return breakpoint;
};

/**
 * Hook to check if viewport is at or above a specific breakpoint
 * Example: useMinBreakpoint('lg') returns true for lg, xl, 2xl screens
 */
export const useMinBreakpoint = (minBreakpoint: BreakpointKey): boolean => {
  const [isAbove, setIsAbove] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= BREAKPOINTS[minBreakpoint];
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAbove(window.innerWidth >= BREAKPOINTS[minBreakpoint]);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [minBreakpoint]);

  return isAbove;
};
