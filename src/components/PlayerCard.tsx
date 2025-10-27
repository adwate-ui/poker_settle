import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/types/poker";
import { Plus, Minus, TrendingUp, TrendingDown, Trophy, Target, Check } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  onUpdatePlayer: (gamePlayerId: string, updates: Partial<GamePlayer>) => void;
}

const PlayerCard = ({ gamePlayer, buyInAmount, onUpdatePlayer }: PlayerCardProps) => {
  const [localFinalStack, setLocalFinalStack] = useState(gamePlayer.final_stack);
  const [hasChanges, setHasChanges] = useState(false);
  
  const netAmount = gamePlayer.final_stack - (gamePlayer.buy_ins * buyInAmount);
  const isProfit = netAmount > 0;

  const updateBuyIns = (change: number) => {
    const newBuyIns = Math.max(1, gamePlayer.buy_ins + change);
    onUpdatePlayer(gamePlayer.id, { 
      buy_ins: newBuyIns,
      net_amount: gamePlayer.final_stack - (newBuyIns * buyInAmount)
    });
  };

  const handleFinalStackChange = (value: number) => {
    setLocalFinalStack(value);
    setHasChanges(value !== gamePlayer.final_stack);
  };

  const confirmFinalStack = () => {
    onUpdatePlayer(gamePlayer.id, { 
      final_stack: localFinalStack,
      net_amount: localFinalStack - (gamePlayer.buy_ins * buyInAmount)
    });
    setHasChanges(false);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors touch-manipulation">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(gamePlayer.player.name)}`}
                alt={gamePlayer.player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="truncate">{gamePlayer.player.name}</span>
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
              </CardTitle>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                <Badge variant="info" className="text-xs">
                  {gamePlayer.player.total_games} games
                </Badge>
                <Badge variant={gamePlayer.player.total_profit >= 0 ? "success" : "destructive"} className="text-xs">
                  {gamePlayer.player.total_profit >= 0 ? '+' : ''}Rs. {formatIndianNumber(Math.abs(gamePlayer.player.total_profit))}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Buy-ins</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateBuyIns(-1)}
                className="h-7 w-7 sm:h-8 sm:w-8 touch-manipulation"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="font-semibold text-base sm:text-lg w-7 sm:w-8 text-center">{gamePlayer.buy_ins}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateBuyIns(1)}
                className="h-7 w-7 sm:h-8 sm:w-8 touch-manipulation"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Final Stack (Rs.)</span>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                className="text-center font-mono text-sm sm:text-base"
                placeholder="Enter amount"
              />
              {hasChanges && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={confirmFinalStack}
                  className="shrink-0 touch-manipulation"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 sm:pt-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Buyin:</span>
            <span className="font-semibold text-sm sm:text-base">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">Net P&L:</span>
            <span className={`font-bold text-sm sm:text-base ${
              isProfit 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isProfit ? '+' : ''}Rs. {formatIndianNumber(Math.abs(netAmount))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;