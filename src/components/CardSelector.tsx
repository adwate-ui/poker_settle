import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PokerCard from './PokerCard';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

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
  const [tempSelection, setTempSelection] = useState<string[]>(selectedCards);
  const [isConfirming, setIsConfirming] = useState(false); // Track if we're in the middle of confirming

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Reset temp selection when dialog opens
  useEffect(() => {
    if (open) {
      setTempSelection(selectedCards);
      setIsConfirming(false); // Reset confirming flag when dialog opens
    }
    // Note: Don't reset isConfirming when dialog closes here
    // It will be reset in onOpenChange after the check is done
  }, [open, selectedCards]);

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { code: 'h', name: 'Hearts', symbol: '♥', color: 'text-red-600 dark:text-red-500' },
    { code: 'd', name: 'Diamonds', symbol: '♦', color: 'text-red-600 dark:text-red-500' },
    { code: 'c', name: 'Clubs', symbol: '♣', color: 'text-gray-900 dark:text-gray-100' },
    { code: 's', name: 'Spades', symbol: '♠', color: 'text-gray-900 dark:text-gray-100' },
  ];

  const allCards = ranks.flatMap(rank => 
    suits.map(suit => `${rank}${suit.code}`)
  );

  const handleCardClick = (card: string) => {
    if (usedCards.includes(card) || knownHoleCards.includes(card)) return;
    
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {label}
            </span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={tempSelection.length === maxCards ? "default" : "secondary"}
                className="text-base px-3 py-1"
              >
                {tempSelection.length} / {maxCards}
              </Badge>
              {tempSelection.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear All
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select {maxCards} cards from the grid below. Already used cards are greyed out.
          </DialogDescription>
        </DialogHeader>

        {/* Card grid by suit - improved layout */}
        <div className="space-y-4">
          {suits.map(suit => (
            <div key={suit.code} className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <span className={cn("text-2xl", suit.color)}>{suit.symbol}</span>
                <h3 className="font-semibold text-base">{suit.name}</h3>
              </div>
              <div className="grid grid-cols-13 gap-0.5">
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
                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10 shadow-lg",
                        !isUsed && !isKnownHole && !isSelected && "hover:scale-105 hover:shadow-md cursor-pointer active:scale-95"
                      )}
                    >
                      <PokerCard card={card} size="xs" className="sm:hidden pointer-events-none" />
                      <PokerCard card={card} size="sm" className="hidden sm:block pointer-events-none" />
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                          <div className="bg-red-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                            USED
                          </div>
                        </div>
                      )}
                      {isKnownHole && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
                          <div className="bg-blue-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
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

        {/* Action buttons - improved styling */}
        <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 text-base">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={tempSelection.length !== maxCards}
            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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
