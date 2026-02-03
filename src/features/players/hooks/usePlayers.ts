import { useQuery } from "@tanstack/react-query";
import { fetchPlayers } from "../api/playerApi";
import { playerKeys } from "../../game/api/queryKeys";

/**
 * Hook to fetch all players for a specific user.
 * Uses TanStack Query for caching and automatic re-fetching.
 */
export const usePlayers = (userId: string | undefined) => {
    return useQuery({
        queryKey: playerKeys.lists(),
        queryFn: () => fetchPlayers(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 60, // Players tend to change less often, so 1 hour stale time
    });
};
