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
        {/* Stack of chips (show 1-3 chips max) */}
        <div className="relative" style={{ height: `${chip.visualCount * 2 + (size === 'sm' ? 24 : size === 'md' ? 30 : 38)}px` }}>
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
};

export default ChipStack;
