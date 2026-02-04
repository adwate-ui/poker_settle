import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/types/poker";
import { formatIndianNumber, formatProfitLoss, cn } from "@/lib/utils";
import OptimizedAvatar from "./OptimizedAvatar";
import { Card } from "@/components/ui/card";
import { User, Wallet, Coins } from "lucide-react";

interface DashboardPlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  isLiveGame?: boolean;
}

const DashboardPlayerCard = memo(({ gamePlayer, buyInAmount, isLiveGame = false }: DashboardPlayerCardProps) => {
  const netAmount = useMemo(() =>
    (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount),
    [gamePlayer.final_stack, gamePlayer.buy_ins, buyInAmount]
  );
  const totalBuyIns = gamePlayer.buy_ins * buyInAmount;
  const finalStack = gamePlayer.final_stack || 0;

  const profitLossStatus = netAmount > 0 ? 'profit' : netAmount < 0 ? 'loss' : 'neutral';

  return (
    <Card className="p-4 transition-all duration-300 hover:scale-[1.01] touch-manipulation border-white/5 bg-black/40 group overflow-hidden relative">
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-30",
        profitLossStatus === 'profit' ? 'bg-green-500' : profitLossStatus === 'loss' ? 'bg-red-500' : 'bg-gold-500/20'
      )} />

      <div className="space-y-4">
        {/* Header */}
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
              <p className="text-[9px] font-luxury text-gold-500/40 uppercase tracking-tighter">Participant Portfolio</p>
            </div>
          </div>
          <Badge variant="stats">
            {gamePlayer.buy_ins} UNIT{gamePlayer.buy_ins !== 1 ? 'S' : ''}
          </Badge>
        </div>

        {/* Asset Details */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-luxury tracking-widest text-white/20 flex items-center gap-1.5"><Wallet className="h-2.5 w-2.5" /> Total Stake</p>
            <p className="font-numbers text-sm text-gold-100/60">Rs. {formatIndianNumber(totalBuyIns)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] uppercase font-luxury tracking-widest text-white/20 flex items-center justify-end gap-1.5"><Coins className="h-2.5 w-2.5" /> Total Assets</p>
            <p className="font-numbers text-sm text-gold-100/60">Rs. {formatIndianNumber(finalStack)}</p>
          </div>
        </div>

        {/* P&L Result */}
        <div className="pt-3 border-t border-white/5 flex justify-between items-center px-1">
          <span className="text-[9px] uppercase font-luxury tracking-widest text-white/20">Executive P&L</span>
          <Badge
            variant={profitLossStatus === 'profit' ? 'profit' : profitLossStatus === 'loss' ? 'loss' : 'default'}
          >
            {formatProfitLoss(netAmount)}
          </Badge>
        </div>
      </div>
    </Card>
  );
});

DashboardPlayerCard.displayName = 'DashboardPlayerCard';

export default DashboardPlayerCard;
