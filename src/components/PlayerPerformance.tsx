import React, { useState, useMemo, useEffect } from "react";
import { Card, Badge, Collapse, Select, Stack, Group, Text, Box } from "@mantine/core";
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
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Box 
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: 'pointer' }}
          className="hover:bg-muted/50 transition-colors"
          p="xs"
        >
          <Group justify="space-between">
            <Group gap="xs">
              <User className="w-5 h-5 text-poker-gold" />
              <Text size="lg" fw={700} className="text-poker-gold">Player Performance</Text>
            </Group>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Group>
        </Box>

        <Collapse in={isOpen}>
          <Stack gap="lg">
            <Box>
              <Text size="sm" fw={500} mb="xs">Select Player</Text>
              <Select
                value={selectedPlayerId}
                onChange={(value) => setSelectedPlayerId(value || "")}
                placeholder="Choose a player..."
                data={sortedPlayers.map(player => ({
                  value: player.id,
                  label: player.name
                }))}
              />
            </Box>

            {selectedPlayer && (
              <>
                <Box p="md" className="bg-secondary rounded-lg">
                  <Text size="lg" fw={600} mb="sm">{selectedPlayer.name} - Overall Stats</Text>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Box ta="center" p="sm" className="bg-background rounded">
                      <Text size="sm" c="dimmed">Total Games</Text>
                      <Text size="xl" fw={700} c="var(--mantine-primary-color-filled)">{selectedPlayer.total_games}</Text>
                    </Box>
                    <Box ta="center" p="sm" className="bg-background rounded">
                      <Text size="sm" c="dimmed">Total P&L</Text>
                      <Group justify="center" gap="xs" className={selectedPlayer.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {selectedPlayer.total_profit >= 0 ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        <Text size="xl" fw={700} span>
                          {selectedPlayer.total_profit >= 0 ? '+' : ''}{formatCurrency(selectedPlayer.total_profit)}
                        </Text>
                      </Group>
                    </Box>
                  </div>
                </Box>

                {playerGames.length > 0 ? (
                  <Stack gap="md">
                    <Text size="lg" fw={600} mb="sm">Game History</Text>
                    {playerGames.map((game) => (
                      <Box key={game.gameId}>
                        <Card shadow="xs" padding="sm" radius="md" withBorder>
                          <Stack gap="xs">
                            <Box className="bg-secondary" p="sm" style={{ borderRadius: '8px' }}>
                              <Group justify="space-between" align="center">
                                <Text fw={600}>
                                  {new Date(game.date).toLocaleDateString()}
                                </Text>
                                <Group gap="xs">
                                  <Badge variant="outline" size="sm">
                                    {game.buyIns} buy-in{game.buyIns > 1 ? 's' : ''}
                                  </Badge>
                                  <Badge 
                                    color={game.netAmount >= 0 ? "green" : "red"} 
                                    size="sm"
                                  >
                                    {game.netAmount >= 0 ? '+' : ''}{formatCurrency(game.netAmount)}
                                  </Badge>
                                </Group>
                              </Group>
                            </Box>
                            {gameTablePositions[game.gameId] && gameTablePositions[game.gameId]!.positions.length > 0 && (
                              <Box p="sm" className="bg-card">
                                <Text size="sm" fw={500} mb="xs">Table Position (Peak)</Text>
                                <PokerTableView positions={gameTablePositions[game.gameId]!.positions} />
                              </Box>
                            )}
                          </Stack>
                        </Card>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No games found for this player.
                  </Text>
                )}
              </>
            )}

            {!selectedPlayerId && (
              <Text c="dimmed" ta="center" py="xl">
                Select a player to view their performance.
              </Text>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};

export default PlayerPerformance;
