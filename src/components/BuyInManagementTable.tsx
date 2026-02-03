import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Minus, X, User, Coins, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
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
      toast.error('Failed to update buy-ins');
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
    if (!isMobile) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name;
    return parts.map((part, idx) =>
      idx === parts.length - 1 ? part : part.charAt(0).toUpperCase() + '.'
    ).join(' ');
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
      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/5 dark:bg-black/20 shadow-inner">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
              <TableRow className="hover:bg-transparent border-0 h-12">
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 pl-6 align-middle w-full">Player</TableHead>
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 align-middle">Buy-ins</TableHead>
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 align-middle">Amount</TableHead>
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 text-right pr-6 align-middle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {sortedPlayers.map((gamePlayer) => (
                <TableRow
                  key={gamePlayer.id}
                  className="h-16 hover:bg-gold-500/5 border-0 transition-colors group"
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <User className="h-3.5 w-3.5 text-gold-500/30 group-hover:text-gold-500/60 transition-colors" />
                      <span className="font-luxury text-sm text-gold-900 dark:text-gold-100 uppercase tracking-widest">{getDisplayName(gamePlayer.player.name, isMobile)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Coins className="h-3 w-3 text-gold-500/40" />
                      <span className="font-numbers text-base text-gold-800 dark:text-gold-200/80">{gamePlayer.buy_ins}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-numbers text-sm text-gold-900/60 dark:text-gold-100/60">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        onClick={() => {
                          setSelectedPlayerId(gamePlayer.id);
                          setBuyInCount(1);
                          setOpened(true);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gold-500/40 hover:text-gold-500 hover:bg-gold-500/10 rounded-lg transition-all border border-transparent hover:border-gold-500/20"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {fetchBuyInHistory && (
                        <BuyInHistoryDialog
                          gamePlayerId={gamePlayer.id}
                          playerName={gamePlayer.player.name}
                          fetchHistory={fetchBuyInHistory}
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
        <DialogContent className="bg-[#0a0a0a]/95 border-gold-500/30 backdrop-blur-2xl text-gold-50 rounded-xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
                <TrendingUp className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-luxury text-gold-900 dark:text-gold-100 uppercase tracking-widest">Manage Buy-ins</DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-luxury">Player: {selectedPlayer?.player.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-10 space-y-8">
            <div className="flex flex-col items-center gap-8">
              <div className="flex items-center justify-center gap-8 w-full">
                <Button
                  variant="ghost"
                  onClick={decrement}
                  className="h-16 w-16 border border-white/10 hover:border-gold-500/30 hover:bg-gold-500/10 rounded-2xl group transition-all"
                >
                  <Minus className="h-7 w-7 text-gold-500 group-hover:scale-110 transition-transform" />
                </Button>

                <div className="flex flex-col items-center min-w-[120px]">
                  <span className={cn(
                    "text-5xl font-numbers tracking-tight transition-colors",
                    buyInCount < 0 ? 'text-red-400' : 'text-gold-800 dark:text-gold-200'
                  )}>
                    {buyInCount > 0 ? `+${buyInCount}` : buyInCount}
                  </span>
                  <span className="text-[10px] font-luxury uppercase tracking-[0.3em] text-gold-500/40 mt-2">
                    {Math.abs(buyInCount) === 1 ? 'Buy-in' : 'Buy-ins'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  onClick={increment}
                  className="h-16 w-16 border border-white/10 hover:border-gold-500/30 hover:bg-gold-500/10 rounded-2xl group transition-all"
                >
                  <Plus className="h-7 w-7 text-gold-500 group-hover:scale-110 transition-transform" />
                </Button>
              </div>

              <div className={cn(
                "p-6 rounded-2xl w-full text-center border transition-all duration-500 backdrop-blur-md",
                buyInCount > 0
                  ? 'bg-gold-500/5 border-gold-500/20 shadow-[0_0_30px_rgba(212,184,60,0.05)]'
                  : 'bg-red-500/5 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]'
              )}>
                <p className="text-[10px] font-luxury uppercase tracking-[0.2em] text-white/30 mb-2">Cost Impact</p>
                <p className={cn(
                  "text-3xl font-numbers",
                  buyInCount > 0 ? 'text-gold-900 dark:text-gold-100' : 'text-red-600 dark:text-red-100'
                )}>
                  Rs. {formatIndianNumber(Math.abs(buyInCount * buyInAmount))}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpened(false)}
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-11 border border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/2 hover:bg-black/10 dark:hover:bg-white/5 transition-colors rounded-lg flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBuyIn}
              disabled={isAdding || !selectedPlayerId || buyInCount === 0}
              className={cn(
                "font-luxury uppercase tracking-[0.2em] text-[10px] h-11 border-0 shadow-lg rounded-lg flex-1 transition-all",
                buyInCount < 0
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/10'
                  : 'bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black shadow-gold-900/10'
              )}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{buyInCount > 0 ? 'Add Buy-in' : 'Remove Buy-in'}</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
