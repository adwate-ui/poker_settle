import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Game, GamePlayer, Settlement } from "@/types/poker";
import PlayerCard from "./PlayerCard";
import { ArrowLeft, Calculator, DollarSign } from "lucide-react";
import { useGameData } from "@/hooks/useGameData";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game: initialGame, onBackToSetup }: GameDashboardProps) => {
  const [game, setGame] = useState(initialGame);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const { updateGamePlayer } = useGameData();

  const updatePlayer = async (gamePlayerId: string, updates: Partial<GamePlayer>) => {
    try {
      await updateGamePlayer(gamePlayerId, updates);
      
      setGame(prev => ({
        ...prev,
        game_players: prev.game_players.map(gp => 
          gp.id === gamePlayerId ? { ...gp, ...updates } : gp
        )
      }));
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  const calculateSettlements = () => {
    const players = game.game_players.map(gp => ({
      ...gp,
      net_amount: gp.final_stack - (gp.buy_ins * game.buy_in_amount)
    }));

    const winners = players.filter(p => p.net_amount > 0).sort((a, b) => b.net_amount - a.net_amount);
    const losers = players.filter(p => p.net_amount < 0).sort((a, b) => a.net_amount - b.net_amount);

    const newSettlements: Settlement[] = [];
    let winnerIndex = 0;
    let loserIndex = 0;

    while (winnerIndex < winners.length && loserIndex < losers.length) {
      const winner = winners[winnerIndex];
      const loser = losers[loserIndex];
      const amount = Math.min(winner.net_amount, Math.abs(loser.net_amount));

      if (amount > 0) {
        newSettlements.push({
          from: loser.player.name,
          to: winner.player.name,
          amount: amount
        });

        winner.net_amount -= amount;
        loser.net_amount += amount;

        if (winner.net_amount <= 0.01) winnerIndex++;
        if (Math.abs(loser.net_amount) <= 0.01) loserIndex++;
      }
    }

    setSettlements(newSettlements);
  };

  useEffect(() => {
    calculateSettlements();
  }, [game.game_players]);

  const totalPot = game.game_players.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
  const totalStacks = game.game_players.reduce((sum, gp) => sum + gp.final_stack, 0);
  const totalProfit = game.game_players.reduce((sum, gp) => sum + Math.max(0, gp.final_stack - (gp.buy_ins * game.buy_in_amount)), 0);
  const totalLoss = game.game_players.reduce((sum, gp) => sum + Math.min(0, gp.final_stack - (gp.buy_ins * game.buy_in_amount)), 0);

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onBackToSetup}
            className="bg-card border-border"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Game
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Poker Game Tracker
            </h1>
            <p className="text-muted-foreground">
              {new Date(game.date).toLocaleDateString()} • Buy-in: ${game.buy_in_amount}
            </p>
          </div>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Game Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-poker-gold mb-2" />
              <div className="text-2xl font-bold text-poker-gold">${totalPot}</div>
              <div className="text-sm text-muted-foreground">Total Pot</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Calculator className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">${totalStacks.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Stacks</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-money-green">+${totalProfit.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Winnings</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-money-red">${totalLoss.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Losses</div>
            </CardContent>
          </Card>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {game.game_players.map(gamePlayer => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              buyInAmount={game.buy_in_amount}
              onUpdatePlayer={updatePlayer}
            />
          ))}
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Settlement Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settlements.map((settlement, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <span className="text-foreground">
                      <span className="font-semibold">{settlement.from}</span> pays{' '}
                      <span className="font-semibold">{settlement.to}</span>
                    </span>
                    <span className="text-lg font-bold text-poker-gold">
                      ${settlement.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;