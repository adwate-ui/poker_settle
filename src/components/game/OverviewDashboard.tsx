import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useActiveGame } from "@/hooks/useActiveGame";
import { useGames } from "@/features/game/hooks/useGames";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { GameCardSkeletonList } from "@/components/skeletons";
import { StatTile } from "@/components/ui-primitives/StatTile";
import { formatCurrency } from "@/utils/currencyUtils";
import { Play, ArrowRight, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const OverviewDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGame } = useActiveGame(user?.id);
  const { data: games, isLoading } = useGames(user?.id);
  const { data: players } = usePlayers(user?.id);
  const recentGames = (games ?? []).slice(0, 3);

  const lifetimeStats = useMemo(() => {
    const allGames = games ?? [];
    const totalGames = allGames.length;
    const totalPot = allGames.reduce((sum, game) => {
      const buyIns = game.game_players?.reduce((s, gp) => s + (gp.buy_ins || 0), 0) || 0;
      return sum + buyIns * game.buy_in_amount;
    }, 0);
    return { totalGames, totalPot, playersTracked: (players ?? []).length };
  }, [games, players]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {activeGame && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-luxury text-lg text-foreground">Game in progress</p>
                <p className="text-sm text-muted-foreground">Pick up where you left off.</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/games/${activeGame.id}`)} className="w-full sm:w-auto">
              Resume <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && lifetimeStats.totalGames > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatTile label="Total Games" value={lifetimeStats.totalGames} />
          <StatTile label="Total Pot" value={formatCurrency(lifetimeStats.totalPot)} valueClassName="text-primary" />
          <StatTile label="Players Tracked" value={lifetimeStats.playersTracked} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-luxury">Ready for a session?</CardTitle>
            <CardDescription>Set buy-ins, add players, and start tracking.</CardDescription>
          </div>
          <Button
            onClick={() => navigate("/new")}
            disabled={!!activeGame}
            className="h-11 font-luxury w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-2" /> New Game
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <GameCardSkeletonList count={3} />
          ) : recentGames.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="No Games Yet"
              description="Start your first game to begin tracking buy-ins, stacks, and settlements!"
              action={{ label: "Start a Game", onClick: () => navigate("/new") }}
            />
          ) : (
            <div className="space-y-2">
              {recentGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => navigate(`/games/${game.id}`)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-accent/5 transition-colors text-left",
                    (game.game_players?.length ?? 0) === 0 && "opacity-50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{format(new Date(game.date), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {(game.game_players?.length ?? 0) === 0 ? "Draft — no players added" : `${game.game_players?.length} players`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-numbers text-sm text-foreground">{formatCurrency(game.buy_in_amount)}</p>
                    <p className="text-xs text-muted-foreground">Buy-in</p>
                  </div>
                </button>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => navigate("/games")}>
                View All Games <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
