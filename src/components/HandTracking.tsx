import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useHandTracking } from '@/hooks/useHandTracking';
import { Game, GamePlayer, PokerHand, PlayerAction } from '@/types/poker';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, TrendingUp, Trophy, X, ChevronDown, ChevronUp } from 'lucide-react';
import CardNotationInput from './CardNotationInput';
import CardSelector from './CardSelector';
import PokerCard from './PokerCard';
import PokerTableView from './PokerTableView';
import OptimizedAvatar from './OptimizedAvatar';
import { determineWinner, formatCardNotation, parseCardNotationString } from '@/utils/pokerHandEvaluator';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { SeatPosition } from '@/types/poker';
import {
  HandStage,
  ActionType,
  getNextPlayerIndex,
  getStartingPlayerIndex,
  isBettingRoundComplete,
  shouldEndHandEarly,
  getNextStage,
  getCallAmount,
  processAction,
  resetForNewStreet
} from '@/utils/handStateMachine';
import {
  getPlayerPosition,
  getPositionAssignments,
  getSmallBlindPlayer,
  getBigBlindPlayer,
  getPositionForPlayer
} from '@/utils/pokerPositions';

interface HandTrackingProps {
  game: Game;
  positionsJustChanged?: boolean;
  onHandComplete?: () => void;
  initialSeatPositions?: SeatPosition[]; // Passed from parent to avoid re-loading
}

// Constants
const AUTO_ADVANCE_DELAY_MS = 300; // Delay for smooth state transitions when auto-advancing streets
const HAND_SAVE_DELAY_MS = 0; // No delay before saving hand to database after completion

