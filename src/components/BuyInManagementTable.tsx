import { useState } from 'react';
import { Table, Button, Modal, NumberInput, Group, Text, Select, Stack, ScrollArea } from '@mantine/core';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
import { GamePlayer } from "@/types/poker";
import { useIsMobile } from '@/hooks/useIsMobile';

interface BuyInManagementTableProps {
  gamePlayers: GamePlayer[];
  buyInAmount: number;
  onAddBuyIn: (gamePlayerId: string, buyInsToAdd: number) => Promise<void>;
}

export const BuyInManagementTable = ({ 
  gamePlayers, 
  buyInAmount,
  onAddBuyIn 
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
        <Table striped highlightOnHover withTableBorder className="bg-card/95">
          <Table.Thead className="bg-primary/10">
            <Table.Tr>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Player</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Buy-ins</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700, width: '80px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedPlayers.map((gamePlayer) => (
              <Table.Tr key={gamePlayer.id}>
                <Table.Td>
                  <Text fw={600} size="sm">{getDisplayName(gamePlayer.player.name, isMobile)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={500} size="sm">{gamePlayer.buy_ins}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={600} size="sm">Rs. {formatIndianNumber(gamePlayer.buy_ins * buyInAmount)}</Text>
                </Table.Td>
                <Table.Td>
                  <Button
                    onClick={() => {
                      setSelectedPlayerId(gamePlayer.id);
                      setBuyInCount('');
                      setOpened(true);
                    }}
                    variant="filled"
                    color="gray"
                    size="xs"
                    style={{ padding: '0 8px' }}
                  >
                    <Plus size={16} />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
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
        centered
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
            <Button 
              variant="default" 
              onClick={() => {
                setOpened(false);
                setSelectedPlayerId('');
                setBuyInCount('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddBuyIn}
              loading={isAdding}
              disabled={!selectedPlayerId || !buyInCount}
            >
              Confirm & Add
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
