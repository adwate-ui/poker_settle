import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [localBuyIns, setLocalBuyIns] = useState(gamePlayer.buy_ins);
  const [hasFinalStackChanges, setHasFinalStackChanges] = useState(false);
  const [showBuyInConfirm, setShowBuyInConfirm] = useState(false);
  const [pendingBuyIns, setPendingBuyIns] = useState<number | null>(null);
  
  const netAmount = (gamePlayer.final_stack || 0) - (gamePlayer.buy_ins * buyInAmount);
  const isProfit = netAmount > 0;

  const handleBuyInsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 0 && numValue <= 100) {
      setLocalBuyIns(numValue);
      if (numValue !== gamePlayer.buy_ins) {
        setPendingBuyIns(numValue);
        setShowBuyInConfirm(true);
      }
    }
  };

  const confirmBuyInChange = () => {
    if (pendingBuyIns !== null) {
      onUpdatePlayer(gamePlayer.id, { 
        buy_ins: pendingBuyIns,
        net_amount: (gamePlayer.final_stack || 0) - (pendingBuyIns * buyInAmount)
      }, true); // Log this change
      setShowBuyInConfirm(false);
      setPendingBuyIns(null);
    }
  };

  const cancelBuyInChange = () => {
    setLocalBuyIns(gamePlayer.buy_ins);
    setShowBuyInConfirm(false);
    setPendingBuyIns(null);
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
              <span className="text-xs sm:text-sm text-muted-foreground">Buy-ins</span>
              <BuyInHistoryDialog 
                gamePlayerId={gamePlayer.id}
                playerName={gamePlayer.player.name}
                fetchHistory={fetchBuyInHistory}
              />
            </div>
            <Input
              type="number"
              min="1"
              max="100"
              value={localBuyIns}
              onChange={(e) => handleBuyInsChange(e.target.value)}
              className="text-center font-semibold text-base sm:text-lg"
            />
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

      <AlertDialog open={showBuyInConfirm} onOpenChange={setShowBuyInConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Buy-in Change</AlertDialogTitle>
            <AlertDialogDescription>
              Change buy-ins from <strong>{gamePlayer.buy_ins}</strong> to <strong>{pendingBuyIns}</strong> for {gamePlayer.player.name}?
              <br /><br />
              This will be recorded in the buy-in history log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBuyInChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBuyInChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PlayerCard;