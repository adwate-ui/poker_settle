import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatIndianNumber } from '@/lib/utils';

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
    <div className={`flex items-center justify-between p-2 rounded ${isCurrentPlayer ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
      <span className="font-medium text-sm">{playerName}</span>
      <Badge variant={isCurrentPlayer ? "default" : "secondary"} className="text-xs">
        Rs. {formatIndianNumber(stack)}
      </Badge>
    </div>
  );
});

PlayerStackDisplay.displayName = 'PlayerStackDisplay';

export default PlayerStackDisplay;
