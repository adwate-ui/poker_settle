import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameDetailView } from "@/components/GameDetailView";
import { BuyInHistory } from "@/types/poker";
import GameErrorBoundary from "@/components/GameErrorBoundary";

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

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
