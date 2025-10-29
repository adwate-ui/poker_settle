import { SeatPosition } from "@/types/poker";
import { useState } from "react";
import { getPositionForPlayer } from "@/utils/pokerPositions";

interface PokerTableViewProps {
  positions: SeatPosition[];
  totalSeats?: number;
  onPositionsChange?: (positions: SeatPosition[]) => void;
  enableDragDrop?: boolean;
  buttonPlayerId?: string;
  seatPositions?: Record<string, number>;
  playerBets?: Record<string, number>;
  potSize?: number;
  showPositionLabels?: boolean;
}

const PokerTableView = ({ 
  positions, 
  totalSeats, 
  onPositionsChange, 
  enableDragDrop = false,
  buttonPlayerId,
  seatPositions = {},
  playerBets = {},
  potSize = 0,
  showPositionLabels = false
}: PokerTableViewProps) => {
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

  // Get position label for a player
  const getPositionLabel = (playerId: string) => {
    if (!buttonPlayerId || !showPositionLabels) return null;
    const sortedPositions = positions
      .map(p => ({ ...p, seat: seatPositions[p.player_id] ?? 999 }))
      .sort((a, b) => a.seat - b.seat);
    return getPositionForPlayer(
      sortedPositions.map(p => ({ player_id: p.player_id, player: { name: p.player_name } } as any)),
      buttonPlayerId,
      playerId,
      seatPositions
    );
  };

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Poker Table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Table felt with enhanced styling */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Outer rail */}
            <ellipse
              cx="50"
              cy="50"
              rx="45"
              ry="35"
              className="fill-[#2C1810] stroke-[#8B4513]"
              strokeWidth="1"
            />
            {/* Padded rail */}
            <ellipse
              cx="50"
              cy="50"
              rx="42"
              ry="32"
              className="fill-[#4A2511] stroke-[#654321]"
              strokeWidth="0.5"
            />
            {/* Main felt */}
            <ellipse
              cx="50"
              cy="50"
              rx="38"
              ry="28"
              className="fill-[#0D5D2A] stroke-[#0A4821]"
              strokeWidth="1.5"
            />
            {/* Inner felt highlight */}
            <ellipse
              cx="50"
              cy="50"
              rx="35"
              ry="25"
              className="fill-[#0F6B32]/30"
            />
            {/* Table texture lines */}
            <ellipse
              cx="50"
              cy="50"
              rx="33"
              ry="23"
              className="stroke-[#0A4821]/20 fill-none"
              strokeWidth="0.3"
            />
          </svg>

          {/* Pot display in center */}
          {potSize > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white px-4 py-2 rounded-lg shadow-xl border-2 border-amber-400">
                <div className="text-xs font-semibold text-amber-100">POT</div>
                <div className="text-sm font-bold">Rs. {potSize.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}

          {/* Player positions */}
          {positions.map((position, index) => {
            const pos = getPlayerPosition(index);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const positionLabel = getPositionLabel(position.player_id);
            const playerBet = playerBets[position.player_id] || 0;
            const isButton = buttonPlayerId === position.player_id;
            
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
                  {/* Position label */}
                  {positionLabel && (
                    <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold shadow-md">
                      {positionLabel}
                    </div>
                  )}
                  
                  {/* Player avatar */}
                  <div className="relative">
                    <div className={`bg-card border-2 rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg transition-all overflow-hidden ${
                      isDragOver && draggedIndex !== null ? 'border-poker-gold ring-2 ring-poker-gold' : 'border-primary'
                    }`}>
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(position.player_name)}`}
                        alt={position.player_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Button indicator */}
                    {isButton && (
                      <div className="absolute -top-1 -right-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-black shadow-lg">
                        D
                      </div>
                    )}
                  </div>
                  
                  {/* Player name */}
                  <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-border">
                    <span className="text-xs xs:text-sm font-medium text-foreground whitespace-nowrap">
                      {position.player_name}
                    </span>
                  </div>
                  
                  {/* Chips display */}
                  {playerBet > 0 && (
                    <div className="bg-gradient-to-br from-red-600 to-red-800 text-white px-2 py-1 rounded-full shadow-lg border-2 border-red-400 animate-scale-in">
                      <span className="text-xs font-bold">Rs. {playerBet.toLocaleString('en-IN')}</span>
                    </div>
                  )}
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