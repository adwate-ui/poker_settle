import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useHandTracking } from '@/hooks/useHandTracking';
import { Game, GamePlayer, PokerHand, PlayerAction } from '@/types/poker';
import { useAuth } from '@/hooks/useAuth';
import { Play, CheckCircle, TrendingUp, Trophy } from 'lucide-react';
import CardNotationInput from './CardNotationInput';
import PokerCard from './PokerCard';

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
  const [flopCards, setFlopCards] = useState('');
  const [turnCard, setTurnCard] = useState('');
  const [riverCard, setRiverCard] = useState('');
  const [potSize, setPotSize] = useState(0);
  const [streetActions, setStreetActions] = useState<PlayerAction[]>([]);
  const [playersInHand, setPlayersInHand] = useState<string[]>([]);

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
      setPlayersInHand(active.map(p => p.player_id));
      
      // Post blinds automatically
      const sbIndex = (buttonIndex + 1) % active.length;
      const bbIndex = (buttonIndex + 2) % active.length;
      
      // Record small blind
      await recordPlayerAction(
        hand.id,
        active[sbIndex].player_id,
        'Preflop',
        'Small Blind',
        game.small_blind || 50,
        0,
        active[sbIndex].player_id === heroPlayer?.player_id
      );
      
      // Record big blind
      await recordPlayerAction(
        hand.id,
        active[bbIndex].player_id,
        'Preflop',
        'Big Blind',
        game.big_blind || 100,
        1,
        active[bbIndex].player_id === heroPlayer?.player_id
      );
      
      // Start with player after big blind (UTG)
      const utgIndex = (buttonIndex + 3) % active.length;
      setCurrentPlayerIndex(utgIndex);
      setStage('preflop');
      setCurrentBet(game.big_blind || 100);
      setPotSize((game.small_blind || 50) + (game.big_blind || 100));
      setActionSequence(2);
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

    const action = await recordPlayerAction(
      currentHand.id,
      currentPlayer.player_id,
      stage === 'preflop' ? 'Preflop' : stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River',
      actionType,
      betSize,
      actionSequence,
      isHero
    );

    if (action) {
      setStreetActions(prev => [...prev, action]);
    }

    // Update pot
    setPotSize(prev => prev + betSize);
    setActionSequence(prev => prev + 1);

    // If fold, remove player from players in hand
    if (actionType === 'Fold') {
      setPlayersInHand(prev => prev.filter(id => id !== currentPlayer.player_id));
      const remainingActive = activePlayers.filter(p => p.player_id !== currentPlayer.player_id);
      setActivePlayers(remainingActive);
      
      // If only one player left, they win
      if (remainingActive.length === 1) {
        await finishHand(remainingActive[0].player_id);
        return;
      }
      return;
    }

    // Update current bet if raised
    if (actionType === 'Raise') {
      setCurrentBet(betSize);
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
    setStreetActions([]);
  };

  const saveStreetCards = async (cards: string) => {
    if (!currentHand) return;

    const streetType = stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River';
    await recordStreetCards(currentHand.id, streetType, cards);
    
    if (stage === 'flop') {
      setFlopCards(cards);
    } else if (stage === 'turn') {
      setTurnCard(cards);
    } else if (stage === 'river') {
      setRiverCard(cards);
    }
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
    setFlopCards('');
    setTurnCard('');
    setRiverCard('');
    setStreetActions([]);
    setPlayersInHand([]);
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
      <Card className="mt-6 border-poker-gold/50">
        <CardHeader className="bg-gradient-to-r from-poker-gold/20 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-poker-gold" />
            Showdown - Select Winner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Show all community cards */}
          {(flopCards || turnCard || riverCard) && (
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-4">
              <div className="text-sm font-semibold text-white mb-2">Board:</div>
              <div className="flex gap-2 justify-center flex-wrap">
                {flopCards && flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                  <PokerCard key={`flop-${idx}`} card={card} size="md" />
                ))}
                {turnCard && <PokerCard card={turnCard} size="md" />}
                {riverCard && <PokerCard card={riverCard} size="md" />}
              </div>
            </div>
          )}

          <div className="text-xl font-bold text-center text-poker-gold">
            Pot: ₹{potSize.toLocaleString('en-IN')}
          </div>

          <div className="space-y-2">
            {activePlayers.map((gp) => (
              <Button
                key={gp.player_id}
                onClick={() => finishHand(gp.player_id)}
                variant="outline"
                className="w-full h-auto py-4 hover:bg-poker-gold/20 hover:border-poker-gold"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">{gp.player.name}</span>
                  {gp.player_id === heroPlayer?.player_id && (
                    <Badge variant="secondary">Hero</Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlayer = activePlayers[currentPlayerIndex];

  return (
    <Card className="mt-6 border-primary/50">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-transparent">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>Hand #{currentHand?.hand_number} - {stage.toUpperCase()}</span>
          </div>
          <Badge variant="secondary" className="text-lg">
            Pot: ₹{potSize.toLocaleString('en-IN')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Show existing community cards */}
        {(flopCards || turnCard || riverCard) && (
          <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-4">
            <div className="text-sm font-semibold text-white mb-2">Board:</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {flopCards && flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                <PokerCard key={`flop-${idx}`} card={card} size="md" />
              ))}
              {turnCard && <PokerCard card={turnCard} size="md" />}
              {riverCard && <PokerCard card={riverCard} size="md" />}
            </div>
          </div>
        )}

        {/* Card input for current street */}
        {stage === 'flop' && !flopCards && (
          <CardNotationInput
            label="Flop Cards"
            expectedCards={3}
            onSubmit={saveStreetCards}
            placeholder="AhKd2c"
          />
        )}

        {stage === 'turn' && !turnCard && flopCards && (
          <CardNotationInput
            label="Turn Card"
            expectedCards={1}
            onSubmit={saveStreetCards}
            placeholder="Js"
          />
        )}

        {stage === 'river' && !riverCard && turnCard && (
          <CardNotationInput
            label="River Card"
            expectedCards={1}
            onSubmit={saveStreetCards}
            placeholder="9h"
          />
        )}

        {/* Action history for current street */}
        {streetActions.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-semibold mb-2">Street Actions:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {streetActions.map((action, idx) => {
                const player = game.game_players.find(gp => gp.player_id === action.player_id);
                return (
                  <div key={idx} className="text-xs flex justify-between">
                    <span className="font-medium">{player?.player.name}</span>
                    <span>
                      {action.action_type}
                      {action.bet_size > 0 && ` ₹${action.bet_size}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current player indicator */}
        <div className="bg-gradient-to-r from-poker-gold/20 to-transparent p-4 rounded-lg border border-poker-gold/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Action on:</div>
              <div className="text-xl font-bold">{currentPlayer?.player.name}</div>
            </div>
            {currentPlayer?.player_id === heroPlayer?.player_id && (
              <Badge className="bg-poker-gold text-black">YOU</Badge>
            )}
          </div>
          {currentBet > 0 && (
            <div className="mt-2 text-sm">
              Current Bet: <span className="font-bold">₹{currentBet}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => recordAction('Check')} 
            variant="outline"
            disabled={currentBet > 0}
          >
            Check
          </Button>
          <Button 
            onClick={() => recordAction('Call')} 
            variant="outline"
            disabled={currentBet === 0}
          >
            Call {currentBet > 0 && `₹${currentBet}`}
          </Button>
          <Button 
            onClick={() => recordAction('Fold')} 
            variant="destructive"
          >
            Fold
          </Button>
          <Button 
            onClick={() => recordAction('All-In')} 
            variant="secondary"
          >
            All-In
          </Button>
        </div>

        {/* Raise input */}
        <div>
          <Label>Raise To</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={`Min: ${currentBet * 2}`}
              min={currentBet * 2}
            />
            <Button onClick={() => recordAction('Raise')} disabled={!betAmount}>
              Raise
            </Button>
          </div>
        </div>

        {/* Move to next street button */}
        <Button 
          onClick={moveToNextStreet} 
          className="w-full" 
          variant="default"
          disabled={
            (stage === 'flop' && !flopCards) ||
            (stage === 'turn' && !turnCard) ||
            (stage === 'river' && !riverCard)
          }
        >
          {stage === 'river' ? 'Go to Showdown' : 'Next Street'} →
        </Button>
      </CardContent>
    </Card>
  );
};

export default HandTracking;
