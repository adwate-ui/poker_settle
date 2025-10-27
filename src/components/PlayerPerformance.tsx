import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, User } from "lucide-react";
import { Player, Game, TablePosition } from "@/types/poker";
import { formatIndianNumber } from "@/lib/utils";
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-poker-gold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Player Performance
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Player</label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Choose a player..." />
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

              {selectedPlayer && (
                <>
                  <div className="p-4 bg-secondary rounded-lg">
                    <h3 className="text-base sm:text-lg font-semibold mb-3">{selectedPlayer.name} - Overall Stats</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 bg-background rounded">
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Games</div>
                        <div className="text-xl sm:text-2xl font-bold text-primary">{selectedPlayer.total_games}</div>
                      </div>
                      <div className="text-center p-3 bg-background rounded">
                        <div className="text-xs sm:text-sm text-muted-foreground">Total P&L</div>
                        <div className={`text-lg sm:text-2xl font-bold flex items-center justify-center gap-1 sm:gap-2 ${selectedPlayer.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedPlayer.total_profit >= 0 ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                          <span className="text-sm sm:text-2xl">
                            {selectedPlayer.total_profit >= 0 ? '+' : ''}{formatCurrency(selectedPlayer.total_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {playerGames.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-3">Game History</h3>
                      {playerGames.map((game) => (
                        <div key={game.gameId} className="space-y-3">
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="bg-secondary p-3">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">
                                  {new Date(game.date).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {game.buyIns} buy-in{game.buyIns > 1 ? 's' : ''}
                                  </Badge>
                                  <Badge variant={game.netAmount >= 0 ? "default" : "destructive"} className="text-xs whitespace-nowrap">
                                    {game.netAmount >= 0 ? '+' : ''}{formatCurrency(game.netAmount)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {gameTablePositions[game.gameId] && gameTablePositions[game.gameId]!.positions.length > 0 && (
                              <div className="p-4 bg-card">
                                <h4 className="text-sm font-medium mb-2">Table Position (Peak)</h4>
                                <PokerTableView positions={gameTablePositions[game.gameId]!.positions} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No games found for this player.
                    </p>
                  )}
                </>
              )}

              {!selectedPlayerId && (
                <p className="text-muted-foreground text-center py-8">
                  Select a player to view their performance.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default PlayerPerformance;
