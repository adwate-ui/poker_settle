import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { Trash2, ArrowUpDown, Users, Trophy, User as UserIcon, UserPlus } from "lucide-react";
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
      toast.error("Failed to load player statistics");
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
      toast.error("Failed to delete player");
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>Overall player performance</CardDescription>
            </div>
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
                <p className="text-3xl font-numbers text-green-600 dark:text-green-400">
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

      {/* Mobile Card Layout */}
      <div className="space-y-3 md:hidden">
        {sortedPlayers.map((player) => {
          const profit = player.total_profit || 0;
          return (
            <Card
              key={player.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/players/${player.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <OptimizedAvatar name={player.name} size="md" />
                    <span className="font-medium font-luxury">{player.name}</span>
                  </div>
                  <Badge variant={profit >= 0 ? 'profit' : 'loss'}>
                    {formatProfitLoss(profit)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Games Played</p>
                    <Badge variant="secondary">{player.total_games || 0} Sessions</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePlayerId(player.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <Card className="overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:text-primary transition-colors">
                <span className="flex items-center gap-1">Player <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead onClick={() => handleSort("total_games")} className="cursor-pointer hover:text-primary transition-colors text-center">
                <span className="flex items-center justify-center gap-1">Games Played <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead onClick={() => handleSort("total_profit")} className="cursor-pointer hover:text-primary transition-colors text-right">
                <span className="flex items-center justify-end gap-1">Total Net <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player) => {
              const profit = player.total_profit || 0;
              return (
                <TableRow
                  key={player.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <OptimizedAvatar name={player.name} size="md" />
                      <span className="font-medium font-luxury text-base">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{player.total_games || 0} Sessions</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={profit >= 0 ? 'profit' : 'loss'}>
                      {formatProfitLoss(profit)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePlayerId(player.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
