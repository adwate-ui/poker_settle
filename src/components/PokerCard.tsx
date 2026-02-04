import React, { memo } from 'react';
import { CardBackSVG } from './PokerAssets';
import { useCardBackDesign } from '@/hooks/useCardBackDesign';
import { cn } from '@/lib/utils';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), 'back', or '??'
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  fourColor?: boolean;
}

// Global SVG Paths for perfect scaling
const SUIT_PATHS = {
  h: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  s: "M17,13c0,3-2.5,5-5,5c-1.5,0-2-1.5-2-1.5S9.5,18,8,18c-2.5,0-5-2-5-5c0-4,4-6,9-11C13,7,17,9,17,13z M12,19c0,0,1,1,1,3 h-2c0-2,1-3,1-3z",
  d: "M12,2L4.5,12L12,22l7.5-10L12,2z",
  c: "M16.5,15.5c0-2-1.5-3.5-3-4c1-1,2-2.5,2-4c0-2.5-2-4.5-4.5-4.5S6.5,5,6.5,7.5c0,1.5,1,3,2,4c-1.5,0.5-3,2-3,4 c0,2.5,2,4.5,4.5,4.5c0,0,0,0,0,0v4h4v-4c0,0,0,0,0,0C14.5,20,16.5,18,16.5,15.5z",
};

const SuitIcon = ({ suit, className = "", fourColor = true }: { suit: string, className?: string, fourColor?: boolean }) => {
  const getFill = (suit: string): string => {
    if (!fourColor) {
      // Traditional two-color deck
      if (suit === 'd' || suit === 'h') return "#be123c"; // Rose Red
      return "#0f172a"; // Slate 900
    }
    // Four-color deck
    switch (suit) {
      case 'h': return "#be123c"; // Rose Red (Hearts)
      case 's': return "#0f172a"; // Slate 900 (Spades)
      case 'd': return "#2563eb"; // Royal Blue (Diamonds)
      case 'c': return "#15803d"; // Emerald Green (Clubs)
      default: return "currentColor";
    }
  };

  const path = SUIT_PATHS[suit as keyof typeof SUIT_PATHS];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(className, "drop-shadow-sm")}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        fill={getFill(suit)}
      />
    </svg>
  );
};

const PokerCard = memo(({ card, size = 'md', className = '', fourColor = true }: PokerCardProps) => {
  const { design } = useCardBackDesign();

  // 1. Render Card Back or Placeholder
  if (!card || card === 'back' || card === '??') {
    const sizeMap = {
      xxs: { width: 32, height: 46 },
      xs: { width: 40, height: 58 },
      sm: { width: 56, height: 80 },
      md: { width: 80, height: 112 },
      lg: { width: 96, height: 136 },
    };

    return (
      <div className={cn(className, "rounded-lg shadow-xl overflow-hidden border border-white/10 ring-1 ring-black/20")}>
        <CardBackSVG {...sizeMap[size]} design={design} />
      </div>
    );
  }

  if (card.length < 2) return null;

  // 2. Parse Card Data
  const rank = card.length === 3 ? "10" : card[0].toUpperCase();
  const suit = card[card.length - 1].toLowerCase();

  const isFaceCard = ['J', 'Q', 'K'].includes(rank);
  const isAce = rank === 'A';

  // 3. Size Definitions (Optimized for Readability)
  const containerSizes = {
    xxs: 'w-8 aspect-[2.5/3.5] rounded-[4px]',
    xs: 'w-10 aspect-[2.5/3.5] rounded-[6px]',
    sm: 'w-14 aspect-[2.5/3.5] rounded-[8px]',
    md: 'w-20 aspect-[2.5/3.5] rounded-[10px]',
    lg: 'w-24 aspect-[2.5/3.5] rounded-[12px]',
  };

  const rankSizes = {
    xxs: 'text-[10px]',
    xs: 'text-[12px]',
    sm: 'text-[16px]',
    md: 'text-[24px]',
    lg: 'text-[28px]',
  };

  const centerSuitSizes = {
    xxs: 'w-5 h-5',
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const padding = {
    xxs: 'px-0.5 py-0.5',
    xs: 'px-1 py-0.5',
    sm: 'px-1.5 py-1',
    md: 'px-2 py-1.5',
    lg: 'px-2.5 py-2',
  };

  // 4. Color Logic (Luxurious Tones)
  const getRankColor = (s: string) => {
    if (!fourColor) {
      if (s === 'd' || s === 'h') return "text-[#be123c]"; // Rose Red
      return "text-[#0f172a]"; // Slate 900
    }
    switch (s) {
      case 'h': return "text-[#be123c]"; // Rose Red
      case 's': return "text-[#0f172a]"; // Slate 900
      case 'd': return "text-[#2563eb]"; // Royal Blue
      case 'c': return "text-[#15803d]"; // Emerald Green
      default: return "text-gray-900";
    }
  };

  const rankColor = getRankColor(suit);

  return (
    <div className={cn(
      containerSizes[size],
      className,
      "relative select-none overflow-hidden",
      "bg-gradient-to-br from-white to-stone-100", // Subtle Ivory Gradient
      "border border-stone-200/60",
      "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]", // Soft Luxury Shadow
      "group hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)] transition-shadow duration-300"
    )}>

      {/* Texture: Linen Filter (Preserved from original) */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-transparent mix-blend-multiply" style={{ filter: 'url(#linen-texture-filter)' }} />

      {/* Gloss: Inner shine for depth */}
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.05)] pointer-events-none z-20" />

      {/* --- Top Left Corner --- */}
      <div className={cn("absolute top-0 left-0 z-10 flex flex-col items-center leading-none", padding[size])}>
        <span className={cn("font-luxury font-bold tracking-tighter", rankSizes[size], rankColor)}>
          {rank}
        </span>
      </div>

      {/* --- Center Visual --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {isFaceCard ? (
          // Face Cards: Gold Ring Accent
          <div className="relative flex items-center justify-center">
            <div className={cn(
              "absolute rounded-full border border-amber-400/30 bg-amber-50/50",
              size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-14 h-14' : 'w-10 h-10'
            )} />
            <SuitIcon suit={suit} fourColor={fourColor} className={centerSuitSizes[size]} />
          </div>
        ) : (
          // Number Cards: Clean Center Suit
          <SuitIcon suit={suit} fourColor={fourColor} className={centerSuitSizes[size]} />
        )}
      </div>

      {/* --- Bottom Right Corner (Rotated) --- */}
      <div className={cn("absolute bottom-0 right-0 z-10 flex flex-col items-center leading-none rotate-180", padding[size])}>
        <span className={cn("font-luxury font-bold tracking-tighter", rankSizes[size], rankColor)}>
          {rank}
        </span>
      </div>

    </div>
  );
});

PokerCard.displayName = 'PokerCard';

export default PokerCard;
