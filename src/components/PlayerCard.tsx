import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/types/poker";
import { Plus, Minus, DollarSign, TrendingUp, TrendingDown, Trophy, Target } from "lucide-react";

interface PlayerCardProps {
  gamePlayer: GamePlayer;
  buyInAmount: number;
  onUpdatePlayer: (gamePlayerId: string, updates: Partial<GamePlayer>) => void;
}

const PlayerCard = ({ gamePlayer, buyInAmount, onUpdatePlayer }: PlayerCardProps) => {
  const netAmount = gamePlayer.final_stack - (gamePlayer.buy_ins * buyInAmount);
  const isProfit = netAmount > 0;

  const updateBuyIns = (change: number) => {
    const newBuyIns = Math.max(1, gamePlayer.buy_ins + change);
    onUpdatePlayer(gamePlayer.id, { 
      buy_ins: newBuyIns,
      net_amount: gamePlayer.final_stack - (newBuyIns * buyInAmount)
    });
  };

  const updateFinalStack = (value: number) => {
    onUpdatePlayer(gamePlayer.id, { 
      final_stack: value,
      net_amount: value - (gamePlayer.buy_ins * buyInAmount)
    });
  };

  return (
    <Card className="bg-card border-border hover:border-poker-gold/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
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
                {gamePlayer.player.total_profit >= 0 ? '+' : ''}${gamePlayer.player.total_profit.toFixed(0)}
              </Badge>
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
                size="sm" 
                onClick={() => updateBuyIns(-1)}
                disabled={gamePlayer.buy_ins <= 1}
                className="w-8 h-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="font-semibold w-8 text-center">{gamePlayer.buy_ins}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateBuyIns(1)}
                className="w-8 h-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Final Stack ($)</span>
            <Input
              type="number"
              value={gamePlayer.final_stack}
              onChange={(e) => updateFinalStack(Number(e.target.value) || 0)}
              className="bg-input border-border text-center font-mono"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Invested:</span>
            <span className="font-semibold">${(gamePlayer.buy_ins * buyInAmount).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium">Net P&L:</span>
            <div className={`flex items-center gap-1 font-bold ${
              isProfit ? 'text-money-green' : 'text-money-red'
            }`}>
              <DollarSign className="w-4 h-4" />
              <span>
                {isProfit ? '+' : ''}${netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;