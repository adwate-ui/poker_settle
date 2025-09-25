import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Player, Game } from "@/types/poker";

interface GameSetupProps {
  onGameStart: (game: Game) => void;
}

const GameSetup = ({ onGameStart }: GameSetupProps) => {
  const [buyInAmount, setBuyInAmount] = useState<number>(100);
  const [players, setPlayers] = useState<Omit<Player, 'buyIns' | 'finalStack' | 'netAmount'>[]>([
    { id: '1', name: '', phone: '' }
  ]);

  const addPlayer = () => {
    setPlayers([...players, { 
      id: Date.now().toString(), 
      name: '', 
      phone: '' 
    }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, field: string, value: string) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length >= 2 && buyInAmount > 0) {
      const gameId = Date.now().toString();
      const game: Game = {
        id: gameId,
        date: new Date().toISOString(),
        buyInAmount,
        players: validPlayers.map(p => ({
          ...p,
          buyIns: 1,
          finalStack: 0,
          netAmount: 0
        })),
        isComplete: false
      };
      onGameStart(game);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
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
                <Label htmlFor="buyIn">Buy-in Amount ($)</Label>
                <Input
                  id="buyIn"
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(Number(e.target.value))}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-poker-gold">Players</CardTitle>
            <Button 
              onClick={addPlayer}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, index) => (
              <div key={player.id} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Name</Label>
                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="bg-input border-border"
                  />
                </div>
                <div className="flex-1">
                  <Label>Phone (optional)</Label>
                  <Input
                    value={player.phone}
                    onChange={(e) => updatePlayer(player.id, 'phone', e.target.value)}
                    placeholder="Phone number"
                    className="bg-input border-border"
                  />
                </div>
                {players.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button 
          onClick={startGame}
          disabled={players.filter(p => p.name.trim()).length < 2 || buyInAmount <= 0}
          className="w-full bg-gradient-poker hover:opacity-90 text-primary-foreground font-semibold py-3"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default GameSetup;