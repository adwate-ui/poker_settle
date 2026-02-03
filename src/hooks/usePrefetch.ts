import { useQueryClient } from "@tanstack/react-query";
import { gameKeys } from "@/features/game/api/queryKeys";
import { fetchGameDetail } from "@/features/game/api/gameApi";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to expose prefetching capabilities for game data.
 */
export const usePrefetchGame = () => {
    const queryClient = useQueryClient();

    const prefetch = (gameId: string) => {
        if (!gameId) return;

        queryClient.prefetchQuery({
            queryKey: gameKeys.detail(gameId),
            queryFn: () => fetchGameDetail(supabase, gameId),
            staleTime: 1000 * 60 * 5, // Match hook's staleTime
        });
    };

    return { prefetch };
};
