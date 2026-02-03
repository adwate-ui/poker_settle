import { useQuery } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { fetchGameDetail } from "../api/gameApi";
import { gameKeys } from "../api/queryKeys";

/**
 * Hook to fetch detailed game data including players, positions, and confirmations.
 * Uses TanStack Query for caching and automatic re-fetching.
 */
export const useGameDetail = (client: SupabaseClient, gameId: string) => {
    return useQuery({
        queryKey: gameKeys.detail(gameId),
        queryFn: () => fetchGameDetail(client, gameId),
        enabled: !!gameId,
        staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    });
};
