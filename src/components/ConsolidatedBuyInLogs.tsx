import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingUp, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
}

export const ConsolidatedBuyInLogs = ({ gameId }: ConsolidatedBuyInLogsProps) => {
  const [history, setHistory] = useState<BuyInHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState<string>("");

  useEffect(() => {
    fetchAllBuyInHistory();
  }, [gameId]);

  const fetchAllBuyInHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
      <CardContent className="pt-4 space-y-4">
        {!loading && history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Filter by player name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="text-sm"
              />
              {filterName && (
                <button
                  onClick={() => setFilterName("")}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                  aria-label="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {uniquePlayerNames.map((name) => (
                <Badge
                  key={name}
                  variant={filterName === name ? "default" : "outline"}
                  className="cursor-pointer text-xs"
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
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">
                        {entry.player_name} added {entry.buy_ins_added} buy-in{Math.abs(entry.buy_ins_added) !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">New Total</div>
                    <div className="text-sm font-semibold">
                      {entry.total_buy_ins_after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
