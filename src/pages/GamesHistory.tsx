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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Filter, History, Calendar, User as UserIcon, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatIndianNumber, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle } from "@/lib/utils";
import { usePrefetchGame } from "@/hooks/usePrefetch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (user) {
      fetchGames();
    }
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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 text-gold-500" />;
    return <ArrowDown className="h-4 w-4 text-gold-500" />;
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

        return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }

    return filtered;
  }, [games, selectedDate, selectedMonthYear, selectedPlayer, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-gold-200/60 font-luxury tracking-widest uppercase text-sm animate-pulse">Loading Games...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto border-gold-900/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader className="text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
            <History className="h-8 w-8 text-gold-500/40" />
          </div>
          <CardTitle className="text-3xl font-luxury text-luxury-primary mb-2">No Games Found</CardTitle>
          <CardDescription className="text-gray-400 max-w-sm mx-auto">
            You haven't recorded any completed sessions yet. Once you finalize a game, it will be immortalized here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-12">
          <Button onClick={() => navigate("/")} className="font-luxury tracking-widest uppercase px-8">
            Start First Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search & Filter Section */}
      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
              <Filter className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-luxury text-luxury-primary">Filters</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest text-gold-500/40 font-luxury">Filter game history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-xs uppercase">
                  <Calendar className="mr-2 h-4 w-4 text-gold-500/40" />
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/10 dark:border-gold-500/20 backdrop-blur-xl">
                  <SelectItem value="all" className="font-luxury uppercase text-[10px] tracking-widest">All Dates</SelectItem>
                  {uniqueDates.map((date) => (
                    <SelectItem key={date} value={date} className="font-luxury uppercase text-[10px] tracking-widest text-gold-900 dark:text-gold-100/60">
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Month</label>
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-xs uppercase">
                  <Filter className="mr-2 h-4 w-4 text-gold-500/40" />
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/10 dark:border-gold-500/20 backdrop-blur-xl">
                  <SelectItem value="all" className="font-luxury uppercase text-[10px] tracking-widest">All Months</SelectItem>
                  {uniqueMonthYears.map((monthYear) => (
                    <SelectItem key={monthYear} value={monthYear} className="font-luxury uppercase text-[10px] tracking-widest text-gold-900 dark:text-gold-100/60">
                      {monthYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-xs uppercase">
                  <UserIcon className="mr-2 h-4 w-4 text-gold-500/40" />
                  <SelectValue placeholder="All Players" />
                </SelectTrigger>
                <SelectContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/10 dark:border-gold-500/20 backdrop-blur-xl">
                  <SelectItem value="all" className="font-luxury uppercase text-[10px] tracking-widest">All Players</SelectItem>
                  {uniquePlayers.map((player) => (
                    <SelectItem key={player} value={player} className="font-luxury uppercase text-[10px] tracking-widest text-gold-900 dark:text-gold-100/60">
                      {player}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Ledger Card */}
      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-5 gap-4 bg-white/5 p-4 border-b border-white/10 items-center">
              <div
                onClick={() => handleSort("date")}
                className="group flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Date</span>
                {getSortIcon("date")}
              </div>
              <div
                onClick={() => handleSort("buy_in")}
                className="group flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Buy-in</span>
                {getSortIcon("buy_in")}
              </div>
              <div
                onClick={() => handleSort("players")}
                className="group flex items-center gap-2 justify-center cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Players</span>
                {getSortIcon("players")}
              </div>
              <div
                onClick={() => handleSort("chips")}
                className="group flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Total Pot</span>
                {getSortIcon("chips")}
              </div>
              <div className="flex items-center justify-start">
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">
                  {selectedPlayer !== "all" ? "P&L" : "Management"}
                </span>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden grid grid-cols-4 gap-1 bg-white/5 p-3 border-b border-white/10 items-center">
              <div onClick={() => handleSort("date")} className="flex items-center gap-1 cursor-pointer">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60">Date</span>
                {getSortIcon("date")}
              </div>
              <div onClick={() => handleSort("buy_in")} className="flex items-center gap-1 justify-center cursor-pointer">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60">Stake</span>
                {getSortIcon("buy_in")}
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60 text-center">Treasury</span>
              </div>
              <div className="flex items-center justify-end pr-2">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60 text-right">
                  {selectedPlayer !== "all" ? "P&L" : "Opt"}
                </span>
              </div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-white/5">
              {filteredAndSortedGames.map((game) => {
                const playerData = game.game_players.find(
                  (gp) => gp.player_name === selectedPlayer
                );

                return (
                  <div
                    key={game.id}
                    className="group relative cursor-pointer hover:bg-gradient-to-r hover:from-gold-500/5 hover:to-transparent transition-all duration-300"
                    onClick={() => navigate(`/games/${game.id}`)}
                    onMouseEnter={() => prefetch(game.id)}
                    onTouchStart={() => prefetch(game.id)}
                  >
                    {/* Desktop Layout Row */}
                    <div className="hidden lg:grid grid-cols-5 gap-4 items-center p-6 h-14">
                      <p className="text-sm font-luxury text-luxury-primary group-hover:text-gold-600 dark:group-hover:text-gold-50 transition-colors">
                        {format(new Date(game.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-base font-numbers text-gold-500/80 group-hover:text-gold-400 transition-colors">
                        Rs. {formatIndianNumber(game.buy_in_amount)}
                      </p>
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-gold-200/60 group-hover:text-gold-200 transition-colors">
                          {game.player_count} Players
                        </Badge>
                      </div>
                      <p className="text-base font-numbers text-gold-500/80 group-hover:text-gold-400 transition-colors">
                        Rs. {formatIndianNumber(game.total_pot)}
                      </p>
                      <div className="flex items-center justify-start gap-4">
                        {selectedPlayer !== "all" && playerData ? (
                          <Badge
                            className={cn(
                              "px-3 py-1 font-numbers tracking-widest border-0",
                              playerData.net_amount >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            )}
                          >
                            {formatProfitLoss(playerData.net_amount)}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGameId(game.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout Card */}
                    <div className="lg:hidden p-4">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group-active:scale-[0.98] transition-all">
                        {/* Row 1: Date & Status */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-[0.2em] text-gold-500/60 font-luxury mb-1">Session Date</span>
                            <span className="text-lg font-luxury text-luxury-primary leading-tight">
                              {format(new Date(game.date), "MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedPlayer !== "all" ? (
                              playerData && (
                                <Badge
                                  className={cn(
                                    "px-3 py-1 font-numbers tracking-widest border-0 text-[11px]",
                                    playerData.net_amount >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                  )}
                                >
                                  {formatProfitLoss(playerData.net_amount)}
                                </Badge>
                              )
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-500/30 active:text-red-500 active:bg-red-500/10 transition-all rounded-full bg-red-500/5 border border-red-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteGameId(game.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-luxury tracking-widest text-gold-500/40 mb-1">Stake</span>
                            <span className="text-sm font-numbers text-gold-500/90 tracking-wider">
                              ₹{formatIndianNumber(game.buy_in_amount)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-luxury tracking-widest text-gold-500/40 mb-1">Players</span>
                            <span className="text-sm font-numbers text-gold-500/90 tracking-wider">
                              {game.player_count}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-luxury tracking-widest text-gold-500/40 mb-1">Total Pot</span>
                            <span className="text-sm font-numbers text-gold-500 tracking-wider">
                              ₹{formatIndianNumber(game.total_pot)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Indicator */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-gold-500/20 to-transparent rounded-l-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteGameId} onOpenChange={(open) => !open && setDeleteGameId(null)}>
        <DialogContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/20 dark:border-gold-500/30 backdrop-blur-2xl text-gold-900 dark:text-gold-50 rounded-xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <DialogTitle className="text-xl font-luxury text-luxury-primary">Delete Game?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400 text-sm">
              This action will permanently purge this session from the archives. The accounting for all participants will be irreversibly lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setDeleteGameId(null)} className="font-luxury uppercase tracking-widest text-xs h-11 border-white/5 bg-white/2 hover:bg-white/5 transition-colors">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="font-luxury uppercase tracking-widest text-xs h-11 bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20 border-0"
              onClick={() => deleteGameId && handleDeleteGame(deleteGameId)}
            >
              Delete Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamesHistory;
