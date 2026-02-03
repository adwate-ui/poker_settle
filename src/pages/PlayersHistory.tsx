import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Users, Trophy, History, User as UserIcon } from "lucide-react";
import { Player } from "@/types/poker";
import { formatIndianNumber, formatProfitLoss, getProfitLossVariant } from "@/lib/utils";
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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 text-gold-500" />;
    return <ArrowDown className="h-4 w-4 text-gold-500" />;
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

      return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [players, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-gold-200/60 font-luxury tracking-widest uppercase text-sm animate-pulse">Auditing Participants...</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto border-gold-900/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader className="text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
            <UserIcon className="h-8 w-8 text-gold-500/40" />
          </div>
          <CardTitle className="text-3xl font-luxury text-luxury-primary mb-2">Empty Roster</CardTitle>
          <CardDescription className="text-gray-400 max-w-sm mx-auto">
            You haven't registered any participants in your ledger. Add players during game setup to track their lifelong performance.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
              <Trophy className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-luxury text-luxury-primary">Participant Matrix</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest text-gold-500/40 font-luxury">Lifelong performance metrics across the table</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">Total Participants</p>
              <p className="text-3xl font-numbers text-luxury-primary">{players.length}</p>
            </div>
            <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">Winning Ratio</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-numbers text-green-400">
                  {players.filter(p => (p.total_profit || 0) >= 0).length}
                </p>
                <p className="text-sm text-white/30 font-luxury uppercase tracking-widest">Active Gains</p>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2 hidden lg:block">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">Collective Sessions</p>
              <p className="text-3xl font-numbers text-luxury-primary">
                {players.reduce((sum, p) => sum + (p.total_games || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-4 gap-4 bg-white/5 p-4 border-b border-white/10">
              <div
                onClick={() => handleSort("name")}
                className="group flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Nominee</span>
                {getSortIcon("name")}
              </div>
              <div
                onClick={() => handleSort("total_games")}
                className="group flex items-center gap-2 justify-center cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Archive Count</span>
                {getSortIcon("total_games")}
              </div>
              <div
                onClick={() => handleSort("total_profit")}
                className="group flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 group-hover:text-gold-200 transition-colors">Cumulative Net</span>
                {getSortIcon("total_profit")}
              </div>
              <div className="flex items-center justify-start">
                <span className="text-[11px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">Management</span>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden grid grid-cols-4 gap-1 bg-white/5 p-3 border-b border-white/10 items-center">
              <div onClick={() => handleSort("name")} className="flex items-center gap-1 cursor-pointer">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60">NAME</span>
                {getSortIcon("name")}
              </div>
              <div onClick={() => handleSort("total_games")} className="flex items-center gap-1 justify-center cursor-pointer">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60">GAMES</span>
                {getSortIcon("total_games")}
              </div>
              <div onClick={() => handleSort("total_profit")} className="flex items-center gap-1 justify-center cursor-pointer">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60">NET</span>
                {getSortIcon("total_profit")}
              </div>
              <div className="flex items-center justify-end pr-2">
                <span className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/60 text-right">ACTION</span>
              </div>
            </div>

            {/* Player List Rows */}
            <div className="divide-y divide-white/5">
              {sortedPlayers.map((player) => {
                const profit = player.total_profit || 0;
                return (
                  <div
                    key={player.id}
                    className="group relative cursor-pointer hover:bg-gradient-to-r hover:from-gold-500/5 hover:to-transparent transition-all duration-300"
                  >
                    {/* Desktop Layout Row */}
                    <div className="hidden lg:grid grid-cols-4 gap-4 items-center p-6 h-16">
                      <div
                        className="flex items-center gap-4 group/name"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <div className="relative">
                          <OptimizedAvatar name={player.name} size="md" className="border-gold-500/20 group-hover/name:border-gold-500/50 transition-colors" />
                          <div className="absolute inset-0 rounded-full bg-gold-500/0 group-hover/name:bg-gold-500/5 transition-colors" />
                        </div>
                        <p className="text-base font-luxury text-luxury-primary group-hover/name:text-gold-600 dark:group-hover/name:text-gold-50 transition-colors">
                          {player.name}
                        </p>
                      </div>
                      <div
                        className="flex items-center justify-center"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-gold-200/60 group-hover:text-gold-200 transition-colors px-3 py-1">
                          {player.total_games || 0} Sessions
                        </Badge>
                      </div>
                      <div
                        className="flex"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <Badge
                          className={cn(
                            "px-4 py-1.5 font-numbers tracking-widest border-0 text-sm",
                            profit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {formatProfitLoss(profit)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-start gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePlayerId(player.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Layout Row */}
                    <div className="lg:hidden grid grid-cols-4 gap-1 items-center p-4">
                      <div
                        className="flex items-center gap-2 min-w-0"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <OptimizedAvatar name={player.name} size="sm" className="border-gold-500/10" />
                        <span className="text-[11px] font-luxury text-luxury-primary truncate">{player.name}</span>
                      </div>
                      <div
                        className="flex items-center justify-center font-numbers text-[12px] text-gold-500/70"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        {player.total_games || 0}
                      </div>
                      <div
                        className="flex items-center justify-center"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <Badge
                          className={cn(
                            "h-6 px-1.5 min-w-[50px] flex justify-center text-[10px] font-numbers border-0",
                            profit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {formatProfitLoss(profit)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-end pr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500/20 active:text-red-500 transition-all rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePlayerId(player.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
      <Dialog open={!!deletePlayerId} onOpenChange={(open) => !open && setDeletePlayerId(null)}>
        <DialogContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/20 dark:border-gold-500/30 backdrop-blur-2xl text-gold-900 dark:text-gold-50 rounded-xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <DialogTitle className="text-xl font-luxury text-luxury-primary">Expunge Participant?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400 text-sm">
              This action will permanently purge this player and all their historic sessions from the ledger. This operation is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setDeletePlayerId(null)} className="font-luxury uppercase tracking-widest text-xs h-11 border-white/5 bg-white/2 hover:bg-white/5 transition-colors">
              Abort Deletion
            </Button>
            <Button
              variant="destructive"
              className="font-luxury uppercase tracking-widest text-xs h-11 bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20 border-0"
              onClick={() => deletePlayerId && handleDeletePlayer(deletePlayerId)}
            >
              Purge Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersHistory;
