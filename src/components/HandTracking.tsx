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

interface HandTrackingProps {
  game: Game;
}

type HandStage = 'setup' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';
type ActionType = 'Small Blind' | 'Big Blind' | 'Straddle' | 'Re-Straddle' | 'Check' | 'Call' | 'Raise' | 'Fold' | 'All-In';

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

  // Find hero player (current user)
  const heroPlayer = game.game_players.find(gp => gp.player.name === user?.email?.split('@')[0] || 'Adwate');

  // Format amount with BB multiple
  const formatWithBB = (amount: number): string => {
    const bb = game.big_blind || 100;
    const bbMultiple = (amount / bb).toFixed(1);
    return `₹${amount.toLocaleString('en-IN')} (${bbMultiple} BB)`;
  };

  const getPlayerPosition = (buttonIndex: number, playerIndex: number, totalPlayers: number): string => {
    const relativePosition = (playerIndex - buttonIndex + totalPlayers) % totalPlayers;
    
    if (totalPlayers === 2) {
      return relativePosition === 0 ? 'Button/SB' : 'BB';
    }
    
    const positionMap: { [key: number]: string } = {
      0: 'Button',
      1: 'Small Blind',
      2: 'Big Blind',
    };
    
    if (relativePosition in positionMap) {
      return positionMap[relativePosition];
    }
    
    // For seats after BB
    const seatsAfterBB = relativePosition - 2;
    if (totalPlayers <= 6) {
      // 6-max positions
      if (seatsAfterBB === 1) return 'UTG';
      if (seatsAfterBB === 2) return 'HJ';
      if (seatsAfterBB === 3) return 'CO';
    } else {
      // Full ring positions
      if (seatsAfterBB === 1) return 'UTG';
      if (seatsAfterBB === 2) return 'UTG+1';
      if (seatsAfterBB === 3) return 'UTG+2';
      if (totalPlayers === 9 && seatsAfterBB === 4) return 'LJ';
      if (totalPlayers === 9 && seatsAfterBB === 5) return 'HJ';
      if (totalPlayers === 9 && seatsAfterBB === 6) return 'CO';
      if (totalPlayers === 8 && seatsAfterBB === 4) return 'HJ';
      if (totalPlayers === 8 && seatsAfterBB === 5) return 'CO';
    }
    
    return `Seat ${relativePosition + 1}`;
  };

  const startNewHand = async () => {
    if (!buttonPlayerId) return;

    const nextHandNumber = await getNextHandNumber(game.id);
    const buttonIndex = game.game_players.findIndex(gp => gp.player_id === buttonPlayerId);
    const heroIndex = game.game_players.findIndex(gp => gp.player_id === heroPlayer?.player_id);
    const heroPosition = getPlayerPosition(buttonIndex, heroIndex, game.game_players.length);

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
      
      // Start with player after big blind (UTG)
      const utgIndex = (buttonIndex + 3) % active.length;
      setCurrentPlayerIndex(utgIndex);
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
    let additionalAmount = 0;
    
    if (actionType === 'Small Blind') {
      betSize = (game.small_blind || 50);
      additionalAmount = betSize;
    } else if (actionType === 'Big Blind') {
      betSize = (game.big_blind || 100);
      additionalAmount = betSize;
    } else if (actionType === 'Call') {
      // Call amount = max bet on this street - player's bet on this street
      betSize = currentBet;
      additionalAmount = currentBet - playerStreetBet;
    } else if (actionType === 'Raise') {
      betSize = parseFloat(betAmount) || currentBet;
      additionalAmount = betSize - playerStreetBet;
    } else if (actionType === 'Check') {
      betSize = 0;
      additionalAmount = 0;
    } else if (actionType === 'All-In') {
      betSize = parseFloat(betAmount) || currentBet;
      additionalAmount = betSize - playerStreetBet;
    }

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

    // Update player bets for this street
    setStreetPlayerBets(prev => ({
      ...prev,
      [currentPlayer.player_id]: betSize
    }));
    
    // Update total player bets across all streets
    setPlayerBets(prev => ({
      ...prev,
      [currentPlayer.player_id]: (prev[currentPlayer.player_id] || 0) + additionalAmount
    }));

    // Update pot with additional amount
    setPotSize(prev => prev + additionalAmount);
    setActionSequence(prev => prev + 1);

    // If fold, remove player from players in hand
    if (actionType === 'Fold') {
      setPlayersInHand(prev => prev.filter(id => id !== currentPlayer.player_id));
      const remainingActive = activePlayers.filter(p => p.player_id !== currentPlayer.player_id);
      setActivePlayers(remainingActive);
      
      // If only one player left, they win
      if (remainingActive.length === 1) {
        await finishHand([remainingActive[0].player_id]);
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
    
    // Reset for next street - post-flop action starts from small blind
    if (stage !== 'preflop') {
      // Find small blind position (1 seat after button)
      const buttonIndex = game.game_players.findIndex(gp => gp.player_id === currentHand.button_player_id);
      const sbIndex = (buttonIndex + 1) % activePlayers.length;
      setCurrentPlayerIndex(sbIndex);
    } else {
      setCurrentPlayerIndex(0);
    }
    
    setCurrentBet(0);
    setStreetActions([]);
    
    // Reset player bets for new street
    const resetBets: Record<string, number> = {};
    activePlayers.forEach(p => resetBets[p.player_id] = 0);
    setStreetPlayerBets(resetBets);
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
    // Check if cards are dealt for this street
    if (stage === 'flop' && !flopCards) return false;
    if (stage === 'turn' && !turnCard) return false;
    if (stage === 'river' && !riverCard) return false;
    
    // Check if all remaining players have equal bets
    const activeBets = activePlayers
      .filter(p => playersInHand.includes(p.player_id))
      .map(p => streetPlayerBets[p.player_id] || 0);
    
    if (activeBets.length === 0) return false;
    
    const maxBet = Math.max(...activeBets);
    const allBetsEqual = activeBets.every(bet => bet === maxBet);
    
    if (!allBetsEqual) return false;
    
    // Pre-flop: SB and BB must act at least twice
    if (stage === 'preflop') {
      const buttonIndex = game.game_players.findIndex(gp => gp.player_id === currentHand?.button_player_id);
      const sbIndex = (buttonIndex + 1) % activePlayers.length;
      const bbIndex = (buttonIndex + 2) % activePlayers.length;
      const sbPlayerId = activePlayers[sbIndex]?.player_id;
      const bbPlayerId = activePlayers[bbIndex]?.player_id;
      
      // Count actions for SB and BB (excluding blind posting)
      const sbActionCount = streetActions.filter(
        a => a.player_id === sbPlayerId && a.action_type !== 'Small Blind'
      ).length;
      const bbActionCount = streetActions.filter(
        a => a.player_id === bbPlayerId && a.action_type !== 'Big Blind'
      ).length;
      
      // Both must have acted at least twice (not including initial blinds)
      if (sbActionCount < 2 || bbActionCount < 2) {
        return false;
      }
    } else {
      // Post-flop: All players must act at least once
      const playersStillIn = activePlayers.filter(p => playersInHand.includes(p.player_id));
      const playersWhoActed = new Set(streetActions.map(a => a.player_id));
      
      for (const player of playersStillIn) {
        if (!playersWhoActed.has(player.player_id)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const canCheck = (): boolean => {
    const playerCurrentBet = playerBets[currentPlayer?.player_id] || 0;
    return currentBet === 0 || currentBet === playerCurrentBet;
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
              Call {currentBet > 0 && formatWithBB(currentBet - (streetPlayerBets[currentPlayer?.player_id] || 0))}
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
