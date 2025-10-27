import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Game, GamePlayer, SeatPosition, TablePosition } from "@/types/poker";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

// Input validation schemas
const playerNameSchema = z.string().trim().min(1, "Player name is required").max(100, "Player name must be less than 100 characters");
const buyInAmountSchema = z.number().min(1, "Buy-in must be at least ₹1").max(1000000, "Buy-in cannot exceed ₹10,00,000");
const finalStackSchema = z.number().min(0, "Final stack cannot be negative").max(10000000, "Final stack cannot exceed ₹1,00,00,000");
const buyInsSchema = z.number().int().min(1, "Buy-ins must be at least 1").max(100, "Buy-ins cannot exceed 100");

export const useGameData = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to fetch players");
    }
  };

  const createOrFindPlayer = async (name: string): Promise<Player> => {
    if (!user) throw new Error("User not authenticated");
    
    // Validate player name
    try {
      playerNameSchema.parse(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors[0].message);
      }
      throw error;
    }
    
    try {
      // First check if player already exists for this user
      const { data: existingPlayers, error: searchError } = await supabase
        .from("players")
        .select("*")
        .eq("name", name.trim())
        .eq("user_id", user.id)
        .limit(1);

      if (searchError) throw searchError;

      if (existingPlayers && existingPlayers.length > 0) {
        return existingPlayers[0];
      }

      // If player doesn't exist, create new one
      const { data, error } = await supabase
        .from("players")
        .insert([{ name: name.trim(), user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchPlayers(); // Refresh the players list
      return data;
    } catch (error) {
      console.error("Error creating/finding player:", error);
      throw error;
    }
  };

  const createGame = async (buyInAmount: number, selectedPlayers: Player[]): Promise<Game> => {
    if (!user) throw new Error("User not authenticated");
    
    // Validate buy-in amount
    try {
      buyInAmountSchema.parse(buyInAmount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors[0].message);
      }
      throw error;
    }
    
    try {
      // Create the game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([{
          buy_in_amount: buyInAmount,
          date: new Date().toISOString(),
          is_complete: false,
          user_id: user.id
        }])
        .select()
        .single();

      if (gameError) throw gameError;

      // Create game_players entries for each selected player
      const gamePlayersData = selectedPlayers.map(player => ({
        game_id: gameData.id,
        player_id: player.id,
        buy_ins: 1,
        final_stack: 0,
        net_amount: -buyInAmount // Loss of initial buy-in since final_stack is 0
      }));

      const { error: gamePlayersError } = await supabase
        .from("game_players")
        .insert(gamePlayersData);

      if (gamePlayersError) throw gamePlayersError;

      // Fetch the complete game with players
      const { data: completeGame, error: fetchError } = await supabase
        .from("games")
        .select(`
          *,
          game_players (
            *,
            player:players (*)
          )
        `)
        .eq("id", gameData.id)
        .single();

      if (fetchError) throw fetchError;

      return completeGame;
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  };

  const updateGamePlayer = async (gamePlayerId: string, updates: Partial<GamePlayer>) => {
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

    const { error } = await supabase
      .from("game_players")
      .update(updates)
      .eq("id", gamePlayerId);

    if (error) throw error;
  };

  const deletePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) throw error;
    await fetchPlayers();
  };

  const fetchGames = async () => {
    if (!user) return;
    
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
        .eq("is_complete", true)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to fetch games");
    }
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

  const completeGame = async (gameId: string, settlements: any[] = []) => {
    // Fetch the latest game data to ensure we have all players including those added later
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select(`
          *,
          game_players(
            *,
            player:players(*)
          )
        `)
        .eq("id", gameId)
        .single();

    if (gameError) throw gameError;

    const allGamePlayers = gameData.game_players;
    
    // Check if total net amounts of ALL players (including those added later) sum to zero
    const totalNet = allGamePlayers.reduce((sum: number, gp: GamePlayer) => sum + (gp.net_amount || 0), 0);
    if (Math.abs(totalNet) > 0.01) { // Allow for small floating point errors
      throw new Error("Total winnings and losses must sum to zero before completing the game");
    }

    const { error } = await supabase
      .from("games")
      .update({ 
        is_complete: true,
        settlements: settlements 
      })
      .eq("id", gameId);

    if (error) throw error;
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

  const hasIncompleteGame = async (): Promise<boolean> => {
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
  };

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
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching incomplete game:", error);
      return null;
    }
  };

  const saveTablePosition = async (gameId: string, positions: SeatPosition[]): Promise<TablePosition> => {
    try {
      const { data, error} = await supabase
        .from("table_positions")
        .insert([{
          game_id: gameId,
          positions: positions as any,
          snapshot_timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        positions: data.positions as any as SeatPosition[]
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
        positions: row.positions as any as SeatPosition[]
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
        positions: data.positions as any as SeatPosition[]
      };
    } catch (error) {
      console.error("Error fetching current table position:", error);
      return null;
    }
  };

  const getTablePositionWithMostPlayers = async (gameId: string): Promise<TablePosition | null> => {
    try {
      const positions = await fetchTablePositions(gameId);
      if (positions.length === 0) return null;

      // Find the position with the most players
      return positions.reduce((max, current) => {
        const maxPlayers = Array.isArray(max.positions) ? max.positions.length : 0;
        const currentPlayers = Array.isArray(current.positions) ? current.positions.length : 0;
        return currentPlayers > maxPlayers ? current : max;
      });
    } catch (error) {
      console.error("Error finding table position with most players:", error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlayers();
      fetchGames();
    }
  }, [user]);

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
    getTablePositionWithMostPlayers
  };
};