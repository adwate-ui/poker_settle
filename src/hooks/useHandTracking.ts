import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PokerHand, PlayerAction, StreetCard, Player } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';

export const useHandTracking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createNewHand = async (
    gameId: string,
    buttonPlayerId: string,
    handNumber: number,
    heroPosition: string
  ): Promise<PokerHand | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('poker_hands')
        .insert({
          game_id: gameId,
          hand_number: handNumber,
          button_player_id: buttonPlayerId,
          hero_position: heroPosition,
          final_stage: 'Preflop',
          pot_size: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Hand Created',
        description: `Hand #${handNumber} started`,
      });
      
      return data as PokerHand;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getNextHandNumber = async (gameId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('poker_hands')
        .select('hand_number')
        .eq('game_id', gameId)
        .order('hand_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? data.hand_number + 1 : 1;
    } catch (error) {
      return 1;
    }
  };

  const recordPlayerAction = async (
    handId: string,
    playerId: string,
    streetType: 'Preflop' | 'Flop' | 'Turn' | 'River',
    actionType: PlayerAction['action_type'],
    betSize: number,
    actionSequence: number,
    isHero: boolean,
    position?: string
  ): Promise<PlayerAction | null> => {
    try {
      const { data, error } = await supabase
        .from('player_actions')
        .insert({
          hand_id: handId,
          player_id: playerId,
          street_type: streetType,
          action_type: actionType,
          bet_size: betSize,
          action_sequence: actionSequence,
          is_hero: isHero,
          position: position || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PlayerAction;
    } catch (error: any) {
      toast({
        title: 'Error Recording Action',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const recordStreetCards = async (
    handId: string,
    streetType: 'Flop' | 'Turn' | 'River',
    cardsNotation: string
  ): Promise<StreetCard | null> => {
    try {
      const { data, error } = await supabase
        .from('street_cards')
        .insert({
          hand_id: handId,
          street_type: streetType,
          cards_notation: cardsNotation,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StreetCard;
    } catch (error: any) {
      toast({
        title: 'Error Recording Cards',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateHandPot = async (handId: string, potSize: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('poker_hands')
        .update({ pot_size: potSize })
        .eq('id', handId);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error Updating Pot',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateHandStage = async (
    handId: string,
    stage: PokerHand['final_stage']
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('poker_hands')
        .update({ final_stage: stage })
        .eq('id', handId);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error Updating Stage',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const completeHand = async (
    handId: string,
    winnerPlayerIds: string[],
    potSize: number,
    isHeroWin: boolean
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('poker_hands')
        .update({
          winner_player_id: winnerPlayerIds[0] || null,
          winner_player_ids: winnerPlayerIds,
          pot_size: potSize,
          is_hero_win: isHeroWin,
          final_stage: 'Showdown',
        })
        .eq('id', handId);

      if (error) throw error;

      toast({
        title: 'Hand Complete',
        description: winnerPlayerIds.length > 1 
          ? `Chopped pot between ${winnerPlayerIds.length} players`
          : 'Hand has been recorded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error Completing Hand',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getHandActions = async (handId: string): Promise<PlayerAction[]> => {
    try {
      const { data, error } = await supabase
        .from('player_actions')
        .select('*')
        .eq('hand_id', handId)
        .order('action_sequence', { ascending: true });

      if (error) throw error;
      return (data || []) as PlayerAction[];
    } catch (error) {
      return [];
    }
  };

  return {
    loading,
    createNewHand,
    getNextHandNumber,
    recordPlayerAction,
    recordStreetCards,
    updateHandPot,
    updateHandStage,
    completeHand,
    getHandActions,
  };
};
