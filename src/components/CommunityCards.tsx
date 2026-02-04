import PokerCard from './PokerCard';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { parseCardNotationString } from '@/utils/pokerHandEvaluator';

interface CommunityCardsProps {
    flopCards: string;
    turnCard: string;
    riverCard: string;
    onEdit?: () => void;
}

const CommunityCards = ({ flopCards, turnCard, riverCard, onEdit }: CommunityCardsProps) => {
    return (
        <div className="bg-green-900/20 p-3 rounded-xl border border-green-700/30 flex justify-between items-center">
            <div className="flex gap-2 items-center overflow-x-auto">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">FLOP</span>
                    <div className="flex gap-0.5 min-w-[70px]">
                        {parseCardNotationString(flopCards).map((c, i) => <PokerCard key={i} card={c} size="sm" />)}
                    </div>
                </div>
                {flopCards && <div className="w-px h-8 bg-white/10" />}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">TURN</span>
                    <div className="min-w-[24px]">{turnCard && <PokerCard card={turnCard} size="sm" />}</div>
                </div>
                {turnCard && <div className="w-px h-8 bg-white/10" />}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">RIVER</span>
                    <div className="min-w-[24px]">{riverCard && <PokerCard card={riverCard} size="sm" />}</div>
                </div>
            </div>
            {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                    <Sparkles className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
};

export default CommunityCards;
