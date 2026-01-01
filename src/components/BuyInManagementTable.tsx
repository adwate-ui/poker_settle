import { useState } from 'react';
import { Modal, Group, Text, Stack, ScrollArea } from '@mantine/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Minus, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { useIsMobile } from '@/hooks/useIsMobile';
import { BuyInHistoryDialog } from '@/components/BuyInHistoryDialog';

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
      toast.error('Please select a player and enter a valid buy-in count');
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
      console.error('Error adding buy-in:', error);
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

  const selectedPlayerName = gamePlayers.find(gp => gp.id === selectedPlayerId)?.player.name || '';

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
      <div className="overflow-x-auto">
        <Table className="bg-card/95">
          <TableHeader>
            <TableRow className="bg-primary/10 hover:bg-primary/15">
              <TableHead className="text-sm font-bold">Player</TableHead>
              <TableHead className="text-sm font-bold">Buy-ins</TableHead>
              <TableHead className="text-sm font-bold">Total</TableHead>
              <TableHead className="text-sm font-bold w-[90px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((gamePlayer, index) => (
              <TableRow
                key={gamePlayer.id}
                className={index % 2 === 0 ? "bg-secondary/5 hover:bg-secondary/20" : "hover:bg-muted/50"}
              >
                <TableCell>
                  <span className="font-semibold text-sm">{getDisplayName(gamePlayer.player.name, isMobile)}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-sm">{gamePlayer.buy_ins}</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-sm">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        setSelectedPlayerId(gamePlayer.id);
                        setBuyInCount(1);
                        setOpened(true);
                      }}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
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

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setSelectedPlayerId('');
          setBuyInCount(1);
        }}
        title={<Text fw={700} size="lg">Modify Buy-ins - {selectedPlayerName}</Text>}
        centered={!isMobile}
        yOffset={isMobile ? '20vh' : undefined}
        size="sm"
        radius="lg"
      >
        <Stack gap="xl" className="py-2">
          {/* Custom Stepper UI */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-6 w-full">
              <Button
                variant="outline"
                className="h-14 w-14 border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm active:scale-95"
                onClick={decrement}
              >
                <Minus className="h-6 w-6 text-primary" />
              </Button>

              <div className="flex flex-col items-center min-w-[100px]">
                <span className={`text-4xl font-black tabular-nums tracking-tight ${buyInCount < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {buyInCount > 0 ? `+${buyInCount}` : buyInCount}
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
                  {Math.abs(buyInCount) === 1 ? 'Buy-in' : 'Buy-ins'}
                </span>
              </div>

              <Button
                variant="outline"
                className="h-14 w-14 border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm active:scale-95"
                onClick={increment}
              >
                <Plus className="h-6 w-6 text-primary" />
              </Button>
            </div>

            {/* Impact Display */}
            <div className={`p-4 rounded-xl w-full text-center border transition-colors ${buyInCount > 0
              ? 'bg-primary/5 border-primary/10'
              : buyInCount < 0
                ? 'bg-destructive/5 border-destructive/10'
                : 'bg-muted border-border'
              }`}>
              <div className="text-sm text-muted-foreground font-medium mb-1">
                {buyInCount > 0 ? 'Adding Amount' : buyInCount < 0 ? 'Removing Amount' : 'No Change'}
              </div>
              <div className={`text-2xl font-bold ${buyInCount > 0 ? 'text-primary' : buyInCount < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                Rs. {formatIndianNumber(Math.abs(buyInCount * buyInAmount))}
              </div>
            </div>
          </div>

          <Group justify="space-between" mt="md">
            <Button
              variant="ghost"
              onClick={() => {
                setOpened(false);
                setSelectedPlayerId('');
                setBuyInCount(1);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBuyIn}
              disabled={isAdding || !selectedPlayerId || buyInCount === 0}
              size="lg"
              className={`px-8 font-semibold shadow-lg transition-all ${buyInCount < 0 ? 'bg-destructive hover:bg-destructive/90' : ''
                }`}
            >
              {isAdding && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              {buyInCount > 0 ? 'Confirm Add' : 'Confirm Remove'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
