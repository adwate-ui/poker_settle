import { useState, memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { Check } from "lucide-react";
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
      <CardHeader className="pb-2 pt-2 px-3 space-y-0">
        <div className="flex items-start justify-between gap-2">
          {/* Left: Avatar and Player Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <OptimizedAvatar 
              name={gamePlayer.player.name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm truncate">{gamePlayer.player.name}</CardTitle>
            </div>
          </div>
          
          {/* Right: Buy-in History Button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <BuyInHistoryDialog 
              gamePlayerId={gamePlayer.id}
              playerName={gamePlayer.player.name}
              fetchHistory={fetchBuyInHistory}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-2 px-3 space-y-2">
        {/* Buy-ins and Final Stack Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Buy-ins Input */}
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground">
              Add Buy-ins
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={addBuyInsAmount}
                onChange={(e) => setAddBuyInsAmount(e.target.value)}
                className="h-7 text-xs text-center font-mono bg-background"
                placeholder="0"
              />
              {addBuyInsAmount && Number(addBuyInsAmount) > 0 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleAddBuyIns}
                  className="h-7 px-2 shrink-0 text-xs"
                >
                  +
                </Button>
              )}
            </div>
          </div>

          {/* Final Stack Input */}
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground">
              Final Stack (Rs.)
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                className="h-7 text-xs text-center font-mono bg-background"
                placeholder="0"
              />
              {hasFinalStackChanges && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={confirmFinalStack}
                  className="h-7 w-7 shrink-0 p-0"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Row - Clearly labeled */}
        <div className="pt-2 border-t border-border space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Total Buy-ins:</span>
            <span className="font-semibold">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Net P&L:</span>
            <span className={`font-bold ${
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