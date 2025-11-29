import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { format } from 'date-fns';
import { formatIndianNumber } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GameWithStats {
  id: string;
  date: string;
  buy_in_amount: number;
  player_count: number;
  total_pot: number;
  player_names: string[];
  game_players: Array<{
    player_name: string;
    net_amount: number;
  }>;
}

type SortField = 'date' | 'buy_in' | 'players' | 'chips';
type SortOrder = 'asc' | 'desc' | null;

interface SharedGamesHistoryProps {
  token: string;
}

const SharedGamesHistory: React.FC<SharedGamesHistoryProps> = ({ token }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  useEffect(() => {
    fetchGames();
  }, [token]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const sharedClient = createSharedClient(token);
      const { data: gamesData, error } = await sharedClient
        .from('games')
        .select(`
          id,
          date,
          buy_in_amount,
          is_complete,
          game_players (
            id,
            buy_ins,
            net_amount,
            player:players (
              name
            )
          )
        `)
        .eq('is_complete', true)
        .order('date', { ascending: false });

      if (error) throw error;

      const gamesWithStats: GameWithStats[] = (gamesData || []).map((game: any) => {
        const playerCount = game.game_players?.length || 0;
        const totalBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;
        const playerNames = game.game_players?.map((gp: any) => gp.player?.name || '').filter(Boolean) || [];
        const gamePlayers = game.game_players?.map((gp: any) => ({
          player_name: gp.player?.name || '',
          net_amount: gp.net_amount || 0,
        })) || [];

        return {
          id: game.id,
          date: game.date,
          buy_in_amount: game.buy_in_amount,
          player_count: playerCount,
          total_pot: totalPot,
          player_names: playerNames,
          game_players: gamePlayers,
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const uniqueDates = useMemo(() => {
    const dates = games.map((game) => format(new Date(game.date), 'MMM d, yyyy'));
    return Array.from(new Set(dates)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const uniqueMonthYears = useMemo(() => {
    const monthYears = games.map((game) => format(new Date(game.date), 'MMM yyyy'));
    return Array.from(new Set(monthYears)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter((game) => {
      const gameDate = format(new Date(game.date), 'MMM d, yyyy');
      const monthYear = format(new Date(game.date), 'MMM yyyy');
      
      if (selectedDate !== 'all' && gameDate !== selectedDate) return false;
      if (selectedMonthYear !== 'all' && monthYear !== selectedMonthYear) return false;
      
      return true;
    });

    if (sortField && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortField) {
          case 'date':
            aVal = new Date(a.date).getTime();
            bVal = new Date(b.date).getTime();
            break;
          case 'buy_in':
            aVal = a.buy_in_amount;
            bVal = b.buy_in_amount;
            break;
          case 'players':
            aVal = a.player_count;
            bVal = b.player_count;
            break;
          case 'chips':
            aVal = a.total_pot;
            bVal = b.total_pot;
            break;
        }
        
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [games, selectedDate, selectedMonthYear, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Games History</CardTitle>
          <CardDescription>No completed games yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No games found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl">Games History</CardTitle>
          <CardDescription className="text-sm">View all completed poker games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by month-year" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonthYears.map((monthYear) => (
                  <SelectItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <div className="hidden md:block rounded-lg p-3 sm:p-4 border">
              <div className="grid grid-cols-4 gap-2 sm:gap-4 font-bold text-xs sm:text-sm">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Date
                  {getSortIcon('date')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('buy_in')}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Buy-in
                  {getSortIcon('buy_in')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('players')}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Players
                  {getSortIcon('players')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('chips')}
                  className="flex items-center gap-2 justify-start font-bold"
                >
                  Chips in play
                  {getSortIcon('chips')}
                </Button>
              </div>
            </div>

            {filteredAndSortedGames.map((game) => {
              
              return (
                <Card
                  key={game.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/shared/${token}/game/${game.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{format(new Date(game.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Buy-in</p>
                          <p className="font-semibold">Rs. {formatIndianNumber(game.buy_in_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Players</p>
                          <Badge variant="info">{game.player_count}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Chips in play</p>
                          <p className="font-semibold">Rs. {formatIndianNumber(game.total_pot)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-4 gap-4 items-center text-sm">
                      <div className="font-medium">
                        {format(new Date(game.date), 'MMM d, yyyy')}
                      </div>
                      <div className="font-semibold">
                        Rs. {formatIndianNumber(game.buy_in_amount)}
                      </div>
                      <div>
                        <Badge variant="info">{game.player_count}</Badge>
                      </div>
                      <div className="font-semibold">
                        Rs. {formatIndianNumber(game.total_pot)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedGamesHistory;
