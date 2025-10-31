import { SeatPosition } from "@/types/poker";
import { useState } from "react";
import { getPositionForPlayer } from "@/utils/pokerPositions";
import PokerCard from "./PokerCard";
import ChipStack from "./ChipStack";

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
  playerHoleCards?: Record<string, string>;
  communityCards?: string;
  onPlayerClick?: (playerId: string) => void;
  activePlayerId?: string;
  showAllPlayerCards?: boolean; // Show cards for all players (before any action)
  muckedPlayers?: string[]; // Players who have mucked their cards
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
  animateChipsToWinner = null,
  playerHoleCards = {},
  communityCards = '',
  onPlayerClick,
  activePlayerId,
  showAllPlayerCards = false,
  muckedPlayers = []
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
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* Poker Table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Stadium-shaped table */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Outer rail */}
            <rect
              x="5"
              y="28"
              width="90"
              height="44"
              rx="22"
              className="fill-[#2C1810] stroke-[#8B4513]"
              strokeWidth="1"
            />
            {/* Padded rail */}
            <rect
              x="7"
              y="30"
              width="86"
              height="40"
              rx="20"
              className="fill-[#4A2511] stroke-[#654321]"
              strokeWidth="0.5"
            />
            {/* Main felt */}
            <rect
              x="10"
              y="33"
              width="80"
              height="34"
              rx="17"
              className="fill-[#0D5D2A] stroke-[#0A4821]"
              strokeWidth="1.5"
            />
            {/* Inner felt highlight */}
            <rect
              x="13"
              y="36"
              width="74"
              height="28"
              rx="14"
              className="fill-[#0F6B32]/30"
            />
            {/* Table texture lines */}
            <rect
              x="15"
              y="38"
              width="70"
              height="24"
              rx="12"
              className="stroke-[#0A4821]/20 fill-none"
              strokeWidth="0.3"
            />
          </svg>

          {/* Center area - Community Cards and Pot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-2">
              {/* Community Cards - using Monarch design */}
              {communityCards && (
                <div className="flex gap-1.5 animate-fade-in">
                  {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
                    <PokerCard 
                      key={idx} 
                      card={card} 
                      size="sm"
                    />
                  ))}
                </div>
              )}
              
              {/* Pot display with chip visualization */}
              {potSize > 0 && (
                <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${
                  animateChipsToPot ? 'scale-110' : 'scale-100'
                }`}>
                  <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white px-3 py-1 rounded-lg shadow-xl border-2 border-amber-400 text-xs font-semibold">
                    POT
                  </div>
                  <ChipStack amount={potSize} size="md" showLabel={false} />
                  <div className="text-sm font-bold text-foreground">
                    Rs. {potSize.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player positions */}
          {positions.map((position, index) => {
            const pos = getPlayerPosition(index);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const positionLabel = getPositionLabel(position.player_id);
            const playerBet = playerBets[position.player_id] || 0;
            const isButton = buttonPlayerId === position.player_id;
            const isFolded = foldedPlayers.includes(position.player_id);
            const isMucked = muckedPlayers.includes(position.player_id);
            const isWinner = animateChipsToWinner === position.player_id;
            const isActive = activePlayerId === position.player_id;
            const hasKnownCards = playerHoleCards && playerHoleCards[position.player_id];
            const shouldShowCards = hasKnownCards || (showAllPlayerCards && !isMucked);
            
            return (
              <div
                key={position.seat}
                draggable={enableDragDrop}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => onPlayerClick && onPlayerClick(position.player_id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  enableDragDrop ? 'cursor-move' : onPlayerClick ? 'cursor-pointer' : ''
                } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver && draggedIndex !== null ? 'scale-110' : ''} ${
                  isFolded ? 'opacity-40 grayscale' : ''
                }`}
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
                  
                  {/* Player avatar with hole cards positioned above */}
                  <div className="relative">
                    {/* Player hole cards - positioned above avatar, overlapping it */}
                    <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-10 transition-all duration-300 ${
                      isFolded || isMucked ? 'opacity-40 grayscale' : 'opacity-100'
                    }`}>
                      {hasKnownCards ? (
                        // Show known cards face-up
                        playerHoleCards[position.player_id].match(/.{1,2}/g)?.map((card, idx) => (
                          <PokerCard 
                            key={idx} 
                            card={card} 
                            size="xs"
                          />
                        ))
                      ) : !isMucked ? (
                        // Always show card backs for unknown cards (unless mucked)
                        <>
                          <PokerCard card="back" size="xs" />
                          <PokerCard card="back" size="xs" />
                        </>
                      ) : null}
                    </div>
                    
                    <div className={`bg-card border-2 rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg transition-all overflow-hidden ${
                      isActive && !isFolded ? 'border-poker-gold ring-4 ring-poker-gold/50 animate-pulse' : 
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
                  
                  {/* Enhanced chip stack display */}
                  {playerBet > 0 && !isFolded && (
                    <div 
                      className={`absolute z-20 transition-all duration-500 ease-in-out ${
                        animateChipsToPot 
                          ? 'opacity-0 scale-0 translate-x-0 translate-y-[-150px]' 
                          : 'opacity-100 scale-100'
                      }`}
                      style={{
                        top: pos.y > 50 ? '-60px' : '80px',
                        left: pos.x > 50 ? '-50px' : '50px',
                      }}
                    >
                      <ChipStack amount={playerBet} size="sm" showLabel={true} />
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