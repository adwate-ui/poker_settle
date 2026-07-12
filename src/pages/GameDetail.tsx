import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameDetailView } from "@/components/game/GameDetailView";
import { BuyInHistory } from "@/types/poker";
import GameErrorBoundary from "@/components/game/GameErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGame } from "@/hooks/useActiveGame";
import GameDashboard from "@/components/game/GameDashboard";

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGame } = useActiveGame(user?.id);

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

  if (!gameId) {
    return null;
  }

  // Still in progress: open the live dashboard (editable buy-ins/stacks),
  // not the read-only completed-game ledger.
  if (activeGame && activeGame.id === gameId) {
    return (
      <GameErrorBoundary>
        <GameDashboard gameId={gameId} />
      </GameErrorBoundary>
    );
  }

  return (
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
  );
};

export default GameDetail;
