import React, { memo } from 'react';
import { CardBackSVG } from './PokerAssets';
import { useCardBackDesign } from '@/hooks/useCardBackDesign';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

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

const SuitIcon = ({ suit, className = "", fourColor = true }: { suit: string, className?: string, fourColor?: boolean }) => {
  const colors = fourColor ? {
    h: "#E11D48", // Rose Red
    s: "#0F172A", // Slate Black
    d: "#2563EB", // Royal Blue
    c: "#16A34A", // Green
  } : {
    h: "#E11D48",
    s: "#0F172A",
    d: "#E11D48",
    c: "#0F172A",
  };

  const path = SUIT_PATHS[suit as keyof typeof SUIT_PATHS];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={colors[suit as keyof typeof colors] || "currentColor"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} />
    </svg>
  );
};

const PokerCard = memo(({ card, size = 'md', className = '', fourColor = true }: PokerCardProps) => {
  const { design } = useCardBackDesign();

  // Handle card back - use SVG for better quality
  if (!card || card === 'back' || card === '??') {
    const sizeMap = {
      xxs: { width: 32, height: 46 },
      xs: { width: 40, height: 58 },
      sm: { width: 56, height: 80 },
      md: { width: 80, height: 112 },
      lg: { width: 96, height: 136 },
    };

    return (
      <div className={cn(className, "rounded-lg shadow-sm overflow-hidden border border-gray-200")}>
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
    xxs: 'w-8 aspect-[2.5/3.5]',
    xs: 'w-10 aspect-[2.5/3.5]',
    sm: 'w-14 aspect-[2.5/3.5]',
    md: 'w-20 aspect-[2.5/3.5]',
    lg: 'w-24 aspect-[2.5/3.5]',
  };

  const rankSizes = {
    xxs: 'text-[10px]',
    xs: 'text-[12px]',
    sm: 'text-[16px]',
    md: 'text-[22px]',
    lg: 'text-[26px]',
  };

  const suitIconSizes = {
    xxs: 'w-2 h-2',
    xs: 'w-2.5 h-2.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const cornerPadding = {
    xxs: 'p-0.5',
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const colors = fourColor ? {
    h: "text-[#E11D48]",
    s: "text-[#0F172A]",
    d: "text-[#2563EB]",
    c: "text-[#16A34A]",
  } : {
    h: "text-[#E11D48]",
    s: "text-[#0F172A]",
    d: "text-[#E11D48]",
    c: "text-[#0F172A]",
  };

  const rankColor = colors[suit as keyof typeof colors] || "text-gray-900";

  return (
    <div className={cn(
      containerSizes[size],
      className,
      "relative bg-white rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-gray-200 select-none overflow-hidden"
    )}>
      {/* Top-left corner index */}
      <div className={cn("absolute top-0 left-0 flex flex-col items-center leading-none z-10", cornerPadding[size])}>
        <div className={cn(rankSizes[size], "font-bold tracking-tighter", rankColor)}>
          {rank}
        </div>
        <SuitIcon suit={suit} fourColor={fourColor} className={suitIconSizes[size]} />
      </div>

      {/* Main Vision Area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isAce ? (
          <SuitIcon suit={suit} fourColor={fourColor} className={cn(
            size === 'lg' ? 'w-14 h-14' :
              size === 'md' ? 'w-11 h-11' :
                size === 'sm' ? 'w-8 h-8' : 'w-4 h-4'
          )} />
        ) : isFaceCard ? (
          <div className={cn(
            "rounded border border-gray-100 bg-gray-50/50 flex items-center justify-center relative",
            size === 'lg' ? 'w-16 h-24' :
              size === 'md' ? 'w-12 h-18' :
                size === 'sm' ? 'w-8 h-12' : 'w-4 h-6'
          )}>
            <Crown className={cn("opacity-20", rankColor,
              size === 'lg' ? 'w-10 h-10' :
                size === 'md' ? 'w-8 h-8' : 'w-4 h-4'
            )} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("font-bold", rankColor, rankSizes[size])}>{rank}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <SuitIcon suit={suit} fourColor={fourColor} className={cn(
              "opacity-10",
              size === 'lg' ? 'w-14 h-14' :
                size === 'md' ? 'w-11 h-11' :
                  size === 'sm' ? 'w-8 h-8' : 'w-4 h-4'
            )} />
            <div className={cn("absolute font-bold opacity-30", rankColor, rankSizes[size])}>
              {rank}
            </div>
          </div>
        )}
      </div>

      {/* Bottom-right corner index (rotated) */}
      <div className={cn("absolute bottom-0 right-0 flex flex-col items-center leading-none z-10 rotate-180", cornerPadding[size])}>
        <div className={cn(rankSizes[size], "font-bold tracking-tighter", rankColor)}>
          {rank}
        </div>
        <SuitIcon suit={suit} fourColor={fourColor} className={suitIconSizes[size]} />
      </div>

      {/* Subtle shine / highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
    </div>
  );
});

PokerCard.displayName = 'PokerCard';

export default PokerCard;
