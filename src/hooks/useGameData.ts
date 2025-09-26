import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Player, Game, GamePlayer } from '@/types/poker';

export const useGameData = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrFindPlayer = async (name: string): Promise<Player> => {
    // First try to find existing player
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('name', name)
      .single();

    if (existingPlayer) {
      return existingPlayer;
    }

    // Create new player if not found
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return newPlayer;
  };

  const createGame = async (buyInAmount: number, selectedPlayers: Player[]): Promise<Game> => {
    // Create the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        buy_in_amount: buyInAmount,
        is_complete: false
      })
      .select()
      .single();

    if (gameError) throw gameError;

    // Create game_players entries
    const gamePlayersData = selectedPlayers.map(player => ({
      game_id: game.id,
      player_id: player.id,
      buy_ins: 1,
      final_stack: 0,
      net_amount: 0
    }));

    const { data: gamePlayers, error: gamePlayersError } = await supabase
      .from('game_players')
      .insert(gamePlayersData)
      .select(`
        *,
        player:players(*)
      `);

    if (gamePlayersError) throw gamePlayersError;

    return {
      ...game,
      game_players: gamePlayers as GamePlayer[]
    };
  };

  const updateGamePlayer = async (gamePlayerId: string, updates: Partial<GamePlayer>) => {
    const { error } = await supabase
      .from('game_players')
      .update(updates)
      .eq('id', gamePlayerId);

    if (error) throw error;
  };

  const deletePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) throw error;
    await fetchPlayers();
  };

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players(
            *,
            player:players(*)
          )
        `)
        .eq('is_complete', true)
        .order('date', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
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
      .from('game_players')
      .insert(gamePlayerData)
      .select(`
        *,
        player:players(*)
      `)
      .single();

    if (error) throw error;
    return gamePlayer as GamePlayer;
  };

  const completeGame = async (gameId: string, gamePlayers: GamePlayer[]) => {
    // Check if total net amounts sum to zero
    const totalNet = gamePlayers.reduce((sum, gp) => sum + (gp.net_amount || 0), 0);
    if (Math.abs(totalNet) > 0.01) { // Allow for small floating point errors
      throw new Error('Total winnings and losses must sum to zero before completing the game');
    }

    const { error } = await supabase
      .from('games')
      .update({ is_complete: true })
      .eq('id', gameId);

    if (error) throw error;
  };

  const hasIncompleteGame = async (): Promise<boolean> => {
    const { data, error } = await supabase
      .from('games')
      .select('id')
      .eq('is_complete', false)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  };

  const getIncompleteGame = async (): Promise<Game | null> => {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        game_players(
          *,
          player:players(*)
        )
      `)
      .eq('is_complete', false)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data as Game;
  };

  useEffect(() => {
    fetchPlayers();
    fetchGames();
  }, []);

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
    hasIncompleteGame,
    getIncompleteGame
  };
};