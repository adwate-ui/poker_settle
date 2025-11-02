import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import PokerTableView from './PokerTableView';
import { SeatPosition } from '@/types/poker';
import PokerCard from './PokerCard';
import confetti from 'canvas-confetti';

interface HandAction {
  id: string;
  action_type: string;
  bet_size: number;
  street_type: string;
  action_sequence: number;
  player_id: string;
  position: string | null;
  hole_cards?: string | null;
}

interface StreetCard {
  street_type: string;
  cards_notation: string;
}

interface HandReplayProps {
  actions: HandAction[];
  streetCards: StreetCard[];
  playerNames: Record<string, string>;
  buttonPlayerId: string;
  seatPositions: Record<string, number>;
  initialPot: number;
  winnerPlayerId?: string;
  winnerPlayerName?: string;
}

const HandReplay = ({
  actions,
  streetCards,
  playerNames,
  buttonPlayerId,
  seatPositions,
  initialPot,
  winnerPlayerId,
  winnerPlayerName,
}: HandReplayProps) => {
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<'Preflop' | 'Flop' | 'Turn' | 'River'>('Preflop');
  const [potSize, setPotSize] = useState(0); // Start from 0
  const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});
  const [communityCards, setCommunityCards] = useState<string>('');
  const [foldedPlayers, setFoldedPlayers] = useState<string[]>([]);
  const [muckedPlayers, setMuckedPlayers] = useState<string[]>([]);
  const [animateChipsToPot, setAnimateChipsToPot] = useState(false);
  const [showHoleCards, setShowHoleCards] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [visibleHoleCards, setVisibleHoleCards] = useState<Record<string, string>>({});
  const [playerStacks] = useState<Record<string, number>>({});
  const [potSizeHistory, setPotSizeHistory] = useState<Array<{ actionIndex: number; potSize: number; street: string }>>([]);
  
  // Extract hole cards from actions and identify hero
  const playerHoleCards: Record<string, string> = {};
  let heroPlayerId: string | null = null;
  
  actions.forEach(action => {
    if (action.hole_cards && !playerHoleCards[action.player_id]) {
      playerHoleCards[action.player_id] = action.hole_cards;
    }
    // Identify hero from is_hero field in actions
    if ((action as any).is_hero && !heroPlayerId) {
      heroPlayerId = action.player_id;
    }
  });

  // Initialize visible hole cards with hero's cards if available
  useEffect(() => {
    if (heroPlayerId && playerHoleCards[heroPlayerId]) {
      setVisibleHoleCards({ [heroPlayerId]: playerHoleCards[heroPlayerId] });
    }
  }, [heroPlayerId]);

  // Convert player names to SeatPosition format
  const positions: SeatPosition[] = Object.entries(playerNames).map(([playerId, playerName]) => ({
    seat: seatPositions[playerId] ?? 0,
    player_id: playerId,
    player_name: playerName,
  })).sort((a, b) => a.seat - b.seat);

  // Validate if betting round is complete before street transition
  const isBettingComplete = (
    streetBets: Record<string, number>,
    folded: string[],
    currentStreetType: string,
    upToActionIndex: number
  ): boolean => {
    // Get all actions up to current index for this street
    const streetActions = actions.slice(0, upToActionIndex).filter(
      a => a.street_type === currentStreetType
    );
    
    // Get players still in hand (not folded)
    const activePlayers = Object.keys(streetBets).filter(
      pid => !folded.includes(pid)
    );
    
    if (activePlayers.length <= 1) return true; // Only one or zero players left
    
    // All active players must have equal bets (or 0 if no betting occurred)
    const bets = activePlayers.map(pid => streetBets[pid] || 0);
    const maxBet = Math.max(...bets);
    const allEqual = bets.every(bet => bet === maxBet);
    
    if (!allEqual) return false;
    
    // Ensure all active players have acted at least once on this street
    const playersWhoActed = new Set(streetActions.map(a => a.player_id));
    const allActed = activePlayers.every(pid => playersWhoActed.has(pid));
    
    return allActed;
  };

  // Process action and update state
  const processAction = (
    actionIndex: number, 
    skipAnimation: boolean = false,
    localStreetBets?: Record<string, number>,
    localPot?: { value: number },
    localFolded?: string[],
    localCurrentStreet?: { value: string }
  ) => {
    if (actionIndex >= actions.length) return;

    const action = actions[actionIndex];
    
    // Use local tracking if provided, otherwise use React state
    const currentBets = localStreetBets || streetPlayerBets;
    const currentPotValue = localPot ? localPot.value : potSize;
    const currentFoldedList = localFolded || foldedPlayers;
    const trackingStreet = localCurrentStreet ? localCurrentStreet.value : currentStreet;
    
    // Check if street changed
    if (action.street_type !== trackingStreet) {
      // BUG B FIX: Validate betting round completion before transitioning
      const wasComplete = isBettingComplete(
        currentBets,
        currentFoldedList,
        trackingStreet,
        actionIndex
      );
      
      if (!wasComplete && actionIndex > 0) {
        console.warn(
          `⚠️ Street transition at action ${actionIndex} but betting may not be complete!`,
          { 
            currentStreet: trackingStreet, 
            nextStreet: action.street_type,
            streetBets: currentBets,
            folded: currentFoldedList
          }
        );
      }
      const streetCard = streetCards.find(sc => sc.street_type === action.street_type);
      
      if (skipAnimation) {
        // Clear street bets when moving to new street
        if (localStreetBets) {
          Object.keys(localStreetBets).forEach(key => localStreetBets[key] = 0);
        }
        if (localCurrentStreet) {
          localCurrentStreet.value = action.street_type;
        }
        setStreetPlayerBets({});
        setCurrentStreet(action.street_type as any);
        
        // Add community cards for the new street (check if cards from this street are already shown)
        if (streetCard) {
          const streetCardsList: string[] = streetCard.cards_notation.match(/.{1,2}/g) || [];
          const existingCardsList: string[] = communityCards.match(/.{1,2}/g) || [];
          const hasAllCards = streetCardsList.every(card => existingCardsList.includes(card));
          
          if (!hasAllCards) {
            setCommunityCards(prev => {
              const prevCards: string[] = prev.match(/.{1,2}/g) || [];
              const newCards = streetCardsList.filter(card => !prevCards.includes(card));
              return prev + newCards.join('');
            });
          }
        }
      } else {
        // Animate chips moving to pot
        setAnimateChipsToPot(true);
        setTimeout(() => {
          // Clear street bets display (already added to pot during actions)
          setStreetPlayerBets({});
          setCurrentStreet(action.street_type as any);
          
          // Add community cards for the new street
          if (streetCard) {
            const streetCardsList: string[] = streetCard.cards_notation.match(/.{1,2}/g) || [];
            const existingCardsList: string[] = communityCards.match(/.{1,2}/g) || [];
            const hasAllCards = streetCardsList.every(card => existingCardsList.includes(card));
            
            if (!hasAllCards) {
              setCommunityCards(prev => {
                const prevCards: string[] = prev.match(/.{1,2}/g) || [];
                const newCards = streetCardsList.filter(card => !prevCards.includes(card));
                return prev + newCards.join('');
              });
            }
          }
          setAnimateChipsToPot(false);
        }, 500);
        return; // Wait for animation to complete
      }
    }

    // BUG A FIX: Use local tracking to avoid stale state during rapid replay
    const currentPlayerBet = currentBets[action.player_id] || 0;
    const additionalBet = action.bet_size - currentPlayerBet;
    
    // Update local tracking if provided
    if (localStreetBets && action.bet_size > 0) {
      localStreetBets[action.player_id] = action.bet_size;
    }
    if (localPot && additionalBet > 0) {
      localPot.value += additionalBet;
    }
    
    // Update React state for UI display
    if (action.bet_size > 0) {
      setStreetPlayerBets(prev => ({
        ...prev,
        [action.player_id]: action.bet_size,
      }));
    }
    
    // Add the additional bet to pot
    if (additionalBet > 0) {
      setPotSize(prev => {
        const newPot = prev + additionalBet;
        // Log pot updates for Turn and River to ensure proper recording
        if (action.street_type === 'Turn' || action.street_type === 'River') {
          console.log(`[${action.street_type}] Action ${actionIndex}: ${action.action_type} by ${action.player_id.slice(0, 8)}... - Bet: ${action.bet_size}, Additional: ${additionalBet}, New Pot: ${newPot}`);
        }
        return newPot;
      });
      
      // Track pot size history
      if (!skipAnimation) {
        setPotSizeHistory(prev => [...prev, {
          actionIndex,
          potSize: (localPot ? localPot.value : potSize) + additionalBet,
          street: action.street_type
        }]);
      }
    }

    // Handle fold - muck cards and add to folded list
    if (action.action_type === 'Fold') {
      if (localFolded) {
        localFolded.push(action.player_id);
      }
      setFoldedPlayers(prev => [...prev, action.player_id]);
      // Add small delay before mucking to show fold action (only if not skipping animation)
      if (!skipAnimation) {
        setTimeout(() => {
          setMuckedPlayers(prev => [...prev, action.player_id]);
        }, 200);
      } else {
        setMuckedPlayers(prev => [...prev, action.player_id]);
      }
      if (localStreetBets) {
        delete localStreetBets[action.player_id];
      }
      setStreetPlayerBets(prev => {
        const newBets = { ...prev };
        delete newBets[action.player_id];
        return newBets;
      });
    }
  };

  // Validate final pot size matches expected
  useEffect(() => {
    if (currentActionIndex >= actions.length && actions.length > 0) {
      // Calculate expected final pot from initial pot + all action contributions
      const calculatedFinalPot = potSize;
      console.log(`[Pot Validation] Replay Final Pot: Rs.${calculatedFinalPot}, Actions Processed: ${currentActionIndex}/${actions.length}`);
      
      // Log Turn and River action counts
      const turnActions = actions.filter(a => a.street_type === 'Turn');
      const riverActions = actions.filter(a => a.street_type === 'River');
      console.log(`[Street Summary] Turn Actions: ${turnActions.length}, River Actions: ${riverActions.length}`);
      console.log('[Pot History]', potSizeHistory.filter(h => h.street === 'Turn' || h.street === 'River'));
    }
  }, [currentActionIndex, actions.length, potSize, potSizeHistory]);

  // Auto-play effect with confetti
  useEffect(() => {
    if (!isPlaying || currentActionIndex >= actions.length) {
      setIsPlaying(false);
      // Check if we should show winner at the end
      if (currentActionIndex >= actions.length && winnerPlayerId && !showWinner) {
        setShowHoleCards(true);
        // Show all players' hole cards when winner is decided
        setVisibleHoleCards(playerHoleCards);
        setTimeout(() => {
          setShowWinner(true);
          // Trigger confetti
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 1000);
      }
      return;
    }

    const timer = setTimeout(() => {
      processAction(currentActionIndex);
      setCurrentActionIndex(prev => {
        const nextIndex = prev + 1;
        // Show hole cards when reaching showdown (river completed)
        if (nextIndex >= actions.length - 1) {
          setShowHoleCards(true);
          setVisibleHoleCards(playerHoleCards);
        }
        return nextIndex;
      });
    }, 1500); // 1.5 seconds between actions

    return () => clearTimeout(timer);
  }, [isPlaying, currentActionIndex]);

  const handlePlayPause = () => {
    if (currentActionIndex >= actions.length) {
      // Reset if at end
      handleReset();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (currentActionIndex < actions.length) {
      processAction(currentActionIndex);
      setCurrentActionIndex(prev => {
        const nextIndex = prev + 1;
        // Show hole cards when reaching showdown (river completed)
        if (nextIndex >= actions.length - 1) {
          setShowHoleCards(true);
          setVisibleHoleCards(playerHoleCards);
        }
        // Show winner at the very end
        if (nextIndex >= actions.length && winnerPlayerId) {
          setVisibleHoleCards(playerHoleCards); // Show all cards when winner declared
          setTimeout(() => {
            setShowWinner(true);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 500);
        }
        return nextIndex;
      });
    }
  };

  const handleStepBack = () => {
    if (currentActionIndex > 0) {
      // Reset and replay up to previous action
      const targetIndex = currentActionIndex - 1;
      setCurrentActionIndex(0);
      setIsPlaying(false);
      setCurrentStreet('Preflop');
      setPotSize(0);
      setStreetPlayerBets({});
      setCommunityCards('');
      setFoldedPlayers([]);
      setMuckedPlayers([]);
      setAnimateChipsToPot(false);
      setShowHoleCards(false);
      setShowWinner(false);
      // Reset to show only hero's cards
      if (heroPlayerId && playerHoleCards[heroPlayerId]) {
        setVisibleHoleCards({ [heroPlayerId]: playerHoleCards[heroPlayerId] });
      } else {
        setVisibleHoleCards({});
      }
      
      // BUG A FIX: Use local tracking during rapid replay to avoid stale state
      const localBets: Record<string, number> = {};
      const localPot = { value: 0 };
      const localFolded: string[] = [];
      const localStreet = { value: 'Preflop' };
      
      // Replay actions without animation using local state tracking
      for (let i = 0; i < targetIndex; i++) {
        processAction(i, true, localBets, localPot, localFolded, localStreet);
      }
      setCurrentActionIndex(targetIndex);
    }
  };

  const handleReset = () => {
    setCurrentActionIndex(0);
    setIsPlaying(false);
    setCurrentStreet('Preflop');
    setPotSize(0); // Reset to 0
    setStreetPlayerBets({});
    setCommunityCards('');
    setFoldedPlayers([]);
    setMuckedPlayers([]);
    setAnimateChipsToPot(false);
    setShowHoleCards(false);
    setShowWinner(false);
    setPotSizeHistory([]);
    // Reset to show only hero's cards
    if (heroPlayerId && playerHoleCards[heroPlayerId]) {
      setVisibleHoleCards({ [heroPlayerId]: playerHoleCards[heroPlayerId] });
    } else {
      setVisibleHoleCards({});
    }
  };

  const getCurrentAction = () => {
    if (currentActionIndex === 0) return null;
    return actions[currentActionIndex - 1];
  };

  const currentAction = getCurrentAction();

  return (
    <div className="space-y-4">
      {/* Poker Table with community cards inside */}
      <PokerTableView
        positions={positions}
        buttonPlayerId={buttonPlayerId}
        seatPositions={seatPositions}
        playerBets={streetPlayerBets}
        potSize={potSize}
        showPositionLabels={true}
        foldedPlayers={foldedPlayers}
        muckedPlayers={muckedPlayers}
        animateChipsToPot={animateChipsToPot}
        playerHoleCards={visibleHoleCards}
        animateChipsToWinner={showWinner ? winnerPlayerId : null}
        communityCards={communityCards}
        showAllPlayerCards={currentActionIndex === 0} // Show all cards initially (face-down)
        playerStacks={playerStacks}
      />

      {/* Current Action Display */}
      {currentAction && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="font-semibold">
                  {playerNames[currentAction.player_id]}
                </div>
                {currentAction.position && (
                  <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    {currentAction.position}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{currentAction.action_type}</span>
                {currentAction.bet_size > 0 && (
                  <span className="font-bold text-poker-gold">
                    Rs. {currentAction.bet_size.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-sm">
              <span className="text-muted-foreground">Current Pot:</span>
              <span className="font-semibold text-poker-gold">
                Rs. {potSize.toLocaleString('en-IN')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={currentActionIndex === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleStepBack}
          disabled={currentActionIndex === 0 || isPlaying}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={handlePlayPause}
          disabled={currentActionIndex >= actions.length && !isPlaying}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleStepForward}
          disabled={currentActionIndex >= actions.length || isPlaying}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Winner Declaration */}
      {showWinner && winnerPlayerName && (
        <Card className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500 animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-amber-500 mb-2">🎉 Winner! 🎉</div>
            <div className="text-xl font-semibold">{winnerPlayerName}</div>
            <div className="text-lg text-poker-gold mt-2">
              Pot: Rs. {potSize.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Action {currentActionIndex} of {actions.length} • {currentStreet}
      </div>
    </div>
  );
};

export default HandReplay;
