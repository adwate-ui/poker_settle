import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/types/poker";
import { formatIndianNumber, formatProfitLoss } from "@/lib/utils";
import OptimizedAvatar from "./OptimizedAvatar";

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

  // Determine profit/loss color class
  const getProfitLossClass = (amount: number) => {
    if (!Number.isFinite(amount)) return "bg-red-600 hover:bg-red-700 text-white border-transparent";
    return amount >= 0 
      ? "bg-green-600 hover:bg-green-700 text-white border-transparent" 
      : "bg-red-600 hover:bg-red-700 text-white border-transparent";
  };

  return (
    <Card className="shadow-sm p-4 h-full border-2 border-gray-200 dark:border-gray-800">
      <div className="flex flex-col gap-3">
        {/* Player Header */}
        <div className="flex justify-between flex-nowrap">
          <div className="flex gap-3 flex-1 min-w-0 items-center">
            <div className="flex-shrink-0">
              <OptimizedAvatar 
                name={gamePlayer.player.name}
                size="sm"
              />
            </div>
            <span 
              className="font-bold text-base overflow-hidden text-ellipsis whitespace-nowrap text-foreground"
            >
              {gamePlayer.player.name}
            </span>
          </div>
        </div>

        {/* Buy-ins Info */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Buy-ins</span>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border-0">
              {gamePlayer.buy_ins}
            </Badge>
            <span className="font-semibold text-sm">Rs. {formatIndianNumber(totalBuyIns)}</span>
          </div>
        </div>

        {/* Final Stack */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Stack</span>
          <span className="font-semibold text-sm">Rs. {formatIndianNumber(finalStack)}</span>
        </div>

        {/* Net P&L */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
          <span className="text-sm font-semibold">Final P&L</span>
          <Badge 
            className={`${getProfitLossClass(netAmount)} text-sm px-2.5 py-0.5`}
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
