import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import PokerTableView from "@/components/PokerTableView";
import { Game, SeatPosition } from "@/types/poker";

interface GamePlayer {
  id: string;
  player_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  players: {
    name: string;
  };
}

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  const fetchGameData = async () => {
    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      
      const gameWithPlayers: Game = {
        ...gameData,
        game_players: []
      };
      setGame(gameWithPlayers);

      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select(`
          *,
          players (
            name
          )
        `)
        .eq("game_id", gameId);

      if (playersError) throw playersError;
      setGamePlayers(playersData || []);
    } catch (error) {
      console.error("Error fetching game:", error);
      toast.error("Failed to load game details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Game not found</p>
        </CardContent>
      </Card>
    );
  }

  const playersWithSeats: SeatPosition[] = gamePlayers.map((gp, index) => ({
    seat: index + 1,
    player_id: gp.player_id,
    player_name: gp.players.name,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/games")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Games History
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            Game Details - {format(new Date(game.date), "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Buy-in</p>
              <p className="text-lg font-semibold">${game.buy_in_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Players</p>
              <p className="text-lg font-semibold">{gamePlayers.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pot</p>
              <p className="text-lg font-semibold">
                ${(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {game.is_complete ? "Completed" : "Active"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poker Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Table Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <PokerTableView 
            positions={playersWithSeats}
            totalSeats={gamePlayers.length}
            enableDragDrop={false}
          />
        </CardContent>
      </Card>

      {/* Player Results */}
      <Card>
        <CardHeader>
          <CardTitle>Player Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gamePlayers.map((gamePlayer) => {
              const netAmount = gamePlayer.final_stack - (gamePlayer.buy_ins * game.buy_in_amount);
              const isProfit = netAmount >= 0;
              
              return (
                <div key={gamePlayer.id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Player</p>
                      <p className="font-semibold">{gamePlayer.players.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buy-ins</p>
                      <p className="font-semibold">{gamePlayer.buy_ins}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Final Stack</p>
                      <p className="font-semibold">${gamePlayer.final_stack.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Amount</p>
                      <p className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        ${netAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Settlements - Removed for now as settlements property doesn't exist on Game type */}
    </div>
  );
};

export default GameDetail;
