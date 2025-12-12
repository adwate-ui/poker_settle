import { SeatPosition } from "@/types/poker";
import { useState, memo, useCallback, useMemo } from "react";
import { getPositionForPlayer } from "@/utils/pokerPositions";
import PokerCard from "./PokerCard";
import ChipStack from "./ChipStack";
import { GamePlayer } from "@/types/poker";
import OptimizedAvatar from "./OptimizedAvatar";

// Z-index constants for proper layering
const Z_INDEX = {
  HOLE_CARDS: 5,      // Hole cards should be below player avatars
  PLAYER_UNIT: 10,    // Player avatar, name, and related elements
  BUTTON_BADGE: 15,   // Dealer button badge
  CHIP_STACK: 20,     // Chip stacks
  POSITION_LABEL: 25, // Position labels
  WINNER_BADGE: 30,   // Winner badge (highest)
} as const;

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
  animatingPlayerId?: string | null; // Specific player whose chips are animating to pot
  animateChipsToWinner?: string | null;
  playerHoleCards?: Record<string, string>;
  communityCards?: string;
  onPlayerClick?: (playerId: string) => void;
  activePlayerId?: string;
  showAllPlayerCards?: boolean; // Show cards for all players (before any action)
  muckedPlayers?: string[]; // Players who have mucked their cards
  playerStacks?: Record<string, number>; // Player chip stacks
  showPotChips?: boolean; // Whether to show physical chips in pot (default true)
}

