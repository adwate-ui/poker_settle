import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calculator, Trophy, DollarSign, Plus, UserPlus } from "lucide-react";
import { Game, GamePlayer, Settlement, Player } from "@/types/poker";
import PlayerCard from "./PlayerCard";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      toast({
        title: "Success",
        description: "Player added to game",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive"
      });
    }
  };

  const addExistingPlayer = async (player: Player) => {
    try {
      const gamePlayer = await addPlayerToGame(game.id, player);
      setGamePlayers([...gamePlayers, gamePlayer]);
      setShowAddPlayer(false);
      toast({
        title: "Success",
        description: "Player added to game",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive"
      });
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
      toast({
        title: "Success",
        description: "Game completed successfully",
      });
      onBackToSetup();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete game",
        variant: "destructive"
      });
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBackToSetup} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Setup
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Buy-in: {formatCurrency(game.buy_in_amount)}
            </Badge>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-background rounded">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Buy-ins</div>
                <div className="font-semibold text-primary">{formatCurrency(totalBuyIns)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Wins</div>
                <div className="font-semibold text-green-400">{formatCurrency(totalWinnings)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Losses</div>
                <div className="font-semibold text-red-400">{formatCurrency(Math.abs(totalLosses))}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Final Stack</div>
                <div className="font-semibold text-poker-gold">{formatCurrency(totalFinalStack)}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowAddPlayer(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Player
            </Button>
          </div>
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

        <div className="flex gap-4">
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