import { SessionStats } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, DollarSign, Zap, Trophy, BarChart2, Repeat } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

function StatCard({ label, value, subValue, icon, valueClassName }: StatCardProps) {
  return (
    <div className="p-5 rounded-xl border border-border bg-accent/5 space-y-3 group hover:bg-accent/10 hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <p className="text-label text-muted-foreground">
          {label}
        </p>
        <div className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
          {icon}
        </div>
      </div>
      <p className={cn('text-xl xs:text-2xl sm:text-3xl font-numbers leading-none', valueClassName)}>
        {value}
      </p>
      {subValue && (
        <p className="text-3xs font-luxury tracking-wide text-muted-foreground/50 leading-tight">{subValue}</p>
      )}
    </div>
  );
}

interface PlayerStatsGridProps {
  stats: SessionStats;
}

export function PlayerStatsGrid({ stats }: PlayerStatsGridProps) {
  const {
    roi,
    totalInvested,
    avgProfitPerSession,
    avgBuyinsPerSession,
    biggestWin,
    biggestLoss,
    currentStreak,
    bestWinStreak,
  } = stats;

  const roiColor = roi > 0 ? 'text-state-success' : roi < 0 ? 'text-state-error' : 'text-foreground';
  const avgProfitColor = avgProfitPerSession > 0 ? 'text-state-success' : avgProfitPerSession < 0 ? 'text-state-error' : 'text-foreground';

  const streakLabel = currentStreak > 0 ? `${currentStreak}W` : currentStreak < 0 ? `${Math.abs(currentStreak)}L` : '—';
  const streakColor = currentStreak > 0 ? 'text-state-success' : currentStreak < 0 ? 'text-state-error' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      {/* Row 1 — Investment Performance */}
      <div>
        <p className="text-label text-muted-foreground/50 mb-2 px-0.5">Investment</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="ROI"
            value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}
            subValue="Return on investment"
            icon={<Target className="h-3.5 w-3.5" />}
            valueClassName={roiColor}
          />
          <StatCard
            label="Avg / Session"
            value={`${avgProfitPerSession >= 0 ? '+' : ''}${formatCurrency(Math.abs(avgProfitPerSession))}`}
            subValue="Per session average"
            icon={<BarChart2 className="h-3.5 w-3.5" />}
            valueClassName={avgProfitColor}
          />
          <StatCard
            label="Total Invested"
            value={formatCurrency(totalInvested)}
            subValue="Capital risked"
            icon={<DollarSign className="h-3.5 w-3.5" />}
            valueClassName="text-foreground"
          />
        </div>
      </div>

      {/* Row 2 — Session Range */}
      <div>
        <p className="text-label text-muted-foreground/50 mb-2 px-0.5">Session Range</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Best Session"
            value={biggestWin > 0 ? `+${formatCurrency(biggestWin)}` : '—'}
            subValue="Biggest single win"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            valueClassName="text-state-success"
          />
          <StatCard
            label="Worst Session"
            value={biggestLoss < 0 ? formatCurrency(biggestLoss) : '—'}
            subValue="Biggest single loss"
            icon={<TrendingDown className="h-3.5 w-3.5" />}
            valueClassName="text-state-error"
          />
        </div>
      </div>

      {/* Row 3 — Momentum & Habit */}
      <div>
        <p className="text-label text-muted-foreground/50 mb-2 px-0.5">Momentum</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="Current Streak"
            value={streakLabel}
            subValue={currentStreak > 0 ? 'Winning run' : currentStreak < 0 ? 'Losing run' : 'No active streak'}
            icon={<Zap className="h-3.5 w-3.5" />}
            valueClassName={streakColor}
          />
          <StatCard
            label="Best Win Streak"
            value={bestWinStreak > 0 ? `${bestWinStreak}W` : '—'}
            subValue="Longest winning run"
            icon={<Trophy className="h-3.5 w-3.5" />}
            valueClassName="text-state-success"
          />
          <StatCard
            label="Avg Buy-ins"
            value={avgBuyinsPerSession.toFixed(1)}
            subValue="Per session"
            icon={<Repeat className="h-3.5 w-3.5" />}
            valueClassName="text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
