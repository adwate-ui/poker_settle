import { PokerHand, PlayerAction, GamePlayer } from '@/types/poker';
import { HandStage } from '@/utils/handStateMachine';

export type HistoryState = Omit<SavedHandState, 'actionHistory' | 'timestamp'>;

export interface SavedHandState {
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
    actionHistory: HistoryState[];
    timestamp: number;
}

export const useHandPersistence = (gameId: string) => {
    const getSavedHandStateKey = () => `poker_hand_state_${gameId}`;

    const saveSavedHandState = (state: Omit<SavedHandState, 'timestamp'>) => {
        if (!state.currentHand) return;

        const handState: SavedHandState = {
            ...state,
            timestamp: Date.now(),
        };

        try {
            localStorage.setItem(getSavedHandStateKey(), JSON.stringify(handState));
        } catch (error) {
            console.error('Failed to save hand state:', error);
        }
    };

    const loadSavedHandState = (): SavedHandState | null => {
        try {
            const savedState = localStorage.getItem(getSavedHandStateKey());
            if (!savedState) return null;

            const handState = JSON.parse(savedState);
            // Check if state is not too old (e.g., 24 hours)
            const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms
            if (Date.now() - handState.timestamp > MAX_AGE) {
                localStorage.removeItem(getSavedHandStateKey());
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
            localStorage.removeItem(getSavedHandStateKey());
        } catch (error) {
            console.error('Failed to clear hand state:', error);
        }
    };

    return {
        saveHandState: saveSavedHandState,
        loadHandState: loadSavedHandState,
        clearHandState,
    };
};
