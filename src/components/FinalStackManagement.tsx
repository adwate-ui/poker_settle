import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorMessages } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';
import { CurrencyConfig } from '@/config/localization';
import { GamePlayer } from "@/types/poker";
import { useIsMobile } from '@/hooks/useIsMobile';
import { ChipScanner } from './ChipScanner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FinalStackManagementProps {
  gamePlayers: GamePlayer[];
  onUpdateFinalStack: (gamePlayerId: string, finalStack: number) => Promise<void>;
  smallBlind?: number;
}

export const FinalStackManagement = ({
  gamePlayers,
  onUpdateFinalStack,
  smallBlind
}: FinalStackManagementProps) => {
  const [opened, setOpened] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [editValue, setEditValue] = useState<number | string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (gamePlayer: GamePlayer) => {
    setSelectedPlayerId(gamePlayer.id);
    setEditValue(gamePlayer.final_stack || '');
    setOpened(true);
  };

  const handleSaveEdit = async () => {
    const value = typeof editValue === 'string' ? parseFloat(editValue) : editValue;
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid stack amount');
      return;
    }

    if (smallBlind && smallBlind > 0 && value % smallBlind !== 0) {
      toast.error(`Final stack must be a multiple of the small blind (${formatCurrency(smallBlind)})`);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateFinalStack(selectedPlayerId, value);
      toast.success('Final stack saved');
      setOpened(false);
      setSelectedPlayerId('');
      setEditValue('');
    } catch (error) {
      console.error('Error updating final stack:', error);
      toast.error(ErrorMessages.finalStack.update(error));
    } finally {
      setIsUpdating(false);
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

  const selectedPlayer = sortedPlayers.find(gp => gp.id === selectedPlayerId);

  return (
    <>
      <div className="rounded-md border max-h-[500px] overflow-auto">
        <Table className="table-fixed w-full text-left border-collapse">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-b border-white/10 hover:bg-transparent">
              <TableHead className={cn(
                "w-[45%] py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                isMobile ? "pl-2" : "pl-6"
              )}>
                {isMobile ? "Plyr" : "Player"}
              </TableHead>
              <TableHead className="w-[30%] px-1 py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground">
                {isMobile ? "Stack" : "Final Stack"}
              </TableHead>
              <TableHead className={cn(
                "text-right py-2 text-[9px] uppercase tracking-widest font-luxury text-muted-foreground",
                isMobile ? "w-[25%] pr-2" : "pr-6"
              )}>
                {isMobile ? "Act" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((gamePlayer) => (
              <TableRow
                key={gamePlayer.id}
                className={cn("border-b border-white/5 hover:bg-white/5", isMobile ? "h-11" : "")}
              >
                <TableCell className={cn("py-2.5", isMobile ? "pl-2 font-medium text-[11px] truncate text-foreground" : "pl-6")}>
                  {getDisplayName(gamePlayer.player.name, isMobile)}
                </TableCell>
                <TableCell className={cn("py-2.5 px-1 font-numbers whitespace-nowrap", isMobile ? "text-[11px] text-muted-foreground" : "")}>
                  {formatCurrency(gamePlayer.final_stack || 0)}
                </TableCell>
                <TableCell className={cn("text-right py-1", isMobile ? "pr-2 pl-1" : "pr-6")}>
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Button
                      onClick={() => handleStartEdit(gamePlayer)}
                      variant="outline"
                      size={isMobile ? "icon-sm" : "icon"}
                      aria-label={`Edit final stack for ${gamePlayer.player.name}`}
                      className={cn("bg-transparent border-white/10 hover:border-gold-500/50", isMobile && "h-7 w-7 opacity-70 hover:opacity-100 transition-opacity")}
                    >
                      <Edit className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                    </Button>
                    <ChipScanner
                      onScanComplete={(value) => onUpdateFinalStack(gamePlayer.id, value)}
                      triggerProps={{
                        size: isMobile ? "icon-sm" : "icon",
                        className: cn(isMobile && "h-7 w-7 opacity-70 hover:opacity-100 transition-opacity")
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={opened} onOpenChange={(open) => { if (!open) setOpened(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Final Stack</DialogTitle>
            <DialogDescription>Player: {selectedPlayer?.player.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Final Stack ({CurrencyConfig.code})</Label>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
