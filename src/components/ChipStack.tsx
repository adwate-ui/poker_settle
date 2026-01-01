import React from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { PokerChipSVG } from './PokerAssets';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
}

export const ChipStack = ({ amount, size = 'md', showAmount = true }: ChipStackProps) => {
  const { chips: CHIP_DENOMINATIONS } = useChips();

  if (amount === 0) return null;

  // Configuration for stack rendering
  const stackConfig = {
    sm: { chipHeight: 2, scale: 0.8, text: 'text-xs', width: 24, height: 24 },
    md: { chipHeight: 4, scale: 1, text: 'text-sm', width: 32, height: 32 },
    lg: { chipHeight: 6, scale: 1.25, text: 'text-base', width: 40, height: 40 }
  };

  const config = stackConfig[size];

  // Calculate chip distribution
  const getChipDistribution = (total: number) => {
    // Determine the sort order: check if any denomination is < 20 (e.g. 5 or 10)
    // If we have custom small chips, we want larger values first (descending).
    // The previous hardcoded array was descending: 5000, 1000, 500, 100, 20.
    // Let's ensure descending sort by value so we use fewer chips.
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);

    let remaining = total;
    const chips: { color: string; count: number; value: number }[] = [];

    sortedDenominations.forEach(denom => {
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        chips.push({ color: denom.color, count, value: denom.value });
        remaining -= count * denom.value;
      }
    });

    return chips.reverse(); // Stack from bottom up (largest values usually at bottom, or smallest? Usually largest at bottom is best stability, but here we stack visually.)
    // Wait, physically usually bottom chips are handled first in code if we render bottom-up?
    // Actually, visually: 
    // If we render a list, the first item is usually "top" unless we position absolute.
    // The original code was:
    /*
        <div className="relative flex flex-col-reverse items-center justify-end h-full w-full pointer-events-none" 
             style={{ paddingBottom: `${totalChips * config.chipHeight}px` }}> 
           {distribution.map(...)}
        </div>
    */
    // flex-col-reverse means the first DOM element is at the BOTTOM.
    // So if we reverse() here, we put the first calculated element (largest denom) at the BOTTOM.
    // Yes, usually in poker you put largest chips at the bottom of the stack.
  };

  const distribution = getChipDistribution(amount);
  const totalChips = distribution.reduce((acc, curr) => acc + curr.count, 0);
  const maxVisualChips = 20; // Cap visual stack height for performance/layout

  // Flatten chip array for rendering individual chips
  const renderChips = () => {
    let chipsToRender: { color: string, index: number }[] = [];
    distribution.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        chipsToRender.push({ color: group.color, index: i });
      }
    });

    // Cap rendering
    if (chipsToRender.length > maxVisualChips) {
      chipsToRender = chipsToRender.slice(0, maxVisualChips);
    }

    return chipsToRender.map((chip, idx) => (
      <div
        key={idx}
        className="absolute transition-all duration-500 ease-out-bounce"
        style={{
          bottom: `${idx * config.chipHeight}px`,
          zIndex: idx,
          transform: `translateY(${idx * -1}px)`, // Slight offset for 3D feel
        }}
      >
        <PokerChipSVG
          color={chip.color}
          width={config.width}
          height={config.height}
          className="drop-shadow-sm"
        />
      </div>
    ));
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", size === 'lg' ? 'min-w-[50px]' : 'min-w-[40px]')}>
      <div
        className="relative flex items-end justify-center"
        style={{
          height: `${Math.min(totalChips, maxVisualChips) * (config.chipHeight + 1) + config.height}px`,
          width: `${config.width}px`
        }}
      >
        {renderChips()}
      </div>

      {showAmount && (
        <span className={cn("font-bold tabular-nums text-foreground/90 whitespace-nowrap", config.text)}>
          {amount.toLocaleString()}
        </span>
      )}
    </div>
  );
};
