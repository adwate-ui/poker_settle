import { useState, memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { TrendingUp, TrendingDown, Check, Coins, Wallet } from "lucide-react";
import { formatIndianNumber, parseIndianNumber, formatInputDisplay } from "@/lib/utils";
import { BuyInHistoryDialog } from "./BuyInHistoryDialog";
import OptimizedAvatar from "./OptimizedAvatar";

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
      <CardHeader className="pb-3 pt-3 px-3 space-y-0">
        <div className="flex items-start justify-between gap-2">
          {/* Left: Avatar and Player Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <OptimizedAvatar 
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-1 text-sm">
                <span className="truncate">{gamePlayer.player.name}</span>
                {isProfit ? (
                  <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
              </CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                  {gamePlayer.player.total_games}g
                </Badge>
                <Badge variant={gamePlayer.player.total_profit >= 0 ? "success" : "destructive"} className="text-[9px] h-3.5 px-1">
                  {gamePlayer.player.total_profit >= 0 ? '+' : ''}{formatIndianNumber(Math.abs(gamePlayer.player.total_profit))}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Right: Buy-ins and History */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs font-semibold">
              {gamePlayer.buy_ins}×
            </Badge>
            <BuyInHistoryDialog 
              gamePlayerId={gamePlayer.id}
              playerName={gamePlayer.player.name}
              fetchHistory={fetchBuyInHistory}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 px-3 space-y-2">
        {/* Compact Input Row - Buy-ins and Final Stack */}
        <div className="grid grid-cols-2 gap-2">
          {/* Add Buy-ins - Compact */}
          <div className="space-y-1">
            <Label className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              <span>Buy-ins</span>
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                className="h-7 text-xs text-center font-mono border-orange-300 dark:border-orange-800 bg-background"
                placeholder=""
              />
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAddBuyIns}
                disabled={!addBuyInsAmount || parseInt(addBuyInsAmount) === 0}
                className="h-7 px-2 shrink-0 bg-orange-600 hover:bg-orange-700 text-xs"
              >
                +
              </Button>
            </div>
          </div>

          {/* Final Stack - Compact */}
          <div className="space-y-1">
            <Label className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              <span>Stack (Rs.)</span>
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                className="h-7 text-xs text-center font-mono border-green-300 dark:border-green-800 bg-background"
                placeholder=""
              />
              {hasFinalStackChanges && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={confirmFinalStack}
                  className="h-7 w-7 shrink-0 p-0 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary - Compact */}
        <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total: Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          <span className={`font-bold ${
            isProfit 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isProfit ? '+' : ''}Rs. {formatIndianNumber(Math.abs(netAmount))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;