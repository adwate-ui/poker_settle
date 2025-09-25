import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Player, Game, GamePlayer } from '@/types/poker';

export const useGameData = () => {
  const [players, setPlayers] = useState<Player[]>([]);
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

  useEffect(() => {
    fetchPlayers();
  }, []);

  return {
    players,
    loading,
    fetchPlayers,
    createOrFindPlayer,
    createGame,
    updateGamePlayer
  };
};