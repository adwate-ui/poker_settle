import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { format } from 'date-fns';
import PokerTableView from '@/components/PokerTableView';
import { ConsolidatedBuyInLogs } from '@/components/ConsolidatedBuyInLogs';
import { SeatPosition } from '@/types/poker';

interface GamePlayer {
  id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  player_id: string;
  players: {
    name: string;
  };
}

interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
}

const SharedGameDetail = () => {
  const { token, gameId } = useParams<{ token: string; gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [tablePositions, setTablePositions] = useState<SeatPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!token || !gameId) return;

      try {
        const sharedClient = createSharedClient(token);

        const [gameResult, playersResult, positionsResult] = await Promise.all([
          sharedClient.from('games').select('*').eq('id', gameId).single(),
          sharedClient
            .from('game_players')
            .select(`
              *,
              players (
                name
              )
            `)
            .eq('game_id', gameId),
          sharedClient
            .from('table_positions')
            .select('*')
            .eq('game_id', gameId)
            .order('snapshot_timestamp', { ascending: false })
            .limit(1)
            .single(),
        ]);

        if (gameResult.error) throw gameResult.error;
        if (playersResult.error) throw playersResult.error;

        setGame(gameResult.data);
        setGamePlayers(playersResult.data || []);
        
        // Set table positions if available
        if (positionsResult.data && positionsResult.data.positions) {
          setTablePositions(positionsResult.data.positions as unknown as SeatPosition[]);
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [token, gameId]);

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

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Button onClick={() => navigate(`/shared/${token}`)} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <p className="mt-4 text-muted-foreground">Game not found</p>
        </div>
      </div>
    );
  }

  const totalChips = gamePlayers.reduce(
    (sum, gp) => sum + gp.buy_ins * game.buy_in_amount,
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button onClick={() => navigate(`/shared/${token}`)} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {format(new Date(game.date), 'PPP')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Buy-in Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${game.buy_in_amount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Chips in Play</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalChips}</p>
              </CardContent>
            </Card>
          </div>

          <ConsolidatedBuyInLogs gameId={game.id} />

          {tablePositions.length > 0 && (
            <PokerTableView 
              positions={tablePositions}
              enableDragDrop={false}
              showPositionLabels={true}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Player Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gamePlayers.map((gp) => (
                  <div
                    key={gp.id}
                    className="flex justify-between items-center p-4 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-semibold">{gp.players.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Buy-ins: {gp.buy_ins} | Final Stack: ${gp.final_stack || 0}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-lg font-bold ${
                        (gp.net_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {(gp.net_amount || 0) >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      ${Math.abs(gp.net_amount || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SharedGameDetail;
