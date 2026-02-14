import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gameKeys } from "../api/queryKeys";
import { GamePlayer, TablePosition, SettlementConfirmation, Game } from "@/types/poker";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface GameDetailData {
    game: Game;
    gamePlayers: GamePlayer[];
    tablePositions: TablePosition[];
    confirmations: SettlementConfirmation[];
}

/**
 * Hook to listen for realtime updates to a specific game's data.
 * When changes occur in game_players or table_positions, it invalidates
 * the relevant React Query cache to trigger a background refresh or optimally updates it.
 */
export const useGameRealtime = (gameId: string | undefined) => {
    const queryClient = useQueryClient();
    const invalidateTimeoutRef = useRef<NodeJS.Timeout>();

    const debouncedInvalidate = useCallback(() => {
        if (!gameId) return;
        if (invalidateTimeoutRef.current) {
            clearTimeout(invalidateTimeoutRef.current);
        }
        invalidateTimeoutRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        }, 500);
    }, [gameId, queryClient]);

    const handleGamePlayerUpdate = useCallback((payload: RealtimePostgresChangesPayload<GamePlayer>) => {
        if (!gameId) return;

        // ONLY handle updates optimistically. Inserts/Deletes are complex (require fetching joined player data), so we just invalidate.
        if (payload.eventType !== 'UPDATE') {
            debouncedInvalidate();
            return;
        }

        const newRecord = payload.new as GamePlayer;
        const queryKey = gameKeys.detail(gameId);

        // Get strict current data
        const currentData = queryClient.getQueryData<GameDetailData>(queryKey);

        if (!currentData) {
            debouncedInvalidate();
            return;
        }

        const existingPlayerIndex = currentData.gamePlayers.findIndex(gp => gp.id === newRecord.id);
        if (existingPlayerIndex === -1) {
            // Player not found in cache? Invalidate to be safe.
            debouncedInvalidate();
            return;
        }

        const existingPlayer = currentData.gamePlayers[existingPlayerIndex];

        // Self-Exclusion / Deduplication Check
        // If the critical fields are already identical, ignore this update (it's likely an echo of our own action or duplicate)
        const isIdentical =
            existingPlayer.buy_ins === newRecord.buy_ins &&
            existingPlayer.final_stack === newRecord.final_stack &&
            existingPlayer.net_amount === newRecord.net_amount;

        if (isIdentical) {
            // console.log('Skipping update: Cache already matches payload', newRecord.id);
            return;
        }

        // Optimistic Update
        const updatedGamePlayers = [...currentData.gamePlayers];
        updatedGamePlayers[existingPlayerIndex] = {
            ...existingPlayer,
            buy_ins: newRecord.buy_ins,
            final_stack: newRecord.final_stack,
            net_amount: newRecord.net_amount
            // Preserve joined 'player' object from existing record
        };

        queryClient.setQueryData(queryKey, {
            ...currentData,
            gamePlayers: updatedGamePlayers
        });

        // Also invalidate debounced just to ensure eventual consistency
        // debouncedInvalidate(); // Optional: Keep strictly optimistic or strictly eventual? 
        // Plan says "Optimistic cache updates", implying we trust the payload enough. 
        // But for safety against drift, a debounced invalidate is good practice BUT defeats purpose of 'avoiding flash'.
        // Let's rely on setQueryData. If we need re-fetch, we can trigger it elsewhere.

    }, [gameId, queryClient, debouncedInvalidate]);

    useEffect(() => {
        if (!gameId) return;

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
                handleGamePlayerUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "table_positions",
                    filter: `game_id=eq.${gameId}`,
                },
                debouncedInvalidate // Table positions are complex lists, just invalidate
            )
            .subscribe();

        return () => {
            if (invalidateTimeoutRef.current) {
                clearTimeout(invalidateTimeoutRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [gameId, handleGamePlayerUpdate, debouncedInvalidate]);
};
