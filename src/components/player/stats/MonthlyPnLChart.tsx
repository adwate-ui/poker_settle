import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyStats } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface MonthlyPnLChartProps {
  data: MonthlyStats[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: MonthlyStats }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isProfit = d.profit >= 0;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2.5 shadow-xl space-y-2 min-w-[148px]">
      <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">{d.month}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">P&L</span>
          <span className={cn('text-xs font-numbers font-semibold tabular-nums', isProfit ? 'text-state-success' : 'text-state-error')}>
            {isProfit ? '+' : ''}{formatCurrency(d.profit)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">Sessions</span>
          <span className="text-xs font-numbers text-foreground tabular-nums">{d.sessions}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">Win Rate</span>
          <span className="text-xs font-numbers text-foreground tabular-nums">{d.winRate.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export function MonthlyPnLChart({ data }: MonthlyPnLChartProps) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">No monthly data available</p>
      </div>
    );
  }

  const tickFormatter = (v: number) => {
    if (Math.abs(v) >= 100000) return `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(0)}k`;
    if (Math.abs(v) >= 1000) return `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(1)}k`;
    return String(Math.round(v));
  };

  return (
    <div className={cn('w-full', isMobile ? 'h-[190px]' : 'h-[260px]')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval={isMobile ? 'preserveStartEnd' : 0}
            tickFormatter={(v: string) => isMobile ? v.split(' ')[0] : v}
          />
          <YAxis
            tickFormatter={tickFormatter}
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 32 : 40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.25 }} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
          <Bar dataKey="profit" radius={[3, 3, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.profit >= 0 ? 'hsl(var(--state-success))' : 'hsl(var(--state-error))'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
