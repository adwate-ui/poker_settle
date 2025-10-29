import React from 'react';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), etc.
  size?: 'sm' | 'md' | 'lg';
}

const PokerCard = ({ card, size = 'md' }: PokerCardProps) => {
  if (!card || card.length !== 2) return null;

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
    'c': 'text-gray-900 dark:text-gray-100',
    's': 'text-gray-900 dark:text-gray-100',
  };

  const sizes = {
    sm: 'w-14 h-20 text-sm',
    md: 'w-20 h-28 text-base',
    lg: 'w-24 h-36 text-lg',
  };

  const rankSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const suitSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div
      className={`${sizes[size]} bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col p-1.5 relative overflow-hidden`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      }}
    >
      {/* Corner rank and suit (top-left) */}
      <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
        <div className={`${rankSizes[size]} font-bold ${suitColors[suit]}`}>
          {rank}
        </div>
        <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none -mt-1`} style={{ fontSize: size === 'sm' ? '0.8rem' : size === 'md' ? '1rem' : '1.2rem' }}>
          {suitSymbols[suit]}
        </div>
      </div>
      
      {/* Center suit symbol */}
      <div className={`flex-1 flex items-center justify-center ${suitSizes[size]} ${suitColors[suit]} leading-none`}>
        {suitSymbols[suit]}
      </div>
      
      {/* Corner rank and suit (bottom-right, rotated) */}
      <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180">
        <div className={`${rankSizes[size]} font-bold ${suitColors[suit]}`}>
          {rank}
        </div>
        <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none -mt-1`} style={{ fontSize: size === 'sm' ? '0.8rem' : size === 'md' ? '1rem' : '1.2rem' }}>
          {suitSymbols[suit]}
        </div>
      </div>
    </div>
  );
};

export default PokerCard;
