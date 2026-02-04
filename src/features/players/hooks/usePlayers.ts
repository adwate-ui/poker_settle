import { useQuery } from "@tanstack/react-query";
import { fetchPlayers } from "../api/playerApi";
import { playerKeys } from "../../game/api/queryKeys";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hook to fetch all players for a specific user.
 * Uses TanStack Query for caching and automatic re-fetching.
 */
export const usePlayers = (userId: string | undefined, client?: SupabaseClient) => {
    return useQuery({
        queryKey: client ? [...playerKeys.lists(), 'shared'] : playerKeys.lists(),
        queryFn: () => fetchPlayers(userId!, client),
        enabled: !!userId,
        staleTime: 1000 * 60 * 60, // Players tend to change less often, so 1 hour stale time
    });
};
