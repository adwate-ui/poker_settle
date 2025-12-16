import { memo } from 'react';
import { TextInput } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { X, TrendingUp } from 'lucide-react';
import { ActionType } from '@/utils/handStateMachine';

interface ActionButtonsProps {
  onAction: (action: ActionType) => void;
  currentBet: number;
  playerBet: number;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  disabled?: boolean;
}

const ActionButtons = memo(({ 
  onAction, 
  currentBet, 
  playerBet, 
  betAmount, 
  setBetAmount,
  disabled = false 
}: ActionButtonsProps) => {
  const callAmount = Math.max(0, currentBet - playerBet);
  const isCheck = callAmount === 0;

  return (
    <div className="flex gap-1.5">
      <Button
        variant="destructive"
        onClick={() => onAction('Fold')}
        disabled={disabled}
        className="flex-1 h-9 px-2 text-xs"
      >
        <X className="h-4 w-4 mr-2" />
        Fold
      </Button>
      <Button
        variant="secondary"
        onClick={() => onAction('Call')}
        disabled={disabled}
        className="flex-1 h-9 px-2 text-xs"
      >
        {isCheck ? 'Check' : `Call ${callAmount.toLocaleString('en-IN')}`}
      </Button>
      <TextInput
        type="number"
        inputMode="numeric"
        placeholder="Raise amt"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        disabled={disabled}
        size="sm"
        className="flex-1"
      />
      <Button
        onClick={() => onAction('Raise')}
        disabled={disabled || !betAmount}
        className="bg-gradient-poker text-primary-foreground flex-1 h-9 px-2 text-xs"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Raise
      </Button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
