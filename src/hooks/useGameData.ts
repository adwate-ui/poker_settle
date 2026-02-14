import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Game, GamePlayer, SeatPosition, TablePosition, BuyInHistory, Settlement, Json, TablePositionInsert } from "@/types/poker";
import { toast } from "@/lib/notifications";
import { ErrorMessages } from "@/lib/errorUtils";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useSettlementConfirmations } from "@/hooks/useSettlementConfirmations";
import { createOrFindPlayer as apiCreateOrFindPlayer } from "@/features/players/api/playerApi";
import { createGame as apiCreateGame, completeGameApi, transformGameData } from "@/features/game/api/gameApi";
import { useGames } from "@/features/game/hooks/useGames";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { useUpdateGamePlayer } from "@/features/game/hooks/useGameMutations";



import { formatCurrency } from "@/utils/currencyUtils";

// Keep local schemas for simple updates not yet moved
const finalStackSchema = z.number().min(0, "Final stack cannot be negative").max(10000000, `Final stack cannot exceed ${formatCurrency(10000000)}`);
const buyInsSchema = z.number().int().min(1, "Buy-ins must be at least 1").max(100, "Buy-ins cannot exceed 100");

export const useGameData = () => {
  const { user } = useAuth();
  const { createConfirmations } = useSettlementConfirmations();

  // React Query hooks
  const { data: games = [], isLoading: gamesLoading, refetch: fetchGames } = useGames(user?.id);
  const { data: players = [], isLoading: playersLoading, refetch: fetchPlayers } = usePlayers(user?.id);
  const { mutateAsync: updatePlayerMutation } = useUpdateGamePlayer();

  const loading = gamesLoading || playersLoading;

  const createOrFindPlayer = async (name: string): Promise<Player> => {
    if (!user) throw new Error("User not authenticated");
    const player = await apiCreateOrFindPlayer(user.id, name);
    await fetchPlayers();
    return player;
  };

  const createGame = async (buyInAmount: number, selectedPlayers: Player[]): Promise<Game> => {
    if (!user) throw new Error("User not authenticated");
    const newGame = await apiCreateGame(user.id, buyInAmount, selectedPlayers);
    await fetchGames();
    return newGame;
  };

  const updateGamePlayer = async (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn: boolean = false) => {
    // Validate updates
    if (updates.final_stack !== undefined) {
      try {
        finalStackSchema.parse(updates.final_stack);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    }

    if (updates.buy_ins !== undefined) {
      try {
        buyInsSchema.parse(updates.buy_ins);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    }

    // Capture gameId for cache invalidation if possible
    let gameId: string | undefined;

    // If buy_ins are being updated and logging is requested, create a history entry
    if (updates.buy_ins !== undefined && logBuyIn) {
      // First get the current buy_ins
      const { data: currentData, error: fetchError } = await supabase
        .from("game_players")
        .select("buy_ins, game_id")
        .eq("id", gamePlayerId)
        .single();

      if (fetchError) {
        console.error("Error fetching current buy_ins:", fetchError);
        throw fetchError;
      }

      if (currentData) {
        gameId = currentData.game_id;
        const buyInsAdded = updates.buy_ins - currentData.buy_ins;

        // Only log if there's an actual change
        if (buyInsAdded !== 0) {
          const { error: insertError } = await supabase
            .from("buy_in_history")
            .insert({
              game_player_id: gamePlayerId,
              buy_ins_added: buyInsAdded,
              total_buy_ins_after: updates.buy_ins,
              timestamp: new Date().toISOString()
            });

          if (insertError) {
            console.error("Error inserting buy-in history:", insertError);
            throw insertError;
          }
        }
      }
    } else if (!gameId) {
      // We still occasionally need the gameId for the optimistic update 
      // to know which query cache to invalidate/update.
      const { data } = await supabase
        .from("game_players")
        .select("game_id")
        .eq("id", gamePlayerId)
        .single();
      gameId = data?.game_id;
    }

    // Use the mutation for optimistic updates
    await updatePlayerMutation({ playerGameId: gamePlayerId, updates, gameId });
  };

  const fetchBuyInHistory = async (gamePlayerId: string): Promise<BuyInHistory[]> => {
    try {
      const { data, error } = await supabase
        .from("buy_in_history")
        .select("*")
        .eq("game_player_id", gamePlayerId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching buy-in history:", error);
      return [];
    }
  };

  const deletePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) throw error;
    await fetchPlayers();
  };

  const addPlayerToGame = async (gameId: string, player: Player): Promise<GamePlayer> => {
    // Fetch game to get buy_in_amount
    const { data: gameData } = await supabase
      .from("games")
      .select("buy_in_amount")
      .eq("id", gameId)
      .single();

    const buyInAmount = gameData?.buy_in_amount || 0;
    const initialBuyIns = 1;
    const initialFinalStack = 0;
    const initialNetAmount = initialFinalStack - (initialBuyIns * buyInAmount);

    const gamePlayerData = {
      game_id: gameId,
      player_id: player.id,
      buy_ins: initialBuyIns,
      final_stack: initialFinalStack,
      net_amount: initialNetAmount
    };

    const { data: gamePlayer, error } = await supabase
      .from("game_players")
      .insert(gamePlayerData)
      .select(`
        *,
        player:players(*)
      `)
      .single();

    if (error) throw error;
    return gamePlayer as GamePlayer;
  };

  const completeGame = async (gameId: string, settlements: Settlement[] = []) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await completeGameApi(
        user.id,
        gameId,
        settlements,
        createConfirmations
      );

      toast.success('Game completed successfully!');

      // Refresh games list
      await fetchGames();
    } catch (error) {
      console.error('Error completing game:', error);
      toast.error(ErrorMessages.game.complete(error));
      throw error;
    }
  };

  const deleteGame = async (gameId: string) => {
    // First delete all game_players entries
    const { error: gamePlayersError } = await supabase
      .from("game_players")
      .delete()
      .eq("game_id", gameId);

    if (gamePlayersError) throw gamePlayersError;

    // Then delete the game
    const { error: gameError } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (gameError) throw gameError;

    await fetchGames();
  };

  const hasIncompleteGame = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("games")
        .select("id")
        .eq("is_complete", false)
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking for incomplete games:", error);
      return false;
    }
  }, [user]);

  const getIncompleteGame = async (): Promise<Game | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("games")
        .select(`
          *,
          game_players (
            *,
            player:players (*)
          )
        `)
        .eq("is_complete", false)
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0) ? transformGameData(data[0]) : null;
    } catch (error) {
      console.error("Error fetching incomplete game:", error);
      return null;
    }
  };

  const saveTablePosition = async (gameId: string, positions: SeatPosition[]): Promise<TablePosition> => {
    try {
      const { data, error } = await supabase
        .from("table_positions")
        .insert([{
          game_id: gameId,
          positions: positions as unknown as Json,
          snapshot_timestamp: new Date().toISOString()
        } satisfies TablePositionInsert])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        positions: data.positions as unknown as SeatPosition[]
      };
    } catch (error) {
      console.error("Error saving table position:", error);
      throw error;
    }
  };

  const fetchTablePositions = async (gameId: string): Promise<TablePosition[]> => {
    try {
      const { data, error } = await supabase
        .from("table_positions")
        .select("*")
        .eq("game_id", gameId)
        .order("snapshot_timestamp", { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        ...row,
        positions: row.positions as unknown as SeatPosition[]
      }));
    } catch (error) {
      console.error("Error fetching table positions:", error);
      return [];
    }
  };

  const getCurrentTablePosition = async (gameId: string): Promise<TablePosition | null> => {
    try {
      const { data, error } = await supabase
        .from("table_positions")
        .select("*")
        .eq("game_id", gameId)
        .order("snapshot_timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        positions: data.positions as unknown as SeatPosition[]
      };
    } catch (error) {
      console.error("Error fetching current table position:", error);
      return null;
    }
  };

  const getTablePositionWithMostPlayers = async (gameId: string): Promise<TablePosition | null> => {
    try {
      const { data: positions, error } = await supabase
        .from("table_positions")
        .select("*")
        .eq("game_id", gameId);

      if (error) throw error;
      if (!positions || positions.length === 0) return null;

      // Find the position with the most players
      const bestPosition = positions.reduce((max, current) => {
        const maxPlayers = Array.isArray(max.positions) ? max.positions.length : 0;
        const currentPlayers = Array.isArray(current.positions) ? current.positions.length : 0;
        return currentPlayers > maxPlayers ? current : max;
      });

      return {
        ...bestPosition,
        positions: bestPosition.positions as unknown as SeatPosition[]
      };
    } catch (error) {
      console.error("Error finding table position with most players:", error);
      return null;
    }
  };

  return {
    players,
    games,
    loading,
    fetchPlayers,
    fetchGames,
    createOrFindPlayer,
    createGame,
    updateGamePlayer,
    deletePlayer,
    addPlayerToGame,
    completeGame,
    deleteGame,
    hasIncompleteGame,
    getIncompleteGame,
    saveTablePosition,
    fetchTablePositions,
    getCurrentTablePosition,
    getTablePositionWithMostPlayers,
    fetchBuyInHistory
  };
};
