// Utility functions for filtering poker hands based on hole cards

export type HoleCardFilterType =
  | 'all'
  | 'pairs'
  | 'ax_suited'
  | 'kx_suited'
  | 'ax_offsuit'
  | 'kx_offsuit'
  | 'broadway_suited'
  | 'broadway_offsuit'
  | 'suited_connectors'
  | 'offsuit_connectors'
  | 'suited_one_gappers'
  | 'offsuit_one_gappers'
  | 'suited_two_gappers'
  | 'offsuit_two_gappers'
  | 'suited_others'
  | 'offsuit_others';

export const HOLE_CARD_FILTER_OPTIONS: { value: HoleCardFilterType; label: string }[] = [
  { value: 'all', label: 'All Cards' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'ax_suited', label: 'Ax Suited' },
  { value: 'kx_suited', label: 'Kx Suited' },
  { value: 'ax_offsuit', label: 'Ax Offsuit' },
  { value: 'kx_offsuit', label: 'Kx Offsuit' },
  { value: 'broadway_suited', label: 'Broadway Suited' },
  { value: 'broadway_offsuit', label: 'Broadway Offsuit' },
  { value: 'suited_connectors', label: 'Suited Connectors' },
  { value: 'offsuit_connectors', label: 'Offsuit Connectors' },
  { value: 'suited_one_gappers', label: 'Suited One Gappers' },
  { value: 'offsuit_one_gappers', label: 'Offsuit One Gappers' },
  { value: 'suited_two_gappers', label: 'Suited Two Gappers' },
  { value: 'offsuit_two_gappers', label: 'Offsuit Two Gappers' },
  { value: 'suited_others', label: 'Suited Others' },
  { value: 'offsuit_others', label: 'Offsuit Others' },
];

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const BROADWAY_CARDS = ['T', 'J', 'Q', 'K', 'A'];

export function parseHoleCards(holeCards: string): { rank1: string; suit1: string; rank2: string; suit2: string } | null {
  if (!holeCards || holeCards.length !== 4) return null;
  
  return {
    rank1: holeCards[0].toUpperCase(),
    suit1: holeCards[1].toLowerCase(),
    rank2: holeCards[2].toUpperCase(),
    suit2: holeCards[3].toLowerCase(),
  };
}

export function matchesHoleCardFilter(holeCards: string, filterType: HoleCardFilterType): boolean {
  if (filterType === 'all') return true;
  if (!holeCards) return false;
  
  const parsed = parseHoleCards(holeCards);
  if (!parsed) return false;
  
  const { rank1, suit1, rank2, suit2 } = parsed;
  const suited = suit1 === suit2;
  const value1 = RANK_VALUES[rank1];
  const value2 = RANK_VALUES[rank2];
  const gap = Math.abs(value1 - value2);
  
  switch (filterType) {
    case 'pairs':
      return rank1 === rank2;
    
    case 'ax_suited':
      return suited && (rank1 === 'A' || rank2 === 'A');
    
    case 'kx_suited':
      return suited && (rank1 === 'K' || rank2 === 'K') && rank1 !== 'A' && rank2 !== 'A';
    
    case 'ax_offsuit':
      return !suited && (rank1 === 'A' || rank2 === 'A');
    
    case 'kx_offsuit':
      return !suited && (rank1 === 'K' || rank2 === 'K') && rank1 !== 'A' && rank2 !== 'A';
    
    case 'broadway_suited':
      return suited && BROADWAY_CARDS.includes(rank1) && BROADWAY_CARDS.includes(rank2) && rank1 !== rank2;
    
    case 'broadway_offsuit':
      return !suited && BROADWAY_CARDS.includes(rank1) && BROADWAY_CARDS.includes(rank2) && rank1 !== rank2;
    
    case 'suited_connectors':
      return suited && gap === 1;
    
    case 'offsuit_connectors':
      return !suited && gap === 1;
    
    case 'suited_one_gappers':
      return suited && gap === 2;
    
    case 'offsuit_one_gappers':
      return !suited && gap === 2;
    
    case 'suited_two_gappers':
      return suited && gap === 3;
    
    case 'offsuit_two_gappers':
      return !suited && gap === 3;
    
    case 'suited_others':
      // Suited cards that don't fit other categories
      if (!suited || rank1 === rank2) return false;
      if (rank1 === 'A' || rank2 === 'A') return false;
      if (rank1 === 'K' || rank2 === 'K') return false;
      if (BROADWAY_CARDS.includes(rank1) && BROADWAY_CARDS.includes(rank2)) return false;
      if (gap === 1 || gap === 2 || gap === 3) return false;
      return true;
    
    case 'offsuit_others':
      // Offsuit cards that don't fit other categories
      if (suited || rank1 === rank2) return false;
      if (rank1 === 'A' || rank2 === 'A') return false;
      if (rank1 === 'K' || rank2 === 'K') return false;
      if (BROADWAY_CARDS.includes(rank1) && BROADWAY_CARDS.includes(rank2)) return false;
      if (gap === 1 || gap === 2 || gap === 3) return false;
      return true;
    
    default:
      return false;
  }
}
