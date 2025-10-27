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
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, TrendingUp, Trophy } from 'lucide-react';
import CardNotationInput from './CardNotationInput';
import PokerCard from './PokerCard';
import { determineWinner, formatCardNotation } from '@/utils/pokerHandEvaluator';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  HandStage,
  ActionType,
  getNextPlayerIndex,
  getStartingPlayerIndex,
  isBettingRoundComplete,
  shouldEndHandEarly,
  getNextStage,
  canPlayerCheck,
  getCallAmount,
  processAction,
  resetForNewStreet
} from '@/utils/handStateMachine';

interface HandTrackingProps {
  game: Game;
}

const HandTracking = ({ game }: HandTrackingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [playerHoleCards, setPlayerHoleCards] = useState<Record<string, string>>({});
  const [showHoleCardInput, setShowHoleCardInput] = useState(false);
  const [selectedPlayerForHole, setSelectedPlayerForHole] = useState<string>('');
  const [playerBets, setPlayerBets] = useState<Record<string, number>>({});
  const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});

  // Find hero player - ALWAYS tag "Adwate" as the hero
  const heroPlayer = game.game_players.find(gp => 
    gp.player.name.toLowerCase() === 'adwate' || 
    gp.player.name === user?.email?.split('@')[0]
  );

  // Format amount with BB multiple
  const formatWithBB = (amount: number): string => {
    const bb = game.big_blind || 100;
    const bbMultiple = (amount / bb).toFixed(1);
    return `₹${amount.toLocaleString('en-IN')} (${bbMultiple} BB)`;
  };

  const getPlayerPosition = (buttonIndex: number, playerIndex: number, totalPlayers: number): string => {
    const relativePosition = (playerIndex - buttonIndex + totalPlayers) % totalPlayers;
    
    // Standard poker position assignments based on table size
    // Source: https://www.mypokercoaching.com/poker-positions-strategy-charts/
    
    if (totalPlayers === 2) {
      return relativePosition === 0 ? 'BTN/SB' : 'BB';
    }
    
    if (totalPlayers === 3) {
      const positions = ['BTN', 'SB', 'BB'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 4) {
      const positions = ['BTN', 'SB', 'BB', 'UTG'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 5) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'CO'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 6) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 7) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'HJ', 'CO'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 8) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'HJ', 'CO'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 9) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'];
      return positions[relativePosition];
    }
    
    if (totalPlayers === 10) {
      const positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP1', 'MP2', 'HJ', 'CO'];
      return positions[relativePosition];
    }
    
    // Fallback for unusual table sizes
    if (relativePosition === 0) return 'BTN';
    if (relativePosition === 1) return 'SB';
    if (relativePosition === 2) return 'BB';
    return `Seat ${relativePosition + 1}`;
  };

  const startNewHand = async () => {
    if (!buttonPlayerId) return;

    const nextHandNumber = await getNextHandNumber(game.id);
    
    // Filter out dealt-out players FIRST
    const active = game.game_players.filter(gp => !dealtOutPlayers.includes(gp.player_id));
    
    // Find button and hero indices in the ACTIVE players array
    const buttonIndex = active.findIndex(gp => gp.player_id === buttonPlayerId);
    const heroIndex = active.findIndex(gp => gp.player_id === heroPlayer?.player_id);
    
    // Calculate positions based on active players only
    const heroPosition = getPlayerPosition(buttonIndex, heroIndex, active.length);

    const hand = await createNewHand(game.id, buttonPlayerId, nextHandNumber, heroPosition);
    if (hand) {
      setCurrentHand(hand);
      setActivePlayers(active);
      setPlayersInHand(active.map(p => p.player_id));
      
      // Post blinds automatically - SB is immediate clockwise position from button
      const sbIndex = (buttonIndex + 1) % active.length;
      const bbIndex = (buttonIndex + 2) % active.length;
      
      const sbAmount = game.small_blind || 50;
      const bbAmount = game.big_blind || 100;
      
      // Initialize player bets
      const initialBets: Record<string, number> = {};
      active.forEach(p => initialBets[p.player_id] = 0);
      initialBets[active[sbIndex].player_id] = sbAmount;
      initialBets[active[bbIndex].player_id] = bbAmount;
      setPlayerBets(initialBets);
      setStreetPlayerBets(initialBets);
      
      // Record small blind
      const sbPosition = getPlayerPosition(buttonIndex, sbIndex, active.length);
      const sbAction = await recordPlayerAction(
        hand.id,
        active[sbIndex].player_id,
        'Preflop',
        'Small Blind',
        sbAmount,
        0,
        active[sbIndex].player_id === heroPlayer?.player_id,
        sbPosition
      );
      
      // Record big blind
      const bbPosition = getPlayerPosition(buttonIndex, bbIndex, active.length);
      const bbAction = await recordPlayerAction(
        hand.id,
        active[bbIndex].player_id,
        'Preflop',
        'Big Blind',
        bbAmount,
        1,
        active[bbIndex].player_id === heroPlayer?.player_id,
        bbPosition
      );
      
      if (sbAction && bbAction) {
      setStreetActions([sbAction, bbAction]);
      }
      
      // Use state machine to get starting player (UTG for preflop)
      const startingIndex = getStartingPlayerIndex('preflop', game.game_players, active, buttonPlayerId);
      setCurrentPlayerIndex(startingIndex);
      setStage('preflop');
      setCurrentBet(bbAmount);
      setPotSize(sbAmount + bbAmount);
      setActionSequence(2);
    }
  };

  const validateCardUniqueness = (newCards: string): boolean => {
    const allUsedCards: string[] = [];
    
    // Collect all hole cards
    Object.values(playerHoleCards).forEach(holeCards => {
      if (holeCards) {
        const cards = holeCards.match(/.{1,2}/g) || [];
        allUsedCards.push(...cards);
      }
    });
    
    // Collect community cards
    if (flopCards) {
      const cards = flopCards.match(/.{1,2}/g) || [];
      allUsedCards.push(...cards);
    }
    if (turnCard) allUsedCards.push(turnCard);
    if (riverCard) allUsedCards.push(riverCard);
    
    // Check new cards against used cards
    const newCardsList = newCards.match(/.{1,2}/g) || [];
    for (const card of newCardsList) {
      if (allUsedCards.includes(card)) {
        toast({
          title: 'Duplicate Card',
          description: `Card ${card} has already been used in this hand`,
          variant: 'destructive',
        });
        return false;
      }
    }
    
    return true;
  };

  const recordAction = async (actionType: ActionType) => {
    if (!currentHand || activePlayers.length === 0) return;

    const currentPlayer = activePlayers[currentPlayerIndex];
    const isHero = currentPlayer.player_id === heroPlayer?.player_id;
    const playerStreetBet = streetPlayerBets[currentPlayer.player_id] || 0;
    
    // Get button index to calculate position
    const buttonPlayerId = currentHand.button_player_id;
    const buttonIndex = game.game_players.findIndex(gp => gp.player_id === buttonPlayerId);
    const playerPosition = getPlayerPosition(buttonIndex, currentPlayerIndex, activePlayers.length);
    
    let betSize = 0;
    
    if (actionType === 'Small Blind') {
      betSize = (game.small_blind || 50);
    } else if (actionType === 'Big Blind') {
      betSize = (game.big_blind || 100);
    } else if (actionType === 'Call') {
      betSize = currentBet;
    } else if (actionType === 'Raise' || actionType === 'All-In') {
      betSize = parseFloat(betAmount) || currentBet;
    } else if (actionType === 'Check') {
      betSize = 0;
    }

    // Record action in database
    const action = await recordPlayerAction(
      currentHand.id,
      currentPlayer.player_id,
      stage === 'preflop' ? 'Preflop' : stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River',
      actionType,
      betSize,
      actionSequence,
      isHero,
      playerPosition
    );

    if (action) {
      setStreetActions(prev => [...prev, action]);
    }

    // Process action using state machine
    const stateUpdates = processAction(
      {
        stage,
        activePlayers,
        currentPlayerIndex,
        playersInHand,
        dealtOutPlayers,
        buttonPlayerIndex: buttonIndex,
        currentBet,
        potSize,
        streetPlayerBets,
        totalPlayerBets: playerBets,
        streetActions,
        actionSequence
      },
      actionType,
      betSize
    );

    // Apply state updates
    if (stateUpdates.potSize !== undefined) setPotSize(stateUpdates.potSize);
    if (stateUpdates.streetPlayerBets) setStreetPlayerBets(stateUpdates.streetPlayerBets);
    if (stateUpdates.totalPlayerBets) setPlayerBets(stateUpdates.totalPlayerBets);
    if (stateUpdates.actionSequence !== undefined) setActionSequence(stateUpdates.actionSequence);
    if (stateUpdates.currentBet !== undefined) setCurrentBet(stateUpdates.currentBet);
    
    // Handle fold - update active players and check for winner
    if (actionType === 'Fold') {
      if (stateUpdates.playersInHand) setPlayersInHand(stateUpdates.playersInHand);
      if (stateUpdates.activePlayers) {
        setActivePlayers(stateUpdates.activePlayers);
        
        // Check if only one player remains
        const endCheck = shouldEndHandEarly(stateUpdates.activePlayers, stateUpdates.playersInHand || []);
        if (endCheck.shouldEnd && endCheck.winnerId) {
          await finishHand([endCheck.winnerId]);
          return;
        }
      }
    }

    // Move to next player using state machine logic
    const nextIndex = getNextPlayerIndex(
      currentPlayerIndex,
      stage,
      stateUpdates.activePlayers || activePlayers,
      buttonIndex,
      stateUpdates.playersInHand || playersInHand
    );
    setCurrentPlayerIndex(nextIndex);
    setBetAmount('');
  };

  const moveToNextStreet = async () => {
    if (!currentHand) return;

    const nextStage = getNextStage(stage);
    
    // Update database with new stage
    const stageMap: Record<HandStage, 'Preflop' | 'Flop' | 'Turn' | 'River' | 'Showdown'> = {
      setup: 'Preflop',
      preflop: 'Flop',
      flop: 'Turn',
      turn: 'River',
      river: 'Showdown',
      showdown: 'Showdown',
      complete: 'Showdown'
    };
    await updateHandStage(currentHand.id, stageMap[nextStage]);
    
    // Use state machine to reset for new street
    const buttonIndex = game.game_players.findIndex(gp => gp.player_id === currentHand.button_player_id);
    const stateUpdates = resetForNewStreet(
      {
        stage,
        activePlayers,
        currentPlayerIndex,
        playersInHand,
        dealtOutPlayers,
        buttonPlayerIndex: buttonIndex,
        currentBet,
        potSize,
        streetPlayerBets,
        totalPlayerBets: playerBets,
        streetActions,
        actionSequence
      },
      game.game_players,
      currentHand.button_player_id
    );
    
    // Apply updates
    if (stateUpdates.stage) setStage(stateUpdates.stage);
    if (stateUpdates.currentPlayerIndex !== undefined) setCurrentPlayerIndex(stateUpdates.currentPlayerIndex);
    if (stateUpdates.currentBet !== undefined) setCurrentBet(stateUpdates.currentBet);
    if (stateUpdates.streetPlayerBets) setStreetPlayerBets(stateUpdates.streetPlayerBets);
    if (stateUpdates.streetActions) setStreetActions(stateUpdates.streetActions);
  };

  const moveToPreviousStreet = () => {
    if (stage === 'river') {
      setStage('turn');
      setRiverCard('');
    } else if (stage === 'turn') {
      setStage('flop');
      setTurnCard('');
    } else if (stage === 'flop') {
      setStage('preflop');
      setFlopCards('');
    }
  };

  const saveStreetCards = async (cards: string) => {
    if (!currentHand) return;

    if (!validateCardUniqueness(cards)) {
      return;
    }

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

  const finishHand = async (winnerIds: string[]) => {
    if (!currentHand) return;

    const isHeroWin = winnerIds.includes(heroPlayer?.player_id || '');
    await completeHand(currentHand.id, winnerIds, potSize, isHeroWin);
    
    // Save hole cards to player_actions if entered
    if (Object.keys(playerHoleCards).length > 0) {
      for (const [playerId, holeCards] of Object.entries(playerHoleCards)) {
        const lastAction = await recordPlayerAction(
          currentHand.id,
          playerId,
          'River',
          'Check',
          0,
          actionSequence,
          playerId === heroPlayer?.player_id
        );
        
        if (lastAction) {
          // Update with hole cards
          await supabase
            .from('player_actions')
            .update({ hole_cards: holeCards })
            .eq('id', lastAction.id);
        }
      }
    }
    
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
    setPlayerHoleCards({});
    setPlayerBets({});
    setStreetPlayerBets({});
  };

  const handleHoleCardSubmit = (cards: string) => {
    if (selectedPlayerForHole) {
      if (!validateCardUniqueness(cards)) {
        return;
      }
      setPlayerHoleCards(prev => ({
        ...prev,
        [selectedPlayerForHole]: cards
      }));
      setShowHoleCardInput(false);
      setSelectedPlayerForHole('');
    }
  };

  const autoSelectWinner = () => {
    // Check if all active players have hole cards
    const allHaveHoleCards = activePlayers.every(p => playerHoleCards[p.player_id]);
    
    if (!allHaveHoleCards) {
      return null;
    }

    // Get all community cards
    const allCommunityCards = (flopCards || '') + (turnCard || '') + (riverCard || '');
    
    if (allCommunityCards.length < 10) { // Need at least 5 cards (10 chars)
      return null;
    }

    const playersWithHoles = activePlayers.map(p => ({
      playerId: p.player_id,
      playerName: p.player.name,
      holeCards: playerHoleCards[p.player_id]
    }));

    return determineWinner(playersWithHoles, allCommunityCards);
  };

  const deleteAction = async (actionId: string) => {
    if (!currentHand) return;

    try {
      // Find the action being deleted
      const actionToDelete = streetActions.find(a => a.id === actionId);
      if (!actionToDelete) return;

      const { error } = await supabase
        .from('player_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      // Refresh street actions
      const remainingActions = streetActions.filter(a => a.id !== actionId);
      setStreetActions(remainingActions);
      
      // Recalculate pot - subtract the deleted action's contribution
      const deletedBetContribution = actionToDelete.bet_size - (playerBets[actionToDelete.player_id] || 0);
      setPotSize(prev => Math.max(0, prev - deletedBetContribution));
      
      // Recalculate player bets for current street
      const newPlayerBets: Record<string, number> = {};
      activePlayers.forEach(p => newPlayerBets[p.player_id] = 0);
      
      remainingActions.forEach(action => {
        newPlayerBets[action.player_id] = Math.max(
          newPlayerBets[action.player_id],
          action.bet_size
        );
      });
      
      setPlayerBets(newPlayerBets);
      
      // Recalculate current bet
      const maxBet = Math.max(0, ...Object.values(newPlayerBets));
      setCurrentBet(maxBet);
      
      // Decrement action sequence
      setActionSequence(prev => Math.max(0, prev - 1));

      toast({
        title: 'Action Deleted',
        description: 'The action has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete action',
        variant: 'destructive',
      });
    }
  };

  const canMoveToNextStreet = (): boolean => {
    if (!currentHand) return false;
    
    // Check if cards are dealt for this street
    if (stage === 'flop' && !flopCards) return false;
    if (stage === 'turn' && !turnCard) return false;
    if (stage === 'river' && !riverCard) return false;
    
    // Use state machine to check if betting round is complete
    return isBettingRoundComplete(
      stage,
      activePlayers,
      playersInHand,
      streetPlayerBets,
      streetActions,
      currentHand.button_player_id
    );
  };

  const canCheck = (): boolean => {
    if (!currentPlayer) return false;
    return canPlayerCheck(currentPlayer.player_id, currentBet, streetPlayerBets);
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
    const winnerResult = autoSelectWinner();
    
    return (
      <>
        <Card className="mt-6 border-poker-gold/50">
          <CardHeader className="bg-gradient-to-r from-poker-gold/20 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-poker-gold" />
              Showdown
              {winnerResult && (
                <Badge className="ml-auto bg-green-600">Winner Detected!</Badge>
              )}
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
              Pot: {formatWithBB(potSize)}
            </div>

            {/* Hole Cards Entry Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Player Hole Cards</h3>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(playerHoleCards).length}/{activePlayers.length} entered
                </p>
              </div>
              
              <div className="space-y-2">
                {activePlayers.map((gp) => (
                  <div
                    key={gp.player_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{gp.player.name}</span>
                      {gp.player_id === heroPlayer?.player_id && (
                        <Badge variant="secondary" className="text-xs">Hero</Badge>
                      )}
                    </div>
                    
                    {playerHoleCards[gp.player_id] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {playerHoleCards[gp.player_id].match(/.{1,2}/g)?.map((card, idx) => (
                            <PokerCard key={idx} card={card} size="sm" />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayerForHole(gp.player_id);
                            setShowHoleCardInput(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPlayerForHole(gp.player_id);
                          setShowHoleCardInput(true);
                        }}
                      >
                        Add Hole Cards
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Winner Display */}
            {winnerResult && (
              <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-600/50 rounded-lg p-4">
                <div className="text-center space-y-3">
                  {winnerResult.winners.length === 1 ? (
                    <>
                      <div className="text-2xl font-bold text-green-400">
                        🏆 {winnerResult.winners[0].playerName} Wins!
                      </div>
                      <div className="text-lg font-semibold text-poker-gold">
                        {winnerResult.winners[0].handName}
                      </div>
                      <div className="flex gap-1 justify-center">
                        {winnerResult.winners[0].bestHand.map((card, idx) => (
                          <PokerCard key={idx} card={card} size="sm" />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-400">
                        🏆 Chopped Pot!
                      </div>
                      <div className="text-lg font-semibold text-poker-gold">
                        {winnerResult.winners.length} Players with {winnerResult.winners[0].handName}
                      </div>
                      <div className="space-y-2">
                        {winnerResult.winners.map((winner) => (
                          <div key={winner.playerId} className="flex items-center justify-center gap-2">
                            <span className="font-medium">{winner.playerName}</span>
                            <div className="flex gap-1">
                              {winner.bestHand.map((card, idx) => (
                                <PokerCard key={idx} card={card} size="sm" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {winnerResult.allHands.length > 1 && (
                    <details className="text-sm text-left">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View All Hands
                      </summary>
                      <div className="mt-2 space-y-2">
                        {winnerResult.allHands.map((hand, idx) => (
                          <div key={hand.playerId} className="p-2 bg-muted/30 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {idx + 1}. {hand.playerName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {hand.handName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  
                  <Button
                    onClick={() => finishHand(winnerResult.winners.map(w => w.playerId))}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Confirm & Complete Hand
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Winner Selection (if auto-detection not possible) */}
            {!winnerResult && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  {Object.keys(playerHoleCards).length === 0
                    ? 'Add hole cards for automatic winner detection, or select winner manually:'
                    : 'Add all hole cards for automatic detection, or select winner manually:'}
                </p>
                {activePlayers.map((gp) => (
                  <Button
                    key={gp.player_id}
                    onClick={() => finishHand([gp.player_id])}
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
            )}
          </CardContent>
        </Card>

        {/* Hole Card Input Dialog */}
        <Dialog open={showHoleCardInput} onOpenChange={setShowHoleCardInput}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Enter Hole Cards for{' '}
                {activePlayers.find(p => p.player_id === selectedPlayerForHole)?.player.name}
              </DialogTitle>
            </DialogHeader>
            <CardNotationInput
              label="Hole Cards"
              expectedCards={2}
              onSubmit={handleHoleCardSubmit}
              placeholder="AhKd"
            />
          </DialogContent>
        </Dialog>
      </>
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
            Pot: {formatWithBB(potSize)}
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

        {/* Remaining Players */}
        {playersInHand.length > 0 && (
          <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-semibold mb-2">Remaining Players ({playersInHand.length}):</div>
            <div className="flex flex-wrap gap-2">
              {activePlayers
                .filter(p => playersInHand.includes(p.player_id))
                .map((gp) => {
                  const buttonIndex = game.game_players.findIndex(player => player.player_id === currentHand?.button_player_id);
                  const playerIndex = activePlayers.findIndex(p => p.player_id === gp.player_id);
                  const position = getPlayerPosition(buttonIndex, playerIndex, activePlayers.length);
                  
                  return (
                    <div key={gp.player_id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      <span className="font-medium">{gp.player.name}</span>
                      <span className="text-muted-foreground">({position})</span>
                      {gp.player_id === heroPlayer?.player_id && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">Hero</Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Action history for current street */}
        {streetActions.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-semibold mb-2">Street Actions:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {streetActions.map((action, idx) => {
                const player = game.game_players.find(gp => gp.player_id === action.player_id);
                const canDelete = stage !== 'preflop' || idx >= 2; // Can't delete blinds
                
                return (
                  <div key={idx} className="text-xs flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{player?.player.name}</span>
                      {action.position && (
                        <span className="text-muted-foreground">({action.position})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        {action.action_type}
                        {action.bet_size > 0 && ` ${formatWithBB(action.bet_size)}`}
                      </span>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/20"
                          onClick={() => deleteAction(action.id)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
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
              Current Bet: <span className="font-bold">{formatWithBB(currentBet)}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!canMoveToNextStreet() ? (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => recordAction('Check')} 
              variant="outline"
              disabled={!canCheck()}
            >
              Check
            </Button>
            <Button 
              onClick={() => recordAction('Call')} 
              variant="outline"
              disabled={currentBet === 0}
            >
              Call {currentBet > 0 && currentPlayer && formatWithBB(getCallAmount(currentPlayer.player_id, currentBet, streetPlayerBets))}
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
        ) : (
          <div className="bg-gradient-to-r from-poker-gold/20 to-transparent p-4 rounded-lg border-2 border-poker-gold">
            <p className="text-center font-semibold text-poker-gold mb-2">
              All bets are matched! Ready to move to next street.
            </p>
          </div>
        )}

        {/* Raise input */}
        {!canMoveToNextStreet() && (
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
        )}

        {/* Navigation buttons */}
        <div className="flex gap-2">
          {(stage === 'flop' || stage === 'turn' || stage === 'river') && (
            <Button 
              onClick={moveToPreviousStreet} 
              className="flex-1" 
              variant="outline"
            >
              ← Previous Street
            </Button>
          )}
          <Button 
            onClick={moveToNextStreet} 
            className="flex-1" 
            variant="default"
            disabled={!canMoveToNextStreet()}
          >
            {stage === 'river' ? 'Go to Showdown' : 'Next Street'} →
          </Button>
        </div>
        
        {!canMoveToNextStreet() && (
          <p className="text-xs text-muted-foreground text-center">
            {(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)
              ? 'Deal cards to continue'
              : stage === 'preflop'
              ? 'All bets must be equal and SB/BB must act at least twice'
              : 'All bets must be equal and all players must act at least once'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HandTracking;
