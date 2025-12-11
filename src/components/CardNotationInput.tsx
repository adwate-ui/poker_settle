import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PokerCard from './PokerCard';
import CardSelector from './CardSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Grid3x3 } from 'lucide-react';

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

  const handleSubmit = () => {
    if (validateCards(input)) {
      onSubmit(input.replace(/\s+/g, '').toUpperCase());
      setInput('');
    }
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
  
  // Check if input is complete without triggering validation errors
  const isComplete = cleaned.length === expectedCards * 2;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || `e.g., AhKd${expectedCards > 2 ? '2c' : ''}`}
          className="uppercase"
          maxLength={expectedCards * 3} // Allow for spaces
        />
        <Button onClick={handleSubmit} disabled={!isComplete}>
          Show Cards
        </Button>
        <CardSelector
          maxCards={expectedCards}
          usedCards={usedCards}
          selectedCards={cards}
          onSelect={handleSelectorSubmit}
          label={`Select ${expectedCards} Card${expectedCards > 1 ? 's' : ''}`}
          trigger={
            <Button variant="outline" type="button">
              <Grid3x3 className="w-4 h-4" />
            </Button>
          }
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cards.length > 0 && !error && (
        <div className="flex gap-2 justify-center flex-wrap p-4 bg-gradient-to-br from-green-700 to-green-900 rounded-lg">
          {cards.map((card, idx) => (
            <PokerCard key={idx} card={card} size="md" />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Format: Rank (2-9, T, J, Q, K, A) + Suit (h=hearts, d=diamonds, c=clubs, s=spades)
      </p>
    </div>
  );
};

export default CardNotationInput;
