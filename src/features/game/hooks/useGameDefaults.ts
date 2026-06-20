import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GameDefaults {
  defaultBuyIn: number | null;
  defaultSmallBlind: number | null;
  defaultBigBlind: number | null;
  defaultRake: number | null;
}

export const useGameDefaults = (userId: string | undefined) =>
  useQuery({
    queryKey: ['gameDefaults', userId],
    queryFn: async (): Promise<GameDefaults> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('default_buy_in, default_small_blind, default_big_blind, default_rake')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return {
        defaultBuyIn: data?.default_buy_in ?? null,
        defaultSmallBlind: data?.default_small_blind ?? null,
        defaultBigBlind: data?.default_big_blind ?? null,
        defaultRake: data?.default_rake ?? null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
