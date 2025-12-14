import { memo } from 'react';
import { Badge } from '@mantine/core';
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
      <Badge color={isCurrentPlayer ? "blue" : "gray"} size="sm">
        Rs. {formatIndianNumber(stack)}
      </Badge>
    </div>
  );
});

PlayerStackDisplay.displayName = 'PlayerStackDisplay';

export default PlayerStackDisplay;
