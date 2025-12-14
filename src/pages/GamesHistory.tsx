import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, Badge, Button, Select, Modal, Stack, Text, Group, ActionIcon, Loader } from "@mantine/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatIndianNumber, getProfitLossColor, formatProfitLoss } from "@/lib/utils";

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

type SortField = "date" | "buy_in" | "players" | "chips";
type SortOrder = "asc" | "desc" | null;

const GamesHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const { data: gamesData, error } = await supabase
        .from("games")
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
        .eq("user_id", user?.id)
        .eq("is_complete", true)
        .order("date", { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gamesWithStats: GameWithStats[] = (gamesData || []).map((game: any) => {
        const playerCount = game.game_players?.length || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        const totalPot = totalBuyIns * game.buy_in_amount;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const playerNames = game.game_players?.map((gp: any) => gp.player?.name || "").filter(Boolean) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gamePlayers = game.game_players?.map((gp: any) => ({
          player_name: gp.player?.name || "",
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
      console.error("Error fetching games:", error);
      toast.error("Failed to load games history");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    try {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId);

      if (error) throw error;

      toast.success("Game deleted successfully");
      fetchGames();
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    } finally {
      setDeleteGameId(null);
    }
  }, [fetchGames]);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user, fetchGames]);

  const uniqueDates = useMemo(() => {
    const dates = games.map((game) => format(new Date(game.date), "MMM d, yyyy"));
    return Array.from(new Set(dates)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const uniqueMonthYears = useMemo(() => {
    const monthYears = games.map((game) => format(new Date(game.date), "MMM yyyy"));
    return Array.from(new Set(monthYears)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [games]);

  const uniquePlayers = useMemo(() => {
    const players = games.flatMap((game) => game.player_names);
    return Array.from(new Set(players)).sort();
  }, [games]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter((game) => {
      const gameDate = format(new Date(game.date), "MMM d, yyyy");
      const monthYear = format(new Date(game.date), "MMM yyyy");
      
      if (selectedDate !== "all" && gameDate !== selectedDate) return false;
      if (selectedMonthYear !== "all" && monthYear !== selectedMonthYear) return false;
      if (selectedPlayer !== "all" && !game.player_names.includes(selectedPlayer)) return false;
      
      return true;
    });

    if (sortField && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;
        
        switch (sortField) {
          case "date":
            aVal = new Date(a.date).getTime();
            bVal = new Date(b.date).getTime();
            break;
          case "buy_in":
            aVal = a.buy_in_amount;
            bVal = b.buy_in_amount;
            break;
          case "players":
            aVal = a.player_count;
            bVal = b.player_count;
            break;
          case "chips":
            aVal = a.total_pot;
            bVal = b.total_pot;
            break;
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [games, selectedDate, selectedMonthYear, selectedPlayer, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder className="max-w-6xl mx-auto">
        <Stack gap="sm">
          <Text size="xl" fw={700}>Games History</Text>
          <Text size="sm" c="dimmed">No completed games yet</Text>
          <Text c="dimmed" ta="center" py="xl">
            Start your first game to see it here!
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Text size="xl" fw={700} className="sm:text-2xl">Games History</Text>
            <Text size="sm" c="dimmed">View all your completed poker games</Text>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Select
              value={selectedDate}
              onChange={(value) => setSelectedDate(value || "all")}
              placeholder="Filter by date"
              data={[
                { value: "all", label: "All Dates" },
                ...uniqueDates.map((date) => ({ value: date, label: date }))
              ]}
              clearable={false}
            />

            <Select
              value={selectedMonthYear}
              onChange={(value) => setSelectedMonthYear(value || "all")}
              placeholder="Filter by month-year"
              data={[
                { value: "all", label: "All Months" },
                ...uniqueMonthYears.map((monthYear) => ({ value: monthYear, label: monthYear }))
              ]}
              clearable={false}
            />

            <Select
              value={selectedPlayer}
              onChange={(value) => setSelectedPlayer(value || "all")}
              placeholder="Filter by player"
              data={[
                { value: "all", label: "All Players" },
                ...uniquePlayers.map((player) => ({ value: player, label: player }))
              ]}
              clearable={false}
            />
          </div>
        </Stack>
      </Card>

      <Card shadow="sm" padding="md" radius="md" withBorder>
        <div className="space-y-2 sm:space-y-3">
          {/* Desktop Header */}
          <div className="hidden md:block rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-2 sm:gap-4 bg-primary text-white p-3 sm:p-4">
              <Button
                variant="subtle"
                onClick={() => handleSort("date")}
                className="flex items-center gap-2 justify-start font-bold text-white hover:bg-white/10"
              >
                Date
                {getSortIcon("date")}
              </Button>
              <Button
                variant="subtle"
                onClick={() => handleSort("buy_in")}
                className="flex items-center gap-2 justify-start font-bold text-white hover:bg-white/10"
              >
                Buy-in
                {getSortIcon("buy_in")}
              </Button>
              <Button
                variant="subtle"
                onClick={() => handleSort("players")}
                className="flex items-center gap-2 justify-center font-bold text-white hover:bg-white/10"
              >
                # Players
                {getSortIcon("players")}
              </Button>
              <Button
                variant="subtle"
                onClick={() => handleSort("chips")}
                className="flex items-center gap-2 justify-start font-bold text-white hover:bg-white/10"
              >
                Chips in play
                {getSortIcon("chips")}
              </Button>
              {selectedPlayer !== "all" && (
                <div className="flex items-center justify-start px-4 font-bold text-white">
                  Player P&L
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-1 bg-primary text-white p-2 text-xs">
              <Button
                variant="subtle"
                onClick={() => handleSort("date")}
                className="flex items-center gap-1 justify-start font-bold text-white hover:bg-white/10 text-xs p-1 h-auto"
              >
                Date
                {getSortIcon("date")}
              </Button>
              <Button
                variant="subtle"
                onClick={() => handleSort("buy_in")}
                className="flex items-center gap-1 justify-center font-bold text-white hover:bg-white/10 text-xs p-1 h-auto"
              >
                Buy-in
                {getSortIcon("buy_in")}
              </Button>
              <Button
                variant="subtle"
                onClick={() => handleSort("players")}
                className="flex items-center gap-1 justify-center font-bold text-white hover:bg-white/10 text-xs p-1 h-auto"
              >
                Players
                {getSortIcon("players")}
              </Button>
              <div className="flex items-center justify-center font-bold text-xs text-white">
                Chips
              </div>
              <div className="flex items-center justify-center font-bold text-xs text-white">
                {selectedPlayer !== "all" ? "P&L" : "Action"}
              </div>
            </div>
          </div>

            {filteredAndSortedGames.map((game, index) => {
              const playerData = game.game_players.find(
                (gp) => gp.player_name === selectedPlayer
              );
              
              return (
                <Card
                  key={game.id}
                  shadow="sm"
                  padding="sm"
                  radius="md"
                  withBorder
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  {/* Mobile Layout - Grid to match header */}
                  <div className="md:hidden">
                    <div className="grid grid-cols-5 gap-1 items-center text-xs">
                      <Text fw={500} size="xs" truncate>{format(new Date(game.date), "MMM d")}</Text>
                      <div className="flex items-center justify-center">
                        <Text fw={600} size="xs" ta="center">{formatIndianNumber(game.buy_in_amount)}</Text>
                      </div>
                      <div className="flex items-center justify-center">
                        <Text fw={500} size="xs" ta="center">{game.player_count}</Text>
                      </div>
                      <div className="flex items-center justify-center">
                        <Text fw={600} size="xs" ta="center">{formatIndianNumber(game.total_pot)}</Text>
                      </div>
                      <div className="flex items-center justify-center">
                        {selectedPlayer !== "all" ? (
                          playerData && (
                            <Badge color={getProfitLossColor(playerData.net_amount)} size="sm">
                              {formatProfitLoss(playerData.net_amount)}
                            </Badge>
                          )
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGameId(game.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </ActionIcon>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-5 gap-4 items-center text-sm h-12">
                    <Text fw={500}>
                      {format(new Date(game.date), "MMM d, yyyy")}
                    </Text>
                    <Text fw={600}>
                      Rs. {formatIndianNumber(game.buy_in_amount)}
                    </Text>
                    <div className="flex items-center justify-center">
                      <Text fw={500}>{game.player_count}</Text>
                    </div>
                    <Text fw={600}>
                      Rs. {formatIndianNumber(game.total_pot)}
                    </Text>
                    {selectedPlayer !== "all" && playerData ? (
                      <div>
                        <Badge color={getProfitLossColor(playerData.net_amount)}>
                          {formatProfitLoss(playerData.net_amount)}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-start">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteGameId(game.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      </Card>

      <Modal
        opened={!!deleteGameId}
        onClose={() => setDeleteGameId(null)}
        title="Delete Game"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this game? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setDeleteGameId(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => deleteGameId && handleDeleteGame(deleteGameId)}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default GamesHistory;
