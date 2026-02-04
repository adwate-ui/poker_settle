import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGames } from "@/features/game/hooks/useGames";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { DashboardSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/utils/currencyUtils";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Gamepad2,
  Trophy,
  Target,
  Calendar,
  DollarSign,
  Award,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const Analytics = () => {
  const { user } = useAuth();
  const { data: gamesData, isLoading: gamesLoading } = useGames(user?.id);
  const { data: playersData, isLoading: playersLoading } = usePlayers(user?.id);

  const loading = gamesLoading || playersLoading;
  const games = gamesData || [];
  const players = playersData || [];

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!games.length) return null;

    const completedGames = games.filter((g: any) => g.is_complete);
    const totalGames = completedGames.length;
    const totalPlayers = players.length;

    // Calculate total money moved (sum of all buy-ins)
    let totalMoneyMoved = 0;
    let totalBuyIns = 0;
    let avgPlayersPerGame = 0;
    let avgPotSize = 0;

    completedGames.forEach((game: any) => {
      const gameBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
      const gamePot = gameBuyIns * game.buy_in_amount;
      totalMoneyMoved += gamePot;
      totalBuyIns += gameBuyIns;
      avgPlayersPerGame += game.game_players?.length || 0;
    });

    if (totalGames > 0) {
      avgPlayersPerGame = avgPlayersPerGame / totalGames;
      avgPotSize = totalMoneyMoved / totalGames;
    }

    // Calculate profit distribution
    const profitablePlayers = players.filter((p: any) => (p.total_profit || 0) > 0);
    const losingPlayers = players.filter((p: any) => (p.total_profit || 0) < 0);
    const breakEvenPlayers = players.filter((p: any) => (p.total_profit || 0) === 0);

    // Get top performers
    const topWinners = [...players]
      .sort((a: any, b: any) => (b.total_profit || 0) - (a.total_profit || 0))
      .slice(0, 5);

    const topLosers = [...players]
      .sort((a: any, b: any) => (a.total_profit || 0) - (b.total_profit || 0))
      .slice(0, 5);

    // Most active players
    const mostActive = [...players]
      .sort((a: any, b: any) => (b.total_games || 0) - (a.total_games || 0))
      .slice(0, 5);

    // Monthly trend data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthGames = completedGames.filter((g: any) => {
        const gameDate = new Date(g.date);
        return isWithinInterval(gameDate, { start: monthStart, end: monthEnd });
      });

      let monthPot = 0;
      let monthWinnings = 0;
      let monthLosses = 0;

      monthGames.forEach((game: any) => {
        const gameBuyIns = game.game_players?.reduce((sum: number, gp: any) => sum + (gp.buy_ins || 0), 0) || 0;
        monthPot += gameBuyIns * game.buy_in_amount;

        game.game_players?.forEach((gp: any) => {
          if ((gp.net_amount || 0) > 0) {
            monthWinnings += gp.net_amount;
          } else {
            monthLosses += Math.abs(gp.net_amount || 0);
          }
        });
      });

      monthlyData.push({
        month: format(monthDate, "MMM"),
        games: monthGames.length,
        pot: monthPot,
        winnings: monthWinnings,
        losses: monthLosses,
      });
    }

    // Buy-in distribution
    const buyInDistribution: Record<string, number> = {};
    completedGames.forEach((g: any) => {
      const buyIn = formatCurrency(g.buy_in_amount);
      buyInDistribution[buyIn] = (buyInDistribution[buyIn] || 0) + 1;
    });

    const buyInChartData = Object.entries(buyInDistribution).map(([name, value]) => ({
      name,
      value,
    }));

    // Recent streaks
    const recentGames = completedGames.slice(0, 10);

    return {
      totalGames,
      totalPlayers,
      totalMoneyMoved,
      totalBuyIns,
      avgPlayersPerGame: avgPlayersPerGame.toFixed(1),
      avgPotSize,
      profitablePlayers: profitablePlayers.length,
      losingPlayers: losingPlayers.length,
      breakEvenPlayers: breakEvenPlayers.length,
      topWinners,
      topLosers,
      mostActive,
      monthlyData,
      buyInChartData,
      recentGames,
    };
  }, [games, players]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Analytics Yet"
        description="Start playing some games to see your statistics and insights here. Analytics will show trends, top performers, and more!"
      />
    );
  }

  const COLORS = ["#d4b83c", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-luxury font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your poker performance insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Games</p>
                <p className="text-2xl font-bold">{stats.totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-state-success/5 to-transparent border-state-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-state-success/10">
                <DollarSign className="h-5 w-5 text-state-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Money Moved</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalMoneyMoved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-state-info/5 to-transparent border-state-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-state-info/10">
                <Users className="h-5 w-5 text-state-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Players</p>
                <p className="text-2xl font-bold">{stats.totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-state-warning/5 to-transparent border-state-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-state-warning/10">
                <Target className="h-5 w-5 text-state-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Pot Size</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.avgPotSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Monthly Activity</CardTitle>
            </div>
            <CardDescription>Games and pot size over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData}>
                  <defs>
                    <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4b83c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4b83c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total Pot"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="pot"
                    stroke="#d4b83c"
                    strokeWidth={2}
                    fill="url(#potGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Buy-in Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Buy-in Distribution</CardTitle>
            </div>
            <CardDescription>Most common buy-in amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.buyInChartData} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} games`, "Count"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.buyInChartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Winners */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Top Winners</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topWinners.slice(0, 5).map((player: any, index: number) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                      index === 1 ? "bg-gray-400/20 text-gray-400" :
                        index === 2 ? "bg-orange-600/20 text-orange-600" :
                          "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
                <Badge variant="profit">+{formatCurrency(player.total_profit || 0)}</Badge>
              </div>
            ))}
            {stats.topWinners.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No winners yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-state-error" />
              <CardTitle className="text-lg">Biggest Losers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topLosers.filter((p: any) => (p.total_profit || 0) < 0).slice(0, 5).map((player: any, index: number) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-state-error/20 text-state-error">
                    {index + 1}
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
                <Badge variant="loss">{formatCurrency(player.total_profit || 0)}</Badge>
              </div>
            ))}
            {stats.topLosers.filter((p: any) => (p.total_profit || 0) < 0).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No losers yet</p>
            )}
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Most Active</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.mostActive.map((player: any, index: number) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-orange-500/20 text-orange-500" : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
                <Badge variant="secondary">{player.total_games || 0} games</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Player Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
          </div>
          <CardDescription>Player performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Winners", value: stats.profitablePlayers, fill: "#10b981" },
                      { name: "Losers", value: stats.losingPlayers, fill: "#ef4444" },
                      { name: "Break Even", value: stats.breakEvenPlayers, fill: "#6b7280" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-state-success" />
                <span className="text-sm">Winners: {stats.profitablePlayers} players</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-state-error" />
                <span className="text-sm">Losers: {stats.losingPlayers} players</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <span className="text-sm">Break Even: {stats.breakEvenPlayers} players</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Players/Game</p>
            <p className="text-3xl font-bold text-primary">{stats.avgPlayersPerGame}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Buy-ins</p>
            <p className="text-3xl font-bold text-primary">{stats.totalBuyIns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-state-success">
              {stats.totalPlayers > 0 ? Math.round((stats.profitablePlayers / stats.totalPlayers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Games This Month</p>
            <p className="text-3xl font-bold text-primary">
              {stats.monthlyData[stats.monthlyData.length - 1]?.games || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
