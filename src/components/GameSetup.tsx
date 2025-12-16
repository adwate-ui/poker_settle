import React, { useState, useEffect } from "react";
import { TextInput, Card, Badge, Text, Collapse, ActionIcon, Stack, Group, Alert } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Search, Trash2, Play, X, Plus, History, Calendar } from "lucide-react";
import { Player, Game, SeatPosition } from "@/types/poker";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "@/lib/notifications";
import { UserProfile } from "@/components/UserProfile";
import PlayerPerformance from "@/components/PlayerPerformance";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, getProfitLossColor, formatProfitLoss } from "@/lib/utils";
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
      <div className="max-w-2xl mx-auto space-y-3">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Poker Game Setup</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Configure and select players</p>
              </div>
              <UserProfile />
            </div>

        <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card border-border">
          <Stack gap="md">
            <Text className="text-poker-gold" size="lg" fw={600}>Quick Setup</Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Buy-in Amount"
                type="text"
                value={formatInputDisplay(buyInAmount)}
                onChange={e => {
                  const parsed = parseIndianNumber(e.target.value);
                  setBuyInAmount(parsed);
                }}
                placeholder="Enter amount"
                size="sm"
              />
              <div>
                <Text size="xs" fw={500} mb={4}>Add New Player</Text>
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    placeholder="Player name"
                    size="sm"
                    onKeyPress={e => e.key === 'Enter' && addNewPlayer()}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={addNewPlayer}
                    disabled={!newPlayerName.trim()}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </Group>
              </div>
            </div>
          </Stack>
        </Card>

        {!loading && players.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card border-border">
            <div 
              className="cursor-pointer hover:bg-muted/50 transition-colors mb-3 -mx-4 -mt-4 px-4 pt-4 pb-3" 
              onClick={() => setIsPreviousPlayersOpen(!isPreviousPlayersOpen)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Users className="w-4 h-4 text-poker-gold" />
                  <Text className="text-poker-gold" size="md" fw={600}>
                    Previous Players ({players.length})
                  </Text>
                </Group>
                {isPreviousPlayersOpen ? <ChevronUp className="w-4 h-4 text-poker-gold" /> : <ChevronDown className="w-4 h-4 text-poker-gold" />}
              </Group>
            </div>
            <Collapse in={isPreviousPlayersOpen}>
              <Stack gap="md">
                <TextInput
                  placeholder="Search players..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  leftSection={<Search className="h-3.5 w-3.5" />}
                  size="sm"
                />
                {filteredPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {filteredPlayers.map(player => (
                      <div key={player.id} className="p-2 bg-secondary rounded hover:bg-secondary/80 transition-colors cursor-pointer" onClick={() => selectExistingPlayer(player)}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="sm" fw={500}>{player.name}</Text>
                          <Group gap="xs" wrap="nowrap">
                            <Badge variant="outline" size="sm">
                              {player.total_games}
                            </Badge>
                            <Badge color={getProfitLossColor(player.total_profit)} size="sm">
                              {formatProfitLoss(player.total_profit)}
                            </Badge>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlayer(player.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text c="dimmed" ta="center" py="xl" size="sm">
                    {playerSearchQuery ? 'No players found.' : 'No previous players.'}
                  </Text>
                )}
              </Stack>
            </Collapse>
          </Card>
        )}

        {selectedPlayers.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card border-border">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500} c="dimmed">Selected Players</Text>
                <Badge size="sm">{selectedPlayers.length} players</Badge>
              </Group>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                  <Badge
                    key={player.id}
                    variant="outline"
                    size="lg"
                    className="pl-2.5 pr-1 py-1 bg-secondary hover:bg-secondary/80"
                    rightSection={
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => removeSelectedPlayer(player.id)}
                      >
                        <X className="h-3 w-3" />
                      </ActionIcon>
                    }
                  >
                    <span className="font-medium">{player.name}</span>
                  </Badge>
                ))}
              </div>
            </Stack>
          </Card>
        )}

        {!canCreateGame && (
          <Alert color="red" title="Incomplete Game" icon={<X />}>
            You have an incomplete game. Please complete it before starting a new game.
          </Alert>
        )}

        {games.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder className="bg-card border-border">
            <div 
              className="cursor-pointer hover:bg-muted/50 transition-colors mb-3 -mx-4 -mt-4 px-4 pt-4 pb-3" 
              onClick={() => setIsGameHistoryOpen(!isGameHistoryOpen)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <History className="w-5 h-5 text-poker-gold" />
                  <Text className="text-poker-gold" size="md" fw={600}>
                    Game History ({games.length})
                  </Text>
                </Group>
                {isGameHistoryOpen ? <ChevronUp className="w-5 h-5 text-poker-gold" /> : <ChevronDown className="w-5 h-5 text-poker-gold" />}
              </Group>
            </div>
            <Collapse in={isGameHistoryOpen}>
              <Stack gap="md">
                <TextInput
                  placeholder="Search by date (e.g., 12/26/2024)..."
                  value={gameSearchQuery}
                  onChange={(e) => setGameSearchQuery(e.target.value)}
                  leftSection={<Search className="h-4 w-4" />}
                />
                {filteredGames.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredGames.map((game) => {
                      const totalBuyIns = game.game_players.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
                      const totalWins = game.game_players.reduce((sum, gp) => sum + Math.max(0, gp.net_amount), 0);
                      const totalLosses = game.game_players.reduce((sum, gp) => sum + Math.min(0, gp.net_amount), 0);
                      const totalFinalStack = game.game_players.reduce((sum, gp) => sum + gp.final_stack, 0);

                      return (
                        <div key={game.id} className="p-4 bg-secondary rounded-lg">
                          <Group justify="space-between" mb="sm">
                            <Group gap="xs">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <Text fw={600}>
                                {new Date(game.date).toLocaleDateString()}
                              </Text>
                              <Badge variant="outline" size="sm">
                                Buy-in: {formatCurrency(game.buy_in_amount)}
                              </Badge>
                            </Group>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteGame(game.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Group>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-background rounded">
                            <div className="text-center">
                              <Text size="xs" c="dimmed">Buy-ins</Text>
                              <Text size="sm" fw={600} className="text-primary">{formatCurrency(totalBuyIns)}</Text>
                            </div>
                            <div className="text-center">
                              <Text size="xs" c="dimmed">Wins</Text>
                              <Text size="sm" fw={600} className="text-green-400">{formatCurrency(totalWins)}</Text>
                            </div>
                            <div className="text-center">
                              <Text size="xs" c="dimmed">Losses</Text>
                              <Text size="sm" fw={600} className="text-red-400">{formatCurrency(Math.abs(totalLosses))}</Text>
                            </div>
                            <div className="text-center">
                              <Text size="xs" c="dimmed">Final Stack</Text>
                              <Text size="sm" fw={600} className="text-poker-gold">{formatCurrency(totalFinalStack)}</Text>
                            </div>
                          </div>

                          <Stack gap="xs">
                            {game.game_players.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                              <div key={gp.id} className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-2 bg-background rounded gap-1">
                                <Text size="sm" fw={500}>{gp.player.name}</Text>
                                <Group gap="xs">
                                  <Badge variant="outline" size="sm">
                                    {gp.buy_ins} buy-in{gp.buy_ins > 1 ? 's' : ''}
                                  </Badge>
                                  <Badge color={getProfitLossColor(gp.net_amount)} size="sm">
                                    {formatProfitLoss(gp.net_amount)}
                                  </Badge>
                                </Group>
                              </div>
                            ))}
                          </Stack>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    {gameSearchQuery ? 'No games found matching your search.' : 'No completed games yet.'}
                  </Text>
                )}
              </Stack>
            </Collapse>
          </Card>
        )}

        {!loading && players.length > 0 && games.length > 0 && (
          <PlayerPerformance players={players} games={games} />
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!canCreateGame && (
            <Button onClick={continueGame} className="flex-1 bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold h-11">
              <Play className="w-4 h-4" />
              <span className="hidden xs:inline">Continue Current Game</span>
              <span className="xs:hidden">Continue Game</span>
            </Button>
          )}
          <Button 
            onClick={startGame} 
            disabled={selectedPlayers.length < 2 || buyInAmount <= 0 || !canCreateGame} 
            className={`${!canCreateGame ? 'flex-1' : 'w-full'} bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold h-11`}
          >
            <Play className="w-4 h-4" />
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