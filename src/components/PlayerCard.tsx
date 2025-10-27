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
    <Card className="bg-card border-border hover:border-poker-gold/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(gamePlayer.player.name)}`}
                alt={gamePlayer.player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-poker-gold flex items-center gap-2">
                <span>{gamePlayer.player.name}</span>
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-money-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-money-red" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {gamePlayer.player.total_games} games
                </Badge>
                <Badge 
                  variant={gamePlayer.player.total_profit >= 0 ? "default" : "destructive"}
                  className="text-xs flex items-center gap-1"
                >
                  <Target className="w-3 h-3" />
                  {gamePlayer.player.total_profit >= 0 ? '+' : ''}Rs. {formatIndianNumber(Math.abs(gamePlayer.player.total_profit))}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Buy-ins</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateBuyIns(-1)}
                className="h-8 w-8"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-lg w-8 text-center">{gamePlayer.buy_ins}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateBuyIns(1)}
                className="h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Final Stack (Rs.)</span>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={formatInputDisplay(localFinalStack)}
                onChange={(e) => handleFinalStackChange(parseIndianNumber(e.target.value))}
                className="bg-input border-border text-center font-mono"
                placeholder="Enter amount"
              />
              {hasChanges && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={confirmFinalStack}
                  className="shrink-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Buyin:</span>
            <span className="font-semibold">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium">Net P&L:</span>
            <div className={`flex items-center gap-1 font-bold ${
              isProfit ? 'text-money-green' : 'text-money-red'
            }`}>
              <span>
                {isProfit ? '+' : ''}Rs. {formatIndianNumber(Math.abs(netAmount))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;