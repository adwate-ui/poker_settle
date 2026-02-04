import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, TrendingDown, Wallet, Clock, User, ShieldCheck, X, Loader2 } from "lucide-react";
import { BuyInHistory } from "@/types/poker";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BuyInHistoryDialogProps {
  gamePlayerId: string;
  playerName: string;
  fetchHistory: (gamePlayerId: string) => Promise<BuyInHistory[]>;
  triggerProps?: Partial<React.ComponentProps<typeof Button>>;
}

export const BuyInHistoryDialog = ({
  gamePlayerId,
  playerName,
  fetchHistory,
  triggerProps
}: BuyInHistoryDialogProps) => {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="View buy-in history"
          {...triggerProps}
          className={cn(
            "h-9 w-9 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-lg transition-all",
            triggerProps?.className
          )}
        >
          <History className={cn(
            "w-4.5 h-4.5",
            triggerProps?.size === "icon-sm" && "w-3.5 h-3.5"
          )} />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-widest">Buy-In History</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Player: {playerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[10px] uppercase tracking-[0.3em] animate-pulse">Accessing Archive...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground/40 gap-4">
              <ShieldCheck className="w-8 h-8 opacity-20" />
              <p className="text-[10px] uppercase tracking-[0.2em]">No changes found in history.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-b border-border h-12">
                    <TableHead className="uppercase tracking-[0.2em] text-[9px] text-muted-foreground pl-8">Time</TableHead>
                    <TableHead className="uppercase tracking-[0.2em] text-[9px] text-muted-foreground text-center">Change</TableHead>
                    <TableHead className="uppercase tracking-[0.2em] text-[9px] text-muted-foreground text-right pr-8">Total Buy-ins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {history.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="h-16 hover:bg-accent/5 border-0 transition-colors"
                    >
                      <TableCell className="pl-8">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-numbers text-sm text-foreground">
                            {format(new Date(entry.timestamp), "h:mm a")}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
                            {format(new Date(entry.timestamp), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all shadow-sm",
                          entry.buy_ins_added > 0
                            ? "bg-state-success/10 text-state-success border-state-success/20 shadow-state-success/5"
                            : "bg-state-error/10 text-state-error border-state-error/20 shadow-state-error/5"
                        )}>
                          {entry.buy_ins_added > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span className="font-numbers">
                            {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className="font-numbers text-base text-foreground/80">
                            {entry.total_buy_ins_after}
                          </span>
                          <Wallet className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Genesis state */}
                  <TableRow className="bg-white/2 border-0 h-16 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Initial Buy-in</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-muted text-[9px] uppercase tracking-widest text-muted-foreground">Original</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-2.5">
                        <span className="font-numbers text-sm">1</span>
                        <ShieldCheck className="w-4 h-4 text-white/20" />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent >
    </Dialog >
  );
};