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
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);

    let remaining = total;
    const chips: { color: string; count: number; value: number; label: string }[] = [];

    sortedDenominations.forEach(denom => {
      // Prevent infinite loops if value is invalid
      if (denom.value <= 0) return;

      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        chips.push({ color: denom.color, count, value: denom.value, label: denom.label });
        remaining -= count * denom.value;
      }
    });

    return chips.reverse(); // Stack from bottom up
  };

  const distribution = getChipDistribution(amount);
  const totalChips = distribution.reduce((acc, curr) => acc + curr.count, 0);
  const maxVisualChips = 20; // Cap visual stack height for performance/layout

  // Flatten chip array for rendering individual chips
  const renderChips = () => {
    let chipsToRender: { color: string, index: number, label: string }[] = [];
    distribution.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        chipsToRender.push({ color: group.color, index: i, label: group.label });
      }
    });

    // Cap rendering
    if (chipsToRender.length > maxVisualChips) {
      chipsToRender = chipsToRender.slice(0, maxVisualChips);
    }

    return chipsToRender.map((chip, idx) => (
      <div
        key={idx}
        className="absolute transition-all duration-500 ease-out-bounce drop-shadow-sm"
        style={{
          bottom: `${idx * config.chipHeight}px`,
          zIndex: idx,
          transform: `translateY(${idx * -1}px)`, // Slight offset for 3D feel
        }}
      >
        <PokerChipSVG
          value={chip.label}
          color={chip.color}
          size={config.width}
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
