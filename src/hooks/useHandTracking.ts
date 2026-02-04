import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PokerHand, PlayerAction, StreetCard, Player, SeatPosition } from '@/types/poker';
import { useToast } from '@/hooks/use-toast';

export const useHandTracking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createNewHand = async (
    gameId: string,
    buttonPlayerId: string,
    handNumber: number,
    heroPosition: string,
    positions?: SeatPosition[]
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
          positions: (positions as any) || [],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Hand Created',
        description: `Hand #${handNumber} started`,
      });

      return data as unknown as PokerHand;
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getNextHandNumber = async (gameId: string): Promise<number> => {
    try {
      // Call the RPC function to get the true global max (bypassing RLS)
      // This uses SECURITY DEFINER to see all hands, not just current user's
      // Note: Type assertion needed as this function isn't in auto-generated types yet
      const { data, error } = await (supabase.rpc as any)('get_next_hand_number');

      if (error) {
        console.error('Error fetching next hand number via RPC:', error);
        throw error;
      }

      // data is the integer returned by the function
      return data as number;

    } catch (error) {
      console.error('Failed to get next hand number:', error);
      // Fallback only if absolutely necessary (though this may still conflict)
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
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error Recording Action',
        description: err.message,
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
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error Recording Cards',
        description: err.message,
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
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error Updating Pot',
        description: err.message,
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
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error Updating Stage',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const completeHand = async (
    handId: string,
    winnerPlayerIds: string[],
    potSize: number,
    isHeroWin: boolean,
    finalStage?: string
  ): Promise<void> => {
    try {
      const isSplit = winnerPlayerIds.length > 1;

      const updateData: Partial<PokerHand> & { is_split?: boolean } = {
        winner_player_id: winnerPlayerIds[0] || null,
        winner_player_ids: winnerPlayerIds,
        pot_size: potSize,
        is_hero_win: isHeroWin,
        is_split: isSplit,
      };

      // Only update final_stage if provided
      if (finalStage) {
        updateData.final_stage = finalStage as PokerHand['final_stage'];
      }

      const { error } = await supabase
        .from('poker_hands')
        .update(updateData as any)
        .eq('id', handId);

      if (error) throw error;

      toast({
        title: 'Hand Complete',
        description: winnerPlayerIds.length > 1
          ? `Chopped pot between ${winnerPlayerIds.length} players`
          : 'Hand has been recorded successfully',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error Completing Hand',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const saveCompleteHandData = async (
    handId: string,
    actions: any[],
    streetCards: any[],
    winnerPlayerIds: string[],
    potSize: number,
    isHeroWin: boolean,
    finalStageValue: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // 1. Bulk UPSERT actions (sanitize payload first)
      if (actions.length > 0) {
        // Explicitly map optional fields to null if undefined to satisfy Postgres/Supabase
        const sanitizedActions = actions.map(a => ({
          ...a,
          hand_id: handId,
          position: a.position ?? null,
          hole_cards: a.hole_cards ?? null,
          is_hero: !!a.is_hero // Ensure boolean
        }));

        const { error: actionsError } = await supabase
          .from('player_actions')
          .upsert(sanitizedActions);  // Use upsert for idempotency

        if (actionsError) {
          console.error("Failed to save actions:", actionsError, sanitizedActions);
          throw actionsError;
        }
      }

      // 2. Bulk UPSERT street cards
      if (streetCards.length > 0) {
        const sanitizedCards = streetCards.map(c => ({
          ...c,
          hand_id: handId
        }));

        const { error: cardsError } = await supabase
          .from('street_cards')
          .upsert(sanitizedCards); // Use upsert for idempotency

        if (cardsError) {
          console.error("Failed to save street cards:", cardsError, sanitizedCards);
          throw cardsError;
        }
      }

      // 3. Complete the hand
      const isSplit = winnerPlayerIds.length > 1;
      const { error: completeError } = await supabase
        .from('poker_hands')
        .update({
          winner_player_id: winnerPlayerIds[0] || null,
          winner_player_ids: winnerPlayerIds,
          pot_size: potSize,
          is_hero_win: isHeroWin,
          is_split: isSplit,
          final_stage: finalStageValue as PokerHand['final_stage'],
        })
        .eq('id', handId);

      if (completeError) {
        console.error("Failed to update hand completion status:", completeError);
        throw completeError;
      }

      toast({
        title: 'Hand Saved',
        description: 'All actions and cards recorded successfully',
      });

      return true;
    } catch (error) {
      const err = error as Error;
      console.error("CRITICAL: Hand Save Failed", err);

      toast({
        title: 'Error Saving Hand Data',
        description: `${err.message} - Click Save again to retry.`, // Inform user they can retry
        variant: 'destructive',
      });
      // CRITICAL: Re-throw error so the UI knows NOT to clear local state
      throw error;
    } finally {
      setLoading(false);
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

  const updateHoleCards = async (
    actionId: string,
    holeCards: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('player_actions')
        .update({ hole_cards: holeCards })
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: 'Hole Cards Updated',
        description: 'Player hole cards have been saved',
      });

      return true;
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return false;
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
    saveCompleteHandData,
    getHandActions,
    updateHoleCards,
  };
};
