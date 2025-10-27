import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Trash2, ArrowUpDown, ArrowUp, ArrowDown, User } from "lucide-react";
import { Player } from "@/types/poker";
import { formatIndianNumber } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
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

type SortField = "name" | "total_games" | "total_profit" | "avg_per_game";
type SortOrder = "asc" | "desc" | null;

const PlayersHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user]);

  const fetchPlayers = async () => {
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
  };

  const handleDeletePlayer = async (playerId: string) => {
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
  };

  const handleSort = (field: SortField) => {
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
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aVal: any, bVal: any;
      
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
        case "avg_per_game":
          aVal = a.total_games > 0 ? (a.total_profit || 0) / a.total_games : 0;
          bVal = b.total_games > 0 ? (b.total_profit || 0) / b.total_games : 0;
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
      <Card className="max-w-6xl mx-auto bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardHeader>
          <CardTitle className="text-primary">Players History</CardTitle>
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
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Players Performance</CardTitle>
          <CardDescription>Overall statistics for all players</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Stats - Moved to top */}
      <Card className="border-primary/20 bg-gradient-to-br from-amber-500/10 via-background to-amber-600/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Total Players</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{players.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <p className="text-sm text-muted-foreground">Total Games</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {players.reduce((sum, p) => sum + (p.total_games || 0), 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <p className="text-sm text-muted-foreground">Winning Players</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {players.filter(p => (p.total_profit || 0) >= 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-lg p-4">
          <div className="grid grid-cols-5 gap-4 font-bold text-sm">
            <Button
              variant="ghost"
              onClick={() => handleSort("name")}
              className="flex items-center gap-2 justify-start hover:text-primary font-bold"
            >
              Player Name
              {getSortIcon("name")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_games")}
              className="flex items-center gap-2 justify-center hover:text-primary font-bold"
            >
              Games
              {getSortIcon("total_games")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_profit")}
              className="flex items-center gap-2 justify-center hover:text-primary font-bold"
            >
              Total P&L
              {getSortIcon("total_profit")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("avg_per_game")}
              className="flex items-center gap-2 justify-center hover:text-primary font-bold"
            >
              Avg Per Game
              {getSortIcon("avg_per_game")}
            </Button>
            <div className="text-center font-bold">Actions</div>
          </div>
        </div>

        {sortedPlayers.map((player, index) => {
          const avgPerGame = player.total_games > 0 
            ? (player.total_profit || 0) / player.total_games 
            : 0;
          const isProfit = (player.total_profit || 0) >= 0;
          const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`;

          return (
            <Card
              key={player.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                index % 2 === 0 
                  ? "bg-secondary/5 hover:bg-secondary/20" 
                  : "hover:bg-primary/10"
              }`}
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div 
                    className="flex items-center gap-3"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                      <img 
                        src={avatarUrl} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-primary">{player.name}</span>
                  </div>
                  
                  <div 
                    className="text-center"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                      {player.total_games || 0}
                    </span>
                  </div>
                  
                  <div 
                    className="text-center"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <span className={`px-3 py-1 rounded-full font-bold ${
                      isProfit 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {isProfit ? "+" : ""}Rs. {formatIndianNumber(player.total_profit || 0)}
                    </span>
                  </div>
                  
                  <div 
                    className="text-center"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <span className={`px-3 py-1 rounded-full font-semibold ${
                      avgPerGame >= 0 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                        : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {avgPerGame >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.round(avgPerGame))}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    {isProfit ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Winning</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium">Losing</span>
                      </div>
                    )}
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
