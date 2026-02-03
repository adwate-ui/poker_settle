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
import { useSharedLink } from "@/hooks/useSharedLink";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { PlayerFormDialog, PlayerFormData } from "@/components/PlayerFormDialog";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import { Badge } from "@/components/ui/badge";

interface GameHistory {
  id: string;
  game_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  games: {
    date: string;
    buy_in_amount: number;
  };
}

type SortField = "date" | "buy_ins" | "final_stack" | "net_amount";
type SortOrder = "asc" | "desc" | null;

const PlayerDetail = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { copyShareLink, loading: linkLoading } = useSharedLink();
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isGameHistoryOpen, setIsGameHistoryOpen] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { updatePlayer, loading: updateLoading } = usePlayerManagement();

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      const { data: historyData, error: historyError } = await supabase
        .from("game_players")
        .select(`
          *,
          games (
            date,
            buy_in_amount
          )
        `)
        .eq("player_id", playerId)
        .order("games(date)", { ascending: false });

      if (historyError) throw historyError;
      setGameHistory(historyData || []);
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast.error("Failed to load player details");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId, fetchPlayerData]);

  const handleUpdatePlayer = async (playerData: Partial<PlayerFormData>) => {
    if (!playerId) return;

    try {
      const updatedPlayer = await updatePlayer(playerId, playerData);
      setPlayer(updatedPlayer);
      toast.success("Player details updated successfully");
    } catch (error) {
      throw error;
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
        <p className="text-gold-200/60 font-luxury tracking-widest uppercase text-sm animate-pulse">Analyzing Participant Portfolio...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-4xl mx-auto border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-10 text-center">
        <p className="text-gold-900/60 dark:text-gold-200/60 font-luxury tracking-widest uppercase">Participant record not located.</p>
      </Card>
    );
  }

  const isProfit = (player.total_profit || 0) >= 0;
  const winRate = filteredGameHistory.length > 0
    ? (filteredGameHistory.filter(gh => gh.net_amount > 0).length / filteredGameHistory.length) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/players")}
        className="mb-4 hover:bg-gold-500/10 text-gold-500 hover:text-gold-400 font-luxury uppercase tracking-widest text-xs"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matrix
      </Button>

      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-6 border-b border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/2">
          <div
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <OptimizedAvatar name={player.name} size="lg" className="border-gold-500/30 group-hover:border-gold-500 transition-colors" />
                <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(212,184,60,0.2)] animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-3xl font-luxury text-gold-900 dark:text-gold-100">{player.name}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-[.3em] text-gold-600 dark:text-gold-500/50 font-luxury flex items-center gap-2">
                  <User className="h-3 w-3" /> Participant Profile
                </CardDescription>
              </div>
            </div>
            <ChevronDown className={cn("h-6 w-6 text-gold-500/40 group-hover:text-gold-500 transition-all duration-300", isStatsOpen && "transform rotate-180")} />
          </div>
        </CardHeader>

        {isStatsOpen && (
          <CardContent className="pt-8 space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2">
                <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">Total Sessions</p>
                <p className="text-3xl font-numbers text-luxury-primary">{player.total_games || 0}</p>
              </div>
              <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2">
                <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">Legacy P&L</p>
                <p className={cn(
                  "text-3xl font-numbers",
                  isProfit ? "text-green-400" : "text-red-400"
                )}>
                  {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                </p>
              </div>
              <div className="p-6 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-2 sm:col-span-2 lg:col-span-1">
                <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">Success Ratio</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-numbers text-gold-500">{winRate.toFixed(1)}%</p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gold-500/50" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-black/10 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-luxury text-luxury-primary">Settlement Profiles</h3>
                  <p className="text-xs uppercase tracking-widest text-gold-900/40 dark:text-gold-500/40 font-luxury mt-1">Contact and payment orchestration</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyShareLink('player', playerId!)}
                    disabled={linkLoading}
                    className="h-10 px-5 hover:bg-gold-500/10 text-gold-500 font-luxury uppercase tracking-widest text-xs rounded-full border border-gold-500/20"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="h-10 px-5 bg-black/5 dark:bg-white/5 border-gold-900/10 dark:border-white/10 hover:bg-gold-500/10 text-gold-900 dark:text-gold-200 font-luxury uppercase tracking-widest text-xs rounded-full"
                  >
                    <Edit className="h-4 w-4 mr-2 text-gold-600 dark:text-gold-500" />
                    Amend
                  </Button>
                </div>
              </div>

              {(player.email || player.upi_id || player.payment_preference) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/2 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">
                      <Mail className="h-3 w-3" /> Communication
                    </div>
                    <p className="text-sm text-gold-900 dark:text-gold-100 font-medium truncate">{player.email || "Not Disclosed"}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/2 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">
                      <CreditCard className="h-3 w-3" /> Financial ID
                    </div>
                    <p className="text-sm text-gold-900 dark:text-gold-100 font-medium truncate">{player.upi_id || "Not Linked"}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-gold-900/10 dark:border-white/5 bg-black/5 dark:bg-white/2 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-900/60 dark:text-gold-500/60">
                      <Layers className="h-3 w-3" /> Preference
                    </div>
                    <p className="text-sm text-gold-900 dark:text-gold-100 font-medium capitalize">{player.payment_preference ? (player.payment_preference === 'upi' ? 'Digital (UPI)' : 'Physical (Cash)') : "Unspecified"}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-gold-900/10 dark:border-white/10 bg-black/5 dark:bg-white/2 text-center">
                  <p className="text-sm font-luxury text-gold-900/30 dark:text-white/30 tracking-widest uppercase">No metadata associated with this participant.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Game History Ledger */}
      <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
                <History className="h-5 w-5 text-gold-500" />
              </div>
              <CardTitle className="text-2xl font-luxury text-luxury-primary">Audit Trail</CardTitle>
            </div>
            <div className="min-w-[200px]">
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="h-10 bg-black/5 dark:bg-white/5 border-0 border-b border-gold-900/10 dark:border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[10px] uppercase text-gold-900 dark:text-white">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-gold-600 dark:text-gold-500/40" />
                  <SelectValue placeholder="Period Filter" />
                </SelectTrigger>
                <SelectContent className="bg-[#f9f4df]/95 dark:bg-[#0a0a0a]/95 border-gold-900/10 dark:border-gold-500/20 backdrop-blur-xl">
                  <SelectItem value="all" className="font-luxury uppercase text-[10px] tracking-widest text-gold-900 dark:text-gold-100/60">Full Archive</SelectItem>
                  {uniqueMonthYears.map((monthYear) => (
                    <SelectItem key={monthYear} value={monthYear} className="font-luxury uppercase text-[10px] tracking-widest text-gold-900 dark:text-gold-100/60">
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
              <TableHeader className="bg-black/5 dark:bg-white/5">
                <TableRow className="border-b-gold-900/10 dark:border-b-white/10 hover:bg-transparent">
                  <TableHead className="h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="h-full w-full justify-start font-luxury uppercase tracking-widest text-[10px] text-gold-900/60 dark:text-gold-500/60 hover:text-gold-900 dark:hover:text-gold-200"
                    >
                      Session Date {getSortIcon("date")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("buy_ins")}
                      className="h-full w-full justify-start font-luxury uppercase tracking-widest text-[10px] text-gold-900/60 dark:text-gold-500/60 hover:text-gold-900 dark:hover:text-gold-200"
                    >
                      Buy-ins {getSortIcon("buy_ins")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("net_amount")}
                      className="h-full w-full justify-start font-luxury uppercase tracking-widest text-[10px] text-gold-900/60 dark:text-gold-500/60 hover:text-gold-900 dark:hover:text-gold-200"
                    >
                      Net Outcome {getSortIcon("net_amount")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("final_stack")}
                      className="h-full w-full justify-start font-luxury uppercase tracking-widest text-[10px] text-gold-900/60 dark:text-gold-500/60 hover:text-gold-900 dark:hover:text-gold-200"
                    >
                      Terminal Stack {getSortIcon("final_stack")}
                    </Button>
                  </TableHead>
                  <TableHead className="h-14 text-right pr-8">
                    <span className="font-luxury uppercase tracking-widest text-[10px] text-gold-900/60 dark:text-gold-500/60">Operation</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-black/10 dark:divide-white/5">
                {sortedGameHistory.map((game) => {
                  const isWin = game.net_amount > 0;
                  return (
                    <TableRow key={game.id} className="h-20 border-black/10 dark:border-white/5 group hover:bg-gold-500/5 transition-colors">
                      <TableCell className="font-luxury text-sm text-gold-900/80 dark:text-gold-100/80 pl-8">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-3.5 w-3.5 text-gold-600 dark:text-gold-500/40" />
                          {format(new Date(game.games.date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-black/5 dark:bg-white/5 border-gold-900/10 dark:border-white/10 text-gold-900/60 dark:text-gold-200/60 font-numbers px-3 py-1 text-sm">
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
                      <TableCell className="font-numbers text-base text-gold-900/60 dark:text-gold-100/60">
                        Rs. {formatIndianNumber(game.final_stack)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/games/${game.game_id}`)}
                          className="font-luxury uppercase tracking-widest text-[10px] hover:bg-gold-500/10 text-gold-600 dark:text-gold-500 px-4 h-9 rounded-full border border-gold-500/10"
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

      <PlayerFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdatePlayer}
        initialData={player || undefined}
        title="Amend Participant Metadata"
        description="Edit the communication and financial parameters for this participant."
      />
    </div>
  );
};

export default PlayerDetail;
