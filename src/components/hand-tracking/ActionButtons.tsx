import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Check, ShieldCheck, Coins } from 'lucide-react';
import { ActionType } from '@/utils/handStateMachine';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 h-11">
        <Button
          variant="ghost"
          onClick={() => onAction('Fold')}
          disabled={disabled}
          className="flex-1 h-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-luxury uppercase tracking-widest text-[10px] rounded-xl transition-all"
        >
          <X className="h-3.5 w-3.5 mr-2" />
          Fold
        </Button>
        <Button
          variant="ghost"
          onClick={() => onAction('Call')}
          disabled={disabled}
          className={cn(
            "flex-[1.5] h-full border font-luxury uppercase tracking-widest text-[10px] rounded-xl transition-all",
            isCheck
              ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-400"
              : "border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/10 text-gold-400"
          )}
        >
          {isCheck ? (
            <div className="flex items-center">
              <Check className="h-3.5 w-3.5 mr-2" />
              Check Protocol
            </div>
          ) : (
            <div className="flex items-center">
              <Coins className="h-3.5 w-3.5 mr-2" />
              Sync Entry ({callAmount.toLocaleString('en-IN')})
            </div>
          )}
        </Button>
      </div>

      <div className="flex gap-2 h-11 group">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gold-500 font-numbers text-xs opacity-50">₹</span>
          </div>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="RAISE VALUATION"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={disabled}
            className="h-full pl-8 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-numbers text-sm text-gold-100 placeholder:text-white/10 placeholder:font-luxury placeholder:tracking-widest placeholder:text-[9px]"
          />
        </div>
        <Button
          onClick={() => onAction('Raise')}
          disabled={disabled || !betAmount}
          className="flex-1 h-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-luxury uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-gold-900/10 transition-all"
        >
          <TrendingUp className="h-3.5 w-3.5 mr-2" />
          Elevate Stake
        </Button>
      </div>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
