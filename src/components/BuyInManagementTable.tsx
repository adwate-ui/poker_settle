import { useState } from 'react';
import { Button as MantineButton, Modal, NumberInput, Group, Text, Stack, ScrollArea } from '@mantine/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
  const [buyInCount, setBuyInCount] = useState<number | string>('');
  const [isAdding, setIsAdding] = useState(false);

  const validateBuyInInput = (): { valid: boolean; player?: GamePlayer } => {
    if (!selectedPlayerId || !buyInCount || typeof buyInCount !== 'number' || buyInCount <= 0) {
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
      toast.success(`Added ${buyInCount} buy-in(s) for ${selectedPlayer.player.name}`);
      setOpened(false);
      setSelectedPlayerId('');
      setBuyInCount('');
    } catch (error) {
      console.error('Error adding buy-in:', error);
      toast.error('Failed to add buy-in');
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

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="bg-card/95">
          <TableHeader>
            <TableRow className="bg-primary/10 hover:bg-primary/15">
              <TableHead className="text-sm font-bold">Player</TableHead>
              <TableHead className="text-sm font-bold">Buy-ins</TableHead>
              <TableHead className="text-sm font-bold">Total</TableHead>
              <TableHead className="text-sm font-bold w-[80px]"></TableHead>
              {fetchBuyInHistory && (
                <TableHead className="text-sm font-bold w-[50px]"></TableHead>
              )}
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
                  <Button
                    onClick={() => {
                      setSelectedPlayerId(gamePlayer.id);
                      setBuyInCount('');
                      setOpened(true);
                    }}
                    variant="secondary"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
                {fetchBuyInHistory && (
                  <TableCell>
                    <BuyInHistoryDialog
                      gamePlayerId={gamePlayer.id}
                      playerName={gamePlayer.player.name}
                      fetchHistory={fetchBuyInHistory}
                    />
                  </TableCell>
                )}
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
          setBuyInCount('');
        }}
        title={<Text fw={700} size="lg">Add Buy-in</Text>}
        centered={!isMobile}
        yOffset={isMobile ? '5vh' : undefined}
        size="sm"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          <NumberInput
            label="Number of Buy-ins"
            placeholder="Enter buy-in count"
            value={buyInCount}
            onChange={setBuyInCount}
            min={1}
            max={10}
            required
          />

          <Text size="sm" c="dimmed">
            {(() => {
              const validBuyInCount = typeof buyInCount === 'number' ? buyInCount : 0;
              return `This will add ${validBuyInCount} buy-in(s) worth Rs. ${formatIndianNumber(validBuyInCount * buyInAmount)}`;
            })()}
          </Text>

          <Group justify="flex-end" mt="md">
            <MantineButton 
              variant="default" 
              onClick={() => {
                setOpened(false);
                setSelectedPlayerId('');
                setBuyInCount('');
              }}
            >
              Cancel
            </MantineButton>
            <MantineButton 
              onClick={handleAddBuyIn}
              loading={isAdding}
              disabled={!selectedPlayerId || !buyInCount}
            >
              Confirm & Add
            </MantineButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
