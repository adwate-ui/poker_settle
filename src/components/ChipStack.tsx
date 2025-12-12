import { memo, useMemo } from "react";
import { PokerChipSVG } from "./PokerAssets";

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CHIP_DENOMINATIONS = [
  { value: 5000, color: 'blue', label: '5K' },
  { value: 1000, color: 'white', label: '1K' },
  { value: 500, color: 'green', label: '500' },
  { value: 100, color: 'black', label: '100' },
  { value: 20, color: 'red', label: '20' },
];

// Configuration for chip stack display
const MAX_CHIPS_PER_STACK = 5; // Maximum chips to show visually per denomination
const MAX_CHIP_DENOMINATIONS = 2; // Maximum different denominations to show

const ChipStack = memo(({ amount, size = 'md', showLabel = true }: ChipStackProps) => {
  // Calculate the chip breakdown - show multiple denominations like real poker apps
  const chipBreakdown = useMemo(() => {
    if (amount === 0) return [];
    
    const breakdown: Array<{ color: string; label: string; count: number; value: number }> = [];
    let remaining = amount;
    
    // Break down amount into different denominations
    for (const denom of CHIP_DENOMINATIONS) {
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        breakdown.push({ 
          ...denom, 
          count: Math.min(count, MAX_CHIPS_PER_STACK) // Show max chips per denomination for visual clarity
        });
        remaining -= count * denom.value;
      }
      // Only show up to MAX_CHIP_DENOMINATIONS different denominations for simplicity
      if (breakdown.length >= MAX_CHIP_DENOMINATIONS) break;
    }
    
    return breakdown;
  }, [amount]);

  const sizeMaps = {
    sm: 28,
    md: 36,
    lg: 44,
  };

  const chipSize = sizeMaps[size];

  if (chipBreakdown.length === 0) {
    return showLabel ? (
      <div className="text-xs text-muted-foreground">Rs. 0</div>
    ) : null;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Multiple chip stacks horizontally aligned and touching */}
      <div className="flex flex-row items-end" style={{ gap: '2px' }}>
        {chipBreakdown.map((chip, stackIndex) => (
          <div key={stackIndex} className="relative flex flex-col items-center">
            {/* Stack of chips (show actual count up to 5) */}
            <div className="relative" style={{ height: `${chip.count * 4 + chipSize}px` }}>
              {Array.from({ length: chip.count }).map((_, chipIdx) => (
                <div 
                  key={chipIdx}
                  className="absolute left-0"
                  style={{
                    bottom: `${chipIdx * 4}px`,
                    zIndex: chipIdx,
                  }}
                >
                  <PokerChipSVG value={chip.label} color={chip.color} size={chipSize} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Amount label - Full Tilt style with size adaptation */}
      {showLabel && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-xl border border-poker-gold/60 max-w-[100px] sm:max-w-none">
          <div className="text-xs sm:text-sm font-bold text-poker-gold drop-shadow-md text-center truncate">
            Rs. {amount.toLocaleString('en-IN')}
          </div>
        </div>
      )}
    </div>
  );
});

ChipStack.displayName = 'ChipStack';

export default ChipStack;
