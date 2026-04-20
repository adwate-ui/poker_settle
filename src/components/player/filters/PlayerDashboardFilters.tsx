import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X } from 'lucide-react';
import { DashboardFilters } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';
import { activeFilterCount } from '@/features/players/utils/playerStats';

interface PlayerDashboardFiltersProps {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  availableMonths: string[];
  availableStakes: number[];
}

export function PlayerDashboardFilters({
  filters,
  setFilter,
  resetFilters,
  availableMonths,
  availableStakes,
}: PlayerDashboardFiltersProps) {
  const count = activeFilterCount(filters);

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-border bg-accent/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">
            Filter Sessions
          </span>
          {count > 0 && (
            <Badge variant="outline" className="h-4 px-1.5 text-3xs font-numbers text-primary border-primary/40">
              {count} active
            </Badge>
          )}
        </div>
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 px-2 text-3xs font-luxury uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {/* Time Period */}
        <div className="space-y-1.5">
          <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground px-0.5">Period</p>
          <Select
            value={filters.timePeriod}
            onValueChange={(v) => setFilter('timePeriod', v as DashboardFilters['timePeriod'])}
          >
            <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="ytd">This Year</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Month */}
        <div className="space-y-1.5">
          <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground px-0.5">Month</p>
          <Select
            value={filters.month}
            onValueChange={(v) => setFilter('month', v)}
          >
            <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stakes */}
        <div className="space-y-1.5">
          <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground px-0.5">Stakes</p>
          <Select
            value={String(filters.stakes)}
            onValueChange={(v) => setFilter('stakes', v === 'all' ? 'all' : Number(v))}
          >
            <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stakes</SelectItem>
              {availableStakes.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {formatCurrency(s)} games
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        <div className="space-y-1.5">
          <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground px-0.5">Result</p>
          <Select
            value={filters.result}
            onValueChange={(v) => setFilter('result', v as DashboardFilters['result'])}
          >
            <SelectTrigger className="h-9 text-xs font-body bg-background/60 border-border hover:border-primary/30 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="wins">Wins Only</SelectItem>
              <SelectItem value="losses">Losses Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
