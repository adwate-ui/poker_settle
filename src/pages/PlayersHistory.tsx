import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Player } from "@/types/poker";

const PlayersHistory = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user?.id)
        .order("total_profit", { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Players History</CardTitle>
          <CardDescription>No players yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Add players to your games to see their statistics here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Players Performance</CardTitle>
          <CardDescription>Overall statistics for all players</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player Name</TableHead>
                <TableHead className="text-right">Games Played</TableHead>
                <TableHead className="text-right">Total Profit/Loss</TableHead>
                <TableHead className="text-right">Avg Per Game</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const avgPerGame = player.total_games > 0 
                  ? (player.total_profit || 0) / player.total_games 
                  : 0;
                const isProfit = (player.total_profit || 0) >= 0;

                return (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="text-right">{player.total_games || 0}</TableCell>
                    <TableCell className={`text-right font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      ${(player.total_profit || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${avgPerGame >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${avgPerGame.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isProfit ? (
                        <div className="flex items-center justify-end gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">Winning</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm">Losing</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Players</p>
              <p className="text-2xl font-bold">{players.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Games</p>
              <p className="text-2xl font-bold">
                {players.reduce((sum, p) => sum + (p.total_games || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Winning Players</p>
              <p className="text-2xl font-bold">
                {players.filter(p => (p.total_profit || 0) >= 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayersHistory;
