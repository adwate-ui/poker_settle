import { useQuery } from "@tanstack/react-query";
import { fetchGames } from "../api/gameApi";
import { gameKeys } from "../api/queryKeys";

/**
 * Hook to fetch all completed games for a specific user.
 * Uses TanStack Query for caching and automatic re-fetching.
 */
export const useGames = (userId: string | undefined) => {
    return useQuery({
        queryKey: gameKeys.lists(),
        queryFn: () => fetchGames(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    });
};
