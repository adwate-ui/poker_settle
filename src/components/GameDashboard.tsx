import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Calculator, DollarSign, Plus, UserPlus } from "lucide-react";
import { Game, GamePlayer, Settlement, Player } from "@/types/poker";
import PlayerCard from "@/components/PlayerCard";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "sonner";
import { UserProfile } from "@/components/UserProfile";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game, onBackToSetup }: GameDashboardProps) => {
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>(game.game_players);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const { players, updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame } = useGameData();
  

  const handlePlayerUpdate = async (gamePlayerId: string, updates: Partial<GamePlayer>) => {
    try {
      await updateGamePlayer(gamePlayerId, updates);
      setGamePlayers(prev => prev.map(gp => 
        gp.id === gamePlayerId ? { ...gp, ...updates } : gp
      ));
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  const addNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const player = await createOrFindPlayer(newPlayerName.trim());
      const gamePlayer = await addPlayerToGame(game.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setNewPlayerName('');
      setShowAddPlayer(false);
      toast.success("Player added to game");
    } catch (error) {
      toast.error("Failed to add player");
    }
  };

  const addExistingPlayer = async (player: Player) => {
    try {
      const gamePlayer = await addPlayerToGame(game.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setShowAddPlayer(false);
      toast.success("Player added to game");
    } catch (error) {
      toast.error("Failed to add player");
    }
  };

  const calculateSettlements = () => {
    const playerBalances = gamePlayers.map(gp => ({
      name: gp.player.name,
      balance: gp.net_amount
    }));

    const creditors = playerBalances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = playerBalances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const newSettlements: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      const amount = Math.min(creditor.balance, -debtor.balance);
      
      if (amount > 0) {
        newSettlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (creditor.balance === 0) creditorIndex++;
      if (debtor.balance === 0) debtorIndex++;
    }
    
    setSettlements(newSettlements);
  };

  const handleCompleteGame = async () => {
    calculateSettlements(); // Calculate settlements first
    try {
      await completeGame(game.id, settlements);
      toast.success("Game completed successfully");
      onBackToSetup();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete game");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBuyIns = gamePlayers.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0);
  const totalWinnings = gamePlayers.reduce((sum, gp) => sum + Math.max(0, gp.net_amount), 0);
  const totalLosses = gamePlayers.reduce((sum, gp) => sum + Math.min(0, gp.net_amount), 0);
  const totalFinalStack = gamePlayers.reduce((sum, gp) => sum + gp.final_stack, 0);
  const isBalanced = Math.abs(totalWinnings + totalLosses) < 0.01;
  const isStackBalanced = Math.abs(totalFinalStack - totalBuyIns) < 0.01;
  const canCompleteGame = isBalanced && isStackBalanced;

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBackToSetup}
              className="bg-background/10 border-white/20 hover:bg-background/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">Game Dashboard</h1>
              <p className="text-muted-foreground">
                Buy-in: {formatCurrency(game.buy_in_amount)} • {new Date(game.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <UserProfile />
        </div>

        {showAddPlayer && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Add Player to Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input 
                    value={newPlayerName} 
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="bg-input border-border"
                    onKeyPress={(e) => e.key === 'Enter' && addNewPlayer()}
                  />
                  <Button onClick={addNewPlayer} disabled={!newPlayerName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                    Cancel
                  </Button>
                </div>
                
                {players.filter(p => !gamePlayers.find(gp => gp.player_id === p.id)).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Or select existing player:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {players.filter(p => !gamePlayers.find(gp => gp.player_id === p.id)).map(player => (
                        <Button
                          key={player.id}
                          variant="outline"
                          onClick={() => addExistingPlayer(player)}
                          className="justify-start"
                        >
                          {player.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-poker-gold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Game Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Buy-ins</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalBuyIns)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Final Stack</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalFinalStack)}</p>
                {!isStackBalanced && (
                  <p className="text-xs text-destructive">Must equal buy-ins</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Winnings</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalWinnings)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Losses</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(Math.abs(totalLosses))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Players</h2>
          <Button 
            onClick={() => setShowAddPlayer(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamePlayers.map((gamePlayer) => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              buyInAmount={game.buy_in_amount}
              onUpdatePlayer={handlePlayerUpdate}
            />
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          <Button onClick={calculateSettlements} className="bg-primary hover:bg-primary/90">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Settlements
          </Button>
          
          {(!isBalanced || !isStackBalanced) && (
            <div className="flex flex-col gap-1 text-destructive">
              {!isBalanced && (
                <span className="text-sm font-medium">
                  Net amounts must balance to zero (Current: {formatCurrency(totalWinnings + totalLosses)})
                </span>
              )}
              {!isStackBalanced && (
                <span className="text-sm font-medium">
                  Total final stack must equal total buy-ins (Final: {formatCurrency(totalFinalStack)}, Buy-ins: {formatCurrency(totalBuyIns)})
                </span>
              )}
            </div>
          )}
          
          <Button 
            onClick={handleCompleteGame} 
            disabled={!canCompleteGame}
            className="bg-gradient-poker hover:opacity-90 text-primary-foreground"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Complete Game
          </Button>
        </div>

        {settlements.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Settlement Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settlements.map((settlement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span>
                      <span className="font-semibold">{settlement.from}</span> pays{' '}
                      <span className="font-semibold">{settlement.to}</span>
                    </span>
                    <span className="font-bold text-poker-gold">
                      {formatCurrency(settlement.amount)}
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