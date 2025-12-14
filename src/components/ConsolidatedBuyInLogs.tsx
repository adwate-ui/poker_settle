
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSharedClient } from "@/integrations/supabase/client-shared";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Select, Table, Text, Group } from "@mantine/core";

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
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead style={{ position: 'sticky', top: 0, zIndex: 10 }} className="bg-background">
                <Table.Tr>
                  <Table.Th className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Player name</span>
                    <span className="sm:hidden">Player</span>
                  </Table.Th>
                  <Table.Th className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Incremental buy in</span>
                    <span className="sm:hidden">Buy in</span>
                  </Table.Th>
                  <Table.Th className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Updated total buy in</span>
                    <span className="sm:hidden">Total</span>
                  </Table.Th>
                  <Table.Th className="text-xs sm:text-sm">Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredHistory.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td><Text fw={500} size="sm">{entry.player_name}</Text></Table.Td>
                    <Table.Td>
                      <Text fw={600} c={entry.buy_ins_added > 0 ? "green" : "red"} size="sm">
                        {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                      </Text>
                    </Table.Td>
                    <Table.Td><Text fw={600} size="sm">{entry.total_buy_ins_after}</Text></Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
};
