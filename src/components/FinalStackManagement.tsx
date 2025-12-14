import { useState } from 'react';
import { Table, Modal, NumberInput, Group, Text, Button, Stack } from '@mantine/core';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
import { GamePlayer } from "@/types/poker";
import { useIsMobile } from '@/hooks/useIsMobile';

interface FinalStackManagementProps {
  gamePlayers: GamePlayer[];
  onUpdateFinalStack: (gamePlayerId: string, finalStack: number) => Promise<void>;
}

export const FinalStackManagement = ({ 
  gamePlayers,
  onUpdateFinalStack 
}: FinalStackManagementProps) => {
  const [opened, setOpened] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [editValue, setEditValue] = useState<number | string>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (gamePlayer: GamePlayer) => {
    setSelectedPlayerId(gamePlayer.id);
    setEditValue(gamePlayer.final_stack || 0);
    setOpened(true);
  };

  const handleSaveEdit = async () => {
    if (typeof editValue !== 'number' || editValue < 0) {
      toast.error('Please enter a valid stack amount');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateFinalStack(selectedPlayerId, editValue);
      toast.success('Final stack updated');
      setOpened(false);
      setSelectedPlayerId('');
      setEditValue(0);
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
      <div className="overflow-x-auto">
        <Table striped highlightOnHover withTableBorder className="bg-card/95">
          <Table.Thead className="bg-primary/10">
            <Table.Tr>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Player</Table.Th>
              <Table.Th style={{ fontSize: '0.9rem', fontWeight: 700 }}>Final Stack</Table.Th>
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
                  <Text fw={600} size="sm">Rs. {formatIndianNumber(gamePlayer.final_stack || 0)}</Text>
                </Table.Td>
                <Table.Td>
                  <Button
                    onClick={() => handleStartEdit(gamePlayer)}
                    variant="filled"
                    color="blue"
                    size="xs"
                    style={{ padding: '0 8px' }}
                  >
                    <Edit size={16} />
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
          setEditValue(0);
        }}
        title={<Text fw={700} size="lg">Edit Final Stack</Text>}
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" fw={500}>
            Player: {selectedPlayer?.player.name}
          </Text>

          <NumberInput
            label="Final Stack Amount"
            placeholder="Enter final stack"
            value={editValue}
            onChange={setEditValue}
            min={0}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button 
              variant="default" 
              onClick={() => {
                setOpened(false);
                setSelectedPlayerId('');
                setEditValue(0);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              loading={isUpdating}
              disabled={editValue === '' || editValue == null}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
