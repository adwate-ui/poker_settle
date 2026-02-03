import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PokerCard from './PokerCard';
import CardSelector from './CardSelector';
import { AlertCircle, Grid3x3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface CardNotationInputProps {
  label: string;
  expectedCards: number;
  onSubmit: (cards: string) => void;
  placeholder?: string;
  usedCards?: string[];
}

const CardNotationInput = ({ label, expectedCards, onSubmit, placeholder, usedCards = [] }: CardNotationInputProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const validateCards = (notation: string): boolean => {
    // Remove spaces and convert to uppercase
    const cleaned = notation.replace(/\s+/g, '').toUpperCase();

    // Check if length is correct (2 chars per card)
    if (cleaned.length !== expectedCards * 2) {
      setError(`Please enter exactly ${expectedCards} card${expectedCards > 1 ? 's' : ''}`);
      return false;
    }

    // Validate each card
    const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const validSuits = ['H', 'D', 'C', 'S'];

    for (let i = 0; i < cleaned.length; i += 2) {
      const rank = cleaned[i];
      const suit = cleaned[i + 1];

      if (!validRanks.includes(rank) || !validSuits.includes(suit)) {
        setError('Invalid card notation. Use format: Ah (Ace of hearts), Kd (King of diamonds), etc.');
        return false;
      }
    }

    // Check for duplicates
    const cards = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      cards.push(cleaned.slice(i, i + 2));
    }
    const uniqueCards = new Set(cards);
    if (uniqueCards.size !== cards.length) {
      setError('Duplicate cards detected');
      return false;
    }

    setError('');
    return true;
  };

  const parseCards = (notation: string): string[] => {
    const cleaned = notation.replace(/\s+/g, '').toUpperCase();
    const cards = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      cards.push(cleaned.slice(i, i + 2));
    }
    return cards;
  };

  const handleSelectorSubmit = (cards: string) => {
    setInput(cards);
    if (validateCards(cards)) {
      onSubmit(cards);
      setInput('');
    }
  };

  // Only parse cards if input is complete enough
  const cleaned = input.replace(/\s+/g, '').toUpperCase();
  const cards = cleaned.length >= 2 && cleaned.length % 2 === 0 ? parseCards(input) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-luxury tracking-widest text-gold-500/60 uppercase">{label}</Label>
        <CardSelector
          maxCards={expectedCards}
          usedCards={usedCards}
          selectedCards={cards}
          onSelect={handleSelectorSubmit}
          label={`Select ${expectedCards} Card${expectedCards > 1 ? 's' : ''}`}
          trigger={
            <Button variant="outline" type="button" className="h-9 bg-white/5 border-white/10 hover:bg-gold-500/10 text-gold-200 font-luxury text-[10px] uppercase tracking-widest rounded-full">
              <Grid3x3 className="w-3.5 h-3.5 mr-2 text-gold-500" />
              Grid Selection
            </Button>
          }
        />
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs uppercase tracking-wider font-luxury">{error}</AlertDescription>
        </Alert>
      )}

      {cards.length > 0 && !error && (
        <div className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-green-900/40 to-green-950/60 border border-green-500/20 rounded-xl shadow-inner">
          {cards.map((card, idx) => (
            <PokerCard key={idx} card={card} size="md" />
          ))}
        </div>
      )}
    </div>
  );
};

export default CardNotationInput;
