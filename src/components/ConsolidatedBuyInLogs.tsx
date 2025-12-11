import { History, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSharedClient } from "@/integrations/supabase/client-shared";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [filterName, setFilterName] = useState<string>("");

  useEffect(() => {
    fetchAllBuyInHistory();
  }, [gameId, token]);

  const fetchAllBuyInHistory = async () => {
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
  };

  const filteredHistory = history.filter(entry => 
    filterName === "" || entry.player_name.toLowerCase().includes(filterName.toLowerCase())
  );

  const uniquePlayerNames = Array.from(new Set(history.map(entry => entry.player_name))).sort();

  return (
    <>
      {/* Player Name Filter */}
      {!loading && history.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {uniquePlayerNames.map((name) => (
              <Badge
                key={name}
                variant={filterName === name ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1.5 text-sm font-medium"
                onClick={() => setFilterName(filterName === name ? "" : name)}
              >
                {name}
              </Badge>
            ))}
            {filterName && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20 transition-colors text-sm"
                onClick={() => setFilterName("")}
                role="button"
                aria-label="Clear filter"
              >
                Clear ✕
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Table with fixed height and scroll */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No buy-in changes recorded
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No buy-in changes found for "{filterName}"
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="font-semibold h-12">Player name</TableHead>
                  <TableHead className="font-semibold h-12">Incremental buy in</TableHead>
                  <TableHead className="font-semibold h-12">Updated total buy in</TableHead>
                  <TableHead className="font-semibold h-12">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((entry) => (
                  <TableRow key={entry.id} className="h-12">
                    <TableCell className="font-medium">{entry.player_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.buy_ins_added > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`font-semibold ${entry.buy_ins_added > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {entry.total_buy_ins_after}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.timestamp), "MMM d, h:mm a")}
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
