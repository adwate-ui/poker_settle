import { GamePlayer, PlayerAction } from '@/types/poker';

export type HandStage = 'setup' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';
export type ActionType = 'Small Blind' | 'Big Blind' | 'Straddle' | 'Re-Straddle' | 'Call' | 'Raise' | 'Fold';

export interface HandState {
  stage: HandStage;
  activePlayers: GamePlayer[];
  currentPlayerIndex: number;
  playersInHand: string[]; // Players who haven't folded
  dealtOutPlayers: string[]; // Players who weren't dealt in
  buttonPlayerIndex: number;
  currentBet: number;
  potSize: number;
  streetPlayerBets: Record<string, number>;
  totalPlayerBets: Record<string, number>;
  streetActions: PlayerAction[];
  actionSequence: number;
  lastAggressorIndex: number | null; // Tracks last player who raised/bet
}

/**
 * Get the next active player index following poker rotation rules
 */
export const getNextPlayerIndex = (
  currentIndex: number,
  stage: HandStage,
  activePlayers: GamePlayer[],
  buttonPlayerIndex: number,
  playersInHand: string[]
): number => {
  if (activePlayers.length === 0) return 0;

  let nextIndex = (currentIndex + 1) % activePlayers.length;
  let attempts = 0;
  
  // Keep rotating until we find an active player
  while (attempts < activePlayers.length) {
    const player = activePlayers[nextIndex];
    
    // Skip players who have folded or were dealt out
    if (playersInHand.includes(player.player_id)) {
      return nextIndex;
    }
    
    nextIndex = (nextIndex + 1) % activePlayers.length;
    attempts++;
  }
  
  return currentIndex; // Fallback to current if no valid player found
};

/**
 * Get the starting player index for a betting round
 * CRITICAL: Must respect seat-based positions and skip dealt-out players
 */
export const getStartingPlayerIndex = (
  stage: HandStage,
  activePlayers: GamePlayer[],
  buttonPlayerId: string
): number => {
  if (activePlayers.length === 0) return 0;
  
  // activePlayers should already be sorted by seat position
  const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
  if (buttonIndex === -1) return 0;
  
  if (stage === 'preflop') {
    // Preflop: UTG is the first active player left of Big Blind
    // Button +1 = SB, +2 = BB, +3 = UTG (first active player after BB)
    const utgIndex = (buttonIndex + 3) % activePlayers.length;
    return utgIndex;
  } else {
    // Postflop: First active player immediately left of button
    const firstPlayerIndex = (buttonIndex + 1) % activePlayers.length;
    return firstPlayerIndex;
  }
};

/**
 * Check if betting round is complete
 * CRITICAL: Round reopens when any player raises - all players must respond
 */
