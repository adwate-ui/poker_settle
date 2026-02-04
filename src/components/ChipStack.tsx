import React from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { motion, AnimatePresence } from 'framer-motion';

// Import chip assets directly
import redChip from '@/assets/chip-red-20.png';
import blackChip from '@/assets/chip-black-100.png';
import blueChip from '@/assets/chip-blue-500.png';
import yellowChip from '@/assets/chip-yellow-1000.png';
import greenChip from '@/assets/chip-green-5000.png';

const CHIP_ASSETS: Record<string, string> = {
  red: redChip,
  black: blackChip,
  blue: blueChip,
  yellow: yellowChip,
  green: greenChip,
  white: blackChip, // Fallback
};

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
}

export const ChipStack = ({ amount, size = 'md', showAmount = true }: ChipStackProps) => {
  const { chips: CHIP_DENOMINATIONS } = useChips();

  if (amount === 0) return null;

  const stackConfig = {
    sm: { chipHeight: 2, width: 24, height: 24, fontSize: 'text-xs' },
    md: { chipHeight: 4, width: 32, height: 32, fontSize: 'text-sm' },
    lg: { chipHeight: 6, width: 40, height: 40, fontSize: 'text-base' }
  };

  const config = stackConfig[size];

  const getChipDistribution = (total: number) => {
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);
    let remaining = total;
    const chips: { color: string; count: number; value: number }[] = [];

    sortedDenominations.forEach(denom => {
      if (denom.value <= 0) return;
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        chips.push({ color: denom.color, count, value: denom.value });
        remaining -= count * denom.value;
      }
    });
    return chips.reverse();
  };

  const distribution = getChipDistribution(amount);
  const maxVisualChips = 20;

  const renderChips = () => {
    let chipsToRender: { color: string, index: number }[] = [];
    distribution.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        chipsToRender.push({ color: group.color, index: i });
      }
    });

    if (chipsToRender.length > maxVisualChips) {
      chipsToRender = chipsToRender.slice(0, maxVisualChips);
    }

    return (
      <AnimatePresence mode="popLayout">
        <motion.div
          initial="initial"
          animate="animate"
          className="relative w-full h-full"
        >
          {chipsToRender.map((chip, idx) => (
            <motion.div
              key={`${chip.color}-${idx}`}
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="absolute drop-shadow-lg"
              style={{
                bottom: `${idx * config.chipHeight}px`,
                zIndex: idx,
                left: 0,
                right: 0,
                margin: 'auto',
                width: `${config.width}px`,
              }}
            >
              <img
                src={CHIP_ASSETS[chip.color] || blackChip}
                alt={`${chip.color} chip`}
                className="w-full h-auto object-contain"
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", size === 'lg' ? 'min-w-[50px]' : 'min-w-[40px]')}>
      <div
        className="relative flex items-end justify-center"
        style={{
          height: `${Math.min(distribution.reduce((acc, c) => acc + c.count, 0), maxVisualChips) * (config.chipHeight + 1) + config.height}px`,
          width: `${config.width}px`
        }}
      >
        {renderChips()}
      </div>

      {showAmount && (
        <span className={cn("font-medium tabular-nums text-foreground", config.fontSize)}>
          Rs. {amount.toLocaleString()}
        </span>
      )}
    </div>
  );
};
