import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useHandTracking } from '@/hooks/useHandTracking';
import { Game, GamePlayer, PokerHand, PlayerAction } from '@/types/poker';
import { useAuth } from '@/hooks/useAuth';
import { Play, CheckCircle } from 'lucide-react';

interface HandTrackingProps {
  game: Game;
}

type HandStage = 'setup' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';
type ActionType = 'Small Blind' | 'Big Blind' | 'Straddle' | 'Re-Straddle' | 'Check' | 'Call' | 'Raise' | 'Fold' | 'All-In';

const HandTracking = ({ game }: HandTrackingProps) => {
  const { user } = useAuth();
  const {
    loading,
    createNewHand,
    getNextHandNumber,
    recordPlayerAction,
    recordStreetCards,
    updateHandStage,
    completeHand,
  } = useHandTracking();

  const [currentHand, setCurrentHand] = useState<PokerHand | null>(null);
  const [stage, setStage] = useState<HandStage>('setup');
  const [buttonPlayerId, setButtonPlayerId] = useState<string>('');
  const [dealtOutPlayers, setDealtOutPlayers] = useState<string[]>([]);
  const [activePlayers, setActivePlayers] = useState<GamePlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [actionSequence, setActionSequence] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [streetCards, setStreetCards] = useState('');
  const [potSize, setPotSize] = useState(0);

  // Find hero player (current user)
  const heroPlayer = game.game_players.find(gp => gp.player.name === user?.email?.split('@')[0] || 'Adwate');

  const getHeroPosition = (buttonIndex: number, playerIndex: number, totalPlayers: number): string => {
    const positions = ['Button', 'Small Blind', 'Big Blind', 'UTG', 'UTG+1', 'Middle', 'Cutoff'];
    const relativePosition = (playerIndex - buttonIndex + totalPlayers) % totalPlayers;
    return positions[Math.min(relativePosition, positions.length - 1)];
  };

  const startNewHand = async () => {
    if (!buttonPlayerId) return;

    const nextHandNumber = await getNextHandNumber(game.id);
    const buttonIndex = game.game_players.findIndex(gp => gp.player_id === buttonPlayerId);
    const heroIndex = game.game_players.findIndex(gp => gp.player_id === heroPlayer?.player_id);
    const heroPosition = getHeroPosition(buttonIndex, heroIndex, game.game_players.length);

    const hand = await createNewHand(game.id, buttonPlayerId, nextHandNumber, heroPosition);
    if (hand) {
      setCurrentHand(hand);
      
      // Filter out dealt-out players
      const active = game.game_players.filter(gp => !dealtOutPlayers.includes(gp.player_id));
      setActivePlayers(active);
      
      // Start with small blind (player after button)
      const sbIndex = (buttonIndex + 1) % active.length;
      setCurrentPlayerIndex(sbIndex);
      setStage('preflop');
      setCurrentBet(game.big_blind || 100);
      setPotSize(0);
    }
  };

  const recordAction = async (actionType: ActionType) => {
    if (!currentHand || activePlayers.length === 0) return;

    const currentPlayer = activePlayers[currentPlayerIndex];
    const isHero = currentPlayer.player_id === heroPlayer?.player_id;
    
    let betSize = 0;
    if (actionType === 'Small Blind') {
      betSize = (game.small_blind || 50);
    } else if (actionType === 'Big Blind') {
      betSize = (game.big_blind || 100);
    } else if (actionType === 'Raise' || actionType === 'Call') {
      betSize = parseFloat(betAmount) || currentBet;
    }

    await recordPlayerAction(
      currentHand.id,
      currentPlayer.player_id,
      stage === 'preflop' ? 'Preflop' : stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River',
      actionType,
      betSize,
      actionSequence,
      isHero
    );

    // Update pot
    setPotSize(prev => prev + betSize);
    setActionSequence(prev => prev + 1);

    // If fold, remove player from active players
    if (actionType === 'Fold') {
      setActivePlayers(prev => prev.filter((_, idx) => idx !== currentPlayerIndex));
      return;
    }

    // Move to next player
    setCurrentPlayerIndex((prev) => (prev + 1) % activePlayers.length);
    setBetAmount('');
  };

  const moveToNextStreet = async () => {
    if (!currentHand) return;

    if (stage === 'preflop') {
      setStage('flop');
      await updateHandStage(currentHand.id, 'Flop');
    } else if (stage === 'flop') {
      setStage('turn');
      await updateHandStage(currentHand.id, 'Turn');
    } else if (stage === 'turn') {
      setStage('river');
      await updateHandStage(currentHand.id, 'River');
    } else if (stage === 'river') {
      setStage('showdown');
      await updateHandStage(currentHand.id, 'Showdown');
    }
    
    setCurrentPlayerIndex(0);
    setCurrentBet(0);
  };

  const saveStreetCards = async () => {
    if (!currentHand || !streetCards) return;

    const streetType = stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River';
    await recordStreetCards(currentHand.id, streetType, streetCards);
    setStreetCards('');
  };

  const finishHand = async (winnerId: string) => {
    if (!currentHand) return;

    const isHeroWin = winnerId === heroPlayer?.player_id;
    await completeHand(currentHand.id, winnerId, potSize, isHeroWin);
    
    // Reset everything
    setCurrentHand(null);
    setStage('setup');
    setButtonPlayerId('');
    setDealtOutPlayers([]);
    setActivePlayers([]);
    setActionSequence(0);
    setPotSize(0);
  };

  if (stage === 'setup') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start New Hand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Player on Button</Label>
            <Select value={buttonPlayerId} onValueChange={setButtonPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select button player" />
              </SelectTrigger>
              <SelectContent>
                {game.game_players.map((gp) => (
                  <SelectItem key={gp.player_id} value={gp.player_id}>
                    {gp.player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Dealt Out Players</Label>
            <div className="space-y-2 mt-2">
              {game.game_players.map((gp) => (
                <div key={gp.player_id} className="flex items-center gap-2">
                  <Checkbox
                    checked={dealtOutPlayers.includes(gp.player_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDealtOutPlayers([...dealtOutPlayers, gp.player_id]);
                      } else {
                        setDealtOutPlayers(dealtOutPlayers.filter(id => id !== gp.player_id));
                      }
                    }}
                  />
                  <span>{gp.player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={startNewHand} disabled={!buttonPlayerId || loading} className="w-full">
            Start Hand
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === 'showdown') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Showdown - Select Winner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-semibold">Pot Size: ₹{potSize}</div>
          <div className="space-y-2">
            {activePlayers.map((gp) => (
              <Button
                key={gp.player_id}
                onClick={() => finishHand(gp.player_id)}
                variant="outline"
                className="w-full"
              >
                {gp.player.name} Wins
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlayer = activePlayers[currentPlayerIndex];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Hand #{currentHand?.hand_number} - {stage.toUpperCase()}</span>
          <span className="text-sm font-normal">Pot: ₹{potSize}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(stage === 'flop' || stage === 'turn' || stage === 'river') && !streetCards && (
          <div>
            <Label>Enter {stage} Cards (e.g., AhKd2c)</Label>
            <div className="flex gap-2">
              <Input
                value={streetCards}
                onChange={(e) => setStreetCards(e.target.value)}
                placeholder="AhKd2c"
              />
              <Button onClick={saveStreetCards}>Save Cards</Button>
            </div>
          </div>
        )}

        {streetCards && (stage === 'flop' || stage === 'turn' || stage === 'river') && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="font-semibold mb-2">{stage} Cards:</div>
            <div className="text-lg">{streetCards}</div>
          </div>
        )}

        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="font-semibold mb-2">Current Turn:</div>
          <div className="text-lg">{currentPlayer?.player.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => recordAction('Check')} variant="outline">Check</Button>
          <Button onClick={() => recordAction('Call')} variant="outline">Call</Button>
          <Button onClick={() => recordAction('Fold')} variant="outline">Fold</Button>
          <Button onClick={() => recordAction('All-In')} variant="outline">All-In</Button>
        </div>

        <div>
          <Label>Raise Amount</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <Button onClick={() => recordAction('Raise')}>Raise</Button>
          </div>
        </div>

        <Button onClick={moveToNextStreet} className="w-full" variant="secondary">
          Move to Next Street
        </Button>
      </CardContent>
    </Card>
  );
};

export default HandTracking;
