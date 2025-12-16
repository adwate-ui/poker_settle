import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSharedClient } from "@/integrations/supabase/client-shared";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Select, Text } from "@mantine/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Filter constants
const FILTER_ALL = "all";
const FILTER_NONE = "";

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
  const [filterName, setFilterName] = useState<string>(FILTER_NONE);

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
    // Note: fetchAllBuyInHistory is stable (memoized with useCallback)
    // and only changes when gameId or token changes, which is when we want to re-run this effect
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
    filterName === FILTER_NONE || filterName === FILTER_ALL || entry.player_name === filterName
  );

  const uniquePlayerNames = Array.from(new Set(history.map(entry => entry.player_name))).sort();

  return (
    <>
      {/* Player Name Filter - Dropdown */}
      {!loading && history.length > 0 && (
        <div className="mb-4">
          <Select
            value={filterName || FILTER_ALL}
            onChange={(value) => setFilterName(value || FILTER_ALL)}
            data={[
              { value: FILTER_ALL, label: 'All Players' },
              ...uniquePlayerNames.map(name => ({ value: name, label: name }))
            ]}
            placeholder="Filter by player"
            style={{ width: '100%', maxWidth: '250px' }}
          />
        </div>
      )}
      
      {/* Table with fixed height and scroll */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : history.length === 0 ? (
        <Text ta="center" py="xl" c="dimmed">
          No buy-in changes recorded
        </Text>
      ) : filteredHistory.length === 0 ? (
        <Text ta="center" py="xl" c="dimmed">
          No buy-in changes found for "{filterName}"
        </Text>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="bg-primary/10 hover:bg-primary/15">
                  <TableHead className="text-xs sm:text-sm font-bold">
                    <span className="hidden sm:inline">Player name</span>
                    <span className="sm:hidden">Player</span>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm font-bold">
                    <span className="hidden sm:inline">Incremental buy in</span>
                    <span className="sm:hidden">Buy in</span>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm font-bold">
                    <span className="hidden sm:inline">Updated total buy in</span>
                    <span className="sm:hidden">Total</span>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm font-bold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((entry, index) => (
                  <TableRow 
                    key={entry.id}
                    className={index % 2 === 0 ? "bg-secondary/5 hover:bg-secondary/20" : "hover:bg-muted/50"}
                  >
                    <TableCell><span className="font-medium text-sm">{entry.player_name}</span></TableCell>
                    <TableCell>
                      <span className={`font-semibold text-sm ${entry.buy_ins_added > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                      </span>
                    </TableCell>
                    <TableCell><span className="font-semibold text-sm">{entry.total_buy_ins_after}</span></TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
};
