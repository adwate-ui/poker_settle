import { useState } from 'react';
import { Table, Collapse, Button, NumberInput, Group, Text, ActionIcon, Stack } from '@mantine/core';
import { ChevronDown, ChevronUp, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatIndianNumber } from '@/lib/utils';
import { GamePlayer } from "@/types/poker";

interface FinalStackManagementProps {
  gamePlayers: GamePlayer[];
  onUpdateFinalStack: (gamePlayerId: string, finalStack: number) => Promise<void>;
}

export const FinalStackManagement = ({ 
  gamePlayers,
  onUpdateFinalStack 
}: FinalStackManagementProps) => {
  const [opened, setOpened] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | string>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (gamePlayer: GamePlayer) => {
    setEditingPlayerId(gamePlayer.id);
    setEditValue(gamePlayer.final_stack || 0);
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditValue(0);
  };

  const handleSaveEdit = async (gamePlayerId: string) => {
    if (typeof editValue !== 'number' || editValue < 0) {
      toast.error('Please enter a valid stack amount');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateFinalStack(gamePlayerId, editValue);
      toast.success('Final stack updated');
      setEditingPlayerId(null);
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

  return (
    <Stack gap="md">
      <Button
        onClick={() => setOpened(!opened)}
        variant="subtle"
        fullWidth
        rightSection={opened ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        size="md"
      >
        {opened ? 'Hide' : 'Show'} Final Stack Details
      </Button>

      <Collapse in={opened}>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ fontSize: '0.95rem', fontWeight: 700 }}>Player Name</Table.Th>
              <Table.Th style={{ fontSize: '0.95rem', fontWeight: 700 }}>Final Stack</Table.Th>
              <Table.Th style={{ fontSize: '0.95rem', fontWeight: 700 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedPlayers.map((gamePlayer) => {
              const isEditing = editingPlayerId === gamePlayer.id;

              return (
                <Table.Tr key={gamePlayer.id}>
                  <Table.Td>
                    <Text fw={600} size="sm">{gamePlayer.player.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {isEditing ? (
                      <NumberInput
                        value={editValue}
                        onChange={setEditValue}
                        min={0}
                        size="sm"
                        style={{ width: '150px' }}
                        placeholder="Enter amount"
                      />
                    ) : (
                      <Text fw={600} size="sm">Rs. {formatIndianNumber(gamePlayer.final_stack || 0)}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {isEditing ? (
                      <Group gap="xs">
                        <ActionIcon
                          color="green"
                          variant="filled"
                          onClick={() => handleSaveEdit(gamePlayer.id)}
                          loading={isUpdating}
                          size="sm"
                        >
                          <Check size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="filled"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          size="sm"
                        >
                          <X size={16} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => handleStartEdit(gamePlayer)}
                        size="sm"
                      >
                        <Edit size={16} />
                      </ActionIcon>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Collapse>
    </Stack>
  );
};
