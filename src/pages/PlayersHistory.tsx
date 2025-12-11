import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Player } from "@/types/poker";
import { formatIndianNumber } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import OptimizedAvatar from "@/components/OptimizedAvatar";
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

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeletePlayer = useCallback(async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;

      toast.success("Player deleted successfully");
      fetchPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    } finally {
      setDeletePlayerId(null);
    }
  }, [fetchPlayers]);

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user, fetchPlayers]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField("name");
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          if (sortOrder === "asc") return aVal < bVal ? -1 : 1;
          return aVal > bVal ? -1 : 1;
        case "total_games":
          aVal = a.total_games || 0;
          bVal = b.total_games || 0;
          break;
        case "total_profit":
          aVal = a.total_profit || 0;
          bVal = b.total_profit || 0;
          break;
      }
      
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [players, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Players History</CardTitle>
          <CardDescription>No players yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Add players to your games to see their statistics here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl">Players Performance</CardTitle>
          <CardDescription className="text-sm">Overall statistics for all players</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Stats - Moved to top */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Players</p>
              <p className="text-xl sm:text-2xl font-bold">{players.length}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Games</p>
              <p className="text-xl sm:text-2xl font-bold">
                {players.reduce((sum, p) => sum + (p.total_games || 0), 0)}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground">Winning Players</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {players.filter(p => (p.total_profit || 0) >= 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 sm:space-y-3">
        <div className="hidden md:block rounded-lg p-3 sm:p-4 border">
          <div className="grid grid-cols-4 gap-4 font-bold text-sm">
            <Button
              variant="ghost"
              onClick={() => handleSort("name")}
              className="flex items-center gap-2 justify-start font-bold"
            >
              Player Name
              {getSortIcon("name")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_games")}
              className="flex items-center gap-2 justify-start font-bold"
            >
              Games
              {getSortIcon("total_games")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_profit")}
              className="flex items-center gap-2 justify-start font-bold"
            >
              Net P&L
              {getSortIcon("total_profit")}
            </Button>
            <div className="flex items-center justify-start h-10 px-4 font-bold">Actions</div>
          </div>
        </div>

        {sortedPlayers.map((player) => {
          const isProfit = (player.total_profit || 0) >= 0;

          return (
            <Card
              key={player.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              <CardContent className="p-5 sm:p-6">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <OptimizedAvatar name={player.name} size="md" />
                      <span className="font-bold text-base truncate">{player.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePlayerId(player.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/20 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Games</p>
                      <Badge variant="info">{player.total_games || 0}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Net P&L</p>
                      <Badge variant={isProfit ? "success" : "destructive"}>
                        {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-4 gap-6 items-center text-sm">
                  <div 
                    className="flex items-center gap-4"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <OptimizedAvatar name={player.name} size="md" />
                    <span className="font-bold text-base truncate">{player.name}</span>
                  </div>
                  
                  <div 
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <Badge variant="info">{player.total_games || 0}</Badge>
                  </div>
                  
                  <div 
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <Badge variant={isProfit ? "success" : "destructive"}>
                      {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePlayerId(player.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deletePlayerId} onOpenChange={() => setDeletePlayerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this player? This action cannot be undone and will remove all their game history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlayerId && handleDeletePlayer(deletePlayerId)}
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

export default PlayersHistory;
