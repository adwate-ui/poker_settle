import { useMemo } from 'react';
import { UserPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardPlayerCard from "@/components/game/DashboardPlayerCard";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";
import { calculateOptimizedSettlements, PlayerBalance } from "@/features/finance/utils/settlementUtils";
import { PaymentMethodConfig } from "@/config/localization";

interface OverviewSlideProps {
    isMobile?: boolean;
}

const OverviewSlide = ({ isMobile }: OverviewSlideProps) => {
    const {
        game,
        gamePlayers,
        // showAddPlayer, // Not used directly in JSX except setShow
        setShowAddPlayer,
        showManualTransfer,
        setShowManualTransfer,
        newTransferFrom,
        setNewTransferFrom,
        newTransferTo,
        setNewTransferTo,
        newTransferAmount,
        setNewTransferAmount,
    } = useDashboardStore();

    const { addManualTransfer, handleDeleteManualTransfer } = useGameDashboardActions();

    const manualSettlements = game?.settlements || [];
    const buyInAmount = game?.buy_in_amount || 0;

    const optimizedSettlements = useMemo(() => {
        if (!gamePlayers.length) return [];

        const balances: PlayerBalance[] = gamePlayers.map(gp => ({
            name: gp.player.name,
            amount: gp.net_amount || 0,
            paymentPreference: gp.player.payment_preference || PaymentMethodConfig.digital.key
        }));

        return calculateOptimizedSettlements(balances, manualSettlements);
    }, [gamePlayers, manualSettlements]);

    return (
        <div className="px-4 pt-1 space-y-4 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-luxury text-foreground uppercase tracking-widest leading-none">Players ({gamePlayers.length})</h3>
                <Button
                    onClick={() => setShowAddPlayer(true)}
                    className="h-9 px-4 bg-accent/5 border border-border text-foreground text-label flex items-center"
                >
                    <UserPlus className="w-3.5 h-3.5 mr-2" />
                    Add
                </Button>
            </div>

            <div className="space-y-3">
                {[...gamePlayers].sort((a, b) => a.player.name.localeCompare(b.player.name)).map((gamePlayer) => (
                    <DashboardPlayerCard
                        key={gamePlayer.id}
                        gamePlayer={gamePlayer}
                        buyInAmount={buyInAmount}
                        isLiveGame={true}
                    />
                ))}
            </div>

            {/* Manual Adjustments Section */}
            <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-luxury text-muted-foreground uppercase tracking-widest">Manual Adjustments</h3>
                    {!showManualTransfer && (
                        <Button variant="ghost" size="sm" onClick={() => setShowManualTransfer(true)} className="h-6 px-2 text-2xs uppercase font-bold tracking-wider">
                            <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                    )}
                </div>

                {/* Add Manual Transfer Form (Inline) */}
                {showManualTransfer && (
                    <Card className="p-4 space-y-4 animate-in slide-in-from-right-4 duration-300 bg-accent/5 border-border">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-2xs uppercase tracking-wider text-muted-foreground">From</Label>
                                    <Select value={newTransferFrom} onValueChange={setNewTransferFrom}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gamePlayers.map(gp => (
                                                <SelectItem key={`from-${gp.id}`} value={gp.player.name}>{gp.player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-2xs uppercase tracking-wider text-muted-foreground">To</Label>
                                    <Select value={newTransferTo} onValueChange={setNewTransferTo}>
                                        <SelectTrigger className="h-8 text-xs">
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
                            <div className="space-y-1">
                                <Label className="text-2xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={newTransferAmount}
                                    onChange={(e) => setNewTransferAmount(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowManualTransfer(false)} className="flex-1 h-8 text-xs">Cancel</Button>
                            <Button size="sm" onClick={addManualTransfer} className="flex-1 h-8 text-xs bg-primary text-primary-foreground">Save</Button>
                        </div>
                    </Card>
                )}

                <div className="space-y-2">
                    {manualSettlements.map((transfer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-border">
                            <span className="text-2xs font-luxury text-foreground uppercase tracking-wide">
                                {transfer.from} pays {transfer.to}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="font-numbers text-xs text-foreground">{formatCurrency(transfer.amount)}</span>
                                <Button aria-label="Delete manual transfer" onClick={() => handleDeleteManualTransfer(index)} variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 pt-6">
                {optimizedSettlements.length > 0 && (
                    <div className="section-content p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className={cn(isMobile ? "h-8" : "")}>
                                    <TableHead className={cn("px-4", isMobile ? "h-8 px-2" : "h-9")}>From</TableHead>
                                    <TableHead className={cn("px-4", isMobile ? "h-8 px-2" : "h-9")}>To</TableHead>
                                    <TableHead className={cn("px-4", isMobile ? "h-8 px-2" : "h-9")}>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {optimizedSettlements.map((s, i) => (
                                    <TableRow key={i} className={cn("border-border hover:bg-transparent", isMobile ? "h-8" : "")}>
                                        <TableCell className={cn("font-medium truncate", isMobile ? "py-1 px-2" : "py-2 px-4")}>
                                            {s.from}
                                        </TableCell>
                                        <TableCell className={cn("font-medium truncate", isMobile ? "py-1 px-2" : "py-2 px-4")}>
                                            {s.to}
                                        </TableCell>
                                        <TableCell className={cn("font-medium font-numbers", isMobile ? "py-1 px-2" : "py-2 px-4")}>
                                            {formatCurrency(s.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverviewSlide;
