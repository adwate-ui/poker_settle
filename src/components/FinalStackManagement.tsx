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
        <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className={cn("pl-6 w-[45%]", isMobile && "pl-2 text-mobile-compact uppercase font-bold")}>
                {isMobile ? "Plyr" : "Player"}
              </TableHead>
              <TableHead className={cn("w-[30%]", isMobile && "px-1 text-mobile-compact uppercase font-bold")}>
                {isMobile ? "Stack" : "Final Stack"}
              </TableHead>
              <TableHead className={cn("text-right pr-6 w-[25%]", isMobile && "px-2 text-mobile-compact uppercase font-bold")}>
                {isMobile ? "Act" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((gamePlayer) => (
              <TableRow
                key={gamePlayer.id}
                className={cn(isMobile && "h-10")}
              >
                <TableCell className={cn("font-medium", isMobile ? "table-cell-mobile text-mobile-compact truncate" : "pl-6")}>
                  {getDisplayName(gamePlayer.player.name, isMobile)}
                </TableCell>
                <TableCell className={cn(isMobile ? "table-cell-mobile text-mobile-compact" : "")}>
                  {formatCurrency(gamePlayer.final_stack || 0)}
                </TableCell>
                <TableCell className={cn(isMobile ? "table-cell-mobile text-right" : "text-right pr-6")}>
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Button
                      onClick={() => handleStartEdit(gamePlayer)}
                      variant="outline"
                      size={isMobile ? "icon-sm" : "icon"}
                      aria-label={`Edit final stack for ${gamePlayer.player.name}`}
                      className={cn("bg-transparent border-border hover:border-gold-500/50", isMobile && "h-7 w-7")}
                    >
                      <Edit className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                    </Button>
                    <ChipScanner
                      onScanComplete={(value) => onUpdateFinalStack(gamePlayer.id, value)}
                      triggerProps={{
                        size: isMobile ? "icon-sm" : "icon",
                        className: cn(isMobile && "h-7 w-7")
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
