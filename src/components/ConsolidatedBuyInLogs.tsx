import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Calculate dynamic height based on number of entries
  const ROW_HEIGHT = 44; // Approximate height per table row in pixels
  const HEADER_HEIGHT = 40; // Table header height
  const MIN_HEIGHT = 132; // Minimum height (shows ~2 rows)
  const MAX_HEIGHT = 240; // Current maximum height
  
  const calculateHeight = () => {
    const numEntries = filteredHistory.length;
    if (numEntries === 0) return MIN_HEIGHT;
    
    const calculatedHeight = HEADER_HEIGHT + (numEntries * ROW_HEIGHT);
    return Math.min(Math.max(calculatedHeight, MIN_HEIGHT), MAX_HEIGHT);
  };

  const dynamicHeight = calculateHeight();

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <History className="w-5 h-5" />
          Buy-in History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!loading && history.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Filter by player:</span>
              {filterName && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20 transition-colors text-xs"
                  onClick={() => setFilterName("")}
                >
                  Clear filter ✕
                </Badge>
              )}
            </div>
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
            </div>
          </div>
        )}
        
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
          <ScrollArea style={{ height: `${dynamicHeight}px` }}>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="w-[30%] font-semibold">Player</TableHead>
                  <TableHead className="w-[25%] text-center font-semibold">Incremental Buy-in</TableHead>
                  <TableHead className="w-[30%] font-semibold">Time</TableHead>
                  <TableHead className="w-[15%] text-right font-semibold">New Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((entry) => (
                  <TableRow key={entry.id} className="h-12 hover:bg-accent/10 transition-colors">
                    <TableCell className="font-medium py-3">{entry.player_name}</TableCell>
                    <TableCell className="text-center py-3">
                      <div className="flex items-center justify-center gap-2">
                        {entry.buy_ins_added > 0 ? (
                          <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className={`font-semibold ${entry.buy_ins_added > 0 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}>
                          {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-3">
                      {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right font-semibold py-3">
                      {entry.total_buy_ins_after}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
