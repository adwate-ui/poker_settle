import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowUpDown } from 'lucide-react';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';
import OptimizedAvatar from '@/components/OptimizedAvatar';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Eye } from 'lucide-react';

interface SharedPlayersHistoryProps { token: string; playerId: string; }

const SharedPlayersHistory: React.FC<SharedPlayersHistoryProps> = ({ token, playerId }) => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const isMobile = useIsMobile();

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
          <div className="p-4 rounded-lg border bg-card"><p className="text-label text-muted-foreground">Total Games</p><p className="text-2xl font-bold font-numbers">{player.total_games}</p></div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-label text-muted-foreground">Net P&L</p>
            <Badge
              variant={(player.total_profit || 0) >= 0 ? "profit" : "loss"}
              className="text-xl font-bold font-numbers px-4 py-1"
            >
              {(player.total_profit || 0) < 0 ? '-' : ''}Rs. {Math.abs(Math.round(player.total_profit || 0)).toLocaleString('en-IN')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter Month" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Months</SelectItem>{uniqueMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto w-full">
          <Table layout={isMobile ? "fixed" : "auto"}>
            <TableHeader>
              <TableRow className={cn(isMobile ? "h-10" : "")}>
                <TableHead
                  onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  className={isMobile ? "w-[30%] px-1" : ""}
                >
                  <span className="flex items-center gap-0.5">
                    Date
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3 inline")} />
                  </span>
                </TableHead>
                <TableHead className={isMobile ? "w-[15%] px-1" : ""}>
                  <span className="flex items-center gap-0.5">
                    {isMobile ? "Buys" : "Buy-ins"}
                  </span>
                </TableHead>
                <TableHead
                  onClick={() => { setSortField('net'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  className={cn(
                    "text-right",
                    isMobile ? "w-[30%] px-1" : ""
                  )}
                >
                  <span className="flex items-center justify-end gap-0.5">
                    Net
                    <ArrowUpDown className={cn(isMobile ? "h-2 w-2 opacity-50" : "h-3 w-3 inline")} />
                  </span>
                </TableHead>
                <TableHead className={cn(
                  "text-right",
                  isMobile ? "w-[25%] px-1" : ""
                )}>
                  {!isMobile && "Action"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map(h => (
                <TableRow
                  key={h.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    isMobile ? "h-10" : ""
                  )}
                >
                  <TableCell className={cn("font-medium", isMobile ? "px-1" : "")}>
                    {format(new Date(h.games.date), isMobile ? 'MMM d' : 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className={isMobile ? "px-1" : ""}>
                    <Badge variant="secondary" className={cn(isMobile ? "h-5 px-1.5 text-[9px] min-w-[20px]" : "text-xs")}>
                      {h.buy_ins}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    isMobile ? "px-1" : ""
                  )}>
                    <Badge
                      variant={h.net_amount >= 0 ? "profit" : "loss"}
                      className={cn(
                        "font-numbers font-medium",
                        isMobile ? "text-[10px] px-1.5" : "text-sm px-3"
                      )}
                    >
                      {h.net_amount < 0 ? '-' : ''}Rs. {Math.abs(Math.round(h.net_amount)).toLocaleString('en-IN')}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right", isMobile ? "px-1" : "")}>
                    {isMobile ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => navigate(`/shared/${token}/game/${h.game_id}`)}
                      >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/shared/${token}/game/${h.game_id}`)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default SharedPlayersHistory;
