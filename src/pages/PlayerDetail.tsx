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
import { formatIndianNumber, cn } from "@/lib/utils";
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
      // Filter out any where games is null (though with inner join it shouldn't be, but pure select might allow null if game deleted)
      // Actually RLS might filter games if not visible.
      // And we need to map to GameHistory structure clearly 
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
      // Shared view navigation
      // navigation handled by valid routes in SharedLayout context if possible
      // But SharedLayout only has tabs.
      // It doesn't have a route for "Game Detail" unless we add one or use a modal.
      // The user request said: "Tab 1: Games. Tab 2: Player Details".
      // It didn't mention Deep Linking to Game Detail from Player Detail in Shared View.
      // But GamesHistory has "Examine" button in shared view?
      // In `GamesHistory` (refactored), I added `navigate('game/${gameId}')`.
      // This implies there is a route. 
      // `App.tsx` has `<Route path="/shared/:token/game/:gameId" element={<SharedGameDetail />} />`.
      // Wait, I am removing `SharedView.tsx`. `SharedGameDetail` likely still exists?
      // If I am fully replacing `SharedView` with `SharedLayout`, I should integrate `SharedGameDetail` if needed.
      // But the user request Phase 3 says: "Refactor `SharedView.tsx` (rename to `SharedLayout.tsx`)... If scope='game': Render GamesHistory... If scope='player': Render Tabs."
      // It doesn't mention keeping `SharedGameDetail`. 
      // However, if the user clicks "Examine" on a game, where do they go?
      // Usually to the game detail.
      // If I look at `App.tsx` routes again:
      // `<Route path="/shared/:token/game/:gameId" element={<SharedGameDetail />} />`
      // This route is OUTSIDE `SharedView`. It is a separate route.
      // So `navigate('game/ID')` from `share/:token/` (which renders `SharedLayout`) will go to `share/:token/game/ID`.
      // So yes, I can navigate.
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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 text-gold-500" />;
    return <ArrowDown className="h-4 w-4 text-gold-500" />;
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
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-label text-gold-200/60 animate-pulse">Loading Player Profile...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-4xl mx-auto border-border bg-background/60 backdrop-blur-xl p-10 text-center">
        <p className="text-muted-foreground font-luxury tracking-widest uppercase">Player not found.</p>
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
        <CardHeader className="pb-6 border-b border-border bg-accent/5">
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
                <CardDescription className="text-label text-muted-foreground flex items-center gap-2">
                  <User className="h-3 w-3" /> Player Profile
                </CardDescription>
              </div>
            </div>
            <ChevronDown className={cn("h-6 w-6 text-muted-foreground group-hover:text-primary transition-all duration-300", isStatsOpen && "transform rotate-180")} />
          </div>
        </CardHeader>

        {isStatsOpen && (
          <CardContent className="pt-8 space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2">
                <p className="text-label text-muted-foreground">Total Games</p>
                <p className="text-3xl font-numbers text-foreground">{player.total_games || 0}</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2">
                <p className="text-label text-muted-foreground">Total Profit/Loss</p>
                <p className={cn(
                  "text-3xl font-numbers",
                  isProfit ? "text-green-400" : "text-red-400"
                )}>
                  {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-accent/5 space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-label text-muted-foreground">Success Ratio</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-numbers text-primary">{winRate.toFixed(1)}%</p>
                  <div className="w-full h-1.5 bg-accent/10 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary/50" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-luxury text-foreground">Player Details</h3>
                  <p className="text-label text-muted-foreground mt-1">Contact and payment info</p>
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
                  <div className="p-5 rounded-xl border border-border bg-accent/2 space-y-3">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <Mail className="h-3 w-3" /> Communication
                    </div>
                    <p className="text-sm text-foreground font-medium truncate">{player.email || "Not Disclosed"}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-accent/2 space-y-3">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <CreditCard className="h-3 w-3" /> UPI ID
                    </div>
                    <p className="text-sm text-foreground font-medium truncate">{player.upi_id || "Not Linked"}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-accent/2 space-y-3">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <Layers className="h-3 w-3" /> Preference
                    </div>
                    <p className="text-sm text-foreground font-medium capitalize">{player.payment_preference ? (player.payment_preference === 'upi' ? 'Digital (UPI)' : 'Physical (Cash)') : "Unspecified"}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-border bg-accent/2 text-center">
                  <p className="text-label text-muted-foreground/30">No data associated with this player.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Game History Ledger */}
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
            <Table>
              <TableHeader className="bg-accent/5">
                <TableRow className="border-b-border hover:bg-transparent items-center">
                  <TableHead className="h-14 align-middle">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="h-full w-full justify-start text-label text-muted-foreground hover:text-foreground"
                    >
                      Session Date {getSortIcon("date")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14 align-middle">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("buy_ins")}
                      className="h-full w-full justify-start text-label text-muted-foreground hover:text-foreground"
                    >
                      Buy-ins {getSortIcon("buy_ins")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14 align-middle">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("net_amount")}
                      className="h-full w-full justify-start text-label text-muted-foreground hover:text-foreground"
                    >
                      Net P&L {getSortIcon("net_amount")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14 align-middle">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("final_stack")}
                      className="h-full w-full justify-start text-label text-muted-foreground hover:text-foreground"
                    >
                      Final Stack {getSortIcon("final_stack")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14 text-right pr-8">
                    <span className="text-label text-muted-foreground">Operation</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {sortedGameHistory.map((game) => {
                  const isWin = game.net_amount > 0;
                  return (
                    <TableRow key={game.id} className="h-20 border-border group hover:bg-accent/5 transition-colors">
                      <TableCell className="font-luxury text-sm text-foreground/80 pl-8">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(game.games.date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/5 border-border text-muted-foreground font-numbers px-3 py-1 text-sm">
                          {game.buy_ins} Stacks
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "px-4 py-1.5 font-numbers tracking-widest border-0 text-sm",
                            isWin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {isWin ? "+" : ""}Rs. {formatIndianNumber(game.net_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-numbers text-base text-foreground/60">
                        Rs. {formatIndianNumber(game.final_stack)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigateGame(game.game_id)}
                          className="text-label hover:bg-accent/10 text-primary px-4 h-9 rounded-full border border-primary/10"
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
