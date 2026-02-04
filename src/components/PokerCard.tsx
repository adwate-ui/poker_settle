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
  h: "M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z",
  s: "M12 2c-1.121 0-2.023.902-2.023 2.023 0 .8.463 1.487 1.124 1.821C8.219 5.378 6 3 6 3S3 6 3 9.5c0 3.5 4.5 8.5 7.5 11.5V23h-3v2h9v-2h-3v-2c3-3 7.5-8 7.5-11.5 0-3.5-3-6.5-3-6.5s-2.219 2.378-5.101 2.844c.661-.334 1.124-1.021 1.124-1.821C14.023 2.902 13.121 2 12 2z",
  d: "M12 2L4.5 12L12 22L19.5 12L12 2Z",
  c: "M12 2c-1.657 0-3 1.343-3 3 0 .762.284 1.455.75 1.987C7.306 7.6 5 10 5 13c0 2.209 1.791 4 4 4 .581 0 1.126-.124 1.616-.346C10.244 17.545 10 18.682 10 20c0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.318-.244-2.455-.616-3.346.49.222 1.035.346 1.616.346 2.209 0 4-1.791 4-4 0-3-2.306-5.4-4.75-6.013.466-.532.75-1.225.75-1.987 0-1.657-1.343-3-3-3s-3 1.343-3 3c0 .762.284 1.455.75 1.987-2.444.613-4.75 3.013-4.75 6.013 0 2.209 1.791 4 4 4 .581 0 1.126-.124 1.616-.346-.372.891-.616 2.028-.616 3.346 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.318-.244-2.455-.616-3.346.49.222 1.035.346 1.616.346 2.209 0 4-1.791 4-4 0-3-2.306-5.4-4.75-6.013.466-.532.75-1.225.75-1.987 0-1.657-1.343-3-3-3z",
};

const SuitIcon = ({ suit, className = "", fourColor = true, applyDepth = false }: { suit: string, className?: string, fourColor?: boolean, applyDepth?: boolean }) => {
  const getFill = (suit: string) => {
    if (!fourColor) {
      if (suit === 'd' || suit === 'h') return "url(#grad-hearts)";
      return "url(#grad-spades)";
    }
    switch (suit) {
      case 'h': return "url(#grad-hearts)";
      case 's': return "url(#grad-spades)";
      case 'd': return "url(#grad-diamonds)";
      case 'c': return "url(#grad-clubs)";
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
        filter={applyDepth ? "url(#ink-depth)" : undefined}
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
            <SuitIcon suit={suit} fourColor={fourColor} applyDepth className={centerSuitSizes[size]} />
          </div>
        ) : (
          // Number Cards: Clean Center Suit
          <SuitIcon suit={suit} fourColor={fourColor} applyDepth className={centerSuitSizes[size]} />
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
