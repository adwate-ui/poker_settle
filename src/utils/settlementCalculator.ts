/**
 * Enhanced Settlement Calculation
 * Prioritizes settling among cash players and minimizes their transactions with UPI players
 */

import { Settlement } from "@/types/poker";

export interface PlayerBalance {
  name: string;
  amount: number;
  paymentPreference: 'upi' | 'cash';
}

export interface EnhancedSettlement extends Settlement {
  isManual?: boolean;
  involvesCashPlayer?: boolean;
}

/**
 * Calculate settlements with cash player optimization
 * Algorithm:
 * 1. First settle among cash players only
 * 2. Then settle among UPI players only
 * 3. Finally settle between cash and UPI players (minimized)
 */
export function calculateOptimizedSettlements(
  playerBalances: PlayerBalance[],
  manualTransfers: Settlement[] = []
): EnhancedSettlement[] {
  // Build adjusted net amounts based on manual transfers
  const adjustedAmounts: Map<string, PlayerBalance> = new Map();
  
  playerBalances.forEach(pb => {
    adjustedAmounts.set(pb.name, { ...pb });
  });
  
  // Apply manual transfers: "from" pays "to"
  manualTransfers.forEach(transfer => {
    const from = adjustedAmounts.get(transfer.from);
    const to = adjustedAmounts.get(transfer.to);
    
    if (from) {
      from.amount += transfer.amount; // from paid, so their balance improves
    }
    if (to) {
      to.amount -= transfer.amount; // to received, so their balance decreases
    }
  });
  
  const balances = Array.from(adjustedAmounts.values());
  
  // Separate into winners (positive) and losers (negative)
  const winners = balances
    .filter(b => b.amount > 0)
    .map(b => ({ ...b })); // Clone to avoid mutation
  
  const losers = balances
    .filter(b => b.amount < 0)
    .map(b => ({ ...b, amount: Math.abs(b.amount) })); // Clone and make positive
  
  const settlements: EnhancedSettlement[] = [];
  
  // Phase 1: Settle among cash players
  const cashWinners = winners.filter(w => w.paymentPreference === 'cash');
  const cashLosers = losers.filter(l => l.paymentPreference === 'cash');
  
  settleGroup(cashWinners, cashLosers, settlements, true);
  
  // Phase 2: Settle among UPI players
  const upiWinners = winners.filter(w => w.paymentPreference === 'upi' || !w.paymentPreference);
  const upiLosers = losers.filter(l => l.paymentPreference === 'upi' || !l.paymentPreference);
  
  settleGroup(upiWinners, upiLosers, settlements, false);
  
  // Phase 3: Settle between cash and UPI players (remaining balances)
  const remainingWinners = [...cashWinners, ...upiWinners].filter(w => w.amount > 0);
  const remainingLosers = [...cashLosers, ...upiLosers].filter(l => l.amount > 0);
  
  settleGroup(remainingWinners, remainingLosers, settlements, true);
  
  return settlements;
}

/**
 * Settle debts within a group using greedy algorithm
 */
function settleGroup(
  winners: PlayerBalance[],
  losers: PlayerBalance[],
  settlements: EnhancedSettlement[],
  involvesCash: boolean
): void {
  let winnerIndex = 0;
  let loserIndex = 0;
  
  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    
    // Skip if either has zero balance
    if (winner.amount <= 0) {
      winnerIndex++;
      continue;
    }
    if (loser.amount <= 0) {
      loserIndex++;
      continue;
    }
    
    const settlementAmount = Math.min(winner.amount, loser.amount);
    
    if (settlementAmount > 0.01) { // Ignore very small amounts (rounding errors)
      settlements.push({
        from: loser.name,
        to: winner.name,
        amount: Math.round(settlementAmount),
        involvesCashPlayer: involvesCash,
      });
      
      winner.amount -= settlementAmount;
      loser.amount -= settlementAmount;
    }
    
    if (winner.amount <= 0.01) winnerIndex++;
    if (loser.amount <= 0.01) loserIndex++;
  }
}

/**
 * Standard settlement calculation (without cash optimization)
 * Used for backward compatibility
 */
export function calculateStandardSettlements(
  playerBalances: PlayerBalance[],
  manualTransfers: Settlement[] = []
): Settlement[] {
  // Build adjusted net amounts based on manual transfers
  const adjustedAmounts: Record<string, number> = {};
  
  playerBalances.forEach(pb => {
    adjustedAmounts[pb.name] = pb.amount;
  });
  
  // Apply manual transfers
  manualTransfers.forEach(transfer => {
    if (adjustedAmounts[transfer.from] !== undefined) {
      adjustedAmounts[transfer.from] += transfer.amount;
    }
    if (adjustedAmounts[transfer.to] !== undefined) {
      adjustedAmounts[transfer.to] -= transfer.amount;
    }
  });
  
  const winners = Object.entries(adjustedAmounts)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount }));
  
  const losers = Object.entries(adjustedAmounts)
    .filter(([_, amount]) => amount < 0)
    .map(([name, amount]) => ({ name, amount: Math.abs(amount) }));
  
  const settlements: Settlement[] = [];
  
  let winnerIndex = 0;
  let loserIndex = 0;
  
  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    
    const settlementAmount = Math.min(winner.amount, loser.amount);
    
    if (settlementAmount > 0) {
      settlements.push({
        from: loser.name,
        to: winner.name,
        amount: Math.round(settlementAmount),
      });
    }
    
    winner.amount -= settlementAmount;
    loser.amount -= settlementAmount;
    
    if (winner.amount <= 0) winnerIndex++;
    if (loser.amount <= 0) loserIndex++;
  }
  
  return settlements;
}

/**
 * Get settlement statistics
 */
export function getSettlementStats(settlements: EnhancedSettlement[]) {
  const totalTransactions = settlements.length;
  const cashTransactions = settlements.filter(s => s.involvesCashPlayer).length;
  const upiTransactions = totalTransactions - cashTransactions;
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  
  return {
    totalTransactions,
    cashTransactions,
    upiTransactions,
    totalAmount,
  };
}
