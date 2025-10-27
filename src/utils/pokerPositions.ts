/**
 * Poker Position Assignment Utility
 * 
 * Positions are assigned relative to the button player, moving clockwise:
 * BTN -> SB (left/clockwise from BTN) -> BB -> UTG -> UTG+1 -> ... -> CO (right of BTN)
 * 
 * CRITICAL: Only active (non-dealt-out) players receive position assignments.
 */

import { GamePlayer } from '@/types/poker';

export type PokerPosition = 
  | 'BTN' 
  | 'SB' 
  | 'BB' 
  | 'UTG' 
  | 'UTG+1' 
  | 'UTG+2' 
  | 'UTG+3'
  | 'MP1'
  | 'MP2'
  | 'LJ' 
  | 'HJ' 
  | 'CO';

/**
 * Standard poker position names for different table sizes
 * Positions are listed in clockwise order starting from Button
 */
const POSITION_MAPS: Record<number, PokerPosition[]> = {
  2: ['BTN', 'BB'], // Heads-up: BTN posts SB
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'UTG'],
  5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'HJ', 'CO'],
  9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'],
  10: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP1', 'MP2', 'HJ', 'CO'],
};

/**
 * Get position name for a player relative to the button
 * 
 * @param buttonIndex - Index of button player in activePlayers array
 * @param playerIndex - Index of player in activePlayers array
 * @param totalActivePlayers - Total number of active players
 * @returns Position name (BTN, SB, BB, UTG, etc.)
 */
export const getPlayerPosition = (
  buttonIndex: number,
  playerIndex: number,
  totalActivePlayers: number
): PokerPosition => {
  // Calculate clockwise offset from button (0 = BTN, 1 = SB, 2 = BB, etc.)
  const relativePosition = (playerIndex - buttonIndex + totalActivePlayers) % totalActivePlayers;
  
  const positionMap = POSITION_MAPS[totalActivePlayers];
  
  if (positionMap && relativePosition < positionMap.length) {
    return positionMap[relativePosition];
  }
  
  // Fallback for unusual table sizes
  if (relativePosition === 0) return 'BTN';
  if (relativePosition === 1) return 'SB';
  if (relativePosition === 2) return 'BB';
  return 'UTG'; // Default fallback
};

/**
 * Get position assignments for all active players
 * 
 * @param activePlayers - Array of active (non-dealt-out) players
 * @param buttonPlayerId - ID of the button player
 * @returns Map of player_id to position name
 */
export const getPositionAssignments = (
  activePlayers: GamePlayer[],
  buttonPlayerId: string
): Record<string, PokerPosition> => {
  const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
  
  if (buttonIndex === -1) {
    throw new Error('Button player not found in active players');
  }
  
  const assignments: Record<string, PokerPosition> = {};
  
  activePlayers.forEach((player, index) => {
    assignments[player.player_id] = getPlayerPosition(buttonIndex, index, activePlayers.length);
  });
  
  return assignments;
};

/**
 * Get the Small Blind player from active players
 */
export const getSmallBlindPlayer = (
  activePlayers: GamePlayer[],
  buttonPlayerId: string
): GamePlayer => {
  const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
  const sbIndex = (buttonIndex + 1) % activePlayers.length;
  return activePlayers[sbIndex];
};

/**
 * Get the Big Blind player from active players
 */
export const getBigBlindPlayer = (
  activePlayers: GamePlayer[],
  buttonPlayerId: string
): GamePlayer => {
  const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
  const bbIndex = (buttonIndex + 2) % activePlayers.length;
  return activePlayers[bbIndex];
};

/**
 * Get position for a specific player
 */
export const getPositionForPlayer = (
  activePlayers: GamePlayer[],
  buttonPlayerId: string,
  targetPlayerId: string
): PokerPosition => {
  const buttonIndex = activePlayers.findIndex(p => p.player_id === buttonPlayerId);
  const playerIndex = activePlayers.findIndex(p => p.player_id === targetPlayerId);
  
  if (buttonIndex === -1 || playerIndex === -1) {
    throw new Error('Player not found in active players');
  }
  
  return getPlayerPosition(buttonIndex, playerIndex, activePlayers.length);
};
