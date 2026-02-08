import { useEffect, useState, useMemo } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { ErrorMessages } from "@/lib/errorUtils";
import { ArrowUpDown, Trash2, Filter, History, Calendar, User as UserIcon, Gamepad2, Download, FileText } from "lucide-react";
import { exportGamesToCSV } from "@/lib/exportUtils";
import { Game } from "@/types/poker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GameCardSkeletonList } from "@/components/skeletons";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatProfitLoss, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { usePrefetchGame } from "@/hooks/usePrefetch";
import { useGames } from "@/features/game/hooks/useGames";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

interface GamesHistoryProps {
  userId?: string;
  client?: SupabaseClient;
  readOnly?: boolean;
  disablePlayerLinks?: boolean;
}

const GamesHistory = ({ userId: propUserId, client, readOnly = false, disablePlayerLinks = false }: GamesHistoryProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const { prefetch } = usePrefetchGame();
  const isMobile = useIsMobile();

  const effectiveUserId = propUserId || user?.id;

  // Use the useGames hook
  const { data: gamesData, isLoading: loading, refetch } = useGames(effectiveUserId, client);

  // Transform data to match GameWithStats interface
  const games: GameWithStats[] = useMemo(() => {
    if (!gamesData) return [];

    return gamesData.map((game: any) => {
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
  }, [gamesData]);

  const handleDeleteGame = async (gameId: string) => {
    try {
      // Use provided client or fallback to global supabase
      const activeClient = client || supabase;
      const { error } = await activeClient.from("games").delete().eq("id", gameId);
      if (error) throw error;
      toast.success("Game deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error(ErrorMessages.game.delete(error));
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

  const handleNavigate = (gameId: string) => {
    // If shared mode (client present), we might need to handle navigation differently
    // The current shared route is /shared/:token/game/:gameId
    // But GamesHistory sits inside /shared/:token/
    // So simply navigating to `./game/${gameId}` or maintaining the relative path might work
    // depending on where this component is rendered.

    // If client is present, we assume we are in shared view
    if (client) {
      // Assuming the parent route is /shared/:token
      navigate(`game/${gameId}`);
    } else {
      navigate(`/games/${gameId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <GameCardSkeletonList count={5} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <EmptyState
        icon={Gamepad2}
        title="No Games Yet"
        description={
          readOnly
            ? "No completed games found for this view."
            : "You haven't recorded any poker sessions yet. Start your first game to begin tracking buy-ins, stacks, and settlements!"
        }
        action={
          !readOnly
            ? {
              label: "Create First Game",
              onClick: () => navigate("/"),
            }
            : undefined
        }
        secondaryAction={
          !readOnly
            ? {
              label: "Add Players",
              onClick: () => navigate("/players"),
            }
            : undefined
        }
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter game history</CardDescription>
              </div>
            </div>
            {!readOnly && games.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportGamesToCSV(gamesData as Game[])}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

      {/* Responsive Table Layout */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className={cn(isMobile && "table-fixed w-full")}>
            <TableHeader className="bg-card/50">
              <TableRow className={cn(isMobile ? "h-10" : "text-xs sm:text-sm")}>
                <TableHead
                  onClick={() => handleSort("date")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors p-2 sm:p-4 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                    isMobile ? "w-[22%] px-1 text-mobile-compact" : "w-[25%]"
                  )}
                >
                  <span className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("buy_in")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors text-right p-2 sm:p-4 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                    isMobile ? "w-[18%] px-1 text-mobile-compact" : "w-[20%]"
                  )}
                >
                  <span className="flex items-center justify-end gap-1">
                    {isMobile ? "Buy" : "Buy-in"}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("players")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors text-center p-2 sm:p-4 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                    isMobile ? "w-[12%] px-1 text-mobile-compact" : "w-[15%]"
                  )}
                >
                  <span className="flex items-center justify-center gap-1">
                    {isMobile ? "Plyr" : "Players"}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("chips")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors text-right p-2 sm:p-4 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                    isMobile ? "w-[23%] px-1 text-mobile-compact" : "w-[20%]"
                  )}
                >
                  <span className="flex items-center justify-end gap-1">
                    {isMobile ? "Pot" : "Total Pot"}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className={cn(
                  "text-right p-2 sm:p-4 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                  isMobile ? "w-[25%] px-1 text-mobile-compact" : "w-[20%]"
                )}>
                  {isMobile ? "P&L" : (selectedPlayer !== "all" ? "Player P&L" : "")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedGames.map((game) => {
                const playerData = game.game_players.find((gp) => gp.player_name === selectedPlayer);
                return (
                  <TableRow
                    key={game.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30 transition-colors",
                      isMobile ? "h-10 text-mobile-compact" : "text-xs sm:text-sm"
                    )}
                    onClick={() => handleNavigate(game.id)}
                    onMouseEnter={() => prefetch(game.id)}
                  >
                    <TableCell className={cn("font-medium whitespace-nowrap", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      {format(new Date(game.date), isMobile ? "MMM d" : "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className={cn("text-right font-numbers", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      {isMobile ? `Rs.${Math.round(game.buy_in_amount).toLocaleString('en-IN')}` : formatCurrency(game.buy_in_amount)}
                    </TableCell>
                    <TableCell className={cn("text-center", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      <Badge variant="secondary" className={cn("font-numbers", isMobile ? "h-5 px-1.5 text-[9px] min-w-[20px]" : "text-xs")}>
                        {game.player_count}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-numbers font-semibold", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      {isMobile ? `Rs.${Math.round(game.total_pot).toLocaleString('en-IN')}` : formatCurrency(game.total_pot)}
                    </TableCell>
                    <TableCell className={cn("text-right", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      {selectedPlayer !== "all" && playerData ? (
                        <Badge variant={playerData.net_amount >= 0 ? 'profit' : 'loss'} className={cn(isMobile ? "h-5 px-1.5 text-[9px]" : "text-xs")}>
                          {isMobile ? (playerData.net_amount >= 0 ? '+' : '') + Math.round(playerData.net_amount) : formatProfitLoss(playerData.net_amount)}
                        </Badge>
                      ) : (
                        !readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "text-destructive/50 hover:text-destructive hover:bg-destructive/10",
                              isMobile ? "h-6 w-6" : "h-6 w-6 sm:h-8 sm:w-8"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGameId(game.id);
                            }}
                          >
                            <Trash2 className={cn(isMobile ? "h-3 w-3" : "h-3 w-3 sm:h-4 sm:w-4")} />
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>


      {!readOnly && (
        <Dialog open={!!deleteGameId} onOpenChange={(open) => !open && setDeleteGameId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Game?</DialogTitle>
              <DialogDescription>
                This action will permanently remove this session from the history. The accounting for all players will be irreversibly lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteGameId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteGameId && handleDeleteGame(deleteGameId)}>Delete Game</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GamesHistory;
