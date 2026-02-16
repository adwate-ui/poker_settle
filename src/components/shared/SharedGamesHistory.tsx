import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowUpDown, Calendar } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
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
  const isMobile = useIsMobile();

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
          game_players (buy_ins, player:players(name))
        `)
        .eq('is_complete', true)
        .order('date', { ascending: false });

      if (error) throw error;

      interface GameResult {
        id: string;
        date: string;
        buy_in_amount: number;
        is_complete: boolean;
        game_players: {
          buy_ins: number;
          player: { name: string } | null;
        }[];
      }

      const gamesWithStats: GameWithStats[] = ((gamesData as unknown as GameResult[]) || []).map((game) => {
        const playerCount = game.game_players?.length || 0;
        const totalBuyIns = game.game_players?.reduce((sum: number, gp) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;
        const playerNames = game.game_players?.map((gp) => gp.player?.name || '').filter(Boolean) || [];

        return {
          id: game.id,
          date: game.date,
          buy_in_amount: game.buy_in_amount,
          player_count: playerCount,
          total_pot: totalPot,
          player_names: playerNames,
          game_players: [], // Not needed for summary
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const uniqueDates = useMemo(() => Array.from(new Set(games.map(g => format(new Date(g.date), 'MMM d, yyyy')))), [games]);
  const uniqueMonthYears = useMemo(() => Array.from(new Set(games.map(g => format(new Date(g.date), 'MMM yyyy')))), [games]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
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
        let valA = 0, valB = 0;
        switch (sortField) {
          case 'date': valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
          case 'buy_in': valA = a.buy_in_amount; valB = b.buy_in_amount; break;
          case 'players': valA = a.player_count; valB = b.player_count; break;
          case 'chips': valA = a.total_pot; valB = b.total_pot; break;
        }
        return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
      });
    }
    return filtered;
  }, [games, selectedDate, selectedMonthYear, sortField, sortOrder]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Games History</CardTitle>
          <CardDescription>View all completed poker games</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger><SelectValue placeholder="Filter by date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {uniqueDates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
            <SelectTrigger><SelectValue placeholder="Filter by month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {uniqueMonthYears.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table tableClassName={!isMobile ? "table-auto" : undefined}>
            <TableHeader>
              <TableRow className={cn(isMobile ? "h-10" : "")}>
                <TableHead
                  onClick={() => handleSort('date')}
                  className={cn(
                    "cursor-pointer hover:text-primary transition-colors",
                    isMobile ? "w-[30%] px-1" : ""
                  )}
                >
                  <span className="flex items-center gap-0.5">
                    Date
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('buy_in')}
                  className={cn(
                    "text-right cursor-pointer hover:text-primary transition-colors",
                    isMobile ? "w-[25%] px-1" : ""
                  )}
                >
                  <span className="flex items-center justify-end gap-0.5">
                    {isMobile ? "Buy" : "Buy-in"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('players')}
                  className={cn(
                    "text-center cursor-pointer hover:text-primary transition-colors",
                    isMobile ? "w-[15%] px-1" : ""
                  )}
                >
                  <span className="flex items-center justify-center gap-0.5">
                    {isMobile ? "Plyr" : "Players"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('chips')}
                  className={cn(
                    "text-right cursor-pointer hover:text-primary transition-colors",
                    isMobile ? "w-[30%] px-1" : ""
                  )}
                >
                  <span className="flex items-center justify-end gap-0.5">
                    {isMobile ? "Pot" : "Pot"}
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3")} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedGames.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No games found</TableCell></TableRow>
              ) : (
                filteredAndSortedGames.map((game) => (
                  <TableRow
                    key={game.id}
                    onClick={() => navigate(`/shared/${encodeURIComponent(token)}/game/${game.id}`)}
                    className={cn(
                      "cursor-pointer",
                      isMobile ? "h-10" : ""
                    )}
                  >
                    <TableCell className={cn("font-medium whitespace-nowrap text-tiny", isMobile ? "px-1" : "")}>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {!isMobile && <Calendar className="h-4 w-4 opacity-50" />}
                        {format(new Date(game.date), isMobile ? 'MMM d' : 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-right font-numbers text-tiny", isMobile ? "px-1" : "")}>
                      {isMobile ? `Rs.${Math.round(game.buy_in_amount).toLocaleString('en-IN')}` : formatCurrency(game.buy_in_amount)}
                    </TableCell>
                    <TableCell className={cn("text-center text-tiny", isMobile ? "px-1" : "")}>
                      <Badge variant="secondary" className={cn(isMobile ? "h-5 px-1.5 text-tiny min-w-[20px]" : "text-xs")}>
                        {game.player_count}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-numbers font-bold text-primary text-tiny", isMobile ? "px-1" : "")}>
                      {isMobile ? `Rs.${Math.round(game.total_pot).toLocaleString('en-IN')}` : formatCurrency(game.total_pot)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default SharedGamesHistory;
