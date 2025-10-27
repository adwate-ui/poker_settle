import { SeatPosition } from "@/types/poker";
import { useState } from "react";

interface PokerTableViewProps {
  positions: SeatPosition[];
  totalSeats?: number;
  onPositionsChange?: (positions: SeatPosition[]) => void;
  enableDragDrop?: boolean;
}

const PokerTableView = ({ positions, totalSeats, onPositionsChange, enableDragDrop = false }: PokerTableViewProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Always spread players evenly around the table regardless of seat numbers
  const numPlayers = positions.length;
  const numSeats = Math.max(4, totalSeats || numPlayers); // Use totalSeats if provided, otherwise numPlayers

  // Calculate position for each player, spreading them evenly
  const getPlayerPosition = (index: number) => {
    const angle = index * (360 / numPlayers) - 90; // Start from top, spread evenly
    const radians = (angle * Math.PI) / 180;
    const radius = 40; // Percentage from center
    
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  };

  const handleDragStart = (index: number) => {
    if (!enableDragDrop) return;
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!enableDragDrop || draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!enableDragDrop || draggedIndex === null || draggedIndex === dropIndex || !onPositionsChange) return;

    const newPositions = [...positions];
    const draggedPosition = newPositions[draggedIndex];
    const dropPosition = newPositions[dropIndex];

    // Swap the seat numbers
    const tempSeat = draggedPosition.seat;
    draggedPosition.seat = dropPosition.seat;
    dropPosition.seat = tempSeat;

    // Sort by seat number to maintain order
    newPositions.sort((a, b) => a.seat - b.seat);
    
    onPositionsChange(newPositions);
    setDraggedIndex(null);
    setDragOverIndex(null);
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
          {positions.map((position, index) => {
            const pos = getPlayerPosition(index);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
              <div
                key={position.seat}
                draggable={enableDragDrop}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                  enableDragDrop ? 'cursor-move' : ''
                } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver && draggedIndex !== null ? 'scale-110' : ''}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={`bg-card border-2 rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg transition-all overflow-hidden ${
                    isDragOver && draggedIndex !== null ? 'border-poker-gold ring-2 ring-poker-gold' : 'border-primary'
                  }`}>
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(position.player_name)}`}
                      alt={position.player_name}
                      className="w-full h-full object-cover"
                    />
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