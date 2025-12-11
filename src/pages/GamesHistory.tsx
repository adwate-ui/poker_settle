import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
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
  game_players: Array<{
    player_name: string;
    net_amount: number;
  }>;
}

type SortField = "date" | "buy_in" | "players" | "chips";
type SortOrder = "asc" | "desc" | null;

const GamesHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = useCallback(async () => {
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
            net_amount,
            player:players (
              name
            )
          )
        `)
        .eq("user_id", user?.id)
        .eq("is_complete", true)
        .order("date", { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gamesWithStats: GameWithStats[] = (gamesData || []).map((game: any) => {
        const playerCount = game.game_players?.length || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const playerNames = game.game_players?.map((gp: any) => gp.player?.name || "").filter(Boolean) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gamePlayers = game.game_players?.map((gp: any) => ({
          player_name: gp.player?.name || "",
          net_amount: gp.net_amount || 0,
        })) || [];

        return {
          id: game.id,
          date: game.date,
          buy_in_amount: game.buy_in_amount,
          player_count: playerCount,
          total_pot: totalPot,
          player_names: playerNames,
          game_players: gamePlayers,
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to load games history");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
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
  }, [fetchGames]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter((game) => {
      const gameDate = format(new Date(game.date), "MMM d, yyyy");
      const monthYear = format(new Date(game.date), "MMM yyyy");
      
      if (selectedDate !== "all" && gameDate !== selectedDate) return false;
      if (selectedMonthYear !== "all" && monthYear !== selectedMonthYear) return false;
      if (selectedPlayer !== "all" && !game.player_names.includes(selectedPlayer)) return false;
      
      return true;
    });

    if (sortField && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;
        
        switch (sortField) {
          case "date":
            aVal = new Date(a.date).getTime();
            bVal = new Date(b.date).getTime();
            break;
          case "buy_in":
            aVal = a.buy_in_amount;
            bVal = b.buy_in_amount;
            break;
          case "players":
            aVal = a.player_count;
            bVal = b.player_count;
            break;
          case "chips":
            aVal = a.total_pot;
            bVal = b.total_pot;
            break;
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [games, selectedDate, selectedMonthYear, selectedPlayer, sortField, sortOrder]);

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
          <CardTitle className="text-2xl">Games History</CardTitle>
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
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl">Games History</CardTitle>
          <CardDescription className="text-sm">View all your completed poker games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by month-year" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonthYears.map((monthYear) => (
                  <SelectItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by player" />
              </SelectTrigger>
              <SelectContent className="z-50">
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

      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <div className="hidden md:block rounded-lg p-3 sm:p-4 border">
              <div className="grid grid-cols-5 gap-2 sm:gap-4 font-bold text-xs sm:text-sm">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Date
                  {getSortIcon("date")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("buy_in")}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Buy-in
                  {getSortIcon("buy_in")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("players")}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Players
                  {getSortIcon("players")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("chips")}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Chips in play
                  {getSortIcon("chips")}
                </Button>
                {selectedPlayer !== "all" ? (
                  <div className="flex items-center justify-start h-10 px-4 font-bold">
                    Player P&L
                  </div>
                ) : (
                  <div className="flex items-center justify-start h-10 px-4 font-bold">Actions</div>
                )}
              </div>
            </div>

            {filteredAndSortedGames.map((game, index) => {
              const playerData = game.game_players.find(
                (gp) => gp.player_name === selectedPlayer
              );
              
              return (
                <Card
                  key={game.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{format(new Date(game.date), "MMM d, yyyy")}</p>
                        </div>
                        {selectedPlayer === "all" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGameId(game.id);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Buy-in</p>
                          <p className="font-semibold">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Players</p>
                          <Badge variant="info">{game.player_count}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Chips in play</p>
                          <p className="font-semibold">Rs. {formatIndianNumber(game.total_pot)}</p>
                        </div>
                        {selectedPlayer !== "all" && playerData && (
                          <div>
                            <p className="text-xs text-muted-foreground">Player P&L</p>
                            <Badge variant={playerData.net_amount >= 0 ? "success" : "destructive"}>
                              {playerData.net_amount >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.abs(playerData.net_amount))}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-5 gap-4 items-center text-sm">
                      <div className="font-medium">
                        {format(new Date(game.date), "MMM d, yyyy")}
                      </div>
                      <div className="font-semibold">
                        Rs. {formatIndianNumber(game.buy_in_amount)}
                      </div>
                      <div>
                        <Badge variant="info">{game.player_count}</Badge>
                      </div>
                      <div className="font-semibold">
                        Rs. {formatIndianNumber(game.total_pot)}
                      </div>
                      {selectedPlayer !== "all" && playerData ? (
                        <div>
                          <Badge variant={playerData.net_amount >= 0 ? "success" : "destructive"}>
                            {playerData.net_amount >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.abs(playerData.net_amount))}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGameId(game.id);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
