import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, TrendingDown, Wallet, Clock, User, ShieldCheck, X } from "lucide-react";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gold-500/40 hover:text-gold-500 hover:bg-gold-500/10 rounded-lg transition-all border border-transparent hover:border-gold-500/20"
        >
          <History className="w-4.5 h-4.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 shadow-[0_0_15px_rgba(212,184,60,0.1)]">
              <History className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-luxury text-gold-100 uppercase tracking-widest">Buy-In Audit Log</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-luxury flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Participant: {playerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gold-500/40 gap-4">
              <div className="animate-spin duration-700">
                <History className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-[10px] font-luxury uppercase tracking-[0.3em] animate-pulse">Scanning Archives...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-gold-500/20 gap-4">
              <div className="p-5 bg-white/2 rounded-full border border-dashed border-white/10">
                <ShieldCheck className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-[10px] font-luxury uppercase tracking-[0.2em]">No fluctuations identified in ledger.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-b border-white/5 h-12">
                    <TableHead className="font-luxury uppercase tracking-[0.2em] text-[9px] text-gold-500/60 pl-8">Temporal Sync</TableHead>
                    <TableHead className="font-luxury uppercase tracking-[0.2em] text-[9px] text-gold-500/60 text-center">Variance</TableHead>
                    <TableHead className="font-luxury uppercase tracking-[0.2em] text-[9px] text-gold-500/60 text-right pr-8">Accumulated Assets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {history.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="h-16 hover:bg-gold-500/5 border-0 transition-colors"
                    >
                      <TableCell className="pl-8">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-numbers text-sm text-gold-100">
                            {format(new Date(entry.timestamp), "h:mm a")}
                          </span>
                          <span className="text-[9px] font-luxury uppercase tracking-widest text-white/20">
                            {format(new Date(entry.timestamp), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all shadow-sm",
                          entry.buy_ins_added > 0
                            ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5"
                            : "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5"
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
                          <span className="font-numbers text-base text-gold-100/80">
                            {entry.total_buy_ins_after}
                          </span>
                          <Wallet className="w-4 h-4 text-gold-500/30" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Genesis state */}
                  <TableRow className="bg-white/2 border-0 h-16 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-luxury text-[10px] uppercase tracking-[0.2em] text-gold-500/60">Genesis Initiation</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="ghost" className="bg-white/5 text-[9px] font-luxury uppercase tracking-widest text-white/40">Initial State</Badge>
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
      </DialogContent>
    </Dialog>
  );
};