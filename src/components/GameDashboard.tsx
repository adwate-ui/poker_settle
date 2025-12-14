import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextInput, Card, Badge, Collapse, Select, Modal, Tabs, ScrollArea, ActionIcon, Stack, Group, Text, Loader } from "@mantine/core";
import { ArrowLeft, Trophy, Calculator, DollarSign, Plus, UserPlus, Trash2, Users as UsersIcon, Play, ChevronDown, ChevronUp, Search, Check, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Game, GamePlayer, Settlement, Player, SeatPosition, TablePosition } from "@/types/poker";
import PlayerCard from "@/components/PlayerCard";
import PlayerCardMantine from "@/components/PlayerCardMantine";
import { BuyInManagementTable } from "@/components/BuyInManagementTable";
import { FinalStackManagement } from "@/components/FinalStackManagement";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "@/lib/notifications";
import { UserProfile } from "@/components/UserProfile";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import TablePositionEditor from "@/components/TablePositionEditor";
import HandTracking from "@/components/HandTracking";
import { cn } from "@/lib/utils";
import OptimizedAvatar from "@/components/OptimizedAvatar";

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
  
  const { players, updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame, saveTablePosition, getCurrentTablePosition, fetchBuyInHistory } = useGameData();
  
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
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button 
              onClick={onBackToSetup}
              className="bg-primary hover:bg-primary/90 shadow-lg w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Back to Setup</span>
              <span className="xs:hidden">Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-poker-gold to-yellow-500 bg-clip-text text-transparent">
                Game Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Buy-in: {formatCurrency(game.buy_in_amount)} • {new Date(game.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <UserProfile />
        </div>

        {/* Game Summary */}
        <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <div 
            className="cursor-pointer hover:bg-primary/5 transition-colors -mx-4 -mt-4 px-4 pt-4 pb-3 border-b border-primary/20"
            onClick={() => setGameStatsOpen(!gameStatsOpen)}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                  <Calculator className="w-5 h-5" />
                </div>
                <Text className="text-poker-gold" size="xl" fw={600}>
                  Game Summary
                </Text>
              </Group>
              {gameStatsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Group>
          </div>
          <Collapse in={gameStatsOpen}>
            <div className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-sm text-muted-foreground font-medium">Buy-ins</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalBuyIns)}</p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-sm text-muted-foreground font-medium">Final Stack</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalFinalStack)}</p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-sm text-muted-foreground font-medium"># Players</p>
                <p className="text-lg font-bold text-primary">{gamePlayers.length}</p>
              </div>
            </div>
            </div>
          </Collapse>
        </Card>

        {/* Unified Table Position & Hand Tracking Section */}
        {showPositionEditor ? (
          <TablePositionEditor
            players={gamePlayers.map(gp => gp.player)}
            currentPositions={currentTablePosition?.positions || []}
            onSave={handleSaveTablePosition}
            onCancel={() => setShowPositionEditor(false)}
          />
        ) : handTrackingStage === 'ready' && currentTablePosition && currentTablePosition.positions.length > 0 ? (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <div 
              className="cursor-pointer hover:bg-primary/5 transition-colors -mx-4 -mt-4 px-4 pt-4 pb-3 border-b border-primary/20"
              onClick={() => setTablePositionOpen(!tablePositionOpen)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <Text className="text-poker-gold" size="lg" fw={600}>
                    Current Table Positions
                  </Text>
                </Group>
                {tablePositionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Group>
            </div>
            <Collapse in={tablePositionOpen}>
              <div className="pt-4">
              <PokerTableView positions={currentTablePosition.positions} totalSeats={gamePlayers.length} />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowPositionEditor(true)}
                  variant="outline"
                  className="flex-1 border-primary/30 hover:bg-primary/10"
                >
                  Change Positions
                </Button>
                <Button
                  onClick={handleStartHandTracking}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {hasSavedHandState ? 'Continue Hand' : 'Start Hand'}
                </Button>
              </div>
              </div>
            </Collapse>
          </Card>
        ) : (
          <Card shadow="sm" padding="lg" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <div className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">No table positions set yet</p>
                <Button
                  onClick={() => setShowPositionEditor(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Set Table Positions
                </Button>
              </div>
            </div>
          </Card>
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

        {/* Buy-in Management */}
        <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <Group gap="xs" mb="md" className="border-b border-primary/20 pb-3">
            <div className="p-1.5 bg-poker-gold/20 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <Text className="text-poker-gold" size="xl" fw={600}>
              Buy-in Management
            </Text>
          </Group>
          <div className="pt-4">
            <BuyInManagementTable
              gamePlayers={gamePlayers}
              buyInAmount={game.buy_in_amount}
              onAddBuyIn={handleAddBuyIn}
            />
          </div>
        </Card>

        {/* Final Stack Management */}
        <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <Group gap="xs" mb="md" className="border-b border-primary/20 pb-3">
            <div className="p-1.5 bg-poker-gold/20 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <Text className="text-poker-gold" size="xl" fw={600}>
              Final Stack Management
            </Text>
          </Group>
          <div className="pt-4">
            <FinalStackManagement
              gamePlayers={gamePlayers}
              onUpdateFinalStack={handleUpdateFinalStack}
            />
          </div>
        </Card>

        {/* Players Section */}
        <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <div 
            className="cursor-pointer hover:bg-primary/5 transition-colors -mx-4 -mt-4 px-4 pt-4 pb-3 border-b border-primary/20"
            onClick={() => setPlayersOpen(!playersOpen)}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <Text className="text-poker-gold" size="lg" fw={600}>
                  Players ({gamePlayers.length})
                </Text>
              </Group>
              {playersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Group>
          </div>
          <Collapse in={playersOpen}>
            <Stack gap="md" className="pt-4">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                  <Button 
                    className="bg-primary hover:bg-primary/90 w-full xs:w-auto"
                    onClick={() => setShowAddPlayer(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
              <Modal 
                opened={showAddPlayer} 
                onClose={() => setShowAddPlayer(false)}
                title="Add Player to Game"
                size="xl"
              >
                <Text size="sm" c="dimmed" mb="md">
                  Select from existing players or create a new one
                </Text>

                <Tabs defaultValue="existing">
                  <Tabs.List grow>
                    <Tabs.Tab value="existing">Existing Players</Tabs.Tab>
                    <Tabs.Tab value="new">New Player</Tabs.Tab>
                  </Tabs.List>

                  {/* Existing Players Tab */}
                  <Tabs.Panel value="existing" pt="md">
                    <Stack gap="md">
                    {/* Search */}
                    <TextInput
                      placeholder="Search players by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftSection={<Search className="h-4 w-4" />}
                    />

                    {/* Players List */}
                    {availablePlayers.length > 0 ? (
                      <div className="space-y-2">
                        {searchQuery && (
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Search Results ({availablePlayers.length})
                          </h4>
                        )}
                        <ScrollArea h={300} pr="md">
                          <div className="grid gap-2">
                            {availablePlayers.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => addExistingPlayer(player)}
                                className={cn(
                                  "w-full text-left p-3 rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all",
                                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Avatar */}
                                  <OptimizedAvatar 
                                    name={player.name}
                                    size="sm"
                                    className="flex-shrink-0"
                                  />

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold truncate">{player.name}</span>
                                      {player.total_games && player.total_games > 10 && (
                                        <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                        <UsersIcon className="h-3 w-3 mr-1" />
                                        {player.total_games || 0} games
                                      </Badge>
                                      {player.total_profit !== undefined && (
                                        <Badge
                                          variant={player.total_profit >= 0 ? 'success' : 'destructive'}
                                          className="text-[10px] h-5 px-1.5"
                                        >
                                          {player.total_profit >= 0 ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                          )}
                                          {player.total_profit >= 0 ? '+' : ''}
                                          Rs. {formatIndianNumber(Math.abs(player.total_profit))}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Select Icon */}
                                  <Check className="h-5 w-5 text-primary" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <div className="space-y-2">
                            <p>No players found matching "{searchQuery}"</p>
                            <p className="text-sm">Try creating a new player instead</p>
                          </div>
                        ) : (
                          <p>All players have been added</p>
                        )}
                      </div>
                    )}
                    </Stack>
                  </Tabs.Panel>

                  {/* New Player Tab */}
                  <Tabs.Panel value="new" pt="md">
                    <Stack gap="md">
                      <TextInput
                        label="Player Name"
                        placeholder="Enter player name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isCreatingPlayer) {
                            addNewPlayer();
                          }
                        }}
                        autoFocus
                      />

                      <Button
                        onClick={addNewPlayer}
                        disabled={!newPlayerName.trim() || isCreatingPlayer}
                        fullWidth
                        size="lg"
                      >
                        {isCreatingPlayer ? (
                          <>Creating...</>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create and Add Player
                          </>
                        )}
                      </Button>
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              </Modal>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
            <PlayerCardMantine
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              buyInAmount={game.buy_in_amount}
            />
          ))}
        </div>
            </Stack>
          </Collapse>
        </Card>

        {manualTransfers.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <Group gap="xs" mb="md" className="border-b border-primary/20 pb-3">
              <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <Text className="text-poker-gold" size="lg" fw={600}>
                Manual Transfers
              </Text>
            </Group>
            <div className="pt-4">
              <div className="space-y-2">
                {manualTransfers.map((transfer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span>
                      <span className="font-semibold">{transfer.from}</span> pays{' '}
                      <span className="font-semibold">{transfer.to}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-poker-gold">
                        {formatCurrency(transfer.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeManualTransfer(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {showManualTransfer && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <Group gap="xs" mb="md" className="border-b border-primary/20 pb-3">
              <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <Text className="text-poker-gold" size="lg" fw={600}>
                Add Manual Transfer
              </Text>
            </Group>
            <Stack gap="md" className="pt-4">
              <Select 
                value={newTransferFrom} 
                onChange={(value) => setNewTransferFrom(value || '')}
                placeholder="From Player"
                data={gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => ({
                  value: gp.player.name,
                  label: gp.player.name
                }))}
              />

              <Select 
                value={newTransferTo} 
                onChange={(value) => setNewTransferTo(value || '')}
                placeholder="To Player"
                data={gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => ({
                  value: gp.player.name,
                  label: gp.player.name
                }))}
              />

              <TextInput
                type="text"
                placeholder="Amount"
                value={newTransferAmount}
                onChange={(e) => setNewTransferAmount(e.target.value)}
              />

              <Group gap="sm">
                <Button onClick={addManualTransfer} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
                <Button onClick={() => setShowManualTransfer(false)} className="flex-1">
                  Cancel
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!showManualTransfer && (
              <Button 
                onClick={() => setShowManualTransfer(true)}
                disabled={!canCompleteGame}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Add Manual Transfer</span>
                <span className="xs:hidden">Manual Transfer</span>
              </Button>
            )}

            <Button 
              onClick={calculateSettlements} 
              disabled={!canCompleteGame}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Calculator className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{settlements.length > 0 ? 'Recalculate Settlements' : 'Calculate Settlements'}</span>
              <span className="sm:hidden">Settlements</span>
            </Button>
            
            <Button 
              onClick={handleCompleteGame} 
              disabled={!canCompleteGame || isCompletingGame}
              className="bg-gradient-poker hover:opacity-90 text-primary-foreground w-full sm:w-auto"
            >
              {isCompletingGame ? (
                <>
                  <Loader size="xs" className="mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Complete Game
                </>
              )}
            </Button>
          </div>
          
          {(!isBalanced || !isStackBalanced) && (
            <div className="flex flex-col gap-1 text-destructive">
              {!isBalanced && (
                <span className="text-xs sm:text-sm font-medium">
                  Net amounts must balance to zero (Current: {formatCurrency(totalWinnings + totalLosses)})
                </span>
              )}
              {!isStackBalanced && (
                <span className="text-xs sm:text-sm font-medium">
                  Total final stack must equal total buy-ins (Final: {formatCurrency(totalFinalStack)}, Buy-ins: {formatCurrency(totalBuyIns)})
                </span>
              )}
            </div>
          )}
        </div>

        {settlements.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <div 
              className="cursor-pointer hover:bg-primary/5 transition-colors -mx-4 -mt-4 px-4 pt-4 pb-3 border-b border-primary/20"
              onClick={() => setSettlementsOpen(!settlementsOpen)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <Text className="text-poker-gold" size="lg" fw={600}>
                    Remaining Settlement Transfers
                  </Text>
                </Group>
                {settlementsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Group>
            </div>
            <Collapse in={settlementsOpen}>
              <Stack gap="xs" className="pt-4">
                {settlements.length === 0 && manualTransfers.length > 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    All settlements covered by manual transfers
                  </Text>
                ) : (
                  settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span>
                        <span className="font-semibold">{settlement.from}</span> pays{' '}
                        <span className="font-semibold">{settlement.to}</span>
                      </span>
                      <span className="font-bold text-poker-gold">
                        {formatCurrency(settlement.amount)}
                      </span>
                    </div>
                  ))
                )}
              </Stack>
            </Collapse>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;