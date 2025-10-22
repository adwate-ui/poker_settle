import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Calculator, DollarSign, Plus, UserPlus, Trash2 } from "lucide-react";
import { Game, GamePlayer, Settlement, Player } from "@/types/poker";
import PlayerCard from "@/components/PlayerCard";
import { useGameData } from "@/hooks/useGameData";
import { toast } from "sonner";
import { UserProfile } from "@/components/UserProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GameDashboardProps {
  game: Game;
  onBackToSetup: () => void;
}

const GameDashboard = ({ game, onBackToSetup }: GameDashboardProps) => {
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>(game.game_players);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [manualTransfers, setManualTransfers] = useState<Settlement[]>([]);
  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const [newTransferFrom, setNewTransferFrom] = useState('');
  const [newTransferTo, setNewTransferTo] = useState('');
  const [newTransferAmount, setNewTransferAmount] = useState('');
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

  const addManualTransfer = () => {
    if (!newTransferFrom || !newTransferTo || !newTransferAmount || parseFloat(newTransferAmount) <= 0) {
      toast.error("Please fill all transfer details");
      return;
    }

    if (newTransferFrom === newTransferTo) {
      toast.error("Cannot transfer to the same player");
      return;
    }

    const newTransfer: Settlement = {
      from: newTransferFrom,
      to: newTransferTo,
      amount: parseFloat(newTransferAmount)
    };

    setManualTransfers([...manualTransfers, newTransfer]);
    setNewTransferFrom('');
    setNewTransferTo('');
    setNewTransferAmount('');
    setShowManualTransfer(false);
    toast.success("Manual transfer added");
  };

  const removeManualTransfer = (index: number) => {
    setManualTransfers(manualTransfers.filter((_, i) => i !== index));
  };

  const calculateSettlements = () => {
    // Start with player balances
    const playerBalances = gamePlayers.map(gp => ({
      name: gp.player.name,
      balance: gp.net_amount
    }));

    // Apply manual transfers to adjust balances
    manualTransfers.forEach(transfer => {
      const fromPlayer = playerBalances.find(p => p.name === transfer.from);
      const toPlayer = playerBalances.find(p => p.name === transfer.to);
      
      if (fromPlayer && toPlayer) {
        fromPlayer.balance += transfer.amount; // Debtor pays, so their debt reduces
        toPlayer.balance -= transfer.amount; // Creditor receives, so their credit reduces
      }
    });

    const creditors = playerBalances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = playerBalances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const newSettlements: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      const amount = Math.min(creditor.balance, -debtor.balance);
      
      if (amount > 0.01) { // Only add if amount is significant
        newSettlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
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
                      {players.filter(p => !gamePlayers.find(gp => gp.player_id === p.id)).sort((a, b) => a.name.localeCompare(b.name)).map(player => (
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
          {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              buyInAmount={game.buy_in_amount}
              onUpdatePlayer={handlePlayerUpdate}
            />
          ))}
        </div>

        {manualTransfers.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Manual Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {manualTransfers.map((transfer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span>
                      <span className="font-semibold">{transfer.from}</span> pays{' '}
                      <span className="font-semibold">{transfer.to}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-poker-gold">
                        {formatCurrency(transfer.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeManualTransfer(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showManualTransfer && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-poker-gold">Add Manual Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="From Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                      <SelectItem key={gp.id} value={gp.player.name}>
                        {gp.player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="To Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamePlayers.sort((a, b) => a.player.name.localeCompare(b.player.name)).map(gp => (
                      <SelectItem key={gp.id} value={gp.player.name}>
                        {gp.player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTransferAmount}
                  onChange={(e) => setNewTransferAmount(e.target.value)}
                  className="bg-input border-border"
                />

                <div className="flex gap-2">
                  <Button onClick={addManualTransfer} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualTransfer(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 flex-wrap">
          {!showManualTransfer && (
            <Button 
              onClick={() => setShowManualTransfer(true)}
              variant="outline"
              className="bg-background/10 border-white/20 hover:bg-background/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Transfer
            </Button>
          )}

          <Button onClick={calculateSettlements} className="bg-primary hover:bg-primary/90">
            <Calculator className="w-4 h-4 mr-2" />
            {settlements.length > 0 ? 'Recalculate Settlements' : 'Calculate Settlements'}
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
              <CardTitle className="text-poker-gold">Remaining Settlement Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settlements.length === 0 && manualTransfers.length > 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    All settlements covered by manual transfers
                  </p>
                ) : (
                  settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span>
                        <span className="font-semibold">{settlement.from}</span> pays{' '}
                        <span className="font-semibold">{settlement.to}</span>
                      </span>
                      <span className="font-bold text-poker-gold">
                        {formatCurrency(settlement.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;