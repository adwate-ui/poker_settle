import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="destructive"
        onClick={() => onAction('Fold')}
        disabled={disabled}
        className="w-full"
      >
        <X className="h-4 w-4 mr-2" />
        Fold
      </Button>
      <Button
        variant="default"
        onClick={() => onAction('Call')}
        disabled={disabled}
        className="w-full"
      >
        {isCheck ? 'Check' : `Call Rs. ${callAmount.toLocaleString('en-IN')}`}
      </Button>
      <div className="col-span-2 flex gap-2">
        <Input
          type="number"
          placeholder="Bet/Raise amount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          variant="default"
          onClick={() => onAction('Raise')}
          disabled={disabled || !betAmount}
          className="bg-gradient-poker"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Raise
        </Button>
      </div>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
