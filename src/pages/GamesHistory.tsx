import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Calendar, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface GameWithStats {
  id: string;
  date: string;
  buy_in_amount: number;
  player_count: number;
  total_pot: number;
}

const GamesHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const { data: gamesData, error } = await supabase
        .from("games")
        .select(`
          id,
          date,
          buy_in_amount,
          is_complete,
          game_players (
            id,
            buy_ins
          )
        `)
        .eq("user_id", user?.id)
        .eq("is_complete", true)
        .order("date", { ascending: false });

      if (error) throw error;

      const gamesWithStats: GameWithStats[] = (gamesData || []).map((game: any) => {
        const playerCount = game.game_players?.length || 0;
        const totalBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;

        return {
          id: game.id,
          date: game.date,
          buy_in_amount: game.buy_in_amount,
          player_count: playerCount,
          total_pot: totalPot,
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to load games history");
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

  if (games.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Games History</CardTitle>
          <CardDescription>No completed games yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Start your first game to see it here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Games History</CardTitle>
          <CardDescription>View all your completed poker games</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/games/${game.id}`)}
          >
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(game.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Buy-in</p>
                    <p className="text-sm text-muted-foreground">
                      ${game.buy_in_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Players</p>
                    <p className="text-sm text-muted-foreground">
                      {game.player_count}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Pot</p>
                    <p className="text-sm text-muted-foreground">
                      ${game.total_pot.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GamesHistory;
