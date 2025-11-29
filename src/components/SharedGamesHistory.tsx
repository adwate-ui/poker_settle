import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { format } from 'date-fns';

interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
  is_complete: boolean;
}

interface SharedGamesHistoryProps {
  token: string;
}

const SharedGamesHistory: React.FC<SharedGamesHistoryProps> = ({ token }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const sharedClient = createSharedClient(token);
        const { data, error } = await sharedClient
          .from('games')
          .select('*')
          .eq('is_complete', true)
          .order('date', { ascending: false });

        if (error) throw error;
        setGames(data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No games found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <Card key={game.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {format(new Date(game.date), 'PPP')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Buy-in: ${game.buy_in_amount}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/shared/${token}/game/${game.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default SharedGamesHistory;
