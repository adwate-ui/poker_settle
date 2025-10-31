import React from 'react';
import monarchCardBack from '@/assets/monarch-card-back.png';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), 'back', or '??'
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PokerCard = ({ card, size = 'md', className = '' }: PokerCardProps) => {
  // Handle card back
  if (!card || card === 'back' || card === '??') {
    const sizes = {
      sm: 'w-[58px] h-[84px]',
      md: 'w-[78px] h-[112px]',
      lg: 'w-[94px] h-[136px]',
    };
    
    return (
      <div className={`${sizes[size]} ${className} rounded-lg shadow-xl overflow-hidden relative bg-gray-900`}>
        <img 
          src={monarchCardBack} 
          alt="Card back" 
          className="w-full h-full object-contain"
        />
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
    'h': 'text-red-600',
    'd': 'text-red-600',
    'c': 'text-gray-900',
    's': 'text-gray-900',
  };

  // Increased by 30%: sm: 14*1.3=18.2, 20*1.3=26; md: 20*1.3=26, 28*1.3=36.4; lg: 24*1.3=31.2, 36*1.3=46.8
  const sizes = {
    sm: 'w-[58px] h-[84px]',
    md: 'w-[78px] h-[112px]',
    lg: 'w-[94px] h-[136px]',
  };

  const rankSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const suitSizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`${sizes[size]} ${className} rounded-lg shadow-xl overflow-hidden relative bg-white border-2 border-gray-200`}>
      {/* Card content - centered rank and suit vertically */}
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-1">
        {/* Rank */}
        <div className={`${rankSizes[size]} font-bold ${suitColors[suit]}`}>
          {rank}
        </div>
        
        {/* Suit symbol */}
        <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none`}>
          {suitSymbols[suit]}
        </div>
      </div>
    </div>
  );
};

export default PokerCard;
