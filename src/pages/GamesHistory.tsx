import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Calendar, Users, Coins, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GameWithStats {
  id: string;
  date: string;
  buy_in_amount: number;
  player_count: number;
  total_pot: number;
  player_names: string[];
}

const GamesHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);

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
            buy_ins,
            player:players (
              name
            )
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
        const playerNames = game.game_players?.map((gp: any) => gp.player?.name || "").filter(Boolean) || [];

        return {
          id: game.id,
          date: game.date,
          buy_in_amount: game.buy_in_amount,
          player_count: playerCount,
          total_pot: totalPot,
          player_names: playerNames,
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

  const handleDeleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId);

      if (error) throw error;

      toast.success("Game deleted successfully");
      fetchGames();
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    } finally {
      setDeleteGameId(null);
    }
  };

  const uniqueDates = useMemo(() => {
    const dates = games.map((game) => format(new Date(game.date), "MMM d, yyyy"));
    return Array.from(new Set(dates)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const uniqueMonthYears = useMemo(() => {
    const monthYears = games.map((game) => format(new Date(game.date), "MMM yyyy"));
    return Array.from(new Set(monthYears)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const uniquePlayers = useMemo(() => {
    const players = games.flatMap((game) => game.player_names);
    return Array.from(new Set(players)).sort();
  }, [games]);

  const filteredGames = games.filter((game) => {
    const gameDate = format(new Date(game.date), "MMM d, yyyy");
    const monthYear = format(new Date(game.date), "MMM yyyy");
    
    if (selectedDate !== "all" && gameDate !== selectedDate) return false;
    if (selectedMonthYear !== "all" && monthYear !== selectedMonthYear) return false;
    if (selectedPlayer !== "all" && !game.player_names.includes(selectedPlayer)) return false;
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="max-w-6xl mx-auto">
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Filter by month-year" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonthYears.map((monthYear) => (
                  <SelectItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Filter by player" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Players</SelectItem>
                {uniquePlayers.map((player) => (
                  <SelectItem key={player} value={player}>
                    {player}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredGames.map((game) => (
          <Card key={game.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(game.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  <Coins className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Buy-in</p>
                    <p className="text-sm text-muted-foreground">
                      Rs. {formatIndianNumber(game.buy_in_amount)}
                    </p>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Players</p>
                    <p className="text-sm text-muted-foreground">
                      {game.player_count}
                    </p>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  <Coins className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Chips in play</p>
                    <p className="text-sm text-muted-foreground">
                      Rs. {formatIndianNumber(game.total_pot)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteGameId(game.id);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteGameId} onOpenChange={() => setDeleteGameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this game? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGameId && handleDeleteGame(deleteGameId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GamesHistory;
