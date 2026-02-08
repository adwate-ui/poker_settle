import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Minus, X, User, Coins, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorMessages } from '@/lib/errorUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { BuyInHistoryDialog } from '@/components/BuyInHistoryDialog';
import { ResponsiveName } from '@/components/ResponsiveName';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from '@/components/ui/card';

interface BuyInManagementTableProps {
  gamePlayers: GamePlayer[];
  buyInAmount: number;
  onAddBuyIn: (gamePlayerId: string, buyInsToAdd: number) => Promise<void>;
  fetchBuyInHistory?: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

export const BuyInManagementTable = ({
  gamePlayers,
  buyInAmount,
  onAddBuyIn,
  fetchBuyInHistory
}: BuyInManagementTableProps) => {
  const [opened, setOpened] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [buyInCount, setBuyInCount] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const isMobile = useIsMobile();

  const validateBuyInInput = (): { valid: boolean; player?: GamePlayer } => {
    if (!selectedPlayerId || typeof buyInCount !== 'number' || buyInCount === 0) {
      toast.error('Please select a player and valid amount');
      return { valid: false };
    }

    const selectedPlayer = gamePlayers.find(gp => gp.id === selectedPlayerId);
    if (!selectedPlayer) {
      toast.error('Player not found');
      return { valid: false };
    }

    return { valid: true, player: selectedPlayer };
  };

  const handleAddBuyIn = async () => {
    const validation = validateBuyInInput();
    if (!validation.valid || !validation.player) {
      return;
    }

    const selectedPlayer = validation.player;

    setIsAdding(true);
    try {
      await onAddBuyIn(selectedPlayerId, buyInCount);
      const action = buyInCount > 0 ? 'Added' : 'Removed';
      const count = Math.abs(buyInCount);
      toast.success(`${action} ${count} buy-in(s) for ${selectedPlayer.player.name}`);
      setOpened(false);
      setSelectedPlayerId('');
      setBuyInCount(1);
    } catch (error) {
      console.error('Error updating buy-ins:', error);
      toast.error(ErrorMessages.buyIn.update(error));
    } finally {
      setIsAdding(false);
    }
  };

  const sortedPlayers = [...gamePlayers].sort((a, b) =>
    a.player.name.localeCompare(b.player.name)
  );

  const selectedPlayer = gamePlayers.find(gp => gp.id === selectedPlayerId);

  const increment = () => setBuyInCount(prev => {
    const next = prev + 1;
    return next === 0 ? 1 : next;
  });

  const decrement = () => setBuyInCount(prev => {
    const next = prev - 1;
    return next === 0 ? -1 : next;
  });

  return (
    <>
      <Table
        className="max-h-[500px]"
        tableClassName="table-fixed sm:table-auto"
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-1/3">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                <span><span className="sm:inline hidden">Player</span><span className="sm:hidden inline">Plyr</span></span>
              </div>
            </TableHead>
            <TableHead className="w-1/6 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Coins className="h-3 w-3" />
                <span><span className="sm:inline hidden">Buy-ins</span><span className="sm:hidden inline">Buys</span></span>
              </div>
            </TableHead>
            <TableHead className="w-1/4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                <span><span className="sm:inline hidden">Amount</span><span className="sm:hidden inline">Amt</span></span>
              </div>
            </TableHead>
            <TableHead className="w-1/8">
            </TableHead>
            <TableHead className="w-1/8 text-right">
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((gamePlayer) => (
            <TableRow
              key={gamePlayer.id}
              className="border-border/50 h-11 sm:h-auto sm:group"
            >
              <TableCell className="font-medium truncate text-foreground">
                <ResponsiveName name={gamePlayer.player.name} />
              </TableCell>
              <TableCell className="text-center font-numbers whitespace-nowrap text-muted-foreground">
                {gamePlayer.buy_ins}
              </TableCell>
              <TableCell className="font-numbers whitespace-nowrap text-muted-foreground">
                {formatCurrency(gamePlayer.buy_ins * buyInAmount)}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  onClick={() => {
                    setSelectedPlayerId(gamePlayer.id);
                    setBuyInCount(1);
                    setOpened(true);
                  }}
                  variant="ghost"
                  size={isMobile ? "icon" : "icon-sm"}
                  aria-label={`Add buy-in for ${gamePlayer.player.name}`}
                  className="bg-transparent sm:h-9 sm:w-9 h-11 w-11 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <Plus className="sm:h-4 sm:w-4 h-5 w-5" />
                </Button>
              </TableCell>
              <TableCell className="text-right">
                {fetchBuyInHistory && (
                  <BuyInHistoryDialog
                    gamePlayerId={gamePlayer.id}
                    playerName={gamePlayer.player.name}
                    fetchHistory={fetchBuyInHistory}
                    triggerProps={{
                      size: isMobile ? "icon" : "icon-sm",
                      className: "sm:h-9 sm:w-9 h-11 w-11 text-muted-foreground hover:text-foreground transition-opacity"
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={opened} onOpenChange={(open) => {
        if (!open) {
          setOpened(false);
          setSelectedPlayerId('');
          setBuyInCount(1);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-card/20 border border-border/40">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <DialogTitle>Manage Buy-ins</DialogTitle>
                <DialogDescription>Player: {selectedPlayer?.player.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-10 space-y-8">
            <div className="flex flex-col items-center gap-8">
              <div className="flex items-center justify-center gap-8 w-full">
                <Button
                  variant="outline"
                  onClick={decrement}
                  className="h-16 w-16 rounded-2xl group transition-all"
                >
                  <Minus className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </Button>

                <div className="flex flex-col items-center min-w-[120px]">
                  <span className={cn(
                    "text-5xl font-bold transition-colors",
                    buyInCount < 0 ? 'text-destructive' : 'text-foreground'
                  )}>
                    {buyInCount > 0 ? `+${buyInCount}` : buyInCount}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                    {Math.abs(buyInCount) === 1 ? 'Buy-in' : 'Buy-ins'}
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={increment}
                  className="h-16 w-16 rounded-2xl group transition-all"
                >
                  <Plus className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </Button>
              </div>

              <Card
                variant="luxury"
                className={cn(
                  "p-6 w-full text-center transition-all duration-500",
                  buyInCount > 0 ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'
                )}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cost Impact</p>
                <p className={cn(
                  "text-3xl font-bold",
                  buyInCount > 0 ? 'text-primary' : 'text-destructive'
                )}>
                  {formatCurrency(Math.abs(buyInCount * buyInAmount))}
                </p>
              </Card>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setOpened(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBuyIn}
              disabled={isAdding || !selectedPlayerId || buyInCount === 0}
              variant={buyInCount < 0 ? "destructive" : "default"}
              className="flex-1"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{buyInCount > 0 ? 'Add Buy-in' : 'Remove Buy-in'}</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
