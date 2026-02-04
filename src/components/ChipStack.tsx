import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProceduralChip } from './ProceduralChip';
import { formatCurrency } from '@/utils/currencyUtils';

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

// Multi-column chip stack implementation
export const ChipStack = ({ amount, size = 'md', showAmount = true }: ChipStackProps) => {
  const { chips: CHIP_DENOMINATIONS } = useChips();

  if (amount === 0) return null;

  const stackConfig = {
    sm: { chipHeight: 2.5, width: 28, fontSize: 'text-[9px]', maxPerColumn: 5 },
    md: { chipHeight: 3, width: 34, fontSize: 'text-[10px]', maxPerColumn: 6 },
    lg: { chipHeight: 3.5, width: 42, fontSize: 'text-xs', maxPerColumn: 8 }
  };

  const config = stackConfig[size];

  // Calculate chip distribution
  const columns = useMemo(() => {
    // Sort denominations High -> Low
    const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);
    let remaining = amount;

    // Group into columns where each column represents only ONE denomination/color
    const cols: Array<{ color: string; label: string; value: number }[]> = [];

    sortedDenominations.forEach(denom => {
      if (denom.value <= 0) return;
      const count = Math.floor(remaining / denom.value);

      if (count > 0) {
        // How many columns does this denomination need? (Strict segregation)
        const fullColumns = Math.floor(count / config.maxPerColumn);
        const remainder = count % config.maxPerColumn;

        // Create full columns
        for (let i = 0; i < fullColumns; i++) {
          const col = Array(config.maxPerColumn).fill({
            color: denom.color,
            label: denom.label,
            value: denom.value
          });
          cols.push(col);
        }

        // Create the remainder column
        if (remainder > 0) {
          const col = Array(remainder).fill({
            color: denom.color,
            label: denom.label,
            value: denom.value
          });
          cols.push(col);
        }

        remaining -= count * denom.value;
      }
    });

    // Sort the final columns by value (standard: High on Left, Low on Right)
    return cols.sort((a, b) => b[0].value - a[0].value);
  }, [amount, CHIP_DENOMINATIONS, config.maxPerColumn]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-row items-end justify-center gap-[2px]">
        <AnimatePresence mode="popLayout">
          {columns.map((col, colIdx) => (
            <div
              key={`col-${colIdx}`}
              className="relative flex flex-col-reverse items-center justify-end"
              style={{
                width: `${config.width}px`,
                height: `${(col.length * config.chipHeight) + (config.width * 0.6)}px` // Height needs to account for perspective
              }}
            >
              {col.map((chip, chipIdx) => (
                <motion.div
                  key={`${amount}-${colIdx}-${chipIdx}`}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute"
                  style={{
                    bottom: `${chipIdx * config.chipHeight}px`,
                    zIndex: chipIdx,
                    // Subtle organic randomness
                    x: (Math.sin((colIdx * 10 + chipIdx) * 123.45) * 1),
                    rotate: (Math.cos((colIdx * 10 + chipIdx) * 678.9) * 2)
                  }}
                >
                  <ProceduralChip
                    value={chip.label}
                    color={COLOR_MAP[chip.color] || '#333'}
                    size={size}
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {showAmount && (
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full shadow-lg z-50">
          <span className={cn("font-bold font-numbers text-primary whitespace-nowrap", config.fontSize)}>
            {formatCurrency(amount)}
          </span>
        </div>
      )}
    </div>
  );
};
