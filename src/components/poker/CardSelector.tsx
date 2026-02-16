import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PokerCard from './PokerCard';
import { cn } from '@/lib/utils';
import { Sparkles, RotateCcw } from 'lucide-react';

interface CardSelectorProps {
  onSelect: (cards: string) => void;
  maxCards: number;
  usedCards?: string[];
  selectedCards?: string[];
  label?: string;
  trigger?: React.ReactNode;
  knownHoleCards?: string[]; // Add prop for known hole cards to grey out
  open?: boolean; // Controlled open state
  onOpenChange?: (open: boolean) => void; // Controlled open state callback
}

const CardSelector = ({
  onSelect,
  maxCards,
  usedCards = [],
  selectedCards = [],
  label = "Select Cards",
  trigger,
  knownHoleCards = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CardSelectorProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false); // Track if we're in the middle of confirming

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Reset temp selection when dialog opens (use a ref to track if we just opened)
  const previousOpenRef = useRef(false);
  useEffect(() => {
    // Only reset when dialog transitions from closed to open
    if (open && !previousOpenRef.current) {
      setTempSelection(selectedCards);
      setIsConfirming(false); // Reset confirming flag when dialog opens
    }
    previousOpenRef.current = open;
  }, [open, selectedCards]);

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { code: 'h', name: 'Hearts', symbol: '♥', color: 'text-destructive' },
    { code: 'd', name: 'Diamonds', symbol: '♦', color: 'text-destructive' },
    { code: 'c', name: 'Clubs', symbol: '♣', color: 'text-foreground' },
    { code: 's', name: 'Spades', symbol: '♠', color: 'text-foreground' },
  ];

  const allCards = ranks.flatMap(rank =>
    suits.map(suit => `${rank}${suit.code}`)
  );

  const handleCardClick = (card: string) => {
    if (usedCards.includes(card) || knownHoleCards.includes(card)) return;

    // Always allow deselection - this fixes the issue where cards can't be deselected when editing
    if (tempSelection.includes(card)) {
      setTempSelection(tempSelection.filter(c => c !== card));
    } else if (tempSelection.length < maxCards) {
      setTempSelection([...tempSelection, card]);
    }
  };

  const handleConfirm = () => {
    setIsConfirming(true); // Mark that we're confirming
    const sortedCards = tempSelection
      .map(card => allCards.indexOf(card))
      .sort((a, b) => a - b)
      .map(idx => allCards[idx])
      .join('');

    // Call onSelect which will handle closing the dialog
    onSelect(sortedCards);
    // isConfirming will be reset by useEffect when dialog closes
  };

  const handleCancel = () => {
    setTempSelection(selectedCards);
    setOpen(false);
  };

  const handleClear = () => {
    setTempSelection([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // When dialog closes, check if we're confirming
        if (!isConfirming) {
          // Not confirming - reset temp selection to prevent recording unconfirmed changes
          setTempSelection(selectedCards);
        }
        // Reset the confirming flag after the check
        setIsConfirming(false);
      }
      setOpen(isOpen);
    }}>
      {trigger && <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>}
      <DialogContent className="w-fit max-w-[95vw] max-h-[90vh] flex flex-col p-4 glass-panel border-white/10 shadow-2xl">
        <DialogHeader className="flex-shrink-0 text-left sm:text-center">
          <DialogTitle className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-base sm:text-xl font-heading font-bold flex items-center gap-2 text-luxury-primary whitespace-nowrap">
              <Sparkles className="w-5 h-5 hidden sm:block" />
              {label}
            </span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Badge
                variant={tempSelection.length === maxCards ? "default" : "secondary"}
                className="text-xs sm:text-base px-2 sm:px-3 py-1"
              >
                {tempSelection.length} / {maxCards}
              </Badge>
              {tempSelection.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 px-2 sm:h-9 sm:px-4">
                  <span className="hidden sm:inline">Clear All</span>
                  <RotateCcw className="w-3.5 h-3.5 sm:hidden" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Card grid by suit - scrollable area */}
        <div className="space-y-2 overflow-y-auto overflow-x-auto flex-1 pr-2">
          {suits.map(suit => (
            <div key={suit.code} className="space-y-1">
              <div className="flex items-center gap-2 pb-0.5 border-b border-white/10">
                <span className={cn("text-xl", suit.color)}>{suit.symbol}</span>
                <h3 className="font-luxury font-bold text-sm tracking-wide">{suit.name}</h3>
              </div>
              <div className="grid grid-cols-13 gap-0.5 min-w-[320px]">
                {ranks.map(rank => {
                  const card = `${rank}${suit.code}`;
                  const isUsed = usedCards.includes(card);
                  const isKnownHole = knownHoleCards.includes(card);
                  const isSelected = tempSelection.includes(card);

                  return (
                    <button
                      key={card}
                      onClick={() => handleCardClick(card)}
                      disabled={isUsed || isKnownHole}
                      className={cn(
                        "relative aspect-[5/7] transition-all duration-200 rounded touch-manipulation",
                        (isUsed || isKnownHole) && "opacity-30 cursor-not-allowed grayscale",
                        isSelected && "ring-2 ring-poker-gold ring-offset-1 ring-offset-background scale-105 z-10 shadow-glow-gold",
                        !isUsed && !isKnownHole && !isSelected && "hover:scale-105 hover:shadow-md cursor-pointer active:scale-95"
                      )}
                    >
                      <PokerCard card={card} size="xs" className="pointer-events-none" />
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                          <div className="bg-state-error text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                            USED
                          </div>
                        </div>
                      )}
                      {isKnownHole && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                          <div className="bg-state-info text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                            HOLE
                          </div>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-none">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons - fixed footer */}
        <div className="flex gap-3 pt-3 border-t border-white/10 flex-shrink-0">
          <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tempSelection.length !== maxCards}
            className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-money-green to-money-green/80 hover:scale-[1.02] transition-transform shadow-lg"
          >
            {tempSelection.length === maxCards ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Confirm Selection
              </>
            ) : (
              `Select ${maxCards - tempSelection.length} More Card${maxCards - tempSelection.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardSelector;
