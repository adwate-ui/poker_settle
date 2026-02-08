import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notifications";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Share2, ChevronDown, Edit, User, Mail, CreditCard, Layers, History } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import { CurrencyConfig, PaymentMethodConfig } from "@/config/localization";
import { Player } from "@/types/poker";
import { ShareDialog } from "@/components/ShareDialog";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { PlayerFormDialog, PlayerFormData } from "@/components/PlayerFormDialog";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from "@supabase/supabase-js";

interface GameHistory {
  id: string;
  game_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  games: {
    date: string;
    buy_in_amount: number;
    id: string;
  };
}

type SortField = "date" | "buy_ins" | "final_stack" | "net_amount";
type SortOrder = "asc" | "desc" | null;

interface PlayerDetailProps {
  playerId?: string;
  userId?: string;
  client?: SupabaseClient;
  readOnly?: boolean;
}

const PlayerDetail = ({ playerId: propPlayerId, userId, client, readOnly = false }: PlayerDetailProps = {}) => {
  const params = useParams();
  const navigate = useNavigate();
  // If prop provided, use it, otherwise use param
  const playerId = propPlayerId || params.playerId;

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { updatePlayer } = usePlayerManagement();

  const fetchPlayerData = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const activeClient = client || supabase;

      const { data: playerData, error: playerError } = await activeClient
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      const { data: historyData, error: historyError } = await activeClient
        .from("game_players")
        .select(`
          *,
          games (
            id,
            date,
            buy_in_amount
          )
        `)
        .eq("player_id", playerId)
        .order("games(date)", { ascending: false });

      if (historyError) throw historyError;
      const validHistory = (historyData || []).filter((h: any) => h.games) as unknown as GameHistory[];
      setGameHistory(validHistory);
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast.error("Failed to load player details");
    } finally {
      setLoading(false);
    }
  }, [playerId, client]);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId, fetchPlayerData]);

  const handleUpdatePlayer = async (playerData: Partial<PlayerFormData>) => {
    if (!playerId || readOnly) return;

    try {
      const updatedPlayer = await updatePlayer(playerId, playerData);
      setPlayer(updatedPlayer);
      toast.success("Player details updated successfully");
    } catch (error) {
      // toast handled in hook
    }
  };

  const handleNavigateGame = (gameId: string) => {
    if (client) {
      navigate(`../game/${gameId}`, { relative: "path" });
    } else {
      navigate(`/games/${gameId}`);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField("date");
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 text-muted-foreground" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const uniqueMonthYears = useMemo(() => {
    const monthYears = gameHistory.map((game) => format(new Date(game.games.date), "MMM yyyy"));
    return Array.from(new Set(monthYears)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [gameHistory]);

  const filteredGameHistory = useMemo(() => {
    return gameHistory.filter((game) => {
      if (selectedMonthYear === "all") return true;
      const monthYear = format(new Date(game.games.date), "MMM yyyy");
      return monthYear === selectedMonthYear;
    });
  }, [gameHistory, selectedMonthYear]);

  const sortedGameHistory = useMemo(() => {
    return [...filteredGameHistory].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "date":
          aVal = new Date(a.games.date).getTime();
          bVal = new Date(b.games.date).getTime();
          break;
        case "buy_ins":
          aVal = a.buy_ins;
          bVal = b.buy_ins;
          break;
        case "final_stack":
          aVal = a.final_stack;
          bVal = b.final_stack;
          break;
        case "net_amount":
          aVal = a.net_amount;
          bVal = b.net_amount;
          break;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredGameHistory, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground animate-pulse">Loading Player Profile...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-4xl mx-auto border-border bg-background/60 backdrop-blur-xl p-6 text-center">
        <p className="text-muted-foreground font-luxury tracking-widest uppercase text-3xs">Player not found.</p>
      </Card>
    );
  }

  const isProfit = (player.total_profit || 0) >= 0;
  const winRate = filteredGameHistory.length > 0
    ? (filteredGameHistory.filter(gh => gh.net_amount > 0).length / filteredGameHistory.length) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {!readOnly && (
        <Button
          variant="ghost"
          onClick={() => navigate("/players")}
          className="mb-4 hover:bg-accent/10 text-primary hover:text-primary/80 font-luxury uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matrix
        </Button>
      )}

      <Card className="border-border bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border bg-accent/5">
          <div
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <OptimizedAvatar name={player.name} size="lg" className="border-primary/30 group-hover:border-primary transition-colors" />
                <div className="absolute inset-0 rounded-full shadow-lg shadow-primary/20 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-3xl font-luxury text-foreground">{player.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">Player Profile</span>
                </div>
              </div>
            </div>
            <ChevronDown className={cn("h-6 w-6 text-muted-foreground group-hover:text-primary transition-all duration-300", isStatsOpen && "transform rotate-180")} />
          </div>
        </CardHeader>

        {isStatsOpen && (
          <CardContent className="p-4 sm:p-8 space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2">
                <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">Total Games</p>
                <p className="text-3xl font-numbers text-foreground">{player.total_games || 0}</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2">
                <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">Total Profit/Loss</p>
                <div className="flex items-center">
                  <Badge
                    variant={isProfit ? "profit" : "loss"}
                    className="text-2xl font-numbers py-1 px-3 h-auto"
                  >
                    {isProfit ? "+" : ""}{formatCurrency(Math.abs(player.total_profit || 0))}
                  </Badge>
                </div>
              </div>
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">Success Ratio</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-numbers text-primary">{winRate.toFixed(1)}%</p>
                  <div className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-luxury text-foreground">Player Details</h3>
                  <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground mt-1">Contact and payment info</p>
                </div>
                {!readOnly && (
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDialogOpen(true)}
                      className="h-10 px-5 hover:bg-accent/10 text-primary font-luxury uppercase tracking-widest text-xs rounded-full border border-primary/20"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDialog(true)}
                      className="h-10 px-5 bg-accent/5 border-border hover:bg-accent/10 text-foreground font-luxury uppercase tracking-widest text-xs rounded-full"
                    >
                      <Edit className="h-4 w-4 mr-2 text-primary" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {(player.email || player.upi_id || player.payment_preference) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-lg border border-border bg-accent/5 space-y-3">
                    <div className="flex items-center gap-2 text-3xs uppercase font-luxury tracking-widest text-muted-foreground">
                      <Mail className="h-3 w-3" /> Communication
                    </div>
                    <p className="text-sm text-foreground font-medium truncate">{player.email || "Not Disclosed"}</p>
                  </div>
                  <div className="p-5 rounded-lg border border-border bg-accent/5 space-y-3">
                    <div className="flex items-center gap-2 text-3xs uppercase font-luxury tracking-widest text-muted-foreground">
                      <CreditCard className="h-3 w-3" /> Digital ID
                    </div>
                    <p className="text-sm text-foreground font-medium truncate">{player.upi_id || "Not Linked"}</p>
                  </div>
                  <div className="p-5 rounded-lg border border-border bg-accent/5 space-y-3">
                    <div className="flex items-center gap-2 text-3xs uppercase font-luxury tracking-widest text-muted-foreground">
                      <Layers className="h-3 w-3" /> Preference
                    </div>
                    <p className="text-sm text-foreground font-medium capitalize">{player.payment_preference ? (player.payment_preference === PaymentMethodConfig.digital.key ? PaymentMethodConfig.digital.label : PaymentMethodConfig.cash.label) : "Unspecified"}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-border bg-accent/5 text-center">
                  <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/30">No data associated with this player.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border bg-accent/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <History className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl font-luxury text-foreground">Game History</CardTitle>
            </div>
            <div className="min-w-[200px]">
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="h-10 bg-accent/5 border-0 border-b border-border rounded-none focus:ring-0 focus:border-primary transition-all text-label text-foreground">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Period Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-label text-foreground/60">Full Archive</SelectItem>
                  {uniqueMonthYears.map((monthYear) => (
                    <SelectItem key={monthYear} value={monthYear} className="text-label text-foreground/60">
                      {monthYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-accent/5">
                <TableRow className="border-b-border hover:bg-transparent">
                  <TableHead
                    onClick={() => handleSort("date")}
                    className="w-[25%] h-10 align-middle cursor-pointer hover:text-primary transition-colors text-[9px] uppercase tracking-widest font-luxury text-muted-foreground pl-8"
                  >
                    <div className="flex items-center gap-1">
                      Session Day {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("buy_ins")}
                    className="w-[15%] h-10 align-middle cursor-pointer hover:text-primary transition-colors text-[9px] uppercase tracking-widest font-luxury text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Buy-ins {getSortIcon("buy_ins")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("net_amount")}
                    className="w-[25%] h-10 align-middle cursor-pointer hover:text-primary transition-colors text-[9px] uppercase tracking-widest font-luxury text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Net P&L {getSortIcon("net_amount")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("final_stack")}
                    className="w-[20%] h-10 align-middle cursor-pointer hover:text-primary transition-colors text-[9px] uppercase tracking-widest font-luxury text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Final Stack {getSortIcon("final_stack")}
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%] h-10 text-right pr-8" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {sortedGameHistory.map((game) => {
                  const isWin = game.net_amount > 0;
                  return (
                    <TableRow key={game.id} className="h-12 border-border group hover:bg-accent/5 transition-colors">
                      <TableCell className="font-luxury text-[11px] text-foreground/80 pl-8">
                        {format(new Date(game.games.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-numbers text-xs text-muted-foreground">
                        {game.buy_ins} <span className="text-[10px] opacity-50 uppercase font-luxury tracking-tighter">Stacks</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isWin ? "profit" : "loss"}
                          className="font-numbers tracking-widest text-[11px] px-2 py-0.5"
                        >
                          {isWin ? "+" : ""}{formatCurrency(game.net_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-numbers text-xs text-foreground/60">
                        {formatCurrency(game.final_stack)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateGame(game.game_id)}
                          className="text-[10px] h-7 px-3 rounded-full font-luxury uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          Examine
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        resourceType="player"
        resourceId={playerId!}
        title={`Player Profile - ${player.name}`}
        description={`Poker statistics and session history for ${player.name}.`}
      />

      {!readOnly && (
        <PlayerFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleUpdatePlayer}
          initialData={player || undefined}
          title="Edit Player Details"
          description="Edit the communication and financial parameters for this player."
        />
      )}
    </div>
  );
};

export default PlayerDetail;
