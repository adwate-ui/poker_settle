import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trophy,
  Calculator,
  DollarSign,
  Plus,
  UserPlus,
  Trash2,
  Users as UsersIcon,
  Play,
  ChevronDown,
  Search,
  Check,
  TrendingUp,
  Star,
  Loader2,
  History,
  ShieldCheck,
  LayoutDashboard,
  TableProperties,
  Info,
  Calendar
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Game, GamePlayer, Settlement, Player, SeatPosition, TablePosition } from "@/types/poker";
import DashboardPlayerCard from "@/components/DashboardPlayerCard";
import { BuyInManagementTable } from "@/components/BuyInManagementTable";
import { FinalStackManagement } from "@/components/FinalStackManagement";
import { useGameData } from "@/hooks/useGameData";
import { useSharedLink } from "@/hooks/useSharedLink";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notifications";
import { ErrorMessages } from "@/lib/errorUtils";
import { UserProfile } from "@/components/UserProfile";
import { parseIndianNumber, formatInputDisplay, formatProfitLoss } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import TablePositionEditor from "@/components/TablePositionEditor";
import HandTracking from "@/components/HandTracking";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { calculateOptimizedSettlements, PlayerBalance } from "@/features/finance/utils/settlementUtils";
import { useGameRealtime } from "@/features/game/hooks/useGameRealtime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/utils/currencyUtils";
import { PaymentMethodConfig, CurrencyConfig } from "@/config/localization";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game, onBackToSetup }: GameDashboardProps) => {
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState<Game>(game);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>(game.game_players);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const [newTransferFrom, setNewTransferFrom] = useState('');
  const [newTransferTo, setNewTransferTo] = useState('');
  const [newTransferAmount, setNewTransferAmount] = useState('');
  const [showPositionEditor, setShowPositionEditor] = useState(false);
  const [currentTablePosition, setCurrentTablePosition] = useState<TablePosition | null>(null);
  const [positionsJustChanged, setPositionsJustChanged] = useState(false);
  const [handTrackingStage, setHandTrackingStage] = useState<'setup' | 'ready' | 'recording'>('setup');
  const [hasSavedHandState, setHasSavedHandState] = useState(false);
  const [isCompletingGame, setIsCompletingGame] = useState(false);

  // Collapsible sections state
  const [gameStatsOpen, setGameStatsOpen] = useState(true);
  const [tablePositionOpen, setTablePositionOpen] = useState(true);
  const [playersOpen, setPlayersOpen] = useState(true);
  const [buyInLogsOpen, setBuyInLogsOpen] = useState(true);
  const [finalStackLogsOpen, setFinalStackLogsOpen] = useState(true);
  const [settlementsOpen, setSettlementsOpen] = useState(true);

  const { players, updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame, saveTablePosition, getCurrentTablePosition, fetchBuyInHistory } = useGameData();

  const { createOrGetSharedLink, getShortUrl } = useSharedLink();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useGameRealtime(currentGame.id);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);


  // Manual share handler is kept, but auto-replace effect is removed to prevent URL instability
  const handleShare = useCallback(async () => {
    try {
      const linkData = await createOrGetSharedLink('game', currentGame.id);
      if (linkData) {
        const url = getShortUrl(linkData.shortCode);

        if (navigator.share) {
          try {
            await navigator.share({
              title: `Poker Game - ${new Date(currentGame.date).toLocaleDateString()}`,
              text: 'Check out this poker game!',
              url: url
            });
          } catch (error) {
            console.log('Share API failed or cancelled, falling back to copy', error);
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
          }
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        }
      }
    } catch (error) {
      toast.error(ErrorMessages.share.generate(error));
    }
  }, [currentGame.id, currentGame.date, createOrGetSharedLink, getShortUrl]);

  useEffect(() => {
    const loadTablePosition = async () => {
      const position = await getCurrentTablePosition(currentGame.id);
      setCurrentTablePosition(position);

      try {
        const savedHandState = localStorage.getItem(`poker_hand_state_${currentGame.id}`);
        if (savedHandState) {
          const parsedState = JSON.parse(savedHandState);
          const hasSaved = parsedState && parsedState.stage !== 'setup';
          setHasSavedHandState(!!hasSaved);
        } else {
          setHasSavedHandState(false);
        }
      } catch (error) {
        console.error('Error parsing saved hand state:', error);
        setHasSavedHandState(false);
      }

      setHandTrackingStage(prev => {
        if (prev === 'recording') return prev;
        if (position && position.positions.length > 0) {
          return 'ready';
        } else {
          return 'setup';
        }
      });
    };
    loadTablePosition();
  }, [currentGame.id, getCurrentTablePosition]);

  const handlePlayerUpdate = useCallback(async (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn: boolean = false) => {
    // 1. Immediate Optimistic Update
    setGamePlayers(prev => prev.map(gp =>
      gp.id === gamePlayerId ? { ...gp, ...updates } : gp
    ));

    try {
      let resolvedId = gamePlayerId;

      // 2. Smart ID Resolution (The Fix)
      if (gamePlayerId.startsWith("temp-")) {
        const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
        if (gamePlayer) {
          // Fetch the real UUID from the database
          const { data, error } = await supabase
            .from("game_players")
            .select("id")
            .eq("game_id", currentGame.id)
            .eq("player_id", gamePlayer.player_id)
            .maybeSingle();

          if (data?.id) {
            resolvedId = data.id;
            // 3. Self-Correction: Replace temp ID with real ID in local state
            setGamePlayers(prev => prev.map(gp =>
              gp.id === gamePlayerId ? { ...gp, id: resolvedId } : gp
            ));
          }
        }
      }

      // 4. Execute Update with valid UUID
      await updateGamePlayer(resolvedId, updates, logBuyIn);
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error("Failed to sync player data");
    }
  }, [updateGamePlayer, gamePlayers, currentGame.id]);

  const handleAddBuyIn = useCallback(async (gamePlayerId: string, buyInsToAdd: number) => {
    const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
    if (!gamePlayer) return;

    const newTotal = gamePlayer.buy_ins + buyInsToAdd;
    await handlePlayerUpdate(gamePlayerId, {
      buy_ins: newTotal,
      net_amount: (gamePlayer.final_stack || 0) - (newTotal * currentGame.buy_in_amount)
    }, true);
  }, [gamePlayers, currentGame.buy_in_amount, handlePlayerUpdate]);

  const handleUpdateFinalStack = useCallback(async (gamePlayerId: string, finalStack: number) => {
    const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
    if (!gamePlayer) return;

    await handlePlayerUpdate(gamePlayerId, {
      final_stack: finalStack,
      net_amount: finalStack - (gamePlayer.buy_ins * currentGame.buy_in_amount)
    });
  }, [gamePlayers, currentGame.buy_in_amount, handlePlayerUpdate]);

  const addNewPlayer = useCallback(async () => {
    if (!newPlayerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }

    setIsCreatingPlayer(true);
    try {
      const player = await createOrFindPlayer(newPlayerName.trim());
      const gamePlayer = await addPlayerToGame(currentGame.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setNewPlayerName('');
      setShowAddPlayer(false);
      toast.success(`${player.name} added to game`);
    } catch (error) {
      toast.error(ErrorMessages.player.addToGame(error, newPlayerName.trim()));
    } finally {
      setIsCreatingPlayer(false);
    }
  }, [newPlayerName, createOrFindPlayer, currentGame.id, addPlayerToGame, gamePlayers]);

  const addExistingPlayer = useCallback(async (player: Player) => {
    try {
      const gamePlayer = await addPlayerToGame(currentGame.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setShowAddPlayer(false);
      setSearchQuery('');
      toast.success(`${player.name} added to game`);
    } catch (error) {
      toast.error(ErrorMessages.player.addToGame(error, player.name));
    }
  }, [currentGame.id, addPlayerToGame, gamePlayers]);

  const availablePlayers = useMemo(() => {
    return players
      .filter(p => !gamePlayers.find(gp => gp.player_id === p.id))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const gamesCompare = (b.total_games || 0) - (a.total_games || 0);
        return gamesCompare !== 0 ? gamesCompare : a.name.localeCompare(b.name);
      });
  }, [players, gamePlayers, searchQuery]);

  const addManualTransfer = useCallback(async () => {
    if (!newTransferFrom || !newTransferTo || !newTransferAmount || parseFloat(newTransferAmount) <= 0) {
      toast.error("Please fill in sender, recipient, and a valid amount for the transfer.");
      return;
    }

    if (newTransferFrom === newTransferTo) {
      toast.error("Please select different players for sender and recipient.");
      return;
    }

    const newTransfer: Settlement = {
      from: newTransferFrom,
      to: newTransferTo,
      amount: parseFloat(newTransferAmount)
    };

    const updatedSettlements = [...(currentGame.settlements || []), newTransfer];

    const { error } = await supabase
      .from('games')
      .update({ settlements: updatedSettlements as any })
      .eq('id', currentGame.id);

    if (error) {
      toast.error(ErrorMessages.transfer.save(error));
      return;
    }

    setCurrentGame(prev => ({ ...prev, settlements: updatedSettlements }));
    setNewTransferFrom('');
    setNewTransferTo('');
    setNewTransferAmount('');
    setShowManualTransfer(false);
    toast.success("Manual adjustment saved");
  }, [newTransferFrom, newTransferTo, newTransferAmount, currentGame]);

  const handleDeleteManualTransfer = useCallback(async (index: number) => {
    const updatedSettlements = (currentGame.settlements || []).filter((_, i) => i !== index);

    const { error } = await supabase
      .from('games')
      .update({ settlements: updatedSettlements as any })
      .eq('id', currentGame.id);

    if (error) {
      toast.error(ErrorMessages.transfer.delete(error));
      return;
    }

    setCurrentGame(prev => ({ ...prev, settlements: updatedSettlements }));
    toast.info("Adjustment removed");
  }, [currentGame]);

  const settlements = useMemo(() => {
    if (!gamePlayers.length) return [];

    const balances: PlayerBalance[] = gamePlayers.map(gp => ({
      name: gp.player.name,
      amount: gp.net_amount || 0,
      paymentPreference: gp.player.payment_preference || PaymentMethodConfig.digital.key
    }));

    return calculateOptimizedSettlements(balances, currentGame.settlements || []);
  }, [gamePlayers, currentGame.settlements]);

  const handleCompleteGame = useCallback(async () => {
    if (isCompletingGame) return;

    setIsCompletingGame(true);
    const allSettlements = [...(currentGame.settlements || []), ...settlements];

    try {
      await completeGame(currentGame.id, allSettlements);
      toast.success("Game finalized successfully");
      navigate(`/games/${currentGame.id}`);
    } catch (error) {
      toast.error(ErrorMessages.game.complete(error));
      setIsCompletingGame(false);
    }
  }, [currentGame, settlements, completeGame, navigate, isCompletingGame]);

  const handleSaveTablePosition = useCallback(async (positions: SeatPosition[]) => {
    try {
      const savedPosition = await saveTablePosition(currentGame.id, positions);
      setCurrentTablePosition(savedPosition);
      setShowPositionEditor(false);
      setPositionsJustChanged(true);
      setHandTrackingStage('ready');
      toast.success("Seating saved");

      setTimeout(() => setPositionsJustChanged(false), 2000);
    } catch (error) {
      toast.error("Failed to save seating");
    }
  }, [currentGame.id, saveTablePosition]);

  const handleStartHandTracking = useCallback(() => {
    setHandTrackingStage('recording');
    setTablePositionOpen(false);
  }, []);

  const handleHandComplete = useCallback(() => {
    setHandTrackingStage('ready');
    setTablePositionOpen(true);

    try {
      const savedHandState = localStorage.getItem(`poker_hand_state_${currentGame.id}`);
      if (savedHandState) {
        const parsedState = JSON.parse(savedHandState);
        const hasSaved = parsedState && parsedState.stage !== 'setup';
        setHasSavedHandState(!!hasSaved);
      } else {
        setHasSavedHandState(false);
      }
    } catch (error) {
      console.error('Error checking archive state:', error);
      setHasSavedHandState(false);
    }
  }, [currentGame.id]);

  // use memoized or config-based currency formatting instead of hardcoded helper

  const totalBuyIns = useMemo(() =>
    gamePlayers.reduce((sum, gp) => sum + (gp.buy_ins * currentGame.buy_in_amount), 0),
    [gamePlayers, currentGame.buy_in_amount]
  );

  const totalWinnings = useMemo(() =>
    gamePlayers.reduce((sum, gp) => sum + Math.max(0, gp.net_amount || 0), 0),
    [gamePlayers]
  );

  const totalLosses = useMemo(() =>
    gamePlayers.reduce((sum, gp) => sum + Math.min(0, gp.net_amount || 0), 0),
    [gamePlayers]
  );

  const totalFinalStack = useMemo(() =>
    gamePlayers.reduce((sum, gp) => sum + (gp.final_stack || 0), 0),
    [gamePlayers]
  );

  const isBalanced = useMemo(() =>
    Math.abs(totalWinnings + totalLosses) < 0.01,
    [totalWinnings, totalLosses]
  );

  const isStackBalanced = useMemo(() =>
    Math.abs(totalFinalStack - totalBuyIns) < 0.01,
    [totalFinalStack, totalBuyIns]
  );

  const canCompleteGame = useMemo(() =>
    isBalanced && isStackBalanced,
    [isBalanced, isStackBalanced]
  );

  const hasDiscrepancies = useMemo(() =>
    !isBalanced || !isStackBalanced,
    [isBalanced, isStackBalanced]
  );

  return (
    <div className={cn(
      "min-h-screen animate-in fade-in duration-700",
      isMobile ? "p-0 pb-20" : "p-4 sm:p-8"
    )}>
      <div className={cn(
        "mx-auto space-y-8",
        isMobile ? "w-full" : "max-w-[1600px]"
      )}>
        {/* Header Section - Hidden on mobile Table tab */}
        {!isMobile && (
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
              <Button
                onClick={onBackToSetup}
                variant="ghost"
                className="h-11 px-5 border border-border bg-accent/5 hover:bg-accent/10 text-muted-foreground text-label rounded-lg transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                Back
              </Button>

              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-luxury luxury-text tracking-tight text-foreground mb-1">
                  Game Dashboard
                </h1>
                <p className="text-muted-foreground font-numbers text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Buy-in: {formatCurrency(currentGame.buy_in_amount)}</span>
                  <span className="w-1 h-1 rounded-full bg-gold-500/30" />
                  <span>{new Date(currentGame.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {isMobile ? (
          <div className="flex flex-col w-full min-h-screen bg-background">
            {/* Sticky Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-2 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToSetup}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <span className="text-xs font-luxury uppercase tracking-widest text-muted-foreground leading-none mb-1">
                  Buy-in: {formatCurrency(currentGame.buy_in_amount)}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-numbers">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(currentGame.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-300",
                        currentSlide === i ? "bg-primary w-3" : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Carousel Content */}
            <div className="mt-[57px] flex-1 overflow-hidden">
              <Carousel setApi={setApi} className="w-full">
                <CarouselContent className="ml-0">
                  {/* Slide 1: Table & Seating */}
                  <CarouselItem className="pl-0 h-[calc(100vh-57px-env(safe-area-inset-bottom))] overflow-y-auto">
                    <div className="p-0 space-y-4 pb-12">
                      {showPositionEditor ? (
                        <div className="p-4">
                          <TablePositionEditor
                            players={gamePlayers.map(gp => gp.player)}
                            currentPositions={currentTablePosition?.positions || []}
                            onSave={handleSaveTablePosition}
                            onCancel={() => setShowPositionEditor(false)}
                          />
                        </div>
                      ) : handTrackingStage === 'recording' ? (
                        <HandTracking
                          game={game}
                          positionsJustChanged={positionsJustChanged}
                          onHandComplete={handleHandComplete}
                          initialSeatPositions={currentTablePosition?.positions || []}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="relative aspect-[4/3] bg-white/40 dark:bg-black/40 overflow-hidden shadow-inner border-y border-border">
                            {currentTablePosition && currentTablePosition.positions.length > 0 ? (
                              <PokerTableView
                                positions={currentTablePosition.positions}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center p-8">
                                <Button
                                  onClick={() => setShowPositionEditor(true)}
                                  className="h-14 px-10 bg-accent/5 dark:bg-white/5 border border-border text-muted-foreground font-luxury uppercase tracking-widest text-xs"
                                >
                                  Setup Seating
                                </Button>
                              </div>
                            )}
                          </div>

                          {currentTablePosition && currentTablePosition.positions.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 w-full px-4">
                              <Button
                                onClick={() => setShowPositionEditor(true)}
                                variant="ghost"
                                className="flex-1 h-12 border border-border text-muted-foreground text-label"
                              >
                                Edit Seating
                              </Button>
                              <Button
                                onClick={handleStartHandTracking}
                                className="flex-1 h-12 bg-gold-600 text-black text-label rounded-xl"
                              >
                                {hasSavedHandState ? 'Resume' : 'Record Hand'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CarouselItem>

                  {/* Slide 2: Actions */}
                  <CarouselItem className="pl-0 h-[calc(100vh-57px-env(safe-area-inset-bottom))] overflow-y-auto">
                    <div className="p-2 space-y-6 pb-20">
                      <BuyInManagementTable
                        gamePlayers={gamePlayers}
                        buyInAmount={currentGame.buy_in_amount}
                        onAddBuyIn={handleAddBuyIn}
                        fetchBuyInHistory={fetchBuyInHistory}
                      />
                      <div className="border-t border-white/5 pt-6">
                        <FinalStackManagement
                          gamePlayers={gamePlayers}
                          onUpdateFinalStack={handleUpdateFinalStack}
                          smallBlind={currentGame.small_blind}
                        />
                      </div>
                    </div>
                  </CarouselItem>

                  {/* Slide 3: Info & Settlements */}
                  <CarouselItem className="pl-0 h-[calc(100vh-57px-env(safe-area-inset-bottom))] overflow-y-auto">
                    <div className="p-4 space-y-6 pb-24">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest leading-none">Players ({gamePlayers.length})</h3>
                        <Button
                          onClick={() => setShowAddPlayer(true)}
                          className="h-9 px-4 bg-accent/5 border border-border text-foreground text-label flex items-center"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-2" />
                          Add
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
                          <DashboardPlayerCard
                            key={gamePlayer.id}
                            gamePlayer={gamePlayer}
                            buyInAmount={currentGame.buy_in_amount}
                            isLiveGame={true}
                          />
                        ))}
                      </div>

                      {currentGame.settlements && currentGame.settlements.length > 0 && (
                        <div className="space-y-3 pt-6 border-t border-border">
                          <h3 className="text-xs font-luxury text-muted-foreground uppercase tracking-widest">Manual Adjustments</h3>
                          <div className="space-y-2">
                            {currentGame.settlements.map((transfer, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-border">
                                <span className="text-[10px] font-luxury text-foreground uppercase tracking-wide">
                                  {transfer.from} pays {transfer.to}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-numbers text-xs text-foreground">{formatCurrency(transfer.amount)}</span>
                                  <Button aria-label="Delete manual transfer" onClick={() => handleDeleteManualTransfer(index)} variant="ghost" size="icon" className="h-7 w-7 text-red-500/50 hover:text-red-500">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pt-6">
                        {settlements.length > 0 && (
                          <Card className={cn("border-border shadow-none bg-accent/2", isMobile ? "border-0 shadow-none bg-transparent" : "")}>
                            <CardHeader className={cn(isMobile ? "py-2 px-1" : "py-4 px-4")}>
                              <CardTitle className={cn("text-sm uppercase tracking-widest font-luxury", isMobile ? "text-xs" : "")}>Settlement</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto w-full">
                                <Table className={cn(isMobile && "table-fixed w-full")}>
                                  <TableHeader className="bg-muted/30">
                                    <TableRow className={cn("hover:bg-transparent border-border", isMobile ? "h-8" : "")}>
                                      <TableHead className={cn("px-4 uppercase font-luxury", isMobile ? "h-8 px-2 w-[30%] text-mobile-compact" : "h-9 text-[10px]")}>From</TableHead>
                                      <TableHead className={cn("px-4 uppercase font-luxury", isMobile ? "h-8 px-2 w-[30%] text-mobile-compact" : "h-9 text-[10px]")}>To</TableHead>
                                      <TableHead className={cn("px-4 text-right uppercase font-luxury", isMobile ? "h-8 px-2 w-[40%] text-mobile-compact" : "h-9 text-[10px]")}>Amount</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {settlements.map((s, i) => (
                                      <TableRow key={i} className={cn("border-border hover:bg-transparent", isMobile ? "h-8" : "")}>
                                        <TableCell className={cn("font-medium truncate", isMobile ? "py-1 px-2 text-mobile-compact" : "py-2 px-4 text-[11px] max-w-[80px]")}>
                                          {s.from}
                                        </TableCell>
                                        <TableCell className={cn("font-medium truncate", isMobile ? "py-1 px-2 text-mobile-compact" : "py-2 px-4 text-[11px] max-w-[80px]")}>
                                          {s.to}
                                        </TableCell>
                                        <TableCell className={cn("text-right font-numbers whitespace-nowrap", isMobile ? "py-1 px-2 text-mobile-compact" : "py-2 px-4 text-[11px]")}>
                                          {formatCurrency(s.amount)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Button
                          onClick={handleCompleteGame}
                          disabled={!canCompleteGame || isCompletingGame}
                          className={cn(
                            "w-full h-14 rounded-xl font-luxury uppercase tracking-widest text-[11px] transition-all",
                            canCompleteGame ? "bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-lg" : "bg-accent/5 text-muted-foreground/20"
                          )}
                        >
                          {isCompletingGame ? <Loader2 className="h-5 w-5 animate-spin" /> : 'End Game'}
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Player</DialogTitle>
                  <DialogDescription>
                    Search for an existing player or create a new one.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="existing" className="space-y-6">
                  <TabsList className="bg-muted border border-border p-1 h-12 rounded-xl grid grid-cols-2">
                    <TabsTrigger value="existing" className="text-label data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Search</TabsTrigger>
                    <TabsTrigger value="new" className="text-label data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">New</TabsTrigger>
                  </TabsList>
                  <TabsContent value="existing" className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="luxury"
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {availablePlayers.map(p => (
                          <Button key={p.id} onClick={() => addExistingPlayer(p)} variant="ghost" className="w-full p-4 h-auto rounded-xl border border-border bg-accent/5 justify-start gap-3">
                            <OptimizedAvatar name={p.name} size="sm" />
                            <span className="uppercase text-xs font-medium">{p.name}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="new" className="space-y-6">
                    <Input
                      placeholder="Enter name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      variant="luxury"
                    />
                    <Button
                      onClick={addNewPlayer}
                      disabled={!newPlayerName.trim() || isCreatingPlayer}
                      className="w-full h-14 font-bold uppercase tracking-widest text-[11px] rounded-xl"
                    >
                      Add New Player
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          /* Main 2-Column Layout (Desktop) */
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Left Column (70%) - Central Gameplay Elements */}
            <div className="lg:col-span-7 space-y-8">

              {/* Game Summary */}
              <Card className="p-0 overflow-hidden">
                <Collapsible open={gameStatsOpen} onOpenChange={setGameStatsOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Game Stats</h3>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", gameStatsOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2 p-5 rounded-2xl bg-accent/5 border border-border transition-all group hover:border-primary/20">
                        <p className="text-[10px] text-muted-foreground font-luxury tracking-[0.2em] uppercase">Total Buy-ins</p>
                        <p className="text-2xl font-numbers text-foreground">{formatCurrency(totalBuyIns)}</p>
                      </div>
                      <div className="space-y-2 p-5 rounded-2xl bg-accent/5 border border-border transition-all group hover:border-primary/20">
                        <p className="text-[10px] text-muted-foreground font-luxury tracking-[0.2em] uppercase">Chips in Play</p>
                        <p className="text-2xl font-numbers text-foreground">{formatCurrency(totalFinalStack)}</p>
                      </div>
                      <div className="space-y-2 p-5 rounded-2xl bg-accent/5 border border-border transition-all group hover:border-primary/20">
                        <p className="text-[10px] text-muted-foreground font-luxury tracking-[0.2em] uppercase">Players</p>
                        <p className="text-2xl font-numbers text-foreground">{gamePlayers.length}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Unified Table Position & Hand Tracking Section */}
              {handTrackingStage === 'recording' ? (
                <HandTracking
                  game={game}
                  positionsJustChanged={positionsJustChanged}
                  onHandComplete={handleHandComplete}
                  initialSeatPositions={currentTablePosition?.positions || []}
                />
              ) : showPositionEditor ? (
                <Card className="p-0 overflow-hidden border-gold-500/30">
                  <TablePositionEditor
                    players={gamePlayers.map(gp => gp.player)}
                    currentPositions={currentTablePosition?.positions || []}
                    onSave={handleSaveTablePosition}
                    onCancel={() => setShowPositionEditor(false)}
                  />
                </Card>
              ) : handTrackingStage === 'ready' && currentTablePosition && currentTablePosition.positions.length > 0 ? (
                <Card className="p-0 overflow-hidden">
                  <Collapsible open={tablePositionOpen} onOpenChange={setTablePositionOpen}>
                    <CollapsibleTrigger asChild>
                      <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <UsersIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Seating</h3>
                        </div>
                        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", tablePositionOpen && "rotate-180")} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="relative rounded-3xl overflow-hidden bg-white/40 dark:bg-black/40 border border-gold-900/10 dark:border-white/5 p-10 pt-12 shadow-inner">
                          <PokerTableView
                            positions={currentTablePosition.positions}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            onClick={() => setShowPositionEditor(true)}
                            variant="ghost"
                            className="flex-1 h-14 border border-border bg-accent/5 hover:bg-accent/10 text-muted-foreground font-luxury uppercase tracking-widest text-[11px] rounded-xl transition-all"
                          >
                            Edit Seating
                          </Button>
                          <Button
                            onClick={handleStartHandTracking}
                            className="flex-1 h-14 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-luxury uppercase tracking-widest text-[11px] rounded-xl shadow-xl shadow-gold-900/10 transition-all"
                          >
                            <Play className="w-4 h-4 mr-3 fill-current" />
                            {hasSavedHandState ? 'Resume Hand' : 'Start Hand'}
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ) : (
                <Card className="p-12 border-dashed border-border bg-accent/5">
                  <div className="text-center space-y-8">
                    <div className="mx-auto w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center border border-border shadow-inner">
                      <UsersIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-luxury text-foreground uppercase tracking-widest leading-none">Setup Seating</h3>
                      <p className="text-[11px] font-luxury text-muted-foreground uppercase tracking-[0.2em] max-w-xs mx-auto">Establish the table arrangement to begin.</p>
                    </div>
                    <Button
                      onClick={() => setShowPositionEditor(true)}
                      className="h-14 px-10 bg-accent/5 border border-border hover:bg-accent/10 text-primary font-luxury uppercase tracking-[.2em] text-xs transition-all rounded-xl"
                    >
                      <UsersIcon className="w-4 h-4 mr-3" />
                      Save Seating
                    </Button>
                  </div>
                </Card>
              )}

              {/* Buy-in Logs */}
              <Card className="p-0 overflow-hidden">
                <Collapsible open={buyInLogsOpen} onOpenChange={setBuyInLogsOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Buy-ins</h3>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", buyInLogsOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                      <BuyInManagementTable
                        gamePlayers={gamePlayers}
                        buyInAmount={currentGame.buy_in_amount}
                        onAddBuyIn={handleAddBuyIn}
                        fetchBuyInHistory={fetchBuyInHistory}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Final Stack Logs */}
              <Card className="p-0 overflow-hidden">
                <Collapsible open={finalStackLogsOpen} onOpenChange={setFinalStackLogsOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Final Stacks</h3>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", finalStackLogsOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                      <FinalStackManagement
                        gamePlayers={gamePlayers}
                        onUpdateFinalStack={handleUpdateFinalStack}
                        smallBlind={currentGame.small_blind}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>

            {/* Right Column (30%) - Controls & Administration */}
            <div className="lg:col-span-3 space-y-8">

              {/* Players Section */}
              <Card className="p-0 overflow-hidden">
                <Collapsible open={playersOpen} onOpenChange={setPlayersOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 border-b border-border/50 cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <UsersIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <h3 className="text-sm font-luxury text-foreground uppercase tracking-widest">Players ({gamePlayers.length})</h3>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", playersOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full h-12 bg-accent/5 border border-border hover:bg-primary/10 text-foreground text-label rounded-xl transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-2.5 text-gold-500" />
                            Add Player
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90vw] sm:max-w-xl p-0 overflow-hidden">
                          <DialogHeader className="p-8 border-b border-border">
                            <DialogTitle className="text-xl font-bold uppercase tracking-widest">Add New Player</DialogTitle>
                            <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Select existing or add new.</DialogDescription>
                          </DialogHeader>

                          <div className="p-8">
                            <Tabs defaultValue="existing" className="space-y-8">
                              <TabsList className="bg-muted border border-border p-1 h-12 rounded-xl grid grid-cols-2">
                                <TabsTrigger value="existing" className="text-label data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Search Existing</TabsTrigger>
                                <TabsTrigger value="new" className="text-label data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">New Player</TabsTrigger>
                              </TabsList>

                              <TabsContent value="existing" className="space-y-6 animate-in fade-in duration-300">
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                  </div>
                                  <Input
                                    placeholder="Search players..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all tracking-widest text-[11px] uppercase text-foreground placeholder:text-muted-foreground/30"
                                  />
                                </div>

                                <ScrollArea className="h-[350px] pr-4">
                                  <div className="space-y-3">
                                    {availablePlayers.length > 0 ? (
                                      availablePlayers.map((player) => (
                                        <button
                                          key={player.id}
                                          onClick={() => addExistingPlayer(player)}
                                          className="w-full text-left p-4 rounded-2xl border border-border bg-accent/2 hover:bg-primary/5 hover:border-primary/20 transition-all group flex items-center gap-4"
                                        >
                                          <OptimizedAvatar name={player.name} size="md" className="ring-1 ring-primary/20" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-bold uppercase tracking-widest truncate">{player.name}</span>
                                              {player.total_games && player.total_games > 10 && <Star className="h-3 w-3 text-primary fill-current" />}
                                            </div>
                                            <div className="flex gap-2.5 mt-1.5">
                                              <Badge variant="stats">
                                                {player.total_games || 0} SESSIONS
                                              </Badge>
                                              {player.total_profit !== undefined && (
                                                <Badge variant={player.total_profit >= 0 ? "profit" : "loss"}>
                                                  {formatProfitLoss(player.total_profit)}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      ))
                                    ) : (
                                      <div className="py-20 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/5 dark:bg-white/2">
                                        <p className="text-[10px] font-luxury uppercase tracking-[0.2em] text-black/20 dark:text-white/20">No players found.</p>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </TabsContent>

                              <TabsContent value="new" className="space-y-8 animate-in fade-in duration-300">
                                <div className="space-y-3">
                                  <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-muted-foreground ml-1">Player Name</Label>
                                  <Input
                                    placeholder="Enter name"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    className="h-14 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all font-luxury tracking-widest text-[13px] uppercase text-foreground placeholder:text-muted-foreground/30"
                                    onKeyPress={(e) => e.key === 'Enter' && !isCreatingPlayer && addNewPlayer()}
                                    autoFocus
                                  />
                                </div>
                                <Button
                                  onClick={addNewPlayer}
                                  disabled={!newPlayerName.trim() || isCreatingPlayer}
                                  className="w-full h-14 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-luxury uppercase tracking-widest text-[11px] rounded-xl shadow-xl shadow-gold-900/10 transition-all"
                                >
                                  {isCreatingPlayer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Player'}
                                </Button>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="space-y-4">
                        {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
                          <DashboardPlayerCard
                            key={gamePlayer.id}
                            gamePlayer={gamePlayer}
                            buyInAmount={currentGame.buy_in_amount}
                            isLiveGame={true}
                          />
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Manual Transfers */}
              {currentGame.settlements && currentGame.settlements.length > 0 && (
                <Card className="p-0 overflow-hidden bg-background">
                  <div className="p-4 border-b border-white/10 bg-accent/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-gold-500" />
                      <h3 className="text-[10px] font-luxury text-foreground uppercase tracking-[0.2em]">Manual Adjustments</h3>
                    </div>
                  </div>
                  <Table className="table-fixed w-full text-left border-collapse">
                    <TableHeader>
                      <TableRow className="border-b border-white/10 hover:bg-transparent">
                        <TableHead className="w-[35%] pl-4 py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">From</TableHead>
                        <TableHead className="w-[35%] px-1 py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">To</TableHead>
                        <TableHead className="w-[30%] pr-4 py-2 text-right text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">Amt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentGame.settlements.map((transfer, index) => (
                        <TableRow key={index} className="border-b border-white/5 hover:bg-white/5 h-11">
                          <TableCell className="pl-4 py-1 font-medium text-[11px] truncate text-foreground">
                            {transfer.from}
                          </TableCell>
                          <TableCell className="px-1 py-1 font-medium text-[11px] truncate text-muted-foreground">
                            {transfer.to}
                          </TableCell>
                          <TableCell className="pr-4 py-1 text-right font-numbers text-[11px] whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-foreground">{formatCurrency(transfer.amount)}</span>
                              <button
                                onClick={() => handleDeleteManualTransfer(index)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500/20 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {/* Add Manual Transfer Form */}
              {showManualTransfer && (
                <Card className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Manual Adjustment</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">From Player</Label>
                        <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player..." />
                          </SelectTrigger>
                          <SelectContent>
                            {gamePlayers.map(gp => (
                              <SelectItem key={`from-${gp.id}`} value={gp.player.name}>
                                {gp.player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">To Player</Label>
                        <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player..." />
                          </SelectTrigger>
                          <SelectContent>
                            {gamePlayers.map(gp => (
                              <SelectItem key={`to-${gp.id}`} value={gp.player.name}>
                                {gp.player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">Amount ({CurrencyConfig.code})</Label>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={newTransferAmount}
                        onChange={(e) => setNewTransferAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowManualTransfer(false)} className="flex-1">Cancel</Button>
                    <Button onClick={addManualTransfer} className="flex-1">Add Adjustment</Button>
                  </div>
                </Card>
              )}

              {/* Final Actions Container */}
              {/* Final Actions & Validation */}
              <div className="space-y-5 pt-4">
                {hasDiscrepancies ? (
                  <Card className="bg-state-error/10 border-state-error/20 p-6 space-y-4">
                    <div className="flex items-center gap-3 border-b border-state-error/20 pb-4">
                      <ShieldCheck className="h-5 w-5 text-state-error" />
                      <h3 className="text-state-error font-luxury uppercase tracking-widest text-sm">Action Required</h3>
                    </div>
                    <div className="space-y-3">
                      {!isStackBalanced && (
                        <p className="text-xs text-state-error/80 leading-relaxed font-medium">
                          <span className="font-bold uppercase tracking-wider block mb-1 opacity-80">Chip Mismatch</span>
                          The final chips on the table ({formatCurrency(totalFinalStack)}) do not match the total buy-ins ({formatCurrency(totalBuyIns)}).
                        </p>
                      )}
                      {!isBalanced && (
                        <p className="text-xs text-state-error/80 leading-relaxed font-medium">
                          <span className="font-bold uppercase tracking-wider block mb-1 opacity-80">Accounting Mismatch</span>
                          The total winnings do not equal the total losses. The numbers don't add up to zero.
                        </p>
                      )}
                    </div>
                  </Card>
                ) : (
                  <>
                    <div className="flex flex-col gap-4">
                      {!showManualTransfer && (
                        <Button
                          onClick={() => setShowManualTransfer(true)}
                          disabled={!canCompleteGame}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Manual Adjustment
                        </Button>
                      )}

                      <Button
                        onClick={handleCompleteGame}
                        disabled={!canCompleteGame || isCompletingGame}
                        className={cn(
                          "w-full h-20 text-black font-black text-xl tracking-tighter rounded-2xl transition-all relative overflow-hidden group",
                          canCompleteGame && !isCompletingGame
                            ? 'bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 bg-[length:200%_100%] animate-shimmer hover:shadow-[0_0_50px_rgba(212,184,60,0.3)] active:scale-95'
                            : 'bg-black/5 dark:bg-white/5 text-black/10 dark:text-white/10 opacity-50'
                        )}
                      >
                        {isCompletingGame ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                          <div className="flex items-center justify-center gap-4">
                            <Trophy className="w-7 h-7 fill-current" />
                            <span className="font-luxury uppercase tracking-[0.2em] text-lg">End Game</span>
                          </div>
                        )}
                      </Button>
                    </div>

                    {/* Settlements Display - Only shown when clean */}
                    {settlements.length > 0 && (
                      <Card className="p-0 overflow-hidden border-gold-500/40 shadow-[0_0_40px_rgba(212,184,60,0.1)]">
                        <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
                          <CollapsibleTrigger asChild>
                            <div className="p-6 border-b border-border/50 bg-accent/5 cursor-pointer flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest">Settlements</h3>
                              </div>
                              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", settlementsOpen && "rotate-180")} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                              {settlements.map((settlement, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-border hover:border-primary/20 transition-colors group">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-luxury uppercase tracking-widest text-muted-foreground">Payment</span>
                                    <span className="text-xs font-luxury text-foreground uppercase tracking-widest">
                                      {settlement.from} <span className="opacity-30 inline-block px-1">pays</span> {settlement.to}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-numbers text-base text-foreground">
                                      {formatCurrency(settlement.amount)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;