export const isBettingRoundComplete = (
  stage: HandStage,
  activePlayers: GamePlayer[],
  playersInHand: string[],
  streetPlayerBets: Record<string, number>,
  streetActions: PlayerAction[],
  buttonPlayerId: string,
  lastAggressorIndex: number | null
): boolean => {
  // Check if only one player remains
  const remainingPlayers = activePlayers.filter(p => playersInHand.includes(p.player_id));
  if (remainingPlayers.length <= 1) {
    return true;
  }

  // Get all bets from remaining active players
  const activeBets = remainingPlayers.map(p => streetPlayerBets[p.player_id] || 0);
  
  if (activeBets.length === 0) return false;
  
  // Check if all bets are equal
  const maxBet = Math.max(...activeBets);
  const allBetsEqual = activeBets.every(bet => bet === maxBet);
  
  if (!allBetsEqual) return false;
  
  // CRITICAL: If there was a raise, all players after the raiser must have acted
  if (lastAggressorIndex !== null) {
    const aggressorPlayer = activePlayers[lastAggressorIndex];
    if (!aggressorPlayer) return false;
    
    // Find all actions after the last raise/bet (search backwards)
    let lastAggressiveActionIndex = -1;
    for (let i = streetActions.length - 1; i >= 0; i--) {
      const action = streetActions[i];
      if (action.player_id === aggressorPlayer.player_id && 
          (action.action_type === 'Raise' || 
           (action.action_type === 'Big Blind' && stage === 'preflop'))) {
        lastAggressiveActionIndex = i;
        break;
      }
    }
    
    if (lastAggressiveActionIndex === -1) return false;
    
    const actionsAfterRaise = streetActions.slice(lastAggressiveActionIndex + 1);
    
    // All remaining players (except raiser) must have acted after the raise
    for (const player of remainingPlayers) {
      if (player.player_id === aggressorPlayer.player_id) continue;
      
      const hasActedAfterRaise = actionsAfterRaise.some(
        a => a.player_id === player.player_id
      );
      
      if (!hasActedAfterRaise) {
        return false;
      }
    }
  }
  
  // Special preflop rule: SB and BB must have chance to act
  if (stage === 'preflop') {
    const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
    if (buttonIndex === -1) return false;
    
    const sbIndex = (buttonIndex + 1) % activePlayers.length;
    const bbIndex = (buttonIndex + 2) % activePlayers.length;
    const sbPlayerId = activePlayers[sbIndex]?.player_id;
    const bbPlayerId = activePlayers[bbIndex]?.player_id;
    
    if (!sbPlayerId || !bbPlayerId) return false;
    
    // Count non-blind actions for SB and BB
    const sbNonBlindActions = streetActions.filter(
      a => a.player_id === sbPlayerId && a.action_type !== 'Small Blind'
    ).length;
    const bbNonBlindActions = streetActions.filter(
      a => a.player_id === bbPlayerId && a.action_type !== 'Big Blind'
    ).length;
    
    // Both must act at least once after posting blinds
    if (sbNonBlindActions < 1 || bbNonBlindActions < 1) {
      return false;
    }
  } else {
    // Postflop: All remaining players must have acted at least once
    const playersWhoActed = new Set(streetActions.map(a => a.player_id));
    
    for (const player of remainingPlayers) {
      if (!playersWhoActed.has(player.player_id)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Check if only one player remains (hand ends immediately)
 */
export const shouldEndHandEarly = (
  activePlayers: GamePlayer[],
  playersInHand: string[]
): { shouldEnd: boolean; winnerId: string | null } => {
  const remainingPlayers = activePlayers.filter(p => playersInHand.includes(p.player_id));
  
  if (remainingPlayers.length === 1) {
    return {
      shouldEnd: true,
      winnerId: remainingPlayers[0].player_id
    };
  }
  
  return { shouldEnd: false, winnerId: null };
};

/**
 * Get the next stage in the hand
 */
export const getNextStage = (currentStage: HandStage): HandStage => {
  const stageProgression: Record<HandStage, HandStage> = {
    setup: 'preflop',
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
    river: 'showdown',
    showdown: 'complete',
    complete: 'complete'
  };
  
  return stageProgression[currentStage] || currentStage;
};

/**
 * Calculate call amount for a player
 */
export const getCallAmount = (
  playerId: string,
  currentBet: number,
  streetPlayerBets: Record<string, number>
): number => {
  const playerBet = streetPlayerBets[playerId] || 0;
  return Math.max(0, currentBet - playerBet);
};

/**
 * Process a player action and update state
 * CRITICAL: Track last aggressor to enforce raise response logic
 */
export const processAction = (
  state: HandState,
  actionType: ActionType,
  betSize: number
): Partial<HandState> => {
  const currentPlayer = state.activePlayers[state.currentPlayerIndex];
  if (!currentPlayer) return {};

  const playerStreetBet = state.streetPlayerBets[currentPlayer.player_id] || 0;
  let additionalAmount = 0;

  // Calculate additional amount added to pot
  if (actionType === 'Call') {
    additionalAmount = state.currentBet - playerStreetBet;
  } else if (actionType === 'Raise') {
    additionalAmount = betSize - playerStreetBet;
  } else if (actionType === 'Small Blind' || actionType === 'Big Blind') {
    additionalAmount = betSize;
  }

  const updates: Partial<HandState> = {
    potSize: state.potSize + additionalAmount,
    streetPlayerBets: {
      ...state.streetPlayerBets,
      [currentPlayer.player_id]: betSize
    },
    totalPlayerBets: {
      ...state.totalPlayerBets,
      [currentPlayer.player_id]: (state.totalPlayerBets[currentPlayer.player_id] || 0) + additionalAmount
    },
    actionSequence: state.actionSequence + 1
  };

  // Update current bet and track aggressor if raised
  if (actionType === 'Raise') {
    updates.currentBet = betSize;
    updates.lastAggressorIndex = state.currentPlayerIndex;
  }
  
  // BB is the initial aggressor preflop
  if (actionType === 'Big Blind' && state.stage === 'preflop') {
    updates.lastAggressorIndex = state.currentPlayerIndex;
  }

  // Handle fold
  if (actionType === 'Fold') {
    updates.playersInHand = state.playersInHand.filter(id => id !== currentPlayer.player_id);
    // Keep activePlayers unchanged to maintain seat order; skipping handled via playersInHand
  }

  return updates;
};

/**
 * Reset state for a new street
 */
export const resetForNewStreet = (
  state: HandState,
  buttonPlayerId: string
): Partial<HandState> => {
  const newStage = getNextStage(state.stage);
  const startingIndex = getStartingPlayerIndex(newStage, state.activePlayers, buttonPlayerId);

  // Reset street-specific bets and aggressor tracking
  const resetBets: Record<string, number> = {};
  state.activePlayers.forEach(p => resetBets[p.player_id] = 0);

  return {
    stage: newStage,
    currentPlayerIndex: startingIndex,
    currentBet: 0,
    streetPlayerBets: resetBets,
    streetActions: [],
    lastAggressorIndex: null // Reset aggressor for new street
  };
};
