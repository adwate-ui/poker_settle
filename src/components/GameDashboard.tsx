import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TextInput, Badge, Collapse, Select, Modal, Tabs, ScrollArea, ActionIcon, Stack, Group, Text, Loader } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Calculator, DollarSign, Plus, UserPlus, Trash2, Users as UsersIcon, Play, ChevronDown, ChevronUp, Search, Check, TrendingUp, TrendingDown, Star, Share2 } from "lucide-react";
import { Game, GamePlayer, Settlement, Player, SeatPosition, TablePosition } from "@/types/poker";
import PlayerCard from "@/components/PlayerCard";
import DashboardPlayerCard from "@/components/DashboardPlayerCard";
import { BuyInManagementTable } from "@/components/BuyInManagementTable";
import { FinalStackManagement } from "@/components/FinalStackManagement";
import { useGameData } from "@/hooks/useGameData";
import { useSharedLink } from "@/hooks/useSharedLink";
import { toast } from "@/lib/notifications";
import { UserProfile } from "@/components/UserProfile";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import TablePositionEditor from "@/components/TablePositionEditor";
import HandTracking from "@/components/HandTracking";
import { cn } from "@/lib/utils";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { GlassCard } from "@/components/ui/GlassCard";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game, onBackToSetup }: GameDashboardProps) => {
  const navigate = useNavigate();
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>(game.game_players);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [manualTransfers, setManualTransfers] = useState<Settlement[]>([]);
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
  const [settlementsOpen, setSettlementsOpen] = useState(true);
  const [buyInLogsOpen, setBuyInLogsOpen] = useState(true);
  const [finalStackLogsOpen, setFinalStackLogsOpen] = useState(true);

  const { players, updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame, saveTablePosition, getCurrentTablePosition, fetchBuyInHistory } = useGameData();

  const { createOrGetSharedLink, getShortUrl } = useSharedLink();


  // Manual share handler is kept, but auto-replace effect is removed to prevent URL instability
  const handleShare = useCallback(async () => {
    try {
      const linkData = await createOrGetSharedLink('game', game.id);
      if (linkData) {
        const url = getShortUrl(linkData.shortCode);

        if (navigator.share) {
          try {
            await navigator.share({
              title: `Poker Game - ${new Date(game.date).toLocaleDateString()}`,
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
      toast.error("Failed to generate share link");
    }
  }, [game.id, game.date, createOrGetSharedLink, getShortUrl]);

  useEffect(() => {
    const loadTablePosition = async () => {
      const position = await getCurrentTablePosition(game.id);
      setCurrentTablePosition(position);

      // Check for saved hand state with error handling
      try {
        const savedHandState = localStorage.getItem(`poker_hand_state_${game.id}`);
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

      // Set initial stage based on whether table is set
      // Only update stage if we're not currently recording a hand
      setHandTrackingStage(prev => {
        // Don't change stage if we're in the middle of recording
        if (prev === 'recording') return prev;

        // Otherwise, set based on whether positions exist
        if (position && position.positions.length > 0) {
          return 'ready';
        } else {
          return 'setup';
        }
      });
    };
    loadTablePosition();
  }, [game.id, getCurrentTablePosition]);

  const handlePlayerUpdate = useCallback(async (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn: boolean = false) => {
    try {
      await updateGamePlayer(gamePlayerId, updates, logBuyIn);
      setGamePlayers(prev => prev.map(gp =>
        gp.id === gamePlayerId ? { ...gp, ...updates } : gp
      ));
    } catch (error) {
      console.error('Error updating player:', error);
    }
  }, [updateGamePlayer]);

  const handleAddBuyIn = useCallback(async (gamePlayerId: string, buyInsToAdd: number) => {
    const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
    if (!gamePlayer) return;

    const newTotal = gamePlayer.buy_ins + buyInsToAdd;
    await handlePlayerUpdate(gamePlayerId, {
      buy_ins: newTotal,
      net_amount: (gamePlayer.final_stack || 0) - (newTotal * game.buy_in_amount)
    }, true);
  }, [gamePlayers, game.buy_in_amount, handlePlayerUpdate]);

  const handleUpdateFinalStack = useCallback(async (gamePlayerId: string, finalStack: number) => {
    const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
    if (!gamePlayer) return;

    await handlePlayerUpdate(gamePlayerId, {
      final_stack: finalStack,
      net_amount: finalStack - (gamePlayer.buy_ins * game.buy_in_amount)
    });
  }, [gamePlayers, game.buy_in_amount, handlePlayerUpdate]);

  const addNewPlayer = useCallback(async () => {
    if (!newPlayerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }

    setIsCreatingPlayer(true);
    try {
      const player = await createOrFindPlayer(newPlayerName.trim());
      const gamePlayer = await addPlayerToGame(game.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setNewPlayerName('');
      setShowAddPlayer(false);
      toast.success(`${player.name} added to game`);
    } catch (error) {
      toast.error("Failed to add player");
    } finally {
      setIsCreatingPlayer(false);
    }
  }, [newPlayerName, createOrFindPlayer, game.id, addPlayerToGame, gamePlayers]);

  const addExistingPlayer = useCallback(async (player: Player) => {
    try {
      const gamePlayer = await addPlayerToGame(game.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setShowAddPlayer(false);
      setSearchQuery('');
      toast.success(`${player.name} added to game`);
    } catch (error) {
      toast.error("Failed to add player");
    }
  }, [game.id, addPlayerToGame, gamePlayers]);

  const availablePlayers = useMemo(() => {
    return players
      .filter(p => !gamePlayers.find(gp => gp.player_id === p.id))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // Sort by total games (most active first), then by name
        const gamesCompare = (b.total_games || 0) - (a.total_games || 0);
        return gamesCompare !== 0 ? gamesCompare : a.name.localeCompare(b.name);
      });
  }, [players, gamePlayers, searchQuery]);

  const addManualTransfer = useCallback(() => {
    if (!newTransferFrom || !newTransferTo || !newTransferAmount || parseFloat(newTransferAmount) <= 0) {
      toast.error("Please fill all transfer details");
      return;
    }

    if (newTransferFrom === newTransferTo) {
      toast.error("Cannot transfer to the same player");
      return;
    }

    const newTransfer: Settlement = {
      from: newTransferFrom,
      to: newTransferTo,
      amount: parseFloat(newTransferAmount)
    };

    setManualTransfers([...manualTransfers, newTransfer]);
    setNewTransferFrom('');
    setNewTransferTo('');
    setNewTransferAmount('');
    setShowManualTransfer(false);
    toast.success("Manual transfer added");
  }, [newTransferFrom, newTransferTo, newTransferAmount, manualTransfers]);

  const removeManualTransfer = useCallback((index: number) => {
    setManualTransfers(manualTransfers.filter((_, i) => i !== index));
  }, [manualTransfers]);

  const calculateSettlements = useCallback(() => {
    // Start with player balances
    const playerBalances = gamePlayers.map(gp => ({
      name: gp.player.name,
      balance: gp.net_amount || 0
    }));

    // Apply manual transfers to adjust balances
    manualTransfers.forEach(transfer => {
      const fromPlayer = playerBalances.find(p => p.name === transfer.from);
      const toPlayer = playerBalances.find(p => p.name === transfer.to);

      if (fromPlayer && toPlayer) {
        fromPlayer.balance += transfer.amount; // Debtor pays, so their debt reduces
        toPlayer.balance -= transfer.amount; // Creditor receives, so their credit reduces
      }
    });

    const creditors = playerBalances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = playerBalances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);

    const newSettlements: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0.01) { // Only add if amount is significant
        newSettlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    }

    setSettlements(newSettlements);
  }, [gamePlayers, manualTransfers]);

  const handleCompleteGame = useCallback(async () => {
    if (isCompletingGame) return; // Prevent double-clicks

    setIsCompletingGame(true);

    // Calculate remaining settlements
    const playerBalances = gamePlayers.map(gp => ({
      name: gp.player.name,
      balance: gp.net_amount || 0
    }));

    // Apply manual transfers to adjust balances
    manualTransfers.forEach(transfer => {
      const fromPlayer = playerBalances.find(p => p.name === transfer.from);
      const toPlayer = playerBalances.find(p => p.name === transfer.to);

      if (fromPlayer && toPlayer) {
        fromPlayer.balance += transfer.amount;
        toPlayer.balance -= transfer.amount;
      }
    });

    const creditors = playerBalances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = playerBalances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);

    const calculatedSettlements: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0.01) {
        calculatedSettlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    }

    // Combine manual and calculated settlements
    const allSettlements = [...manualTransfers, ...calculatedSettlements];

    try {
      await completeGame(game.id, allSettlements);
      toast.success("Game completed successfully");

      // Navigate immediately to game details
      navigate(`/games/${game.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete game");
      setIsCompletingGame(false); // Reset on error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePlayers, manualTransfers, completeGame, game.id, navigate]);

  const handleSaveTablePosition = useCallback(async (positions: SeatPosition[]) => {
    try {
      const savedPosition = await saveTablePosition(game.id, positions);
      setCurrentTablePosition(savedPosition);
      setShowPositionEditor(false);
      setPositionsJustChanged(true);
      setHandTrackingStage('ready'); // Move to ready state after table is set
      toast.success("Table position saved");

      // Reset flag after 2 seconds
      setTimeout(() => setPositionsJustChanged(false), 2000);
    } catch (error) {
      toast.error("Failed to save table position");
    }
  }, [game.id, saveTablePosition]);

  const handleStartHandTracking = useCallback(() => {
    setHandTrackingStage('recording');
    setTablePositionOpen(false); // Auto-collapse table positions when starting hand tracking
  }, []);

  const handleHandComplete = useCallback(() => {
    setHandTrackingStage('ready');
    setTablePositionOpen(true); // Ensure table positions section is expanded

    // Check if saved hand state was cleared
    try {
      const savedHandState = localStorage.getItem(`poker_hand_state_${game.id}`);
      if (savedHandState) {
        const parsedState = JSON.parse(savedHandState);
        const hasSaved = parsedState && parsedState.stage !== 'setup';
        setHasSavedHandState(!!hasSaved);
      } else {
        setHasSavedHandState(false);
      }
    } catch (error) {
      console.error('Error checking saved hand state:', error);
      setHasSavedHandState(false);
    }
  }, [game.id]);

  const formatCurrency = useCallback((amount: number) => {
    return `Rs. ${formatIndianNumber(amount)}`;
  }, []);

  // Memoize expensive calculations
  const totalBuyIns = useMemo(() =>
    gamePlayers.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0),
    [gamePlayers, game.buy_in_amount]
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

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
            <Button
              onClick={onBackToSetup}
              variant="outline"
              className="border-gold-500/30 text-gold-200 hover:bg-gold-500/10 hover:text-gold-100 transition-all duration-300 shadow-[0_0_15px_rgba(212,184,60,0.1)] group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium tracking-wide">Back to Setup</span>
            </Button>

            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-luxury luxury-text tracking-tight text-gold-100 mb-1">
                Game Dashboard
              </h1>
              <p className="text-gold-400/60 font-numbers text-sm tracking-widest uppercase flex items-center gap-2">
                <span>Buy-in: {formatCurrency(game.buy_in_amount)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500/30" />
                <span>{new Date(game.date).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="h-12 w-12 border-gold-500/20 hover:bg-gold-500/10 text-gold-400 hover:text-gold-200 transition-all duration-300 shadow-lg"
              title="Share Game"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <UserProfile />
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left Column (70%) - Central Gameplay Elements */}
          <div className="lg:col-span-7 space-y-8">

            {/* Game Summary */}
            <GlassCard className="p-6">
              <div
                className="cursor-pointer group"
                onClick={() => setGameStatsOpen(!gameStatsOpen)}
              >
                <Group justify="space-between" mb={gameStatsOpen ? "md" : 0}>
                  <Group gap="md">
                    <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 group-hover:bg-gold-500/20 transition-colors">
                      <Calculator className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <Text className="text-gold-100 font-luxury text-2xl tracking-wide">
                        Game Summary
                      </Text>
                      <Text className="text-gold-400/40 text-xs tracking-widest uppercase">Overview</Text>
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gold" className="group-hover:translate-y-0.5 transition-transform">
                    {gameStatsOpen ? <ChevronUp className="h-6 w-6 text-gold-500" /> : <ChevronDown className="h-6 w-6 text-gold-500" />}
                  </ActionIcon>
                </Group>
              </div>
              <Collapse in={gameStatsOpen}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
                  <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/5 group hover:border-gold-500/30 transition-all">
                    <p className="text-xs text-gold-400/50 font-medium tracking-widest uppercase">Total Pot</p>
                    <p className="text-2xl font-numbers text-gold-200">{formatCurrency(totalBuyIns)}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/5 group hover:border-gold-500/30 transition-all">
                    <p className="text-xs text-gold-400/50 font-medium tracking-widest uppercase">In Play</p>
                    <p className="text-2xl font-numbers text-gold-200">{formatCurrency(totalFinalStack)}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/5 group hover:border-gold-500/30 transition-all">
                    <p className="text-xs text-gold-400/50 font-medium tracking-widest uppercase">Participants</p>
                    <p className="text-2xl font-numbers text-gold-200">{gamePlayers.length}</p>
                  </div>
                </div>
              </Collapse>
            </GlassCard>

            {/* Unified Table Position & Hand Tracking Section */}
            {showPositionEditor ? (
              <GlassCard className="p-0 overflow-hidden border-gold-500/30">
                <TablePositionEditor
                  players={gamePlayers.map(gp => gp.player)}
                  currentPositions={currentTablePosition?.positions || []}
                  onSave={handleSaveTablePosition}
                  onCancel={() => setShowPositionEditor(false)}
                />
              </GlassCard>
            ) : handTrackingStage === 'ready' && currentTablePosition && currentTablePosition.positions.length > 0 ? (
              <GlassCard className="p-6">
                <div
                  className="cursor-pointer group"
                  onClick={() => setTablePositionOpen(!tablePositionOpen)}
                >
                  <Group justify="space-between" mb={tablePositionOpen ? "md" : 0}>
                    <Group gap="md">
                      <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 group-hover:bg-gold-500/20 transition-colors">
                        <UsersIcon className="w-6 h-6 text-gold-400" />
                      </div>
                      <div>
                        <Text className="text-gold-100 font-luxury text-2xl tracking-wide">
                          Live Table Position
                        </Text>
                        <Text className="text-gold-400/40 text-xs tracking-widest uppercase">High Roller Table</Text>
                      </div>
                    </Group>
                    <ActionIcon variant="subtle" color="gold">
                      {tablePositionOpen ? <ChevronUp className="h-6 w-6 text-gold-500" /> : <ChevronDown className="h-6 w-6 text-gold-500" />}
                    </ActionIcon>
                  </Group>
                </div>
                <Collapse in={tablePositionOpen}>
                  <div className="pt-6">
                    <div className="relative rounded-3xl overflow-hidden bg-black/20 border border-white/5 p-8">
                      <PokerTableView positions={currentTablePosition.positions} totalSeats={gamePlayers.length} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <Button
                        onClick={() => setShowPositionEditor(true)}
                        variant="outline"
                        className="flex-1 border-gold-500/20 text-gold-300 hover:bg-gold-500/10 h-14 text-lg font-medium"
                      >
                        Adjust Positions
                      </Button>
                      <Button
                        onClick={handleStartHandTracking}
                        className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-gold-600 to-gold-400 text-black hover:from-gold-500 hover:to-gold-300 shadow-[0_4px_20px_rgba(212,184,60,0.3)] transition-all"
                      >
                        <Play className="w-5 h-5 mr-3 fill-current" />
                        {hasSavedHandState ? 'Resume Hand' : 'New Hand'}
                      </Button>
                    </div>
                  </div>
                </Collapse>
              </GlassCard>
            ) : (
              <GlassCard className="p-12">
                <div className="text-center space-y-8">
                  <div className="mx-auto w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center border border-gold-500/20">
                    <UsersIcon className="w-10 h-10 text-gold-400/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-luxury text-gold-100">Establish the Table</h3>
                    <p className="text-gold-400/60 max-w-sm mx-auto">Set player positions to begin tracking hands and real-time game dynamics.</p>
                  </div>
                  <Button
                    onClick={() => setShowPositionEditor(true)}
                    className="h-14 px-10 text-lg font-bold bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_30px_rgba(212,184,60,0.2)]"
                  >
                    <UsersIcon className="w-5 h-5 mr-3" />
                    Define Seat Positions
                  </Button>
                </div>
              </GlassCard>
            )}

            {/* Hand Tracking Section - Show when recording (keeps table positions visible above) */}
            {handTrackingStage === 'recording' && (
              <HandTracking
                game={game}
                positionsJustChanged={positionsJustChanged}
                onHandComplete={handleHandComplete}
                initialSeatPositions={currentTablePosition?.positions || []}
              />
            )}

            {/* Buy-in Logs */}
            <GlassCard className="p-6">
              <div
                className="cursor-pointer group"
                onClick={() => setBuyInLogsOpen(!buyInLogsOpen)}
              >
                <Group justify="space-between" mb={buyInLogsOpen ? "md" : 0}>
                  <Group gap="md">
                    <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 group-hover:bg-gold-500/20 transition-colors">
                      <Plus className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <Text className="text-gold-100 font-luxury text-2xl tracking-wide">
                        Buy-in Logs
                      </Text>
                      <Text className="text-gold-400/40 text-xs tracking-widest uppercase">Transaction History</Text>
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gold">
                    {buyInLogsOpen ? <ChevronUp className="h-6 w-6 text-gold-500" /> : <ChevronDown className="h-6 w-6 text-gold-500" />}
                  </ActionIcon>
                </Group>
              </div>
              <Collapse in={buyInLogsOpen}>
                <div className="pt-6">
                  <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/5">
                    <BuyInManagementTable
                      gamePlayers={gamePlayers}
                      buyInAmount={game.buy_in_amount}
                      onAddBuyIn={handleAddBuyIn}
                      fetchBuyInHistory={fetchBuyInHistory}
                    />
                  </div>
                </div>
              </Collapse>
            </GlassCard>

            {/* Final Stack Logs */}
            <GlassCard className="p-6">
              <div
                className="cursor-pointer group"
                onClick={() => setFinalStackLogsOpen(!finalStackLogsOpen)}
              >
                <Group justify="space-between" mb={finalStackLogsOpen ? "md" : 0}>
                  <Group gap="md">
                    <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 group-hover:bg-gold-500/20 transition-colors">
                      <DollarSign className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <Text className="text-gold-100 font-luxury text-2xl tracking-wide">
                        Final Stack Logs
                      </Text>
                      <Text className="text-gold-400/40 text-xs tracking-widest uppercase">Settlement Balances</Text>
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gold">
                    {finalStackLogsOpen ? <ChevronUp className="h-6 w-6 text-gold-500" /> : <ChevronDown className="h-6 w-6 text-gold-500" />}
                  </ActionIcon>
                </Group>
              </div>
              <Collapse in={finalStackLogsOpen}>
                <div className="pt-6">
                  <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/5 p-4">
                    <FinalStackManagement
                      gamePlayers={gamePlayers}
                      onUpdateFinalStack={handleUpdateFinalStack}
                    />
                  </div>
                </div>
              </Collapse>
            </GlassCard>
          </div>

          {/* Right Column (30%) - Controls & Administration */}
          <div className="lg:col-span-3 space-y-8">

            {/* Players Section */}
            <GlassCard className="p-6">
              <div
                className="cursor-pointer group"
                onClick={() => setPlayersOpen(!playersOpen)}
              >
                <Group justify="space-between" mb={playersOpen ? "md" : 0}>
                  <Group gap="md">
                    <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 group-hover:bg-gold-500/20 transition-colors">
                      <UsersIcon className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                      <Text className="text-gold-100 font-luxury text-xl tracking-wide">
                        Players ({gamePlayers.length})
                      </Text>
                      <Text className="text-gold-400/40 text-xs tracking-widest uppercase">Roster</Text>
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gold">
                    {playersOpen ? <ChevronUp className="h-5 w-5 text-gold-500" /> : <ChevronDown className="h-5 w-5 text-gold-500" />}
                  </ActionIcon>
                </Group>
              </div>
              <Collapse in={playersOpen}>
                <Stack gap="md" className="pt-4">
                  <Button
                    onClick={() => setShowAddPlayer(true)}
                    className="w-full h-12 bg-gold-500/10 border border-gold-500/30 text-gold-200 hover:bg-gold-500/20 font-medium tracking-wide transition-all shadow-lg"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enroll Player
                  </Button>

                  <Modal
                    opened={showAddPlayer}
                    onClose={() => setShowAddPlayer(false)}
                    title={<span className="font-luxury text-xl text-gold-100">Add Player to Game</span>}
                    size="xl"
                    styles={{
                      content: { backgroundColor: '#0a0a0c', border: '1px solid rgba(212, 184, 60, 0.2)' },
                      header: { backgroundColor: '#0a0a0c' },
                    }}
                  >
                    {/* ... (Existing Modal Content) ... */}
                    <Text size="sm" className="text-gold-400/60" mb="md">
                      Select from existing players or create a new one
                    </Text>

                    <Tabs defaultValue="existing" styles={{
                      tab: { color: 'rgba(212, 184, 60, 0.4)', '&[data-active]': { color: '#D4B83C', borderColor: '#D4B83C' } }
                    }}>
                      <Tabs.List grow>
                        <Tabs.Tab value="existing">Existing Players</Tabs.Tab>
                        <Tabs.Tab value="new">New Player</Tabs.Tab>
                      </Tabs.List>

                      <Tabs.Panel value="existing" pt="md">
                        <Stack gap="md">
                          <TextInput
                            placeholder="Search players by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftSection={<Search className="h-4 w-4" />}
                            styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(212,184,60,0.1)' } }}
                          />

                          {availablePlayers.length > 0 ? (
                            <ScrollArea h={300} pr="md">
                              <div className="grid gap-3">
                                {availablePlayers.map((player) => (
                                  <button
                                    key={player.id}
                                    onClick={() => addExistingPlayer(player)}
                                    className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-gold-500/5 hover:border-gold-500/20 transition-all group"
                                  >
                                    <div className="flex items-center gap-4">
                                      <OptimizedAvatar name={player.name} size="md" className="ring-1 ring-gold-500/20" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gold-100">{player.name}</span>
                                          {player.total_games && player.total_games > 10 && <Star className="h-3 w-3 text-gold-500 fill-current" />}
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant="outline" size="xs" className="border-white/10 text-gold-400/60 uppercase tracking-tighter">
                                            {player.total_games || 0} Games
                                          </Badge>
                                          {player.total_profit !== undefined && (
                                            <Badge variant="dot" size="xs" color={getProfitLossColor(player.total_profit)} className="uppercase tracking-tighter">
                                              {formatProfitLoss(player.total_profit)}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Check className="h-5 w-5 text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-12 text-gold-400/30 font-numbers italic tracking-widest">
                              No players found
                            </div>
                          )}
                        </Stack>
                      </Tabs.Panel>

                      <Tabs.Panel value="new" pt="md">
                        <Stack gap="md">
                          <TextInput
                            label={<span className="text-gold-400 text-xs tracking-widest uppercase">Player Name</span>}
                            placeholder="Enter player name"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(212,184,60,0.1)' } }}
                            onKeyDown={(e) => e.key === 'Enter' && !isCreatingPlayer && addNewPlayer()}
                            autoFocus
                          />
                          <Button
                            onClick={addNewPlayer}
                            disabled={!newPlayerName.trim() || isCreatingPlayer}
                            className="w-full h-14 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold text-lg"
                          >
                            {isCreatingPlayer ? <Loader size="xs" color="black" /> : 'Create & Enroll'}
                          </Button>
                        </Stack>
                      </Tabs.Panel>
                    </Tabs>
                  </Modal>

                  <div className="space-y-3 pt-2">
                    {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
                      <DashboardPlayerCard
                        key={gamePlayer.id}
                        gamePlayer={gamePlayer}
                        buyInAmount={game.buy_in_amount}
                        isLiveGame={true}
                      />
                    ))}
                  </div>
                </Stack>
              </Collapse>
            </GlassCard>

            {/* Manual Transfers */}
            {manualTransfers.length > 0 && (
              <GlassCard className="p-6">
                <Group gap="xs" mb="md" className="border-b border-white/5 pb-4">
                  <div className="p-2 bg-gold-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-gold-400" />
                  </div>
                  <Text className="text-gold-200 font-luxury text-lg tracking-wide">
                    Manual Transfers
                  </Text>
                </Group>
                <div className="space-y-3">
                  {manualTransfers.map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-gold-500/20 transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm text-gold-400/60 uppercase tracking-widest font-numbers text-[10px]">Transaction</span>
                        <span className="text-gold-100 font-medium">
                          {transfer.from} <span className="text-gold-500/40 px-1">→</span> {transfer.to}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-numbers font-bold text-gold-300">
                          {formatCurrency(transfer.amount)}
                        </span>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => removeManualTransfer(index)}
                          className="hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </ActionIcon>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Add Manual Transfer Form */}
            {showManualTransfer && (
              <GlassCard className="p-6 border-gold-500/30">
                <Group gap="xs" mb="md" className="border-b border-gold-500/20 pb-4">
                  <Plus className="w-5 h-5 text-gold-400" />
                  <Text className="text-gold-100 font-luxury text-lg uppercase tracking-wider">New Transfer</Text>
                </Group>
                <Stack gap="md">
                  <Select
                    value={newTransferFrom}
                    onChange={(value) => setNewTransferFrom(value || '')}
                    placeholder="From Player"
                    data={gamePlayers.map(gp => gp.player.name)}
                    styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(212,184,60,0.1)' } }}
                  />
                  <Select
                    value={newTransferTo}
                    onChange={(value) => setNewTransferTo(value || '')}
                    placeholder="To Player"
                    data={gamePlayers.map(gp => gp.player.name)}
                    styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(212,184,60,0.1)' } }}
                  />
                  <TextInput
                    type="text"
                    placeholder="Amount"
                    value={newTransferAmount}
                    onChange={(e) => setNewTransferAmount(e.target.value)}
                    styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(212,184,60,0.1)' } }}
                  />
                  <Group gap="sm">
                    <Button onClick={addManualTransfer} className="flex-1 bg-gold-500 text-black hover:bg-gold-400">Add</Button>
                    <Button onClick={() => setShowManualTransfer(false)} className="flex-1 border-white/10 text-white/60" variant="outline">Cancel</Button>
                  </Group>
                </Stack>
              </GlassCard>
            )}

            {/* Final Actions Container */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                {!showManualTransfer && (
                  <Button
                    onClick={() => setShowManualTransfer(true)}
                    disabled={!canCompleteGame}
                    variant="outline"
                    className="w-full h-12 border-gold-500/20 text-gold-400 hover:bg-gold-500/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manual Adjustment
                  </Button>
                )}

                <Button
                  onClick={calculateSettlements}
                  disabled={!canCompleteGame}
                  className="w-full h-14 bg-white/5 border border-white/10 text-gold-100 hover:bg-white/10 font-bold transition-all"
                >
                  <Calculator className="w-5 h-5 mr-3" />
                  {settlements.length > 0 ? 'Recalculate Table' : 'Settle Accounts'}
                </Button>

                <Button
                  onClick={handleCompleteGame}
                  disabled={!canCompleteGame || isCompletingGame}
                  className="w-full h-16 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-black text-xl tracking-tighter shadow-[0_0_40px_rgba(212,184,60,0.2)] hover:shadow-[0_0_60px_rgba(212,184,60,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isCompletingGame ? <Loader size="sm" color="black" /> : (
                    <>
                      <Trophy className="w-6 h-6 mr-3 fill-current" />
                      COMPLETE GAME
                    </>
                  )}
                </Button>
              </div>

              {(!isBalanced || !isStackBalanced) && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
                  {!isBalanced && (
                    <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Balance Mismatch: {formatCurrency(totalWinnings + totalLosses)}
                    </p>
                  )}
                  {!isStackBalanced && (
                    <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Stack Inconsistency: Diff {formatCurrency(totalFinalStack - totalBuyIns)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Settlements Display */}
            {settlements.length > 0 && (
              <GlassCard className="p-6 border-gold-500/50 shadow-[0_0_30px_rgba(212,184,60,0.1)]">
                <div
                  className="cursor-pointer group flex items-center justify-between mb-4"
                  onClick={() => setSettlementsOpen(!settlementsOpen)}
                >
                  <Group gap="md">
                    <div className="p-2 bg-gold-500/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-gold-400" />
                    </div>
                    <Text className="text-gold-100 font-luxury text-xl">Final Transfers</Text>
                  </Group>
                  {settlementsOpen ? <ChevronUp className="h-5 w-5 text-gold-500" /> : <ChevronDown className="h-5 w-5 text-gold-500" />}
                </div>
                <Collapse in={settlementsOpen}>
                  <Stack gap="sm" className="pt-2">
                    {settlements.map((settlement, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gold-500/5 rounded-xl border border-gold-500/20">
                        <span className="text-gold-100 font-medium">
                          {settlement.from} <span className="text-gold-500/40 px-1">pays</span> {settlement.to}
                        </span>
                        <span className="font-numbers font-bold text-gold-300">
                          {formatCurrency(settlement.amount)}
                        </span>
                      </div>
                    ))}
                  </Stack>
                </Collapse>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;
