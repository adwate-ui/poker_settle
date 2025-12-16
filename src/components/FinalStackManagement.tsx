import { useState } from 'react';
import { Modal, NumberInput, Group, Text, Button as MantineButton, Stack, ScrollArea } from '@mantine/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  const [editValue, setEditValue] = useState<number | string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (gamePlayer: GamePlayer) => {
    setSelectedPlayerId(gamePlayer.id);
    setEditValue('');
    setOpened(true);
  };

  const handleSaveEdit = async () => {
    if (editValue === '' || editValue == null || typeof editValue !== 'number' || editValue < 0) {
      toast.error('Please enter a valid stack amount');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateFinalStack(selectedPlayerId, editValue);
      toast.success('Final stack updated');
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
      <div className="overflow-x-auto">
        <Table className="bg-card/95">
          <TableHeader>
            <TableRow className="bg-primary/10 hover:bg-primary/15">
              <TableHead className="text-sm font-bold">Player</TableHead>
              <TableHead className="text-sm font-bold">Final Stack</TableHead>
              <TableHead className="text-sm font-bold w-[80px]"></TableHead>
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
                  <span className="font-semibold text-sm">Rs. {formatIndianNumber(gamePlayer.final_stack || 0)}</span>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleStartEdit(gamePlayer)}
                    variant="secondary"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
          setEditValue('');
        }}
        title={<Text fw={700} size="lg">Edit Final Stack</Text>}
        centered={!isMobile}
        yOffset={isMobile ? '5vh' : undefined}
        size="sm"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          <NumberInput
            label="Final Stack Amount"
            placeholder="Enter final stack"
            value={editValue}
            onChange={setEditValue}
            min={0}
            required
          />

          <Group justify="flex-end" mt="md">
            <MantineButton 
              variant="default" 
              onClick={() => {
                setOpened(false);
                setSelectedPlayerId('');
                setEditValue('');
              }}
            >
              Cancel
            </MantineButton>
            <MantineButton 
              onClick={handleSaveEdit}
              loading={isUpdating}
              disabled={editValue === '' || editValue == null}
            >
              Save
            </MantineButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
