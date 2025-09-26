import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, TrendingUp, TrendingDown, History, Calendar } from "lucide-react";
import { Player, Game } from "@/types/poker";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
interface GameSetupProps {
  onGameStart: (game: Game) => void;
}
const GameSetup = ({
  onGameStart
}: GameSetupProps) => {
  const [buyInAmount, setBuyInAmount] = useState<number>(100);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [canCreateGame, setCanCreateGame] = useState<boolean>(true);
  const {
    players,
    games,
    loading,
    createOrFindPlayer,
    createGame,
    deletePlayer,
    hasIncompleteGame
  } = useGameData();
  const {
    toast
  } = useToast();

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
  const addNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      const player = await createOrFindPlayer(newPlayerName.trim());
      if (!selectedPlayers.find(p => p.id === player.id)) {
        setSelectedPlayers([...selectedPlayers, player]);
      }
      setNewPlayerName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive"
      });
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive"
      });
    }
  };

  const startGame = async () => {
    if (selectedPlayers.length >= 2 && buyInAmount > 0 && canCreateGame) {
      try {
        const game = await createGame(buyInAmount, selectedPlayers);
        onGameStart(game);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create game",
          variant: "destructive"
        });
      }
    }
  };
  return <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            Poker Game Setup
          </h1>
          <p className="text-muted-foreground">Set up your poker game and add players</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-poker-gold">Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="buyIn">Buy-in Amount (Rs.)</Label>
                <Input id="buyIn" type="number" value={buyInAmount} onChange={e => setBuyInAmount(Number(e.target.value))} className="bg-input border-border" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-poker-gold">Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Enter player name" className="bg-input border-border" onKeyPress={e => e.key === 'Enter' && addNewPlayer()} />
              <Button onClick={addNewPlayer} disabled={!newPlayerName.trim()} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {!loading && players.length > 0 && <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select from Previous Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.filter(p => !selectedPlayers.find(sp => sp.id === p.id)).map(player => <div key={player.id} className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectExistingPlayer(player)}>
                        <span className="font-semibold">{player.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {player.total_games} games
                          </Badge>
                          <Badge variant={player.total_profit >= 0 ? "default" : "destructive"} className="text-xs">
                            {player.total_profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            ${Math.abs(player.total_profit).toFixed(0)}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePlayer(player.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

        {selectedPlayers.length > 0 && <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Selected Players ({selectedPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedPlayers.map(player => <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{player.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.total_games} games
                      </Badge>
                      <Badge variant={player.total_profit >= 0 ? "default" : "destructive"} className="text-xs">
                        {player.total_profit >= 0 ? '+' : ''}${player.total_profit.toFixed(0)}
                      </Badge>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeSelectedPlayer(player.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <History className="w-5 h-5" />
                Game History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {games.map(game => (
                  <div key={game.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {new Date(game.date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Buy-in: Rs.{game.buy_in_amount}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {game.game_players.map(gp => (
                        <div key={gp.id} className="flex items-center justify-between p-2 bg-background rounded">
                          <span className="font-medium">{gp.player.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {gp.buy_ins} buy-in{gp.buy_ins > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant={gp.net_amount >= 0 ? "default" : "destructive"} className="text-xs">
                              {gp.net_amount >= 0 ? '+' : ''}Rs.{gp.net_amount.toFixed(0)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={startGame} disabled={selectedPlayers.length < 2 || buyInAmount <= 0 || !canCreateGame} className="w-full bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold py-3">
          Start Game ({selectedPlayers.length} players)
        </Button>
      </div>
    </div>;
};
export default GameSetup;