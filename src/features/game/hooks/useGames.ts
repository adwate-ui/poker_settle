import { useQuery } from "@tanstack/react-query";
import { fetchGames } from "../api/gameApi";
import { gameKeys } from "../api/queryKeys";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hook to fetch all completed games for a specific user.
 * Uses TanStack Query for caching and automatic re-fetching.
 */
export const useGames = (userId: string | undefined, client?: SupabaseClient) => {
    return useQuery({
        queryKey: client ? [...gameKeys.lists(), 'shared'] : gameKeys.lists(),
        queryFn: () => fetchGames(userId!, client),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    });
};
