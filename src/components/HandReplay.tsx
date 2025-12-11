import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [potSize, setPotSize] = useState(0); // Start at 0, blinds are in actions
  const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});
  const [uncommittedPot, setUncommittedPot] = useState(0); // Chips not yet swept to pot
  const [communityCards, setCommunityCards] = useState<string>('');
  const [foldedPlayers, setFoldedPlayers] = useState<string[]>([]);
  const [muckedPlayers, setMuckedPlayers] = useState<string[]>([]);
  const [animateChipsToPot, setAnimateChipsToPot] = useState(false);
  const [animatingPlayerId, setAnimatingPlayerId] = useState<string | null>(null); // Track which player's chips are animating
  const [showHoleCards, setShowHoleCards] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winningAmount, setWinningAmount] = useState(0); // Store the winning pot amount
  const [visibleHoleCards, setVisibleHoleCards] = useState<Record<string, string>>({});
  const [playerStacks] = useState<Record<string, number>>({});
  const [potSizeHistory, setPotSizeHistory] = useState<Array<{ actionIndex: number; potSize: number; street: string }>>([]);
  
  // Extract hole cards from actions and identify hero
  const playerHoleCards: Record<string, string> = {};
  let heroPlayerId: string | null = null;
  
  interface ActionWithHero extends HandAction {
    is_hero?: boolean;
  }
  
  actions.forEach(action => {
    if (action.hole_cards && !playerHoleCards[action.player_id]) {
      playerHoleCards[action.player_id] = action.hole_cards;
    }
    // Identify hero from is_hero field in actions
    if ((action as ActionWithHero).is_hero && !heroPlayerId) {
      heroPlayerId = action.player_id;
    }
  });

  // Initialize visible hole cards with hero's cards if available
  // Keep hero's cards visible throughout the replay unless explicitly hidden
  useEffect(() => {
    if (heroPlayerId && playerHoleCards[heroPlayerId]) {
      setVisibleHoleCards(prev => {
        // Always ensure hero's cards are visible
        return { ...prev, [heroPlayerId]: playerHoleCards[heroPlayerId] };
      });
    }
  }, [heroPlayerId]); // Only run when heroPlayerId changes, not on every action

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
        // Sweep all uncommitted chips to pot
        const uncommittedAmount = Object.values(currentBets).reduce((sum, bet) => sum + bet, 0);
        if (localPot) {
          localPot.value += uncommittedAmount;
        }
        setPotSize(prev => prev + uncommittedAmount);
        setUncommittedPot(0);
        
        // Clear street bets when moving to new street
        if (localStreetBets) {
          Object.keys(localStreetBets).forEach(key => localStreetBets[key] = 0);
        }
        if (localCurrentStreet) {
          localCurrentStreet.value = action.street_type;
        }
        setStreetPlayerBets({});
        setCurrentStreet(action.street_type as 'Preflop' | 'Flop' | 'Turn' | 'River');
        
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
        // Sweep all uncommitted chips to pot with animation
        const uncommittedAmount = Object.values(streetPlayerBets).reduce((sum, bet) => sum + bet, 0);
        setPotSize(prev => prev + uncommittedAmount);
        setUncommittedPot(0);
        
        // Animate chips moving to pot
        setAnimateChipsToPot(true);
        setTimeout(() => {
          // Clear street bets display
          setStreetPlayerBets({});
          setCurrentStreet(action.street_type as 'Preflop' | 'Flop' | 'Turn' | 'River');
          
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
    
    // Update React state for UI display
    if (action.bet_size > 0) {
      setStreetPlayerBets(prev => ({
        ...prev,
        [action.player_id]: action.bet_size,
      }));
    }
    
    // Track uncommitted pot (chips in front of players, not yet swept to pot)
    if (additionalBet > 0) {
      setUncommittedPot(prev => prev + additionalBet);
      
      // Track for local state if provided (for fast replay)
      if (localPot) {
        // For local tracking during fast replay, we still accumulate to help with calculations
        // but the UI won't show this as pot until street changes
        localPot.value += additionalBet;
      }
      
      // Log bet tracking
      if (action.street_type === 'Turn' || action.street_type === 'River') {
        console.log(`[${action.street_type}] Action ${actionIndex}: ${action.action_type} by ${action.player_id.slice(0, 8)}... - Bet: ${action.bet_size}, Additional: ${additionalBet}, Uncommitted: ${uncommittedPot + additionalBet}`);
      }
    }

    // Handle fold - muck cards and add to folded list
    if (action.action_type === 'Fold') {
      const foldedPlayerBet = currentBets[action.player_id] || 0;
      
      // Animate folded player's street bets moving to pot
      if (foldedPlayerBet > 0 && !skipAnimation) {
        // Trigger chip animation for this specific player
        setAnimatingPlayerId(action.player_id);
        setAnimateChipsToPot(true);
        setTimeout(() => {
          setAnimateChipsToPot(false);
          setAnimatingPlayerId(null);
        }, 500);
      }
      
      // Move folded player's bets to pot immediately
      if (foldedPlayerBet > 0) {
        if (localPot) {
          localPot.value += foldedPlayerBet;
        }
        setPotSize(prev => prev + foldedPlayerBet);
        setUncommittedPot(prev => prev - foldedPlayerBet);
      }
      
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
      
      // Remove folded player's street bets from display
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
          // Save winning amount before clearing pot
          const totalWinnings = potSize + uncommittedPot;
          setWinningAmount(totalWinnings);
          setShowWinner(true);
          // After a brief delay, move chips to winner and clear pot
          setTimeout(() => {
            setPotSize(0);
            setUncommittedPot(0);
          }, 500);
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
            // Save winning amount before clearing pot
            const totalWinnings = potSize + uncommittedPot;
            setWinningAmount(totalWinnings);
            setShowWinner(true);
            // Move chips to winner and clear pot
            setTimeout(() => {
              setPotSize(0);
              setUncommittedPot(0);
            }, 500);
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
      setPotSize(0); // Reset to 0, blinds are in actions
      setUncommittedPot(0); // Reset uncommitted chips
      setStreetPlayerBets({});
      setCommunityCards('');
      setFoldedPlayers([]);
      setMuckedPlayers([]);
      setAnimateChipsToPot(false);
      setAnimatingPlayerId(null);
      setShowHoleCards(false);
      setShowWinner(false);
      setWinningAmount(0);
      // Preserve hero's cards during jump
      if (heroPlayerId && playerHoleCards[heroPlayerId]) {
        setVisibleHoleCards(prev => ({ ...prev, [heroPlayerId]: playerHoleCards[heroPlayerId] }));
      }
      
      // BUG A FIX: Use local tracking during rapid replay to avoid stale state
      const localBets: Record<string, number> = {};
      const localPot = { value: 0 }; // Start at 0, blinds are in actions
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
    setPotSize(0); // Reset to 0, blinds are in actions
    setUncommittedPot(0); // Reset uncommitted chips
    setStreetPlayerBets({});
    setCommunityCards('');
    setFoldedPlayers([]);
    setMuckedPlayers([]);
    setAnimateChipsToPot(false);
    setAnimatingPlayerId(null);
    setShowHoleCards(false);
    setShowWinner(false);
    setWinningAmount(0);
    setPotSizeHistory([]);
    // Initialize with hero's cards
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
    <div className="space-y-6 animate-fade-in">
      {/* Poker Table with community cards inside */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-4 rounded-2xl border-2 border-green-700/40 shadow-2xl">
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
          animatingPlayerId={animatingPlayerId}
          playerHoleCards={visibleHoleCards}
          animateChipsToWinner={showWinner ? winnerPlayerId : null}
          communityCards={communityCards}
          showAllPlayerCards={currentActionIndex === 0} // Show all cards initially (face-down)
          playerStacks={playerStacks}
          showPotChips={Object.keys(streetPlayerBets).length === 0 || animateChipsToPot} // Only show pot chips when no active bets or during sweep animation
        />
      </div>

      {/* Current Action Display */}
      {currentAction && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-lg animate-fade-in">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="font-bold text-base sm:text-lg">
                    {playerNames[currentAction.player_id]}
                  </div>
                  {currentAction.position && (
                    <Badge className="w-fit text-xs bg-primary/30 text-primary-foreground border-primary/40">
                      {currentAction.position}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <Badge variant="outline" className="w-fit text-sm font-semibold">
                  {currentAction.action_type}
                </Badge>
                {currentAction.bet_size > 0 && (
                  <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                    Rs. {currentAction.bet_size.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Current Pot:</span>
              <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                Rs. {(potSize + uncommittedPot).toLocaleString('en-IN')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playback Controls */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={currentActionIndex === 0}
              className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-primary/10"
              title="Reset to beginning"
            >
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleStepBack}
              disabled={currentActionIndex === 0 || isPlaying}
              className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-primary/10"
              title="Step back"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="icon"
              onClick={handlePlayPause}
              disabled={currentActionIndex >= actions.length && !isPlaying}
              className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleStepForward}
              disabled={currentActionIndex >= actions.length || isPlaying}
              className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-primary/10"
              title="Step forward"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
              <span className="font-medium">Action {currentActionIndex} of {actions.length}</span>
              <Badge variant="secondary" className="text-xs">
                {currentStreet}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${(currentActionIndex / actions.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Declaration */}
      {showWinner && winnerPlayerName && (
        <Card className="bg-gradient-to-br from-amber-500/30 via-yellow-500/30 to-amber-500/30 border-2 border-amber-500 animate-fade-in shadow-2xl">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-3xl sm:text-4xl font-bold mb-3 animate-bounce">
              🎉🏆🎉
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
              {winnerPlayerName} Wins!
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-3">
              Winnings: Rs. {winningAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-muted-foreground mt-2 italic">
              Chips moved to winner
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HandReplay;
