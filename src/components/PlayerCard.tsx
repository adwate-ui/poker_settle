import { useState, memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { TrendingUp, TrendingDown, Check, Coins, Wallet, History } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";

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
  const isProfit = netAmount > 0;

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

  return (
    <Card className="hover:border-primary/50 transition-colors touch-manipulation">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(gamePlayer.player.name)}`}
                alt={gamePlayer.player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
                <span className="truncate">{gamePlayer.player.name}</span>
                {isProfit ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
              </CardTitle>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {gamePlayer.player.total_games}g
                </Badge>
                <Badge variant={gamePlayer.player.total_profit >= 0 ? "success" : "destructive"} className="text-[10px] h-4 px-1">
                  {gamePlayer.player.total_profit >= 0 ? '+' : ''}{formatIndianNumber(Math.abs(gamePlayer.player.total_profit))}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs font-semibold">
              {gamePlayer.buy_ins} buy-ins
            </Badge>
            <BuyInHistoryDialog 
              gamePlayerId={gamePlayer.id}
              playerName={gamePlayer.player.name}
              fetchHistory={fetchBuyInHistory}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2.5">
        {/* Add Buy-ins Input - Orange Theme */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Add Buy-ins</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50">
            <Input
              type="number"
              value={addBuyInsAmount}
              onChange={(e) => setAddBuyInsAmount(e.target.value)}
              className="h-8 text-center font-mono text-sm border-orange-300 dark:border-orange-800 bg-background focus-visible:ring-orange-500"
              placeholder="+2 or -1"
            />
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleAddBuyIns}
              disabled={!addBuyInsAmount || parseInt(addBuyInsAmount) === 0}
              className="h-8 shrink-0 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Final Stack Input - Green Theme */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Final Stack (Rs.)</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50">
            <Input
              type="text"
              value={formatInputDisplay(localFinalStack)}
              onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
              className="h-8 text-center font-mono text-sm border-green-300 dark:border-green-800 bg-background focus-visible:ring-green-500"
              placeholder="0"
            />
            {hasFinalStackChanges && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={confirmFinalStack}
                className="h-8 w-8 shrink-0 p-0 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Buyin:</span>
            <span className="font-semibold text-xs sm:text-sm">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Net P&L:</span>
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
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;