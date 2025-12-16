import { memo } from 'react';
import { Button, TextInput } from '@mantine/core';
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
        color="red"
        onClick={() => onAction('Fold')}
        disabled={disabled}
        className="flex-1 h-9 px-2 text-xs"
        leftSection={<X className="h-4 w-4" />}
      >
        Fold
      </Button>
      <Button
        color="gray"
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
        color="gray"
        onClick={() => onAction('Raise')}
        disabled={disabled || !betAmount}
        className="bg-gradient-poker text-primary-foreground flex-1 h-9 px-2 text-xs"
        leftSection={<TrendingUp className="h-4 w-4" />}
      >
        Raise
      </Button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
