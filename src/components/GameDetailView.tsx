import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Share2, ArrowLeft, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  settlements: Settlement[];
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
  
  // Collapsible sections state
  const [buyInLogsOpen, setBuyInLogsOpen] = useState(true);
  const [tablePositionsOpen, setTablePositionsOpen] = useState(true);
  const [playerResultsOpen, setPlayerResultsOpen] = useState(true);
  const [settlementsOpen, setSettlementsOpen] = useState(true);
  
  // Manual transfer state
  const [manualTransfers, setManualTransfers] = useState<Settlement[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [newTransferFrom, setNewTransferFrom] = useState("");
  const [newTransferTo, setNewTransferTo] = useState("");
  const [newTransferAmount, setNewTransferAmount] = useState("");

  const fetchGameData = useCallback(async () => {
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
  }, [gameId, client]);

  useEffect(() => {
    if (gameId) {
      fetchGameData();
    }
  }, [gameId, fetchGameData]);

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
      let aVal: number, bVal: number;
      
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
        default:
          return 0;
      }
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [gamePlayers, sortField, sortOrder]);

  // Calculate settlements with manual transfers taken into account
  const calculateSettlements = useCallback((transfers: Settlement[] = []): Settlement[] => {
    // Build adjusted net amounts based on manual transfers
    // net_amount > 0 means player won (is owed money)
    // net_amount < 0 means player lost (owes money)
    const adjustedAmounts: Record<string, number> = {};
    
    sortedGamePlayers.forEach(gp => {
      const name = gp.players?.name ?? "";
      adjustedAmounts[name] = gp.net_amount ?? 0;
    });
    
    // Apply manual transfers: "from" pays "to"
    // If "from" already paid "to", then:
    // - "from" has already settled part of their debt, so add to their balance (less negative or more positive)
    // - "to" has already received payment, so subtract from their balance (less positive or more negative)
    transfers.forEach(transfer => {
      if (adjustedAmounts[transfer.from] !== undefined) {
        adjustedAmounts[transfer.from] += transfer.amount; // from paid, so their balance improves
      }
      if (adjustedAmounts[transfer.to] !== undefined) {
        adjustedAmounts[transfer.to] -= transfer.amount; // to received, so their balance decreases
      }
    });
    
    const winners = Object.entries(adjustedAmounts)
      .filter(([_, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount }));
    const losers = Object.entries(adjustedAmounts)
      .filter(([_, amount]) => amount < 0)
      .map(([name, amount]) => ({ name, amount: Math.abs(amount) }));
    
    const calculatedSettlements: Settlement[] = [];
    
    let winnerIndex = 0;
    let loserIndex = 0;
    
    while (winnerIndex < winners.length && loserIndex < losers.length) {
      const winner = winners[winnerIndex];
      const loser = losers[loserIndex];
      
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
      
      if (winner.amount <= 0) winnerIndex++;
      if (loser.amount <= 0) loserIndex++;
    }
    
    return calculatedSettlements;
  }, [sortedGamePlayers]);
  
  const addManualTransfer = () => {
    if (!newTransferFrom || !newTransferTo || !newTransferAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (newTransferFrom === newTransferTo) {
      toast.error("From and To must be different players");
      return;
    }
    const amount = parseFloat(newTransferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    
    setManualTransfers(prev => [...prev, { from: newTransferFrom, to: newTransferTo, amount }]);
    setNewTransferFrom("");
    setNewTransferTo("");
    setNewTransferAmount("");
    setTransferDialogOpen(false);
    toast.success("Manual transfer added");
  };
  
  const removeManualTransfer = (index: number) => {
    setManualTransfers(prev => prev.filter((_, i) => i !== index));
    toast.success("Transfer removed");
  };
  
  const recalculateAndSaveSettlements = async () => {
    const newSettlements = calculateSettlements(manualTransfers);
    const allSettlements = [...manualTransfers.map(t => ({ ...t, isManual: true })), ...newSettlements];
    
    const { error } = await client
      .from("games")
      .update({ settlements: allSettlements })
      .eq("id", gameId);
      
    if (error) {
      toast.error("Failed to save settlements");
    } else {
      setGame(prev => prev ? { ...prev, settlements: allSettlements } : null);
      setManualTransfers([]);
      toast.success("Settlements recalculated and saved");
    }
  };

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

      {/* Buy-in Logs */}
      <Collapsible open={buyInLogsOpen} onOpenChange={setBuyInLogsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <CardTitle className="text-primary flex items-center justify-between text-lg">
                <span>Buy-in Logs</span>
                {buyInLogsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ConsolidatedBuyInLogs gameId={gameId} token={token} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Poker Table View */}
      <Collapsible open={tablePositionsOpen} onOpenChange={setTablePositionsOpen}>
        <Card>
          <CardHeader className="py-3">
            <div className="flex flex-row items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <CardTitle className="text-primary text-lg">Table Positions</CardTitle>
                  {tablePositionsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </CollapsibleTrigger>
              {tablePositions.length > 1 && tablePositionsOpen && (
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
                      className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 h-8 w-8"
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
                      className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
          <PokerTableView 
            positions={playersWithSeats}
            totalSeats={playersWithSeats.length}
            enableDragDrop={false}
          />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Player Results */}
      <Collapsible open={playerResultsOpen} onOpenChange={setPlayerResultsOpen}>
        <Card className="border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 py-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15 transition-colors">
              <CardTitle className="text-primary text-lg flex items-center justify-between">
                <span>Player Results</span>
                {playerResultsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                <TableHead className="font-bold text-left h-10 py-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm"
                  >
                    Player
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left h-10 py-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("buy_ins")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm"
                  >
                    Buy-ins
                    {getSortIcon("buy_ins")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left h-10 py-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("net_amount")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm"
                  >
                    Net P&L
                    {getSortIcon("net_amount")}
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-left h-10 py-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_stack")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm"
                  >
                    Final Stack
                    {getSortIcon("final_stack")}
                  </Button>
                </TableHead>
                {showOwnerControls && fetchBuyInHistory && (
                  <TableHead className="font-bold text-left h-10 py-2 text-sm">
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
                    <TableCell className="font-medium text-primary text-left py-2 text-sm">{playerName}</TableCell>
                    <TableCell className="text-left py-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs">
                        {gamePlayer.buy_ins}
                      </span>
                    </TableCell>
                    <TableCell className="text-left py-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        isProfit 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {isProfit ? "+" : ""}Rs. {formatIndianNumber(netAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-accent-foreground text-left py-2 text-sm">
                      Rs. {formatIndianNumber(finalStack)}
                    </TableCell>
                    {showOwnerControls && fetchBuyInHistory && (
                      <TableCell className="text-left py-2">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Settlements */}
      <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
        <Card className="border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 py-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-primary flex items-center gap-2 text-lg">
                  <span className="text-2xl">💰</span>
                  Settlements
                  {settlementsOpen ? <ChevronUp className="h-5 w-5 ml-auto sm:ml-2" /> : <ChevronDown className="h-5 w-5 ml-auto sm:ml-2" />}
                </CardTitle>
                {showOwnerControls && settlementsOpen && (
                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
                          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Add</span> Transfer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Manual Transfer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>From (Payer)</Label>
                        <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {gamePlayers.map(gp => (
                              <SelectItem key={gp.id} value={gp.players?.name ?? ""}>
                                {gp.players?.name ?? "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>To (Receiver)</Label>
                        <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {gamePlayers.map(gp => (
                              <SelectItem key={gp.id} value={gp.players?.name ?? ""}>
                                {gp.players?.name ?? "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={newTransferAmount}
                          onChange={(e) => setNewTransferAmount(e.target.value)}
                        />
                      </div>
                      <Button onClick={addManualTransfer} className="w-full">
                        Add Transfer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={recalculateAndSaveSettlements}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
                  Redo
                </Button>
              </div>
            )}
          </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
          {/* Pending manual transfers */}
          {showOwnerControls && manualTransfers.length > 0 && (
            <div className="p-3 sm:p-4 border-b bg-blue-50/50 dark:bg-blue-900/10">
              <p className="text-xs sm:text-sm font-medium mb-2 text-blue-700 dark:text-blue-400">
                Pending Manual Transfers (click Redo to apply):
              </p>
              <div className="space-y-2">
                {manualTransfers.map((transfer, index) => (
                  <div key={index} className="flex items-center justify-between bg-background rounded-md px-2 sm:px-3 py-2 border gap-2">
                    <span className="text-xs sm:text-sm truncate">
                      {transfer.from} → {transfer.to}: Rs. {formatIndianNumber(transfer.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeManualTransfer(index)}
                      className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {settlementsWithType.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                    <TableHead className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">From</TableHead>
                    <TableHead className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">To</TableHead>
                    <TableHead className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
                    <TableHead className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">Type</TableHead>
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
                      <TableCell className="font-medium text-primary text-left text-xs sm:text-sm py-2 sm:py-4">
                        {settlement.from}
                      </TableCell>
                      <TableCell className="font-medium text-primary text-left text-xs sm:text-sm py-2 sm:py-4">
                        {settlement.to}
                      </TableCell>
                      <TableCell className="font-semibold text-accent-foreground text-left text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">
                        Rs. {formatIndianNumber(settlement.amount)}
                      </TableCell>
                      <TableCell className="text-left py-2 sm:py-4">
                        {settlement.isManual ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                            Manual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                            Calculated
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No settlements needed - all players are even.
            </div>
          )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
