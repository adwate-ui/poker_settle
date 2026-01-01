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

import { useIsMobile } from "@/hooks/useIsMobile";

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
      <ActionIcon variant="subtle" size="sm" onClick={() => setOpen(true)} className="text-muted-foreground hover:text-foreground">
        <History className="w-4 h-4" />
      </ActionIcon>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={
          <Group gap="xs">
            <History className="w-5 h-5" />
            <span className="font-semibold text-lg">{playerName}</span>
          </Group>
        }
        size="lg"
        centered={!isMobile}
        yOffset={isMobile ? '5vh' : undefined}
        padding={0}
        radius="lg"
      >
        <div className="flex flex-col max-h-[70vh]">
          {/* Header fixed at top if needed, but Modal has its own header */}

          <ScrollArea.Autosize mah="70vh" type="scroll" offsetScrollbars>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No buy-in changes recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5 hover:bg-primary/5">
                      <TableHead className="font-bold">Player</TableHead>
                      <TableHead className="font-bold text-center">Change</TableHead>
                      <TableHead className="font-bold">Time</TableHead>
                      <TableHead className="font-bold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry, index) => (
                      <TableRow
                        key={entry.id}
                        className={index % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-muted/30"}
                      >
                        <TableCell><span className="font-medium text-sm">{playerName}</span></TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            {entry.buy_ins_added > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-500" />
                            )}
                            <span
                              className={`font-semibold text-sm ${entry.buy_ins_added > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                            >
                              {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-sm">{entry.total_buy_ins_after}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Initial buy-in row */}
                    <TableRow className="bg-muted/50">
                      <TableCell><span className="font-medium text-sm">{playerName}</span></TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">Initial</span></TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm">1</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </ScrollArea.Autosize>
        </div>
      </Modal>
    </>
  );
};