import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { TrendingUp, TrendingDown, Check } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  onUpdatePlayer: (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn?: boolean) => void;
  fetchBuyInHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

const PlayerCard = ({ gamePlayer, buyInAmount, onUpdatePlayer, fetchBuyInHistory }: PlayerCardProps) => {
  const [localFinalStack, setLocalFinalStack] = useState(gamePlayer.final_stack || 0);
  const [addBuyInsAmount, setAddBuyInsAmount] = useState<string>('');
  const [hasFinalStackChanges, setHasFinalStackChanges] = useState(false);
  
  const netAmount = (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount);
  const isProfit = netAmount > 0;

  const handleAddBuyIns = () => {
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
  };

  const handleFinalStackChange = (value: number) => {
    setLocalFinalStack(value);
    setHasFinalStackChanges(value !== (gamePlayer.final_stack || 0));
  };

  const confirmFinalStack = () => {
    onUpdatePlayer(gamePlayer.id, { 
      final_stack: localFinalStack,
      net_amount: localFinalStack - (gamePlayer.buy_ins * buyInAmount)
    });
    setHasFinalStackChanges(false);
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Current Buy-ins</span>
              <BuyInHistoryDialog 
                gamePlayerId={gamePlayer.id}
                playerName={gamePlayer.player.name}
                fetchHistory={fetchBuyInHistory}
              />
            </div>
            <div className="text-center font-semibold text-2xl sm:text-3xl text-primary">
              {gamePlayer.buy_ins}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Add Buy-ins (+ or -)</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                className="text-center font-mono text-sm sm:text-base"
                placeholder="e.g., 2 or -1"
              />
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAddBuyIns}
                disabled={!addBuyInsAmount || parseInt(addBuyInsAmount) === 0}
                className="shrink-0 touch-manipulation"
              >
                Add
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
              {hasFinalStackChanges && (
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