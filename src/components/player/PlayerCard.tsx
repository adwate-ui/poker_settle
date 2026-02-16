import { useState, memo, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { Check, Plus } from "lucide-react";
import { parseIndianNumber, formatInputDisplay, formatProfitLoss, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { BuyInHistoryDialog } from "@/components/game/BuyInHistoryDialog";
import OptimizedAvatar from "./OptimizedAvatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  onUpdatePlayer: (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn?: boolean) => void;
  fetchBuyInHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

const PlayerCard = memo(({ gamePlayer, buyInAmount, onUpdatePlayer, fetchBuyInHistory }: PlayerCardProps) => {
  const [localFinalStack, setLocalFinalStack] = useState(gamePlayer.final_stack || 0);
  const [addBuyInsAmount, setAddBuyInsAmount] = useState<string>('');
  const [hasFinalStackChanges, setHasFinalStackChanges] = useState(false);

  const netAmount = useMemo(() =>
    (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount),
    [gamePlayer.final_stack, gamePlayer.buy_ins, buyInAmount]
  );

  const handleAddBuyIns = useCallback(() => {
    const numToAdd = parseInt(addBuyInsAmount) || 0;
    if (numToAdd === 0) {
      return;
    }
    const newTotal = gamePlayer.buy_ins + numToAdd;
    if (newTotal < 1) {
      return; // Prevent going below 1 buy-in total
    }
    if (Math.abs(numToAdd) > 50) {
      return;
    }

    onUpdatePlayer(gamePlayer.id, {
      buy_ins: newTotal,
      net_amount: (gamePlayer.final_stack || 0) - (newTotal * buyInAmount)
    }, true); // Log this change
    setAddBuyInsAmount('');
  }, [addBuyInsAmount, gamePlayer.id, gamePlayer.buy_ins, gamePlayer.final_stack, buyInAmount, onUpdatePlayer]);

  const handleFinalStackChange = useCallback((value: number) => {
    setLocalFinalStack(value);
    setHasFinalStackChanges(value !== (gamePlayer.final_stack || 0));
  }, [gamePlayer.final_stack]);

  const confirmFinalStack = useCallback(() => {
    onUpdatePlayer(gamePlayer.id, {
      final_stack: localFinalStack,
      net_amount: localFinalStack - (gamePlayer.buy_ins * buyInAmount)
    });
    setHasFinalStackChanges(false);
  }, [gamePlayer.id, gamePlayer.buy_ins, localFinalStack, buyInAmount, onUpdatePlayer]);

  const profitLossStatus = netAmount > 0 ? 'profit' : netAmount < 0 ? 'loss' : 'neutral';

  return (
    <Card className="p-4 transition-all duration-300 hover:scale-105 touch-manipulation glass-panel group overflow-hidden relative border-0">
      {/* Status accent */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-30",
        profitLossStatus === 'profit' ? 'bg-money-green' : profitLossStatus === 'loss' ? 'bg-money-red' : 'bg-primary/20'
      )} />

      <div className="space-y-4">
        {/* Header: Avatar, Player Name, Buy-ins Badge, and History Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <OptimizedAvatar
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0 border border-border"
            />
            <div className="min-w-0">
              <h4 className="font-luxury text-sm font-bold text-foreground uppercase tracking-widest truncate">
                {gamePlayer.player.name}
              </h4>
              <p className="text-3xs font-luxury text-muted-foreground/60 uppercase tracking-tighter">Verified Player</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="bg-primary/5 text-primary font-numbers border-primary/20 h-6 px-2 text-2xs">
              {gamePlayer.buy_ins} UNIT{gamePlayer.buy_ins !== 1 ? 'S' : ''}
            </Badge>
            <BuyInHistoryDialog
              gamePlayerId={gamePlayer.id}
              playerName={gamePlayer.player.name}
              fetchHistory={fetchBuyInHistory}
            />
          </div>
        </div>

        {/* Action Row: Buy-ins and Final Stack */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Add Buy-ins Area */}
          <div className="space-y-2">
            <Label className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">Add Buy-in</Label>
            <div className="flex gap-1.5 h-9">
              <Input
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-muted/30 border-0 border-b border-border h-full text-center font-numbers text-sm text-foreground focus-visible:ring-0 focus-visible:border-primary transition-all"
              />
              {addBuyInsAmount && Number(addBuyInsAmount) > 0 && (
                <Button
                  size="icon"
                  onClick={handleAddBuyIns}
                  className="w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-md shrink-0 transition-transform active:scale-90"
                  aria-label="Add buy-in"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Final Stack Area */}
          <div className="space-y-2">
            <Label className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">Final Stack</Label>
            <div className="flex gap-1.5 h-9">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                placeholder="0"
                className="flex-1 bg-muted/30 border-0 border-b border-border h-full text-center font-numbers text-sm text-foreground focus-visible:ring-0 focus-visible:border-primary transition-all"
              />
              {hasFinalStackChanges && (
                <Button
                  size="icon"
                  onClick={confirmFinalStack}
                  className="w-9 h-9 bg-money-green hover:opacity-90 text-white border-0 shadow-lg shadow-money-green/20 rounded-md shrink-0 transition-transform animate-in zoom-in-50 duration-200"
                  aria-label="Confirm final stack"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profit/Loss Summary */}
        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">Total Buy-ins</span>
            <span className="font-numbers text-2xs text-muted-foreground">{formatCurrency(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">Net Profit/Loss</span>
            <Badge
              variant={profitLossStatus === 'profit' ? 'profit' : profitLossStatus === 'loss' ? 'loss' : 'default'}
            >
              {formatProfitLoss(netAmount)}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
