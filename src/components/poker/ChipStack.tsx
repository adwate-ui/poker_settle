import React, { useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProceduralChip } from './ProceduralChip';
import { formatCurrency } from '@/utils/currencyUtils';

const VALID_CHIP_COLORS = ['red', 'blue', 'green', 'black', 'white', 'yellow'] as const;
type ChipColor = typeof VALID_CHIP_COLORS[number];

const getChipColor = (color: string): string => {
  return VALID_CHIP_COLORS.includes(color as ChipColor)
    ? `hsl(var(--chip-${color}))`
    : 'hsl(var(--chip-black))';
};

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
}

// Multi-column chip stack implementation
export const ChipStack = memo(({ amount, size = 'md', showAmount = true }: ChipStackProps) => {
  const { chips: CHIP_DENOMINATIONS } = useChips();

  const stackConfig = {
    sm: { chipHeight: 2.5, width: 28, fontSize: 'text-tiny', maxPerColumn: 5 },
    md: { chipHeight: 3, width: 34, fontSize: 'text-2xs', maxPerColumn: 6 },
    lg: { chipHeight: 3.5, width: 42, fontSize: 'text-xs', maxPerColumn: 8 }
  };

  const config = stackConfig[size];

  // Calculate chip distribution
  const columns = useMemo(() => {
    if (amount <= 0) return [];
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

  if (amount <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-row items-end justify-center gap-0.5">
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
                    color={getChipColor(chip.color)}
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
});

ChipStack.displayName = 'ChipStack';
