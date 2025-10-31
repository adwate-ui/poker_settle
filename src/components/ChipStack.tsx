import chipRed20 from "@/assets/chip-red-20.jpg";
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
  { value: 5000, image: chipGreen5000 },
  { value: 1000, image: chipYellow1000 },
  { value: 500, image: chipBlue500 },
  { value: 100, image: chipBlack100 },
  { value: 20, image: chipRed20 },
];

const ChipStack = ({ amount, size = 'md', showLabel = true }: ChipStackProps) => {
  // Calculate which chips to use (greedy algorithm)
  const calculateChips = (total: number) => {
    const chips: { value: number; image: string; count: number }[] = [];
    let remaining = total;

    for (const denom of CHIP_DENOMINATIONS) {
      if (remaining >= denom.value) {
        const count = Math.floor(remaining / denom.value);
        chips.push({ ...denom, count });
        remaining = remaining % denom.value;
      }
    }

    return chips;
  };

  const chips = calculateChips(amount);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const chipSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Chip stacks */}
      <div className="relative flex items-end gap-0.5">
        {chips.map((chip, idx) => (
          <div key={idx} className="relative flex flex-col items-center">
            {/* Stack of chips (show up to 5 chips in stack visually) */}
            <div className="relative" style={{ height: `${Math.min(chip.count, 5) * 2 + (size === 'sm' ? 28 : size === 'md' ? 36 : 44)}px` }}>
              {Array.from({ length: Math.min(chip.count, 5) }).map((_, stackIdx) => (
                <img
                  key={stackIdx}
                  src={chip.image}
                  alt={`${chip.value} chip`}
                  className={`${chipSize} absolute left-0 drop-shadow-md rounded-full`}
                  style={{
                    bottom: `${stackIdx * 2}px`,
                    zIndex: stackIdx,
                  }}
                />
              ))}
            </div>
            {/* Count indicator for more than 5 chips */}
            {chip.count > 5 && (
              <div 
                className="absolute bg-black/90 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white/70 z-20"
                style={{
                  width: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
                  height: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
                  top: -2,
                  right: -2,
                }}
              >
                {chip.count}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Amount label */}
      {showLabel && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white px-2 py-0.5 rounded shadow-lg border border-poker-gold/50">
          <div className="text-xs font-bold whitespace-nowrap text-poker-gold">
            Rs. {amount.toLocaleString('en-IN')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChipStack;
