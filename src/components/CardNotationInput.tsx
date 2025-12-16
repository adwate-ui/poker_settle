import React, { useState } from 'react';
import { TextInput, Text, Alert, Group, Stack } from '@mantine/core';
import { Button } from '@/components/ui/button';
import PokerCard from './PokerCard';
import CardSelector from './CardSelector';
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
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>{label}</Text>
        <CardSelector
          maxCards={expectedCards}
          usedCards={usedCards}
          selectedCards={cards}
          onSelect={handleSelectorSubmit}
          label={`Select ${expectedCards} Card${expectedCards > 1 ? 's' : ''}`}
          trigger={
            <Button variant="outline" type="button">
              <Grid3x3 className="w-4 h-4" />
              Select Cards from Grid
            </Button>
          }
        />
      </Group>

      {error && (
        <Alert color="red" icon={<AlertCircle className="h-4 w-4" />}>
          {error}
        </Alert>
      )}

      {cards.length > 0 && !error && (
        <Group gap="xs" justify="center" className="p-4 bg-gradient-to-br from-green-700 to-green-900 rounded-lg">
          {cards.map((card, idx) => (
            <PokerCard key={idx} card={card} size="md" />
          ))}
        </Group>
      )}
    </Stack>
  );
};

export default CardNotationInput;
