import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChevronDown, TrendingUp, TrendingDown, User, ShieldCheck, History, Calendar, Star, Info } from "lucide-react";
import { Player, Game, TablePosition } from "@/types/poker";
import { formatIndianNumber, getProfitLossColor, formatProfitLoss, getProfitLossBadgeStyle, cn } from "@/lib/utils";
import { useGameData } from "@/hooks/useGameData";
import PokerTableView from "@/components/PokerTableView";

interface PlayerPerformanceProps {
  players: Player[];
  games: Game[];
}

const PlayerPerformance = ({ players, games }: PlayerPerformanceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [gameTablePositions, setGameTablePositions] = useState<Record<string, TablePosition | null>>({});
  const { getTablePositionWithMostPlayers } = useGameData();

  const formatCurrency = (amount: number) => {
    return `Rs. ${formatIndianNumber(amount)}`;
  };

  const playerGames = useMemo(() => {
    if (!selectedPlayerId) return [];

    return games
      .filter(game => game.game_players.some(gp => gp.player_id === selectedPlayerId))
      .map(game => {
        const gamePlayer = game.game_players.find(gp => gp.player_id === selectedPlayerId);
        return {
          gameId: game.id,
          date: game.date,
          buyInAmount: game.buy_in_amount,
          buyIns: gamePlayer?.buy_ins || 0,
          netAmount: gamePlayer?.net_amount || 0,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPlayerId, games]);

  useEffect(() => {
    const loadTablePositions = async () => {
      const positions: Record<string, TablePosition | null> = {};
      for (const game of playerGames) {
        const position = await getTablePositionWithMostPlayers(game.gameId);
        positions[game.gameId] = position;
      }
      setGameTablePositions(positions);
    };

    if (playerGames.length > 0) {
      loadTablePositions();
    }
  }, [playerGames, getTablePositionWithMostPlayers]);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  if (players.length === 0) return null;

  return (
    <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-6 border-b border-white/5 bg-white/2 cursor-pointer flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-gold-500/40 group-hover:text-gold-500 transition-colors" />
              <h3 className="text-lg font-luxury text-gold-100 uppercase tracking-widest">Player Performance Matrix</h3>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-white/20 transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
            <div className="max-w-md">
              <label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1 mb-2 block">Select Participant Profile</label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase">
                  <SelectValue placeholder="Identify Participant..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl">
                  {sortedPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id} className="font-luxury uppercase text-[10px] tracking-widest">
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlayer ? (
              <div className="space-y-10">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Star className="w-24 h-24 text-gold-500" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <h4 className="text-3xl font-luxury text-gold-100 uppercase tracking-widest mb-1">{selectedPlayer.name}</h4>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500/40 font-luxury">Participant Portfolio Overview</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="px-6 py-4 bg-black/40 rounded-xl border border-white/5 text-center min-w-[140px]">
                        <p className="text-[9px] uppercase font-luxury tracking-widest text-white/30 mb-1">Total Sessions</p>
                        <p className="text-2xl font-numbers text-gold-200">{selectedPlayer.total_games}</p>
                      </div>
                      <div className="px-6 py-4 bg-black/40 rounded-xl border border-white/5 text-center min-w-[140px]">
                        <p className="text-[9px] uppercase font-luxury tracking-widest text-white/30 mb-1">Net Valuation</p>
                        <Badge variant={selectedPlayer.total_profit >= 0 ? "profit" : "loss"}>
                          {formatProfitLoss(selectedPlayer.total_profit)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <History className="h-4 w-4 text-gold-500/40" />
                    <h5 className="text-sm font-luxury text-gold-100/80 uppercase tracking-[0.2em]">Session Archive History</h5>
                  </div>

                  {playerGames.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {playerGames.map((game) => (
                        <Card key={game.gameId} className="border-white/5 bg-white/2 hover:bg-white/5 transition-all group overflow-hidden">
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-8">
                              <div className="flex-1 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/5">
                                      <Calendar className="h-4 w-4 text-white/30" />
                                    </div>
                                    <span className="font-luxury text-sm text-gold-100/80 uppercase tracking-widest">{new Date(game.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="stats">
                                      {game.buyIns} Units
                                    </Badge>
                                    <Badge variant={game.netAmount > 0 ? "profit" : "loss"}>
                                      {formatProfitLoss(game.netAmount)}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-luxury tracking-widest text-white/20">Base Stake</p>
                                    <p className="text-sm font-numbers text-white/60">Rs. {formatIndianNumber(game.buyInAmount)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-luxury tracking-widest text-white/20">Total Commitment</p>
                                    <p className="text-sm font-numbers text-white/60">Rs. {formatIndianNumber(game.buyIns * game.buyInAmount)}</p>
                                  </div>
                                </div>
                              </div>

                              {gameTablePositions[game.gameId] && gameTablePositions[game.gameId]!.positions.length > 0 && (
                                <div className="lg:w-48 xl:w-64 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <p className="text-[9px] uppercase font-luxury tracking-widest text-gold-500/30 mb-3 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Peak Position
                                  </p>
                                  <div className="scale-[0.85] origin-top-left">
                                    <PokerTableView positions={gameTablePositions[game.gameId]!.positions} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/2">
                      <Info className="h-10 w-10 mx-auto mb-4 text-white/5" />
                      <p className="text-[11px] font-luxury uppercase tracking-[0.2em] text-white/20">No archived sessions found for this participant.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/2">
                <User className="h-10 w-10 mx-auto mb-4 text-white/5" />
                <p className="text-[11px] font-luxury uppercase tracking-[0.2em] text-white/20">Select a participant to synchronize performance data.</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PlayerPerformance;
