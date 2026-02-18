import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Undo2 } from 'lucide-react';
import { formatIndianNumber } from '@/utils/currencyUtils';
import { parseIndianNumber } from '@/lib/utils';

interface ActionControlsProps {
    currentPlayerId?: string;
    playersInHand: string[];
    currentBet: number;
    betAmount: string;
    setBetAmount: (amount: string) => void;
    onAction: (type: string, amount?: number) => void;
    onUndo: () => void;
    onNextStreet: () => void;
    canUndo: boolean;
    canMoveToNextStreet: boolean;
    stage: string;
    isStreetCardMissing?: boolean;
    onOpenCardSelector?: () => void;
}

const ActionControls = ({
    currentPlayerId,
    playersInHand,
    currentBet,
    betAmount,
    setBetAmount,
    onAction,
    onUndo,
    onNextStreet,
    canUndo,
    canMoveToNextStreet,
    stage,
    isStreetCardMissing,
    onOpenCardSelector
}: ActionControlsProps) => {
    const isPlayerActive = currentPlayerId && playersInHand.includes(currentPlayerId);

    return (
        <div className="space-y-3">
            {isPlayerActive ? (
                isStreetCardMissing ? (
                    <Button
                        variant="luxury"
                        size="lg"
                        className="w-full h-12 font-luxury uppercase tracking-widest text-lg animate-pulse"
                        onClick={onOpenCardSelector}
                    >
                        Set {stage} Cards
                    </Button>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-12 font-bold"
                                onClick={() => onAction(currentBet === 0 ? 'Check' : 'Call', currentBet)}
                            >
                                {currentBet === 0 ? 'Check' : `Call ${currentBet}`}
                            </Button>
                            <Button
                                variant="destructive"
                                size="lg"
                                className="h-12 font-bold"
                                onClick={() => onAction('Fold')}
                            >
                                Fold
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={betAmount}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/,/g, '');
                                    if (raw === '' || !isNaN(Number(raw))) {
                                        setBetAmount(raw === '' ? '' : formatIndianNumber(Number(raw)));
                                    }
                                }}
                                placeholder="Amount"
                                className="h-12 text-base"
                            />
                            <Button
                                variant="warning"
                                className="h-12 px-8 font-bold"
                                onClick={() => onAction('Raise', parseIndianNumber(betAmount))}
                                disabled={!betAmount}
                            >
                                Raise
                            </Button>
                        </div>
                    </>
                )
            ) : (
                <div className="bg-muted/50 p-4 rounded-lg text-center border-dashed border-2">
                    Player Folded
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="h-10"
                    onClick={onUndo}
                    disabled={!canUndo}
                >
                    <Undo2 className="w-4 h-4 mr-2" /> Undo
                </Button>
                {canMoveToNextStreet && (
                    <Button
                        variant="success"
                        className="flex-1 h-10 font-bold"
                        onClick={onNextStreet}
                        disabled={isStreetCardMissing}
                    >
                        {stage === 'river' ? '🏆 Showdown' : 'Next Street →'}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ActionControls;
