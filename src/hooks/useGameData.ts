import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Game, GamePlayer } from "@/types/poker";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
        net_amount: 0 // Will be calculated later
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
    const gamePlayerData = {
      game_id: gameId,
      player_id: player.id,
      buy_ins: 1,
      final_stack: 0,
      net_amount: 0
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
    getIncompleteGame
  };
};