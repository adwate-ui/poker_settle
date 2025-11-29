/**
 * Card utility functions with memoization for performance
 */

const cardCache = new Map<string, boolean>();

/**
 * Validate card notation format (memoized)
 */
export const isValidCard = (card: string): boolean => {
  if (cardCache.has(card)) {
    return cardCache.get(card)!;
  }
  
  if (!card || card.length !== 2) {
    cardCache.set(card, false);
    return false;
  }
  
  const validRanks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const validSuits = ['h', 'd', 'c', 's', 'H', 'D', 'C', 'S'];
  
  const isValid = validRanks.includes(card[0].toUpperCase()) && validSuits.includes(card[1]);
  cardCache.set(card, isValid);
  return isValid;
};

/**
 * Parse card notation into array (memoized)
 */
const parseCache = new Map<string, string[]>();

export const parseCards = (notation: string): string[] => {
  if (parseCache.has(notation)) {
    return parseCache.get(notation)!;
  }
  
  const cards = notation.match(/.{1,2}/g) || [];
  const validCards = cards.filter(isValidCard);
  parseCache.set(notation, validCards);
  return validCards;
};

/**
 * Check for duplicate cards across multiple notations
 */
export const hasDuplicateCards = (notations: string[]): boolean => {
  const allCards = new Set<string>();
  
  for (const notation of notations) {
    const cards = parseCards(notation);
    for (const card of cards) {
      const normalized = card.toUpperCase();
      if (allCards.has(normalized)) {
        return true;
      }
      allCards.add(normalized);
    }
  }
  
  return false;
};

/**
 * Get unique cards from multiple notations
 */
export const getUniqueCards = (notations: string[]): string[] => {
  const uniqueCards = new Set<string>();
  
  for (const notation of notations) {
    const cards = parseCards(notation);
    cards.forEach(card => uniqueCards.add(card.toUpperCase()));
  }
  
  return Array.from(uniqueCards);
};

/**
 * Clear card caches (call when needed to free memory)
 */
export const clearCardCaches = (): void => {
  cardCache.clear();
  parseCache.clear();
};
