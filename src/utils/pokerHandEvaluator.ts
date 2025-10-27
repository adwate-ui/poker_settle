// Poker hand evaluator utility
// This will evaluate poker hands and determine winners

interface Card {
  rank: string;
  suit: string;
}

interface HandResult {
  playerId: string;
  playerName: string;
  handRank: number;
  handName: string;
  holeCards: string;
  bestHand: string[];
}

// Convert notation to card objects
const parseCard = (notation: string): Card => {
  const rankMap: Record<string, string> = {
    'A': '14', 'K': '13', 'Q': '12', 'J': '11', 'T': '10',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2'
  };
  
  return {
    rank: rankMap[notation[0].toUpperCase()] || notation[0],
    suit: notation[1].toLowerCase()
  };
};

// Hand ranking values (higher is better)
const HAND_RANKS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
};

const evaluateHand = (cards: Card[]): { rank: number; name: string; bestCards: Card[] } => {
  if (cards.length < 5) {
    return { rank: 0, name: 'Invalid Hand', bestCards: [] };
  }

  // Sort cards by rank (descending)
  const sorted = [...cards].sort((a, b) => parseInt(b.rank) - parseInt(a.rank));
  
  // Check for flush
  const suitCounts: Record<string, Card[]> = {};
  sorted.forEach(card => {
    if (!suitCounts[card.suit]) suitCounts[card.suit] = [];
    suitCounts[card.suit].push(card);
  });
  const flushSuit = Object.keys(suitCounts).find(suit => suitCounts[suit].length >= 5);
  const isFlush = !!flushSuit;
  const flushCards = flushSuit ? suitCounts[flushSuit] : [];

  // Check for straight
  const checkStraight = (cardSet: Card[]): Card[] | null => {
    const uniqueRanks = Array.from(new Set(cardSet.map(c => parseInt(c.rank)))).sort((a, b) => b - a);
    
    // Check for ace-low straight (A-2-3-4-5)
    if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && 
        uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
      return cardSet.filter(c => ['14', '2', '3', '4', '5'].includes(c.rank)).slice(0, 5);
    }
    
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        const straightRanks = uniqueRanks.slice(i, i + 5);
        return cardSet.filter(c => straightRanks.includes(parseInt(c.rank))).slice(0, 5);
      }
    }
    return null;
  };

  const straight = checkStraight(sorted);
  const isStraight = !!straight;

  // Check for straight flush / royal flush
  if (isFlush && flushCards.length >= 5) {
    const straightFlush = checkStraight(flushCards);
    if (straightFlush) {
      const highCard = Math.max(...straightFlush.map(c => parseInt(c.rank)));
      if (highCard === 14 && straightFlush.some(c => c.rank === '13')) {
        return { rank: HAND_RANKS.ROYAL_FLUSH, name: 'Royal Flush', bestCards: straightFlush };
      }
      return { rank: HAND_RANKS.STRAIGHT_FLUSH, name: 'Straight Flush', bestCards: straightFlush };
    }
  }

  // Count ranks for pairs, trips, quads
  const rankCounts: Record<string, Card[]> = {};
  sorted.forEach(card => {
    if (!rankCounts[card.rank]) rankCounts[card.rank] = [];
    rankCounts[card.rank].push(card);
  });

  const groups = Object.values(rankCounts).sort((a, b) => {
    if (a.length !== b.length) return b.length - a.length;
    return parseInt(b[0].rank) - parseInt(a[0].rank);
  });

  // Four of a kind
  if (groups[0].length === 4) {
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      name: 'Four of a Kind',
      bestCards: [...groups[0], groups[1][0]]
    };
  }

  // Full house
  if (groups[0].length === 3 && groups[1].length >= 2) {
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      name: 'Full House',
      bestCards: [...groups[0], ...groups[1].slice(0, 2)]
    };
  }

  // Flush
  if (isFlush) {
    return {
      rank: HAND_RANKS.FLUSH,
      name: 'Flush',
      bestCards: flushCards.slice(0, 5)
    };
  }

  // Straight
  if (isStraight && straight) {
    return {
      rank: HAND_RANKS.STRAIGHT,
      name: 'Straight',
      bestCards: straight
    };
  }

  // Three of a kind
  if (groups[0].length === 3) {
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      name: 'Three of a Kind',
      bestCards: [...groups[0], groups[1][0], groups[2][0]]
    };
  }

  // Two pair
  if (groups[0].length === 2 && groups[1].length === 2) {
    return {
      rank: HAND_RANKS.TWO_PAIR,
      name: 'Two Pair',
      bestCards: [...groups[0], ...groups[1], groups[2][0]]
    };
  }

  // One pair
  if (groups[0].length === 2) {
    return {
      rank: HAND_RANKS.ONE_PAIR,
      name: 'One Pair',
      bestCards: [...groups[0], groups[1][0], groups[2][0], groups[3][0]]
    };
  }

  // High card
  return {
    rank: HAND_RANKS.HIGH_CARD,
    name: 'High Card',
    bestCards: sorted.slice(0, 5)
  };
};

