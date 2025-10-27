import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, ChevronUp, Users, Search, Trash2, Play, UserPlus, X, Plus, TrendingUp, TrendingDown, History, Calendar } from "lucide-react";
import { Player, Game, SeatPosition } from "@/types/poker";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserProfile } from "@/components/UserProfile";
import PlayerPerformance from "@/components/PlayerPerformance";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import TablePositionEditor from "@/components/TablePositionEditor";

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
    <div className="min-h-screen bg-gradient-dark p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {showPositionSetup && pendingGame ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Set Initial Table Positions</h1>
              <Button
                variant="ghost"
                onClick={handleSkipPositionSetup}
                className="text-sm"
              >
                Skip for now
              </Button>
            </div>
            <TablePositionEditor
              players={selectedPlayers}
              currentPositions={[]}
              onSave={handleSaveInitialPosition}
              onCancel={handleSkipPositionSetup}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Poker Game Setup</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Configure your game settings and select players</p>
              </div>
              <UserProfile />
            </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-poker-gold">Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="buyIn">Buy-in Amount</Label>
                <Input 
                  id="buyIn" 
                  type="text" 
                  value={formatInputDisplay(buyInAmount)} 
                  onChange={e => {
                    const parsed = parseIndianNumber(e.target.value);
                    setBuyInAmount(parsed);
                  }}
                  className="bg-input border-border"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-poker-gold">Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Input 
                value={newPlayerName} 
                onChange={e => setNewPlayerName(e.target.value)} 
                placeholder="Enter player name" 
                className="bg-input border-border" 
                onKeyPress={e => e.key === 'Enter' && addNewPlayer()} 
              />
              <Button 
                onClick={addNewPlayer} 
                disabled={!newPlayerName.trim()} 
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {!loading && players.length > 0 && (
          <Collapsible open={isPreviousPlayersOpen} onOpenChange={setIsPreviousPlayersOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-poker-gold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Select from Previous Players ({players.length})
                    </div>
                    {isPreviousPlayersOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search players..."
                        value={playerSearchQuery}
                        onChange={(e) => setPlayerSearchQuery(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                    {filteredPlayers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                        {filteredPlayers.map(player => (
                          <div key={player.id} className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3 cursor-pointer w-full sm:w-auto" onClick={() => selectExistingPlayer(player)}>
                                <span className="font-semibold">{player.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                                <Badge variant="outline" className="text-xs">
                                  {player.total_games} games
                                </Badge>
                                <Badge variant={player.total_profit >= 0 ? "default" : "destructive"} className="text-xs">
                                  {player.total_profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                  {formatCurrency(Math.abs(player.total_profit))}
                                </Badge>
                                <Button variant="destructive" size="sm" onClick={() => handleDeletePlayer(player.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {playerSearchQuery ? 'No players found matching your search.' : 'No previous players available.'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {selectedPlayers.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Selected Players ({selectedPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                  <div key={player.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-secondary rounded-lg gap-2">
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                      <span className="font-semibold">{player.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.total_games} games
                      </Badge>
                      <Badge variant={player.total_profit >= 0 ? "default" : "destructive"} className="text-xs">
                        {player.total_profit >= 0 ? '+' : ''}{formatCurrency(player.total_profit)}
                      </Badge>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeSelectedPlayer(player.id)} className="self-end sm:self-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!canCreateGame && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">
                You have an incomplete game. Please complete it before starting a new game.
              </p>
            </CardContent>
          </Card>
        )}

        {games.length > 0 && (
          <Collapsible open={isGameHistoryOpen} onOpenChange={setIsGameHistoryOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-poker-gold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Game History ({games.length})
                    </div>
                    {isGameHistoryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by date (e.g., 12/26/2024)..."
                        value={gameSearchQuery}
                        onChange={(e) => setGameSearchQuery(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                    {filteredGames.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredGames.map((game) => {
                          const totalBuyIns = game.game_players.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
                          const totalWins = game.game_players.reduce((sum, gp) => sum + Math.max(0, gp.net_amount), 0);
                          const totalLosses = game.game_players.reduce((sum, gp) => sum + Math.min(0, gp.net_amount), 0);
                          const totalFinalStack = game.game_players.reduce((sum, gp) => sum + gp.final_stack, 0);

                          return (
                            <div key={game.id} className="p-4 bg-secondary rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold">
                                    {new Date(game.date).toLocaleDateString()}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    Buy-in: {formatCurrency(game.buy_in_amount)}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteGame(game.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-background rounded">
                                <div className="text-center">
                                  <div className="text-xs sm:text-sm text-muted-foreground">Buy-ins</div>
                                  <div className="text-sm sm:text-base font-semibold text-primary">{formatCurrency(totalBuyIns)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs sm:text-sm text-muted-foreground">Wins</div>
                                  <div className="text-sm sm:text-base font-semibold text-green-400">{formatCurrency(totalWins)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs sm:text-sm text-muted-foreground">Losses</div>
                                  <div className="text-sm sm:text-base font-semibold text-red-400">{formatCurrency(Math.abs(totalLosses))}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs sm:text-sm text-muted-foreground">Final Stack</div>
                                  <div className="text-sm sm:text-base font-semibold text-poker-gold">{formatCurrency(totalFinalStack)}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                {game.game_players.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                                  <div key={gp.id} className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-2 bg-background rounded gap-1">
                                    <span className="font-medium text-sm sm:text-base">{gp.player.name}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {gp.buy_ins} buy-in{gp.buy_ins > 1 ? 's' : ''}
                                      </Badge>
                                      <Badge variant={gp.net_amount >= 0 ? "default" : "destructive"} className="text-xs">
                                        {gp.net_amount >= 0 ? '+' : ''}{formatCurrency(gp.net_amount)}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {gameSearchQuery ? 'No games found matching your search.' : 'No completed games yet.'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {!loading && players.length > 0 && games.length > 0 && (
          <PlayerPerformance players={players} games={games} />
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {!canCreateGame && (
            <Button onClick={continueGame} className="flex-1 bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold py-3">
              <Play className="w-5 h-5 mr-2" />
              <span className="hidden xs:inline">Continue Current Game</span>
              <span className="xs:hidden">Continue Game</span>
            </Button>
          )}
          <Button 
            onClick={startGame} 
            disabled={selectedPlayers.length < 2 || buyInAmount <= 0 || !canCreateGame} 
            className={`${!canCreateGame ? 'flex-1' : 'w-full'} bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold py-3`}
          >
            <Play className="w-5 h-5 mr-2" />
            Start New Game ({selectedPlayers.length} players)
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameSetup;