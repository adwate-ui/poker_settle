import React from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { PokerChipSVG } from './PokerAssets';
import { motion, AnimatePresence } from 'framer-motion';

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
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);

    let remaining = total;
    const chips: { color: string; count: number; value: number; label: string }[] = [];

    sortedDenominations.forEach(denom => {
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
  const maxVisualChips = 20;

  // Flatten chip array for rendering individual chips
  const renderChips = () => {
    let chipsToRender: { color: string, index: number, label: string, groupId: number }[] = [];
    distribution.forEach((group, gIdx) => {
      for (let i = 0; i < group.count; i++) {
        chipsToRender.push({
          color: group.color,
          index: i,
          label: group.label,
          groupId: gIdx
        });
      }
    });

    // Cap rendering
    if (chipsToRender.length > maxVisualChips) {
      chipsToRender = chipsToRender.slice(0, maxVisualChips);
    }

    return (
      <AnimatePresence mode="popLayout">
        {chipsToRender.map((chip, idx) => (
          <motion.div
            key={`${chip.label}-${chip.index}`}
            layout
            initial={{ scale: 0, y: -50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              mass: 1.2 // Heavier feel
            }}
            className="absolute drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] filter brightness-95"
            style={{
              bottom: `${idx * config.chipHeight}px`,
              zIndex: idx,
              transform: `translateY(${idx * -1}px)`,
            }}
          >
            <PokerChipSVG
              value={chip.label}
              color={chip.color}
              size={config.width}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    );
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
