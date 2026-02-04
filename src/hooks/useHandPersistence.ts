import { HandStage, PokerHand, PlayerAction, GamePlayer } from '@/types/poker';

export interface HandState {
    currentHand: PokerHand | null;
    stage: HandStage;
    buttonPlayerId: string;
    dealtOutPlayers: string[];
    activePlayers: GamePlayer[];
    currentPlayerIndex: number;
    actionSequence: number;
    currentBet: number;
    flopCards: string;
    turnCard: string;
    riverCard: string;
    potSize: number;
    streetActions: PlayerAction[];
    allHandActions: PlayerAction[];
    playersInHand: string[];
    playerHoleCards: Record<string, string>;
    playerBets: Record<string, number>;
    streetPlayerBets: Record<string, number>;
    lastAggressorIndex: number | null;
    actionHistory: any[];
    timestamp: number;
}

export const useHandPersistence = (gameId: string) => {
    const getHandStateKey = () => `poker_hand_state_${gameId}`;

    const saveHandState = (state: Omit<HandState, 'timestamp'>) => {
        if (!state.currentHand) return;

        const handState: HandState = {
            ...state,
            timestamp: Date.now(),
        };

        try {
            localStorage.setItem(getHandStateKey(), JSON.stringify(handState));
        } catch (error) {
            console.error('Failed to save hand state:', error);
        }
    };

    const loadHandState = (): HandState | null => {
        try {
            const savedState = localStorage.getItem(getHandStateKey());
            if (!savedState) return null;

            const handState = JSON.parse(savedState);
            // Check if state is not too old (e.g., 24 hours)
            const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms
            if (Date.now() - handState.timestamp > MAX_AGE) {
                localStorage.removeItem(getHandStateKey());
                return null;
            }

            return handState;
        } catch (error) {
            console.error('Failed to load hand state:', error);
            return null;
        }
    };

    const clearHandState = () => {
        try {
            localStorage.removeItem(getHandStateKey());
        } catch (error) {
            console.error('Failed to clear hand state:', error);
        }
    };

    return {
        saveHandState,
        loadHandState,
        clearHandState,
    };
};
