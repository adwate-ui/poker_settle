import * as React from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameDetailView } from "@/components/GameDetailView";
import { BuyInHistory } from "@/types/poker";
import GameErrorBoundary from "@/components/GameErrorBoundary";
import { useSharedLink } from "@/hooks/useSharedLink";
import { sendSessionSummaryNotification } from "@/services/whatsappNotifications";
import { toast } from "sonner";

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const { createOrGetSharedLink } = useSharedLink();
  const notificationSentRef = React.useRef(false);

  const fetchBuyInHistory = async (gamePlayerId: string): Promise<BuyInHistory[]> => {
    const { data, error } = await supabase
      .from("buy_in_history")
      .select("*")
      .eq("game_player_id", gamePlayerId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching buy-in history:", error);
      return [];
    }

    return data || [];
  };

  React.useEffect(() => {
    const state = location.state as {
      justCompleted?: boolean;
      settlements?: any[];
      gamePlayers?: any[];
    } | null;

    if (state?.justCompleted && gameId && !notificationSentRef.current) {
      notificationSentRef.current = true;

      const sendNotifications = async () => {
        // Guard: Verify game status to prevent premature notifications
        const { data: gameCheck } = await supabase
          .from('games')
          .select('status')
          .eq('id', gameId)
          .single();

        // @ts-ignore - status exists on DB but might be missing in generated types
        if (gameCheck?.status !== 'COMPLETED') {
          console.warn("Game status verified as NOT completed. Aborting notification.");
          return;
        }

        try {
          toast.loading("Sending WhatsApp summaries...", { duration: 3000 });

          // Get game token for shareable link
          const linkData = await createOrGetSharedLink('game', gameId);
          const gameToken = linkData?.accessToken || '';

          if (!gameToken) {
            console.warn("Could not generate game token for WhatsApp link");
          }

          // Construct game players data if passed from dashboard, otherwise fetch would be needed (but we assume passed for speed)
          const gamePlayers = state.gamePlayers || [];
          const allSettlements = state.settlements || [];

          const gamePlayersData = gamePlayers.map(gp => ({
            player_id: gp.player_id,
            net_amount: gp.net_amount
          }));

          // We need the date, but it might not be in state. 
          // However, sendSessionSummaryNotification takes it. 
          // If we don't have it, we can default to today or fetch game details.
          // For immediate UX, let's use current date or wait for game load?
          // Actually, let's fetch the game strictly if we need data, OR pass date in state.
          // For now, let's assume the component below will load the game data effectively, 
          // but for the notification we need it NOW.

          // Better approach: Let's use the date from the game object if we can, 
          // or pass it in state. To be safe/clean without changing Dashboard again, 
          // let's just use new Date().toISOString() since it just finished.
          const gameDate = new Date().toISOString();

          await sendSessionSummaryNotification(
            gameId,
            gameDate,
            gameToken,
            gamePlayers.map(gp => gp.player),
            gamePlayersData,
            allSettlements
          );

          toast.success("WhatsApp summaries sent!");

          // Clear history state to prevent re-trigger on refresh
          window.history.replaceState({}, document.title);

        } catch (error) {
          console.error("Failed to send background notifications:", error);
          toast.error("Failed to send WhatsApp summaries.");
        }
      };

      sendNotifications();
    }
  }, [location.state, gameId, createOrGetSharedLink]);

  if (!gameId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <GameErrorBoundary>
        <GameDetailView
          gameId={gameId}
          client={supabase}
          showOwnerControls={true}
          onBack={() => navigate("/games")}
          backLabel="Back to Games History"
          fetchBuyInHistory={fetchBuyInHistory}
        />
      </GameErrorBoundary>
    </div>
  );
};

export default GameDetail;
