import React, { memo } from 'react';
import { CardBackSVG } from './PokerAssets';
import { useCardBackDesign } from '@/hooks/useCardBackDesign';
import { cn } from '@/lib/utils';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), 'back', or '??'
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const PokerCard = memo(({ card, size = 'md', className = '' }: PokerCardProps) => {
  const { design } = useCardBackDesign();

  // Handle card back - use SVG for better quality
  if (!card || card === 'back' || card === '??') {
    const sizeMap = {
      xxs: { width: 32, height: 46 },
      xs: { width: 40, height: 58 },
      sm: { width: 58, height: 84 },
      md: { width: 78, height: 112 },
      lg: { width: 94, height: 136 },
    };

    return (
      <div className={`${className} rounded-lg shadow-xl overflow-hidden`}>
        <CardBackSVG {...sizeMap[size]} design={design} />
      </div>
    );
  }

  if (card.length !== 2) return null;

  const rank = card[0].toUpperCase();
  const suit = card[1].toLowerCase();

  const suitSymbols: Record<string, string> = {
    'h': '♥',
    'd': '♦',
    'c': '♣',
    's': '♠',
  };

  const isRed = suit === 'h' || suit === 'd';
  const suitColorClass = isRed ? 'text-destructive' : 'text-foreground';

  const sizes = {
    xxs: 'w-8 aspect-[2.5/3.5]',
    xs: 'w-10 aspect-[2.5/3.5]',
    sm: 'w-14 aspect-[2.5/3.5]',
    md: 'w-20 aspect-[2.5/3.5]',
    lg: 'w-24 aspect-[2.5/3.5]',
  };

  const rankSizes = {
    xxs: 'text-3xs',
    xs: 'text-2xs',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const suitSizes = {
    xxs: 'text-base',
    xs: 'text-lg',
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const cornerSizes = {
    xxs: 'p-0.5',
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <div className={cn(sizes[size], className, "rounded-[var(--radius)] shadow-md overflow-hidden relative bg-card text-card-foreground border border-border")}>
      {/* Top-left corner index */}
      <div className={cn("absolute top-0 left-0", cornerSizes[size], "flex flex-col items-center leading-none")}>
        <div className={cn(rankSizes[size], "font-black", suitColorClass)}>
          {rank}
        </div>
        <div className={cn(rankSizes[size], "-mt-0.5", suitColorClass)}>
          {suitSymbols[suit]}
        </div>
      </div>

      {/* Bottom-right corner index (rotated) */}
      <div className={cn("absolute bottom-0 right-0", cornerSizes[size], "flex flex-col items-center leading-none rotate-180")}>
        <div className={cn(rankSizes[size], "font-black", suitColorClass)}>
          {rank}
        </div>
        <div className={cn(rankSizes[size], "-mt-0.5", suitColorClass)}>
          {suitSymbols[suit]}
        </div>
      </div>

      {/* Center suit symbol - larger and more prominent with professional styling */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={cn(suitSizes[size], "leading-none font-bold opacity-10", suitColorClass)}>
          {suitSymbols[suit]}
        </div>
      </div>

      {/* Crisp overlay for texture */}
      <div className="absolute inset-0 rounded-[var(--radius)] border border-border/20 pointer-events-none"></div>
    </div>
  );
});

PokerCard.displayName = 'PokerCard';

export default PokerCard;
