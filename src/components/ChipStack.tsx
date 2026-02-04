import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProceduralChip } from './ProceduralChip';

const COLOR_MAP: Record<string, string> = {
  blue: '#1d4ed8',   // blue-700
  yellow: '#a16207', // yellow-700
  green: '#15803d',  // green-700
  black: '#18181b',  // zinc-900
  red: '#b91c1c',    // red-700
  white: '#d4d4d8',  // zinc-300
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
    sm: { chipHeight: 5, width: 32, fontSize: 'text-[10px]' },
    md: { chipHeight: 6, width: 40, fontSize: 'text-xs' },
    lg: { chipHeight: 7, width: 48, fontSize: 'text-sm' }
  };

  const config = stackConfig[size];

  const distribution = useMemo(() => {
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);
    let remaining = amount;
    const chips: { color: string; label: string; value: number }[] = [];

    sortedDenominations.forEach(denom => {
      if (denom.value <= 0) return;
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          chips.push({ color: denom.color, label: denom.label, value: denom.value });
        }
        remaining -= count * denom.value;
      }
    });

    // Limit to 20 chips for visual performance and space
    return chips.slice(0, 20).reverse();
  }, [amount, CHIP_DENOMINATIONS]);

  // Generate deterministic offsets for each chip in the stack to look "organic"
  const offsets = useMemo(() => {
    return distribution.map((_, i) => ({
      x: (Math.sin(i * 123.45) * 2), // Slight horizontal shift
      rotate: (Math.cos(i * 678.9) * 4) // Slight rotation
    }));
  }, [distribution]);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", size === 'lg' ? 'min-w-[60px]' : 'min-w-[40px]')}>
      <div
        className="relative flex flex-col-reverse items-center justify-end"
        style={{
          height: `${40 + (distribution.length * config.chipHeight)}px`,
          width: `${config.width}px`
        }}
      >
        <AnimatePresence mode="popLayout">
          {distribution.map((chip, idx) => (
            <motion.div
              key={`${amount}-${idx}`}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute"
              style={{
                bottom: `${idx * config.chipHeight}px`,
                zIndex: idx,
                x: offsets[idx]?.x || 0,
                rotate: offsets[idx]?.rotate || 0
              }}
            >
              <ProceduralChip
                value={chip.label}
                color={COLOR_MAP[chip.color] || '#333'}
                size={size}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAmount && (
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full shadow-lg">
          <span className={cn("font-bold font-numbers text-gold-400 whitespace-nowrap", config.fontSize)}>
            Rs. {amount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
