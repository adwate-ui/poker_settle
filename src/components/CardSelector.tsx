import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PokerCard from './PokerCard';
import { cn } from '@/lib/utils';

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
    { code: 'h', name: 'Hearts', symbol: '♥', color: 'text-red-600' },
    { code: 'd', name: 'Diamonds', symbol: '♦', color: 'text-red-600' },
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
          <Button variant="outline" className="w-full">
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{label}</span>
            <div className="flex items-center gap-2">
              <Badge variant={tempSelection.length === maxCards ? "default" : "secondary"}>
                {tempSelection.length} / {maxCards} selected
              </Badge>
              {tempSelection.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Selected cards preview */}
        {tempSelection.length > 0 && (
          <div className="flex gap-2 p-4 bg-muted rounded-lg justify-center flex-wrap">
            {tempSelection.map((card, idx) => (
              <PokerCard key={idx} card={card} size="sm" />
            ))}
          </div>
        )}

        {/* Card grid by suit */}
        <div className="space-y-4">
          {suits.map(suit => (
            <div key={suit.code} className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className={suit.color}>{suit.symbol}</span>
                <span>{suit.name}</span>
              </h3>
              <div className="grid grid-cols-13 gap-1">
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
                        "relative aspect-[5/7] transition-all",
                        isUsed && "opacity-30 cursor-not-allowed grayscale",
                        isSelected && "ring-4 ring-primary ring-offset-2 scale-110 z-10",
                        !isUsed && !isSelected && "hover:scale-105 cursor-pointer"
                      )}
                    >
                      <PokerCard card={card} size="xs" />
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-600 text-white text-[8px] px-1 rounded font-bold">
                            USED
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={tempSelection.length !== maxCards}
            className="flex-1"
          >
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardSelector;
