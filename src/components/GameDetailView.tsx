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
import { formatProfitLoss, getProfitLossVariant, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { CurrencyConfig } from "@/config/localization";
import PokerTableView from "@/components/PokerTableView";
import { SeatPosition, BuyInHistory } from "@/types/poker";
import { ConsolidatedBuyInLogs } from "@/components/ConsolidatedBuyInLogs";
import { BuyInHistoryDialog } from "@/components/BuyInHistoryDialog";
import { useSharedLink } from "@/hooks/useSharedLink";
import { ShareDialog } from "@/components/ShareDialog";
import { useMetaTags } from "@/hooks/useMetaTags";
import { calculateOptimizedSettlements, PlayerBalance } from "@/utils/settlementCalculator";
import { useSettlementConfirmations } from "@/hooks/useSettlementConfirmations";
import { buildShortUrl } from "@/lib/shareUtils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useGameDetail } from "@/features/game/hooks/useGameDetail";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const { createOrGetSharedLink } = useSharedLink();
  const { fetchConfirmations, confirmSettlement, unconfirmSettlement, getConfirmationStatus } = useSettlementConfirmations();

  // Use TanStack Query hook
  const { data: gameDetail, isLoading: queryLoading, refetch: refetchGameDetail } = useGameDetail(client, gameId);
  const isMobile = useIsMobile();

  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Collapsible sections state
  const [buyInLogsOpen, setBuyInLogsOpen] = useState(true);
  const [tablePositionsOpen, setTablePositionsOpen] = useState(true);
  const [playerResultsOpen, setPlayerResultsOpen] = useState(true);
  const [settlementsOpen, setSettlementsOpen] = useState(true);

  // Manual transfer state removed to rely on game.settlements
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
    description: game ? `Poker game on ${format(new Date(game.date), "MMMM d, yyyy")} - Buy-in: ${formatCurrency(game.buy_in_amount)}` : undefined,
  }), [shareUrl, game]);

  useMetaTags(metaTagsConfig);

  const sortedGamePlayers = useMemo(() => {
    return [...gamePlayers].sort((a, b) => {
      const aName = (a.players?.name ?? "").toLowerCase();
      const bName = (b.players?.name ?? "").toLowerCase();
      return aName < bName ? -1 : 1;
    });
  }, [gamePlayers]);


  const addManualTransfer = async () => {
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

    // 1. Define the new manual transfer
    const newManualTransfer: Settlement & { isManual: boolean } = {
      from: newTransferFrom,
      to: newTransferTo,
      amount,
      isManual: true
    };

    // 2. Get existing manual transfers
    const existingSettlements = game?.settlements || [];
    const existingManuals = existingSettlements.filter((s: any) => s.isManual);

    // 3. Combine all manual transfers
    const allManuals = [...existingManuals, newManualTransfer];

    // 4. Get player balances
    const balances: PlayerBalance[] = sortedGamePlayers.map(gp => ({
      name: gp.players?.name ?? "",
      amount: gp.net_amount ?? 0,
      paymentPreference: (gp.players as any)?.payment_preference || 'upi',
    }));

    // 5. Calculate new auto-settlements with all manual transfers
    const newAutoSettlements = calculateOptimizedSettlements(balances, allManuals);
    const autoSettlementsWithFlag = newAutoSettlements.map(({ from, to, amount }) => ({
      from,
      to,
      amount,
      isManual: false
    }));

    // 6. Merge: manuals first, then autos
    const finalSettlements = [...allManuals, ...autoSettlementsWithFlag];

    const { error } = await client
      .from("games")
      .update({ settlements: finalSettlements as any })
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to save manual adjustment");
    } else {
      await refetchGameDetail();
      setNewTransferFrom("");
      setNewTransferTo("");
      setNewTransferAmount("");
      setTransferDialogOpen(false);
      toast.success("Manual adjustment saved to ledger");
    }
  };

  const handleDeleteManualTransfer = async (index: number) => {
    const existingSettlements = game?.settlements || [];

    // 1. Get only manual transfers
    const manualTransfers = existingSettlements.filter((s: any) => s.isManual);

    // 2. Remove the target transfer by index
    const remainingManuals = manualTransfers.filter((_, i) => i !== index);

    // 3. Get player balances
    const balances: PlayerBalance[] = sortedGamePlayers.map(gp => ({
      name: gp.players?.name ?? "",
      amount: gp.net_amount ?? 0,
      paymentPreference: (gp.players as any)?.payment_preference || 'upi',
    }));

    // 4. Recalculate auto-settlements with remaining manual transfers
    const newAutoSettlements = calculateOptimizedSettlements(balances, remainingManuals);
    const autoSettlementsWithFlag = newAutoSettlements.map(({ from, to, amount }) => ({
      from,
      to,
      amount,
      isManual: false
    }));

    // 5. Merge and save
    const finalSettlements = [...remainingManuals, ...autoSettlementsWithFlag];

    const { error } = await client
      .from("games")
      .update({ settlements: finalSettlements as any })
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to remove adjustment");
    } else {
      await refetchGameDetail();
      toast.success("Adjustment removed");
    }
  };

  const savedSettlements: SettlementWithType[] = (game?.settlements || []) as unknown as SettlementWithType[];

  const settlementsWithType = useMemo(() => {
    // Storage-first: return saved settlements directly, ensuring isManual property exists
    return savedSettlements.map(s => ({
      ...s,
      isManual: s.isManual ?? false  // Default to false if not set
    }));
  }, [savedSettlements]);

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
              onClick={() => setShareDialogOpen(true)}
              className="rounded-full"
            >
              <Share2 className="h-3.5 w-3.5 mr-2" />
              Share
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Blind Level / Unit</p>
              <p className="text-2xl font-bold">{formatCurrency(game.buy_in_amount)}</p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The Lineup</p>
              <p className="text-2xl font-bold">{gamePlayers.length}</p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Liquidity</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(gamePlayers.reduce((sum, gp) => sum + gp.buy_ins, 0) * game.buy_in_amount)}
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-accent/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Pot Action</p>
              <Badge variant="profit" className="text-lg px-3 py-1">
                +{formatCurrency(gamePlayers.filter(gp => (gp.net_amount ?? 0) > 0).reduce((sum, gp) => sum + (gp.net_amount ?? 0), 0))}
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
                      aria-label="Previous table position snapshot"
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
                      aria-label="Next table position snapshot"
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
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className={cn("rounded-md border mt-8 max-h-[600px] overflow-auto", isMobile ? "m-0" : "m-4")}>
                <Table className={cn(isMobile && "table-fixed w-full")}>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className={cn(isMobile && "h-10")}>
                      <TableHead className={cn(isMobile ? (showOwnerControls && fetchBuyInHistory ? "pl-2 w-[30%] text-[10px] uppercase" : "pl-2 w-[35%] text-[10px] uppercase") : "pl-6")}>
                        {isMobile ? "Player" : "Player"}
                      </TableHead>
                      <TableHead className={cn("text-center", isMobile ? (showOwnerControls && fetchBuyInHistory ? "w-[15%] px-0 text-[10px] uppercase" : "w-[15%] px-0 text-[10px] uppercase") : "")}>
                        {isMobile ? "Buys" : "Buy-ins"}
                      </TableHead>
                      <TableHead className={cn("text-center", isMobile ? (showOwnerControls && fetchBuyInHistory ? "w-[20%] px-0 text-[10px] uppercase" : "w-[25%] px-0 text-[10px] uppercase") : "")}>
                        {isMobile ? "Net" : "P&L"}
                      </TableHead>
                      <TableHead className={cn("text-center", isMobile ? (showOwnerControls && fetchBuyInHistory ? "w-[20%] px-0 text-[10px] uppercase" : "w-[25%] px-0 text-[10px] uppercase") : "")}>
                        {isMobile ? "Cash" : "Cashout"}
                      </TableHead>
                      {showOwnerControls && fetchBuyInHistory && (
                        <TableHead className={cn("text-right", isMobile ? "w-[15%] pr-2 text-[10px] uppercase" : "pr-6")}>
                          {isMobile ? "History" : "Audit"}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGamePlayers.map((gamePlayer) => {
                      const playerName = gamePlayer.players?.name ?? "--";
                      const netAmount = gamePlayer.net_amount ?? 0;
                      const finalStack = gamePlayer.final_stack ?? 0;
                      const isWin = netAmount > 0;

                      return (
                        <TableRow key={gamePlayer.id} className={cn(isMobile && "h-10")}>
                          <TableCell className={cn(isMobile ? "pl-2 p-1" : "pl-6")}>
                            <Link
                              to={gamePlayer.player_id ? `/players/${gamePlayer.player_id}` : '#'}
                              className={cn(
                                "hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate",
                                isMobile ? (showOwnerControls && fetchBuyInHistory ? "max-w-[60px] text-xs" : "max-w-[80px] text-xs") : "w-fit"
                              )}
                            >
                              {playerName}
                            </Link>
                          </TableCell>
                          <TableCell className={cn("text-center", isMobile ? "p-1" : "")}>
                            <Badge variant="outline" className={cn(isMobile && "px-1 py-0 text-[10px]")}>
                              {gamePlayer.buy_ins}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("text-center", isMobile ? "p-1" : "")}>
                            <div className="flex justify-center">
                              <Badge
                                variant={isWin ? "profit" : "loss"}
                                className={cn(isMobile && "px-1 py-0 text-[10px]")}
                              >
                                {formatProfitLoss(netAmount)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-center font-medium", isMobile ? "p-1 text-xs" : "")}>
                            {formatCurrency(finalStack)}
                          </TableCell>
                          {showOwnerControls && fetchBuyInHistory && (
                            <TableCell className={cn("text-right", isMobile ? "pr-2 p-1" : "pr-6")}>
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
                  </div>
                )}
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", settlementsOpen && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="animate-in slide-in-from-top-2 duration-300">

              <div className="overflow-x-auto max-h-[600px]">
                <Table className={cn(isMobile && "table-fixed w-full")}>
                  <TableHeader className="bg-muted/50 border-b sticky top-0 z-10 bg-card">
                    <TableRow className={cn(isMobile ? "h-8" : "h-10")}>
                      <TableHead className={cn(isMobile ? "pl-2 w-[22%] text-[10px] uppercase" : "pl-8 text-left font-medium text-muted-foreground")}>From</TableHead>
                      <TableHead className={cn(isMobile ? "w-[22%] text-[10px] uppercase px-1" : "text-left font-medium text-muted-foreground")}>To</TableHead>
                      <TableHead className={cn("text-center font-medium text-muted-foreground", isMobile ? "w-[26%] text-[10px] px-0" : "")}>{isMobile ? "Amt" : "Amount"}</TableHead>
                      <TableHead className={cn("text-right font-medium text-muted-foreground", isMobile ? "w-[30%] pr-2 text-[10px]" : "pr-8")}>{isMobile ? "Sts" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {settlementsWithType.map((settlement, index) => {
                      const confirmation = getConfirmationStatus(confirmations, settlement.from, settlement.to);
                      return (
                        <TableRow key={`settlement-${index}`} className={cn(isMobile ? "h-10" : "h-12 sm:h-14", "group")}>
                          <TableCell className={cn(isMobile ? "pl-2 p-1" : "pl-4 sm:pl-8 font-medium")}>
                            <div className="flex items-center gap-1 sm:gap-3">
                              {!isMobile && <User className="h-3 w-3 text-muted-foreground" />}
                              <Link
                                to={nameToIdMap[settlement.from] ? `/players/${nameToIdMap[settlement.from]}` : '#'}
                                className={cn(
                                  "hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate",
                                  isMobile ? "max-w-[60px] text-[10px]" : ""
                                )}
                              >
                                {settlement.from}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className={cn(isMobile ? "p-1 px-1" : "font-medium")}>
                            <div className="flex items-center gap-1 sm:gap-3">
                              {!isMobile && <CreditCard className="h-3 w-3 text-muted-foreground" />}
                              <Link
                                to={nameToIdMap[settlement.to] ? `/players/${nameToIdMap[settlement.to]}` : '#'}
                                className={cn(
                                  "hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate",
                                  isMobile ? "max-w-[60px] text-[10px]" : ""
                                )}
                              >
                                {settlement.to}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-center", isMobile ? "p-1 px-0" : "")}>
                            <span className={cn("font-medium", isMobile ? "text-[10px]" : "")}>
                              {formatCurrency(settlement.amount)}
                            </span>
                            {settlement.isManual && (
                              <Badge variant="outline" className={cn("ml-1", isMobile ? "px-0.5 py-0 text-[8px] min-w-[12px] h-3 flex items-center justify-center inline-flex" : "ml-3")}>
                                {isMobile ? "M" : "Manual"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={cn("text-right", isMobile ? "pr-2 p-1" : "pr-8")}>
                            <div className="flex items-center justify-end gap-1">
                              {settlement.isManual && showOwnerControls && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteManualTransfer(index)}
                                  className={cn(isMobile ? "h-6 w-6" : "h-8 w-8", "text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors")}
                                >
                                  <Trash2 className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                                </Button>
                              )}
                              {showOwnerControls && confirmation ? (
                                <Button
                                  variant="ghost"
                                  size={isMobile ? "icon" : "sm"}
                                  onClick={async () => {
                                    if (confirmation.confirmed) await unconfirmSettlement(confirmation.id);
                                    else await confirmSettlement(confirmation.id);
                                    await refetchGameDetail();
                                  }}
                                  className={cn(
                                    isMobile ? "h-6 w-6 rounded-md shadow-sm" : "h-8 px-4 rounded-full text-xs border transition-all",
                                    confirmation.confirmed
                                      ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  )}
                                >
                                  {confirmation.confirmed ? <Check className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-2")} /> : <X className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-2")} />}
                                  {!isMobile && (confirmation.confirmed ? "Authorized" : "Confirm")}
                                </Button>
                              ) : (
                                <Badge className={cn(
                                  "rounded-full border-0 font-medium",
                                  isMobile ? "h-6 w-6 p-0 flex items-center justify-center" : "h-7 px-3 text-[10px]",
                                  confirmation?.confirmed ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                                )}>
                                  {confirmation?.confirmed ? <Check className={cn(isMobile ? "h-3.5 w-3.5" : "h-3 w-3 mr-2")} /> : <History className={cn(isMobile ? "h-3.5 w-3.5" : "h-3 w-3 mr-2")} />}
                                  {!isMobile && (confirmation?.confirmed ? "Settled" : "Pending")}
                                </Badge>
                              )}
                            </div>
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

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        resourceType="game"
        resourceId={gameId}
        title={`Game Session - ${format(new Date(game.date), "MMM d, yyyy")}`}
        description={`Poker session result for ${format(new Date(game.date), "MMMM d, yyyy")}.`}
      />

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
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block text-left">Amount ({CurrencyConfig.code})</Label>
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
              Commit Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
