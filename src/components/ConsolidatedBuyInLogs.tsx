import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSharedClient } from "@/integrations/supabase/client-shared";
import { format } from "date-fns";
import { Loader2, User, Filter, Calendar, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Filter constants
const FILTER_ALL = "all";

interface BuyInHistoryEntry {
  id: string;
  timestamp: string;
  buy_ins_added: number;
  total_buy_ins_after: number;
  game_player_id: string;
  player_name: string;
}

interface ConsolidatedBuyInLogsProps {
  gameId: string;
  token?: string; // Optional token for shared views
}

export const ConsolidatedBuyInLogs = ({ gameId, token }: ConsolidatedBuyInLogsProps) => {
  const [history, setHistory] = useState<BuyInHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState<string>(FILTER_ALL);

  const fetchAllBuyInHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Use shared client if token is provided, otherwise use regular authenticated client
      const client = token ? createSharedClient(token) : supabase;

      const { data, error } = await client
        .from("buy_in_history")
        .select(`
          *,
          game_players!inner(
            game_id,
            player_id,
            players!inner(name)
          )
        `)
        .eq("game_players.game_id", gameId)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      interface BuyInData {
        id: string;
        timestamp: string;
        buy_ins_added: number;
        total_buy_ins_after: number;
        game_player_id: string;
        game_players: {
          players: {
            name: string;
          };
        };
      }

      const formattedHistory: BuyInHistoryEntry[] = (data || []).map((entry: BuyInData) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        buy_ins_added: entry.buy_ins_added,
        total_buy_ins_after: entry.total_buy_ins_after,
        game_player_id: entry.game_player_id,
        player_name: entry.game_players.players.name,
      }));

      setHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading consolidated buy-in history:", error);
    } finally {
      setLoading(false);
    }
  }, [gameId, token]);

  useEffect(() => {
    // Fetch initial data
    fetchAllBuyInHistory();

    // Set up real-time subscription for buy-in history updates
    const client = token ? createSharedClient(token) : supabase;

    const channel = client
      .channel(`buy_in_history_changes_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buy_in_history',
        },
        () => {
          // Refetch history when any change occurs
          fetchAllBuyInHistory();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, token, fetchAllBuyInHistory]);

  const filteredHistory = history.filter(entry =>
    filterName === FILTER_ALL || entry.player_name === filterName
  );

  const uniquePlayerNames = Array.from(new Set(history.map(entry => entry.player_name))).sort();

  return (
    <div className="space-y-6">
      {/* Player Name Filter - Dropdown */}
      {!loading && history.length > 0 && (
        <div className="max-w-[250px]">
          <Select value={filterName} onValueChange={setFilterName}>
            <SelectTrigger className="h-10 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[10px] uppercase">
              <Filter className="mr-2 h-3.5 w-3.5 text-gold-500/40" />
              <SelectValue placeholder="All Participants" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl">
              <SelectItem value={FILTER_ALL} className="text-label">All Participants</SelectItem>
              {uniquePlayerNames.map(name => (
                <SelectItem key={name} value={name} className="text-label">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table with fixed height and scroll */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500/40" />
          <p className="text-label text-gold-500/20">Fetching Ledger History...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/2">
          <History className="h-10 w-10 mx-auto mb-4 text-white/5" />
          <p className="text-label tracking-[0.2em] text-white/20">No buy-in fluctuations recorded.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/2">
          <p className="text-label tracking-[0.2em] text-white/20">No logs found for "{filterName}" in this archive.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20 shadow-inner">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
                <TableRow className="hover:bg-transparent border-0 h-12">
                  <TableHead className="text-label tracking-[0.2em] text-gold-500/60 pl-6">Participant</TableHead>
                  <TableHead className="text-label tracking-[0.2em] text-gold-500/60">Incremental</TableHead>
                  <TableHead className="text-label tracking-[0.2em] text-gold-500/60">Amended Total</TableHead>
                  <TableHead className="text-label tracking-[0.2em] text-gold-500/60 text-right pr-6">Audit Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {filteredHistory.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="h-14 hover:bg-gold-500/5 border-0 transition-colors"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <User className="h-3 w-3 text-gold-500/40" />
                        <span className="font-luxury text-[11px] text-gold-100 uppercase tracking-widest">{entry.player_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-numbers text-sm ${entry.buy_ins_added > 0 ? "text-green-400" : "text-red-400"}`}>
                        {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-numbers text-sm text-gold-100/60">{entry.total_buy_ins_after}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 text-white/30 font-numbers text-[10px] uppercase">
                        <Calendar className="h-3 w-3 opacity-30" />
                        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
