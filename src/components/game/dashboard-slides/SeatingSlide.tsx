import { Button } from "@/components/ui/button";
import TablePositionEditor from "@/components/poker/TablePositionEditor";
import HandTracking from "@/components/poker/HandTracking";
import PokerTableView from "@/components/poker/PokerTableView";
import { useDashboardStore } from "@/features/game/stores/dashboardStore";
import { useGameDashboardActions } from "@/features/game/hooks/useGameDashboardActions";

const SeatingSlide = () => {
    const {
        game,
        gamePlayers,
        showPositionEditor,
        setShowPositionEditor,
        currentTablePosition,
        handTrackingStage,
        positionsJustChanged,
        hasSavedHandState,
    } = useDashboardStore();

    const { handleSaveTablePosition, handleHandComplete, handleStartHandTracking } = useGameDashboardActions();

    if (!game) return null;

    return (
        <div className="p-0 space-y-4 pb-12">
            {showPositionEditor ? (
                <div className="p-4">
                    <TablePositionEditor
                        players={gamePlayers.map(gp => gp.player)}
                        currentPositions={currentTablePosition?.positions || []}
                        onSave={handleSaveTablePosition}
                        onCancel={() => setShowPositionEditor(false)}
                    />
                </div>
            ) : handTrackingStage === 'recording' ? (
                <HandTracking
                    game={game}
                    positionsJustChanged={positionsJustChanged}
                    onHandComplete={handleHandComplete}
                    initialSeatPositions={currentTablePosition?.positions || []}
                />
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-[4/3] bg-card/40 overflow-hidden shadow-inner border-y border-border">
                        {currentTablePosition && currentTablePosition.positions.length > 0 ? (
                            <PokerTableView
                                positions={currentTablePosition.positions}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                <Button
                                    onClick={() => setShowPositionEditor(true)}
                                    className="h-14 px-10 bg-accent/5 border border-border text-muted-foreground font-luxury uppercase tracking-widest text-xs"
                                >
                                    Setup Seating
                                </Button>
                            </div>
                        )}
                    </div>

                    {currentTablePosition && currentTablePosition.positions.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 w-full px-4">
                            <Button
                                onClick={() => setShowPositionEditor(true)}
                                variant="ghost"
                                className="flex-1 h-12 border border-border text-muted-foreground text-label"
                            >
                                Edit Seating
                            </Button>
                            <Button
                                onClick={handleStartHandTracking}
                                className="flex-1 h-12 bg-primary text-primary-foreground text-label rounded-xl"
                            >
                                {hasSavedHandState ? 'Resume' : 'Record Hand'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SeatingSlide;
