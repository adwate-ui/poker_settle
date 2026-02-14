import { useMemo } from 'react';
import { Game, GamePlayer, Settlement } from '@/types/poker';
import { calculateOptimizedSettlements, PlayerBalance } from '@/features/finance/utils/settlementUtils';
import { PaymentMethodConfig } from '@/config/localization';

export const useGameStats = (game: Game | null, gamePlayers: GamePlayer[]) => {
    const buyInAmount = game?.buy_in_amount || 0;
    const manualSettlements = game?.settlements || [];

    const totalBuyIns = useMemo(() =>
        gamePlayers.reduce((sum, gp) => sum + (gp.buy_ins * buyInAmount), 0),
        [gamePlayers, buyInAmount]
    );

    const totalWinnings = useMemo(() =>
        gamePlayers.reduce((sum, gp) => sum + Math.max(0, Math.round(gp.net_amount || 0)), 0),
        [gamePlayers]
    );

    const totalLosses = useMemo(() =>
        gamePlayers.reduce((sum, gp) => sum + Math.min(0, Math.round(gp.net_amount || 0)), 0),
        [gamePlayers]
    );

    const totalFinalStack = useMemo(() =>
        gamePlayers.reduce((sum, gp) => sum + (gp.final_stack || 0), 0),
        [gamePlayers]
    );

    const isBalanced = useMemo(() =>
        Math.abs(Math.round(totalWinnings + totalLosses)) === 0,
        [totalWinnings, totalLosses]
    );

    const isStackBalanced = useMemo(() =>
        Math.abs(Math.round(totalFinalStack - totalBuyIns)) === 0,
        [totalFinalStack, totalBuyIns]
    );

    const canCompleteGame = useMemo(() =>
        isBalanced && isStackBalanced,
        [isBalanced, isStackBalanced]
    );

    const hasDiscrepancies = useMemo(() =>
        !isBalanced || !isStackBalanced,
        [isBalanced, isStackBalanced]
    );

    const optimizedSettlements = useMemo(() => {
        if (!gamePlayers.length) return [];

        const balances: PlayerBalance[] = gamePlayers.map(gp => ({
            name: gp.player.name,
            amount: gp.net_amount || 0,
            paymentPreference: gp.player.payment_preference || PaymentMethodConfig.digital.key
        }));

        return calculateOptimizedSettlements(balances, manualSettlements);
    }, [gamePlayers, manualSettlements]);

    const finalSettlements = useMemo(() =>
        [...manualSettlements, ...optimizedSettlements],
        [manualSettlements, optimizedSettlements]
    );

    return {
        totalBuyIns,
        totalWinnings,
        totalLosses,
        totalFinalStack,
        isBalanced,
        isStackBalanced,
        canCompleteGame,
        hasDiscrepancies,
        optimizedSettlements,
        finalSettlements
    };
};

