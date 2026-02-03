import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, Save, X, Coins, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber, cn } from '@/lib/utils';
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
      toast.error(`Final stack must be a multiple of the small blind (Rs. ${smallBlind})`);
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
      toast.error('Failed to update final stack');
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
    if (!isMobile) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name;
    return parts.map((part, idx) =>
      idx === parts.length - 1 ? part : part.charAt(0).toUpperCase() + '.'
    ).join(' ');
  };

  const selectedPlayer = sortedPlayers.find(gp => gp.id === selectedPlayerId);

  return (
    <>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="hover:bg-transparent border-0 h-12">
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 pl-6 align-middle w-full">Player</TableHead>
                <TableHead className="font-luxury uppercase tracking-[0.2em] text-[10px] text-gold-500/60 align-middle">Final Stack</TableHead>
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
                      <span className="font-luxury text-sm text-gold-100 uppercase tracking-widest">{getDisplayName(gamePlayer.player.name, isMobile)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-numbers text-base text-gold-200/80">Rs. {formatIndianNumber(gamePlayer.final_stack || 0)}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        onClick={() => handleStartEdit(gamePlayer)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gold-500/40 hover:text-gold-500 hover:bg-gold-500/10 rounded-lg transition-all border border-transparent hover:border-gold-500/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ChipScanner
                        onScanComplete={(value) => onUpdateFinalStack(gamePlayer.id, value)}
                      />
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
          setEditValue('');
        }
      }}>
        <DialogContent className="bg-[#0a0a0a]/95 border-gold-500/30 backdrop-blur-2xl text-gold-50 rounded-xl max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
                <Coins className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-luxury text-gold-100 uppercase tracking-widest">Edit Final Stack</DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-luxury">Player: {selectedPlayer?.player.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-luxury tracking-[0.3em] text-gold-500/60 ml-1">Final Stack (INR)</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gold-500 font-numbers text-sm opacity-50">₹</span>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-14 pl-10 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-numbers text-xl text-gold-100 placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpened(false)}
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-11 border-white/5 bg-white/2 hover:bg-white/5 transition-colors rounded-lg flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isUpdating || editValue === ''}
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-11 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black border-0 shadow-lg shadow-gold-900/10 rounded-lg flex-1"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
