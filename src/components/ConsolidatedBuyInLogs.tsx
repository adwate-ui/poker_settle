import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createSharedClient } from "@/integrations/supabase/client-shared";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
  player_id?: string;
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
          player_id: string;
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
        player_id: entry.game_players.player_id,
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
            <SelectTrigger className="w-full">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Players" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>All Players</SelectItem>
              {uniquePlayerNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table with fixed height and scroll */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching Buy-in Log...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl bg-muted/20">
          <History className="h-10 w-10 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No buy-in changes recorded.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl bg-muted/20">
          <p className="text-sm text-muted-foreground">No logs found for "{filterName}" in this archive.</p>
        </div>
      ) : (
        <Table
          className="max-h-[400px]"
          tableClassName="sm:table-auto"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2 sm:gap-3 max-w-[150px] sm:max-w-none">
                    <Link
                      to={entry.player_id ? `/players/${entry.player_id}` : '#'}
                      className="font-medium hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all truncate"
                    >
                      {entry.player_name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="font-numbers">
                  <Badge
                    variant={entry.buy_ins_added > 0 ? "profit" : "loss"}
                    className="px-1.5"
                  >
                    {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                  </Badge>
                </TableCell>
                <TableCell className="font-numbers text-muted-foreground whitespace-nowrap">
                  {entry.total_buy_ins_after}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 sm:gap-2 text-muted-foreground font-numbers whitespace-nowrap">
                    {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
