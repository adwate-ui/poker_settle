import { SeatPosition } from "@/types/poker";
import { useState, memo, useCallback, useMemo, useEffect } from "react";
import { getPositionForPlayer } from "@/utils/pokerPositions";
import PokerCard from "./PokerCard";
import { ChipStack } from "./ChipStack";
import { GamePlayer } from "@/types/poker";
import OptimizedAvatar from "./OptimizedAvatar";
import { motion, AnimatePresence } from "framer-motion";
import * as confetti from 'canvas-confetti';
import { cn } from "@/lib/utils";
import { useGameRealtime } from "@/features/game/hooks/useGameRealtime";

// Z-index constants for proper layering
const Z_INDEX = {
  HOLE_CARDS: 5,      // Hole cards should be below player avatars
  PLAYER_UNIT: 10,    // Player avatar, name, and related elements
  BUTTON_BADGE: 15,   // Dealer button badge
  POT_OVERLAY: 20,    // Dimming overlay during winner spotlight
  CHIP_STACK: 25,     // Chip stacks
  POSITION_LABEL: 30, // Position labels
  WINNER_CELEBRATION: 40, // Win amount display and spotlight
  CONFETTI: 50,       // Confetti (top-most)
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
  animatingPlayerId?: string | null;
  animateChipsToWinner?: string | null;
  playerHoleCards?: Record<string, string>;
  communityCards?: string;
  onPlayerClick?: (playerId: string) => void;
  activePlayerId?: string;
  showAllPlayerCards?: boolean;
  muckedPlayers?: string[];
  playerStacks?: Record<string, number>;
  showPotChips?: boolean;
  gameId?: string;
}

