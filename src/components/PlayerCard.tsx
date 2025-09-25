import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Player } from "@/types/poker";
import { Minus, Plus } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  buyInAmount: number;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
}

const PlayerCard = ({ player, buyInAmount, onUpdatePlayer }: PlayerCardProps) => {
  const updateBuyIns = (delta: number) => {
    const newBuyIns = Math.max(0, player.buyIns + delta);
    onUpdatePlayer(player.id, { buyIns: newBuyIns });
  };

  const updateFinalStack = (value: string) => {
    const finalStack = parseFloat(value) || 0;
    onUpdatePlayer(player.id, { finalStack });
  };

  const totalInvested = player.buyIns * buyInAmount;
  const netAmount = player.finalStack - totalInvested;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-foreground">{player.name}</h3>
          <div className={`text-lg font-bold ${netAmount >= 0 ? 'text-money-green' : 'text-money-red'}`}>
            {netAmount >= 0 ? '+' : ''}${netAmount.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Buy-ins</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBuyIns(-1)}
                disabled={player.buyIns <= 0}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-center font-mono text-lg w-8">{player.buyIns}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBuyIns(1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: ${totalInvested}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`stack-${player.id}`} className="text-sm text-muted-foreground">
              Final Stack ($)
            </Label>
            <Input
              id={`stack-${player.id}`}
              type="number"
              value={player.finalStack || ''}
              onChange={(e) => updateFinalStack(e.target.value)}
              placeholder="0"
              className="bg-input border-border font-mono"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Invested: ${totalInvested} | Final: ${player.finalStack}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;