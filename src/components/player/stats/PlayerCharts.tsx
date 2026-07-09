import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CumulativePnLChart } from './CumulativePnLChart';
import { MonthlyPnLChart } from './MonthlyPnLChart';
import { SessionDistributionChart } from './SessionDistributionChart';
import { CumulativePnLPoint, MonthlyStats, DistributionBucket } from '@/types/poker';
import { TrendingUp, Calendar, BarChart2 } from 'lucide-react';

interface PlayerChartsProps {
  cumulativePnL: CumulativePnLPoint[];
  monthlyStats: MonthlyStats[];
  distribution: DistributionBucket[];
  totalSessions: number;
}

const TAB_DESCRIPTIONS: Record<string, string> = {
  performance: 'Cumulative P&L across all sessions — your bankroll curve',
  monthly: 'Net profit & loss grouped by calendar month',
  distribution: 'How often your sessions land in each outcome range',
};

export function PlayerCharts({ cumulativePnL, monthlyStats, distribution, totalSessions }: PlayerChartsProps) {
  if (totalSessions < 2) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-border bg-accent/5 text-center space-y-3">
        <TrendingUp className="h-7 w-7 mx-auto text-muted-foreground/25" />
        <div>
          <p className="text-label text-muted-foreground/40">Analytics Locked</p>
          <p className="text-3xs font-body text-muted-foreground/30 mt-1">Play at least 2 sessions to unlock charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 backdrop-blur-xl overflow-hidden shadow-sm">
      <div className="px-5 pt-5 pb-4 border-b border-border bg-accent/5">
        <h3 className="text-base font-luxury font-semibold text-foreground">Analytics</h3>
        <p className="text-label text-muted-foreground mt-0.5">Session performance charts</p>
      </div>

      <div className="p-4 sm:p-5">
        <Tabs defaultValue="performance">
          <TabsList className="mb-5 h-9 w-full sm:w-auto bg-accent/10 border border-border/50 p-0.5 gap-0.5">
            <TabsTrigger
              value="performance"
              className="h-8 text-label px-3 sm:px-4 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span className="hidden xs:inline">Performance</span>
              <span className="xs:hidden">Trend</span>
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="h-8 text-label px-3 sm:px-4 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="h-3 w-3 shrink-0" />
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="h-8 text-label px-3 sm:px-4 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart2 className="h-3 w-3 shrink-0" />
              <span className="hidden xs:inline">Distribution</span>
              <span className="xs:hidden">Split</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-0 animate-in fade-in duration-300">
            <p className="text-label text-muted-foreground mb-3 leading-none">
              {TAB_DESCRIPTIONS.performance}
            </p>
            <CumulativePnLChart data={cumulativePnL} />
          </TabsContent>

          <TabsContent value="monthly" className="mt-0 animate-in fade-in duration-300">
            <p className="text-label text-muted-foreground mb-3 leading-none">
              {TAB_DESCRIPTIONS.monthly}
            </p>
            <MonthlyPnLChart data={monthlyStats} />
          </TabsContent>

          <TabsContent value="distribution" className="mt-0 animate-in fade-in duration-300">
            <p className="text-label text-muted-foreground mb-3 leading-none">
              {TAB_DESCRIPTIONS.distribution}
            </p>
            <SessionDistributionChart data={distribution} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
