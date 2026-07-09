import { DollarSign, ShieldCheck, Trophy, Loader2, Trash2, Plus } from "lucide-react";
import { FinalStackManagement } from "@/components/game/FinalStackManagement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency, formatIndianNumber } from "@/utils/currencyUtils";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";
import { useGameStats } from "@/features/game/hooks/useGameStats";

const StackSlide = () => {
    const {
        gamePlayers,
        game,
        isCompletingGame,
        showManualTransfer,
        setShowManualTransfer,
        newTransferFrom,
        setNewTransferFrom,
        newTransferTo,
        setNewTransferTo,
        newTransferAmount,
        setNewTransferAmount
    } = useDashboardStore();
    const { handleUpdateFinalStack, handleCompleteGame, addManualTransfer, handleDeleteManualTransfer } = useGameDashboardActions();

    const manualSettlements = game?.settlements || [];

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

            {/* Manual Adjustments Section - Only show when End Game is available */}
            {canCompleteGame && !hasDiscrepancies && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                    {!showManualTransfer && (
                        <Button
                            onClick={() => setShowManualTransfer(true)}
                            className="w-full h-14 font-bold text-lg tracking-[0.2em] relative overflow-hidden group bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:shadow-glow active:scale-95 transition-all text-black uppercase font-luxury"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Add Adjustment
                        </Button>
                    )}

                {/* List of Manual Settlements */}
                <div className="space-y-2">
                    {manualSettlements.map((transfer, index) => (
                        <Card key={index} className="p-3 flex justify-between items-center bg-accent/5 border-border/50">
                            <span className="text-xs font-luxury text-foreground uppercase tracking-wide">
                                <span className="text-primary">{transfer.from}</span> pays <span className="text-primary">{transfer.to}</span>
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="font-numbers text-sm text-foreground">{formatCurrency(transfer.amount)}</span>
                                <Button
                                    aria-label="Delete manual transfer"
                                    onClick={() => handleDeleteManualTransfer(index)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Add Manual Transfer Form */}
                {showManualTransfer && (
                    <Card className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300 bg-accent/5 border-border">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
                                    <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                                        <SelectTrigger className="h-12 text-sm bg-background/50 border-border/50">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gamePlayers.map(gp => (
                                                <SelectItem key={`from-${gp.id}`} value={gp.player.name}>{gp.player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
                                    <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                                        <SelectTrigger className="h-12 text-sm bg-background/50 border-border/50">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gamePlayers.map(gp => (
                                                <SelectItem key={`to-${gp.id}`} value={gp.player.name}>{gp.player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={newTransferAmount}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/,/g, '');
                                        if (raw === '' || !isNaN(Number(raw))) {
                                            setNewTransferAmount(raw === '' ? '' : formatIndianNumber(Number(raw)));
                                        }
                                    }}
                                    className="h-12 text-sm bg-background/50 border-border/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setShowManualTransfer(false)} className="flex-1 h-12 text-sm font-luxury uppercase tracking-wider">Cancel</Button>
                            <Button onClick={addManualTransfer} className="flex-1 h-12 text-sm font-luxury uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                        </div>
                    </Card>
                )}
                </div>
            )}

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
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-state-error/80 block">Chip Mismatch</span>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-state-error/80 font-medium">
                                            <span>Final Chips</span>
                                            <span className="font-numbers">{formatCurrency(totalFinalStack)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-state-error/80 font-medium">
                                            <span>Total Buy-ins</span>
                                            <span className="font-numbers">{formatCurrency(totalBuyIns)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-state-error font-bold border-t border-state-error/20 pt-1.5">
                                            <span>Difference</span>
                                            <span className="font-numbers">{formatCurrency(Math.abs(totalFinalStack - totalBuyIns))}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}



                <Button
                    onClick={() => {
                        handleCompleteGame([]);
                    }}
                    disabled={!canCompleteGame || isCompletingGame}
                    className={cn(
                        "w-full h-14 text-black font-bold text-lg tracking-[0.2em] transition-all relative overflow-hidden group",
                        canCompleteGame && !isCompletingGame
                            ? 'bg-gradient-to-r from-primary via-accent to-primary hover:shadow-glow active:scale-95'
                            : 'bg-muted text-muted-foreground opacity-50'
                    )}
                >
                    {isCompletingGame ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
                        <div className="flex items-center justify-center gap-3">
                            <Trophy className="w-5 h-5 fill-current" />
                            <span className="font-luxury uppercase text-lg">End Game</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default StackSlide;
