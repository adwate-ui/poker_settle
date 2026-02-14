import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGamePlayerApi } from "../api/gameApi";
import { gameKeys } from "../api/queryKeys";
import { GamePlayer } from "@/types/poker";
import { toast } from "@/lib/notifications";

export const useUpdateGamePlayer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ playerGameId, updates }: { playerGameId: string; updates: Partial<GamePlayer>; gameId?: string }) =>
            updateGamePlayerApi(playerGameId, updates),

        // Optimistic UI Update Logic
        onMutate: async ({ playerGameId, updates, gameId }) => {
            if (!gameId) return { previousPlayers: undefined };

            // 1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: gameKeys.players(gameId) });

            // 2. Snapshot the previous value
            const previousPlayers = queryClient.getQueryData<GamePlayer[]>(gameKeys.players(gameId));

            // 3. Optimistically update the cache with the new value
            if (previousPlayers) {
                queryClient.setQueryData<GamePlayer[]>(gameKeys.players(gameId), (old) =>
                    old?.map((p) =>
                        p.id === playerGameId ? { ...p, ...updates } : p
                    )
                );
            }

            // Return a context object with the snapshotted value
            return { previousPlayers, gameId };
        },

        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, variables, context) => {
            if (context?.gameId && context?.previousPlayers) {
                queryClient.setQueryData(gameKeys.players(context.gameId), context.previousPlayers);
            }
            toast.error("Failed to update player. Changes rolled back.");
            console.error("Mutation Error:", err);
        },

        // Always refetch after error or success to ensure we are in sync with the server
        onSettled: (data, error, variables, context) => {
            const gId = variables.gameId || context?.gameId;
            if (gId) {
                queryClient.invalidateQueries({ queryKey: gameKeys.players(gId) });
            }
        },
    });
};
