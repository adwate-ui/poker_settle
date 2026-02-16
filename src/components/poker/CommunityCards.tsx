import PokerCard from './PokerCard';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { parseCardNotationString } from '@/utils/pokerHandEvaluator';

interface CommunityCardsProps {
    flopCards: string;
    turnCard: string;
    riverCard: string;
    onEdit?: () => void;
}

const CommunityCards = ({ flopCards, turnCard, riverCard, onEdit }: CommunityCardsProps) => {
    return (
        <div className="bg-poker-green/10 p-1.5 sm:p-3 rounded-xl border border-poker-green/20 flex justify-between items-center w-full max-w-full overflow-hidden">
            <div className="flex gap-1 sm:gap-6 items-center flex-1 justify-between sm:justify-start">
                <div className="flex flex-col gap-0.5 sm:gap-1 items-center sm:items-start">
                    <span className="text-[9px] sm:text-[10px] font-luxury text-poker-green/50 tracking-widest">FLOP</span>
                    <div className="flex gap-0.5 min-w-[fit-content]">
                        {parseCardNotationString(flopCards).map((c, i) => <PokerCard key={i} card={c} size="sm" className="w-10 sm:w-14" />)}
                    </div>
                </div>
                {flopCards && <div className="w-px h-6 sm:h-8 bg-poker-green/30 shrink-0" />}
                <div className="flex flex-col gap-0.5 sm:gap-1 items-center sm:items-start">
                    <span className="text-[9px] sm:text-[10px] font-luxury text-poker-green/50 tracking-widest">TURN</span>
                    <div className="min-w-[24px]">{turnCard && <PokerCard card={turnCard} size="sm" className="w-10 sm:w-14" />}</div>
                </div>
                {turnCard && <div className="w-px h-6 sm:h-8 bg-poker-green/30 shrink-0" />}
                <div className="flex flex-col gap-0.5 sm:gap-1 items-center sm:items-start">
                    <span className="text-[9px] sm:text-[10px] font-luxury text-poker-green/50 tracking-widest">RIVER</span>
                    <div className="min-w-[24px]">{riverCard && <PokerCard card={riverCard} size="sm" className="w-10 sm:w-14" />}</div>
                </div>
            </div>
            {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-poker-green/50 hover:text-poker-green hover:bg-poker-green/10 ml-1 sm:ml-4 shrink-0 px-2 h-8">
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
            )}
        </div>
    );
};

export default CommunityCards;
