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
  foldedPlayers?: string[];
  animateChipsToPot?: boolean;
  animateChipsToWinner?: string | null;
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
  showPositionLabels = false,
  foldedPlayers = [],
  animateChipsToPot = false,
  animateChipsToWinner = null
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
    const radiusX = 44; // Horizontal radius
    const radiusY = 32; // Vertical radius (smaller for more rectangular, like real poker table)
    
    return {
      x: 50 + radiusX * Math.cos(radians),
      y: 50 + radiusY * Math.sin(radians),
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
              rx="48"
              ry="28"
              className="fill-[#2C1810] stroke-[#8B4513]"
              strokeWidth="1"
            />
            {/* Padded rail */}
            <ellipse
              cx="50"
              cy="50"
              rx="46"
              ry="26"
              className="fill-[#4A2511] stroke-[#654321]"
              strokeWidth="0.5"
            />
            {/* Main felt */}
            <ellipse
              cx="50"
              cy="50"
              rx="43"
              ry="23"
              className="fill-[#0D5D2A] stroke-[#0A4821]"
              strokeWidth="1.5"
            />
            {/* Inner felt highlight */}
            <ellipse
              cx="50"
              cy="50"
              rx="40"
              ry="20"
              className="fill-[#0F6B32]/30"
            />
            {/* Table texture lines */}
            <ellipse
              cx="50"
              cy="50"
              rx="38"
              ry="18"
              className="stroke-[#0A4821]/20 fill-none"
              strokeWidth="0.3"
            />
          </svg>

          {/* Pot display in center */}
          {potSize > 0 && (
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
              animateChipsToPot ? 'scale-110' : 'scale-100'
            }`}>
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
            const isFolded = foldedPlayers.includes(position.player_id);
            const isWinner = animateChipsToWinner === position.player_id;
            
            return (
              <div
                key={position.seat}
                draggable={enableDragDrop}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  enableDragDrop ? 'cursor-move' : ''
                } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver && draggedIndex !== null ? 'scale-110' : ''} ${
                  isFolded ? 'opacity-40 grayscale' : ''
                } ${isWinner ? 'animate-pulse' : ''}`}
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
                  {playerBet > 0 && !isFolded && (
                    <div className={`relative transition-all duration-500 ${
                      animateChipsToPot ? 'opacity-0 scale-50 translate-y-[-100px]' : 'opacity-100 scale-100'
                    }`}>
                      {/* Poker chip stack */}
                      <div className="relative flex flex-col items-center">
                        {/* Chip SVG */}
                        <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                          {/* Shadow chips for stack effect */}
                          <circle cx="24" cy="26" r="18" fill="#C41E3A" opacity="0.5"/>
                          <circle cx="24" cy="25" r="18" fill="#C41E3A" opacity="0.7"/>
                          
                          {/* Main chip */}
                          <circle cx="24" cy="24" r="20" fill="#E63946"/>
                          <circle cx="24" cy="24" r="20" fill="url(#chipGradient)" opacity="0.6"/>
                          <circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="1.5"/>
                          <circle cx="24" cy="24" r="15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
                          
                          {/* Chip segments */}
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                            <rect
                              key={angle}
                              x="22"
                              y="5"
                              width="4"
                              height="6"
                              fill="white"
                              transform={`rotate(${angle} 24 24)`}
                              rx="1"
                            />
                          ))}
                          
                          {/* Center circle */}
                          <circle cx="24" cy="24" r="8" fill="#FFF" opacity="0.3"/>
                          
                          <defs>
                            <radialGradient id="chipGradient">
                              <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                              <stop offset="70%" stopColor="white" stopOpacity="0"/>
                              <stop offset="100%" stopColor="black" stopOpacity="0.3"/>
                            </radialGradient>
                          </defs>
                        </svg>
                        
                        {/* Bet amount */}
                        <div className="absolute -bottom-5 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-lg">
                          Rs. {playerBet.toLocaleString('en-IN')}
                        </div>
                      </div>
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