export const determineWinner = (
  players: Array<{ playerId: string; playerName: string; holeCards: string }>,
  communityCards: string
): { winners: HandResult[]; allHands: HandResult[] } | null => {
  if (players.length === 0) return null;

  const community = communityCards.match(/.{1,2}/g)?.map(parseCard) || [];
  
  const results: HandResult[] = players.map(player => {
    const hole = player.holeCards.match(/.{1,2}/g)?.map(parseCard) || [];
    const allCards = [...hole, ...community];
    
    // Evaluate all possible 5-card combinations
    let bestResult = { rank: 0, name: 'Invalid', bestCards: [] as Card[] };
    
    if (allCards.length >= 5) {
      // For simplicity, we'll evaluate the best 5 from 7 cards
      // In a production app, you'd check all 21 combinations
      bestResult = evaluateHand(allCards);
    }

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      handRank: bestResult.rank,
      handName: bestResult.name,
      holeCards: player.holeCards,
      bestHand: bestResult.bestCards.map(c => {
        const rankMap: Record<string, string> = {
          '14': 'A', '13': 'K', '12': 'Q', '11': 'J', '10': 'T'
        };
        const displayRank = rankMap[c.rank] || c.rank;
        return displayRank + c.suit.toUpperCase();
      })
    };
  });

  // Sort by hand rank (descending), then by high card values
  results.sort((a, b) => {
    if (a.handRank !== b.handRank) return b.handRank - a.handRank;
    
    // If same hand rank, compare high cards in best hand
    for (let i = 0; i < 5; i++) {
      const aCard = a.bestHand[i] ? parseCard(a.bestHand[i]) : null;
      const bCard = b.bestHand[i] ? parseCard(b.bestHand[i]) : null;
      
      if (!aCard || !bCard) break;
      
      const aRank = parseInt(aCard.rank);
      const bRank = parseInt(bCard.rank);
      
      if (aRank !== bRank) return bRank - aRank;
    }
    
    return 0;
  });

  // Find all winners (players with same hand as top player)
  const topHandRank = results[0].handRank;
  const topBestHand = results[0].bestHand;
  
  const winners = results.filter(result => {
    if (result.handRank !== topHandRank) return false;
    
    // Compare all cards to detect exact tie
    for (let i = 0; i < 5; i++) {
      const resultCard = result.bestHand[i] ? parseCard(result.bestHand[i]) : null;
      const topCard = topBestHand[i] ? parseCard(topBestHand[i]) : null;
      
      if (!resultCard || !topCard) return false;
      
      if (parseInt(resultCard.rank) !== parseInt(topCard.rank)) return false;
    }
    
    return true;
  });

  return {
    winners: winners,
    allHands: results
  };
};

export const formatCardNotation = (notation: string): string => {
  if (!notation || notation.length < 2) return notation;
  
  const suitSymbols: Record<string, string> = {
    'h': '♥', 'H': '♥',
    'd': '♦', 'D': '♦',
    'c': '♣', 'C': '♣',
    's': '♠', 'S': '♠'
  };
  
  const cards = notation.match(/.{1,2}/g) || [];
  return cards.map(card => {
    const rank = card[0].toUpperCase();
    const suit = suitSymbols[card[1]] || card[1];
    return rank + suit;
  }).join(' ');
};
