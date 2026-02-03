import { useState, memo, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { Check, Plus, History, User, Coins, TrendingUp } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay, formatProfitLoss, cn } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";
import OptimizedAvatar from "./OptimizedAvatar";
import { GlassCard } from "./ui/GlassCard";
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
    <GlassCard className="p-4 transition-all duration-300 hover:scale-[1.01] touch-manipulation border-white/5 bg-black/40 group overflow-hidden relative">
      {/* Status accent */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-30",
        profitLossStatus === 'profit' ? 'bg-green-500' : profitLossStatus === 'loss' ? 'bg-red-500' : 'bg-gold-500/20'
      )} />

      <div className="space-y-4">
        {/* Header: Avatar, Player Name, Buy-ins Badge, and History Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <OptimizedAvatar
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0 border border-white/10"
            />
            <div className="min-w-0">
              <h4 className="font-luxury text-sm font-bold text-gold-100 uppercase tracking-widest truncate">
                {gamePlayer.player.name}
              </h4>
              <p className="text-[9px] font-luxury text-gold-500/40 uppercase tracking-tighter">Verified Participant</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="bg-gold-500/5 text-gold-400 font-numbers border-gold-500/20 h-6 px-2 text-[10px]">
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
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
          {/* Add Buy-ins Area */}
          <div className="space-y-2">
            <Label className="text-[9px] uppercase font-luxury tracking-[0.2em] text-white/30 ml-0.5">Increment Stake</Label>
            <div className="flex gap-1.5 h-9">
              <Input
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-white/5 border-0 border-b border-white/10 rounded-none h-full text-center font-numbers text-sm text-gold-100 focus-visible:ring-0 focus-visible:border-gold-500 transition-all"
              />
              {addBuyInsAmount && Number(addBuyInsAmount) > 0 && (
                <Button
                  size="icon"
                  onClick={handleAddBuyIns}
                  className="w-9 h-9 bg-gold-600 hover:bg-gold-500 text-black border-0 rounded-md shrink-0 transition-transform active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Final Stack Area */}
          <div className="space-y-2">
            <Label className="text-[9px] uppercase font-luxury tracking-[0.2em] text-white/30 ml-0.5">Final Liquidity</Label>
            <div className="flex gap-1.5 h-9">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                placeholder="0"
                className="flex-1 bg-white/5 border-0 border-b border-white/10 rounded-none h-full text-center font-numbers text-sm text-gold-100 focus-visible:ring-0 focus-visible:border-gold-500 transition-all"
              />
              {hasFinalStackChanges && (
                <Button
                  size="icon"
                  onClick={confirmFinalStack}
                  className="w-9 h-9 bg-green-600 hover:bg-green-500 text-white border-0 shadow-lg shadow-green-900/20 rounded-md shrink-0 transition-transform animate-in zoom-in-50 duration-200"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Valuation Summary */}
        <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] uppercase font-luxury tracking-widest text-white/20">Archive Commitment</span>
            <span className="font-numbers text-[11px] text-white/60">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] uppercase font-luxury tracking-widest text-white/20">Protocol Valuation</span>
            <Badge
              variant="outline"
              className={cn(
                "font-numbers px-2.5 py-0.5 border-0 border-b-2 rounded-none h-auto text-[11px]",
                profitLossStatus === 'profit' ? 'text-green-400 border-green-500/30 bg-green-500/5' :
                  profitLossStatus === 'loss' ? 'text-red-400 border-red-500/30 bg-red-500/5' :
                    'text-gray-400 border-gray-500/30 bg-gray-500/5'
              )}
            >
              {formatProfitLoss(netAmount)}
            </Badge>
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;