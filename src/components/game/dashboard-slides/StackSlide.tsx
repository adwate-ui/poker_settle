import { DollarSign, ShieldCheck, Trophy, Loader2 } from "lucide-react";
import { GamePlayer } from "@/types/poker";
import { FinalStackManagement } from "@/components/game/FinalStackManagement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";

interface StackSlideProps {
    gamePlayers: GamePlayer[];
    handleUpdateFinalStack: (gamePlayerId: string, finalStack: number) => Promise<void>;
    smallBlind?: number;
    hasDiscrepancies: boolean;
    isStackBalanced: boolean;
    isBalanced: boolean;
    totalFinalStack: number;
    totalBuyIns: number;
    handleCompleteGame: () => Promise<void>;
    canCompleteGame: boolean;
    isCompletingGame: boolean;
}

const StackSlide = ({
    gamePlayers,
    handleUpdateFinalStack,
    smallBlind,
    hasDiscrepancies,
    isStackBalanced,
    isBalanced,
    totalFinalStack,
    totalBuyIns,
    handleCompleteGame,
    canCompleteGame,
    isCompletingGame,
}: StackSlideProps) => {
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
                    onClick={handleCompleteGame}
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
