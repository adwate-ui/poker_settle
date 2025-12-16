import { Modal, ActionIcon, ScrollArea, Text, Group } from "@mantine/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { BuyInHistory } from "@/types/poker";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";

interface BuyInHistoryDialogProps {
  gamePlayerId: string;
  playerName: string;
  fetchHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

export const BuyInHistoryDialog = ({ gamePlayerId, playerName, fetchHistory }: BuyInHistoryDialogProps) => {
  const [history, setHistory] = useState<BuyInHistory[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(gamePlayerId);
      setHistory(data);
    } catch (error) {
      console.error("Error loading buy-in history:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, gamePlayerId]);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

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
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/15">
                  <TableHead className="font-bold">Player</TableHead>
                  <TableHead className="font-bold text-center">Incremental Buy-in</TableHead>
                  <TableHead className="font-bold">Time</TableHead>
                  <TableHead className="font-bold text-right">New Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry, index) => (
                  <TableRow 
                    key={entry.id}
                    className={index % 2 === 0 ? "bg-secondary/5 hover:bg-secondary/20" : "hover:bg-muted/50"}
                  >
                    <TableCell><span className="font-medium">{playerName}</span></TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {entry.buy_ins_added > 0 ? (
                          <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <span 
                          className={`font-semibold text-sm ${entry.buy_ins_added > 0 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}
                        >
                          {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{entry.total_buy_ins_after}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Initial buy-in row - shown at bottom since we're in descending order */}
                <TableRow className={history.length % 2 === 0 ? "bg-secondary/5 hover:bg-secondary/20" : "hover:bg-muted/50"}>
                  <TableCell><span className="font-medium">{playerName}</span></TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">Initial</span></TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">1</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Modal>
    </>
  );
};