import { memo, useMemo } from "react";
import { PokerChipSVG } from "./PokerAssets";

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CHIP_DENOMINATIONS = [
  { value: 5000, color: 'green', label: '5K' },
  { value: 1000, color: 'yellow', label: '1K' },
  { value: 500, color: 'blue', label: '500' },
  { value: 100, color: 'black', label: '100' },
  { value: 20, color: 'red', label: '20' },
];

const ChipStack = memo(({ amount, size = 'md', showLabel = true }: ChipStackProps) => {
  // Select the best single chip denomination to display (simplified approach)
  const chip = useMemo(() => {
    const selectBestChip = (total: number) => {
    if (total === 0) return null;
    
    // Find the best denomination that represents the amount most efficiently
    // We want to show 1-3 chips ideally (Full Tilt style)
    for (const denom of CHIP_DENOMINATIONS) {
      const count = total / denom.value;
      if (count >= 1 && count <= 10) {
        return { 
          ...denom, 
          count: Math.ceil(count * 10) / 10, // Round to 1 decimal
          visualCount: Math.min(Math.ceil(count), 3) // Show max 3 chips visually
        };
      }
    }
    
    // Fallback: use the highest denomination
    const highest = CHIP_DENOMINATIONS[0];
    const count = total / highest.value;
    return {
      ...highest,
      count: Math.ceil(count * 10) / 10,
      visualCount: Math.min(Math.ceil(count), 3)
    };
    };
    
    return selectBestChip(amount);
  }, [amount]);

  const sizeMaps = {
    sm: 28,
    md: 36,
    lg: 44,
  };

  const chipSize = sizeMaps[size];

  if (!chip) {
    return showLabel ? (
      <div className="text-xs text-muted-foreground">Rs. 0</div>
    ) : null;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Single chip stack */}
      <div className="relative flex flex-col items-center">
        {/* Stack of chips (show 1-3 chips max) */}
        <div className="relative" style={{ height: `${chip.visualCount * 2 + chipSize}px` }}>
          {Array.from({ length: chip.visualCount }).map((_, stackIdx) => (
            <div 
              key={stackIdx}
              className="absolute left-0"
              style={{
                bottom: `${stackIdx * 2}px`,
                zIndex: stackIdx,
              }}
            >
              <PokerChipSVG value={chip.label} color={chip.color} size={chipSize} />
            </div>
          ))}
        </div>
        
        {/* Multiplier badge - more prominent */}
        {chip.count > 1 && (
          <div 
            className="absolute bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white z-20 px-1.5 shadow-lg"
            style={{
              minWidth: size === 'sm' ? 18 : size === 'md' ? 20 : 22,
              height: size === 'sm' ? 16 : size === 'md' ? 18 : 20,
              top: -4,
              right: -6,
            }}
          >
            ×{chip.count}
          </div>
        )}
      </div>

      {/* Amount label - more prominent Full Tilt style */}
      {showLabel && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white px-2.5 py-1 rounded shadow-xl border border-poker-gold/60">
          <div className="text-base font-bold whitespace-nowrap text-poker-gold drop-shadow-md">
            Rs. {amount.toLocaleString('en-IN')}
          </div>
        </div>
      )}
    </div>
  );
});

ChipStack.displayName = 'ChipStack';

export default ChipStack;
