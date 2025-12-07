import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Share2, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { formatIndianNumber } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import { SeatPosition, BuyInHistory } from "@/types/poker";
import { ConsolidatedBuyInLogs } from "@/components/ConsolidatedBuyInLogs";
import { BuyInHistoryDialog } from "@/components/BuyInHistoryDialog";
import { useSharedLink } from "@/hooks/useSharedLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupabaseClient } from "@supabase/supabase-js";

interface GamePlayer {
  id: string;
  player_id: string;
  buy_ins: number;
  final_stack: number | null;
  net_amount: number | null;
  players: {
    name: string | null;
  } | null;
}

interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
  settlements: any;
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

interface SettlementWithType extends Settlement {
  isManual: boolean;
}

type SortField = "name" | "buy_ins" | "final_stack" | "net_amount";
type SortOrder = "asc" | "desc" | null;

interface GameDetailViewProps {
  gameId: string;
  client: SupabaseClient;
  token?: string;
  showOwnerControls?: boolean;
  onBack?: () => void;
  backLabel?: string;
  fetchBuyInHistory?: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

export const GameDetailView = ({
  gameId,
  client,
  token,
  showOwnerControls = false,
  onBack,
  backLabel = "Back",
  fetchBuyInHistory,
}: GameDetailViewProps) => {
  const { copyShareLink, loading: linkLoading } = useSharedLink();
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
      const [gameResult, playersResult, positionsResult] = await Promise.all([
        client.from("games").select("*").eq("id", gameId).maybeSingle(),
        client
          .from("game_players")
          .select(`
            *,
            players (
              name
            )
          `)
          .eq("game_id", gameId)
          .order("players(name)", { ascending: true }),
        client
          .from("table_positions")
          .select("*")
          .eq("game_id", gameId)
          .order("snapshot_timestamp", { ascending: true }),
      ]);

      const { data: gameData, error: gameError } = gameResult;

      if (gameError) {
        console.error("Error fetching game:", gameError);
        throw gameError;
      }

      if (!gameData) {
        console.error("Game not found or no access");
        setGame(null);
        setLoading(false);
        return;
      }

      const { data: playersData, error: playersError } = playersResult;
      const { data: positionsData, error: positionsError } = positionsResult;

      if (playersError) {
        console.error("Error fetching game players:", playersError);
      }

      if (positionsError) {
        console.error("Error fetching table positions:", positionsError);
      }

      setGame(gameData);
      setGamePlayers(playersData || []);

      const formattedPositions: TablePosition[] = (positionsData || []).map((tp) => ({
        id: tp.id,
        snapshot_timestamp: tp.snapshot_timestamp,
        positions: tp.positions as unknown as SeatPosition[],
      }));

      setTablePositions(formattedPositions);
    } catch (error) {
      console.error("Error fetching game details:", error);
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
        case "name": {
          const aName = (a.players?.name ?? "").toLowerCase();
          const bName = (b.players?.name ?? "").toLowerCase();
          if (sortOrder === "asc") return aName < bName ? -1 : 1;
          return aName > bName ? -1 : 1;
        }
        case "buy_ins":
          aVal = a.buy_ins;
          bVal = b.buy_ins;
          break;
        case "final_stack":
          aVal = a.final_stack ?? 0;
          bVal = b.final_stack ?? 0;
          break;
        case "net_amount":
          aVal = a.net_amount ?? 0;
          bVal = b.net_amount ?? 0;
          break;
      }
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [gamePlayers, sortField, sortOrder]);

  const calculateSettlements = useCallback((): Settlement[] => {
    const winners = sortedGamePlayers.filter(gp => (gp.net_amount ?? 0) > 0);
    const losers = sortedGamePlayers.filter(gp => (gp.net_amount ?? 0) < 0);
    
    const calculatedSettlements: Settlement[] = [];
    
    const winnersQueue = winners.map(w => ({ name: w.players?.name ?? "", amount: w.net_amount ?? 0 }));
    const losersQueue = losers.map(l => ({ name: l.players?.name ?? "", amount: Math.abs(l.net_amount ?? 0) }));
    
    let winnerIndex = 0;
    let loserIndex = 0;
    
    while (winnerIndex < winnersQueue.length && loserIndex < losersQueue.length) {
      const winner = winnersQueue[winnerIndex];
      const loser = losersQueue[loserIndex];
      
      const settlementAmount = Math.min(winner.amount, loser.amount);
      
      if (settlementAmount > 0) {
        calculatedSettlements.push({
          from: loser.name,
          to: winner.name,
          amount: Math.round(settlementAmount)
        });
      }
      
      winner.amount -= settlementAmount;
      loser.amount -= settlementAmount;
      
      if (winner.amount === 0) winnerIndex++;
      if (loser.amount === 0) loserIndex++;
    }
    
    return calculatedSettlements;
  }, [sortedGamePlayers]);

  const savedSettlements: Settlement[] = game?.settlements || [];
  const allCalculatedSettlements = useMemo(() => calculateSettlements(), [calculateSettlements]);
  
  const getSettlementsWithType = useCallback((): SettlementWithType[] => {
    if (savedSettlements.length === 0) {
      return allCalculatedSettlements.map(s => ({ ...s, isManual: false }));
    }
    
    const manualSettlements: SettlementWithType[] = [];
    const calculatedSettlements: SettlementWithType[] = [];
    
    savedSettlements.forEach(settlement => {
      if (savedSettlements.indexOf(settlement) < savedSettlements.length - allCalculatedSettlements.length && savedSettlements.length > allCalculatedSettlements.length) {
        manualSettlements.push({ ...settlement, isManual: true });
      } else {
        calculatedSettlements.push({ ...settlement, isManual: false });
      }
    });
    
    if (manualSettlements.length === 0 && calculatedSettlements.length === savedSettlements.length && savedSettlements.length > allCalculatedSettlements.length) {
      const numManual = savedSettlements.length - allCalculatedSettlements.length;
      return savedSettlements.map((s, i) => ({ ...s, isManual: i < numManual }));
    }
    
    return [...manualSettlements, ...calculatedSettlements];
  }, [savedSettlements, allCalculatedSettlements]);

  const settlementsWithType = useMemo(() => getSettlementsWithType(), [getSettlementsWithType]);

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
        player_name: gp.players?.name ?? `Player ${index + 1}`,
      }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Game Details - {format(new Date(game.date), "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Buy-in</p>
              <p className="text-lg font-semibold">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Players</p>
              <p className="text-lg font-semibold">{gamePlayers.length}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Chips in play</p>
              <p className="text-lg font-semibold">
                Rs. {formatIndianNumber(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div className="p-4 rounded-lg border flex flex-col items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyShareLink('game', gameId)}
                disabled={linkLoading}
                className="w-full hover:bg-primary/10 hover:text-primary border-primary/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <ConsolidatedBuyInLogs gameId={gameId} token={token} />
      </div>

      {/* Poker Table View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-primary">Table Positions</CardTitle>
          {tablePositions.length > 1 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-accent-foreground px-3 py-1 rounded-full bg-accent/20">
                {format(toZonedTime(new Date(currentTablePosition!.snapshot_timestamp), "Asia/Kolkata"), "HH:mm")} IST
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                  disabled={currentPositionIndex === 0}
                  className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentPositionIndex + 1} / {tablePositions.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPositionIndex(Math.min(tablePositions.length - 1, currentPositionIndex + 1))}
                  disabled={currentPositionIndex === tablePositions.length - 1}
                  className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
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
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
          <CardTitle className="text-primary">Player Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                <TableHead className="font-bold text-left">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-primary font-bold justify-start"
                  >
                    Player
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("buy_ins")}
                    className="flex items-center gap-2 hover:text-primary font-bold justify-start"
                  >
                    Buy-ins
                    {getSortIcon("buy_ins")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("net_amount")}
                    className="flex items-center gap-2 hover:text-primary font-bold justify-start"
                  >
                    Net P&L
                    {getSortIcon("net_amount")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_stack")}
                    className="flex items-center gap-2 hover:text-primary font-bold justify-start"
                  >
                    Final Stack
                    {getSortIcon("final_stack")}
                  </Button>
                </TableHead>
                {showOwnerControls && fetchBuyInHistory && (
                  <TableHead className="font-bold text-left">
                    Buy-in Log
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGamePlayers.map((gamePlayer, index) => {
                const playerName = gamePlayer.players?.name ?? `Player ${index + 1}`;
                const netAmount = gamePlayer.net_amount ?? 0;
                const finalStack = gamePlayer.final_stack ?? 0;
                const isProfit = netAmount >= 0;
                
                return (
                  <TableRow
                    key={gamePlayer.id}
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-secondary/5 hover:bg-secondary/20" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <TableCell className="font-medium text-primary text-left">{playerName}</TableCell>
                    <TableCell className="text-left">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                        {gamePlayer.buy_ins}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        isProfit 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {isProfit ? "+" : ""}Rs. {formatIndianNumber(netAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-accent-foreground text-left">
                      Rs. {formatIndianNumber(finalStack)}
                    </TableCell>
                    {showOwnerControls && fetchBuyInHistory && (
                      <TableCell className="text-left">
                        <BuyInHistoryDialog
                          gamePlayerId={gamePlayer.id}
                          playerName={playerName}
                          fetchHistory={fetchBuyInHistory}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settlements */}
      {settlementsWithType.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Settlements
            </CardTitle>
            {showOwnerControls && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const newSettlements = calculateSettlements();
                  const { error } = await client
                    .from("games")
                    .update({ settlements: newSettlements })
                    .eq("id", gameId);
                  if (error) {
                    toast.error("Failed to recalculate settlements");
                  } else {
                    setGame(prev => prev ? { ...prev, settlements: newSettlements } : null);
                    toast.success("Settlements recalculated");
                  }
                }}
                className="border-primary/20 hover:bg-primary/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Redo Settlements
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                  <TableHead className="font-bold text-left">From</TableHead>
                  <TableHead className="font-bold text-left">To</TableHead>
                  <TableHead className="font-bold text-left">Amount</TableHead>
                  <TableHead className="font-bold text-left">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementsWithType.map((settlement, index) => (
                  <TableRow
                    key={`settlement-${index}`}
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-secondary/5 hover:bg-secondary/20" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <TableCell className="font-medium text-primary text-left">
                      {settlement.from}
                    </TableCell>
                    <TableCell className="font-medium text-primary text-left">
                      {settlement.to}
                    </TableCell>
                    <TableCell className="font-semibold text-accent-foreground text-left">
                      Rs. {formatIndianNumber(settlement.amount)}
                    </TableCell>
                    <TableCell className="text-left">
                      {settlement.isManual ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Manual
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Calculated
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
