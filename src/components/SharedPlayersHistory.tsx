import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { formatIndianNumber } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  total_games: number;
  total_profit: number;
}


interface SharedPlayersHistoryProps {
  token: string;
  playerId: string;
}

const SharedPlayersHistory: React.FC<SharedPlayersHistoryProps> = ({ token, playerId }) => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [token, playerId]);

  const fetchPlayer = useCallback(async () => {
    setLoading(true);
    try {
      const sharedClient = createSharedClient(token);
      const { data, error } = await sharedClient
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error('Error fetching player:', error);
    } finally {
      setLoading(false);
    }
  }, [token, playerId]);


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Player Performance</CardTitle>
          <CardDescription>Player not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Unable to load player data
          </p>
        </CardContent>
      </Card>
    );
  }

  const isProfit = (player.total_profit || 0) >= 0;
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl">Player Performance</CardTitle>
          <CardDescription className="text-sm">Statistics for {player.name}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
              <img 
                src={avatarUrl} 
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{player.name}</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Games</p>
              <p className="text-xl sm:text-2xl font-bold">{player.total_games || 0}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-xl sm:text-2xl font-bold ${
                isProfit 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isProfit ? '+' : ''}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedPlayersHistory;