const PokerTableView = memo(({ 
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
  animatingPlayerId = null,
  animateChipsToWinner = null,
  playerHoleCards = {},
  communityCards = '',
  onPlayerClick,
  activePlayerId,
  showAllPlayerCards = false,
  muckedPlayers = [],
  playerStacks = {},
  showPotChips = true
}: PokerTableViewProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Table layout constants
  const TABLE_CENTER_X = 50; // Center X position as percentage
  const TABLE_CENTER_Y = 50; // Center Y position as percentage

  // Always spread players evenly around the table regardless of seat numbers
  const numPlayers = positions.length;
  const numSeats = Math.max(4, totalSeats || numPlayers); // Use totalSeats if provided, otherwise numPlayers

  // Extract all player names for unique character assignment
  const allPlayerNames = useMemo(() => positions.map(p => p.player_name), [positions]);

  // Calculate position for each player, spreading them evenly - memoized
  const getPlayerPosition = useCallback((index: number) => {
    const angle = index * (360 / numPlayers) - 90; // Start from top, spread evenly
    const radians = (angle * Math.PI) / 180;
    const radiusX = 44; // Horizontal radius
    const radiusY = 32; // Vertical radius (smaller for more rectangular, like real poker table)
    
    return {
      x: TABLE_CENTER_X + radiusX * Math.cos(radians),
      y: TABLE_CENTER_Y + radiusY * Math.sin(radians),
    };
  }, [numPlayers]);

  const handleDragStart = useCallback((index: number) => {
    if (!enableDragDrop) return;
    setDraggedIndex(index);
  }, [enableDragDrop]);

  // Shared cleanup function for drag/touch operations
  const cleanupDragState = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    cleanupDragState();
  }, [cleanupDragState]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!enableDragDrop || draggedIndex === null) return;
    setDragOverIndex(index);
  }, [enableDragDrop, draggedIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
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
    cleanupDragState();
  }, [enableDragDrop, draggedIndex, positions, onPositionsChange, cleanupDragState]);

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (!enableDragDrop) return;
    // Prevent context menu on long press
    e.preventDefault();
    setDraggedIndex(index);
  }, [enableDragDrop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableDragDrop || draggedIndex === null) return;
    
    // Prevent default to stop scrolling while dragging
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find which player position element we're over
    const playerElement = element?.closest('[data-player-index]');
    if (playerElement) {
      const index = parseInt(playerElement.getAttribute('data-player-index') || '-1');
      if (index >= 0 && index !== draggedIndex) {
        setDragOverIndex(index);
      }
    }
  }, [enableDragDrop, draggedIndex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enableDragDrop || draggedIndex === null) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find which player position element we're over
    const playerElement = element?.closest('[data-player-index]');
    if (playerElement && onPositionsChange) {
      const dropIndex = parseInt(playerElement.getAttribute('data-player-index') || '-1');
      
      if (dropIndex >= 0 && dropIndex !== draggedIndex) {
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
      }
    }
    
    cleanupDragState();
  }, [enableDragDrop, draggedIndex, positions, onPositionsChange, cleanupDragState]);

  // Get position label for a player - memoized
  const getPositionLabel = useCallback((playerId: string) => {
    if (!buttonPlayerId || !showPositionLabels) return null;
    const sortedPositions = positions
      .map(p => ({ ...p, seat: seatPositions[p.player_id] ?? 999 }))
      .sort((a, b) => a.seat - b.seat);
    return getPositionForPlayer(
      sortedPositions.map(p => ({ player_id: p.player_id, player: { name: p.player_name } } as GamePlayer)),
      buttonPlayerId,
      playerId,
      seatPositions
    );
  }, [buttonPlayerId, showPositionLabels, positions, seatPositions]);

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
                <div className="flex gap-1 sm:gap-1.5 animate-fade-in">
                  {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
                    <PokerCard 
                      key={idx} 
                      card={card} 
                      size="xs"
                      className="sm:hidden"
                    />
                  ))}
                  {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
                    <PokerCard 
                      key={`sm-${idx}`} 
                      card={card} 
                      size="sm"
                      className="hidden sm:block"
                    />
                  ))}
                </div>
              )}
              
              {/* Pot display with optimized layout */}
              {potSize > 0 && (
                <div className={`flex items-center gap-2 transition-all duration-500 ${
                  animateChipsToPot ? 'scale-110' : animateChipsToWinner ? 'opacity-0 scale-0' : 'scale-100'
                }`}>
                  <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white px-2 py-1 rounded-lg shadow-xl border-2 border-amber-400 text-xs font-semibold whitespace-nowrap">
                    POT
                  </div>
                  <div className="bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-gray-100 px-3 py-1 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    Rs. {potSize.toLocaleString('en-IN')}
                  </div>
                  {showPotChips && <ChipStack amount={potSize} size="sm" showLabel={false} />}
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
                key={position.player_id}
                data-player-index={index}
                draggable={enableDragDrop}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => enableDragDrop && e.preventDefault()}
                onClick={() => onPlayerClick && onPlayerClick(position.player_id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  enableDragDrop ? 'cursor-move select-none' : onPlayerClick ? 'cursor-pointer' : ''
                } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver && draggedIndex !== null ? 'scale-110' : ''} ${
                  isFolded ? 'opacity-50 grayscale' : ''
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
              >
                <div className="relative flex flex-col items-center gap-1">
                  {/* Position label - absolutely positioned to avoid layout shift */}
                  {positionLabel && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold shadow-md whitespace-nowrap" style={{ zIndex: Z_INDEX.POSITION_LABEL }}>
                      {positionLabel}
                    </div>
                  )}
                  
                  {/* Player unit: avatar, name, and hole cards as one cohesive unit */}
                  <div className="relative flex flex-col items-center gap-1" style={{ zIndex: Z_INDEX.PLAYER_UNIT }}>
                    {/* Player avatar - central element */}
                    <div className="relative">
                      <div className={`bg-card border-2 rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg transition-all overflow-hidden ${
                        isActive && !isFolded ? 'border-poker-gold ring-4 ring-poker-gold/50 animate-pulse' : 
                        isDragOver && draggedIndex !== null ? 'border-poker-gold ring-2 ring-poker-gold' : 'border-primary'
                      }`}>
                        <OptimizedAvatar 
                          name={position.player_name}
                          size="md"
                          className="w-full h-full"
                          allPlayerNames={allPlayerNames}
                        />
                      </div>
                      {/* Button indicator overlay - positioned as sibling for proper layering */}
                      {isButton && (
                        <div className="absolute -top-1 -right-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-black shadow-lg" style={{ zIndex: Z_INDEX.BUTTON_BADGE }}>
                          D
                        </div>
                      )}
                    </div>
                    
                    {/* Player name and stack - directly below avatar */}
                    <div className="bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-md border border-border flex flex-col items-center gap-0 min-w-[80px] max-w-[120px]">
                      <span className="text-xs xs:text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full text-center" title={position.player_name}>
                        {position.player_name}
                      </span>
                      {playerStacks[position.player_id] !== undefined && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          Rs. {playerStacks[position.player_id].toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    
                    {/* Player hole cards - positioned to the side for better visibility, hidden on mobile */}
                    {(hasKnownCards || shouldShowCards) && (
                      <div 
                        className={`absolute hidden sm:flex gap-0.5 transition-all duration-300 ease-in-out ${
                          isFolded ? 'opacity-30 grayscale' : 'opacity-100'
                        } ${pos.x > TABLE_CENTER_X ? 'right-full mr-1' : 'left-full ml-1'}`}
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: Z_INDEX.HOLE_CARDS,
                        }}
                      >
                        {hasKnownCards ? (
                          // Show known cards face-up
                          playerHoleCards[position.player_id].match(/.{1,2}/g)?.map((card, idx) => (
                            <PokerCard 
                              key={idx} 
                              card={card} 
                              size="xs"
                            />
                          ))
                        ) : shouldShowCards ? (
                          // Show card backs for unknown cards (not mucked)
                          <>
                            <PokerCard card="back" size="xs" />
                            <PokerCard card="back" size="xs" />
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced chip stack display - positioned intelligently based on player location */}
                  {playerBet > 0 && !isFolded && (() => {
                    // Check if chips should animate for this player
                    const shouldAnimate = animateChipsToPot && (!animatingPlayerId || animatingPlayerId === position.player_id);
                    
                    // Calculate intelligent chip position based on player location
                    // Note: Uses window.innerWidth at render time - doesn't update on resize
                    // This is acceptable since table layout doesn't change during a hand
                    const isMobileView = window.innerWidth < 640; // Tailwind 'sm' breakpoint
                    
                    // Position chips AWAY from table center
                    let chipTop, chipLeft;
                    if (pos.y < 35) {
                      // Top players - chips above
                      chipTop = isMobileView ? '-45px' : '-60px';
                    } else if (pos.y > 65) {
                      // Bottom players - chips below
                      chipTop = isMobileView ? '65px' : '80px';
                    } else {
                      // Middle players - chips to the side, slightly below
                      chipTop = isMobileView ? '50px' : '60px';
                    }
                    
                    if (pos.x < 35) {
                      // Left side - chips to the left
                      chipLeft = isMobileView ? '-40px' : '-50px';
                    } else if (pos.x > 65) {
                      // Right side - chips to the right
                      chipLeft = isMobileView ? '40px' : '50px';
                    } else {
                      // Center - chips slightly to the side based on y position
                      chipLeft = pos.y > 50 ? (isMobileView ? '35px' : '45px') : (isMobileView ? '-35px' : '-45px');
                    }
                    
                    return (
                      <div 
                        className={`absolute transition-all duration-500 ease-in-out ${
                          shouldAnimate
                            ? 'opacity-0 scale-0 translate-x-0 translate-y-[-150px]' 
                            : 'opacity-100 scale-100'
                        }`}
                        style={{
                          top: chipTop,
                          left: chipLeft,
                          zIndex: Z_INDEX.CHIP_STACK,
                        }}
                      >
                        <ChipStack amount={playerBet} size="sm" showLabel={true} />
                      </div>
                    );
                  })()}
                  
                  {/* Winner chip animation - shows pot chips coming to winner */}
                  {isWinner && (
                    <div 
                      className="absolute animate-in fade-in zoom-in duration-700"
                      style={{
                        top: pos.y > 50 ? '-70px' : '90px',
                        left: pos.x > 50 ? '-60px' : '60px',
                        zIndex: Z_INDEX.WINNER_BADGE,
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 rounded-lg border-2 border-amber-300 animate-pulse shadow-xl">
                          <span className="text-lg font-bold text-white drop-shadow-lg">🏆 WINNER!</span>
                        </div>
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-md">
                          Chips Coming!
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
});

PokerTableView.displayName = 'PokerTableView';

export default PokerTableView;