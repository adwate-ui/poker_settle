import { SeatPosition } from "@/types/poker";
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react";
import { getPositionForPlayer } from "@/utils/pokerPositions";
import PokerCard from "./PokerCard";
import { ChipStack } from "./ChipStack";
import { GamePlayer } from "@/types/poker";
import OptimizedAvatar from "@/components/player/OptimizedAvatar";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";

// Z-index management is now handled via Tailwind semantic tokens (z-player-unit, z-winner-celebration, etc.)

interface PokerTableViewProps {
  positions: SeatPosition[];
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
}

interface PokerSeatProps {
  index: number;
  position: SeatPosition;
  pos: { x: number; y: number };
  isDragging: boolean;
  isDragOver: boolean;
  draggedIndex: number | null;
  positionLabel: string | null;
  isButton: boolean;
  isFolded: boolean;
  isWinner: boolean;
  isActive: boolean;
  hasKnownCards: string | boolean;
  shouldShowCards: boolean;
  stackAmount?: number;
  onDrop: (e: React.DragEvent, index: number) => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  allPlayerNames: string[];
  enableDragDrop: boolean;
  scale?: number;
  onPlayerClick?: (playerId: string) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
}

const arePokerSeatPropsEqual = (prev: PokerSeatProps, next: PokerSeatProps) => {
  if (prev.index !== next.index) return false;
  if (prev.position.player_id !== next.position.player_id) return false;
  if (prev.position.player_name !== next.position.player_name) return false;
  if (Math.abs(prev.pos.x - next.pos.x) > 0.01 || Math.abs(prev.pos.y - next.pos.y) > 0.01) return false;
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.isDragOver !== next.isDragOver) return false;
  if (prev.draggedIndex !== next.draggedIndex) return false;
  if (prev.positionLabel !== next.positionLabel) return false;
  if (prev.isButton !== next.isButton) return false;
  if (prev.isFolded !== next.isFolded) return false;
  if (prev.isWinner !== next.isWinner) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.shouldShowCards !== next.shouldShowCards) return false;
  if (prev.hasKnownCards !== next.hasKnownCards) return false;
  if (prev.stackAmount !== next.stackAmount) return false;
  if (prev.scale !== next.scale) return false;
  if (prev.enableDragDrop !== next.enableDragDrop) return false;
  if (prev.allPlayerNames !== next.allPlayerNames) return false; // This is a reference check, but explicit is better

  return true;
};

const PokerSeat = memo(({
  index,
  position,
  pos,
  isDragging,
  isDragOver,
  draggedIndex,
  positionLabel,
  isButton,
  isFolded,
  isWinner,
  isActive,
  hasKnownCards,
  shouldShowCards,
  stackAmount,
  allPlayerNames,
  enableDragDrop,
  scale = 1,
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
      onDragStart={(e) => {
        // We handle drag image here if needed, but logic is in handler
        onDragStart(index);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onTouchStart={(e) => onTouchStart(e, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => enableDragDrop && e.preventDefault()}
      onClick={() => onPlayerClick && onPlayerClick(position.player_id)}
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
        enableDragDrop ? 'cursor-move select-none' : onPlayerClick ? 'cursor-pointer' : '',
        isDragging ? 'opacity-50 scale-95' : '',
        isDragOver && draggedIndex !== null ? 'scale-110' : '',
        isFolded ? 'opacity-50 grayscale' : '',
        isWinner ? 'z-winner-celebration' : 'z-player-unit'
      )}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        scale: scale
      }}
    >
      <div className="relative flex flex-col items-center gap-1">
        {/* Spotlight glow for winner */}
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            className="absolute inset-0 bg-primary/20 blur-2xl rounded-full z-[-1]"
          />
        )}

        {positionLabel && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold shadow-md whitespace-nowrap uppercase tracking-tighter z-position-label">
            {positionLabel}
          </div>
        )}

        <div className="relative flex flex-col items-center gap-1">
          <div className="relative">
            <div className={cn(
              "bg-card border-2 rounded-full w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all overflow-hidden",
              isActive && !isFolded ? 'border-primary ring-4 ring-primary/30 animate-pulse' :
                isWinner ? 'border-primary ring-8 ring-primary/20 scale-110' :
                  isDragOver && draggedIndex !== null ? 'border-primary ring-2 ring-primary' : 'border-primary/20'
            )}>
              <OptimizedAvatar
                name={position.player_name}
                size="md"
                className="w-full h-full"
                allPlayerNames={allPlayerNames}
              />
            </div>
            {isButton && (
              <div className="absolute -top-1 -right-1 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border-2 border-background shadow-lg z-player-badge">
                D
              </div>
            )}
          </div>

          <div className={cn(
            "glass-panel px-2 py-0.5 rounded-lg flex flex-col items-center gap-0 min-w-[90px] max-w-[130px] transition-all",
            isWinner ? "border-primary/30 bg-primary/10" : ""
          )}>
            <span className={cn(
              "text-[11px] xs:text-xs font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-center",
              isWinner ? "text-primary font-luxury" : "text-foreground"
            )} title={position.player_name}>
              {position.player_name}
            </span>
            {stackAmount !== undefined && (
              <span className="text-[10px] text-muted-foreground/80 font-numbers tracking-tight">
                {formatCurrency(stackAmount)}
              </span>
            )}
          </div>

          {shouldShowCards && (
            <div
              className={cn(
                "absolute hidden sm:flex gap-0.5 transition-all duration-300 ease-in-out z-player-cards",
                isFolded ? 'opacity-30 grayscale' : 'opacity-100',
                pos.x > TABLE_CENTER_X ? 'right-full mr-2' : 'left-full ml-2'
              )}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
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
              ) : (
                <>
                  <PokerCard card="back" size="xs" />
                  <PokerCard card="back" size="xs" />
                </>
              )}
            </div>
          )}
        </div>


        {isWinner && (
          <div
            className="absolute animate-in fade-in zoom-in duration-700 z-winner-celebration"
            style={{
              top: pos.y > 50 ? '-100px' : '100px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-2 bg-gradient-to-r from-primary via-accent to-primary px-4 py-2 rounded-full border-2 border-primary/50 shadow-glow-gold"
              >
                <span className="text-xl font-luxury font-bold text-white drop-shadow-lg tracking-widest whitespace-nowrap">🏆 CHAMPION</span>
              </motion.div>
            </div>
          </div>
        )}
      </div >
    </div >
  );
}, arePokerSeatPropsEqual);

