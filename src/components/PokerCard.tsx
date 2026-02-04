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
      className={cn(className)}
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

  if (!card || card === 'back' || card === '??') {
    const sizeMap = {
      xxs: { width: 32, height: 46 },
      xs: { width: 40, height: 58 },
      sm: { width: 56, height: 80 },
      md: { width: 80, height: 112 },
      lg: { width: 96, height: 136 },
    };

    return (
      <div className={cn(className, "rounded-lg shadow-md overflow-hidden border border-gray-400/30 ring-1 ring-black/5")}>
        <CardBackSVG {...sizeMap[size]} design={design} />
      </div>
    );
  }

  if (card.length < 2) return null;

  const rank = card.length === 3 ? "10" : card[0].toUpperCase();
  const suit = card[card.length - 1].toLowerCase();

  const isFaceCard = ['J', 'Q', 'K'].includes(rank);
  const isAce = rank === 'A';

  const containerSizes = {
    xxs: 'w-8 aspect-[2.5/3.5] rounded-[3px]',
    xs: 'w-10 aspect-[2.5/3.5] rounded-[4px]',
    sm: 'w-14 aspect-[2.5/3.5] rounded-[6px]',
    md: 'w-20 aspect-[2.5/3.5] rounded-[8px]',
    lg: 'w-24 aspect-[2.5/3.5] rounded-[10px]',
  };

  const rankSizes = {
    xxs: 'text-[9px]',
    xs: 'text-[8px]',
    sm: 'text-[13px]',
    md: 'text-[21px]',
    lg: 'text-[25px]',
  };

  const suitIconSizes = {
    xxs: 'w-1.5 h-1.5',
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const cornerPadding = {
    xxs: 'p-0',
    xs: 'p-0',
    sm: 'p-0.5',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const getRankColor = (s: string) => {
    if (!fourColor) {
      if (s === 'd' || s === 'h') return "text-[#ef4444]";
      return "text-[#111827]";
    }
    switch (s) {
      case 'h': return "text-[#ef4444]";
      case 's': return "text-[#111827]";
      case 'd': return "text-[#3b82f6]";
      case 'c': return "text-[#22c55e]";
      default: return "text-gray-900";
    }
  };

  const rankColor = getRankColor(suit);

  return (
    <div className={cn(
      containerSizes[size],
      className,
      "relative select-none overflow-hidden border border-black/10",
      "bg-white",
      "shadow-[0_4px_10px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]",
      "group"
    )}>

      {/* 1. Linen Texture Overlay (Filter-based) */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-transparent" style={{ filter: 'url(#linen-texture-filter)' }} />

      {/* 2. Inner Glow/Coating */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/40 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] pointer-events-none" />

      {/* Top-left corner index */}
      <div className={cn("absolute top-0 left-0 flex flex-col items-center leading-none z-10", cornerPadding[size])}>
        <div className={cn(
          rankSizes[size],
          "font-serif font-bold tracking-tight mb-[1px]",
          rankColor
        )} style={{ fontFamily: '"Playfair Display", "Bodoni MT", serif' }}>
          {rank}
        </div>
        <SuitIcon suit={suit} fourColor={fourColor} className={suitIconSizes[size]} />
      </div>

      {/* Main Vision Area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isFaceCard ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Royal Gold Frame */}
            <div className={cn(
              "absolute border-[1px] rounded-[2px] opacity-40",
              size === 'lg' ? 'w-[78%] h-[82%]' : size === 'md' ? 'w-[75%] h-[80%]' : 'w-[70%] h-[75%]'
            )} style={{
              borderImage: 'linear-gradient(to bottom right, #fbbf24, #d97706, #b45309) 1',
              borderStyle: 'solid'
            }} />

            {/* Background Monogram */}
            <span className={cn(
              "absolute font-serif italic font-black opacity-[0.05] select-none",
              rankColor,
              size === 'lg' ? 'text-[60px]' : size === 'md' ? 'text-[50px]' : 'text-[30px]'
            )} style={{ fontFamily: '"Playfair Display", serif' }}>
              {rank}
            </span>

            <SuitIcon suit={suit} fourColor={fourColor} applyDepth className={cn(
              "relative z-10",
              size === 'lg' ? 'w-12 h-12' :
                size === 'md' ? 'w-10 h-10' :
                  size === 'sm' ? 'w-6 h-6' : 'w-4 h-4'
            )} />
          </div>
        ) : isAce ? (
          <div className="relative flex items-center justify-center">
            {/* Sunburst/Halo Effect */}
            <div className={cn(
              "absolute rounded-full bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-xl animate-pulse",
              size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-12 h-12'
            )} />

            <SuitIcon suit={suit} fourColor={fourColor} applyDepth className={cn(
              "relative z-10",
              size === 'lg' ? 'w-20 h-20' :
                size === 'md' ? 'w-16 h-16' :
                  size === 'sm' ? 'w-12 h-12' : 'w-8 h-8'
            )} />
          </div>
        ) : (
          <SuitIcon suit={suit} fourColor={fourColor} applyDepth className={cn(
            size === 'lg' ? 'w-14 h-14' :
              size === 'md' ? 'w-12 h-12' :
                size === 'sm' ? 'w-8 h-8' : 'w-5 h-5'
          )} />
        )}
      </div>

      {/* Bottom-right corner index (rotated) */}
      <div className={cn("absolute bottom-0 right-0 flex flex-col items-center leading-none z-10 rotate-180", cornerPadding[size])}>
        <div className={cn(
          rankSizes[size],
          "font-serif font-bold tracking-tight mb-[1px]",
          rankColor
        )} style={{ fontFamily: '"Playfair Display", "Bodoni MT", serif' }}>
          {rank}
        </div>
        <SuitIcon suit={suit} fourColor={fourColor} className={suitIconSizes[size]} />
      </div>
    </div>
  );
});

PokerCard.displayName = 'PokerCard';

export default PokerCard;
