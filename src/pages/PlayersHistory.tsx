import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { ErrorMessages } from "@/lib/errorUtils";
import { Trash2, ArrowUpDown, Users, Trophy, User as UserIcon, UserPlus, Download, FileText, Printer } from "lucide-react";
import { exportPlayersToCSV, printPlayersReport } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayerCardSkeletonList } from "@/components/skeletons";
import { EmptyState } from "@/components/EmptyState";
import { Player } from "@/types/poker";
import { formatProfitLoss } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

type SortField = "name" | "total_games" | "total_profit";
type SortOrder = "asc" | "desc" | null;

const PlayersHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [totalUniqueGames, setTotalUniqueGames] = useState<number>(0);
  const isMobile = useIsMobile();

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch players
      const { data, error } = await supabase.from("players").select("*").eq("user_id", user?.id);
      if (error) throw error;
      setPlayers(data || []);

      // Fetch unique games count
      const { count, error: countError } = await supabase
        .from("games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      if (countError) throw countError;
      setTotalUniqueGames(count || 0);

    } catch (error) {
      console.error("Error fetching player history data:", error);
      toast.error(ErrorMessages.generic.load(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeletePlayer = useCallback(async (playerId: string) => {
    try {
      const { error } = await supabase.from("players").delete().eq("id", playerId);
      if (error) throw error;
      toast.success("Player deleted successfully");
      fetchPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error(ErrorMessages.player.delete(error));
    } finally {
      setDeletePlayerId(null);
    }
  }, [fetchPlayers]);

  useEffect(() => {
    if (user) fetchPlayers();
  }, [user, fetchPlayers]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "total_games":
          aVal = a.total_games || 0;
          bVal = b.total_games || 0;
          break;
        case "total_profit":
          aVal = a.total_profit || 0;
          bVal = b.total_profit || 0;
          break;
      }
      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1);
    });
  }, [players, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <PlayerCardSkeletonList count={6} />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No Players Yet"
        description="You haven't registered any players yet. Players are automatically created when you start your first game, or you can add them manually to get a head start!"
        action={{
          label: "Create First Game",
          onClick: () => navigate("/"),
        }}
        secondaryAction={{
          label: "View Games",
          onClick: () => navigate("/games"),
        }}
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
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>Overall player performance</CardDescription>
              </div>
            </div>
            {players.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportPlayersToCSV(players)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => printPlayersReport(players)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
              <p className="text-label text-muted-foreground">Total Players</p>
              <p className="text-3xl font-numbers text-primary">{players.length}</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
              <p className="text-label text-muted-foreground">Win Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-numbers text-state-success">
                  {players.filter(p => (p.total_profit || 0) >= 0).length}
                </p>
                <p className="text-label text-muted-foreground">Profitable Players</p>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-2 hidden lg:block">
              <p className="text-label text-muted-foreground">Total Games</p>
              <p className="text-3xl font-numbers text-primary">
                {totalUniqueGames}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Table Layout */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className={cn(isMobile && "table-fixed w-full font-luxury")}>
            <TableHeader className="bg-card/50">
              <TableRow className={cn(isMobile ? "h-10" : "text-xs sm:text-sm")}>
                <TableHead
                  onClick={() => handleSort("name")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors p-2 sm:p-4",
                    isMobile ? "w-[35%] px-1 text-mobile-compact" : ""
                  )}
                >
                  <span className="flex items-center gap-0.5">
                    {isMobile ? "Plyr" : "Player"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("total_games")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors text-center p-2 sm:p-4",
                    isMobile ? "w-[15%] px-1 text-mobile-compact" : ""
                  )}
                >
                  <span className="flex items-center justify-center gap-0.5">
                    {isMobile ? "Gms" : "Games"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("total_profit")}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors text-right p-2 sm:p-4",
                    isMobile ? "w-[30%] px-1 text-mobile-compact" : ""
                  )}
                >
                  <span className="flex items-center justify-end gap-0.5">
                    {isMobile ? "Net" : "Total Net"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead className={cn(
                  "text-right p-2 sm:p-4",
                  isMobile ? "w-[20%] px-1" : ""
                )}>
                  {!isMobile && "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const profit = player.total_profit || 0;
                return (
                  <TableRow
                    key={player.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30 transition-colors",
                      isMobile ? "h-10 text-mobile-compact" : "text-xs sm:text-sm"
                    )}
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <TableCell className={cn(isMobile ? "px-1" : "p-2 sm:p-4")}>
                      <div className="flex items-center gap-1.5 sm:gap-4 overflow-hidden">
                        <OptimizedAvatar
                          name={player.name}
                          size="sm"
                          className={cn(isMobile ? "h-5 w-5" : "h-6 w-6 sm:h-10 sm:w-10")}
                        />
                        <span className="font-medium truncate block">
                          {player.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-center", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      <Badge variant="secondary" className={cn(isMobile ? "h-5 px-1.5 text-[9px] min-w-[20px]" : "text-xs")}>
                        {player.total_games || 0}
                        {!isMobile && " Sessions"}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      <Badge
                        variant={profit >= 0 ? "profit" : "loss"}
                        className={cn(
                          "font-medium whitespace-nowrap font-numbers",
                          isMobile ? 'text-[10px] px-1.5' : 'text-sm px-3'
                        )}
                      >
                        {profit < 0 ? '-' : ''}Rs. {Math.abs(Math.round(profit)).toLocaleString('en-IN')}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right", isMobile ? "px-1" : "p-2 sm:p-4")}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "text-destructive/50 hover:text-destructive hover:bg-destructive/10",
                          isMobile ? "h-6 w-6" : "h-6 w-6 sm:h-8 sm:w-8"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePlayerId(player.id);
                        }}
                      >
                        <Trash2 className={cn(isMobile ? "h-3 w-3" : "h-3 w-3 sm:h-4 sm:w-4")} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>


      <Dialog open={!!deletePlayerId} onOpenChange={(open) => !open && setDeletePlayerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player?</DialogTitle>
            <DialogDescription>
              This action will permanently delete this player and all their historic sessions from the records. This operation is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletePlayerId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletePlayerId && handleDeletePlayer(deletePlayerId)}>Delete Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersHistory;
