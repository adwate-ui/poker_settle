import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Filter, History, Calendar, User as UserIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatIndianNumber, formatProfitLoss } from "@/lib/utils";
import { usePrefetchGame } from "@/hooks/usePrefetch";
import { cn } from "@/lib/utils";

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
  const { prefetch } = usePrefetchGame();

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

      const gamesWithStats: GameWithStats[] = (gamesData || []).map((game: any) => {
        const playerCount = game.game_players?.length || 0;
        const totalBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;
        const playerNames = game.game_players?.map((gp: any) => gp.player?.name || "").filter(Boolean) || [];
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
      const { error } = await supabase.from("games").delete().eq("id", gameId);
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

  useEffect(() => {
    if (user) fetchGames();
  }, [user, fetchGames]);

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
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
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
        let aVal: number | string = 0;
        let bVal: number | string = 0;
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
        return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1);
      });
    }
    return filtered;
  }, [games, selectedDate, selectedMonthYear, selectedPlayer, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-label text-muted-foreground animate-pulse">Loading Games...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <History className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-luxury mb-2">No Games Found</CardTitle>
          <CardDescription>
            You haven't recorded any completed sessions yet. Once you finalize a game, it will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-12">
          <Button onClick={() => navigate("/")} size="lg">Start First Session</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter game history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-label text-muted-foreground ml-1">Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {uniqueDates.map((date) => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-label text-muted-foreground ml-1">Month</label>
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {uniqueMonthYears.map((my) => <SelectItem key={my} value={my}>{my}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-label text-muted-foreground ml-1">Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <UserIcon className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="All Players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  {uniquePlayers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("date")} className="cursor-pointer hover:text-primary transition-colors">
                <span className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead onClick={() => handleSort("buy_in")} className="cursor-pointer hover:text-primary transition-colors text-right">
                <span className="flex items-center justify-end gap-1">Buy-in <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead onClick={() => handleSort("players")} className="cursor-pointer hover:text-primary transition-colors text-center">
                <span className="flex items-center justify-center gap-1">Players <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead onClick={() => handleSort("chips")} className="cursor-pointer hover:text-primary transition-colors text-right">
                <span className="flex items-center justify-end gap-1">Total Pot <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="text-right">
                {selectedPlayer !== "all" ? "Player P&L" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedGames.map((game) => {
              const playerData = game.game_players.find((gp) => gp.player_name === selectedPlayer);
              return (
                <TableRow
                  key={game.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/games/${game.id}`)}
                  onMouseEnter={() => prefetch(game.id)}
                >
                  <TableCell className="font-medium">
                    {format(new Date(game.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-body">
                    Rs. {formatIndianNumber(game.buy_in_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{game.player_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-body font-bold text-primary">
                    Rs. {formatIndianNumber(game.total_pot)}
                  </TableCell>
                  <TableCell className="text-right">
                    {selectedPlayer !== "all" && playerData ? (
                      <span className={cn("font-bold", playerData.net_amount >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                        {formatProfitLoss(playerData.net_amount)}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGameId(game.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!deleteGameId} onOpenChange={(open) => !open && setDeleteGameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game?</DialogTitle>
            <DialogDescription>
              This action will permanently purge this session from the archives. The accounting for all participants will be irreversibly lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteGameId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteGameId && handleDeleteGame(deleteGameId)}>Delete Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamesHistory;
