import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, Button, Badge, Stack, Group, Text, Box, Modal } from "@mantine/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notifications";
import { Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Player } from "@/types/poker";
import { formatIndianNumber } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import OptimizedAvatar from "@/components/OptimizedAvatar";

type SortField = "name" | "total_games" | "total_profit";
type SortOrder = "asc" | "desc" | null;

const PlayersHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeletePlayer = useCallback(async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;

      toast.success("Player deleted successfully");
      fetchPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    } finally {
      setDeletePlayerId(null);
    }
  }, [fetchPlayers]);

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user, fetchPlayers]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField("name");
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          if (sortOrder === "asc") return aVal < bVal ? -1 : 1;
          return aVal > bVal ? -1 : 1;
        case "total_games":
          aVal = a.total_games || 0;
          bVal = b.total_games || 0;
          break;
        case "total_profit":
          aVal = a.total_profit || 0;
          bVal = b.total_profit || 0;
          break;
      }
      
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [players, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder className="max-w-6xl mx-auto">
        <Stack gap="md">
          <Box>
            <Text size="xl" fw={700} mb={4}>Players History</Text>
            <Text size="sm" c="dimmed">No players yet</Text>
          </Box>
          <Text c="dimmed" ta="center" py="xl">
            Add players to your games to see their statistics here!
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Box>
          <Text size="xl" fw={700} mb={4}>Players Performance</Text>
          <Text size="sm" c="dimmed">Overall statistics for all players</Text>
        </Box>
      </Card>

      {/* Summary Stats - Moved to top */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Box p="md" className="rounded-lg border">
            <Text size="sm" c="dimmed">Total Players</Text>
            <Text size="xl" fw={700}>{players.length}</Text>
          </Box>
          <Box p="md" className="rounded-lg border">
            <Text size="sm" c="dimmed">Winning Players</Text>
            <Text size="xl" fw={700} className="text-green-600 dark:text-green-400">
              {players.filter(p => (p.total_profit || 0) >= 0).length}
            </Text>
          </Box>
          <Box p="md" className="rounded-lg border hidden md:block">
            <Text size="sm" c="dimmed">Total Games</Text>
            <Text size="xl" fw={700}>
              {players.reduce((sum, p) => sum + (p.total_games || 0), 0)}
            </Text>
          </Box>
        </div>
      </Card>

      <div className="space-y-2 sm:space-y-3">
        <div className="hidden md:block rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-4 bg-primary text-primary-foreground p-3 sm:p-4">
            <Button
              variant="ghost"
              onClick={() => handleSort("name")}
              className="flex items-center gap-2 justify-start font-bold text-primary-foreground hover:bg-primary-foreground/10"
            >
              Player Name
              {getSortIcon("name")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_games")}
              className="flex items-center gap-2 justify-start font-bold text-primary-foreground hover:bg-primary-foreground/10"
            >
              Games
              {getSortIcon("total_games")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSort("total_profit")}
              className="flex items-center gap-2 justify-start font-bold text-primary-foreground hover:bg-primary-foreground/10"
            >
              Net P&L
              {getSortIcon("total_profit")}
            </Button>
            <div className="flex items-center justify-start px-4 font-bold"></div>
          </div>
        </div>

        {sortedPlayers.map((player) => {
          const isProfit = (player.total_profit || 0) >= 0;

          return (
            <Card
              key={player.id}
              shadow="sm"
              padding="sm"
              radius="md"
              withBorder
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div 
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <OptimizedAvatar name={player.name} size="sm" />
                    <Text fw={700} size="sm" truncate>{player.name}</Text>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge color="blue" size="sm">{player.total_games || 0}</Badge>
                    <Badge color={isProfit ? "green" : "red"} size="sm">
                      {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                    </Badge>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePlayerId(player.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid grid-cols-4 gap-6 items-center text-sm h-12">
                <div 
                  className="flex items-center gap-4"
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <OptimizedAvatar name={player.name} size="md" />
                  <Text fw={700} size="md" truncate>{player.name}</Text>
                </div>
                
                <div 
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <Badge color="blue">{player.total_games || 0}</Badge>
                </div>
                
                <div 
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <Badge color={isProfit ? "green" : "red"}>
                    {isProfit ? "+" : ""}Rs. {formatIndianNumber(Math.abs(player.total_profit || 0))}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-start">
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePlayerId(player.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal 
        opened={!!deletePlayerId} 
        onClose={() => setDeletePlayerId(null)}
        title="Delete Player"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this player? This action cannot be undone and will remove all their game history.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeletePlayerId(null)}>
              Cancel
            </Button>
            <Button 
              color="red"
              onClick={() => deletePlayerId && handleDeletePlayer(deletePlayerId)}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default PlayersHistory;
