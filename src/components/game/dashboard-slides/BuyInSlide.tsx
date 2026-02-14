import { Plus } from "lucide-react";
import { GamePlayer, BuyInHistory } from "@/types/poker";
import { BuyInManagementTable } from "@/components/game/BuyInManagementTable";

interface BuyInSlideProps {
    gamePlayers: GamePlayer[];
    buyInAmount: number;
    handleAddBuyIn: (gamePlayerId: string, buyInsToAdd: number) => Promise<void>;
    fetchBuyInHistory: (gameId: string) => Promise<BuyInHistory[]>;
}

const BuyInSlide = ({
    gamePlayers,
    buyInAmount,
    handleAddBuyIn,
    fetchBuyInHistory,
}: BuyInSlideProps) => {
    return (
        <div className="px-4 pt-1 space-y-4 pb-20">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-luxury uppercase tracking-widest text-foreground">Buy-in Tracking</h3>
            </div>
            <BuyInManagementTable
                gamePlayers={gamePlayers}
                buyInAmount={buyInAmount}
                onAddBuyIn={handleAddBuyIn}
                fetchBuyInHistory={fetchBuyInHistory}
            />
        </div>
    );
};

export default BuyInSlide;
