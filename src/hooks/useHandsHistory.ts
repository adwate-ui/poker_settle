import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PokerHand, PlayerAction, StreetCard } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';

export interface HandWithDetails extends PokerHand {
  button_player_name: string;
  winner_player_name: string | null;
  winner_player_names: string[];
  game_date: string;
  game_buy_in: number;
  actions: PlayerAction[];
  street_cards: StreetCard[];
}

export interface HandFilters {
  heroPosition?: string;
  gameId?: string;
  result?: 'win' | 'loss' | 'all';
  showdown?: 'yes' | 'no' | 'all';
  finalStage?: string;
  villainName?: string;
  villainPosition?: string;
}

export const useHandsHistory = () => {
  const [hands, setHands] = useState<HandWithDetails[]>([]);
  const [filteredHands, setFilteredHands] = useState<HandWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HandFilters>({});
  const { toast } = useToast();

  const fetchHands = async () => {
    try {
      setLoading(true);
      
      // Fetch poker hands with related data
      const { data: handsData, error: handsError } = await supabase
        .from('poker_hands')
        .select(`
          *,
          button_player:players!poker_hands_button_player_id_fkey(name),
          winner_player:players!poker_hands_winner_player_id_fkey(name),
          game:games(date, buy_in_amount)
        `)
        .order('created_at', { ascending: false });

      if (handsError) throw handsError;

      // Fetch actions for all hands with player names
      const handIds = handsData?.map(h => h.id) || [];
      const { data: actionsData, error: actionsError } = await supabase
        .from('player_actions')
        .select(`
          *,
          player:players(name)
        `)
        .in('hand_id', handIds);

      if (actionsError) throw actionsError;

      // Fetch street cards for all hands
      const { data: cardsData, error: cardsError } = await supabase
        .from('street_cards')
        .select('*')
        .in('hand_id', handIds);

      if (cardsError) throw cardsError;

      // Combine data
      const enrichedHands: HandWithDetails[] = (handsData || []).map(hand => ({
        id: hand.id,
        game_id: hand.game_id,
        hand_number: hand.hand_number,
        button_player_id: hand.button_player_id,
        pot_size: hand.pot_size || 0,
        final_stage: hand.final_stage as PokerHand['final_stage'],
        winner_player_id: hand.winner_player_id,
        winner_player_ids: hand.winner_player_ids || [],
        hero_position: hand.hero_position,
        is_hero_win: hand.is_hero_win,
        created_at: hand.created_at,
        updated_at: hand.updated_at,
        button_player_name: hand.button_player?.name || 'Unknown',
        winner_player_name: hand.winner_player?.name || null,
        winner_player_names: [],
        game_date: hand.game?.date || '',
        game_buy_in: hand.game?.buy_in_amount || 0,
        actions: (actionsData?.filter(a => a.hand_id === hand.id) || []) as PlayerAction[],
        street_cards: (cardsData?.filter(c => c.hand_id === hand.id) || []) as StreetCard[],
      }));

      setHands(enrichedHands);
      setFilteredHands(enrichedHands);
    } catch (error: any) {
      toast({
        title: 'Error Loading Hands',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHands();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, hands]);

  const applyFilters = () => {
    let filtered = [...hands];

    if (filters.heroPosition) {
      filtered = filtered.filter(h => h.hero_position === filters.heroPosition);
    }

    if (filters.gameId) {
      filtered = filtered.filter(h => h.game_id === filters.gameId);
    }

    if (filters.result && filters.result !== 'all') {
      if (filters.result === 'win') {
        filtered = filtered.filter(h => h.is_hero_win === true);
      } else if (filters.result === 'loss') {
        filtered = filtered.filter(h => h.is_hero_win === false);
      }
    }

    if (filters.showdown && filters.showdown !== 'all') {
      if (filters.showdown === 'yes') {
        filtered = filtered.filter(h => h.final_stage === 'Showdown');
      } else {
        filtered = filtered.filter(h => h.final_stage !== 'Showdown');
      }
    }

    if (filters.finalStage) {
      filtered = filtered.filter(h => h.final_stage === filters.finalStage);
    }

    // Handle villain filters - if both name and position are set, check for both together
    if (filters.villainName && filters.villainPosition) {
      filtered = filtered.filter(h => {
        // Check if any action has both the villain name AND position
        return h.actions.some(action => {
          const playerData = (action as any).player;
          return playerData?.name === filters.villainName && action.position === filters.villainPosition;
        });
      });
    } else if (filters.villainName) {
      filtered = filtered.filter(h => {
        // Check if any action in the hand is from the villain (any position)
        return h.actions.some(action => {
          const playerData = (action as any).player;
          return playerData?.name === filters.villainName;
        });
      });
    } else if (filters.villainPosition) {
      filtered = filtered.filter(h => {
        // Check if any action in the hand is from a player in the villain position (any player)
        return h.actions.some(action => action.position === filters.villainPosition);
      });
    }

    setFilteredHands(filtered);
  };

  const updateFilters = (newFilters: Partial<HandFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getUniqueGames = () => {
    const gameMap = new Map();
    hands.forEach(hand => {
      if (!gameMap.has(hand.game_id)) {
        gameMap.set(hand.game_id, {
          id: hand.game_id,
          date: hand.game_date,
          buy_in: hand.game_buy_in,
        });
      }
    });
    return Array.from(gameMap.values());
  };

  const getUniqueHeroPositions = () => {
    const positions = new Set<string>();
    hands.forEach(hand => {
      if (hand.hero_position) positions.add(hand.hero_position);
    });
    return Array.from(positions).sort();
  };

  const getUniqueVillainNames = () => {
    const names = new Set<string>();
    hands.forEach(hand => {
      hand.actions.forEach(action => {
        const playerData = (action as any).player;
        if (playerData?.name) names.add(playerData.name);
      });
    });
    return Array.from(names).sort();
  };

  const getUniqueVillainPositions = () => {
    const positions = new Set<string>();
    hands.forEach(hand => {
      hand.actions.forEach(action => {
        if (action.position) positions.add(action.position);
      });
    });
    return Array.from(positions).sort();
  };

  const getStatistics = () => {
    const totalHands = filteredHands.length;
    const handsWon = filteredHands.filter(h => h.is_hero_win === true).length;
    const handsLost = filteredHands.filter(h => h.is_hero_win === false).length;
    const totalPotWon = filteredHands
      .filter(h => h.is_hero_win === true)
      .reduce((sum, h) => sum + (h.pot_size || 0), 0);
    const showdownHands = filteredHands.filter(h => h.final_stage === 'Showdown').length;

    return {
      totalHands,
      handsWon,
      handsLost,
      winRate: totalHands > 0 ? ((handsWon / totalHands) * 100).toFixed(1) : '0.0',
      totalPotWon,
      showdownHands,
      showdownRate: totalHands > 0 ? ((showdownHands / totalHands) * 100).toFixed(1) : '0.0',
    };
  };

  return {
    hands: filteredHands,
    allHands: hands,
    loading,
    filters,
    updateFilters,
    clearFilters,
    getUniqueGames,
    getUniqueHeroPositions,
    getUniqueVillainNames,
    getUniqueVillainPositions,
    getStatistics,
    refetch: fetchHands,
  };
};
