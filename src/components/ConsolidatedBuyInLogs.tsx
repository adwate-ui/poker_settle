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

      const formattedHistory: BuyInHistoryEntry[] = (data || []).map((entry: any) => ({
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
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <History className="w-5 h-5" />
          Buy-in History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!loading && history.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {uniquePlayerNames.map((name) => (
              <Badge
                key={name}
                variant={filterName === name ? "default" : "outline"}
                className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                onClick={() => setFilterName(filterName === name ? "" : name)}
              >
                {name}
              </Badge>
            ))}
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
          <ScrollArea className="h-[240px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Player</TableHead>
                  <TableHead className="w-[25%] text-center">Change</TableHead>
                  <TableHead className="w-[25%]">Time</TableHead>
                  <TableHead className="w-[10%] text-right">New Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-accent/5">
                    <TableCell className="font-medium">{entry.player_name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {entry.buy_ins_added > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className={entry.buy_ins_added > 0 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}>
                          {entry.buy_ins_added > 0 ? '+' : ''}{entry.buy_ins_added}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
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
