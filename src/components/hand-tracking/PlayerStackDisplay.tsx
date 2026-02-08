import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatIndianNumber, cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';
import { User, Wallet } from 'lucide-react';

interface PlayerStackDisplayProps {
  playerName: string;
  stack: number;
  isCurrentPlayer?: boolean;
}

const PlayerStackDisplay = memo(({
  playerName,
  stack,
  isCurrentPlayer = false
}: PlayerStackDisplayProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl transition-all duration-300",
      isCurrentPlayer
        ? 'bg-primary/10 border border-primary/30 shadow-lg shadow-primary/10'
        : 'bg-white/5 border border-border/50'
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <User className={cn(
          "h-3.5 w-3.5 shrink-0",
          isCurrentPlayer ? "text-primary" : "text-white/20"
        )} />
        <span className={cn(
          "font-luxury text-xs uppercase tracking-widest truncate",
          isCurrentPlayer ? "text-primary-foreground font-bold" : "text-white/40"
        )}>
          {playerName}
        </span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "font-numbers text-[10px] h-6 px-2.5 border-0 border-b-2 rounded-none",
          isCurrentPlayer
            ? "text-primary border-primary/40 bg-primary/5"
            : "text-white/30 border-white/10 bg-white/2"
        )}
      >
        <Wallet className="h-3 w-3 mr-1.5 opacity-40 shrink-0" />
        {formatCurrency(stack)}
      </Badge>
    </div>
  );
});

PlayerStackDisplay.displayName = 'PlayerStackDisplay';

export default PlayerStackDisplay;
