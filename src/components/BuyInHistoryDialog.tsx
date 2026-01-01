import { Modal, ActionIcon, ScrollArea, Group, Text, Stack } from "@mantine/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, TrendingDown, Clock, Wallet } from "lucide-react";
import { BuyInHistory } from "@/types/poker";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface BuyInHistoryDialogProps {
  gamePlayerId: string;
  playerName: string;
  fetchHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
}

export const BuyInHistoryDialog = ({ gamePlayerId, playerName, fetchHistory }: BuyInHistoryDialogProps) => {
  const isMobile = useIsMobile();
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
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-4 h-4" />
      </ActionIcon>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={
          <Group gap="sm">
            <div className="p-2 bg-primary/10 rounded-full">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <Text fw={700} size="lg" lh={1.2}>Buy-in History</Text>
              <Text size="xs" c="dimmed" fw={500}>{playerName}</Text>
            </div>
          </Group>
        }
        size="lg"
        centered={!isMobile}
        yOffset={isMobile ? '5vh' : undefined}
        padding={0}
        radius="lg"
        classNames={{
          header: "px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50",
          body: "bg-card",
          title: "w-full"
        }}
      >
        <div className="flex flex-col max-h-[70vh] min-h-[300px] bg-card">
          <ScrollArea.Autosize mah="70vh" type="scroll" offsetScrollbars>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="animate-spin text-primary">
                  <History className="w-8 h-8" />
                </div>
                <Text size="sm">Loading history...</Text>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="p-4 bg-muted rounded-full">
                  <History className="w-8 h-8 opacity-50" />
                </div>
                <Text size="sm">No buy-in changes recorded yet</Text>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-card sticky top-0 z-40 shadow-sm after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pl-6 h-12 bg-card">Time</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center h-12 bg-card">Change</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right pr-6 h-12 bg-card">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">
                            {format(new Date(entry.timestamp), "h:mm a")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.timestamp), "MMM d")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${entry.buy_ins_added > 0
                            ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                            : "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                          }`}>
                          {entry.buy_ins_added > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>
                            {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-sm tabular-nums text-foreground">
                            {entry.total_buy_ins_after}
                          </span>
                          <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Initial buy-in row */}
                  <TableRow className="bg-muted/30 hover:bg-muted/50 border-none">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-muted-foreground">Start</span>
                        <span className="text-xs text-muted-foreground opacity-50">-</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded bg-muted">Initial</span>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-muted-foreground">
                        <span className="font-bold text-sm tabular-nums">1</span>
                        <Wallet className="w-3.5 h-3.5 opacity-50" />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </ScrollArea.Autosize>
        </div>
      </Modal>
    </>
  );
};