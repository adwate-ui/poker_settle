import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Game, Player, Settlement } from "@/types/poker";
import PlayerCard from "./PlayerCard";
import { ArrowLeft, Calculator, DollarSign } from "lucide-react";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game: initialGame, onBackToSetup }: GameDashboardProps) => {
  const [game, setGame] = useState(initialGame);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGame(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      )
    }));
  };

  const calculateSettlements = () => {
    const players = game.players.map(p => ({
      ...p,
      netAmount: p.finalStack - (p.buyIns * game.buyInAmount)
    }));

    const winners = players.filter(p => p.netAmount > 0).sort((a, b) => b.netAmount - a.netAmount);
    const losers = players.filter(p => p.netAmount < 0).sort((a, b) => a.netAmount - b.netAmount);

    const newSettlements: Settlement[] = [];
    let winnerIndex = 0;
    let loserIndex = 0;

    while (winnerIndex < winners.length && loserIndex < losers.length) {
      const winner = winners[winnerIndex];
      const loser = losers[loserIndex];
      const amount = Math.min(winner.netAmount, Math.abs(loser.netAmount));

      if (amount > 0) {
        newSettlements.push({
          from: loser.name,
          to: winner.name,
          amount: amount
        });

        winner.netAmount -= amount;
        loser.netAmount += amount;

        if (winner.netAmount <= 0.01) winnerIndex++;
        if (Math.abs(loser.netAmount) <= 0.01) loserIndex++;
      }
    }

    setSettlements(newSettlements);
  };

  useEffect(() => {
    calculateSettlements();
  }, [game.players]);

  const totalPot = game.players.reduce((sum, p) => sum + (p.buyIns * game.buyInAmount), 0);
  const totalStacks = game.players.reduce((sum, p) => sum + p.finalStack, 0);
  const totalProfit = game.players.reduce((sum, p) => sum + Math.max(0, p.finalStack - (p.buyIns * game.buyInAmount)), 0);
  const totalLoss = game.players.reduce((sum, p) => sum + Math.min(0, p.finalStack - (p.buyIns * game.buyInAmount)), 0);

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
              {new Date(game.date).toLocaleDateString()} • Buy-in: ${game.buyInAmount}
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
          {game.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              buyInAmount={game.buyInAmount}
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