interface PokerSeatProps {
  index: number;
  position: SeatPosition;
  pos: { x: number; y: number };
  isDragging: boolean;
  isDragOver: boolean;
  draggedIndex: number | null;
  positionLabel: string | null;
  playerBet: number;
  isButton: boolean;
  isFolded: boolean;
  isMucked: boolean;
  isWinner: boolean;
  isActive: boolean;
  hasKnownCards: string | boolean;
  shouldShowCards: boolean;
  playerHoleCards: Record<string, string>;
  playerStacks: Record<string, number>;
  animateChipsToPot: boolean;
  animatingPlayerId: string | null;
  potSize: number;
  allPlayerNames: string[];
  enableDragDrop: boolean;
  onPlayerClick?: (playerId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const PokerSeat = memo(({
  index,
  position,
  pos,
  isDragging,
  isDragOver,
  draggedIndex,
  positionLabel,
  playerBet,
  isButton,
  isFolded,
  isMucked,
  isWinner,
  isActive,
  hasKnownCards,
  shouldShowCards,
  playerHoleCards,
  playerStacks,
  animateChipsToPot,
  animatingPlayerId,
  potSize,
  allPlayerNames,
  enableDragDrop,
  onPlayerClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: PokerSeatProps) => {
  const TABLE_CENTER_X = 50;

  return (
    <div
      data-player-index={index}
      draggable={enableDragDrop}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => enableDragDrop && e.preventDefault()}
      onClick={() => onPlayerClick && onPlayerClick(position.player_id)}
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 sm:rotate-0 -rotate-90",
        enableDragDrop ? 'cursor-move select-none' : onPlayerClick ? 'cursor-pointer' : '',
        isDragging ? 'opacity-50 scale-95' : '',
        isDragOver && draggedIndex !== null ? 'scale-110' : '',
        isFolded ? 'opacity-50 grayscale' : ''
      )}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        zIndex: isWinner ? Z_INDEX.WINNER_CELEBRATION : Z_INDEX.PLAYER_UNIT
      }}
    >
      <div className="relative flex flex-col items-center gap-1">
        {/* Spotlight glow for winner */}
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            className="absolute inset-0 bg-gold-500/20 blur-2xl rounded-full z-[-1]"
          />
        )}

        {positionLabel && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold shadow-md whitespace-nowrap" style={{ zIndex: Z_INDEX.POSITION_LABEL }}>
            {positionLabel}
          </div>
        )}

        <div className="relative flex flex-col items-center gap-1">
          <div className="relative">
            <div className={cn(
              "bg-card border-2 rounded-full w-8 h-8 xs:w-10 xs:h-10 sm:w-11 sm:h-11 flex items-center justify-center shadow-lg transition-all overflow-hidden",
              isActive && !isFolded ? 'border-poker-gold ring-4 ring-poker-gold/50 animate-pulse' :
                isWinner ? 'border-gold-400 ring-8 ring-gold-500/30 scale-110' :
                  isDragOver && draggedIndex !== null ? 'border-poker-gold ring-2 ring-poker-gold' : 'border-primary'
            )}>
              <OptimizedAvatar
                name={position.player_name}
                size="md"
                className="w-full h-full"
                allPlayerNames={allPlayerNames}
              />
            </div>
            {isButton && (
              <div className="absolute -top-1 -right-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-black shadow-lg" style={{ zIndex: Z_INDEX.BUTTON_BADGE }}>
                D
              </div>
            )}
          </div>

          <div className={cn(
            "bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-md border border-border flex flex-col items-center gap-0 min-w-[80px] max-w-[120px] transition-all",
            isWinner ? "border-gold-500/50 bg-gold-900/40" : ""
          )}>
            <span className={cn(
              "text-xs xs:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center",
              isWinner ? "text-gold-200 font-luxury" : "text-foreground"
            )} title={position.player_name}>
              {position.player_name}
            </span>
            {playerStacks[position.player_id] !== undefined && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Rs. {playerStacks[position.player_id].toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {(hasKnownCards || shouldShowCards) && (
            <div
              className={cn(
                "absolute hidden sm:flex gap-0.5 transition-all duration-300 ease-in-out",
                isFolded ? 'opacity-30 grayscale' : 'opacity-100',
                pos.x > TABLE_CENTER_X ? 'right-full mr-1' : 'left-full ml-1'
              )}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: Z_INDEX.HOLE_CARDS,
              }}
            >
              {typeof hasKnownCards === 'string' ? (
                hasKnownCards.match(/.{1,2}/g)?.map((card, idx) => (
                  <PokerCard
                    key={idx}
                    card={card}
                    size="xs"
                  />
                ))
              ) : shouldShowCards ? (
                <>
                  <PokerCard card="back" size="xs" />
                  <PokerCard card="back" size="xs" />
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Chip stacks for betting or winning */}
        {playerBet > 0 && !isFolded && (
          <div
            className={cn(
              "absolute transition-all duration-500 ease-in-out",
              animateChipsToPot && (!animatingPlayerId || animatingPlayerId === position.player_id)
                ? 'opacity-0 scale-0 translate-x-0 translate-y-[-150px]'
                : 'opacity-100 scale-100'
            )}
            style={{
              top: pos.y < 35 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '-40px' : '-50px') :
                pos.y > 65 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '60px' : '70px') :
                  (typeof window !== 'undefined' && window.innerWidth < 640 ? '45px' : '55px'),
              left: pos.x < 35 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '-35px' : '-45px') :
                pos.x > 65 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '35px' : '45px') :
                  (pos.y > 50 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '30px' : '40px') : (typeof window !== 'undefined' && window.innerWidth < 640 ? '-30px' : '-40px')),
              zIndex: Z_INDEX.CHIP_STACK,
            }}
          >
            <ChipStack amount={playerBet} size="sm" showAmount={true} />
          </div>
        )}

        {/* Winner chip physics - animate pot to player */}
        <AnimatePresence>
          {isWinner && potSize > 0 && (
            <motion.div
              initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
              animate={{
                left: "50%",
                top: "-40px",
                opacity: 1,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.5
                }
              }}
              className="absolute z-[40]"
            >
              <ChipStack amount={potSize} size="sm" showAmount={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {isWinner && (
          <div
            className="absolute animate-in fade-in zoom-in duration-700"
            style={{
              top: pos.y > 50 ? '-100px' : '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: Z_INDEX.WINNER_CELEBRATION,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-2 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 px-4 py-2 rounded-full border-2 border-gold-300/50 shadow-[0_0_20px_rgba(212,184,60,0.4)]"
              >
                <span className="text-xl font-luxury font-bold text-white drop-shadow-lg tracking-widest whitespace-nowrap">🏆 CHAMPION</span>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PokerSeat.displayName = 'PokerSeat';

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
  showPotChips = true,
  gameId
}: PokerTableViewProps) => {
  // Integrate live synchronization
  useGameRealtime(gameId);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Table layout constants
  const TABLE_CENTER_X = 50;
  const TABLE_CENTER_Y = 50;

  const numPlayers = positions.length;

  // Extract all player names for unique character assignment
  const allPlayerNames = useMemo(() => positions.map(p => p.player_name), [positions]);

  // Calculate position for each player, spreading them evenly - memoized
  const getPlayerPosition = useCallback((index: number) => {
    const angle = index * (360 / numPlayers) - 90;
    const radians = (angle * Math.PI) / 180;
    const radiusX = 38;
    const radiusY = 28;

    return {
      x: TABLE_CENTER_X + radiusX * Math.cos(radians),
      y: TABLE_CENTER_Y + radiusY * Math.sin(radians),
    };
  }, [numPlayers]);

  const handleDragStart = useCallback((index: number) => {
    if (!enableDragDrop) return;
    setDraggedIndex(index);
  }, [enableDragDrop]);

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

    const tempSeat = draggedPosition.seat;
    draggedPosition.seat = dropPosition.seat;
    dropPosition.seat = tempSeat;

    newPositions.sort((a, b) => a.seat - b.seat);
    onPositionsChange(newPositions);
    cleanupDragState();
  }, [enableDragDrop, draggedIndex, positions, onPositionsChange, cleanupDragState]);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (!enableDragDrop) return;
    e.preventDefault();
    setDraggedIndex(index);
  }, [enableDragDrop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableDragDrop || draggedIndex === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
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
    const playerElement = element?.closest('[data-player-index]');
    if (playerElement && onPositionsChange) {
      const dropIndex = parseInt(playerElement.getAttribute('data-player-index') || '-1');
      if (dropIndex >= 0 && dropIndex !== draggedIndex) {
        const newPositions = [...positions];
        const draggedPosition = newPositions[draggedIndex];
        const dropPosition = newPositions[dropIndex];
        const tempSeat = draggedPosition.seat;
        draggedPosition.seat = dropPosition.seat;
        dropPosition.seat = tempSeat;
        newPositions.sort((a, b) => a.seat - b.seat);
        onPositionsChange(newPositions);
      }
    }
    cleanupDragState();
  }, [enableDragDrop, draggedIndex, positions, onPositionsChange, cleanupDragState]);

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

  // Winner celebration effect
  useEffect(() => {
    if (animateChipsToWinner) {
      // Trigger "Gold Dust" confetti
      const count = 150;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#FFD700', '#FDB931', '#FFFFFF'],
        shapes: ['circle', 'star'] as confetti.Shape[],
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [animateChipsToWinner]);

  return (
    <div className="poker-table-container max-w-3xl mx-auto my-1 sm:my-2 overflow-hidden">
      {/* Spotlight/Overlay effect during winner celebration */}
      <AnimatePresence>
        {animateChipsToWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[20] bg-black/40 backdrop-blur-[2px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Poker Table */}
      <div className="absolute inset-0 flex items-center justify-center sm:rotate-0 rotate-90 sm:scale-[1.02] scale-[1.275]">
        <div className="relative w-full h-full">
          <div className="relative w-full h-[60%] sm:h-[65%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-[150px] border-[12px] sm:border-[16px] border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] z-0" />
            <div className="absolute inset-[8px] sm:inset-[12px] rounded-[140px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] z-0" />
            <div className="absolute inset-[10px] sm:inset-[14px] rounded-[138px] bg-felt-dark overflow-hidden flex items-center justify-center z-0">
              <div
                className="absolute inset-0 opacity-40 mix-blend-overlay"
                style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }}
              />
              <div className="opacity-[0.03] select-none pointer-events-none transform -rotate-12">
                <span className="font-luxury text-4xl sm:text-6xl tracking-[0.2em] text-white whitespace-nowrap">
                  POKER SETTLE
                </span>
              </div>
              <div className="absolute inset-[25px] sm:inset-[35px] rounded-[110px] border border-white/5 pointer-events-none" />
            </div>

            {/* Center area - Community Cards and Pot */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: Z_INDEX.WINNER_CELEBRATION }}
            >
              <div className="flex flex-col items-center gap-2 sm:rotate-0 -rotate-90">
                {/* Win Amount display */}
                <AnimatePresence>
                  {animateChipsToWinner && potSize > 0 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, y: 20 }}
                      animate={{ scale: 1.1, opacity: 1, y: 0 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="absolute -top-16 flex flex-col items-center gap-0"
                    >
                      <span className="text-gold-200 font-luxury tracking-widest text-xs uppercase mb-1">Total Win</span>
                      <span className="text-4xl sm:text-5xl font-luxury text-gold-500 drop-shadow-[0_0_20px_rgba(212,184,60,0.8)] glow-text whitespace-nowrap">
                        Rs. {potSize.toLocaleString()}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Community Cards */}
                {communityCards && !animateChipsToWinner && (
                  <div className="flex gap-1 sm:gap-1.5 animate-fade-in transition-all">
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

                {/* Pot display */}
                {potSize > 0 && !animateChipsToWinner && (
                  <div className={`flex items-center gap-2 transition-all duration-500 ${animateChipsToPot ? 'scale-110' : 'scale-100'}`}>
                    <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white px-2 py-1 rounded-lg shadow-xl border-2 border-amber-400 text-xs font-semibold whitespace-nowrap">
                      POT
                    </div>
                    <div className="bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-gray-100 px-3 py-1 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      Rs. {potSize.toLocaleString('en-IN')}
                    </div>
                    {showPotChips && <ChipStack amount={potSize} size="sm" showAmount={false} />}
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
                <PokerSeat
                  key={position.player_id}
                  index={index}
                  position={position}
                  pos={pos}
                  isDragging={isDragging}
                  isDragOver={isDragOver}
                  draggedIndex={draggedIndex}
                  positionLabel={positionLabel}
                  playerBet={playerBet}
                  isButton={isButton}
                  isFolded={isFolded}
                  isMucked={isMucked}
                  isWinner={isWinner}
                  isActive={isActive}
                  hasKnownCards={typeof hasKnownCards === 'string' ? hasKnownCards : (hasKnownCards ? true : false)}
                  shouldShowCards={shouldShowCards}
                  playerHoleCards={playerHoleCards}
                  playerStacks={playerStacks}
                  animateChipsToPot={animateChipsToPot}
                  animatingPlayerId={animatingPlayerId}
                  potSize={potSize}
                  allPlayerNames={allPlayerNames}
                  enableDragDrop={enableDragDrop}
                  onPlayerClick={onPlayerClick}
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

PokerTableView.displayName = 'PokerTableView';

export default PokerTableView;