import { SeatPosition } from "@/types/poker";

interface PokerTableViewProps {
  positions: SeatPosition[];
  totalSeats?: number;
}

const PokerTableView = ({ positions, totalSeats }: PokerTableViewProps) => {
  // Calculate number of seats based on max position or provided total
  const maxSeat = Math.max(...positions.map(p => p.seat), totalSeats || 0);
  const numSeats = Math.max(4, Math.min(10, maxSeat)); // Between 4-10 seats

  // Calculate position for each seat around the table
  const getSeatPosition = (seatNumber: number) => {
    const angle = (seatNumber - 1) * (360 / numSeats) - 90; // Start from top
    const radians = (angle * Math.PI) / 180;
    const radius = 40; // Percentage from center
    
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  };

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Poker Table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Table felt */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse
              cx="50"
              cy="50"
              rx="35"
              ry="25"
              className="fill-primary/20 stroke-primary/40"
              strokeWidth="2"
            />
            {/* Inner felt */}
            <ellipse
              cx="50"
              cy="50"
              rx="30"
              ry="20"
              className="fill-primary/10"
            />
          </svg>

          {/* Player positions */}
          {positions.map((position) => {
            const pos = getSeatPosition(position.seat);
            return (
              <div
                key={position.seat}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-card border-2 border-primary rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg">
                    <span className="text-lg xs:text-xl sm:text-2xl font-bold text-primary">
                      {position.seat}
                    </span>
                  </div>
                  <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-border">
                    <span className="text-xs xs:text-sm font-medium text-foreground whitespace-nowrap">
                      {position.player_name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PokerTableView;