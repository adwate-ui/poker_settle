import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { DistributionBucket } from '@/types/poker';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface SessionDistributionChartProps {
  data: DistributionBucket[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: DistributionBucket }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2.5 shadow-xl space-y-2">
      <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground">{d.label}</p>
      <div className="flex justify-between gap-6">
        <span className="text-3xs uppercase font-luxury tracking-wider text-muted-foreground">Sessions</span>
        <span className={cn('text-xs font-numbers font-semibold tabular-nums', d.isProfit ? 'text-state-success' : 'text-state-error')}>
          {d.count}
        </span>
      </div>
    </div>
  );
}

export function SessionDistributionChart({ data }: SessionDistributionChartProps) {
  const isMobile = useIsMobile();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <p className="text-3xs uppercase font-luxury tracking-widest text-muted-foreground/40">No session data</p>
      </div>
    );
  }

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
            dataKey="label"
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.25 }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={64}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isProfit ? 'hsl(var(--state-success))' : 'hsl(var(--state-error))'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
