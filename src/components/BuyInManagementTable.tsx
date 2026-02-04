import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Minus, X, User, Coins, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorMessages } from '@/lib/errorUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { useIsMobile } from '@/hooks/useIsMobile';
import { BuyInHistoryDialog } from '@/components/BuyInHistoryDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const isMobile = useIsMobile();

  // Helper function to abbreviate names for mobile
  const getDisplayName = (name: string, isMobile: boolean) => {
    if (!name) return '';
    if (!isMobile) return name;

    // If name is already short, keep it
    if (name.length <= 10) return name;

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return name.substring(0, 10);
    }

    // Format: First Name + Last Initial (e.g., "John D.")
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    const formatted = `${firstName} ${lastInitial}.`;

    return formatted.length > 10 ? formatted.substring(0, 7) + "..." : formatted;
  };

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
      <div className="rounded-md border max-h-[500px] overflow-auto">
        <div className="overflow-x-auto w-full">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className={cn("pl-6 w-[40%]", isMobile && "pl-2 text-mobile-compact uppercase font-bold")}>
                  {isMobile ? "Plyr" : "Player"}
                </TableHead>
                <TableHead className={cn("w-[20%]", isMobile && "px-1 text-mobile-compact uppercase font-bold text-center")}>
                  {isMobile ? "Buys" : "Buy-ins"}
                </TableHead>
                <TableHead className={cn("w-[20%]", isMobile && "px-1 text-mobile-compact uppercase font-bold")}>
                  {isMobile ? "Amt" : "Amount"}
                </TableHead>
                <TableHead className={cn("text-right pr-6 w-[20%]", isMobile && "px-2 text-mobile-compact uppercase font-bold")}>
                  {isMobile ? "Act" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((gamePlayer) => (
                <TableRow
                  key={gamePlayer.id}
                  className={cn("group", isMobile && "h-10")}
                >
                  <TableCell className={cn(isMobile ? "table-cell-mobile" : "pl-6")}>
                    <div className="flex items-center gap-2">
                      {!isMobile && <User className="h-4 w-4 text-muted-foreground/50" />}
                      <span className={cn(
                        "font-medium truncate",
                        isMobile ? "text-mobile-compact" : ""
                      )}>
                        {getDisplayName(gamePlayer.player.name, isMobile)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(isMobile ? "table-cell-mobile" : "")}>
                    <div className="flex items-center gap-1">
                      {!isMobile && <Coins className="h-4 w-4 text-muted-foreground/50" />}
                      <span className={cn(
                        "font-medium",
                        isMobile ? "text-mobile-compact" : ""
                      )}>
                        {gamePlayer.buy_ins}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(isMobile ? "table-cell-mobile" : "")}>
                    <span className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-mobile-compact" : "text-sm"
                    )}>
                      {formatCurrency(gamePlayer.buy_ins * buyInAmount)}
                    </span>
                  </TableCell>
                  <TableCell className={cn(isMobile ? "table-cell-mobile text-right" : "text-right pr-6")}>
                    <div className="flex items-center justify-end gap-1 sm:gap-3">
                      <Button
                        onClick={() => {
                          setSelectedPlayerId(gamePlayer.id);
                          setBuyInCount(1);
                          setOpened(true);
                        }}
                        variant="ghost"
                        size={isMobile ? "icon-sm" : "icon"}
                        aria-label={`Add buy-in for ${gamePlayer.player.name}`}
                        className={cn(isMobile && "h-7 w-7")}
                      >
                        <Plus className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                      </Button>
                      {fetchBuyInHistory && (
                        <BuyInHistoryDialog
                          gamePlayerId={gamePlayer.id}
                          playerName={gamePlayer.player.name}
                          fetchHistory={fetchBuyInHistory}
                          triggerProps={{
                            size: isMobile ? "icon-sm" : "icon",
                            className: cn(isMobile && "h-7 w-7")
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

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
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
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

              <div className={cn(
                "p-6 rounded-2xl w-full text-center border transition-all duration-500",
                buyInCount > 0 ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
              )}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cost Impact</p>
                <p className={cn(
                  "text-3xl font-bold",
                  buyInCount > 0 ? 'text-primary' : 'text-destructive'
                )}>
                  {formatCurrency(Math.abs(buyInCount * buyInAmount))}
                </p>
              </div>
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
