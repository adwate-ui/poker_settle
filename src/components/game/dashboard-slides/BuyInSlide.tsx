import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuyInManagementTable } from "@/components/game/BuyInManagementTable";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";
import { useGameData } from "@/hooks/useGameData";

const BuyInSlide = () => {
    const { gamePlayers, game, setShowAddPlayer } = useDashboardStore();
    const { handleAddBuyIn } = useGameDashboardActions();
    const { fetchBuyInHistory } = useGameData();

    const buyInAmount = game?.buy_in_amount || 0;

    return (
        <div className="px-4 pt-1 space-y-4 pb-20">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-luxury uppercase tracking-widest text-foreground">Buy-in Tracking</h3>
            </div>
            <Button
                variant="outline"
                className="w-full h-12 mb-4 text-sm uppercase tracking-wider font-bold"
                onClick={() => setShowAddPlayer(true)}
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Player
            </Button>
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
