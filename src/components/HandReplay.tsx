import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
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

type HandStage = 'Preflop' | 'Flop' | 'Turn' | 'River' | 'showdown';

interface ReplayState {
  currentActionIndex: number;
  isPlaying: boolean;
  currentStreet: HandStage;
  potSize: number;
  streetPlayerBets: Record<string, number>;
  uncommittedPot: number;
  communityCards: string;
  foldedPlayers: string[];
  muckedPlayers: string[];
  animateChipsToPot: boolean;
  animatingPlayerId: string | null;
  showHoleCards: boolean;
  showWinner: boolean;
  winningAmount: number;
  visibleHoleCards: Record<string, string>;
}

type ReplayActionType =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'STEP_FORWARD'; actions: HandAction[]; streetCards: StreetCard[]; playerHoleCards: Record<string, string>; winnerPlayerId?: string }
  | { type: 'STEP_BACK'; actions: HandAction[]; streetCards: StreetCard[]; playerHoleCards: Record<string, string>; heroPlayerId: string | null }
  | { type: 'RESET'; heroPlayerId: string | null; playerHoleCards: Record<string, string> }
  | { type: 'UPDATE_STATE'; payload: Partial<ReplayState> }
  | { type: 'SHOW_SHOWDOWN'; playerHoleCards: Record<string, string> }
  | { type: 'SHOW_WINNER'; winningAmount: number };

const initialState: ReplayState = {
  currentActionIndex: 0,
  isPlaying: false,
  currentStreet: 'Preflop',
  potSize: 0,
  streetPlayerBets: {},
  uncommittedPot: 0,
  communityCards: '',
  foldedPlayers: [],
  muckedPlayers: [],
  animateChipsToPot: false,
  animatingPlayerId: null,
  showHoleCards: false,
  showWinner: false,
  winningAmount: 0,
  visibleHoleCards: {},
};

