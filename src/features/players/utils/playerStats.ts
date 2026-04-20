import { format, parseISO, subMonths, startOfYear, subYears } from 'date-fns';
import {
  DashboardFilters,
  DashboardGameHistory,
  SessionStats,
  MonthlyStats,
  CumulativePnLPoint,
  DistributionBucket,
} from '@/types/poker';

export const DEFAULT_FILTERS: DashboardFilters = {
  timePeriod: 'all',
  month: 'all',
  stakes: 'all',
  result: 'all',
};

// ─── Filter Application ────────────────────────────────────────────────────

export function applyFilters(
  history: DashboardGameHistory[],
  filters: DashboardFilters,
): DashboardGameHistory[] {
  const now = new Date();

  return history.filter((game) => {
    const gameDate = parseISO(game.games.date);

    // Time period filter
    if (filters.timePeriod !== 'all') {
      if (filters.timePeriod === 'lastyear') {
        const startLastYear = startOfYear(subYears(now, 1));
        const endLastYear = startOfYear(now);
        if (gameDate < startLastYear || gameDate >= endLastYear) return false;
      } else {
        let cutoff: Date;
        switch (filters.timePeriod) {
          case '3m': cutoff = subMonths(now, 3); break;
          case '6m': cutoff = subMonths(now, 6); break;
          case 'ytd': cutoff = startOfYear(now); break;
          default: cutoff = new Date(0);
        }
        if (gameDate < cutoff) return false;
      }
    }

    // Month filter (specific month-year)
    if (filters.month !== 'all') {
      const gameMonth = format(gameDate, 'MMM yyyy');
      if (gameMonth !== filters.month) return false;
    }

    return applyMonthStakesResult(game, filters);
  });
}

function applyMonthStakesResult(
  game: DashboardGameHistory,
  filters: DashboardFilters,
): boolean {
  // Stakes filter
  if (filters.stakes !== 'all') {
    if (game.games.buy_in_amount !== filters.stakes) return false;
  }

  // Result filter
  if (filters.result === 'wins' && game.net_amount <= 0) return false;
  if (filters.result === 'losses' && game.net_amount >= 0) return false;

  return true;
}

// ─── Available Months ─────────────────────────────────────────────────────

export function getAvailableMonths(history: DashboardGameHistory[]): string[] {
  const months = history.map((g) => format(parseISO(g.games.date), 'MMM yyyy'));
  const unique = Array.from(new Set(months));
  // Sort newest first
  return unique.sort((a, b) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  });
}

// ─── Available Stakes ─────────────────────────────────────────────────────

export function getAvailableStakes(history: DashboardGameHistory[]): number[] {
  const stakes = history.map((g) => g.games.buy_in_amount);
  const unique = Array.from(new Set(stakes));
  return unique.sort((a, b) => a - b);
}

// ─── Session Stats ─────────────────────────────────────────────────────────

export function computeSessionStats(history: DashboardGameHistory[]): SessionStats {
  if (history.length === 0) {
    return {
      totalGames: 0,
      totalProfit: 0,
      totalInvested: 0,
      roi: 0,
      winRate: 0,
      avgProfitPerSession: 0,
      avgBuyinsPerSession: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      bestWinStreak: 0,
    };
  }

  const totalProfit = history.reduce((sum, g) => sum + g.net_amount, 0);
  const totalInvested = history.reduce(
    (sum, g) => sum + g.buy_ins * g.games.buy_in_amount,
    0,
  );
  const wins = history.filter((g) => g.net_amount > 0);
  const netAmounts = history.map((g) => g.net_amount);

  const biggestWin = wins.length > 0 ? Math.max(...wins.map((g) => g.net_amount)) : 0;
  const losses = history.filter((g) => g.net_amount < 0);
  const biggestLoss = losses.length > 0 ? Math.min(...losses.map((g) => g.net_amount)) : 0;

  // Sort by date ascending for streak calculation
  const sorted = [...history].sort(
    (a, b) => parseISO(a.games.date).getTime() - parseISO(b.games.date).getTime(),
  );

  // Current streak: walk backward from most recent
  let currentStreak = 0;
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    const isWinStreak = last.net_amount > 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const isWin = sorted[i].net_amount > 0;
      if (isWin === isWinStreak) {
        currentStreak += isWinStreak ? 1 : -1;
      } else {
        break;
      }
    }
  }

  // Best win streak
  let bestWinStreak = 0;
  let runningWins = 0;
  for (const g of sorted) {
    if (g.net_amount > 0) {
      runningWins++;
      bestWinStreak = Math.max(bestWinStreak, runningWins);
    } else {
      runningWins = 0;
    }
  }

  return {
    totalGames: history.length,
    totalProfit,
    totalInvested,
    roi: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0,
    winRate: history.length > 0 ? (wins.length / history.length) * 100 : 0,
    avgProfitPerSession: history.length > 0 ? totalProfit / history.length : 0,
    avgBuyinsPerSession:
      history.length > 0
        ? history.reduce((sum, g) => sum + g.buy_ins, 0) / history.length
        : 0,
    biggestWin,
    biggestLoss,
    currentStreak,
    bestWinStreak,
    netAmounts,
  } as SessionStats & { netAmounts: number[] };
}

