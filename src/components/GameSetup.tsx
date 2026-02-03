import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Search, Trash2, Play, X, Plus, History, Calendar, ShieldCheck, Coins, UserPlus, Info } from "lucide-react";
import { Player, Game, SeatPosition } from "@/types/poker";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "@/lib/notifications";
import { UserProfile } from "@/components/UserProfile";
import PlayerPerformance from "@/components/PlayerPerformance";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle, cn } from "@/lib/utils";
import TablePositionEditor from "@/components/TablePositionEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const formatCurrency = (amount: number) => {
    return `Rs. ${formatIndianNumber(amount)}`;
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
                <h1 className="text-3xl font-luxury text-gold-100 uppercase tracking-widest mb-1">Setup Table</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500/40 font-luxury">Assigning initial seat identifiers</p>
              </div>
              <Button
                variant="ghost"
                onClick={handleSkipPositionSetup}
                className="text-[10px] font-luxury uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 h-10 px-6 rounded-full border border-white/5"
              >
                Decline Positioning
              </Button>
            </div>
            <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
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
                <h1 className="text-4xl sm:text-5xl font-luxury luxury-text tracking-tight text-gold-100 mb-1">Session Initiation</h1>
                <p className="text-gold-400/60 font-luxury text-xs tracking-[0.3em] uppercase">Executive Game Configuration</p>
              </div>
              <div className="flex items-center gap-4">
                <UserProfile />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* Configuration Card */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-gold-500/40" />
                      <CardTitle className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Game Settings</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Buy-in Amount (INR)</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gold-500 font-numbers text-sm opacity-50">₹</span>
                          </div>
                          <Input
                            type="text"
                            value={formatInputDisplay(buyInAmount)}
                            onChange={e => setBuyInAmount(parseIndianNumber(e.target.value))}
                            className="h-14 pl-10 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-numbers text-xl text-gold-100 placeholder:text-white/10"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Add New Player</Label>
                        <div className="relative group flex gap-3">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <UserPlus className="h-4 w-4 text-gold-500/40 group-focus-within:text-gold-500 transition-colors" />
                            </div>
                            <Input
                              value={newPlayerName}
                              onChange={e => setNewPlayerName(e.target.value)}
                              placeholder="Enter Name"
                              className="h-14 pl-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-wider text-[12px] uppercase text-gold-100 placeholder:text-white/10"
                              onKeyPress={e => e.key === 'Enter' && addNewPlayer()}
                            />
                          </div>
                          <Button
                            onClick={addNewPlayer}
                            disabled={!newPlayerName.trim()}
                            className="h-14 w-14 bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 text-gold-500 transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {selectedPlayers.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/40">Added Players</p>
                          <Badge className="bg-gold-500/10 text-gold-500 border border-gold-500/20 font-numbers px-4 py-1">{selectedPlayers.length} Units</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                            <div key={player.id} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full group hover:border-gold-500/30 transition-all">
                              <span className="font-luxury text-[11px] uppercase tracking-widest text-gold-100/80">{player.name}</span>
                              <button onClick={() => removeSelectedPlayer(player.id)} className="text-white/20 hover:text-red-400 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!canCreateGame && (
                  <Alert className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Info className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <AlertTitle className="font-luxury uppercase tracking-widest text-sm">Suspended Sequence Detected</AlertTitle>
                        <AlertDescription className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">
                          An incomplete game is active. Finish the current game before starting a new one.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {!canCreateGame && (
                    <Button onClick={continueGame} className="flex-1 h-14 bg-white/5 border border-white/10 hover:bg-gold-500/10 text-gold-200 font-luxury uppercase tracking-[.2em] text-xs transition-all duration-500 rounded-xl">
                      <Play className="w-4 h-4 mr-3 text-gold-500 fill-current" />
                      Resume Active Sequence
                    </Button>
                  )}
                  <Button
                    onClick={startGame}
                    disabled={selectedPlayers.length < 2 || buyInAmount <= 0 || !canCreateGame}
                    className={cn(
                      "h-14 font-luxury uppercase tracking-[.2em] text-xs transition-all duration-500 rounded-xl",
                      !canCreateGame ? 'flex-1 border border-white/5 bg-white/2 text-white/20' : 'w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black shadow-xl shadow-gold-900/20'
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
                  <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Collapsible open={isPreviousPlayersOpen} onOpenChange={setIsPreviousPlayersOpen}>
                      <CollapsibleTrigger asChild>
                        <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                            <h3 className="text-sm font-luxury text-gold-100/80 uppercase tracking-[0.2em]">Saved Players</h3>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-white/20 transition-transform duration-300", isPreviousPlayersOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-3.5 w-3.5 text-white/20 group-focus-within:text-gold-500 transition-colors" />
                            </div>
                            <Input
                              placeholder="Filter Registry..."
                              value={playerSearchQuery}
                              onChange={(e) => setPlayerSearchQuery(e.target.value)}
                              className="h-10 pl-9 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-widest text-[10px] uppercase text-gold-100/60 placeholder:text-white/10"
                            />
                          </div>

                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                              {filteredPlayers.map(player => (
                                <div
                                  key={player.id}
                                  className="p-4 bg-white/2 border border-white/5 rounded-xl hover:bg-gold-500/5 hover:border-gold-500/20 transition-all cursor-pointer group flex items-center justify-between"
                                  onClick={() => selectExistingPlayer(player)}
                                >
                                  <div className="min-w-0">
                                    <p className="font-luxury text-xs text-gold-100 uppercase tracking-widest truncate">{player.name}</p>
                                    <p className="font-numbers text-[9px] text-white/20 mt-1 uppercase tracking-tighter">{player.total_games} Sessions Ident.</p>
                                  </div>
                                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge className={cn("px-2 py-0.5 font-numbers text-[9px] border-0", player.total_profit > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
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
                  <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Collapsible open={isGameHistoryOpen} onOpenChange={setIsGameHistoryOpen}>
                      <CollapsibleTrigger asChild>
                        <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
                            <h3 className="text-sm font-luxury text-gold-100/80 uppercase tracking-[0.2em]">Session Ledger</h3>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-white/20 transition-transform duration-300", isGameHistoryOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-3.5 w-3.5 text-white/20 group-focus-within:text-gold-500 transition-colors" />
                            </div>
                            <Input
                              placeholder="Search players..."
                              value={gameSearchQuery}
                              onChange={(e) => setGameSearchQuery(e.target.value)}
                              className="h-10 pl-9 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-widest text-[10px] uppercase text-gold-100/60 placeholder:text-white/10"
                            />
                          </div>

                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                              {filteredGames.map((game) => {
                                const totalBuyIns = game.game_players.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
                                const totalWins = game.game_players.reduce((sum, gp) => sum + Math.max(0, gp.net_amount), 0);
                                return (
                                  <div key={game.id} className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-gold-500/20 transition-all group">
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <p className="font-luxury text-[11px] text-gold-100/80 uppercase tracking-widest leading-none">{new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="font-numbers text-[9px] text-gold-500/60 uppercase tracking-tighter">Stake: Rs. {formatIndianNumber(game.buy_in_amount)}</p>
                                      </div>
                                      <button onClick={() => handleDeleteGame(game.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="p-2 bg-black/40 rounded-lg text-center">
                                        <p className="text-[8px] font-luxury uppercase tracking-widest text-white/20 mb-1">Asset Flow</p>
                                        <p className="text-[11px] font-numbers text-gold-200">₹{formatIndianNumber(totalBuyIns)}</p>
                                      </div>
                                      <div className="p-2 bg-black/40 rounded-lg text-center">
                                        <p className="text-[8px] font-luxury uppercase tracking-widest text-white/20 mb-1">Gains</p>
                                        <p className="text-[11px] font-numbers text-green-400">₹{formatIndianNumber(totalWins)}</p>
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