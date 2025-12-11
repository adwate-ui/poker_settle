import React, { memo } from 'react';
import { CardBackSVG } from './PokerAssets';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), 'back', or '??'
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const PokerCard = memo(({ card, size = 'md', className = '' }: PokerCardProps) => {
  // Handle card back - use SVG for better quality
  if (!card || card === 'back' || card === '??') {
    const sizeMap = {
      xs: { width: 40, height: 58 },
      sm: { width: 58, height: 84 },
      md: { width: 78, height: 112 },
      lg: { width: 94, height: 136 },
    };
    
    return (
      <div className={`${className} rounded-lg shadow-xl overflow-hidden`}>
        <CardBackSVG {...sizeMap[size]} />
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

  const suitColors: Record<string, string> = {
    'h': '#DC2626', // Red 600
    'd': '#DC2626', // Red 600
    'c': '#1F2937', // Gray 800
    's': '#1F2937', // Gray 800
  };

  const sizes = {
    xs: 'w-[40px] h-[58px]',
    sm: 'w-[58px] h-[84px]',
    md: 'w-[78px] h-[112px]',
    lg: 'w-[94px] h-[136px]',
  };

  const rankSizes = {
    xs: 'text-sm',
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const suitSizes = {
    xs: 'text-xl',
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  };

  const cornerSizes = {
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <div className={`${sizes[size]} ${className} rounded-lg shadow-lg overflow-hidden relative bg-white dark:bg-gray-50 border border-gray-400`}>
      {/* Top-left corner index */}
      <div className={`absolute top-0 left-0 ${cornerSizes[size]} flex flex-col items-center leading-none`}>
        <div className={`${rankSizes[size]} font-extrabold`} style={{ color: suitColors[suit] }}>
          {rank}
        </div>
        <div className={`${rankSizes[size]} -mt-0.5`} style={{ color: suitColors[suit] }}>
          {suitSymbols[suit]}
        </div>
      </div>
      
      {/* Bottom-right corner index (rotated) */}
      <div className={`absolute bottom-0 right-0 ${cornerSizes[size]} flex flex-col items-center leading-none rotate-180`}>
        <div className={`${rankSizes[size]} font-extrabold`} style={{ color: suitColors[suit] }}>
          {rank}
        </div>
        <div className={`${rankSizes[size]} -mt-0.5`} style={{ color: suitColors[suit] }}>
          {suitSymbols[suit]}
        </div>
      </div>

      {/* Center suit symbol - larger and more prominent with professional styling */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${suitSizes[size]} leading-none font-bold`} style={{ color: suitColors[suit], opacity: 0.15 }}>
          {suitSymbols[suit]}
        </div>
      </div>
      
      {/* Crisp border for professional look */}
      <div className="absolute inset-0 rounded-lg border-2 border-black/10 pointer-events-none"></div>
    </div>
  );
});

PokerCard.displayName = 'PokerCard';

export default PokerCard;
