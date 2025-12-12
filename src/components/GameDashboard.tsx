import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Trophy, Calculator, DollarSign, Plus, UserPlus, Trash2, Users as UsersIcon, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Game, GamePlayer, Settlement, Player, SeatPosition, TablePosition } from "@/types/poker";
import PlayerCard from "@/components/PlayerCard";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "sonner";
import { UserProfile } from "@/components/UserProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import PokerTableView from "@/components/PokerTableView";
import TablePositionEditor from "@/components/TablePositionEditor";
import HandTracking from "@/components/HandTracking";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, TrendingUp, TrendingDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { ConsolidatedBuyInLogs } from "@/components/ConsolidatedBuyInLogs";

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
  
  // Collapsible sections state
  const [gameStatsOpen, setGameStatsOpen] = useState(true);
  const [buyInLogsOpen, setBuyInLogsOpen] = useState(true);
  const [tablePositionOpen, setTablePositionOpen] = useState(true);
  const [playersOpen, setPlayersOpen] = useState(true);
  const [settlementsOpen, setSettlementsOpen] = useState(true);
  
  const { players, updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame, saveTablePosition, getCurrentTablePosition, fetchBuyInHistory } = useGameData();
  
  useEffect(() => {
    const loadTablePosition = async () => {
      const position = await getCurrentTablePosition(game.id);
      setCurrentTablePosition(position);
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
      
      // Wait 2 seconds then navigate to game details
      setTimeout(() => {
        navigate(`/games/${game.id}`);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete game");
    }
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
  }, []);

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
        <Collapsible open={gameStatsOpen} onOpenChange={setGameStatsOpen}>
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-2 border-b border-primary/20">
                <CardTitle className="text-poker-gold flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-poker-gold/20 rounded-lg">
                      <Calculator className="w-4 h-4" />
                    </div>
                    Game Summary
                  </div>
                  {gameStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-0.5 p-2 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-[10px] text-muted-foreground font-medium">Buy-ins</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(totalBuyIns)}</p>
              </div>
              <div className="space-y-0.5 p-2 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-[10px] text-muted-foreground font-medium">Final Stack</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(totalFinalStack)}</p>
                {!isStackBalanced && (
                  <p className="text-[9px] text-destructive font-semibold">Must equal buy-ins</p>
                )}
              </div>
              <div className="space-y-0.5 p-2 rounded-lg bg-green-500/10 border-2 border-green-500/30">
                <p className="text-[10px] text-muted-foreground font-medium">Winnings</p>
                <p className="text-sm font-bold text-green-500">{formatCurrency(totalWinnings)}</p>
              </div>
              <div className="space-y-0.5 p-2 rounded-lg bg-red-500/10 border-2 border-red-500/30">
                <p className="text-[10px] text-muted-foreground font-medium">Losses</p>
                <p className="text-sm font-bold text-red-500">{formatCurrency(Math.abs(totalLosses))}</p>
              </div>
            </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Unified Table Position & Hand Tracking Section */}
        {showPositionEditor ? (
          <TablePositionEditor
            players={gamePlayers.map(gp => gp.player)}
            currentPositions={currentTablePosition?.positions || []}
            onSave={handleSaveTablePosition}
            onCancel={() => setShowPositionEditor(false)}
          />
        ) : handTrackingStage === 'ready' && currentTablePosition && currentTablePosition.positions.length > 0 ? (
          <Collapsible open={tablePositionOpen} onOpenChange={setTablePositionOpen}>
            <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-3 border-b border-primary/20">
                  <CardTitle className="text-poker-gold flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                        <UsersIcon className="w-5 h-5" />
                      </div>
                      Current Table Positions
                    </div>
                    {tablePositionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
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
                  Continue Hand
                </Button>
              </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        )}

        {/* Hand Tracking Section - Show when recording (keeps table positions visible above) */}
        {handTrackingStage === 'recording' && (
          <HandTracking 
            game={game} 
            positionsJustChanged={positionsJustChanged}
            onHandComplete={handleHandComplete}
          />
        )}

        {/* Buy-in Logs */}
        <Collapsible open={buyInLogsOpen} onOpenChange={setBuyInLogsOpen}>
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-3 border-b border-primary/20">
                <CardTitle className="text-poker-gold flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    Buy-in Logs
                  </div>
                  {buyInLogsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <ConsolidatedBuyInLogs gameId={game.id} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Players Section */}
        <Collapsible open={playersOpen} onOpenChange={setPlayersOpen}>
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-3 border-b border-primary/20">
                <CardTitle className="text-poker-gold flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    Players ({gamePlayers.length})
                  </div>
                  {playersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                  <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 w-full xs:w-auto">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Add Player to Game</DialogTitle>
                  <DialogDescription>
                    Select from existing players or create a new one
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="existing" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing Players</TabsTrigger>
                    <TabsTrigger value="new">New Player</TabsTrigger>
                  </TabsList>

                  {/* Existing Players Tab */}
                  <TabsContent value="existing" className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search players by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Players List */}
                    {availablePlayers.length > 0 ? (
                      <div className="space-y-2">
                        {searchQuery && (
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Search Results ({availablePlayers.length})
                          </h4>
                        )}
                        <ScrollArea className="h-[300px] pr-4">
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
                  </TabsContent>

                  {/* New Player Tab */}
                  <TabsContent value="new" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="newPlayerName" className="text-sm font-medium">
                          Player Name
                        </label>
                        <Input
                          id="newPlayerName"
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
                      </div>

                      <Button
                        onClick={addNewPlayer}
                        disabled={!newPlayerName.trim() || isCreatingPlayer}
                        className="w-full"
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
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              buyInAmount={game.buy_in_amount}
              onUpdatePlayer={handlePlayerUpdate}
              fetchBuyInHistory={fetchBuyInHistory}
            />
          ))}
        </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {manualTransfers.length > 0 && (
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                Manual Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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
            </CardContent>
          </Card>
        )}

        {showManualTransfer && (
          <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                Add Manual Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-3">
                <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="From Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                      <SelectItem key={gp.id} value={gp.player.name}>
                        {gp.player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="To Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                      <SelectItem key={gp.id} value={gp.player.name}>
                        {gp.player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Amount"
                  value={newTransferAmount}
                  onChange={(e) => setNewTransferAmount(e.target.value)}
                  className="bg-input border-border"
                />

                <div className="flex gap-2">
                  <Button onClick={addManualTransfer} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualTransfer(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
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
              disabled={!canCompleteGame}
              className="bg-gradient-poker hover:opacity-90 text-primary-foreground w-full sm:w-auto"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Complete Game
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
          <Collapsible open={settlementsOpen} onOpenChange={setSettlementsOpen}>
            <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-3 border-b border-primary/20">
                  <CardTitle className="text-poker-gold flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-poker-gold/20 rounded-lg">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      Remaining Settlement Transfers
                    </div>
                    {settlementsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
              <div className="space-y-2">
                {settlements.length === 0 && manualTransfers.length > 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    All settlements covered by manual transfers
                  </p>
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
              </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;