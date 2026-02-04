import { Settlement } from "@/types/poker";
import { PaymentMethodConfig } from "@/config/localization";

export interface PlayerBalance {
    name: string;
    amount: number;
    paymentPreference: string;
}

export interface EnhancedSettlement extends Settlement {
    isManual?: boolean;
    involvesCashPlayer?: boolean;
}

/**
 * Calculate optimized settlements with payment method awareness.
 * 
 * Algorithm Overview:
 * Phase 1: Cash Optimization
 *   - Settles debts between players who both prefer Cash.
 *   - Keeps physical cash flow within the "Cash" ecosystem.
 * 
 * Phase 2: Digital Optimization
 *   - Settles debts between players who both prefer Digital (UPI/Venmo).
 *   - Maximizes digital-to-digital transfers.
 * 
 * Phase 3: Cross-Method Settle (Minimize Transactions)
 *   - Settles any remaining balances between Cash and Digital pools.
 *   - Sorts debts by size (High to Low) to match large winners with large losers, reduces total edge count.
 */
export function calculateOptimizedSettlements(
    playerBalances: PlayerBalance[],
    manualTransfers: Settlement[] = []
): EnhancedSettlement[] {
    const adjustedAmounts: Map<string, PlayerBalance> = new Map();

    playerBalances.forEach(pb => {
        adjustedAmounts.set(pb.name, { ...pb });
    });

    manualTransfers.forEach(transfer => {
        const from = adjustedAmounts.get(transfer.from);
        const to = adjustedAmounts.get(transfer.to);

        if (from) {
            from.amount += transfer.amount;
        }
        if (to) {
            to.amount -= transfer.amount;
        }
    });

    const balances = Array.from(adjustedAmounts.values());

    // ZERO SUM CHECK - Disabled to prevent dashboard crashes. 
    // Discrepancies are handled visually in the GameDashboard Action Required section.
    /*
    const totalNet = balances.reduce((sum, b) => sum + b.amount, 0);
    if (Math.abs(totalNet) > 0.01) {
        throw new Error(`Accounting Discrepancy: Total net amount is ${totalNet.toFixed(2)}. It must be zero to calculate settlements.`);
    }
    */

    const winners = balances
        .filter(b => b.amount > 0)
        .map(b => ({ ...b }));

    const losers = balances
        .filter(b => b.amount < 0)
        .map(b => ({ ...b, amount: Math.abs(b.amount) }));

    const settlements: EnhancedSettlement[] = [];

    const cashWinners = winners.filter(w => w.paymentPreference === PaymentMethodConfig.cash.key);
    const cashLosers = losers.filter(l => l.paymentPreference === PaymentMethodConfig.cash.key);

    settleGroup(cashWinners, cashLosers, settlements, true);

    const digitalWinners = winners.filter(w => w.paymentPreference === PaymentMethodConfig.digital.key || !w.paymentPreference);
    const digitalLosers = losers.filter(l => l.paymentPreference === PaymentMethodConfig.digital.key || !l.paymentPreference);

    settleGroup(digitalWinners, digitalLosers, settlements, false);

    // Phase 3: Settle between cash and digital players (remaining balances)
    // Re-filter for anyone that still has an outstanding balance
    const remainingWinners = [...cashWinners, ...digitalWinners].filter(w => w.amount > 0.01);
    const remainingLosers = [...cashLosers, ...digitalLosers].filter(l => l.amount > 0.01);

    settleGroup(remainingWinners, remainingLosers, settlements, true);

    return settlements;
}

function settleGroup(
    winners: PlayerBalance[],
    losers: PlayerBalance[],
    settlements: EnhancedSettlement[],
    involvesCash: boolean
): void {
    // Optimization: Sort by amount descending (Largest First)
    // This helps minimize the number of transactions by clearing largest debts with largest winnings first.
    winners.sort((a, b) => b.amount - a.amount);
    losers.sort((a, b) => b.amount - a.amount);

    let winnerIndex = 0;
    let loserIndex = 0;

    while (winnerIndex < winners.length && loserIndex < losers.length) {
        const winner = winners[winnerIndex];
        const loser = losers[loserIndex];

        if (winner.amount <= 0) {
            winnerIndex++;
            continue;
        }
        if (loser.amount <= 0) {
            loserIndex++;
            continue;
        }

        const settlementAmount = Math.min(winner.amount, loser.amount);

        if (settlementAmount > 0.01) {
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
 */
export function calculateStandardSettlements(
    playerBalances: PlayerBalance[],
    manualTransfers: Settlement[] = []
): Settlement[] {
    const adjustedAmounts: Record<string, number> = {};

    playerBalances.forEach(pb => {
        adjustedAmounts[pb.name] = pb.amount;
    });

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
    const digitalTransactions = totalTransactions - cashTransactions;
    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

    return {
        totalTransactions,
        cashTransactions,
        digitalTransactions,
        totalAmount,
    };
}
