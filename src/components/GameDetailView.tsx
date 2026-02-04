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
import { ChevronLeft, ChevronRight, Share2, ArrowLeft, ArrowRight, RefreshCw, Plus, Trash2, ChevronDown, Check, X, Calendar, User, Coins, TrendingUp, History, ShieldCheck, CreditCard, Loader2, Download, FileText, Printer } from "lucide-react";
import { exportGameDetailsToCSV, printGameReport } from "@/lib/exportUtils";
import { Game as GameType } from "@/types/poker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useGameRealtime } from "@/features/game/hooks/useGameRealtime";
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
  useGameRealtime(gameId);

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

  const playerBalances = useMemo((): PlayerBalance[] => {
    return sortedGamePlayers.map(gp => ({
      name: gp.players?.name ?? "",
      amount: gp.net_amount ?? 0,
      paymentPreference: (gp.players as any)?.payment_preference || 'upi',
    }));
  }, [sortedGamePlayers]);


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

    // 4. Calculate new auto-settlements with all manual transfers
    const newAutoSettlements = calculateOptimizedSettlements(playerBalances, allManuals);
    const autoSettlementsWithFlag = newAutoSettlements.map(({ from, to, amount }) => ({
      from,
      to,
      amount,
      isManual: false
    }));

    // 5. Merge: manuals first, then autos
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

    // 3. Recalculate auto-settlements with remaining manual transfers
    const newAutoSettlements = calculateOptimizedSettlements(playerBalances, remainingManuals);
    const autoSettlementsWithFlag = newAutoSettlements.map(({ from, to, amount }) => ({
      from,
      to,
      amount,
      isManual: false
    }));

    // 4. Merge and save
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
    // If settlements exist in DB (even if just manual ones), use them
    if (savedSettlements && savedSettlements.length > 0) {
      return savedSettlements.map(s => ({
        ...s,
        isManual: s.isManual ?? false
      }));
    }

    // Fallback: Calculate optimized settlements on the fly if none are saved
    const calculated = calculateOptimizedSettlements(playerBalances, []);
    return calculated.map(s => ({
      ...s,
      isManual: false
    }));
  }, [savedSettlements, playerBalances]);

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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const gameForExport: GameType = {
                      id: game.id,
                      date: game.date,
                      buy_in_amount: game.buy_in_amount,
                      is_complete: true,
                      settlements: game.settlements,
                      game_players: gamePlayers.map(gp => ({
                        id: gp.id,
                        game_id: game.id,
                        player_id: gp.player_id,
                        buy_ins: gp.buy_ins,
                        final_stack: gp.final_stack || 0,
                        net_amount: gp.net_amount || 0,
                        player: {
                          id: gp.player_id,
                          name: gp.players?.name || 'Unknown',
                          total_games: 0,
                          total_profit: 0,
                        }
                      }))
                    };
                    exportGameDetailsToCSV(gameForExport);
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const gameForPrint: GameType = {
                      id: game.id,
                      date: game.date,
                      buy_in_amount: game.buy_in_amount,
                      is_complete: true,
                      settlements: game.settlements,
                      game_players: gamePlayers.map(gp => ({
                        id: gp.id,
                        game_id: game.id,
                        player_id: gp.player_id,
                        buy_ins: gp.buy_ins,
                        final_stack: gp.final_stack || 0,
                        net_amount: gp.net_amount || 0,
                        player: {
                          id: gp.player_id,
                          name: gp.players?.name || 'Unknown',
                          total_games: 0,
                          total_profit: 0,
                        }
                      }))
                    };
                    printGameReport(gameForPrint);
                  }}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  enableDragDrop={false}
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
                <Table className="table-fixed w-full text-left border-collapse">
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className={cn(
                        "w-[35%] py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                        isMobile ? "pl-2" : "pl-6"
                      )}>
                        {isMobile ? "Player" : "Player"}
                      </TableHead>
                      <TableHead className="w-[15%] px-1 py-2 text-center text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">
                        {isMobile ? "Buys" : "Buy-ins"}
                      </TableHead>
                      <TableHead className="w-[25%] px-1 py-2 text-center text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">
                        {isMobile ? "P&L" : "P&L"}
                      </TableHead>
                      <TableHead className={cn(
                        "w-[25%] py-2 text-center text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                        !isMobile || !(showOwnerControls && fetchBuyInHistory) ? "pr-2" : "px-1"
                      )}>
                        {isMobile ? "Cash" : "Cashout"}
                      </TableHead>
                      {showOwnerControls && fetchBuyInHistory && (
                        <TableHead className={cn(
                          "text-right py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                          isMobile ? "w-[15%] pr-2" : "pr-6"
                        )}>
                          {isMobile ? "Hist" : "Audit"}
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
                        <TableRow key={gamePlayer.id} className={cn("border-b border-white/5 hover:bg-white/5", isMobile ? "h-11" : "")}>
                          <TableCell className={cn("py-2.5", isMobile ? "pl-2 font-medium text-[11px] truncate text-foreground" : "pl-6")}>
                            <Link
                              to={gamePlayer.player_id ? `/players/${gamePlayer.player_id}` : '#'}
                              className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate"
                            >
                              {playerName}
                            </Link>
                          </TableCell>
                          <TableCell className={cn("px-1 py-1 text-center font-numbers whitespace-nowrap", isMobile ? "text-[11px] text-muted-foreground" : "")}>
                            <Badge variant="outline" className={cn(isMobile ? "px-1 py-0 text-[10px] h-4 min-w-[16px] border-white/10" : "")}>
                              {gamePlayer.buy_ins}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("px-1 py-1 text-center font-numbers whitespace-nowrap", isMobile ? "text-[11px]" : "")}>
                            <div className="flex justify-center">
                              <Badge
                                variant={isWin ? "profit" : "loss"}
                                className={cn(isMobile ? "h-5 px-1.5 text-[9px]" : "")}
                              >
                                {formatProfitLoss(netAmount)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className={cn("py-1 text-center font-numbers whitespace-nowrap text-foreground", isMobile ? "text-[11px] px-1" : "")}>
                            {formatCurrency(finalStack)}
                          </TableCell>
                          {showOwnerControls && fetchBuyInHistory && (
                            <TableCell className={cn("text-right py-1", isMobile ? "pr-2 px-1" : "pr-6")}>
                              <BuyInHistoryDialog
                                gamePlayerId={gamePlayer.id}
                                playerName={playerName}
                                fetchHistory={fetchBuyInHistory}
                                triggerProps={{
                                  size: isMobile ? "icon-sm" : "icon",
                                  className: cn(isMobile && "h-7 w-7 opacity-70 hover:opacity-100 transition-opacity")
                                }}
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
                <Table className="table-fixed w-full text-left border-collapse">
                  <TableHeader className="bg-muted/50 border-b border-white/10 sticky top-0 z-10 bg-card">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className={cn(
                        "w-[30%] py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                        isMobile ? "pl-2" : "pl-8"
                      )}>
                        From
                      </TableHead>
                      <TableHead className="w-[30%] px-1 py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">To</TableHead>
                      <TableHead className="w-[25%] px-1 py-2 text-right text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">{isMobile ? "Amt" : "Amount"}</TableHead>
                      <TableHead className={cn(
                        "text-right py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                        isMobile ? "w-[15%] pr-2" : "pr-8"
                      )}>{isMobile ? "Sts" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {settlementsWithType.map((settlement, index) => {
                      const confirmation = getConfirmationStatus(confirmations, settlement.from, settlement.to);
                      return (
                        <TableRow key={`settlement-${index}`} className={cn("border-b border-white/5 hover:bg-white/5", isMobile ? "h-11" : "h-12 sm:h-14", "group")}>
                          <TableCell className={cn("py-2.5", isMobile ? "pl-2 font-medium text-[11px] truncate text-foreground" : "pl-4 sm:pl-8")}>
                            <div className="flex items-center gap-1 sm:gap-3">
                              {!isMobile && <User className="h-3 w-3 text-muted-foreground" />}
                              <Link
                                to={nameToIdMap[settlement.from] ? `/players/${nameToIdMap[settlement.from]}` : '#'}
                                className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate"
                              >
                                {settlement.from}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className={cn("py-2.5 px-1", isMobile ? "font-medium text-[11px] truncate text-muted-foreground" : "")}>
                            <div className="flex items-center gap-1 sm:gap-3">
                              {!isMobile && <CreditCard className="h-3 w-3 text-muted-foreground" />}
                              <Link
                                to={nameToIdMap[settlement.to] ? `/players/${nameToIdMap[settlement.to]}` : '#'}
                                className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all block truncate"
                              >
                                {settlement.to}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-right py-1 font-numbers whitespace-nowrap px-1", isMobile ? "text-[11px]" : "")}>
                            <span className="font-medium">
                              {formatCurrency(settlement.amount)}
                            </span>
                            {settlement.isManual && (
                              <Badge variant="outline" className={cn("ml-1 border-white/10", isMobile ? "px-0.5 py-0 text-[8px] min-w-[12px] h-3 flex items-center justify-center inline-flex" : "ml-3")}>
                                {isMobile ? "M" : "Manual"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={cn("text-right py-1", isMobile ? "pr-2 pl-1" : "pr-8")}>
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
                                    isMobile ? "h-6 w-6 rounded-md shadow-sm p-0" : "h-8 px-4 rounded-full text-xs border transition-all",
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
                                  isMobile ? "h-5 w-5 p-0 flex items-center justify-center" : "h-7 px-3 text-[10px]",
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
