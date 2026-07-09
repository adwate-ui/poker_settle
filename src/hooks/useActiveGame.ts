import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { transformGameData } from "@/features/game/api/gameApi";
import { Game } from "@/types/poker";

export const useActiveGame = (userId: string | undefined) => {
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const checkActiveGame = useCallback(async () => {
    if (!userId) {
      setActiveGame(null);
      return;
    }

    const { data, error } = await supabase
      .from("games")
      .select(`
        *,
        game_players (
          *,
          player:players (*)
        )
      `)
      .eq("user_id", userId)
      .eq("is_complete", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveGame(transformGameData(data));
    } else {
      setActiveGame(null);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) checkActiveGame();
  }, [userId, checkActiveGame]);

  return { activeGame, refetchActiveGame: checkActiveGame };
};
