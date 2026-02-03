import { useState, useEffect, useMemo, useCallback } from "react";
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
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Share2, ArrowLeft, RefreshCw, Plus, Trash2, ChevronDown, Check, X, Calendar, User, Coins, TrendingUp, History, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 text-gold-500" />;
    return <ArrowDown className="h-4 w-4 text-gold-500" />;
  };

  const sortedGamePlayers = useMemo(() => {
    return [...gamePlayers].sort((a, b) => {
      let aVal: number | string, bVal: number | string;

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

      return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [gamePlayers, sortField, sortOrder]);

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
      toast.success("Settlements recalculated and archived");
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

  if (queryLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-gold-200/60 font-luxury tracking-widest uppercase text-sm animate-pulse">Decrypting Game Archives...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="max-w-4xl mx-auto border-white/10 bg-black/40 backdrop-blur-xl p-10 text-center">
        <p className="text-gold-200/60 font-luxury tracking-widest uppercase">Game record not found in ledger.</p>
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:bg-gold-500/10 text-gold-500 hover:text-gold-400 font-luxury uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      )}

      <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-8 border-b border-white/5 bg-white/2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20">
                <ShieldCheck className="h-6 w-6 text-gold-500" />
              </div>
              <div>
                <CardTitle className="text-3xl font-luxury text-gold-100">
                  Session Ledger — {format(new Date(game.date), "MMMM d, yyyy")}
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-[0.3em] text-gold-500/40 font-luxury">Official Sequence Archive</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyShareLink('game', gameId)}
              disabled={linkLoading}
              className="h-10 px-6 rounded-full bg-white/5 border-white/10 hover:bg-gold-500/10 hover:border-gold-500/30 text-gold-200 font-luxury uppercase tracking-widest text-[10px]"
            >
              <Share2 className="h-3.5 w-3.5 mr-2 text-gold-500" />
              Export Archive
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-white/5 bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">Blind Level / Unit</p>
              <p className="text-2xl font-numbers text-gold-100">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">The Lineup</p>
              <p className="text-2xl font-numbers text-gold-100">{gamePlayers.length}</p>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">Total Liquidity</p>
              <p className="text-2xl font-numbers text-gold-500">
                Rs. {formatIndianNumber(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-white/5 space-y-2">
              <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60">Total Pot Action</p>
              <p className="text-2xl font-numbers text-green-400">
                +Rs. {formatIndianNumber(gamePlayers.filter(gp => (gp.net_amount ?? 0) > 0).reduce((sum, gp) => sum + (gp.net_amount ?? 0), 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy-in Logs Section */}
      <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <Collapsible open={buyInLogsOpen} onOpenChange={setBuyInLogsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                <h3 className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Stack Rebuys</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-white/20 transition-transform duration-300", buyInLogsOpen && "rotate-180")} />
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
      <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <Collapsible open={tablePositionsOpen} onOpenChange={setTablePositionsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                <h3 className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Seat Draw</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-white/20 transition-transform duration-300", tablePositionsOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-8 animate-in slide-in-from-top-2 duration-300">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-widest font-numbers text-gold-500/60 bg-gold-500/5 px-3 py-1 rounded-full border border-gold-500/10">
                    Snapshot: {tablePositions.length > 0 ? format(toZonedTime(new Date(currentTablePosition!.snapshot_timestamp), "Asia/Kolkata"), "HH:mm") : "--:--"} IST
                  </span>
                </div>
                {tablePositions.length > 1 && (
                  <div className="flex items-center gap-4 bg-white/5 rounded-full p-1 border border-white/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                      disabled={currentPositionIndex === 0}
                      className="h-8 w-8 rounded-full text-gold-500 disabled:opacity-20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-[10px] font-numbers text-gold-100/60 px-2 min-w-[40px] text-center">
                      {currentPositionIndex + 1} / {tablePositions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPositionIndex(Math.min(tablePositions.length - 1, currentPositionIndex + 1))}
                      disabled={currentPositionIndex === tablePositions.length - 1}
                      className="h-8 w-8 rounded-full text-gold-500 disabled:opacity-20"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gold-500/5 blur-3xl rounded-full" />
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
      <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <Collapsible open={playerResultsOpen} onOpenChange={setPlayerResultsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                <h3 className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Session P&L</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-white/20 transition-transform duration-300", playerResultsOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/10">
                  <TableRow className="hover:bg-transparent border-0 h-14">
                    <TableHead className="pl-8">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="h-full w-full justify-start font-luxury uppercase tracking-widest text-[10px] text-gold-500/60 hover:text-gold-200"
                      >
                        Player {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("buy_ins")}
                        className="h-full w-full justify-center text-center font-luxury uppercase tracking-widest text-[10px] text-gold-500/60 hover:text-gold-200"
                      >
                        Buy-ins {getSortIcon("buy_ins")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("net_amount")}
                        className="h-full w-full justify-center text-center font-luxury uppercase tracking-widest text-[10px] text-gold-500/60 hover:text-gold-200"
                      >
                        P&L {getSortIcon("net_amount")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("final_stack")}
                        className="h-full w-full justify-center text-center font-luxury uppercase tracking-widest text-[10px] text-gold-500/60 hover:text-gold-200"
                      >
                        Cashout Stack {getSortIcon("final_stack")}
                      </Button>
                    </TableHead>
                    {showOwnerControls && fetchBuyInHistory && (
                      <TableHead className="text-right pr-8">
                        <span className="font-luxury uppercase tracking-widest text-[10px] text-gold-500/60">Log Audit</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {sortedGamePlayers.map((gamePlayer) => {
                    const playerName = gamePlayer.players?.name ?? "--";
                    const netAmount = gamePlayer.net_amount ?? 0;
                    const finalStack = gamePlayer.final_stack ?? 0;
                    const isWin = netAmount > 0;

                    return (
                      <TableRow key={gamePlayer.id} className="h-12 sm:h-16 border-white/5 hover:bg-gold-500/5 transition-colors">
                        <TableCell className="pl-4 sm:pl-8 text-left font-luxury text-[13px] text-gold-100/80 uppercase tracking-widest">{playerName}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-gold-200/60 font-numbers px-3 py-1">
                              {gamePlayer.buy_ins} Stacks
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge
                              className={cn(
                                "px-4 py-1.5 font-numbers tracking-widest border-0",
                                isWin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              )}
                            >
                              {formatProfitLoss(netAmount)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-numbers text-base text-gold-100/60">
                          Rs. {formatIndianNumber(finalStack)}
                        </TableCell>
                        {showOwnerControls && fetchBuyInHistory && (
                          <TableCell className="text-right pr-8">
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
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Settlement Orchestration Section */}
      <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                <h3 className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Debt Settlement</h3>
              </div>
              <div className="flex items-center gap-4">
                {showOwnerControls && settlementsOpen && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTransferDialogOpen(true)}
                      className="h-8 rounded-full border border-gold-500/10 hover:bg-gold-500/10 text-gold-500 font-luxury uppercase tracking-widest text-[9px]"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Manual
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={recalculateAndSaveSettlements}
                      className="h-8 rounded-full border border-gold-500/10 hover:bg-gold-500/10 text-gold-500 font-luxury uppercase tracking-widest text-[9px]"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Finalize
                    </Button>
                  </div>
                )}
                <ChevronDown className={cn("h-5 w-5 text-white/20 transition-transform duration-300", settlementsOpen && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="animate-in slide-in-from-top-2 duration-300">
              {showOwnerControls && manualTransfers.length > 0 && (
                <div className="p-6 border-b border-gold-500/10 bg-gold-500/5">
                  <p className="text-[10px] font-luxury uppercase tracking-[0.2em] text-gold-500/60 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Buffered Transactions (Awaiting Finalization)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {manualTransfers.map((transfer, index) => (
                      <div key={index} className="flex items-center justify-between bg-black/40 rounded-xl p-4 border border-white/5 group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="text-xs font-luxury text-gold-100/80 truncate">
                            <span className="text-white/40">{transfer.from}</span>
                            <ArrowRight className="inline h-3 w-3 mx-2 text-gold-500/40" />
                            <span className="text-white/40">{transfer.to}</span>
                          </div>
                          <span className="font-numbers text-sm text-gold-500">₹{formatIndianNumber(transfer.amount)}</span>
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
                  <TableHeader className="bg-white/5 border-b border-white/10">
                    <TableRow className="hover:bg-transparent border-0 h-14">
                      <TableHead className="pl-8 text-left font-luxury uppercase tracking-widest text-[9px] text-gold-500/60">Debtor</TableHead>
                      <TableHead className="text-left font-luxury uppercase tracking-widest text-[9px] text-gold-500/60">Creditor</TableHead>
                      <TableHead className="text-center font-luxury uppercase tracking-widest text-[9px] text-gold-500/60">Amount</TableHead>
                      <TableHead className="text-right pr-8 font-luxury uppercase tracking-widest text-[9px] text-gold-500/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {settlementsWithType.map((settlement, index) => {
                      const confirmation = getConfirmationStatus(confirmations, settlement.from, settlement.to);
                      return (
                        <TableRow key={`settlement-${index}`} className="h-12 sm:h-16 border-white/5 hover:bg-gold-500/5 transition-colors group">
                          <TableCell className="pl-4 sm:pl-8">
                            <div className="flex items-center gap-3">
                              <User className="h-3 w-3 text-gold-500/40" />
                              <span className="font-luxury text-[12px] text-gold-100/80 uppercase tracking-widest">{settlement.from}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-3 w-3 text-gold-500/40" />
                              <span className="font-luxury text-[12px] text-gold-100/80 uppercase tracking-widest">{settlement.to}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-numbers text-base text-gold-500">Rs. {formatIndianNumber(settlement.amount)}</span>
                            {settlement.isManual && (
                              <span className="ml-3 text-[9px] font-luxury uppercase tracking-widest text-gold-500/30 px-2 py-0.5 border border-gold-500/10 rounded-full">Manual</span>
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
                                  "h-10 px-6 rounded-full font-luxury uppercase tracking-widest text-[10px] border transition-all",
                                  confirmation.confirmed
                                    ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                                    : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                                )}
                              >
                                {confirmation.confirmed ? <Check className="h-3.5 w-3.5 mr-2" /> : <X className="h-3.5 w-3.5 mr-2" />}
                                {confirmation.confirmed ? "Authorized" : "Confirm"}
                              </Button>
                            ) : (
                              <Badge className={cn(
                                "h-9 px-5 rounded-full font-luxury uppercase tracking-widest text-[9px] border-0",
                                confirmation?.confirmed ? "bg-green-500/20 text-green-400" : "bg-gold-500/10 text-gold-500/40"
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
        <DialogContent className="bg-[#0a0a0a]/95 border-gold-500/30 backdrop-blur-2xl text-gold-50 rounded-xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
                <Plus className="w-5 h-5 text-gold-500" />
              </div>
              <DialogTitle className="text-xl font-luxury text-gold-100 uppercase tracking-widest">Manual Settlement Protocol</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1 mb-2 block text-left">Payer (From)</Label>
                <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                  <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase">
                    <SelectValue placeholder="Select Origin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl">
                    {gamePlayers.map(gp => (
                      <SelectItem key={gp.players?.name} value={gp.players?.name || ''} className="font-luxury uppercase text-[10px] tracking-widest">{gp.players?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1 mb-2 block text-left">Recipient (To)</Label>
                <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                  <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase text-left">
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl">
                    {gamePlayers.map(gp => (
                      <SelectItem key={gp.players?.name} value={gp.players?.name || ''} className="font-luxury uppercase text-[10px] tracking-widest">{gp.players?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1 mb-2 block text-left">Amount (INR)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newTransferAmount}
                  onChange={(e) => setNewTransferAmount(e.target.value)}
                  className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-numbers text-lg text-gold-100 placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setTransferDialogOpen(false)} className="font-luxury uppercase tracking-[0.2em] text-[10px] h-11 border-white/5 bg-white/2 hover:bg-white/5 transition-colors rounded-lg flex-1">
              Abort
            </Button>
            <Button
              onClick={addManualTransfer}
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-11 bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 text-gold-100 rounded-lg flex-1"
            >
              Queue Protocol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ArrowRight = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
