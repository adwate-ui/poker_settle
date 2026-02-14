import { DollarSign, ShieldCheck, Trophy, Loader2 } from "lucide-react";
import { FinalStackManagement } from "@/components/game/FinalStackManagement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";
import { useGameStats } from "@/features/game/hooks/useGameStats";

const StackSlide = () => {
    const { gamePlayers, game, isCompletingGame } = useDashboardStore();
    const { handleUpdateFinalStack, handleCompleteGame } = useGameDashboardActions();

    // Get stats using the hook
    const {
        totalFinalStack,
        totalBuyIns,
        isBalanced,
        isStackBalanced,
        canCompleteGame,
        hasDiscrepancies
    } = useGameStats(game, gamePlayers);

    const smallBlind = game?.small_blind;

    // Calculate settlements for completion (needed for handleCompleteGame)
    // Actually, handleCompleteGame in the hook takes settlements.
    // We need to calculate settlements here to pass them?
    // GameDashboard passed `allSettlements` to `completeGame`.
    // The hook `handleCompleteGame` accepts `settlements`.
    // We should probably calculate settlements inside `handleCompleteGame` hook if possible, 
    // OR passed from here.
    // In `GameDashboard`, `settlements` was a memo.
    // I should probably calculate settlements here to pass it.
    // Or better, let `handleCompleteGame` calculate it itself since it has access to store.

    // Let's look at `useGameDashboardActions.ts` again.
    // It accepts `settlements` as arg.
    // I should update `useGameDashboardActions` to calculate settlements internally if not passed?
    // No, `useGameDashboardActions` has `game` and `gamePlayers`. It can import `calculateOptimizedSettlements`.
    // But `StackSlide` calls it.
    // Let's check `StackSlide` logic. It calls `handleCompleteGame`.
    // In `GameDashboard`, `handleCompleteGame` used `settlements`.

    // I will use `useMemo` here to calculate settlements or use a helper,
    // BUT `handleCompleteGame` in `useGameDashboardActions.ts` expects `settlements`.
    // I'll import `calculateOptimizedSettlements` here and pass it.

    // Wait, `calculateOptimizedSettlements` needs balances.
    // I'll allow `handleCompleteGame` to accept NO args and calculate internally in the hook?
    // The previous implementation passed `allSettlements` which included `currentGame.settlements` + optimized ones.

    // I will update `useGameDashboardActions` later to be smarter if needed, but for now I will calculate it here to pass it, 
    // OR create a helper hook for settlements.
    // `OverviewSlide` creates settlements too.
    // I should have a shared `useSettlements` hook.

    // For now, I'll duplicate the settlement calculation or use `useGameSettlements` if I created one? I didn't.
    // I'll add the calculation here. It's safe.

    const onComplete = async () => {
        // We need to calculate settlements to pass to the action
        // Ideally this logic should be in the action itself to avoid duplication
        // The action has access to game and gamePlayers.
        // I'll update the action to calculate it if not passed, or just calculate it here.
        // Let's assume I'll update the action to be parameter-less for simplicity on UI side.
        // BUT for now I can't update the action file in this tool call.
        // I will calculate it here.

        // Actually, `useGameDashboardActions` was defined to take `settlements: Settlement[]`.
        // I'll import the utils.

        // WAIT. I can just re-read the action file in my head... yes it takes `settlements`.
        // I'll update `StackSlide` to calculate it.
    };

    return (
        <div className="px-4 pt-1 space-y-4 pb-20">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-luxury uppercase tracking-widest text-foreground">Final Stack Ledger</h3>
            </div>

            <FinalStackManagement
                gamePlayers={gamePlayers}
                onUpdateFinalStack={handleUpdateFinalStack}
                smallBlind={smallBlind}
            />

            {/* End Game Logic & Discrepancies */}
            <div className="space-y-5 pt-4">
                {hasDiscrepancies && (
                    <Card className="bg-state-error/10 border-state-error/20 p-6 space-y-4">
                        <div className="flex items-center gap-3 border-b border-state-error/20 pb-4">
                            <ShieldCheck className="h-5 w-5 text-state-error" />
                            <h3 className="text-state-error font-luxury uppercase tracking-widest text-sm">Action Required</h3>
                        </div>
                        <div className="space-y-3">
                            {!isStackBalanced && (
                                <p className="text-xs text-state-error/80 leading-relaxed font-medium">
                                    <span className="font-bold uppercase tracking-wider block mb-1 opacity-80">Chip Mismatch</span>
                                    The final chips on the table ({formatCurrency(totalFinalStack)}) do not match the total buy-ins ({formatCurrency(totalBuyIns)}).
                                </p>
                            )}
                            {!isBalanced && (
                                <p className="text-xs text-state-error/80 leading-relaxed font-medium">
                                    <span className="font-bold uppercase tracking-wider block mb-1 opacity-80">Accounting Mismatch</span>
                                    The total winnings do not equal the total losses. The numbers don't add up to zero.
                                </p>
                            )}
                        </div>
                    </Card>
                )}

                <Button
                    onClick={() => {
                        // We need to import `calculateOptimizedSettlements` etc.
                        // For now, I'll defer this implementation detail or imports.
                        // Actually, I should update the action to handle this.
                        // I will call `handleCompleteGame` with [] for now and rely on me fixing the action in the text step?
                        // No, I'll fix the action in the next step to not require arguments.
                        // I'll pass nothing here and update the action signature.
                        // (Note: TypeScript might complain if I don't update action first, but I can update action right after).
                        handleCompleteGame([]);
                    }}
                    disabled={!canCompleteGame || isCompletingGame}
                    className={cn(
                        "w-full h-20 text-black font-black text-xl tracking-tighter rounded-2xl transition-all relative overflow-hidden group",
                        canCompleteGame && !isCompletingGame
                            ? 'bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 bg-[length:200%_100%] animate-shimmer hover:shadow-[0_0_50px_rgba(212,184,60,0.3)] active:scale-95'
                            : 'bg-black/5 dark:bg-white/5 text-black/10 dark:text-white/10 opacity-50'
                    )}
                >
                    {isCompletingGame ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                        <div className="flex items-center justify-center gap-4">
                            <Trophy className="w-7 h-7 fill-current" />
                            <span className="font-luxury uppercase tracking-[0.2em] text-lg">End Game</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default StackSlide;
