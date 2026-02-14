import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Check, ShieldCheck } from 'lucide-react';
import { ActionType } from '@/utils/handStateMachine';

interface ActionButtonsProps {
  onAction: (action: ActionType) => void;
  currentBet: number;
  playerBet: number;
  disabled?: boolean;
}

const ActionButtons = memo(({
  onAction,
  currentBet,
  playerBet,
  disabled = false
}: ActionButtonsProps) => {
  const callAmount = Math.max(0, currentBet - playerBet);
  const isCheck = callAmount === 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-3">
        {/* FOLD */}
        <Button
          variant="game-fold"
          size="game-action"
          onClick={() => onAction('Fold')}
          disabled={disabled}
          className="flex-1" // Only layout classes allowed here
        >
          <X className="h-5 w-5 mr-2" />
          Fold
        </Button>

        {/* CHECK / CALL */}
        <Button
          variant={isCheck ? "game-check" : "game-call"}
          size="game-action"
          onClick={() => onAction('Call')}
          disabled={disabled}
          className="flex-[1.5]"
        >
          {isCheck ? <ShieldCheck className="h-5 w-5 mr-2" /> : <Check className="h-5 w-5 mr-2" />}
          {isCheck ? "Check" : "Call"}
        </Button>
      </div>

      {/* RAISE */}
      <Button
        variant="game-raise"
        size="game-action"
        onClick={() => onAction('Raise')}
        disabled={disabled}
        className="w-full"
      >
        <TrendingUp className="h-5 w-5 mr-2" />
        Raise
      </Button>
    </div>
  );
});

export default ActionButtons;
