import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PokerHand, PlayerAction, StreetCard } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';
import { HoleCardFilterType, matchesHoleCardFilter } from '@/utils/holeCardFilter';
import { debounce } from '@/utils/performance';

interface PlayerData {
  name?: string;
}

interface ActionWithPlayer extends PlayerAction {
  player?: PlayerData;
}

export interface HandWithDetails extends PokerHand {
  button_player_name: string;
  winner_player_name: string | null;
  winner_player_names: string[];
  game_date: string;
  game_buy_in: number;
  actions: PlayerAction[];
  street_cards: StreetCard[];
  is_split?: boolean;
}

export interface HandFilters {
  heroName?: string;
  heroPosition?: string;
  gameId?: string;
  result?: 'win' | 'loss' | 'split' | 'all';
  showdown?: 'yes' | 'no' | 'all';
  finalStage?: string;
  villainName?: string;
  villainPosition?: string;
  heroHoleCards?: HoleCardFilterType;
  villainHoleCards?: HoleCardFilterType;
}

const HANDS_PER_PAGE = 50;

export const useHandsHistory = () => {
  const [hands, setHands] = useState<HandWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HandFilters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Fetch hands with pagination
  const fetchHands = useCallback(async (pageNum: number = 1, shouldAppend: boolean = false, signal?: AbortSignal) => {
    try {
      setLoading(true);

      const from = (pageNum - 1) * HANDS_PER_PAGE;
      const to = from + HANDS_PER_PAGE - 1;

      // Fetch poker hands with related data
      const { data: handsData, error: handsError } = await supabase
        .from('poker_hands')
        .select(`
          *,
          button_player:players!poker_hands_button_player_id_fkey(name),
          winner_player:players!poker_hands_winner_player_id_fkey(name),
          game:games(date, buy_in_amount)
        `)
        .order('created_at', { ascending: false })
        .range(from, to)
        .abortSignal(signal!);

      if (handsError) throw handsError;

      const handIds = handsData?.map(h => h.id) || [];

      if (handIds.length < HANDS_PER_PAGE) {
        setHasMore(false);
      }

      // Fetch actions for these hands with player names
      const { data: actionsData, error: actionsError } = await supabase
        .from('player_actions')
        .select(`
          *,
          player:players(name)
        `)
        .in('hand_id', handIds)
        .abortSignal(signal!);

      if (actionsError) throw actionsError;

      // Fetch street cards for these hands
      const { data: cardsData, error: cardsError} = await supabase
        .from('street_cards')
        .select('*')
        .in('hand_id', handIds)
        .abortSignal(signal!);

      if (cardsError) throw cardsError;

      // Build player ID to Name map
      const playerMap = new Map<string, string>();
      actionsData?.forEach(a => {
        const name = (a as ActionWithPlayer).player?.name;
        if (name) playerMap.set(a.player_id, name);
      });

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
        is_split: hand.is_split || false,
        created_at: hand.created_at,
        updated_at: hand.updated_at,
        button_player_name: hand.button_player?.name || 'Unknown',
        winner_player_name: hand.winner_player?.name || null,
        winner_player_names: (hand.winner_player_ids || []).map((id: string) => playerMap.get(id) || 'Unknown'),
        game_date: hand.game?.date || '',
        game_buy_in: hand.game?.buy_in_amount || 0,
        actions: (actionsData?.filter(a => a.hand_id === hand.id) || []) as PlayerAction[],
        street_cards: (cardsData?.filter(c => c.hand_id === hand.id) || []) as StreetCard[],
      }));

      setHands(prev => shouldAppend ? [...prev, ...enrichedHands] : enrichedHands);
      setPage(pageNum);
    } catch (error) {
      const err = error as Error;
      // Don't show error if request was aborted (component unmounted)
      if (err.name !== 'AbortError') {
        toast({
          title: 'Error Loading Hands',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load more hands
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchHands(page + 1, true);
    }
  }, [loading, hasMore, page, fetchHands]);

  // Initial fetch with cleanup
  useEffect(() => {
    const abortController = new AbortController();

    fetchHands(1, false, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchHands]);

  // Apply filters with memoization
  const filteredHands = useMemo(() => {
    let rawFiltered = [...hands];

    // 1. Dynamic Perspective & Participation Filter
    // If a hero name is selected, we project the hand data from their perspective
    const isHeroSet = !!filters.heroName;

    if (isHeroSet) {
      // Only include hands where the selected hero participated
      rawFiltered = rawFiltered.filter(h =>
        h.actions.some(a => (a as ActionWithPlayer).player?.name === filters.heroName)
      );
    }

    // Project hands based on the selected hero
    let projectedHands = rawFiltered.map(h => {
      if (!isHeroSet) return h;

      // Find hero's specifics in this hand
      const heroActions = h.actions.filter(a => (a as ActionWithPlayer).player?.name === filters.heroName);
      const firstHeroAction = heroActions[0];

      // Determine hero's position from the first action if available, otherwise fallback to DB default
      const position = firstHeroAction?.position || h.hero_position;

      // Determine if it was a win for THIS specific hero
      const isWin = h.winner_player_names.includes(filters.heroName!) || h.winner_player_id === h.actions.find(a => (a as ActionWithPlayer).player?.name === filters.heroName)?.player_id;

      return {
        ...h,
        hero_position: position,
        is_hero_win: isWin,
        // is_split is preserved from original db as it's a global property of the hand
      };
    });

    // 2. Apply common filters
    if (filters.heroPosition) {
      projectedHands = projectedHands.filter(h => h.hero_position === filters.heroPosition);
    }

    if (filters.gameId) {
      projectedHands = projectedHands.filter(h => h.game_id === filters.gameId);
    }

    if (filters.result && filters.result !== 'all') {
      if (filters.result === 'win') {
        projectedHands = projectedHands.filter(h => h.is_hero_win === true && !h.is_split);
      } else if (filters.result === 'loss') {
        projectedHands = projectedHands.filter(h => h.is_hero_win === false && !h.is_split);
      } else if (filters.result === 'split') {
        projectedHands = projectedHands.filter(h => h.is_split === true);
      }
    }

    if (filters.showdown && filters.showdown !== 'all') {
      const isShowdown = filters.showdown === 'yes';
      projectedHands = projectedHands.filter(h => (h.final_stage === 'Showdown') === isShowdown);
    }

    if (filters.finalStage) {
      projectedHands = projectedHands.filter(h => h.final_stage === filters.finalStage);
    }

    // Handle villain filters
    if (filters.villainName) {
      projectedHands = projectedHands.filter(h =>
        h.actions.some(action => (action as ActionWithPlayer).player?.name === filters.villainName && (!filters.villainPosition || action.position === filters.villainPosition))
      );
    } else if (filters.villainPosition) {
      projectedHands = projectedHands.filter(h =>
        h.actions.some(action => action.position === filters.villainPosition)
      );
    }

    // Filter by hero hole cards (Hero is dynamic)
    if (filters.heroHoleCards && filters.heroHoleCards !== 'all') {
      projectedHands = projectedHands.filter(h => {
        // If hero is set, look for their cards. If not, look for anyone's cards as hero perspective is global.
        const heroAction = h.actions.find(action => {
          const name = (action as ActionWithPlayer).player?.name;
          const isTargetPlayer = isHeroSet ? name === filters.heroName : true;
          return isTargetPlayer && action.hole_cards;
        });
        return heroAction?.hole_cards && matchesHoleCardFilter(heroAction.hole_cards, filters.heroHoleCards!);
      });
    }

    // Filter by villain hole cards (anyone except current hero)
    if (filters.villainHoleCards && filters.villainHoleCards !== 'all') {
      projectedHands = projectedHands.filter(h => {
        if (filters.villainName) {
          const villainAction = h.actions.find(action => (action as ActionWithPlayer).player?.name === filters.villainName && action.hole_cards);
          return villainAction?.hole_cards && matchesHoleCardFilter(villainAction.hole_cards, filters.villainHoleCards!);
        } else {
          return h.actions.some(action => {
            const name = (action as ActionWithPlayer).player?.name;
            const isNotHero = isHeroSet ? name !== filters.heroName : true;
            return isNotHero && action.hole_cards && matchesHoleCardFilter(action.hole_cards, filters.villainHoleCards!);
          });
        }
      });
    }

    return projectedHands;
  }, [hands, filters]);

  // Debounced filter update
  const debouncedUpdateFilters = useMemo(
    () => debounce((newFilters: Partial<HandFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }, 300),
    []
  );

  const updateFilters = useCallback((newFilters: Partial<HandFilters>) => {
    debouncedUpdateFilters(newFilters);
  }, [debouncedUpdateFilters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Dynamic Filter Options Generation (Cascading)
  const filterOptions = useMemo(() => {
    const isHeroSet = !!filters.heroName;

    // All unique player names for Hero selection
    const allPlayerNames = new Set<string>();
    hands.forEach(h => h.actions.forEach(a => {
      const name = (a as ActionWithPlayer).player?.name;
      if (name) allPlayerNames.add(name);
    }));

    // Filter hands by current hero to determine available games, positions, and villains
    const heroHands = isHeroSet
      ? hands.filter(h => h.actions.some(a => (a as ActionWithPlayer).player?.name === filters.heroName))
      : hands;

    const games = new Map();
    const heroPositions = new Set<string>();
    const villainNames = new Set<string>();
    const villainPositions = new Set<string>();

    heroHands.forEach(hand => {
      // Available Games
      if (!games.has(hand.game_id)) {
        games.set(hand.game_id, {
          id: hand.game_id,
          date: hand.game_date,
          buy_in: hand.game_buy_in,
        });
      }

      // Available Hero Positions (for the current hero)
      if (isHeroSet) {
        const heroAction = hand.actions.find(a => (a as ActionWithPlayer).player?.name === filters.heroName);
        if (heroAction?.position) heroPositions.add(heroAction.position);
      } else {
        if (hand.hero_position) heroPositions.add(hand.hero_position);
      }

      // Available Villains & Positions
      hand.actions.forEach(action => {
        const name = (action as ActionWithPlayer).player?.name;
        if (name && (!isHeroSet || name !== filters.heroName)) {
          villainNames.add(name);
        }
        if (action.position) villainPositions.add(action.position);
      });
    });

    return {
      heroNames: Array.from(allPlayerNames).sort(),
      games: Array.from(games.values()).sort((a, b) => b.date.localeCompare(a.date)),
      heroPositions: Array.from(heroPositions).sort(),
      villainNames: Array.from(villainNames).sort(),
      villainPositions: Array.from(villainPositions).sort(),
    };
  }, [hands, filters.heroName]);

  const getStatistics = useMemo(() => {
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
  }, [filteredHands]);

  return {
    hands: filteredHands,
    allHands: hands,
    loading,
    filters,
    updateFilters,
    clearFilters,
    heroNames: filterOptions.heroNames,
    getUniqueGames: filterOptions.games,
    getUniqueHeroPositions: filterOptions.heroPositions,
    getUniquePlayerNames: filterOptions.heroNames,
    getUniqueVillainNames: filterOptions.villainNames,
    getUniqueVillainPositions: filterOptions.villainPositions,
    getStatistics,
    refetch: () => fetchHands(1, false),
    loadMore,
    hasMore,
  };
};
