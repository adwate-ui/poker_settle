import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { CumulativePnLPoint } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface CumulativePnLChartProps {
  data: CumulativePnLPoint[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: CumulativePnLPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const isProfit = point.cumulative >= 0;
  const sessionIsProfit = point.sessionPnl >= 0;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2.5 shadow-xl space-y-2 min-w-[148px]">
      <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">{point.date}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">Session</span>
          <span className={cn('text-xs font-numbers font-semibold tabular-nums', sessionIsProfit ? 'text-state-success' : 'text-state-error')}>
            {sessionIsProfit ? '+' : ''}{formatCurrency(point.sessionPnl)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">Cumulative</span>
          <span className={cn('text-xs font-numbers font-semibold tabular-nums', isProfit ? 'text-state-success' : 'text-state-error')}>
            {isProfit ? '+' : ''}{formatCurrency(point.cumulative)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CumulativePnLChart({ data }: CumulativePnLChartProps) {
  const isMobile = useIsMobile();

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">
          Play more sessions to see your trend
        </p>
      </div>
    );
  }

  const allValues = data.map((d) => d.cumulative);
  const maxAbs = Math.max(...allValues.map(Math.abs), 1);
  const yDomain: [number, number] = [-(maxAbs * 1.15), maxAbs * 1.15];

  const tickFormatter = (v: number) => {
    if (Math.abs(v) >= 100000) return `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(0)}k`;
    if (Math.abs(v) >= 1000) return `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(1)}k`;
    return String(Math.round(v));
  };

  return (
    <div className={cn('w-full', isMobile ? 'h-[190px]' : 'h-[260px]')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="profitAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--state-success))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--state-success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={tickFormatter}
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            width={isMobile ? 32 : 40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--border))"
            strokeDasharray="5 3"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--state-success))"
            strokeWidth={2}
            fill="url(#profitAreaFill)"
            dot={data.length <= 20 ? { r: 2, fill: 'hsl(var(--state-success))', strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: 'hsl(var(--state-success))', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
