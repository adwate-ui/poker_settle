import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';

interface Player {
  id: string;
  name: string;
  total_games: number;
  total_profit: number;
}

interface SharedPlayersHistoryProps {
  token: string;
}

const SharedPlayersHistory: React.FC<SharedPlayersHistoryProps> = ({ token }) => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const sharedClient = createSharedClient(token);
        const { data, error } = await sharedClient
          .from('players')
          .select('*')
          .order('total_profit', { ascending: false });

        if (error) throw error;
        setPlayers(data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No players found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {players.map((player) => (
        <Card key={player.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{player.name}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Games: {player.total_games || 0}</span>
                  <span className={`flex items-center gap-1 ${
                    (player.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(player.total_profit || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    ${Math.abs(player.total_profit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/shared/${token}/player/${player.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SharedPlayersHistory;
