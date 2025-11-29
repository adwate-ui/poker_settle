import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { format } from 'date-fns';

interface Player {
  id: string;
  name: string;
  total_games: number;
  total_profit: number;
}

interface GameHistory {
  id: string;
  game_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  games: {
    date: string;
    buy_in_amount: number;
  };
}

const SharedPlayerDetail = () => {
  const { token, playerId } = useParams<{ token: string; playerId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!token || !playerId) return;

      try {
        const sharedClient = createSharedClient(token);

        const [playerResult, historyResult] = await Promise.all([
          sharedClient.from('players').select('*').eq('id', playerId).single(),
          sharedClient
            .from('game_players')
            .select(`
              *,
              games (
                date,
                buy_in_amount
              )
            `)
            .eq('player_id', playerId)
            .order('games(date)', { ascending: false }),
        ]);

        if (playerResult.error) throw playerResult.error;
        if (historyResult.error) throw historyResult.error;

        setPlayer(playerResult.data);
        setGameHistory(historyResult.data || []);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [token, playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Button onClick={() => navigate(`/shared/${token}`)} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <p className="mt-4 text-muted-foreground">Player not found</p>
        </div>
      </div>
    );
  }

  const winningGames = gameHistory.filter((gh) => (gh.net_amount || 0) > 0).length;
  const winRate = gameHistory.length > 0 ? (winningGames / gameHistory.length) * 100 : 0;
  const avgPerGame = gameHistory.length > 0 ? (player.total_profit || 0) / gameHistory.length : 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button onClick={() => navigate(`/shared/${token}`)} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Players
        </Button>

        <div>
          <h1 className="text-4xl font-bold mb-2">{player.name}</h1>
          <p className="text-muted-foreground">Player Performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{player.total_games || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  (player.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${(player.total_profit || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  avgPerGame >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${avgPerGame.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameHistory.map((gh) => (
                <div
                  key={gh.id}
                  className="flex justify-between items-center p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {format(new Date(gh.games.date), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Buy-ins: {gh.buy_ins} | Final Stack: ${gh.final_stack || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-1 text-lg font-bold ${
                        (gh.net_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {(gh.net_amount || 0) >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      ${Math.abs(gh.net_amount || 0).toFixed(2)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/shared/${token}/game/${gh.game_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Game
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedPlayerDetail;