// ─── Cumulative P&L ───────────────────────────────────────────────────────

export function computeCumulativePnL(history: DashboardGameHistory[]): CumulativePnLPoint[] {
  // Sort ascending by date
  const sorted = [...history].sort(
    (a, b) => parseISO(a.games.date).getTime() - parseISO(b.games.date).getTime(),
  );

  let running = 0;
  return sorted.map((g) => {
    running += g.net_amount;
    return {
      date: format(parseISO(g.games.date), 'MMM d'),
      rawDate: g.games.date,
      sessionPnl: g.net_amount,
      cumulative: running,
    };
  });
}

// ─── Monthly Stats ────────────────────────────────────────────────────────

export function computeMonthlyStats(history: DashboardGameHistory[]): MonthlyStats[] {
  const map = new Map<string, { profit: number; sessions: number; wins: number }>();

  for (const g of history) {
    const key = format(parseISO(g.games.date), 'yyyy-MM');
    const label = format(parseISO(g.games.date), 'MMM yyyy');
    const existing = map.get(key) || { profit: 0, sessions: 0, wins: 0 };
    existing.profit += g.net_amount;
    existing.sessions += 1;
    if (g.net_amount > 0) existing.wins += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      monthKey: key,
      month: format(parseISO(`${key}-01`), 'MMM yyyy'),
      profit: val.profit,
      sessions: val.sessions,
      winRate: val.sessions > 0 ? (val.wins / val.sessions) * 100 : 0,
    }));
}

// ─── Session Distribution ─────────────────────────────────────────────────

export function computeDistribution(history: DashboardGameHistory[]): DistributionBucket[] {
  // Determine a reasonable scale from the data
  const amounts = history.map((g) => g.net_amount);
  const maxAbs = amounts.length > 0 ? Math.max(...amounts.map(Math.abs)) : 10000;

  // Use round thresholds that fit the data
  const scale = maxAbs <= 2000 ? 500 : maxAbs <= 10000 ? 1000 : maxAbs <= 50000 ? 5000 : 10000;
  const label = scale >= 1000 ? `${scale / 1000}k` : `${scale}`;

  const buckets: { label: string; min: number; max: number; isProfit: boolean }[] = [
    { label: `< -${label}`, min: -Infinity, max: -scale, isProfit: false },
    { label: `-${label} to 0`, min: -scale, max: 0, isProfit: false },
    { label: `0 to ${label}`, min: 0, max: scale, isProfit: true },
    { label: `> ${label}`, min: scale, max: Infinity, isProfit: true },
  ];

  return buckets.map((b) => ({
    label: b.label,
    count: history.filter((g) => g.net_amount >= b.min && g.net_amount < b.max).length,
    isProfit: b.isProfit,
  }));
}

// ─── Active Filter Count ──────────────────────────────────────────────────

export function activeFilterCount(filters: DashboardFilters): number {
  let count = 0;
  if (filters.timePeriod !== 'all') count++;
  if (filters.month !== 'all') count++;
  if (filters.stakes !== 'all') count++;
  if (filters.result !== 'all') count++;
  return count;
}
