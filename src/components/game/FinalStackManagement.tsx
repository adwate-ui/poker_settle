import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from '@/lib/notifications';
import { ErrorMessages } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { formatCurrency, formatIndianNumber } from '@/utils/currencyUtils';
import { parseIndianNumber } from '@/lib/utils';
import { CurrencyConfig } from '@/config/localization';
import { GamePlayer } from "@/types/poker";
import { ChipScanner } from '@/components/poker/ChipScanner';
import { ResponsiveName } from '@/components/ui-primitives/ResponsiveName';
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
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (gamePlayer: GamePlayer) => {
    setSelectedPlayerId(gamePlayer.id);
    setEditValue(gamePlayer.final_stack ? formatIndianNumber(gamePlayer.final_stack) : '');
    setOpened(true);
  };

  const handleSaveEdit = async () => {
    const value = parseIndianNumber(editValue);
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


  const selectedPlayer = sortedPlayers.find(gp => gp.id === selectedPlayerId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[38%] md:w-auto">
              Player
            </TableHead>
            <TableHead className="w-[26%] md:w-auto">
              Stack
            </TableHead>
            <TableHead className="w-[18%] md:w-auto" />
            <TableHead className="w-[18%] md:w-auto" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((gamePlayer) => (
            <TableRow
              key={gamePlayer.id}
            >
              <TableCell className="font-medium truncate text-foreground text-tiny md:text-sm">
                <ResponsiveName name={gamePlayer.player.name} />
              </TableCell>
              <TableCell className="font-numbers whitespace-nowrap text-muted-foreground text-tiny md:text-sm">
                {formatCurrency(gamePlayer.final_stack || 0)}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleStartEdit(gamePlayer)}
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Edit final stack for ${gamePlayer.player.name}`}
                  className="bg-transparent border-border/50 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>
                <ChipScanner
                  onScanComplete={(value) => onUpdateFinalStack(gamePlayer.id, value)}
                  triggerProps={{
                    size: "icon-sm",
                    className: "bg-transparent text-muted-foreground hover:text-foreground transition-opacity"
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={opened} onOpenChange={(open) => { if (!open) setOpened(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Final Stack</DialogTitle>
            <DialogDescription>Player: {selectedPlayer?.player.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-label text-muted-foreground">Final Stack ({CurrencyConfig.code})</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (raw === '' || !isNaN(Number(raw))) {
                  setEditValue(raw === '' ? '' : formatIndianNumber(Number(raw)));
                }
              }}
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
