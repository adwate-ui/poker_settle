import { Modal, ActionIcon, ScrollArea, Table, Text, Group } from "@mantine/core";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { BuyInHistory } from "@/types/poker";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface BuyInHistoryDialogProps {
  gamePlayerId: string;
  playerName: string;
  fetchHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

export const BuyInHistoryDialog = ({ gamePlayerId, playerName, fetchHistory }: BuyInHistoryDialogProps) => {
  const [history, setHistory] = useState<BuyInHistory[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(gamePlayerId);
      setHistory(data);
    } catch (error) {
      console.error("Error loading buy-in history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  return (
    <>
      <ActionIcon variant="subtle" size="sm" onClick={() => setOpen(true)}>
        <History className="w-3.5 h-3.5" />
      </ActionIcon>
      
      <Modal 
        opened={open} 
        onClose={() => setOpen(false)}
        title={
          <Group gap="xs">
            <History className="w-5 h-5" />
            <span>{playerName} - Buy-in History</span>
          </Group>
        }
        size="lg"
      >
        <ScrollArea style={{ maxHeight: 400 }}>
          {loading ? (
            <Text ta="center" py="xl" c="dimmed">Loading...</Text>
          ) : history.length === 0 ? (
            <Text ta="center" py="xl" c="dimmed">
              No buy-in changes recorded yet
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Player</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Incremental Buy-in</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>New Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {/* Initial buy-in row */}
                <Table.Tr>
                  <Table.Td><Text fw={500}>{playerName}</Text></Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text fw={600} c="dimmed">-</Text>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">Initial</Text></Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={600}>1</Text>
                  </Table.Td>
                </Table.Tr>
                {history.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td><Text fw={500}>{playerName}</Text></Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Group gap="xs" justify="center">
                        {entry.buy_ins_added > 0 ? (
                          <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <Text 
                          fw={600} 
                          size="sm" 
                          c={entry.buy_ins_added > 0 ? "orange" : "blue"}
                        >
                          {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={600}>{entry.total_buy_ins_after}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Modal>
    </>
  );
};