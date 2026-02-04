import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Share2, ArrowLeft, ArrowRight, RefreshCw, Plus, Trash2, ChevronDown, Check, X, Calendar, User, Coins, TrendingUp, History, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { toast } from "@/lib/notifications";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { formatIndianNumber, formatProfitLoss, getProfitLossVariant, cn } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import { SeatPosition, BuyInHistory } from "@/types/poker";
import { ConsolidatedBuyInLogs } from "@/components/ConsolidatedBuyInLogs";
import { BuyInHistoryDialog } from "@/components/BuyInHistoryDialog";
import { useSharedLink } from "@/hooks/useSharedLink";
import { useMetaTags } from "@/hooks/useMetaTags";
import { calculateOptimizedSettlements, PlayerBalance } from "@/utils/settlementCalculator";
import { useSettlementConfirmations } from "@/hooks/useSettlementConfirmations";
import { buildShortUrl } from "@/lib/shareUtils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useGameDetail } from "@/features/game/hooks/useGameDetail";

interface GamePlayer {
  id: string;
  player_id: string;
  buy_ins: number;
  final_stack: number | null;
  net_amount: number | null;
  players: {
    name: string | null;
    payment_preference?: string;
    upi_id?: string;
  } | null;
}

interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
  settlements: Settlement[];
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
  const { copyShareLink, loading: linkLoading, createOrGetSharedLink } = useSharedLink();
  const { fetchConfirmations, confirmSettlement, unconfirmSettlement, getConfirmationStatus } = useSettlementConfirmations();

  // Use TanStack Query hook
  const { data: gameDetail, isLoading: queryLoading, refetch: refetchGameDetail } = useGameDetail(client, gameId);

  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);

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

  const game = gameDetail?.game as Game | undefined;
  const gamePlayers = (gameDetail?.gamePlayers || []) as unknown as GamePlayer[];
  const tablePositions = gameDetail?.tablePositions || [];
  const confirmations = gameDetail?.confirmations || [];

  // Fetch shared link for meta tags (for owner views)
  useEffect(() => {
    if (showOwnerControls && gameId) {
      createOrGetSharedLink('game', gameId)
        .then((linkData) => {
          if (linkData) {
            const shortUrl = buildShortUrl(linkData.shortCode);
            setShareUrl(shortUrl);
          }
        })
        .catch((error) => {
          console.error('Error fetching share link for meta tags:', error);
        });
    }
  }, [showOwnerControls, gameId, createOrGetSharedLink]);

  const metaTagsConfig = useMemo(() => ({
    url: shareUrl,
    title: game ? `Game Details - ${format(new Date(game.date), "MMMM d, yyyy")}` : undefined,
    description: game ? `Poker game on ${format(new Date(game.date), "MMMM d, yyyy")} - Buy-in: Rs. ${formatIndianNumber(game.buy_in_amount)}` : undefined,
  }), [shareUrl, game]);

  useMetaTags(metaTagsConfig);

  const sortedGamePlayers = useMemo(() => {
    return [...gamePlayers].sort((a, b) => {
      const aName = (a.players?.name ?? "").toLowerCase();
      const bName = (b.players?.name ?? "").toLowerCase();
      return aName < bName ? -1 : 1;
    });
  }, [gamePlayers]);

  const calculateSettlements = useCallback((transfers: Settlement[] = []): Settlement[] => {
    const playerBalances: PlayerBalance[] = sortedGamePlayers.map(gp => ({
      name: gp.players?.name ?? "",
      amount: gp.net_amount ?? 0,
      paymentPreference: (gp.players as any)?.payment_preference || 'upi',
    }));

    const settlements = calculateOptimizedSettlements(playerBalances, transfers);
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
    toast.success("Manual transfer added to buffer");
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
      await refetchGameDetail();
      setManualTransfers([]);
      toast.success("Settlements saved");
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

    // The order in calculateSettlements logic typically puts manual ones first if we saved them that way
    // or we can detect based on count if the structure is simple
    const numManual = savedSettlements.length - allCalculatedSettlements.length;

    return savedSettlements.map((s, i) => ({
      ...s,
      isManual: i < numManual && numManual > 0
    }));
  }, [savedSettlements, allCalculatedSettlements]);

  const settlementsWithType = useMemo(() => getSettlementsWithType(), [getSettlementsWithType]);

  const nameToIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    gamePlayers.forEach(gp => {
      if (gp.players?.name) {
        map[gp.players.name] = gp.player_id;
      }
    });
    return map;
  }, [gamePlayers]);

  if (queryLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm animate-pulse uppercase tracking-widest">Loading Game Data...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="max-w-4xl mx-auto p-10 text-center">
        <p className="text-muted-foreground uppercase tracking-widest">Game record not found in ledger.</p>
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-8 border-b border-border bg-accent/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">
                  Session Ledger — {format(new Date(game.date), "MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>Game Record</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyShareLink('game', gameId)}
              disabled={linkLoading}
              className="rounded-full"
            >
              <Share2 className="h-3.5 w-3.5 mr-2" />
              Export Game
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Blind Level / Unit</p>
              <p className="text-2xl font-bold">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The Lineup</p>
              <p className="text-2xl font-bold">{gamePlayers.length}</p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Liquidity</p>
              <p className="text-2xl font-bold text-primary">
                Rs. {formatIndianNumber(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Pot Action</p>
              <Badge variant="profit" className="text-lg px-3 py-1">
                +Rs. {formatIndianNumber(gamePlayers.filter(gp => (gp.net_amount ?? 0) > 0).reduce((sum, gp) => sum + (gp.net_amount ?? 0), 0))}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy-in Logs Section */}
      <Card className="overflow-hidden">
        <Collapsible open={buyInLogsOpen} onOpenChange={setBuyInLogsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Stack Rebuys</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", buyInLogsOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6 animate-in slide-in-from-top-2 duration-300">
              <ConsolidatedBuyInLogs gameId={gameId} token={token} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Table Positions Section */}
      <Card className="overflow-hidden">
        <Collapsible open={tablePositionsOpen} onOpenChange={setTablePositionsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Seat Draw</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", tablePositionsOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-8 animate-in slide-in-from-top-2 duration-300">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                    Snapshot: {tablePositions.length > 0 ? format(toZonedTime(new Date(currentTablePosition!.snapshot_timestamp), "Asia/Kolkata"), "HH:mm") : "--:--"} IST
                  </span>
                </div>
                {tablePositions.length > 1 && (
                  <div className="flex items-center gap-4 bg-muted rounded-full p-1 border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                      disabled={currentPositionIndex === 0}
                      className="h-8 w-8 rounded-full disabled:opacity-20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-[10px] font-medium px-2 min-w-[40px] text-center">
                      {currentPositionIndex + 1} / {tablePositions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPositionIndex(Math.min(tablePositions.length - 1, currentPositionIndex + 1))}
                      disabled={currentPositionIndex === tablePositions.length - 1}
                      className="h-8 w-8 rounded-full disabled:opacity-20"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <PokerTableView
                  positions={playersWithSeats}
                  totalSeats={playersWithSeats.length}
                  enableDragDrop={false}
                  gameId={gameId}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Player Results Ledger */}
      <Card className="overflow-hidden">
        <Collapsible open={playerResultsOpen} onOpenChange={setPlayerResultsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Session P&L</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", playerResultsOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
              <div className="rounded-md border m-4 mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Player</TableHead>
                      <TableHead className="text-center">Buy-ins</TableHead>
                      <TableHead className="text-center">P&L</TableHead>
                      <TableHead className="text-center">Cashout</TableHead>
                      {showOwnerControls && fetchBuyInHistory && <TableHead className="text-right pr-6">Audit</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGamePlayers.map((gamePlayer) => {
                      const playerName = gamePlayer.players?.name ?? "--";
                      const netAmount = gamePlayer.net_amount ?? 0;
                      const finalStack = gamePlayer.final_stack ?? 0;
                      const isWin = netAmount > 0;

                      return (
                        <TableRow key={gamePlayer.id}>
                          <TableCell className="pl-6 font-medium">
                            <Link
                              to={gamePlayer.player_id ? `/players/${gamePlayer.player_id}` : '#'}
                              className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block w-fit"
                            >
                              {playerName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {gamePlayer.buy_ins}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge variant={isWin ? "profit" : "loss"}>
                                {formatProfitLoss(netAmount)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            Rs. {formatIndianNumber(finalStack)}
                          </TableCell>
                          {showOwnerControls && fetchBuyInHistory && (
                            <TableCell className="text-right pr-6">
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
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Settlement Orchestration Section */}
      <Card className="overflow-hidden">
        <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Settlement</h3>
              </div>
              <div className="flex items-center gap-4">
                {showOwnerControls && settlementsOpen && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTransferDialogOpen(true)}
                      className="h-8 rounded-full border text-[10px] tracking-widest uppercase"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Manual
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={recalculateAndSaveSettlements}
                      className="h-8 rounded-full border text-[10px] tracking-widest uppercase"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Finalize
                    </Button>
                  </div>
                )}
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", settlementsOpen && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="animate-in slide-in-from-top-2 duration-300">
              {showOwnerControls && manualTransfers.length > 0 && (
                <div className="p-6 border-b bg-muted/30">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Buffered Transactions (Awaiting Finalization)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {manualTransfers.map((transfer, index) => (
                      <div key={index} className="flex items-center justify-between bg-card rounded-xl p-4 border group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="text-xs text-foreground truncate">
                            <span className="text-muted-foreground">{transfer.from}</span>
                            <ArrowRight className="inline h-3 w-3 mx-2 text-muted-foreground/40" />
                            <span className="text-muted-foreground">{transfer.to}</span>
                          </div>
                          <span className="font-bold text-sm text-primary">₹{formatIndianNumber(transfer.amount)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeManualTransfer(index)}
                          className="h-8 w-8 text-red-500/20 hover:text-red-500 transition-all rounded-full"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b">
                    <TableRow className="hover:bg-transparent border-0 h-10">
                      <TableHead className="pl-8 text-left font-medium text-muted-foreground">From</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground">To</TableHead>
                      <TableHead className="text-center font-medium text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-right pr-8 font-medium text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {settlementsWithType.map((settlement, index) => {
                      const confirmation = getConfirmationStatus(confirmations, settlement.from, settlement.to);
                      return (
                        <TableRow key={`settlement-${index}`} className="h-12 sm:h-14 group">
                          <TableCell className="pl-4 sm:pl-8 font-medium">
                            <div className="flex items-center gap-3">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <Link
                                to={nameToIdMap[settlement.from] ? `/players/${nameToIdMap[settlement.from]}` : '#'}
                                className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all"
                              >
                                {settlement.from}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <Link
                                to={nameToIdMap[settlement.to] ? `/players/${nameToIdMap[settlement.to]}` : '#'}
                                className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all"
                              >
                                {settlement.to}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">Rs. {formatIndianNumber(settlement.amount)}</span>
                            {settlement.isManual && (
                              <Badge variant="outline" className="ml-3">Manual</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            {showOwnerControls && confirmation ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirmation.confirmed) await unconfirmSettlement(confirmation.id);
                                  else await confirmSettlement(confirmation.id);
                                  await refetchGameDetail();
                                }}
                                className={cn(
                                  "h-8 px-4 rounded-full text-xs border transition-all",
                                  confirmation.confirmed
                                    ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {confirmation.confirmed ? <Check className="h-3.5 w-3.5 mr-2" /> : <X className="h-3.5 w-3.5 mr-2" />}
                                {confirmation.confirmed ? "Authorized" : "Confirm"}
                              </Button>
                            ) : (
                              <Badge className={cn(
                                "h-7 px-3 rounded-full text-[10px] border-0",
                                confirmation?.confirmed ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                              )}>
                                {confirmation?.confirmed ? <Check className="h-3 w-3 mr-2" /> : <History className="h-3 w-3 mr-2" />}
                                {confirmation?.confirmed ? "Settled" : "Pending"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Manual Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl uppercase tracking-widest">Manual Settlement</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block text-left">Payer (From)</Label>
                <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.map(gp => (
                      <SelectItem key={gp.players?.name} value={gp.players?.name || ''}>{gp.players?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block text-left">Recipient (To)</Label>
                <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.map(gp => (
                      <SelectItem key={gp.players?.name} value={gp.players?.name || ''}>{gp.players?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block text-left">Amount (INR)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newTransferAmount}
                  onChange={(e) => setNewTransferAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setTransferDialogOpen(false)} className="rounded-lg flex-1">
              Abort
            </Button>
            <Button
              onClick={addManualTransfer}
              className="rounded-lg flex-1"
            >
              Queue Protocol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

