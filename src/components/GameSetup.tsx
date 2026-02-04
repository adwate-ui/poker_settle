import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Search, Trash2, Play, X, Plus, History, Calendar, ShieldCheck, Coins, UserPlus, Info } from "lucide-react";
import { Player, Game, SeatPosition } from "@/types/poker";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "@/lib/notifications";
import { UserProfile } from "@/components/UserProfile";
import PlayerPerformance from "@/components/PlayerPerformance";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { CurrencyConfig } from "@/config/localization";
import TablePositionEditor from "@/components/TablePositionEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import OptimizedAvatar from "@/components/OptimizedAvatar";

interface GameSetupProps {
  onGameStart: (game: Game) => void;
}

const GameSetup = ({ onGameStart }: GameSetupProps) => {
  const [buyInAmount, setBuyInAmount] = useState<number>(2000);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [canCreateGame, setCanCreateGame] = useState<boolean>(true);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [isPreviousPlayersOpen, setIsPreviousPlayersOpen] = useState(false);
  const [isGameHistoryOpen, setIsGameHistoryOpen] = useState(false);
  const [showPositionSetup, setShowPositionSetup] = useState(false);
  const [pendingGame, setPendingGame] = useState<Game | null>(null);

  const {
    players,
    games,
    loading,
    createOrFindPlayer,
    createGame,
    deletePlayer,
    deleteGame,
    hasIncompleteGame,
    getIncompleteGame,
    saveTablePosition
  } = useGameData();

  useEffect(() => {
    const checkIncompleteGame = async () => {
      try {
        const hasIncomplete = await hasIncompleteGame();
        setCanCreateGame(!hasIncomplete);
      } catch (error) {
        console.error('Error checking incomplete games:', error);
      }
    };
    checkIncompleteGame();
  }, [hasIncompleteGame]);

  const formatCurrencyLocal = (amount: number) => {
    return formatCurrency(amount);
  };

  const filteredPlayers = players
    .filter(player =>
      !selectedPlayers.find(sp => sp.id === player.id) &&
      player.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.date).toLocaleDateString();
    return gameDate.toLowerCase().includes(gameSearchQuery.toLowerCase());
  });

  const addNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      const player = await createOrFindPlayer(newPlayerName.trim());
      if (!selectedPlayers.find(p => p.id === player.id)) {
        setSelectedPlayers([...selectedPlayers, player]);
      }
      setNewPlayerName('');
    } catch (error) {
      toast.error("Failed to add player");
    }
  };

  const selectExistingPlayer = (player: Player) => {
    if (!selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const removeSelectedPlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer(playerId);
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
      toast.success("Player deleted successfully");
    } catch (error) {
      toast.error("Failed to delete player");
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      toast.success("Game deleted successfully");
    } catch (error) {
      toast.error("Failed to delete game");
    }
  };

  const startGame = async () => {
    if (selectedPlayers.length >= 2 && buyInAmount > 0 && canCreateGame) {
      try {
        const game = await createGame(buyInAmount, selectedPlayers);
        setPendingGame(game);
        setShowPositionSetup(true);
      } catch (error) {
        toast.error("Failed to create game");
      }
    }
  };

  const handleSaveInitialPosition = async (positions: SeatPosition[]) => {
    if (!pendingGame) return;

    try {
      await saveTablePosition(pendingGame.id, positions);
      toast.success("Table position set");
      onGameStart(pendingGame);
    } catch (error) {
      toast.error("Failed to save table position");
    }
  };

  const handleSkipPositionSetup = () => {
    if (pendingGame) {
      onGameStart(pendingGame);
    }
  };

  const continueGame = async () => {
    try {
      const game = await getIncompleteGame();
      if (game) {
        onGameStart(game);
      } else {
        toast.error("No incomplete game found");
      }
    } catch (error) {
      toast.error("Failed to load incomplete game");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-10">
        {showPositionSetup && pendingGame ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-3xl font-luxury text-foreground uppercase tracking-widest mb-1">Setup Table</h1>
                <p className="text-label tracking-[0.3em] text-muted-foreground">Assigning initial seat identifiers</p>
              </div>
              <Button
                variant="ghost"
                onClick={handleSkipPositionSetup}
                className="text-label text-muted-foreground/60 hover:text-foreground hover:bg-accent/5 h-10 px-6 rounded-full border border-border"
              >
                Decline Positioning
              </Button>
            </div>
            <div className="p-8 rounded-3xl bg-background/40 backdrop-blur-xl border border-border shadow-2xl">
              <TablePositionEditor
                players={selectedPlayers}
                currentPositions={[]}
                onSave={handleSaveInitialPosition}
                onCancel={handleSkipPositionSetup}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-luxury luxury-text tracking-tight text-foreground mb-1">Session Initiation</h1>
                <p className="text-muted-foreground font-luxury text-xs tracking-[0.3em] uppercase">Executive Game Configuration</p>
              </div>
              <div className="flex items-center gap-4">
                <UserProfile />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* Configuration Card */}
                <Card className="border-border bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-border bg-accent/2">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg font-luxury text-foreground uppercase tracking-widest">Game Settings</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-label tracking-[0.2em] text-muted-foreground ml-1">Buy-in Amount (INR)</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                            <span className="text-primary font-luxury text-[8px] opacity-70">{CurrencyConfig.symbol}</span>
                          </div>
                          <Input
                            type="text"
                            value={formatInputDisplay(buyInAmount)}
                            onChange={e => setBuyInAmount(parseIndianNumber(e.target.value))}
                            className="h-14 pl-8 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all font-numbers text-xl text-foreground placeholder:text-muted-foreground"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-label tracking-[0.2em] text-muted-foreground ml-1">Add New Player</Label>
                        <div className="relative group flex gap-3">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <UserPlus className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input
                              value={newPlayerName}
                              onChange={e => setNewPlayerName(e.target.value)}
                              placeholder="Enter Name"
                              className="h-14 pl-12 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all font-luxury tracking-wider text-[12px] uppercase text-foreground placeholder:text-muted-foreground"
                              onKeyPress={e => e.key === 'Enter' && addNewPlayer()}
                            />
                          </div>
                          <Button
                            onClick={addNewPlayer}
                            disabled={!newPlayerName.trim()}
                            className="h-14 w-14 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {selectedPlayers.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-label tracking-[0.2em] text-muted-foreground">Added Players</p>
                          <Badge variant="outline" className="font-numbers px-4 py-1">{selectedPlayers.length} Units</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                            <div key={player.id} className="inline-flex items-center gap-3 px-3 py-1.5 bg-accent/5 border border-border rounded-full group hover:border-primary/30 transition-all">
                              <OptimizedAvatar name={player.name} size="xs" />
                              <span className="font-luxury text-[11px] uppercase tracking-widest text-foreground/80">{player.name}</span>
                              <Button onClick={() => removeSelectedPlayer(player.id)} variant="ghost" size="icon-sm" className="h-5 w-5 text-muted-foreground hover:text-destructive ml-1">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!canCreateGame && (
                  <Alert className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Info className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <AlertTitle className="font-luxury uppercase tracking-widest text-sm text-foreground">Suspended Sequence Detected</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
                          An incomplete game is active. Finish the current game before starting a new one.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {!canCreateGame && (
                    <Button onClick={continueGame} className="flex-1 h-14 bg-accent/5 border border-border hover:bg-gold-500/10 text-primary font-luxury uppercase tracking-[.2em] text-xs transition-all duration-500 rounded-xl">
                      <Play className="w-4 h-4 mr-3 text-primary fill-current" />
                      Resume Active Sequence
                    </Button>
                  )}
                  <Button
                    onClick={startGame}
                    disabled={selectedPlayers.length < 2 || buyInAmount <= 0 || !canCreateGame}
                    className={cn(
                      "h-14 font-luxury uppercase tracking-[.2em] text-xs transition-all duration-500 rounded-xl",
                      !canCreateGame ? 'flex-1 border border-border bg-accent/2 text-muted-foreground' : 'w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black shadow-lg shadow-gold-900/20'
                    )}
                  >
                    <Play className="w-4 h-4 mr-3 fill-current" />
                    Start Game — {selectedPlayers.length} Players
                  </Button>
                </div>

                {!loading && players.length > 0 && games.length > 0 && (
                  <PlayerPerformance players={players} games={games} />
                )}
              </div>

              <div className="lg:col-span-4 space-y-8">
                {/* Previous Players Sidebar */}
                {players.length > 0 && (
                  <Card className="border-border bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Collapsible open={isPreviousPlayersOpen} onOpenChange={setIsPreviousPlayersOpen}>
                      <CollapsibleTrigger asChild>
                        <div className="p-6 border-b border-border bg-accent/2 cursor-pointer flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <h3 className="text-sm font-luxury text-foreground/80 uppercase tracking-[0.2em]">Saved Players</h3>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-white/20 transition-transform duration-300", isPreviousPlayersOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input
                              placeholder="Filter Registry..."
                              value={playerSearchQuery}
                              onChange={(e) => setPlayerSearchQuery(e.target.value)}
                              className="h-10 pl-9 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all text-label text-foreground/60 placeholder:text-muted-foreground"
                            />
                          </div>

                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                              {filteredPlayers.map(player => (
                                <div
                                  key={player.id}
                                  className="p-4 bg-accent/2 border border-border rounded-xl hover:bg-accent/5 hover:border-primary/20 transition-all cursor-pointer group flex items-center gap-4"
                                  onClick={() => selectExistingPlayer(player)}
                                >
                                  <OptimizedAvatar name={player.name} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-luxury text-xs text-foreground uppercase tracking-widest truncate">{player.name}</p>
                                    <p className="font-numbers text-[9px] text-muted-foreground mt-1 uppercase tracking-tighter">{player.total_games} Sessions Ident.</p>
                                  </div>
                                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge className={cn("px-2 py-0.5 font-numbers text-[9px] border-0", player.total_profit > 0 ? "bg-state-success/10 text-state-success" : "bg-state-error/10 text-state-error")}>
                                      {formatProfitLoss(player.total_profit)}
                                    </Badge>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }}
                                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500/20 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}

                {/* Game History Sidebar */}
                {games.length > 0 && (
                  <Card className="border-border bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Collapsible open={isGameHistoryOpen} onOpenChange={setIsGameHistoryOpen}>
                      <CollapsibleTrigger asChild>
                        <div className="p-6 border-b border-border bg-accent/2 cursor-pointer flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <h3 className="text-sm font-luxury text-foreground/80 uppercase tracking-[0.2em]">Session Ledger</h3>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-white/20 transition-transform duration-300", isGameHistoryOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input
                              placeholder="Search players..."
                              value={gameSearchQuery}
                              onChange={(e) => setGameSearchQuery(e.target.value)}
                              className="h-10 pl-9 bg-accent/5 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all text-label text-foreground/60 placeholder:text-muted-foreground"
                            />
                          </div>

                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                              {filteredGames.map((game) => {
                                const totalBuyIns = game.game_players.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
                                const totalWins = game.game_players.reduce((sum, gp) => sum + Math.max(0, gp.net_amount), 0);
                                return (
                                  <div key={game.id} className="p-5 bg-accent/2 border border-border rounded-2xl space-y-4 hover:border-primary/20 transition-all group">
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <p className="font-luxury text-[11px] text-foreground/80 uppercase tracking-widest leading-none">{new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="font-numbers text-[9px] text-muted-foreground uppercase tracking-tighter">Stake: {formatCurrency(game.buy_in_amount)}</p>
                                      </div>
                                      <Button onClick={() => handleDeleteGame(game.id)} variant="ghost" size="icon-sm" className="p-2 hover:bg-destructive/10 rounded-xl text-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="p-2 bg-background/40 rounded-lg text-center">
                                        <p className="text-[8px] font-luxury uppercase tracking-widest text-muted-foreground mb-1">Asset Flow</p>
                                        <p className="text-[11px] font-luxury text-foreground">{formatCurrency(totalBuyIns)}</p>
                                      </div>
                                      <div className="p-2 bg-background/40 rounded-lg text-center">
                                        <p className="text-[8px] font-luxury uppercase tracking-widest text-muted-foreground mb-1">Gains</p>
                                        <p className="text-[11px] font-luxury text-state-success">{formatCurrency(totalWins)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameSetup;