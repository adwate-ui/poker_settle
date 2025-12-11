import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
}

const CardSelector = ({
  onSelect,
  maxCards,
  usedCards = [],
  selectedCards = [],
  label = "Select Cards",
  trigger
}: CardSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedCards);

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
    if (usedCards.includes(card)) return;
    
    if (tempSelection.includes(card)) {
      setTempSelection(tempSelection.filter(c => c !== card));
    } else if (tempSelection.length < maxCards) {
      setTempSelection([...tempSelection, card]);
    }
  };

  const handleConfirm = () => {
    const sortedCards = tempSelection
      .map(card => allCards.indexOf(card))
      .sort((a, b) => a - b)
      .map(idx => allCards[idx])
      .join('');
    
    onSelect(sortedCards);
    setOpen(false);
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
      setOpen(isOpen);
      if (!isOpen) {
        setTempSelection(selectedCards);
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full gap-2">
            <Sparkles className="w-4 h-4" />
            {label}
          </Button>
        )}
      </DialogTrigger>
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
        </DialogHeader>

        {/* Selected cards preview */}
        {tempSelection.length > 0 && (
          <div className="flex gap-2 p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border-2 border-green-700/40 justify-center flex-wrap">
            <div className="text-sm font-semibold text-green-400 w-full text-center mb-2">
              Selected Cards
            </div>
            {tempSelection.map((card, idx) => (
              <PokerCard key={idx} card={card} size="md" />
            ))}
          </div>
        )}

        {/* Card grid by suit - improved layout */}
        <div className="space-y-4">
          {suits.map(suit => (
            <div key={suit.code} className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <span className={cn("text-2xl", suit.color)}>{suit.symbol}</span>
                <h3 className="font-semibold text-base">{suit.name}</h3>
              </div>
              <div className="grid grid-cols-13 gap-1.5">
                {ranks.map(rank => {
                  const card = `${rank}${suit.code}`;
                  const isUsed = usedCards.includes(card);
                  const isSelected = tempSelection.includes(card);
                  
                  return (
                    <button
                      key={card}
                      onClick={() => handleCardClick(card)}
                      disabled={isUsed}
                      className={cn(
                        "relative aspect-[5/7] transition-all duration-200 rounded",
                        isUsed && "opacity-20 cursor-not-allowed grayscale",
                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10 shadow-lg",
                        !isUsed && !isSelected && "hover:scale-105 hover:shadow-md cursor-pointer active:scale-95"
                      )}
                    >
                      <PokerCard card={card} size="xs" />
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                          <div className="bg-red-600 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-md">
                            USED
                          </div>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-lg">
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
