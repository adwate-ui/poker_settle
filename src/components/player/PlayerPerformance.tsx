import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ChevronDown, TrendingUp, User, ShieldCheck, History, Calendar, Info } from "lucide-react";
import { Player, Game, TablePosition } from "@/types/poker";
import { formatProfitLoss, cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { useGameData } from "@/hooks/useGameData";
import PokerTableView from "@/components/poker/PokerTableView";

interface PlayerPerformanceProps {
  players: Player[];
  games: Game[];
}

const PlayerPerformance = ({ players, games }: PlayerPerformanceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [gameTablePositions, setGameTablePositions] = useState<Record<string, TablePosition | null>>({});
  const navigate = useNavigate();
  const { getTablePositionWithMostPlayers } = useGameData();

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
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-6 border-b cursor-pointer flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-medium">Player Performance Matrix</h3>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
            <div className="max-w-md">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Player</label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Search Player..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlayer ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">{selectedPlayer.name}</CardTitle>
                      <CardDescription>Player Summary</CardDescription>
                    </div>
                    {/* Standard Badge usage for Net Profit/Loss */}
                    <Badge variant={selectedPlayer.total_profit >= 0 ? "profit" : "loss"}>
                      {formatProfitLoss(selectedPlayer.total_profit)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                        <p className="text-2xl font-bold">{selectedPlayer.total_games}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Net Profit/Loss</p>
                        <Badge variant={selectedPlayer.total_profit >= 0 ? "profit" : "loss"} className="text-xl px-4 py-1">
                          {formatCurrency(selectedPlayer.total_profit)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-sm font-medium">Game History</h5>
                  </div>

                  {playerGames.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {playerGames.map((game) => (
                        <Card
                          key={game.gameId}
                          className="border-border/50 bg-card/40 hover:bg-card/60 hover:border-primary/40 cursor-pointer transition-all group overflow-hidden"
                          onClick={() => navigate(`/games/${game.gameId}`)}
                        >
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-8">
                              <div className="flex-1 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">{new Date(game.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline">
                                      {game.buyIns} Units
                                    </Badge>
                                    <Badge variant={game.netAmount > 0 ? "profit" : "loss"}>
                                      {formatProfitLoss(game.netAmount)}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Buy-in Amount</p>
                                    <p className="text-sm font-medium">{formatCurrency(game.buyInAmount)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Total Invested</p>
                                    <p className="text-sm font-medium">{formatCurrency(game.buyIns * game.buyInAmount)}</p>
                                  </div>
                                </div>
                              </div>

                              {gameTablePositions[game.gameId] && gameTablePositions[game.gameId]!.positions.length > 0 && (
                                <div className="lg:w-48 xl:w-64 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Best Position
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
                    <div className="py-20 text-center border border-dashed rounded-2xl bg-muted/50">
                      <Info className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No game history found for this player.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed rounded-2xl bg-muted/50">
                <User className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a player to see performance data.</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PlayerPerformance;
