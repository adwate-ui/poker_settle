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
    sm: 'w-12 h-16 text-sm',
    md: 'w-16 h-24 text-base',
    lg: 'w-20 h-28 text-lg',
  };

  const rankSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const suitSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div
      className={`${sizes[size]} bg-white dark:bg-gray-100 rounded-lg shadow-lg border-2 border-gray-300 flex flex-col items-center justify-between p-2 relative`}
    >
      <div className={`${rankSizes[size]} font-bold ${suitColors[suit]} leading-none`}>
        {rank}
      </div>
      <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none`}>
        {suitSymbols[suit]}
      </div>
      <div className={`${rankSizes[size]} font-bold ${suitColors[suit]} leading-none`}>
        {rank}
      </div>
    </div>
  );
};

export default PokerCard;
