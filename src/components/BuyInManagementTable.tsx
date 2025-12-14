import { useState, useEffect } from 'react';
import { Table, Button, Modal, NumberInput, Group, Text, Select, Stack } from '@mantine/core';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
import { GamePlayer } from "@/types/poker";

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
  const [buyInCount, setBuyInCount] = useState<number | string>(1);
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
      setBuyInCount(1);
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

  // Helper function to abbreviate names for mobile
  const getDisplayName = (name: string, isMobile: boolean) => {
    if (!isMobile) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name;
    return parts.map((part, idx) => 
      idx === parts.length - 1 ? part : part.charAt(0).toUpperCase() + '.'
    ).join(' ');
  };

  // Check if mobile (simplified check based on window width)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <Table striped highlightOnHover withTableBorder withColumnBorders className="bg-card/95">
          <Table.Thead className="bg-primary/10">
            <Table.Tr>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Player</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Buy-ins</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Action</Table.Th>
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
                    leftSection={<Plus size={16} />}
                    onClick={() => {
                      setSelectedPlayerId(gamePlayer.id);
                      setOpened(true);
                    }}
                    variant="filled"
                    color="blue"
                    size="xs"
                  >
                    Buy-in
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
          setBuyInCount(1);
        }}
        title={<Text fw={700} size="lg">Add Buy-in</Text>}
        centered
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Select Player"
            placeholder="Choose a player"
            data={sortedPlayers.map(gp => ({
              value: gp.id,
              label: gp.player.name
            }))}
            value={selectedPlayerId}
            onChange={(value) => setSelectedPlayerId(value || '')}
            searchable
            required
          />

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
                setBuyInCount(1);
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
