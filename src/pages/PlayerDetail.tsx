import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/utils";
import { Player } from "@/types/poker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
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
      let aVal: any, bVal: any;
      
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Player not found</p>
        </CardContent>
      </Card>
    );
  }

  const avgPerGame = player.total_games > 0 
    ? (player.total_profit || 0) / player.total_games 
    : 0;
  const isProfit = (player.total_profit || 0) >= 0;
  const winRate = filteredGameHistory.length > 0
    ? (filteredGameHistory.filter(gh => gh.net_amount > 0).length / filteredGameHistory.length) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/players")}
        className="mb-4 hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Players History
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            {player.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total Games</p>
              <p className="text-lg font-semibold">{player.total_games || 0}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-lg font-semibold ${
                isProfit 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Avg Per Game</p>
              <p className={`text-lg font-semibold ${
                avgPerGame >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {avgPerGame >= 0 ? "+" : ""}Rs. {formatIndianNumber(Math.abs(Math.round(avgPerGame)))}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {winRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game History */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-primary">Game History</CardTitle>
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="bg-background border-primary/20 w-full md:w-64">
                <SelectValue placeholder="Filter by month-year" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonthYears.map((monthYear) => (
                  <SelectItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                <TableHead className="font-bold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("date")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Date
                    {getSortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("buy_ins")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Buy-ins
                    {getSortIcon("buy_ins")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("net_amount")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Net P&L
                    {getSortIcon("net_amount")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_stack")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Final Stack
                    {getSortIcon("final_stack")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGameHistory.map((game, index) => {
                const isWin = game.net_amount > 0;
                
                return (
                  <TableRow
                    key={game.id}
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-secondary/5 hover:bg-secondary/20" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <TableCell className="font-medium text-primary">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(game.games.date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                        {game.buy_ins}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        isWin 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {isWin ? "+" : ""}Rs. {formatIndianNumber(game.net_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-accent-foreground">
                      Rs. {formatIndianNumber(game.final_stack)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/games/${game.game_id}`)}
                        className="hover:text-primary"
                      >
                        View Game
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerDetail;
