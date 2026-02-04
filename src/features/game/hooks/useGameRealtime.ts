import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gameKeys } from "../api/queryKeys";

/**
 * Hook to listen for realtime updates to a specific game's data.
 * When changes occur in game_players or table_positions, it invalidates
 * the relevant React Query cache to trigger a background refresh.
 */
export const useGameRealtime = (gameId: string | undefined) => {
    const queryClient = useQueryClient();

    const invalidateTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!gameId) return;

        const debouncedInvalidate = () => {
            if (invalidateTimeoutRef.current) {
                clearTimeout(invalidateTimeoutRef.current);
            }
            invalidateTimeoutRef.current = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
            }, 500); // 500ms trailing debounce
        };

        // Set up Supabase realtime channel
        const channel = supabase
            .channel(`game-updates-${gameId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_players",
                    filter: `game_id=eq.${gameId}`,
                },
                debouncedInvalidate
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "table_positions",
                    filter: `game_id=eq.${gameId}`,
                },
                debouncedInvalidate
            )
            .subscribe();

        // Clean up subscription on unmount
        return () => {
            if (invalidateTimeoutRef.current) {
                clearTimeout(invalidateTimeoutRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [gameId, queryClient]);
};
