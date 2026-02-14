import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/types/poker";
import { formatProfitLoss, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import OptimizedAvatar from "@/components/player/OptimizedAvatar";
import { Card } from "@/components/ui/card";
import { Wallet, Coins } from "lucide-react";

interface DashboardPlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  isLiveGame?: boolean;
}

const DashboardPlayerCard = memo(({ gamePlayer, buyInAmount, isLiveGame: _isLiveGame = false }: DashboardPlayerCardProps) => {
  const netAmount = useMemo(() =>
    (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount),
    [gamePlayer.final_stack, gamePlayer.buy_ins, buyInAmount]
  );
  const totalBuyIns = gamePlayer.buy_ins * buyInAmount;
  const finalStack = gamePlayer.final_stack || 0;

  const profitLossStatus = netAmount > 0 ? 'profit' : netAmount < 0 ? 'loss' : 'neutral';

  return (
    <Card className="p-4 transition-all duration-300 hover:scale-[1.01] touch-manipulation border-border/50 bg-card/60 group overflow-hidden relative">
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-30",
        profitLossStatus === 'profit' ? 'bg-state-success' : profitLossStatus === 'loss' ? 'bg-state-error' : 'bg-primary/20'
      )} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <OptimizedAvatar
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0 border border-border"
            />
            <div className="min-w-0">
              <Link
                to={gamePlayer.player.id ? `/players/${gamePlayer.player.id}` : '#'}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all font-luxury text-sm font-bold text-foreground uppercase tracking-widest truncate block"
              >
                {gamePlayer.player.name}
              </Link>
              <p className="text-3xs font-luxury text-muted-foreground uppercase tracking-widest">Player Details</p>
            </div>
          </div>
          <Badge variant="stats">
            {gamePlayer.buy_ins} BUY-IN{gamePlayer.buy_ins !== 1 ? 'S' : ''}
          </Badge>
        </div>

        {/* Asset Details */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="space-y-1">
            <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Total Buy-in</p>
            <p className="font-numbers text-sm text-muted-foreground">{formatCurrency(totalBuyIns)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground flex items-center justify-end gap-1.5"><Coins className="h-3 w-3" /> Final Stack</p>
            <p className="font-numbers text-sm text-muted-foreground">{formatCurrency(finalStack)}</p>
          </div>
        </div>

        {/* P&L Result */}
        <div className="pt-3 border-t border-border flex justify-between items-center px-1">
          <span className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">Net P&L</span>
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
