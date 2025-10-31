import React from 'react';
import cardBackImage from '@/assets/card-back.png';
import cardFaceTemplate from '@/assets/card-face-template.png';

interface PokerCardProps {
  card: string; // Format: 'Ah' (Ace of hearts), 'Kd' (King of diamonds), etc., or 'back' for card back
  size?: 'sm' | 'md' | 'lg';
}

const PokerCard = ({ card, size = 'md' }: PokerCardProps) => {
  if (!card) return null;

  // Show card back if card is 'back' or '??'
  if (card === 'back' || card === '??' || card.length !== 2) {
    const sizes = {
      sm: 'w-18 h-26',
      md: 'w-26 h-36',
      lg: 'w-31 h-47',
    };

    return (
      <div className={`${sizes[size]} rounded-lg shadow-xl overflow-hidden`}>
        <img 
          src={cardBackImage} 
          alt="Card back"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

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
    sm: 'w-18 h-26 text-sm',
    md: 'w-26 h-36 text-base',
    lg: 'w-31 h-47 text-lg',
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
    <div
      className={`${sizes[size]} rounded-lg shadow-xl relative overflow-hidden`}
      style={{
        backgroundImage: `url(${cardFaceTemplate})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Corner rank and suit (top-left) */}
      <div className="absolute top-1.5 left-1.5 flex flex-col items-center leading-none">
        <div className={`${rankSizes[size]} font-bold ${suitColors[suit]}`}>
          {rank}
        </div>
        <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none -mt-1`} style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.3rem' : '1.6rem' }}>
          {suitSymbols[suit]}
        </div>
      </div>
      
      {/* Center suit symbol */}
      <div className={`flex-1 flex items-center justify-center ${suitSizes[size]} ${suitColors[suit]} leading-none`}>
        {suitSymbols[suit]}
      </div>
      
      {/* Corner rank and suit (bottom-right, rotated) */}
      <div className="absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none rotate-180">
        <div className={`${rankSizes[size]} font-bold ${suitColors[suit]}`}>
          {rank}
        </div>
        <div className={`${suitSizes[size]} ${suitColors[suit]} leading-none -mt-1`} style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.3rem' : '1.6rem' }}>
          {suitSymbols[suit]}
        </div>
      </div>
    </div>
  );
};

export default PokerCard;
