import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { formatIndianNumber } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import { Game, SeatPosition } from "@/types/poker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GamePlayer {
  id: string;
  player_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  players: {
    name: string;
  };
}

interface TablePosition {
  id: string;
  snapshot_timestamp: string;
  positions: SeatPosition[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

type SortField = "name" | "buy_ins" | "final_stack" | "net_amount";
type SortOrder = "asc" | "desc" | null;

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [tablePositions, setTablePositions] = useState<TablePosition[]>([]);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  const fetchGameData = async () => {
    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      
      const gameWithPlayers: Game = {
        ...gameData,
        game_players: []
      };
      setGame(gameWithPlayers);

      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select(`
          *,
          players (
            name
          )
        `)
        .eq("game_id", gameId)
        .order("players(name)", { ascending: true });

      if (playersError) throw playersError;
      setGamePlayers(playersData || []);

      // Fetch table positions
      const { data: positionsData, error: positionsError } = await supabase
        .from("table_positions")
        .select("*")
        .eq("game_id", gameId)
        .order("snapshot_timestamp", { ascending: true });

      if (positionsError) throw positionsError;
      
      const formattedPositions: TablePosition[] = (positionsData || []).map((tp) => ({
        id: tp.id,
        snapshot_timestamp: tp.snapshot_timestamp,
        positions: tp.positions as unknown as SeatPosition[],
      }));
      
      setTablePositions(formattedPositions);
    } catch (error) {
      console.error("Error fetching game:", error);
      toast.error("Failed to load game details");
    } finally {
      setLoading(false);
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

  const sortedGamePlayers = useMemo(() => {
    return [...gamePlayers].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "name":
          aVal = a.players.name.toLowerCase();
          bVal = b.players.name.toLowerCase();
          if (sortOrder === "asc") return aVal < bVal ? -1 : 1;
          return aVal > bVal ? -1 : 1;
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
  }, [gamePlayers, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Game not found</p>
        </CardContent>
      </Card>
    );
  }

  const currentTablePosition = tablePositions.length > 0 
    ? tablePositions[currentPositionIndex]
    : null;

  const playersWithSeats: SeatPosition[] = currentTablePosition
    ? currentTablePosition.positions
    : gamePlayers.map((gp, index) => ({
        seat: index + 1,
        player_id: gp.player_id,
        player_name: gp.players.name,
      }));

  const settlements: Settlement[] = (game as any)?.settlements || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/games")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Games History
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            Game Details - {format(new Date(game.date), "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Buy-in</p>
              <p className="text-lg font-semibold">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Players</p>
              <p className="text-lg font-semibold">{gamePlayers.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chips in play</p>
              <p className="text-lg font-semibold">
                Rs. {formatIndianNumber(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {game.is_complete ? "Completed" : "Active"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poker Table View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Table Positions</CardTitle>
          {tablePositions.length > 1 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {format(toZonedTime(new Date(currentTablePosition!.snapshot_timestamp), "Asia/Kolkata"), "HH:mm")} IST
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                  disabled={currentPositionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPositionIndex + 1} / {tablePositions.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPositionIndex(Math.min(tablePositions.length - 1, currentPositionIndex + 1))}
                  disabled={currentPositionIndex === tablePositions.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <PokerTableView 
            positions={playersWithSeats}
            totalSeats={playersWithSeats.length}
            enableDragDrop={false}
          />
        </CardContent>
      </Card>

      {/* Player Results */}
      <Card>
        <CardHeader>
          <CardTitle>Player Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
                <TableHead className="font-bold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Player
                    {getSortIcon("name")}
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
                    onClick={() => handleSort("final_stack")}
                    className="flex items-center gap-2 hover:text-primary font-bold"
                  >
                    Final Stack
                    {getSortIcon("final_stack")}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGamePlayers.map((gamePlayer, index) => {
                const isProfit = gamePlayer.net_amount >= 0;
                
                return (
                  <TableRow
                    key={gamePlayer.id}
                    className={index % 2 === 0 ? "bg-secondary/5" : ""}
                  >
                    <TableCell className="font-medium">{gamePlayer.players.name}</TableCell>
                    <TableCell>{gamePlayer.buy_ins}</TableCell>
                    <TableCell className="font-semibold">
                      Rs. {formatIndianNumber(gamePlayer.final_stack)}
                    </TableCell>
                    <TableCell className={`font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isProfit ? "+" : ""}Rs. {formatIndianNumber(gamePlayer.net_amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settlements */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-red-600 dark:text-red-400">{settlement.from}</span>
                    <span className="text-muted-foreground">pays</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{settlement.to}</span>
                  </div>
                  <span className="font-bold text-lg text-primary">
                    Rs. {formatIndianNumber(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GameDetail;