const HandTracking = ({ game, positionsJustChanged = false, onHandComplete, initialSeatPositions = [] }: HandTrackingProps) => {
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
  const [allHandActions, setAllHandActions] = useState<PlayerAction[]>([]); // Track all actions across all streets
  const [playersInHand, setPlayersInHand] = useState<string[]>([]);
  const [playerHoleCards, setPlayerHoleCards] = useState<Record<string, string>>({});
  const [showHoleCardInput, setShowHoleCardInput] = useState(false);
  const [selectedPlayerForHole, setSelectedPlayerForHole] = useState<string>('');
  const [playerBets, setPlayerBets] = useState<Record<string, number>>({});
  const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});
  const [seatPositions, setSeatPositions] = useState<Record<string, number>>({});
  const [lastAggressorIndex, setLastAggressorIndex] = useState<number | null>(null);
  const [positionsChanged, setPositionsChanged] = useState(false);
  const [showPlayerActionDialog, setShowPlayerActionDialog] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [playerStacks, setPlayerStacks] = useState<Record<string, number>>({});
  const [isActionHistoryOpen, setIsActionHistoryOpen] = useState(true); // State for collapsible action history
  const [showCardSelector, setShowCardSelector] = useState(false); // State for card selector dialog
  const [cardSelectorType, setCardSelectorType] = useState<'flop' | 'turn' | 'river'>('flop'); // Which street cards to select
  const [cardsJustAdded, setCardsJustAdded] = useState(false); // Track if community cards were just added
  const [tempCommunityCards, setTempCommunityCards] = useState<string>(''); // Temporary state for community card selection before confirm
  const [showMobileHandTracking, setShowMobileHandTracking] = useState(false); // Control mobile drawer visibility
  const [actionHistory, setActionHistory] = useState<Array<{
    stage: HandStage;
    currentPlayerIndex: number;
    actionSequence: number;
    currentBet: number;
    potSize: number;
    streetPlayerBets: Record<string, number>;
    totalPlayerBets: Record<string, number>;
    playersInHand: string[];
    streetActions: PlayerAction[];
    allHandActions: PlayerAction[];
    lastAggressorIndex: number | null;
    flopCards: string;
    turnCard: string;
    riverCard: string;
  }>>([]);
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // LocalStorage key for hand state persistence
  const getHandStateKey = () => `poker_hand_state_${game.id}`;

  // Save hand state to localStorage
  const saveHandState = () => {
    if (!currentHand) return;
    
    const handState = {
      currentHand,
      stage,
      buttonPlayerId,
      dealtOutPlayers,
      activePlayers,
      currentPlayerIndex,
      actionSequence,
      currentBet,
      flopCards,
      turnCard,
      riverCard,
      potSize,
      streetActions,
      allHandActions,
      playersInHand,
      playerHoleCards,
      playerBets,
      streetPlayerBets,
      lastAggressorIndex,
      actionHistory,
      timestamp: Date.now(),
    };
    
    try {
      localStorage.setItem(getHandStateKey(), JSON.stringify(handState));
    } catch (error) {
      console.error('Failed to save hand state:', error);
    }
  };

  // Load hand state from localStorage
  const loadHandState = () => {
    try {
      const savedState = localStorage.getItem(getHandStateKey());
      if (!savedState) return null;
      
      const handState = JSON.parse(savedState);
      // Check if state is not too old (e.g., 24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms
      if (Date.now() - handState.timestamp > MAX_AGE) {
        localStorage.removeItem(getHandStateKey());
        return null;
      }
      
      return handState;
    } catch (error) {
      console.error('Failed to load hand state:', error);
      return null;
    }
  };

  // Clear hand state from localStorage
  const clearHandState = () => {
    try {
      localStorage.removeItem(getHandStateKey());
    } catch (error) {
      console.error('Failed to clear hand state:', error);
    }
  };

  // Restore hand state on component mount
  useEffect(() => {
    const savedState = loadHandState();
    if (savedState && savedState.stage !== 'setup') {
      // Restore all state in a single batch to minimize re-renders
      setCurrentHand(savedState.currentHand);
      setStage(savedState.stage);
      setButtonPlayerId(savedState.buttonPlayerId);
      setDealtOutPlayers(savedState.dealtOutPlayers);
      setActivePlayers(savedState.activePlayers);
      setCurrentPlayerIndex(savedState.currentPlayerIndex);
      setActionSequence(savedState.actionSequence);
      setCurrentBet(savedState.currentBet);
      setFlopCards(savedState.flopCards);
      setTurnCard(savedState.turnCard);
      setRiverCard(savedState.riverCard);
      setPotSize(savedState.potSize);
      setStreetActions(savedState.streetActions);
      setAllHandActions(savedState.allHandActions);
      setPlayersInHand(savedState.playersInHand);
      setPlayerHoleCards(savedState.playerHoleCards);
      setPlayerBets(savedState.playerBets);
      setStreetPlayerBets(savedState.streetPlayerBets);
      setLastAggressorIndex(savedState.lastAggressorIndex);
      setActionHistory(savedState.actionHistory);
      
      // Show mobile drawer if we're restoring an active hand
      setShowMobileHandTracking(true);
      
      // Update saved hand state flag
      setHasSavedHandState(true);
      
      toast({
        title: 'Hand Restored',
        description: `Continuing Hand #${savedState.currentHand.hand_number}`,
      });
    } else {
      setHasSavedHandState(false);
    }
    // Only run on mount, not on game.id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save state - only save if there are actual changes and after a delay
  useEffect(() => {
    if (!currentHand || stage === 'setup') return;
    
    // Debounce localStorage writes to reduce I/O
    const timeoutId = setTimeout(() => {
      saveHandState();
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
    // saveHandState is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentHand,
    stage,
    currentPlayerIndex,
    actionSequence,
    currentBet,
    flopCards,
    turnCard,
    riverCard,
    potSize,
    streetActions,
    allHandActions,
    playersInHand,
    playerHoleCards,
    playerBets,
    streetPlayerBets,
    lastAggressorIndex,
  ]);

  // Find hero player - ALWAYS tag "Adwate" as the hero
  const heroPlayer = game.game_players.find(gp => 
    gp.player.name.toLowerCase() === 'adwate' || 
    gp.player.name === user?.email?.split('@')[0]
  );

  // Load table positions on mount and when positions change
  useEffect(() => {
    const loadTablePositions = async () => {
      try {
        // First, try to use initialSeatPositions passed from parent (avoids DB call)
        if (initialSeatPositions.length > 0) {
          const positions: Record<string, number> = {};
          initialSeatPositions.forEach((pos) => {
            positions[pos.player_id] = pos.seat;
          });
          setSeatPositions(positions);
          return; // Exit early, no need to load from DB
        }
        
        // Fallback: Load from database if not provided
        const { data, error } = await supabase
          .from('table_positions')
          .select('*')
          .eq('game_id', game.id)
          .order('snapshot_timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data && data.positions) {
          const positions: Record<string, number> = {};
          const posArray = data.positions as unknown as SeatPosition[];
          posArray.forEach((pos: SeatPosition) => {
            positions[pos.player_id] = pos.seat;
          });
          setSeatPositions(positions);
        }
      } catch (error) {
        console.error('Error loading table positions:', error);
      }
    };
    
    loadTablePositions();
  }, [game.id, positionsJustChanged, initialSeatPositions]);

  // Track if positions just changed
  useEffect(() => {
    setPositionsChanged(positionsJustChanged);
  }, [positionsJustChanged]);

  // Auto-open card selector when community cards need to be selected
  useEffect(() => {
    if (stage === 'flop' && !flopCards && currentHand) {
      setCardSelectorType('flop');
      setTempCommunityCards(''); // Initialize temp with empty
      setShowCardSelector(true);
    } else if (stage === 'turn' && !turnCard && flopCards && currentHand) {
      setCardSelectorType('turn');
      setTempCommunityCards(''); // Initialize temp with empty
      setShowCardSelector(true);
    } else if (stage === 'river' && !riverCard && turnCard && currentHand) {
      setCardSelectorType('river');
      setTempCommunityCards(''); // Initialize temp with empty
      setShowCardSelector(true);
    }
  }, [stage, flopCards, turnCard, riverCard, currentHand]);

  // Auto-advance to next remaining player if current player has folded
  useEffect(() => {
    if (stage !== 'setup' && stage !== 'showdown' && activePlayers.length > 0 && currentHand) {
      const currentPlayer = activePlayers[currentPlayerIndex];
      
      // If current player has folded, automatically advance to next remaining player
      if (currentPlayer && !playersInHand.includes(currentPlayer.player_id)) {
        const buttonIndex = activePlayers.findIndex(gp => gp.player_id === currentHand.button_player_id);
        const nextIndex = getNextPlayerIndex(
          currentPlayerIndex,
          stage,
          activePlayers,
          buttonIndex,
          playersInHand
        );
        
        // Only update if we found a different player
        if (nextIndex !== currentPlayerIndex) {
          setCurrentPlayerIndex(nextIndex);
        }
      }
    }
  }, [currentPlayerIndex, activePlayers, playersInHand, stage, currentHand]);

  // Format amount with BB multiple
  const formatWithBB = (amount: number): string => {
    const bb = game.big_blind || 100;
    const bbMultiple = (amount / bb).toFixed(1);
    return `Rs. ${amount.toLocaleString('en-IN')} (${bbMultiple} BB)`;
  };

  // Save current state to action history
  const saveStateToHistory = () => {
    const currentState = {
      stage,
      currentPlayerIndex,
      actionSequence,
      currentBet,
      potSize,
      streetPlayerBets: { ...streetPlayerBets },
      totalPlayerBets: { ...playerBets },
      playersInHand: [...playersInHand],
      streetActions: [...streetActions],
      allHandActions: [...allHandActions],
      lastAggressorIndex,
      flopCards,
      turnCard,
      riverCard,
    };
    setActionHistory(prev => [...prev, currentState]);
  };

  // Undo last action
  const undoLastAction = () => {
    if (actionHistory.length === 0) {
      toast({
        title: 'No action to undo',
        description: 'This is the beginning of the hand',
        variant: 'default'
      });
      return;
    }

    const previousState = actionHistory[actionHistory.length - 1];
    
    // Restore state
    setStage(previousState.stage);
    setCurrentPlayerIndex(previousState.currentPlayerIndex);
    setActionSequence(previousState.actionSequence);
    setCurrentBet(previousState.currentBet);
    setPotSize(previousState.potSize);
    setStreetPlayerBets(previousState.streetPlayerBets);
    setPlayerBets(previousState.totalPlayerBets);
    setPlayersInHand(previousState.playersInHand);
    setStreetActions(previousState.streetActions);
    setAllHandActions(previousState.allHandActions);
    setLastAggressorIndex(previousState.lastAggressorIndex);
    setFlopCards(previousState.flopCards);
    setTurnCard(previousState.turnCard);
    setRiverCard(previousState.riverCard);
    
    // Remove the last history entry
    setActionHistory(prev => prev.slice(0, -1));
    
    // Don't show toast message - as per requirement
  };

  // Swipe gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Right swipe = go back (undo action or edit cards)
    if (isRightSwipe) {
      if (cardsJustAdded) {
        handleEditCards();
      } else if (actionHistory.length > 0) {
        undoLastAction();
      }
    }
    // Left swipe could also trigger back in the future if needed
    // Currently just using right swipe for back
  };

  const startNewHand = async () => {
    if (!buttonPlayerId) return;

    // CRITICAL: Validate that seat positions are loaded
    if (Object.keys(seatPositions).length === 0) {
      toast({
        title: 'Error',
        description: 'Table positions not loaded. Please refresh the page.',
        variant: 'destructive'
      });
      return;
    }

    // CRITICAL: Validate that button player has a seat position
    if (seatPositions[buttonPlayerId] === undefined) {
      toast({
        title: 'Error',
        description: 'Button player does not have a seat position assigned. Please update table positions first.',
        variant: 'destructive'
      });
      return;
    }

    const nextHandNumber = await getNextHandNumber(game.id);
    
    // CRITICAL: Filter out dealt-out players and sort by seat position for consistent ordering
    const active = game.game_players
      .filter(gp => !dealtOutPlayers.includes(gp.player_id))
      .sort((a, b) => {
        const seatA = seatPositions[a.player_id] ?? 999;
        const seatB = seatPositions[b.player_id] ?? 999;
        return seatA - seatB;
      });
    
    // CRITICAL: Validate that we have enough players
    if (active.length < 2) {
      toast({
        title: 'Error',
        description: 'At least 2 players are required to start a hand.',
        variant: 'destructive'
      });
      return;
    }

    // CRITICAL: Validate that button player is in active players
    if (!active.find(gp => gp.player_id === buttonPlayerId)) {
      toast({
        title: 'Error',
        description: 'Button player is marked as dealt out. Please unmark them or select a different button player.',
        variant: 'destructive'
      });
      return;
    }
    
    // Calculate hero position using new utility with seat positions
    const heroPosition = heroPlayer?.player_id 
      ? getPositionForPlayer(active, buttonPlayerId, heroPlayer.player_id, seatPositions)
      : 'UTG';

    // Create hand object in memory without saving to DB yet
    const handObject: PokerHand = {
      id: `temp-hand-${Date.now()}`, // Temporary ID
      game_id: game.id,
      hand_number: nextHandNumber,
      button_player_id: buttonPlayerId,
      hero_position: heroPosition,
      final_stage: 'Preflop',
      pot_size: 0,
      winner_player_id: null,
      winner_player_ids: null,
      is_hero_win: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentHand(handObject);
    // IMPORTANT: Set activePlayers to maintain seat order throughout hand
    setActivePlayers(active);
    setPlayersInHand(active.map(p => p.player_id));
    
    // Get SB and BB players using utility functions with seat positions
    const sbPlayer = getSmallBlindPlayer(active, buttonPlayerId, seatPositions);
    const bbPlayer = getBigBlindPlayer(active, buttonPlayerId, seatPositions);
    
    const sbAmount = game.small_blind || 50;
    const bbAmount = game.big_blind || 100;
    
    // Initialize player bets
    const initialBets: Record<string, number> = {};
    active.forEach(p => initialBets[p.player_id] = 0);
    initialBets[sbPlayer.player_id] = sbAmount;
    initialBets[bbPlayer.player_id] = bbAmount;
    setPlayerBets(initialBets);
    setStreetPlayerBets(initialBets);
    
    // Create blind actions in memory (will be saved when hand is saved)
    const sbPosition = getPositionForPlayer(active, buttonPlayerId, sbPlayer.player_id, seatPositions);
    const sbAction: PlayerAction = {
      id: `temp-sb-${Date.now()}`,
      hand_id: handObject.id,
      player_id: sbPlayer.player_id,
      street_type: 'Preflop',
      action_type: 'Small Blind',
      bet_size: sbAmount,
      action_sequence: 0,
      is_hero: sbPlayer.player_id === heroPlayer?.player_id,
      position: sbPosition,
      hole_cards: null,
      created_at: new Date().toISOString()
    };
    
    const bbPosition = getPositionForPlayer(active, buttonPlayerId, bbPlayer.player_id, seatPositions);
    const bbAction: PlayerAction = {
      id: `temp-bb-${Date.now()}`,
      hand_id: handObject.id,
      player_id: bbPlayer.player_id,
      street_type: 'Preflop',
      action_type: 'Big Blind',
      bet_size: bbAmount,
      action_sequence: 1,
      is_hero: bbPlayer.player_id === heroPlayer?.player_id,
      position: bbPosition,
      hole_cards: null,
      created_at: new Date().toISOString()
    };
    
    setStreetActions([sbAction, bbAction]);
    setAllHandActions([sbAction, bbAction]); // Initialize all actions with blinds
    
    // Use state machine to get starting player (UTG for preflop)
    const startingIndex = getStartingPlayerIndex('preflop', active, buttonPlayerId);
    setCurrentPlayerIndex(startingIndex);
    setStage('preflop');
    setCurrentBet(bbAmount);
    setPotSize(sbAmount + bbAmount);
    setActionSequence(2);
    // BB is initial aggressor preflop
    const bbIndex = active.findIndex(p => p.player_id === bbPlayer.player_id);
    setLastAggressorIndex(bbIndex);
    
    // Show mobile drawer on mobile devices
    setShowMobileHandTracking(true);
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

  // Get all currently used cards in the hand
  // excludeCards: cards to exclude from the used list (e.g., when editing)
  const getUsedCards = (excludeCards: string[] = []): string[] => {
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
    
    // Filter out excluded cards
    return allUsedCards.filter(card => !excludeCards.includes(card));
  };

  const recordAction = async (actionType: ActionType) => {
    if (!currentHand || activePlayers.length === 0) return;

    const currentPlayer = activePlayers[currentPlayerIndex];
    if (!currentPlayer) {
      // Guard against out-of-bounds index after folds
      const safeIndex = Math.max(0, Math.min(currentPlayerIndex, activePlayers.length - 1));
      setCurrentPlayerIndex(safeIndex);
      return;
    }

    // Save state before action for undo functionality
    saveStateToHistory();

    const isHero = currentPlayer.player_id === heroPlayer?.player_id;
    const playerStreetBet = streetPlayerBets[currentPlayer.player_id] || 0;
    
    // Calculate button index from seat-ordered activePlayers
    const buttonPlayerId = currentHand.button_player_id;
    const buttonIndex = activePlayers.findIndex(gp => gp.player_id === buttonPlayerId);
    const playerPosition = getPositionForPlayer(activePlayers, buttonPlayerId, currentPlayer.player_id, seatPositions);
    
    let betSize = 0;
    
    if (actionType === 'Small Blind') {
      betSize = (game.small_blind || 50);
    } else if (actionType === 'Big Blind') {
      betSize = (game.big_blind || 100);
    } else if (actionType === 'Call') {
      betSize = currentBet;
    } else if (actionType === 'Raise') {
      const requestedBet = parseFloat(betAmount) || currentBet;
      const smallBlind = game.small_blind || 50;
      const bigBlind = game.big_blind || 100;
      
      // Validate bet/raise amounts
      if (currentBet === 0) {
        // This is a bet (not a raise)
        // Minimum bet must be at least big blind
        if (requestedBet < bigBlind) {
          toast({
            title: 'Invalid Bet',
            description: `Minimum bet is Rs. ${bigBlind.toLocaleString('en-IN')} (big blind)`,
            variant: 'destructive'
          });
          return;
        }
        // Ensure bet is multiple of small blind and at least small blind
        if (requestedBet % smallBlind !== 0) {
          toast({
            title: 'Invalid Bet',
            description: `Bet must be a multiple of Rs. ${smallBlind.toLocaleString('en-IN')} (small blind)`,
            variant: 'destructive'
          });
          return;
        }
      } else {
        // This is a raise
        const minRaise = currentBet * 2 - playerStreetBet;
        if (requestedBet < minRaise) {
          toast({
            title: 'Invalid Raise',
            description: `Minimum raise is Rs. ${minRaise.toLocaleString('en-IN')}`,
            variant: 'destructive'
          });
          return;
        }
        // Ensure raise is multiple of small blind and at least small blind
        if (requestedBet % smallBlind !== 0 || requestedBet < smallBlind) {
          toast({
            title: 'Invalid Raise',
            description: `Raise must be a multiple of Rs. ${smallBlind.toLocaleString('en-IN')} (small blind) and at least Rs. ${smallBlind.toLocaleString('en-IN')}`,
            variant: 'destructive'
          });
          return;
        }
      }
      betSize = requestedBet;
    }

    try {
      // Create action in memory (will be saved when hand is saved)
      const action: PlayerAction = {
        id: `temp-action-${Date.now()}-${Math.random()}`,
        hand_id: currentHand.id,
        player_id: currentPlayer.player_id,
        street_type: stage === 'preflop' ? 'Preflop' : stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River',
        action_type: actionType,
        bet_size: betSize,
        action_sequence: actionSequence,
        is_hero: isHero,
        position: playerPosition,
        hole_cards: null,
        created_at: new Date().toISOString()
      };

      setStreetActions(prev => [...prev, action]);
      setAllHandActions(prev => [...prev, action]); // Add to all actions
      
      // Reset cards just added flag after first action
      setCardsJustAdded(false);

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
          actionSequence,
          lastAggressorIndex
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
      if (stateUpdates.lastAggressorIndex !== undefined) setLastAggressorIndex(stateUpdates.lastAggressorIndex);
      
      // Handle fold - update playersInHand and check for winner; keep activePlayers unchanged
      if (actionType === 'Fold') {
        if (stateUpdates.playersInHand) setPlayersInHand(stateUpdates.playersInHand);
        const updatedPlayersInHand = stateUpdates.playersInHand || playersInHand;

        // Check if only one player remains - hand ends immediately
        const endCheck = shouldEndHandEarly(activePlayers, updatedPlayersInHand);
        if (endCheck.shouldEnd && endCheck.winnerId) {
          await finishHand([endCheck.winnerId], stage, action); // Pass current stage and last action
          return; // Don't move to next player after finishing hand
        }

        // Move to next player with unchanged activePlayers and updated playersInHand
        const nextIndex = getNextPlayerIndex(
          currentPlayerIndex,
          stage,
          activePlayers,
          buttonIndex,
          updatedPlayersInHand
        );
        setCurrentPlayerIndex(nextIndex);
      } else {
        // Non-fold actions: move to next player normally
        const nextIndex = getNextPlayerIndex(
          currentPlayerIndex,
          stage,
          activePlayers,
          buttonIndex,
          playersInHand
        );
        setCurrentPlayerIndex(nextIndex);
        
        // Check if betting round is now complete after this action
        // If complete, automatically advance to next street
        // Note: streetActions state hasn't updated yet, so we check with the new action included
        const isBettingComplete = isBettingRoundComplete(
          stage,
          activePlayers,
          playersInHand,
          stateUpdates.streetPlayerBets || streetPlayerBets,
          [...streetActions, action],
          currentHand.button_player_id,
          stateUpdates.lastAggressorIndex !== undefined ? stateUpdates.lastAggressorIndex : lastAggressorIndex
        );
        
        // Auto-advance to next street if betting is complete
        if (isBettingComplete && stage !== 'river') {
          // Use setTimeout to allow state to settle before advancing
          setTimeout(() => {
            moveToNextStreet();
          }, AUTO_ADVANCE_DELAY_MS);
        } else if (isBettingComplete && stage === 'river') {
          // Auto-advance to showdown
          setTimeout(() => {
            moveToNextStreet();
          }, AUTO_ADVANCE_DELAY_MS);
        }
      }
    } catch (err) {
      console.error('recordAction error', err);
      toast({ title: 'Error', description: 'Something went wrong processing the action', variant: 'destructive' });
    } finally {
      setBetAmount('');
    }
  };

  const moveToNextStreet = async () => {
    if (!currentHand) return;

    // Save state before moving to next street
    saveStateToHistory();

    const nextStage = getNextStage(stage);
    
    // Reset cards just added flag when moving to next street
    setCardsJustAdded(false);
    
    // Use state machine to reset for new street (using active players only)
    const buttonIndex = activePlayers.findIndex(gp => gp.player_id === currentHand.button_player_id);
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
        actionSequence,
        lastAggressorIndex
      },
      currentHand.button_player_id
    );
    
    // Apply updates
    if (stateUpdates.stage) setStage(stateUpdates.stage);
    if (stateUpdates.currentPlayerIndex !== undefined) setCurrentPlayerIndex(stateUpdates.currentPlayerIndex);
    if (stateUpdates.currentBet !== undefined) setCurrentBet(stateUpdates.currentBet);
    if (stateUpdates.streetPlayerBets) setStreetPlayerBets(stateUpdates.streetPlayerBets);
    if (stateUpdates.streetActions) setStreetActions(stateUpdates.streetActions);
    if (stateUpdates.lastAggressorIndex !== undefined) setLastAggressorIndex(stateUpdates.lastAggressorIndex);
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

    // Store cards in memory (will be saved when hand is saved)
    if (stage === 'flop') {
      setFlopCards(cards);
      setShowCardSelector(false); // Close the selector after selecting
      setCardsJustAdded(true); // Mark cards as just added
    } else if (stage === 'turn') {
      setTurnCard(cards);
      setShowCardSelector(false); // Close the selector after selecting
      setCardsJustAdded(true); // Mark cards as just added
    } else if (stage === 'river') {
      setRiverCard(cards);
      setShowCardSelector(false); // Close the selector after selecting
      setCardsJustAdded(true); // Mark cards as just added
    }
  };

  const handleCardSelectorSubmit = (cards: string) => {
    saveStreetCards(cards);
  };

  const handleEditCards = () => {
    // Reopen the card selector to edit
    if (stage === 'flop' && flopCards) {
      setCardSelectorType('flop');
      setTempCommunityCards(flopCards); // Initialize temp with current cards
      setShowCardSelector(true);
    } else if (stage === 'turn' && turnCard) {
      setCardSelectorType('turn');
      setTempCommunityCards(turnCard); // Initialize temp with current card
      setShowCardSelector(true);
    } else if (stage === 'river' && riverCard) {
      setCardSelectorType('river');
      setTempCommunityCards(riverCard); // Initialize temp with current card
      setShowCardSelector(true);
    }
  };

  const finishHand = async (winnerIds: string[], finalStageOverride?: HandStage, lastAction?: PlayerAction) => {
    if (!currentHand) return;

    // Close mobile drawer immediately
    setShowMobileHandTracking(false);
    
    // Clear saved hand state
    clearHandState();

    const isHeroWin = winnerIds.includes(heroPlayer?.player_id || '');
    
    // Determine final stage based on when winner was decided:
    // - If winner decided at Preflop/Flop/Turn/River (fold), use that street
    // - If winner decided at Showdown, use 'Showdown'
    let finalStageValue: string;
    if (finalStageOverride === 'showdown') {
      finalStageValue = 'Showdown';
    } else if (finalStageOverride) {
      // Winner decided at a specific street (fold scenario)
      finalStageValue = finalStageOverride.charAt(0).toUpperCase() + finalStageOverride.slice(1);
    } else {
      // Fallback (shouldn't happen, but handle it)
      finalStageValue = stage === 'showdown' ? 'Showdown' : stage.charAt(0).toUpperCase() + stage.slice(1);
    }
    
    // Build complete list of actions including the last one if provided
    const actionsToSave = lastAction ? [...allHandActions, lastAction] : allHandActions;
    
    // Add delay before recording hand to database to allow UI to settle
    await new Promise(resolve => setTimeout(resolve, HAND_SAVE_DELAY_MS));
    
    // NOW save the hand to the database with all data
    const heroPosition = heroPlayer?.player_id 
      ? getPositionForPlayer(activePlayers, currentHand.button_player_id, heroPlayer.player_id, seatPositions)
      : 'UTG';

    // Prepare positions data
    const positionsData = activePlayers.map(gp => ({
      seat: seatPositions[gp.player_id] ?? 0,
      player_id: gp.player_id,
      player_name: gp.player.name,
    }));

    const savedHand = await createNewHand(
      game.id, 
      currentHand.button_player_id, 
      currentHand.hand_number, 
      heroPosition,
      positionsData
    );
    
    if (!savedHand) {
      toast({
        title: 'Error',
        description: 'Failed to save hand',
        variant: 'destructive'
      });
      return;
    }

    // Save all actions to database including the last action
    for (const action of actionsToSave) {
      await recordPlayerAction(
        savedHand.id,
        action.player_id,
        action.street_type,
        action.action_type,
        action.bet_size,
        action.action_sequence,
        action.is_hero,
        action.position
      );
    }

    // Save street cards
    if (flopCards) {
      await recordStreetCards(savedHand.id, 'Flop', flopCards);
    }
    if (turnCard) {
      await recordStreetCards(savedHand.id, 'Turn', turnCard);
    }
    if (riverCard) {
      await recordStreetCards(savedHand.id, 'River', riverCard);
    }

    // Save hole cards if entered
    if (Object.keys(playerHoleCards).length > 0) {
      for (const [playerId, holeCards] of Object.entries(playerHoleCards)) {
        // Find the last action for this player in the complete actions list
        const playerActions = actionsToSave.filter(a => a.player_id === playerId);
        if (playerActions.length > 0) {
          const lastPlayerAction = playerActions[playerActions.length - 1];
          
          // Update the action in database with hole cards
          await supabase
            .from('player_actions')
            .update({ hole_cards: holeCards })
            .eq('hand_id', savedHand.id)
            .eq('player_id', playerId)
            .eq('action_sequence', lastPlayerAction.action_sequence);
        }
      }
    }

    // Complete the hand with winner info and final stage
    await completeHand(savedHand.id, winnerIds, potSize, isHeroWin, finalStageValue);
    
    // Clear saved hand state from localStorage
    clearHandState();
    
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
    setAllHandActions([]); // Reset all actions
    setPlayersInHand([]);
    setPlayerHoleCards({});
    setPlayerBets({});
    setStreetPlayerBets({});
    setLastAggressorIndex(null);

    // Call the onHandComplete callback if provided
    if (onHandComplete) {
      onHandComplete();
    }
  };

  const handleHoleCardSubmit = (cards: string) => {
    if (selectedPlayerForHole) {
      // Parse cards once for all validations
      const newCardsList = parseCardNotationString(cards);
      
      // Validate card uniqueness (excluding current player's existing cards when editing)
      const allUsedCards: string[] = [];
      
      // Collect all hole cards EXCEPT the current player's existing cards
      Object.entries(playerHoleCards).forEach(([playerId, holeCards]) => {
        if (playerId !== selectedPlayerForHole && holeCards) {
          const playerCards = parseCardNotationString(holeCards);
          allUsedCards.push(...playerCards);
        }
      });
      
      // Collect community cards
      if (flopCards) {
        const communityCardsList = parseCardNotationString(flopCards);
        allUsedCards.push(...communityCardsList);
      }
      if (turnCard) allUsedCards.push(turnCard);
      if (riverCard) allUsedCards.push(riverCard);
      
      // Check new cards against used cards (community + other players' hole cards)
      for (const card of newCardsList) {
        if (allUsedCards.includes(card)) {
          toast({
            title: 'Duplicate Card',
            description: `Card ${card} has already been used in this hand`,
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Additional validation: Build a map of cards to player IDs for duplicate player check
      // (This is technically redundant with above check but provides better error message)
      const cardToPlayerMap = new Map<string, string>();
      for (const [playerId, holeCards] of Object.entries(playerHoleCards)) {
        if (playerId !== selectedPlayerForHole && holeCards) {
          const existingCards = parseCardNotationString(holeCards);
          existingCards.forEach(card => cardToPlayerMap.set(card, playerId));
        }
      }
      
      // Check for duplicates with specific player attribution
      const duplicates: string[] = [];
      const duplicatePlayerIds = new Set<string>();
      for (const card of newCardsList) {
        const existingPlayerId = cardToPlayerMap.get(card);
        if (existingPlayerId) {
          duplicates.push(card);
          duplicatePlayerIds.add(existingPlayerId);
        }
      }
      
      if (duplicates.length > 0) {
        const playerNames = Array.from(duplicatePlayerIds)
          .map(playerId => activePlayers.find(p => p.player_id === playerId)?.player.name)
          .filter(Boolean)
          .join(', ');
        toast({
          title: 'Duplicate Cards',
          description: `Card(s) ${duplicates.join(', ')} already assigned to ${playerNames}`,
          variant: 'destructive',
        });
        return;
      }
      
      // Update hole cards - this will trigger auto-calculation on re-render if in showdown
      setPlayerHoleCards(prev => ({
        ...prev,
        [selectedPlayerForHole]: cards
      }));
      setShowHoleCardInput(false);
      setSelectedPlayerForHole('');
    }
  };

  const autoSelectWinner = () => {
    // Filter to only remaining players (those who haven't folded)
    const remainingPlayers = activePlayers.filter(p => playersInHand.includes(p.player_id));
    
    // Check if all remaining players have hole cards entered
    const allRemainingPlayersHaveCards = remainingPlayers.every(p => playerHoleCards[p.player_id]);
    
    if (!allRemainingPlayersHaveCards) {
      return null;
    }

    // Get all community cards
    const allCommunityCards = (flopCards || '') + (turnCard || '') + (riverCard || '');
    
    if (allCommunityCards.length < 10) { // Need at least 5 cards (10 chars)
      return null;
    }

    // Only include remaining players (not folded)
    const playersWithHoles = remainingPlayers.map(p => ({
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
    } catch (error) {
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
    
    // Check if cards are dealt for the NEXT street (before showing Next button)
    // Don't show Next button on preflop until flop cards are ready
    if (stage === 'preflop' && !flopCards) return false;
    // Don't show Next button on flop until turn card is ready
    if (stage === 'flop' && !turnCard) return false;
    // Don't show Next button on turn until river card is ready
    if (stage === 'turn' && !riverCard) return false;
    
    // Use state machine to check if betting round is complete
    return isBettingRoundComplete(
      stage,
      activePlayers,
      playersInHand,
      streetPlayerBets,
      streetActions,
      currentHand.button_player_id,
      lastAggressorIndex
    );
  };

  const handlePlayerClick = (playerId: string) => {
    if (stage === 'setup') {
      setSelectedPlayerId(playerId);
      // Only show dialog on mobile (< 640px to match other mobile detection)
      if (window.innerWidth < 640) {
        setShowPlayerActionDialog(true);
      }
    }
  };

  const handleToggleDealtOut = () => {
    if (dealtOutPlayers.includes(selectedPlayerId)) {
      setDealtOutPlayers(dealtOutPlayers.filter(id => id !== selectedPlayerId));
    } else {
      setDealtOutPlayers([...dealtOutPlayers, selectedPlayerId]);
    }
    setShowPlayerActionDialog(false);
    setSelectedPlayerId('');
  };

  const handleCancelDialog = () => {
    setShowPlayerActionDialog(false);
    setSelectedPlayerId('');
  };

  // Memoize grouped actions by street in DESCENDING order (newest first) - MUST be before conditional returns to avoid React hook error #310
  const actionsByStreet = useMemo(() => {
    return ['River', 'Turn', 'Flop', 'Preflop'].map(street => ({
      street,
      actions: allHandActions.filter(a => a.street_type === street)
    })).filter(group => group.actions.length > 0);
  }, [allHandActions]);

  const currentPlayer = activePlayers[currentPlayerIndex];

  // Helper function to get badge variant for action type
  const getActionBadgeVariant = (actionType: string): "destructive" | "default" | "secondary" => {
    if (actionType === 'Fold') return 'destructive';
    if (actionType.includes('Raise') || actionType.includes('Bet')) return 'default';
    return 'secondary';
  };

  // Check if there's a saved hand state (memoized to avoid repeated localStorage reads)
  const [hasSavedHandState, setHasSavedHandState] = useState(false);
  
  // Update saved hand state check when component mounts
  useEffect(() => {
    const savedState = loadHandState();
    setHasSavedHandState(savedState && savedState.stage !== 'setup');
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Continue saved hand
  const continueHand = () => {
    // State is already restored in the mount useEffect, just open the drawer
    setShowMobileHandTracking(true);
  };

  if (stage === 'setup') {
    const selectedPlayer = selectedPlayerId ? game.game_players.find(gp => gp.player_id === selectedPlayerId) : null;
    
    return (
      <>
        <Card className="mt-6 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Play className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              Start New Hand
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Interactive Poker Table */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-4 rounded-xl border border-green-700/30">
              <PokerTableView
                positions={game.game_players
                  .sort((a, b) => {
                    const seatA = seatPositions[a.player_id] ?? 999;
                    const seatB = seatPositions[b.player_id] ?? 999;
                    return seatA - seatB;
                  })
                  .map(gp => ({
                    seat: seatPositions[gp.player_id] ?? 0,
                    player_id: gp.player_id,
                    player_name: gp.player.name,
                  }))}
              buttonPlayerId={buttonPlayerId}
              seatPositions={seatPositions}
              foldedPlayers={dealtOutPlayers}
              onPlayerClick={handlePlayerClick}
              communityCards=""
              playerStacks={playerStacks}
            />
            </div>

            {/* Desktop: Inline player action (show when player is selected) */}
            {selectedPlayer && (
              <div className="hidden md:block p-4 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {selectedPlayer.player.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedPlayer.player.name}</p>
                      <p className="text-xs text-muted-foreground">Click to toggle dealt in/out</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleToggleDealtOut} 
                      variant={dealtOutPlayers.includes(selectedPlayerId) ? "default" : "outline"}
                      size="sm"
                    >
                      {dealtOutPlayers.includes(selectedPlayerId) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Not Dealt In
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Mark as Not Playing
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleCancelDialog} 
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Display */}
            <div className="space-y-3">
              {buttonPlayerId && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">Button Player:</span>
                  </div>
                  <span className="text-sm font-bold">{game.game_players.find(gp => gp.player_id === buttonPlayerId)?.player.name}</span>
                </div>
              )}
              {dealtOutPlayers.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Dealt Out:</span>
                    <div className="flex flex-wrap gap-1">
                      {dealtOutPlayers.map(pid => (
                        <Badge key={pid} variant="outline" className="text-xs">
                          {game.game_players.find(gp => gp.player_id === pid)?.player.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!buttonPlayerId && (
                <div className="space-y-3">
                  <Label htmlFor="dealer-select" className="text-base font-semibold">
                    Select Dealer (Button Player)
                  </Label>
                  <Select value={buttonPlayerId} onValueChange={setButtonPlayerId}>
                    <SelectTrigger id="dealer-select" className="w-full h-12 text-base">
                      <SelectValue placeholder="Choose the dealer for this hand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {game.game_players
                        .filter(gp => !dealtOutPlayers.includes(gp.player_id))
                        .sort((a, b) => {
                          const seatA = seatPositions[a.player_id] ?? 999;
                          const seatB = seatPositions[b.player_id] ?? 999;
                          return seatA - seatB;
                        })
                        .map(gp => (
                          <SelectItem key={gp.player_id} value={gp.player_id} className="text-base py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {gp.player.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold">{gp.player.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Seat {seatPositions[gp.player_id] ?? '?'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Continue Hand button if saved state exists */}
            {hasSavedHandState && currentHand && (
              <Button 
                onClick={continueHand} 
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                🔄 Continue Hand #{currentHand.hand_number}
              </Button>
            )}

            <div className="flex gap-2">
              {/* Cancel/Back button - always shown to allow stopping hand tracking */}
              <Button 
                onClick={() => {
                  // Clear any saved state
                  clearHandState();
                  // Reset to initial state
                  setStage('setup');
                  setCurrentHand(null);
                  setButtonPlayerId('');
                  setDealtOutPlayers([]);
                  setActivePlayers([]);
                  // Call onHandComplete to return to table positions view
                  if (onHandComplete) {
                    onHandComplete();
                  }
                }}
                variant="outline"
                className="h-12 text-base font-semibold"
                size="lg"
              >
                Cancel
              </Button>
              <Button 
                onClick={startNewHand} 
                disabled={!buttonPlayerId || loading || positionsChanged} 
                className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {positionsChanged 
                  ? '⚠️ Positions Changed - Record Hand to Enable' 
                  : buttonPlayerId 
                    ? '🎴 Deal Cards' 
                    : '👆 Select Button'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile: Player Action Dialog */}
        <Dialog open={showPlayerActionDialog} onOpenChange={(open) => {
          if (!open) handleCancelDialog();
        }}>
          <DialogContent className="sm:max-w-md md:hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {selectedPlayer?.player.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                {selectedPlayer?.player.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Select whether {selectedPlayer?.player.name} will play in this hand or be marked as not playing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleToggleDealtOut} 
                className="w-full h-14 text-base"
                variant={dealtOutPlayers.includes(selectedPlayerId) ? "default" : "outline"}
              >
                {dealtOutPlayers.includes(selectedPlayerId) ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Not Dealt In
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 mr-2" />
                    Mark as Not Playing
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCancelDialog} 
                className="w-full h-12"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (stage === 'showdown') {
    // Filter to only remaining players (those who haven't folded)
    const remainingPlayers = activePlayers.filter(p => playersInHand.includes(p.player_id));
    const winnerResult = autoSelectWinner();
    
    const showdownContent = (
      <Card className="border-2 border-poker-gold/50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 py-3">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/30 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <span className="text-lg font-bold">🏆 Showdown</span>
            </div>
            {winnerResult && (
              <Badge className="bg-green-600 text-white px-3 py-1 text-sm animate-bounce">
                ✨ Winner Detected!
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {/* Show all community cards with labels */}
          {(flopCards || turnCard || riverCard) && (
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-2 sm:p-3">
              <div className="flex gap-2 sm:gap-3 justify-center flex-wrap items-center">
                {/* Flop */}
                {flopCards && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-green-200 text-center">FLOP</span>
                    <div className="flex gap-0.5">
                      {flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                        <PokerCard key={`flop-${idx}`} card={card} size="xs" />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Turn */}
                {turnCard && flopCards && (
                  <>
                    <div className="h-10 sm:h-12 w-px bg-green-500/50"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-green-200 text-center">TURN</span>
                      <PokerCard card={turnCard} size="xs" />
                    </div>
                  </>
                )}
                
                {/* River */}
                {riverCard && turnCard && (
                  <>
                    <div className="h-10 sm:h-12 w-px bg-green-500/50"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-green-200 text-center">RIVER</span>
                      <PokerCard card={riverCard} size="xs" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-lg font-bold text-center text-poker-gold">
            Pot: {formatWithBB(potSize)}
          </div>

          {/* Hole Cards Entry Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Player Hole Cards</h3>
              <p className="text-xs text-muted-foreground">
                {remainingPlayers.filter(p => playerHoleCards[p.player_id]).length}/{remainingPlayers.length} entered
              </p>
            </div>
            
            <div className="space-y-1.5">
              {remainingPlayers.map((gp) => (
                <div
                  key={gp.player_id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium">{gp.player.name}</span>
                    {gp.player_id === heroPlayer?.player_id && (
                      <Badge variant="secondary" className="text-xs">Hero</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {playerHoleCards[gp.player_id] ? (
                      <>
                        <div className="flex gap-0.5">
                          {playerHoleCards[gp.player_id].match(/.{1,2}/g)?.map((card, idx) => (
                            <PokerCard key={idx} card={card} size="xs" />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayerForHole(gp.player_id);
                            setShowHoleCardInput(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          Edit
                        </Button>
                        {/* Only show winner button if no winner auto-detected and this player has cards */}
                        {!winnerResult && playerHoleCards[gp.player_id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => finishHand([gp.player_id], 'showdown')}
                            className="bg-poker-gold/10 hover:bg-poker-gold/20 border-poker-gold/50 h-7 px-2 text-xs"
                          >
                            👑 Winner
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPlayerForHole(gp.player_id);
                          setShowHoleCardInput(true);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        Add Hole Cards
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winner Display */}
          {winnerResult && (
            <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-600/50 rounded-lg p-3">
              <div className="text-center space-y-2">
                {winnerResult.winners.length === 1 ? (
                  <>
                    <div className="text-xl font-bold text-green-400">
                      🏆 {winnerResult.winners[0].playerName} Wins!
                    </div>
                    <div className="text-base font-semibold text-poker-gold">
                      {winnerResult.winners[0].handName}
                    </div>
                    <div className="flex gap-0.5 justify-center">
                      {winnerResult.winners[0].bestHand.map((card, idx) => (
                        <PokerCard key={idx} card={card} size="xs" />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-green-400">
                      🏆 Chopped Pot!
                    </div>
                    <div className="text-base font-semibold text-poker-gold">
                      {winnerResult.winners.length} Players with {winnerResult.winners[0].handName}
                    </div>
                    <div className="space-y-1.5">
                      {winnerResult.winners.map((winner) => (
                        <div key={winner.playerId} className="flex items-center justify-center gap-2">
                          <span className="text-sm font-medium">{winner.playerName}</span>
                          <div className="flex gap-0.5">
                            {winner.bestHand.map((card, idx) => (
                              <PokerCard key={idx} card={card} size="xs" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {winnerResult.allHands.length > 1 && (
                  <details className="text-xs text-left">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View All Hands
                    </summary>
                    <div className="mt-1.5 space-y-1">
                      {winnerResult.allHands.map((hand, idx) => (
                        <div key={hand.playerId} className="p-1.5 bg-muted/30 rounded text-xs">
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
                  onClick={() => finishHand(winnerResult.winners.map(w => w.playerId), 'showdown')}
                  className="w-full bg-green-600 hover:bg-green-700 h-9"
                >
                  Confirm & Complete Hand
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
    
    return (
      <>
        {/* Mobile: Drawer for showdown - can't be dismissed */}
        <Drawer open={true} onOpenChange={() => {
          // Prevent dismissal during showdown - must complete or go back
          toast({
            title: 'Complete Hand',
            description: 'Please complete the hand or use back button to return',
          });
        }}>
          <DrawerContent className="md:hidden h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Showdown - Hand #{currentHand?.hand_number}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {showdownContent}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Desktop: Regular card */}
        <div className="hidden md:block mt-6">
          {showdownContent}
        </div>

        {/* Hole Card Selector - Direct card selector without intermediate dialog */}
        <CardSelector
          open={showHoleCardInput}
          onOpenChange={(isOpen) => {
            setShowHoleCardInput(isOpen);
            // Reset selected player when dialog closes
            if (!isOpen) {
              setSelectedPlayerForHole('');
            }
          }}
          onSelect={(cards) => {
            handleHoleCardSubmit(cards);
          }}
          maxCards={2}
          usedCards={getUsedCards()}
          knownHoleCards={Object.entries(playerHoleCards)
            .filter(([playerId]) => playerId !== selectedPlayerForHole)
            .flatMap(([_, cards]) => parseCardNotationString(cards))
          }
          selectedCards={selectedPlayerForHole ? parseCardNotationString(playerHoleCards[selectedPlayerForHole] || '') : []}
          label={`Select Hole Cards for ${remainingPlayers.find(p => p.player_id === selectedPlayerForHole)?.player.name || 'Player'}`}
        />
      </>
    );
  }

  // Mobile full-screen hand tracking content - WITHOUT action history
  const handTrackingContent = (
    <div 
      className="flex flex-col h-full bg-background"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header - compact on mobile */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-2 sm:p-3 border-b border-primary/20 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/30 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Hand #{currentHand?.hand_number}</span>
              <Badge variant="outline" className="w-fit text-[10px] h-4 px-1">
                {stage.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-0.5">
              <Badge variant="secondary" className="text-sm px-2 py-1 bg-amber-500/20 border-amber-500/30">
                💰 {formatWithBB(potSize)}
              </Badge>
              {(cardsJustAdded || actionHistory.length > 0) && (
                <span className="text-[9px] text-muted-foreground">👉 Swipe right to {cardsJustAdded ? 'edit' : 'undo'}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/20"
              onClick={() => {
                // Cancel hand tracking - clear saved state and go back to dashboard
                clearHandState();
                setShowMobileHandTracking(false);
                setStage('setup');
                setCurrentHand(null);
                setButtonPlayerId('');
                setDealtOutPlayers([]);
                setActivePlayers([]);
                setActionSequence(0);
                setPotSize(0);
                setFlopCards('');
                setTurnCard('');
                setRiverCard('');
                setStreetActions([]);
                setAllHandActions([]);
                setPlayersInHand([]);
                setPlayerHoleCards({});
                setPlayerBets({});
                setStreetPlayerBets({});
                setLastAggressorIndex(null);
                setActionHistory([]);
                if (onHandComplete) {
                  onHandComplete();
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area - 2/3 of remaining space for table view */}
      <div className="flex-[2] overflow-y-auto min-h-0 bg-background">
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
          {/* Poker Table - WITHOUT community cards on table for mobile */}
          {activePlayers.length > 0 && (
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-700/30">
              <PokerTableView
                positions={activePlayers.map(gp => ({
                  seat: seatPositions[gp.player_id] ?? 0,
                  player_id: gp.player_id,
                  player_name: gp.player.name,
                }))}
                buttonPlayerId={currentHand?.button_player_id}
                seatPositions={seatPositions}
                playerBets={streetPlayerBets}
                potSize={potSize}
                showPositionLabels={true}
                foldedPlayers={activePlayers.filter(gp => !playersInHand.includes(gp.player_id)).map(gp => gp.player_id).concat(dealtOutPlayers)}
                communityCards="" // DON'T show community cards on table for mobile
                activePlayerId={currentPlayer?.player_id}
                playerHoleCards={playerHoleCards}
                playerStacks={playerStacks}
              />
            </div>
          )}

          {/* Community Cards Display - Separate from table, similar to hand history */}
          {(flopCards || turnCard || riverCard) && (
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-3 rounded-xl border border-green-700/30">
              <div className="flex gap-3 items-center flex-wrap">
                {/* Flop */}
                {flopCards && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">FLOP</span>
                    <div className="flex gap-0.5">
                      {flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                        <PokerCard key={idx} card={card} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Turn */}
                {turnCard && flopCards && (
                  <>
                    <div className="h-12 w-px bg-green-700/50"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">TURN</span>
                      <div className="flex gap-0.5">
                        <PokerCard card={turnCard} size="sm" />
                      </div>
                    </div>
                  </>
                )}
                
                {/* River */}
                {riverCard && turnCard && (
                  <>
                    <div className="h-12 w-px bg-green-700/50"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">RIVER</span>
                      <div className="flex gap-0.5">
                        <PokerCard card={riverCard} size="sm" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* NO ACTION HISTORY IN MOBILE VIEW */}
        </div>
      </div>

      {/* Bottom 1/3 - Action Buttons */}
      <div className="flex-shrink-0 bg-gradient-to-t from-background via-background to-background/95 border-t-2 border-primary/20 p-2 sm:p-3 space-y-2">
        {/* Action Buttons */}
        {!canMoveToNextStreet() && playersInHand.includes(currentPlayer?.player_id || '') ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => {
                  recordAction('Call');
                  // Reset bet amount after action
                  setBetAmount('');
                }} 
                variant="outline"
                size="lg"
                disabled={(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                className="h-12 text-sm font-bold hover:bg-green-500/20 hover:border-green-500"
              >
                {currentBet === 0 ? '✓ Check' : `Call ${currentBet}`}
              </Button>
              <Button 
                onClick={() => {
                  recordAction('Fold');
                  // Reset bet amount after action
                  setBetAmount('');
                }} 
                variant="destructive"
                size="lg"
                disabled={(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                className="h-12 text-sm font-bold"
              >
                ❌ Fold
              </Button>
            </div>
            
            {/* Raise/Bet */}
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') return;
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue > 0) {
                    const smallBlind = game.small_blind || 50;
                    const rounded = Math.round(numValue / smallBlind) * smallBlind;
                    setBetAmount(rounded.toString());
                  } else {
                    setBetAmount('');
                  }
                }}
                placeholder={currentBet === 0 ? `Bet` : `Raise`}
                className="flex-1 h-12 text-base"
              />
              <Button 
                onClick={() => recordAction('Raise')} 
                disabled={!betAmount}
                size="lg"
                className="h-12 px-6 font-bold bg-orange-600 hover:bg-orange-700"
              >
                {currentBet === 0 ? '💰 Bet' : '📈 Raise'}
              </Button>
            </div>
          </div>
        ) : !playersInHand.includes(currentPlayer?.player_id || '') ? (
          <div className="bg-muted/50 p-3 rounded-lg text-center border border-dashed">
            <p className="text-sm text-muted-foreground">🃏 Player has folded</p>
          </div>
        ) : null}

        {/* Street Navigation - Removed Next button in mobile, card selector auto-opens */}
      </div>
    </div>
  );

  return (
    <>
    {/* Mobile: Drawer for hand tracking */}
    <Drawer open={showMobileHandTracking} onOpenChange={(open) => {
      // Allow closing drawer via back button/swipe down
      setShowMobileHandTracking(open);
      // When drawer is closed (swiped away), call onHandComplete to show table positions
      if (!open && onHandComplete) {
        onHandComplete();
      }
    }} modal={true} dismissible={true}>
      <DrawerContent className="md:hidden h-[95vh] overflow-hidden">
        {handTrackingContent}
      </DrawerContent>
    </Drawer>

    {/* Desktop view - unchanged */}
    <Card className="mt-6 border-2 border-primary/50 shadow-xl animate-fade-in hidden md:block">
      <CardHeader className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/30 rounded-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold">Hand #{currentHand?.hand_number}</span>
              <Badge variant="outline" className="w-fit mt-1">
                {stage.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <Badge variant="secondary" className="text-base sm:text-lg px-4 py-2 bg-amber-500/20 border-amber-500/30">
              💰 {formatWithBB(potSize)}
            </Badge>
            {currentPlayer && (
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {currentPlayer.player.name}'s turn
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Poker Table Visualization */}
        {activePlayers.length > 0 && (
          <div className="mb-6">
            <PokerTableView
              positions={activePlayers.map(gp => ({
                seat: seatPositions[gp.player_id] ?? 0,
                player_id: gp.player_id,
                player_name: gp.player.name,
              }))}
              buttonPlayerId={currentHand?.button_player_id}
              seatPositions={seatPositions}
              playerBets={streetPlayerBets}
              potSize={potSize}
              showPositionLabels={true}
              foldedPlayers={activePlayers.filter(gp => !playersInHand.includes(gp.player_id)).map(gp => gp.player_id).concat(dealtOutPlayers)}
              communityCards="" // DON'T show community cards on table - show in separate section below
              activePlayerId={currentPlayer?.player_id}
              playerHoleCards={playerHoleCards}
              playerStacks={playerStacks}
            />
          </div>
        )}

        {/* Community Cards Display - Separate from table (mobile flow on desktop) */}
        {(flopCards || turnCard || riverCard) && (
          <div className="mb-6 bg-gradient-to-br from-green-900/20 to-green-800/20 p-4 rounded-xl border border-green-700/30">
            <div className="flex gap-4 items-center flex-wrap">
              {/* Flop */}
              {flopCards && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">FLOP</span>
                  <div className="flex gap-1">
                    {flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                      <PokerCard key={idx} card={card} size="sm" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Turn - only show if flop cards have been dealt (poker rules) */}
              {turnCard && flopCards && (
                <>
                  <div className="h-12 w-px bg-green-700/50"></div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">TURN</span>
                    <div className="flex gap-1">
                      <PokerCard card={turnCard} size="sm" />
                    </div>
                  </div>
                </>
              )}
              
              {/* River - only show if turn card has been dealt (poker rules) */}
              {riverCard && turnCard && (
                <>
                  <div className="h-12 w-px bg-green-700/50"></div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">RIVER</span>
                    <div className="flex gap-1">
                      <PokerCard card={riverCard} size="sm" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Card preview - shown only for just-added community cards until next betting action */}
        {stage === 'flop' && flopCards && cardsJustAdded && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border">
              <span className="text-sm font-semibold">Flop:</span>
              <div className="flex gap-1">
                {flopCards.match(/.{1,2}/g)?.map((card, idx) => (
                  <PokerCard key={idx} card={card} size="xs" />
                ))}
              </div>
            </div>
            {currentPlayer && (
              <div className="bg-amber-500/20 border border-amber-500/50 p-2 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  👉 {currentPlayer.player.name} to act first
                </p>
              </div>
            )}
          </div>
        )}
        {stage === 'turn' && turnCard && cardsJustAdded && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border">
              <span className="text-sm font-semibold">Turn:</span>
              <PokerCard card={turnCard} size="xs" />
            </div>
            {currentPlayer && (
              <div className="bg-amber-500/20 border border-amber-500/50 p-2 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  👉 {currentPlayer.player.name} to act first
                </p>
              </div>
            )}
          </div>
        )}
        {stage === 'river' && riverCard && cardsJustAdded && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border">
              <span className="text-sm font-semibold">River:</span>
              <PokerCard card={riverCard} size="xs" />
            </div>
            {currentPlayer && (
              <div className="bg-amber-500/20 border border-amber-500/50 p-2 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  👉 {currentPlayer.player.name} to act first
                </p>
              </div>
            )}
          </div>
        )}




        {/* Action buttons - COMPACT */}
        {!canMoveToNextStreet() && playersInHand.includes(currentPlayer?.player_id || '') ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => recordAction('Call')} 
                variant="outline"
                size="default"
                disabled={(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                className="h-10 text-sm font-semibold hover:bg-green-500/20 hover:border-green-500 transition-all"
              >
                {currentBet === 0 
                  ? '✓ Check' 
                  : `🪙 Call ${currentPlayer && formatWithBB(getCallAmount(currentPlayer.player_id, currentBet, streetPlayerBets))}`
                }
              </Button>
              <Button 
                onClick={() => recordAction('Fold')} 
                variant="destructive"
                size="default"
                disabled={(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                className="h-10 text-sm font-semibold hover:bg-red-600 transition-all"
              >
                ❌ Fold
              </Button>
            </div>
            
            {/* Raise input - compact */}
            <div className="bg-muted/30 p-2 rounded-lg border border-border">
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={betAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty input or direct value entry
                    setBetAmount(value);
                  }}
                  onBlur={(e) => {
                    // Round to nearest small blind multiple only on blur
                    const value = e.target.value;
                    if (value === '') {
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      if (numValue <= 0) {
                        // Clear invalid values
                        setBetAmount('');
                      } else {
                        const smallBlind = game.small_blind || 50;
                        const rounded = Math.round(numValue / smallBlind) * smallBlind;
                        setBetAmount(rounded.toString());
                      }
                    } else {
                      setBetAmount('');
                    }
                  }}
                  placeholder={currentBet === 0 ? `Bet (min: ${game.big_blind})` : `Min raise: ${currentBet * 2 - (currentPlayer ? streetPlayerBets[currentPlayer.player_id] || 0 : 0)}`}
                  min={currentBet === 0 ? game.big_blind : currentBet * 2 - (currentPlayer ? streetPlayerBets[currentPlayer.player_id] || 0 : 0)}
                  step={game.small_blind || 50}
                  disabled={(stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                  className="flex-1 h-10 text-sm"
                />
                <Button 
                  onClick={() => recordAction('Raise')} 
                  disabled={!betAmount || (stage === 'flop' && !flopCards) || (stage === 'turn' && !turnCard) || (stage === 'river' && !riverCard)}
                  size="default"
                  className="h-10 px-4 font-semibold bg-orange-600 hover:bg-orange-700 text-sm"
                >
                  {currentBet === 0 ? '💰 Bet' : '📈 Raise'}
                </Button>
              </div>
            </div>
          </div>
        ) : !playersInHand.includes(currentPlayer?.player_id || '') ? (
          <div className="bg-muted/50 p-3 rounded-lg text-center border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground font-medium">
              🃏 This player has folded
            </p>
          </div>
        ) : null}

        {/* Navigation buttons - compact */}
        <div className="flex gap-2">
          {/* Back button - handles undo or edit cards */}
          <Button 
            onClick={() => {
              // If cards were just added, edit them instead of undo
              if (cardsJustAdded) {
                handleEditCards();
              } else {
                undoLastAction();
              }
            }} 
            className="h-10 text-sm font-semibold" 
            variant="outline"
            size="default"
            disabled={!cardsJustAdded && actionHistory.length === 0}
          >
            {cardsJustAdded ? '✏️ Edit Cards' : '← Back'}
          </Button>
          {/* Only show Next button when it can be clicked */}
          {canMoveToNextStreet() && (
            <Button 
              onClick={moveToNextStreet} 
              className="flex-1 h-10 text-sm font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
              variant="default"
              size="default"
            >
              {stage === 'river' ? '🏆 Go to Showdown' : 'Next Street →'}
            </Button>
          )}
        </div>

        {/* Action history - ALL actions from all streets - COLLAPSIBLE */}
        {allHandActions.length > 0 && (
          <Collapsible open={isActionHistoryOpen} onOpenChange={setIsActionHistoryOpen}>
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border shadow-lg">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Action History</div>
                    <Badge variant="outline" className="text-xs">{allHandActions.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {stage.toUpperCase()}
                    </Badge>
                    {isActionHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {actionsByStreet.map(({ street, actions: streetActions }) => (
                    <div key={street} className="space-y-1">
                      <div className="flex items-center gap-2 sticky top-0 bg-muted/90 backdrop-blur-sm px-2 py-1 rounded-md z-10">
                        <div className="h-px flex-1 bg-border"></div>
                        <span className="text-xs font-bold text-primary">{street}</span>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>
                      {streetActions.map((action, idx) => {
                        const player = game.game_players.find(gp => gp.player_id === action.player_id);
                        const actionIndex = allHandActions.indexOf(action);
                        const canDelete = stage !== 'preflop' || actionIndex >= 2; // Can't delete blinds
                        
                        return (
                          <div key={actionIndex} className="bg-background/50 rounded-lg p-2.5 text-xs flex justify-between items-center gap-2 hover:bg-background/80 transition-colors border border-border/50">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {idx + 1}
                              </div>
                              <span className="font-semibold">{player?.player.name}</span>
                              {action.position && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {action.position}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={getActionBadgeVariant(action.action_type)}
                                className="text-[10px] font-semibold"
                              >
                                {action.action_type}
                              </Badge>
                              {action.bet_size > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  {formatWithBB(action.bet_size)}
                                </span>
                              )}
                              {canDelete && action.id.startsWith('temp-action-') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
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
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
    
    {/* Card Selector for community cards - auto-opens when cards need to be selected */}
    <Dialog open={showCardSelector} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // When closing without confirm, treat it as a swipe/undo action
        if (cardsJustAdded) {
          // If cards were just added, allow editing
          setTempCommunityCards('');
        } else if (actionHistory.length > 0) {
          // If no cards just added, undo last action
          undoLastAction();
        }
        setTempCommunityCards('');
      }
      setShowCardSelector(isOpen);
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {cardSelectorType === 'flop' ? 'Select Flop Cards (3)' : 
             cardSelectorType === 'turn' ? 'Select Turn Card (1)' : 
             'Select River Card (1)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select {cardSelectorType === 'flop' ? '3 cards for the flop' : '1 card for the ' + cardSelectorType} from the grid below. Already used cards are greyed out.
          </DialogDescription>
        </DialogHeader>
        
        {/* Card grid by suit */}
        <div className="space-y-4">
          {[
            { code: 'h', name: 'Hearts', symbol: '♥', color: 'text-red-600 dark:text-red-500' },
            { code: 'd', name: 'Diamonds', symbol: '♦', color: 'text-red-600 dark:text-red-500' },
            { code: 'c', name: 'Clubs', symbol: '♣', color: 'text-gray-900 dark:text-gray-100' },
            { code: 's', name: 'Spades', symbol: '♠', color: 'text-gray-900 dark:text-gray-100' },
          ].map(suit => {
            const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
            // When editing, exclude the cards being edited from the used cards list
            const cardsBeingEdited = tempCommunityCards ? tempCommunityCards.match(/.{1,2}/g) || [] : [];
            const usedCards = getUsedCards(cardsBeingEdited);
            const knownHoleCards = Object.values(playerHoleCards).flatMap(cards => cards.match(/.{1,2}/g) || []);
            const currentSelection = tempCommunityCards ? tempCommunityCards.match(/.{1,2}/g) || [] : [];
            
            return (
              <div key={suit.code} className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                  <span className={`text-2xl ${suit.color}`}>{suit.symbol}</span>
                  <h3 className="font-semibold text-base">{suit.name}</h3>
                </div>
                <div className="grid grid-cols-13 gap-0.5">
                  {ranks.map(rank => {
                    const card = `${rank}${suit.code}`;
                    const isUsed = usedCards.includes(card);
                    const isKnownHole = knownHoleCards.includes(card);
                    const isSelected = currentSelection.includes(card);
                    
                    return (
                      <button
                        key={card}
                        onClick={() => {
                          if (isUsed || isKnownHole) return;
                          
                          if (isSelected) {
                            // Remove from selection
                            const newSelection = currentSelection.filter(c => c !== card);
                            const newCards = newSelection.join('');
                            setTempCommunityCards(newCards);
                          } else {
                            // Add to selection
                            const maxCards = cardSelectorType === 'flop' ? 3 : 1;
                            if (currentSelection.length < maxCards) {
                              const newSelection = [...currentSelection, card];
                              const newCards = newSelection.join('');
                              setTempCommunityCards(newCards);
                            }
                          }
                        }}
                        disabled={isUsed || isKnownHole}
                        className={`relative aspect-[5/7] w-full transition-all duration-200 rounded touch-manipulation ${
                          (isUsed || isKnownHole) ? 'opacity-30 cursor-not-allowed grayscale' : ''
                        } ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10 shadow-lg' : ''} ${
                          !isUsed && !isKnownHole && !isSelected ? 'hover:scale-105 hover:shadow-md cursor-pointer active:scale-95' : ''
                        }`}
                      >
                        <PokerCard card={card} size="xs" className="sm:hidden pointer-events-none" />
                        <PokerCard card={card} size="sm" className="hidden sm:block pointer-events-none" />
                        {isUsed && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                            <div className="bg-red-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                              USED
                            </div>
                          </div>
                        )}
                        {isKnownHole && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                            <div className="bg-blue-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                              HOLE
                            </div>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-none">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => {
            // Cancel - reset temp state and close
            setTempCommunityCards('');
            setShowCardSelector(false);
          }} className="flex-1 h-12 text-base">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // Confirm - save temp state to actual state
              const maxCards = cardSelectorType === 'flop' ? 3 : 1;
              const currentSelection = tempCommunityCards ? tempCommunityCards.match(/.{1,2}/g) || [] : [];
              if (currentSelection.length === maxCards) {
                if (cardSelectorType === 'flop') {
                  setFlopCards(tempCommunityCards);
                  setCardsJustAdded(true);
                } else if (cardSelectorType === 'turn') {
                  setTurnCard(tempCommunityCards);
                  setCardsJustAdded(true);
                } else if (cardSelectorType === 'river') {
                  setRiverCard(tempCommunityCards);
                  setCardsJustAdded(true);
                }
                setTempCommunityCards('');
                setShowCardSelector(false);
              }
            }}
            disabled={
              (cardSelectorType === 'flop' && (!tempCommunityCards || tempCommunityCards.match(/.{1,2}/g)?.length !== 3)) ||
              (cardSelectorType === 'turn' && !tempCommunityCards) ||
              (cardSelectorType === 'river' && !tempCommunityCards)
            }
            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};

export default HandTracking;
