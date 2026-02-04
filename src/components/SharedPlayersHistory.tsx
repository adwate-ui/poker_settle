import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowUpDown } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { formatIndianNumber } from '@/lib/utils';
import { format } from 'date-fns';
import OptimizedAvatar from '@/components/OptimizedAvatar';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SharedPlayersHistoryProps { token: string; playerId: string; }

const SharedPlayersHistory: React.FC<SharedPlayersHistoryProps> = ({ token, playerId }) => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const client = createSharedClient(token);
      const { data: pData } = await client.from('players').select('*').eq('id', playerId).single();
      setPlayer(pData);
      const { data: hData } = await client.from('game_players').select('*, games(date, buy_in_amount)').eq('player_id', playerId);
      setGameHistory(hData || []);
      setLoading(false);
    };
    load();
  }, [token, playerId]);

  const uniqueMonths = useMemo(() => Array.from(new Set(gameHistory.map(g => format(new Date(g.games.date), 'MMM yyyy')))), [gameHistory]);

  const filteredHistory = useMemo(() => {
    let res = gameHistory.filter(g => selectedMonth === 'all' || format(new Date(g.games.date), 'MMM yyyy') === selectedMonth);
    return res.sort((a, b) => {
      let valA = 0, valB = 0;
      switch (sortField) {
        case 'date': valA = new Date(a.games.date).getTime(); valB = new Date(b.games.date).getTime(); break;
        case 'net': valA = a.net_amount; valB = b.net_amount; break;
        case 'stack': valA = a.final_stack; valB = b.final_stack; break;
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
    });
  }, [gameHistory, selectedMonth, sortField, sortOrder]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!player) return <div className="text-center p-8">Player not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3"><OptimizedAvatar name={player.name} /> {player.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Total Games</p><p className="text-2xl font-bold font-numbers">{player.total_games}</p></div>
          <div className="p-4 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Net P&L</p><p className={cn("text-2xl font-bold font-numbers", (player.total_profit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}</p></div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter Month" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Months</SelectItem>{uniqueMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer">Date <ArrowUpDown className="h-3 w-3 inline" /></TableHead>
              <TableHead>Buy-ins</TableHead>
              <TableHead onClick={() => { setSortField('net'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="text-right cursor-pointer">Net <ArrowUpDown className="h-3 w-3 inline" /></TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map(h => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{format(new Date(h.games.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{h.buy_ins}</Badge>
                </TableCell>
                <TableCell className={cn("text-right font-bold font-numbers", h.net_amount >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                  {h.net_amount > 0 ? "+" : ""} {formatIndianNumber(h.net_amount)}
                </TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => navigate(`/shared/${token}/game/${h.game_id}`)}>View</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SharedPlayersHistory;