PokerSeat.displayName = 'PokerSeat';

// Global Layer for Betting Chips
const BettingChipsLayer = memo(({
  positions,
  playerBets,
  animateChipsToPot,
  animatingPlayerId,
  getPlayerPosition
}: {
  positions: SeatPosition[];
  playerBets: Record<string, number>;
  animateChipsToPot: boolean;
  animatingPlayerId: string | null;
  getPlayerPosition: (index: number) => { x: number; y: number };
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-chip-stack">
      <AnimatePresence>
        {positions.map((position, index) => {
          const betAmount = playerBets[position.player_id] || 0;
          if (betAmount <= 0) return null;

          const pos = getPlayerPosition(index);

          // Nudge chips towards center
          const rx = pos.x - 50;
          const ry = pos.y - 50;
          const dist = Math.sqrt(rx * rx + ry * ry);
          const nudgeFactor = 18; // 18% towards center

          const chipX = pos.x - (rx / dist) * nudgeFactor;
          const chipY = pos.y - (ry / dist) * nudgeFactor;

          const isExiting = animateChipsToPot && (!animatingPlayerId || animatingPlayerId === position.player_id);

          return (
            <motion.div
              key={`chips-${position.player_id}`}
              initial={{ left: `${chipX}%`, top: `${chipY}%`, opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
              animate={isExiting ? {
                left: "50%",
                top: "50%",
                opacity: 0, // Fade out as it hits pot
                scale: 0.5,
                transition: { duration: 0.6, ease: "easeInOut" }
              } : {
                left: `${chipX}%`,
                top: `${chipY}%`,
                opacity: 1,
                scale: 1,
                x: '-50%',
                y: '-50%',
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              exit={{
                left: "50%",
                top: "50%",
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.5, ease: "anticipate" }
              }}
              className="absolute"
            >
              <ChipStack amount={betAmount} size="sm" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

const PokerTableView = memo(({
  positions,
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
}: PokerTableViewProps) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Responsive Layout Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setAspectRatio(width / height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const TABLE_CENTER_X = 50;
  const TABLE_CENTER_Y = 50;
  const numPlayers = positions.length;
  const isVertical = aspectRatio < 1;

  // Density Scaling: Shrink components if > 6 players
  const densityScale = useMemo(() => {
    if (numPlayers > 8) return 0.75;
    if (numPlayers > 6) return 0.85;
    return 1;
  }, [numPlayers]);

  const allPlayerNames = useMemo(() => positions.map(p => p.player_name), [positions]);

  // Responsive Ellipse Algorithm
  const getPlayerPosition = useCallback((index: number) => {
    // Angle offset logic
    // Horizontal mode: Start from bottom (90 deg)
    // Vertical mode: Start from right (0 deg) but adjusted for look/feel
    const angleOffset = isVertical ? 0 : 90;
    const angle = index * (360 / numPlayers) + angleOffset;
    const radians = (angle * Math.PI) / 180;

    // For "Outside Seating", we place players at a high radius
    // while the visual table below is smaller (inset by ~15%).
    const horizontalMargin = isVertical ? 8 : 12;
    const verticalMargin = isVertical ? 12 : 8;

    const radiusX = 50 - horizontalMargin;
    const radiusY = 50 - verticalMargin;

    return {
      x: TABLE_CENTER_X + radiusX * Math.cos(radians),
      y: TABLE_CENTER_Y + radiusY * Math.sin(radians),
    };
  }, [numPlayers, isVertical]);

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
    setDraggedIndex(index);
  }, [enableDragDrop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableDragDrop || draggedIndex === null) return;
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
    <div ref={containerRef} className="poker-table-container relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[85vh] mx-auto overflow-hidden">
      {/* Spotlight/Overlay effect during winner celebration */}
      <AnimatePresence>
        {animateChipsToWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-poker-overlay bg-black/40 backdrop-blur-[2px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Poker Table Shadow and Base */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn(
          "relative transition-all duration-500",
          isVertical ? "w-[90%] h-full max-w-[420px]" : "w-full h-full max-w-[900px] max-h-[600px]"
        )}>
          {/* External Table Border: Becomes pill-shaped in vertical mode. Inset increased to seat players outside. */}
          <div className={cn(
            "absolute inset-[var(--poker-table-inset)] border-[16px] border-poker-black shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.15)] z-0 transition-all duration-500",
            isVertical ? "rounded-table-sm" : "rounded-table"
          )} />

          {/* Inner Felt Boundary */}
          <div className={cn(
            "absolute inset-[var(--poker-table-inset)] mt-[4px] ml-[4px] mr-[4px] mb-[4px] bg-poker-felt overflow-hidden flex items-center justify-center z-0 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-500",
            isVertical ? "rounded-table-sm" : "rounded-table"
          )}>
            {/* Table Texture and Branding */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }}
            />
            {/* Pro Betting Line */}
            <div className={cn(
              "absolute inset-[40px] border-2 border-border/50 pointer-events-none transition-all duration-500",
              isVertical ? "rounded-table-sm" : "rounded-table"
            )} />
          </div>

          {/* Center area - Community Cards and Pot */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-winner-celebration"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Win Amount display */}
              <AnimatePresence>
                {animateChipsToWinner && potSize > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1.1, opacity: 1, y: 0 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute -top-24 flex flex-col items-center gap-0"
                  >
                    <span className="text-primary/90 font-luxury tracking-widest text-xs uppercase mb-1">Total Win</span>
                    <span className="text-4xl sm:text-6xl font-luxury text-primary drop-shadow-glow-gold glow-text whitespace-nowrap">
                      {formatCurrency(potSize)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Community Cards */}
              <div className="flex flex-col items-center gap-4">
                {communityCards && !animateChipsToWinner && (
                  <div className="flex gap-1.5 sm:gap-2.5 animate-fade-in transition-all">
                    {communityCards.match(/.{1,2}/g)?.map((card, idx) => (
                      <PokerCard
                        key={idx}
                        card={card}
                        size={aspectRatio < 0.8 ? "xs" : "sm"}
                      />
                    ))}
                  </div>
                )}

                {/* Pot display */}
                {potSize > 0 && !animateChipsToWinner && (
                  <div className={cn(
                    "flex items-center gap-3 transition-all duration-500 glass-panel px-4 py-2 rounded-2xl border-white/10 shadow-2xl border-0",
                    animateChipsToPot ? 'scale-110' : 'scale-100'
                  )}>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest text-center">Current Pot</span>
                      <span className="text-lg sm:text-2xl font-numbers text-accent-foreground font-bold whitespace-nowrap tabular-nums">
                        {formatCurrency(potSize)}
                      </span>
                    </div>
                    {showPotChips && <ChipStack amount={potSize} size="sm" showAmount={false} />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player positions */}
          <div className="absolute inset-0">
            {positions.map((position, index) => {
              const pos = getPlayerPosition(index);
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const positionLabel = getPositionLabel(position.player_id);
              const isButton = buttonPlayerId === position.player_id;
              const isFolded = foldedPlayers.includes(position.player_id);
              const isMucked = muckedPlayers.includes(position.player_id);
              const isWinner = animateChipsToWinner === position.player_id;
              const isActive = activePlayerId === position.player_id;
              const hasKnownCards = playerHoleCards && playerHoleCards[position.player_id];
              const shouldShowCards = !!hasKnownCards || (showAllPlayerCards && !isMucked);

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
                  isButton={isButton}
                  isFolded={isFolded}
                  isWinner={isWinner}
                  isActive={isActive}
                  hasKnownCards={hasKnownCards ?? false}
                  shouldShowCards={shouldShowCards}
                  stackAmount={playerStacks[position.player_id]}
                  allPlayerNames={allPlayerNames}
                  enableDragDrop={enableDragDrop}
                  scale={densityScale}
                  onPlayerClick={onPlayerClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              );
            })}
          </div>

          {/* Global Betting Chips Layer with Physics */}
          <BettingChipsLayer
            positions={positions}
            playerBets={playerBets}
            animateChipsToPot={animateChipsToPot}
            animatingPlayerId={animatingPlayerId}
            getPlayerPosition={getPlayerPosition}
          />
        </div>
      </div>
    </div>
  );
});

PokerTableView.displayName = 'PokerTableView';

export default PokerTableView;
