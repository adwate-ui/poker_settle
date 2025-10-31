import chipRed20 from "@/assets/chip-red-20.png";
import chipBlack100 from "@/assets/chip-black-100.png";
import chipBlue500 from "@/assets/chip-blue-500.png";
import chipYellow1000 from "@/assets/chip-yellow-1000.png";
import chipGreen5000 from "@/assets/chip-green-5000.png";

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CHIP_DENOMINATIONS = [
  { value: 5000, image: chipGreen5000, color: '#10b981' },
  { value: 1000, image: chipYellow1000, color: '#eab308' },
  { value: 500, image: chipBlue500, color: '#3b82f6' },
  { value: 100, image: chipBlack100, color: '#111827' },
  { value: 20, image: chipRed20, color: '#ef4444' },
];

const ChipStack = ({ amount, size = 'md', showLabel = true }: ChipStackProps) => {
  // Select the best single chip denomination to display (simplified approach)
  const selectBestChip = (total: number) => {
    if (total === 0) return null;
    
    // Find the best denomination that represents the amount most efficiently
    // We want to show 1-4 chips ideally
    for (const denom of CHIP_DENOMINATIONS) {
      const count = total / denom.value;
      if (count >= 1 && count <= 10) {
        return { 
          ...denom, 
          count: Math.ceil(count * 10) / 10, // Round to 1 decimal
          visualCount: Math.min(Math.ceil(count), 4) // Show max 4 chips visually
        };
      }
    }
    
    // Fallback: use the highest denomination
    const highest = CHIP_DENOMINATIONS[0];
    const count = total / highest.value;
    return {
      ...highest,
      count: Math.ceil(count * 10) / 10,
      visualCount: Math.min(Math.ceil(count), 4)
    };
  };

  const chip = selectBestChip(amount);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const chipSize = sizeClasses[size];

  if (!chip) {
    return showLabel ? (
      <div className="text-xs text-muted-foreground">Rs. 0</div>
    ) : null;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Single chip stack */}
      <div className="relative flex flex-col items-center">
        {/* Stack of chips (show 1-4 chips max) */}
        <div className="relative" style={{ height: `${chip.visualCount * 2 + (size === 'sm' ? 28 : size === 'md' ? 36 : 44)}px` }}>
          {Array.from({ length: chip.visualCount }).map((_, stackIdx) => (
            <div key={stackIdx}>
              {/* Fallback circle (behind the image) */}
              <div
                className={`${chipSize} absolute left-0 rounded-full border-2 border-white shadow-md`}
                style={{
                  bottom: `${stackIdx * 2}px`,
                  zIndex: stackIdx,
                  backgroundColor: chip.color,
                }}
              />
              {/* Image chip */}
              <img
                src={chip.image}
                alt={`${chip.value} chip`}
                className={`${chipSize} absolute left-0 rounded-full`}
                style={{
                  bottom: `${stackIdx * 2}px`,
                  zIndex: stackIdx + 1,
                }}
                onError={(e) => {
                  // hide the image to reveal the fallback circle
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Multiplier badge for fractional/large counts */}
        {chip.count > 1 && chip.count !== chip.visualCount && (
          <div 
            className="absolute bg-black/90 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white/70 z-20 px-1"
            style={{
              minWidth: size === 'sm' ? 16 : size === 'md' ? 18 : 20,
              height: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
              top: -4,
              right: -4,
            }}
          >
            ×{chip.count}
          </div>
        )}
      </div>

      {/* Amount label - more prominent */}
      {showLabel && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white px-2 py-0.5 rounded shadow-lg border border-poker-gold/50">
          <div className="text-sm font-bold whitespace-nowrap text-poker-gold">
            Rs. {amount.toLocaleString('en-IN')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChipStack;