function replayReducer(state: ReplayState, action: ReplayActionType): ReplayState {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    case 'SHOW_SHOWDOWN':
      return {
        ...state,
        showHoleCards: true,
        visibleHoleCards: action.playerHoleCards,
      };
    case 'SHOW_WINNER':
      return {
        ...state,
        showWinner: true,
        winningAmount: action.winningAmount,
        potSize: 0,
        uncommittedPot: 0,
      };
    case 'RESET':
      return {
        ...initialState,
        visibleHoleCards: action.heroPlayerId ? { [action.heroPlayerId]: action.playerHoleCards[action.heroPlayerId] } : {},
      };
    case 'STEP_FORWARD': {
      if (state.currentActionIndex >= action.actions.length) return state;

      const currentAction = action.actions[state.currentActionIndex];
      let newState = { ...state };

      // Handle street change logic (simultaneous update)
      if (currentAction.street_type !== state.currentStreet) {
        const uncommittedAmount = Object.values(state.streetPlayerBets).reduce((sum, bet) => sum + bet, 0);
        const streetCard = action.streetCards.find(sc => sc.street_type === currentAction.street_type);

        newState.potSize += uncommittedAmount;
        newState.uncommittedPot = 0;
        newState.streetPlayerBets = {};
        newState.currentStreet = currentAction.street_type as HandStage;

        if (streetCard) {
          const streetCardsList: string[] = streetCard.cards_notation.match(/.{1,2}/g) || [];
          const existingCardsList: string[] = state.communityCards.match(/.{1,2}/g) || [];
          const newCards = streetCardsList.filter(card => !existingCardsList.includes(card));
          newState.communityCards += newCards.join('');
        }
      }

      // Process current action
      const currentPlayerBet = newState.streetPlayerBets[currentAction.player_id] || 0;
      const additionalBet = currentAction.bet_size - currentPlayerBet;

      if (currentAction.bet_size > 0) {
        newState.streetPlayerBets = {
          ...newState.streetPlayerBets,
          [currentAction.player_id]: currentAction.bet_size,
        };
      }

      if (additionalBet > 0) {
        newState.uncommittedPot += additionalBet;
      }

      if (currentAction.action_type === 'Fold') {
        const foldedPlayerBet = newState.streetPlayerBets[currentAction.player_id] || 0;
        if (foldedPlayerBet > 0) {
          newState.potSize += foldedPlayerBet;
          newState.uncommittedPot -= foldedPlayerBet;
        }
        newState.foldedPlayers = [...state.foldedPlayers, currentAction.player_id];
        newState.muckedPlayers = [...state.muckedPlayers, currentAction.player_id];
        delete newState.streetPlayerBets[currentAction.player_id];
      }

      newState.currentActionIndex += 1;

      // Check for showdown
      if (newState.currentActionIndex >= action.actions.length - 1) {
        newState.showHoleCards = true;
        newState.visibleHoleCards = action.playerHoleCards;
      }

      return newState;
    }
    case 'STEP_BACK': {
      if (state.currentActionIndex <= 0) return state;
      const targetIndex = state.currentActionIndex - 1;

      // Replay from start to targetIndex
      let newState = {
        ...initialState,
        visibleHoleCards: action.heroPlayerId ? { [action.heroPlayerId]: action.playerHoleCards[action.heroPlayerId] } : {},
      };

      for (let i = 0; i < targetIndex; i++) {
        const act = action.actions[i];

        if (act.street_type !== newState.currentStreet) {
          const uncommittedAmount = Object.values(newState.streetPlayerBets).reduce((sum, bet) => sum + bet, 0);
          const streetCard = action.streetCards.find(sc => sc.street_type === act.street_type);
          newState.potSize += uncommittedAmount;
          newState.uncommittedPot = 0;
          newState.streetPlayerBets = {};
          newState.currentStreet = act.street_type as HandStage;
          if (streetCard) {
            const streetCardsList: string[] = streetCard.cards_notation.match(/.{1,2}/g) || [];
            const existingCardsList: string[] = newState.communityCards.match(/.{1,2}/g) || [];
            const newCards = streetCardsList.filter(card => !existingCardsList.includes(card));
            newState.communityCards += newCards.join('');
          }
        }

        const cpBet = newState.streetPlayerBets[act.player_id] || 0;
        const addBet = act.bet_size - cpBet;
        if (act.bet_size > 0) newState.streetPlayerBets[act.player_id] = act.bet_size;
        if (addBet > 0) newState.uncommittedPot += addBet;

        if (act.action_type === 'Fold') {
          const foldedPlayerBet = newState.streetPlayerBets[act.player_id] || 0;
          if (foldedPlayerBet > 0) {
            newState.potSize += foldedPlayerBet;
            newState.uncommittedPot -= foldedPlayerBet;
          }
          newState.foldedPlayers.push(act.player_id);
          newState.muckedPlayers.push(act.player_id);
          delete newState.streetPlayerBets[act.player_id];
        }
      }

      newState.currentActionIndex = targetIndex;
      return newState;
    }
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(replayReducer, initialState);
  const {
    currentActionIndex,
    isPlaying,
    currentStreet,
    potSize,
    streetPlayerBets,
    uncommittedPot,
    communityCards,
    foldedPlayers,
    muckedPlayers,
    animateChipsToPot,
    animatingPlayerId,
    showHoleCards,
    showWinner,
    winningAmount,
    visibleHoleCards,
  } = state;

  const requestRef = useRef<number>();
  const lastTickRef = useRef<number>(0);
  const TICK_INTERVAL = 1500;

  // Extract hole cards and identify hero
  const { playerHoleCards, heroPlayerId } = useMemo(() => {
    const holeCards: Record<string, string> = {};
    let heroId: string | null = null;
    actions.forEach(action => {
      if (action.hole_cards && !holeCards[action.player_id]) {
        holeCards[action.player_id] = action.hole_cards;
      }
      if ((action as any).is_hero && !heroId) {
        heroId = action.player_id;
      }
    });
    return { playerHoleCards: holeCards, heroPlayerId: heroId };
  }, [actions]);

  // Memoized positions for stable PokerTableView props
  const positions: SeatPosition[] = useMemo(() => {
    return Object.entries(playerNames).map(([playerId, playerName]) => ({
      seat: seatPositions[playerId] ?? 0,
      player_id: playerId,
      player_name: playerName,
    })).sort((a, b) => a.seat - b.seat);
  }, [playerNames, seatPositions]);

  // Stable empty object for playerStacks
  const playerStacks = useMemo(() => ({}), []);

  // requestAnimationFrame playback loop
  const animate = useCallback((time: number) => {
    if (isPlaying) {
      if (time - lastTickRef.current >= TICK_INTERVAL) {
        if (currentActionIndex < actions.length) {
          const nextAction = actions[currentActionIndex];
          const isStreetChange = nextAction.street_type !== currentStreet;

          if (isStreetChange && currentActionIndex > 0) {
            // Animate sweep
            dispatch({ type: 'UPDATE_STATE', payload: { animateChipsToPot: true } });
            setTimeout(() => {
              dispatch({ type: 'STEP_FORWARD', actions, streetCards, playerHoleCards });
              dispatch({ type: 'UPDATE_STATE', payload: { animateChipsToPot: false } });
            }, 500);
          } else {
            dispatch({ type: 'STEP_FORWARD', actions, streetCards, playerHoleCards });
          }
          lastTickRef.current = time;
        } else {
          dispatch({ type: 'SET_PLAYING', isPlaying: false });
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, currentActionIndex, actions, streetCards, playerHoleCards, currentStreet]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // Initialize hero's cards
  useEffect(() => {
    if (heroPlayerId && playerHoleCards[heroPlayerId]) {
      dispatch({
        type: 'UPDATE_STATE',
        payload: { visibleHoleCards: { ...visibleHoleCards, [heroPlayerId]: playerHoleCards[heroPlayerId] } }
      });
    }
  }, [heroPlayerId]);

  // Handle Winner Effect at the end
  useEffect(() => {
    if (currentActionIndex >= actions.length && actions.length > 0 && winnerPlayerId && !showWinner) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SHOW_SHOWDOWN', playerHoleCards });

        setTimeout(() => {
          const totalWinnings = potSize + uncommittedPot;
          dispatch({ type: 'SHOW_WINNER', winningAmount: totalWinnings });
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentActionIndex, actions.length, winnerPlayerId, showWinner, potSize, uncommittedPot, playerHoleCards]);

  const handlePlayPause = () => {
    if (currentActionIndex >= actions.length) {
      dispatch({ type: 'RESET', heroPlayerId, playerHoleCards });
      dispatch({ type: 'SET_PLAYING', isPlaying: true });
    } else {
      dispatch({ type: 'TOGGLE_PLAY' });
    }
    lastTickRef.current = performance.now();
  };

  const handleStepForward = useCallback(() => {
    if (currentActionIndex < actions.length) {
      const nextAction = actions[currentActionIndex];
      const isStreetChange = nextAction.street_type !== currentStreet;

      if (isStreetChange && currentActionIndex > 0) {
        // Trigger chip sweep animation before moving to next street
        dispatch({ type: 'UPDATE_STATE', payload: { animateChipsToPot: true } });
        setTimeout(() => {
          dispatch({ type: 'STEP_FORWARD', actions, streetCards, playerHoleCards });
          dispatch({ type: 'UPDATE_STATE', payload: { animateChipsToPot: false } });
        }, 500);
      } else {
        dispatch({ type: 'STEP_FORWARD', actions, streetCards, playerHoleCards });
      }
    }
  }, [currentActionIndex, actions, currentStreet, streetCards, playerHoleCards]);

  const handleStepBack = () => {
    dispatch({ type: 'STEP_BACK', actions, streetCards, playerHoleCards, heroPlayerId });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET', heroPlayerId, playerHoleCards });
  };

  const currentAction = currentActionIndex > 0 ? actions[currentActionIndex - 1] : null;

  const additionalBetAmount = useMemo(() => {
    if (!currentAction || currentAction.bet_size === 0) return 0;
    let priorBet = 0;
    for (let i = 0; i < currentActionIndex - 1; i++) {
      const prevAction = actions[i];
      if (prevAction.street_type === currentAction.street_type && prevAction.player_id === currentAction.player_id) {
        priorBet = prevAction.bet_size;
      }
    }
    return currentAction.bet_size - priorBet;
  }, [currentAction, currentActionIndex, actions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Poker Table - Show community cards in separate section below */}
      <div className="glass-panel felt-gradient shadow-2xl p-4 rounded-2xl">
        <PokerTableView
          positions={positions}
          buttonPlayerId={buttonPlayerId}
          seatPositions={seatPositions}
          playerBets={streetPlayerBets}
          potSize={potSize + uncommittedPot}
          showPositionLabels={true}
          foldedPlayers={foldedPlayers}
          muckedPlayers={muckedPlayers}
          animateChipsToPot={animateChipsToPot}
          animatingPlayerId={animatingPlayerId}
          playerHoleCards={visibleHoleCards}
          animateChipsToWinner={showWinner ? winnerPlayerId : null}
          communityCards="" // Community cards shown in separate section below for clarity
          showAllPlayerCards={currentActionIndex === 0} // Show all cards initially (face-down)
          playerStacks={playerStacks}
          showPotChips={Object.keys(streetPlayerBets).length === 0 || animateChipsToPot} // Only show pot chips when no active bets or during sweep animation
        />
      </div>

      {/* Community Cards - Separate section with responsive sizes */}
      {communityCards && (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-border">
          <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
            {/* Extract and display cards by street */}
            {(() => {
              const allCards = communityCards.match(/.{1,2}/g) || [];
              const flopCards = allCards.slice(0, 3);
              const turnCard = allCards[3];
              const riverCard = allCards[4];

              return (
                <>
                  {/* Flop */}
                  {flopCards.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-label text-muted-foreground/60">Flop</span>
                      <div className="flex gap-1.5">
                        {flopCards.map((card, idx) => (
                          <React.Fragment key={`flop-${idx}`}>
                            <PokerCard card={card} size="sm" className="sm:hidden" />
                            <PokerCard card={card} size="md" className="hidden sm:block" />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Turn */}
                  {turnCard && (
                    <>
                      <div className="h-10 sm:h-12 w-px bg-border"></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-label text-muted-foreground/60">Turn</span>
                        <>
                          <PokerCard card={turnCard} size="sm" className="sm:hidden" />
                          <PokerCard card={turnCard} size="md" className="hidden sm:block" />
                        </>
                      </div>
                    </>
                  )}

                  {/* River */}
                  {riverCard && (
                    <>
                      <div className="h-10 sm:h-12 w-px bg-border"></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-label text-muted-foreground/60">River</span>
                        <>
                          <PokerCard card={riverCard} size="sm" className="sm:hidden" />
                          <PokerCard card={riverCard} size="md" className="hidden sm:block" />
                        </>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Current Action Display */}
      {currentAction && (
        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-border shadow-lg animate-fade-in">
          <CardContent className="p-3 sm:p-5">
            {/* Mobile: Single row layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                  <div className="uppercase tracking-widest text-sm font-bold truncate">
                    {playerNames[currentAction.player_id]}
                  </div>
                  {currentAction.position && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground border-border flex-shrink-0">
                      {currentAction.position.length > 3 ? currentAction.position.substring(0, 3) : currentAction.position}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2 py-0.5 border-border text-muted-foreground">
                    {currentAction.action_type}
                  </Badge>
                  {additionalBetAmount > 0 && (
                    <span className="font-numbers text-sm text-foreground">
                      Rs. {additionalBetAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-label text-muted-foreground/60">Current Pot</span>
                <span className="font-numbers text-sm text-foreground">
                  Rs. {(potSize + uncommittedPot).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Desktop: Original multi-row layout */}
            <div className="hidden md:block">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="uppercase tracking-widest text-lg font-bold">
                      {playerNames[currentAction.player_id]}
                    </div>
                    {currentAction.position && (
                      <Badge className="w-fit text-[10px] bg-secondary text-secondary-foreground border-border uppercase tracking-widest">
                        {currentAction.position}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-widest px-3 py-1 border-border text-muted-foreground">
                    {currentAction.action_type}
                  </Badge>
                  {additionalBetAmount > 0 && (
                    <span className="font-numbers text-xl text-foreground">
                      Rs. {additionalBetAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                <span className="text-label text-muted-foreground/60">Current Pot</span>
                <span className="font-numbers text-xl text-foreground">
                  Rs. {(potSize + uncommittedPot).toLocaleString('en-IN')}
                </span>
              </div>
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
