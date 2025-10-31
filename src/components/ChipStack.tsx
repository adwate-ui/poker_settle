interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CHIP_DENOMINATIONS = [
  { value: 5000, color: '#10b981', label: '5K' }, // green
  { value: 1000, color: '#eab308', label: '1K' }, // yellow
  { value: 500, color: '#3b82f6', label: '500' }, // blue
  { value: 100, color: '#1f2937', label: '100' }, // black
  { value: 20, color: '#ef4444', label: '20' }, // red
];

const ChipStack = ({ amount, size = 'md', showLabel = true }: ChipStackProps) => {
  // Calculate which chips to use (greedy algorithm)
  const calculateChips = (total: number) => {
    const chips: { value: number; color: string; label: string; count: number }[] = [];
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

  const sizeConfig = {
    sm: { width: 28, height: 28, fontSize: 9 },
    md: { width: 36, height: 36, fontSize: 10 },
    lg: { width: 44, height: 44, fontSize: 12 },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Chip stacks */}
      <div className="relative flex items-end gap-0.5">
        {chips.map((chip, idx) => (
          <div key={idx} className="relative flex flex-col items-center">
            {/* Stack of chips (show up to 5 chips in stack visually) */}
            <div className="relative" style={{ height: `${Math.min(chip.count, 5) * 3 + config.height}px` }}>
              {Array.from({ length: Math.min(chip.count, 5) }).map((_, stackIdx) => (
                <div
                  key={stackIdx}
                  className="absolute left-0 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold"
                  style={{
                    width: config.width,
                    height: config.height,
                    backgroundColor: chip.color,
                    bottom: `${stackIdx * 3}px`,
                    zIndex: stackIdx,
                    fontSize: config.fontSize,
                    color: chip.color === '#1f2937' ? 'white' : chip.color === '#eab308' ? '#78350f' : 'white',
                  }}
                >
                  {stackIdx === Math.min(chip.count, 5) - 1 && chip.label}
                </div>
              ))}
            </div>
            {/* Count indicator for more than 5 chips */}
            {chip.count > 5 && (
              <div 
                className="absolute bg-black/90 text-white font-bold rounded-full flex items-center justify-center border border-white/70 z-20"
                style={{
                  width: config.width * 0.5,
                  height: config.height * 0.5,
                  fontSize: config.fontSize - 2,
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
