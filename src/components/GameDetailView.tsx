import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Badge, Button, Collapse, Table, Modal, Select, TextInput, ActionIcon, Stack, Group, Text, Loader } from "@mantine/core";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Share2, ArrowLeft, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { toast } from "@/lib/notifications";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { formatIndianNumber } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import { SeatPosition, BuyInHistory } from "@/types/poker";
import { ConsolidatedBuyInLogs } from "@/components/ConsolidatedBuyInLogs";
import { BuyInHistoryDialog } from "@/components/BuyInHistoryDialog";
import { useSharedLink } from "@/hooks/useSharedLink";
import { calculateOptimizedSettlements, PlayerBalance } from "@/utils/settlementCalculator";
import { getPaymentMethodIcon } from "@/utils/playerUtils";
import { useSettlementConfirmations } from "@/hooks/useSettlementConfirmations";
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
  const { fetchConfirmations, confirmSettlement, unconfirmSettlement, getConfirmationStatus } = useSettlementConfirmations();
  const [game, setGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [tablePositions, setTablePositions] = useState<TablePosition[]>([]);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [confirmations, setConfirmations] = useState<import('@/types/poker').SettlementConfirmation[]>([]);
  
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
              name,
              payment_preference,
              upi_id
            )
          `)
          .eq("game_id", gameId),
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

      const { data: playersData, error: playersError} = playersResult;
      const { data: positionsData, error: positionsError } = positionsResult;

      if (playersError) {
        console.error("Error fetching game players:", playersError);
      }

      if (positionsError) {
        console.error("Error fetching table positions:", positionsError);
      }

      setGame(gameData);
      // Sort players by name after fetching
      const sortedPlayers = (playersData || []).sort((a, b) => {
        const nameA = (a.players?.name ?? '').toLowerCase();
        const nameB = (b.players?.name ?? '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setGamePlayers(sortedPlayers);

      const formattedPositions: TablePosition[] = (positionsData || []).map((tp) => ({
        id: tp.id,
        snapshot_timestamp: tp.snapshot_timestamp,
        positions: tp.positions as unknown as SeatPosition[],
      }));

      setTablePositions(formattedPositions);

      // Fetch settlement confirmations
      const confirmationsData = await fetchConfirmations(gameId);
      setConfirmations(confirmationsData);
    } catch (error) {
      console.error("Error fetching game details:", error);
    } finally {
      setLoading(false);
    }
  }, [gameId, client, fetchConfirmations]);

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
  // Uses optimized algorithm that prioritizes cash players
  const calculateSettlements = useCallback((transfers: Settlement[] = []): Settlement[] => {
    // Build player balances with payment preferences
    const playerBalances: PlayerBalance[] = sortedGamePlayers.map(gp => ({
      name: gp.players?.name ?? "",
      amount: gp.net_amount ?? 0,
      paymentPreference: (gp.players as any)?.payment_preference || 'upi',
    }));

    // Use optimized settlement calculation
    const settlements = calculateOptimizedSettlements(playerBalances, transfers);
    
    // Return settlements without the involvesCashPlayer flag for backward compatibility
    return settlements.map(({ from, to, amount }) => ({ from, to, amount }));
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
        <Loader size="lg" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder className="max-w-4xl mx-auto">
        <Text c="dimmed" ta="center">Game not found</Text>
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

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <Text size="xl" fw={700} className="sm:text-2xl">
              Game Details - {format(new Date(game.date), "MMMM d, yyyy")}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyShareLink('game', gameId)}
              disabled={linkLoading}
              className="hover:bg-primary/10 hover:text-primary border-primary/20 w-full sm:w-auto"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Game
            </Button>
          </Group>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="space-y-0.5 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
              <p className="text-xs text-muted-foreground font-medium">Buy-in</p>
              <p className="text-sm sm:text-base font-bold text-primary">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
            </div>
            <div className="space-y-0.5 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
              <p className="text-xs text-muted-foreground font-medium">Players</p>
              <p className="text-sm sm:text-base font-bold text-primary">{gamePlayers.length}</p>
            </div>
            <div className="space-y-0.5 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
              <p className="text-xs text-muted-foreground font-medium">Chips in play</p>
              <p className="text-sm sm:text-base font-bold text-primary">
                Rs. {formatIndianNumber(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div className="space-y-0.5 p-3 rounded-lg bg-green-500/10 border-2 border-green-500/30">
              <p className="text-xs text-muted-foreground font-medium">Total P&L</p>
              <p className="text-sm sm:text-base font-bold text-green-500">
                +Rs. {formatIndianNumber(gamePlayers.filter(gp => (gp.net_amount ?? 0) > 0).reduce((sum, gp) => sum + (gp.net_amount ?? 0), 0))}
              </p>
            </div>
          </div>
        </Stack>
      </Card>

      {/* Buy-in Logs */}
      <Card shadow="sm" padding="md" radius="md" withBorder className="border-primary/20">
        <div 
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 -mx-4 -mt-4 px-4 pt-4 pb-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15 transition-colors"
          onClick={() => setBuyInLogsOpen(!buyInLogsOpen)}
        >
          <Group justify="space-between">
            <Text className="text-primary" size="lg" fw={600}>Buy-in Logs</Text>
            {buyInLogsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Group>
        </div>
        <Collapse in={buyInLogsOpen}>
          <div>
            <ConsolidatedBuyInLogs gameId={gameId} token={token} />
          </div>
        </Collapse>
      </Card>

      {/* Poker Table View */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <button 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setTablePositionsOpen(!tablePositionsOpen)}
            >
              <Text className="text-primary" size="lg" fw={600}>Table Positions</Text>
              {tablePositionsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {tablePositions.length > 1 && tablePositionsOpen && (
              <Group gap="md">
                <span className="text-sm font-semibold text-accent-foreground px-3 py-1 rounded-full bg-accent/20">
                  {format(toZonedTime(new Date(currentTablePosition!.snapshot_timestamp), "Asia/Kolkata"), "HH:mm")} IST
                </span>
                <Group gap="xs">
                  <ActionIcon
                    variant="outline"
                    onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                    disabled={currentPositionIndex === 0}
                    className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </ActionIcon>
                  <Text size="sm" c="dimmed" fw={500}>
                    {currentPositionIndex + 1} / {tablePositions.length}
                  </Text>
                  <ActionIcon
                    variant="outline"
                    onClick={() => setCurrentPositionIndex(Math.min(tablePositions.length - 1, currentPositionIndex + 1))}
                    disabled={currentPositionIndex === tablePositions.length - 1}
                    className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </ActionIcon>
                </Group>
              </Group>
            )}
          </Group>
          <Collapse in={tablePositionsOpen}>
            <PokerTableView 
              positions={playersWithSeats}
              totalSeats={playersWithSeats.length}
              enableDragDrop={false}
            />
          </Collapse>
        </Stack>
      </Card>

      {/* Player Results */}
      <Card shadow="sm" padding="md" radius="md" withBorder className="border-primary/20">
        <div 
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 -mx-4 -mt-4 px-4 pt-4 pb-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15 transition-colors"
          onClick={() => setPlayerResultsOpen(!playerResultsOpen)}
        >
          <Group justify="space-between">
            <Text className="text-primary" size="lg" fw={600}>Player Results</Text>
            {playerResultsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Group>
        </div>
        <Collapse in={playerResultsOpen}>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                <Table.Th className="font-bold text-left h-10 py-2 w-[80px] sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm truncate max-w-full"
                  >
                    <span className="hidden sm:inline truncate">Player</span>
                    <span className="sm:hidden truncate">Plyr</span>
                    {getSortIcon("name")}
                  </Button>
                </Table.Th>
                <Table.Th className="font-bold text-left h-10 py-2 w-[70px] sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("buy_ins")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm truncate max-w-full"
                  >
                    <span className="hidden sm:inline truncate">Buy-ins</span>
                    <span className="sm:hidden truncate">Buy</span>
                    {getSortIcon("buy_ins")}
                  </Button>
                </Table.Th>
                <Table.Th className="font-bold text-left h-10 py-2 w-[70px] sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("net_amount")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm truncate max-w-full"
                  >
                    <span className="hidden sm:inline truncate">Net P&L</span>
                    <span className="sm:hidden truncate">P&L</span>
                    {getSortIcon("net_amount")}
                  </Button>
                </Table.Th>
                <Table.Th className="font-bold text-left h-10 py-2 w-[80px] sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_stack")}
                    className="flex items-center gap-1 hover:text-primary font-bold justify-start h-8 px-2 text-sm truncate max-w-full"
                  >
                    <span className="hidden sm:inline truncate">Final Stack</span>
                    <span className="sm:hidden truncate">Stack</span>
                    {getSortIcon("final_stack")}
                  </Button>
                </Table.Th>
                {showOwnerControls && fetchBuyInHistory && (
                  <Table.Th className="font-bold text-left h-10 py-2 text-sm w-[70px] sm:w-auto">
                    <span className="hidden sm:inline truncate">Buy-in Log</span>
                    <span className="sm:hidden truncate">Log</span>
                  </Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedGamePlayers.map((gamePlayer, index) => {
                const playerName = gamePlayer.players?.name ?? `Player ${index + 1}`;
                const netAmount = gamePlayer.net_amount ?? 0;
                const finalStack = gamePlayer.final_stack ?? 0;
                const isProfit = netAmount >= 0;
                
                return (
                  <Table.Tr
                    key={gamePlayer.id}
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-secondary/5 hover:bg-secondary/20" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <Table.Td className="font-medium text-primary text-left py-2 text-sm">{playerName}</Table.Td>
                    <Table.Td className="text-left py-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs">
                        {gamePlayer.buy_ins}
                      </span>
                    </Table.Td>
                    <Table.Td className="text-left py-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        isProfit 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {isProfit ? "+" : ""}Rs. {formatIndianNumber(netAmount)}
                      </span>
                    </Table.Td>
                    <Table.Td className="font-semibold text-accent-foreground text-left py-2 text-sm">
                      Rs. {formatIndianNumber(finalStack)}
                    </Table.Td>
                    {showOwnerControls && fetchBuyInHistory && (
                      <Table.Td className="text-left py-2">
                        <BuyInHistoryDialog
                          gamePlayerId={gamePlayer.id}
                          playerName={playerName}
                          fetchHistory={fetchBuyInHistory}
                        />
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
          </div>
        </Collapse>
      </Card>

      {/* Settlements */}
      <Card shadow="sm" padding="md" radius="md" withBorder className="border-primary/20">
        <div 
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 -mx-4 -mt-4 px-4 pt-4 pb-3 cursor-pointer hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15 transition-colors"
          onClick={() => setSettlementsOpen(!settlementsOpen)}
        >
          <Group justify="space-between" wrap="wrap">
            <Group gap="xs">
              <span className="text-2xl">💰</span>
              <Text className="text-primary" size="lg" fw={600}>
                Settlements
              </Text>
            </Group>
            {settlementsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Group>
          {showOwnerControls && settlementsOpen && (
            <div className="flex items-center gap-2 flex-wrap mt-3" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/20 hover:bg-primary/10"
                onClick={() => setTransferDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add</span> Transfer
              </Button>
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
        <Collapse in={settlementsOpen}>
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
                <Table.Thead>
                  <Table.Tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/15 hover:via-primary/10 hover:to-secondary/15">
                    <Table.Th className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">From</span>
                      <span className="sm:hidden">Fr</span>
                    </Table.Th>
                    <Table.Th className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">To</span>
                      <span className="sm:hidden">To</span>
                    </Table.Th>
                    <Table.Th className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">Amount</span>
                      <span className="sm:hidden">Amt</span>
                    </Table.Th>
                    <Table.Th className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">Type</span>
                      <span className="sm:hidden">Typ</span>
                    </Table.Th>
                    <Table.Th className="font-bold text-left text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">Status</span>
                      <span className="sm:hidden">✓</span>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {settlementsWithType.map((settlement, index) => {
                    const confirmation = getConfirmationStatus(confirmations, settlement.from, settlement.to);
                    
                    return (
                    <Table.Tr
                      key={`settlement-${index}`}
                      className={`transition-colors ${
                        index % 2 === 0 
                          ? "bg-secondary/5 hover:bg-secondary/20" 
                          : "hover:bg-primary/10"
                      }`}
                    >
                      <Table.Td className="font-medium text-primary text-left text-xs sm:text-sm py-2 sm:py-4">
                        {settlement.from}
                      </Table.Td>
                      <Table.Td className="font-medium text-primary text-left text-xs sm:text-sm py-2 sm:py-4">
                        {settlement.to}
                      </Table.Td>
                      <Table.Td className="font-semibold text-accent-foreground text-left text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">
                        Rs. {formatIndianNumber(settlement.amount)}
                      </Table.Td>
                      <Table.Td className="text-left py-2 sm:py-4">
                        {settlement.isManual ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                            Manual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                            Calculated
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td className="text-left py-2 sm:py-4">
                        {showOwnerControls && confirmation ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirmation.confirmed) {
                                await unconfirmSettlement(confirmation.id);
                              } else {
                                await confirmSettlement(confirmation.id);
                              }
                              // Refresh confirmations
                              const updatedConfirmations = await fetchConfirmations(gameId);
                              setConfirmations(updatedConfirmations);
                            }}
                            className={confirmation.confirmed ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"}
                          >
                            {confirmation.confirmed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        ) : confirmation?.confirmed ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 text-xs">
                            Pending
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No settlements needed - all players are even.
            </div>
          )}
        </Collapse>
      </Card>

      {/* Transfer Dialog Modal */}
      <Modal
        opened={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        title="Add Manual Transfer"
        centered
      >
        <Stack gap="md">
          <Select
            label="From (Payer)"
            value={newTransferFrom}
            onChange={(value) => setNewTransferFrom(value || '')}
            placeholder="Select player"
            data={gamePlayers.map(gp => ({
              value: gp.players?.name ?? "",
              label: gp.players?.name ?? "Unknown"
            }))}
          />
          <Select
            label="To (Receiver)"
            value={newTransferTo}
            onChange={(value) => setNewTransferTo(value || '')}
            placeholder="Select player"
            data={gamePlayers.map(gp => ({
              value: gp.players?.name ?? "",
              label: gp.players?.name ?? "Unknown"
            }))}
          />
          <TextInput
            label="Amount"
            type="number"
            placeholder="Enter amount"
            value={newTransferAmount}
            onChange={(e) => setNewTransferAmount(e.target.value)}
          />
          <Button onClick={addManualTransfer} fullWidth>
            Add Transfer
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};
