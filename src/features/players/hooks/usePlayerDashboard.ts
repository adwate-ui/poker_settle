import { useState, useMemo, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Player, DashboardFilters, DashboardGameHistory, SessionStats, MonthlyStats, CumulativePnLPoint, DistributionBucket } from '@/types/poker';
import { toast } from '@/lib/notifications';
import {
  DEFAULT_FILTERS,
  applyFilters,
  computeSessionStats,
  computeCumulativePnL,
  computeMonthlyStats,
  computeDistribution,
  getAvailableMonths,
  getAvailableStakes,
} from '../utils/playerStats';

interface PlayerDashboardData {
  player: Player | null;
  gameHistory: DashboardGameHistory[];
  filteredHistory: DashboardGameHistory[];
  sessionStats: SessionStats;
  cumulativePnL: CumulativePnLPoint[];
  monthlyStats: MonthlyStats[];
  distribution: DistributionBucket[];
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  availableMonths: string[];
  availableStakes: number[];
  isLoading: boolean;
  refetch: () => void;
  setPlayer: (player: Player) => void;
}

export function usePlayerDashboard(
  playerId: string | undefined,
  client?: SupabaseClient,
): PlayerDashboardData {
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<DashboardGameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const fetchData = useCallback(async () => {
    if (!playerId) return;
    setIsLoading(true);
    try {
      const activeClient = client || supabase;

      const [playerResult, historyResult] = await Promise.all([
        activeClient.from('players').select('*').eq('id', playerId).single(),
        activeClient
          .from('game_players')
          .select(`
            id,
            game_id,
            buy_ins,
            final_stack,
            net_amount,
            games (
              id,
              date,
              buy_in_amount,
              small_blind,
              big_blind
            )
          `)
          .eq('player_id', playerId)
          .order('games(date)', { ascending: true }),
      ]);

      if (playerResult.error) throw playerResult.error;
      if (historyResult.error) throw historyResult.error;

      setPlayer(playerResult.data);
      const valid = (historyResult.data || []).filter(
        (h) => h.games,
      ) as unknown as DashboardGameHistory[];
      setGameHistory(valid);
    } catch (error) {
      console.error('Error fetching player dashboard data:', error);
      toast.error('Failed to load player details');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchData();
    }
  }, [playerId, fetchData]);

  const setFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const availableMonths = useMemo(() => getAvailableMonths(gameHistory), [gameHistory]);
  const availableStakes = useMemo(() => getAvailableStakes(gameHistory), [gameHistory]);

  const filteredHistory = useMemo(
    () => applyFilters(gameHistory, filters),
    [gameHistory, filters],
  );

  const sessionStats = useMemo(() => computeSessionStats(filteredHistory), [filteredHistory]);

  const cumulativePnL = useMemo(
    () => computeCumulativePnL(filteredHistory),
    [filteredHistory],
  );

  const monthlyStats = useMemo(
    () => computeMonthlyStats(filteredHistory),
    [filteredHistory],
  );

  const distribution = useMemo(
    () => computeDistribution(filteredHistory),
    [filteredHistory],
  );

  return {
    player,
    setPlayer,
    gameHistory,
    filteredHistory,
    sessionStats,
    cumulativePnL,
    monthlyStats,
    distribution,
    filters,
    setFilter,
    resetFilters,
    availableMonths,
    availableStakes,
    isLoading,
    refetch: fetchData,
  };
}
