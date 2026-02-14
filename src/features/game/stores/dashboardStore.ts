import { create } from 'zustand';
import { Game, GamePlayer, Settlement, TablePosition } from "@/types/poker";

interface DashboardState {
    // Data State
    game: Game | null;
    gamePlayers: GamePlayer[];
    currentTablePosition: TablePosition | null;

    // UI Flags
    showAddPlayer: boolean;
    isCreatingPlayer: boolean;
    showManualTransfer: boolean;
    showPositionEditor: boolean;
    positionsJustChanged: boolean;
    handTrackingStage: 'setup' | 'ready' | 'recording';
    hasSavedHandState: boolean;
    isCompletingGame: boolean;

    // Form State
    newPlayerName: string;
    searchQuery: string;
    newTransferFrom: string;
    newTransferTo: string;
    newTransferAmount: string;

    // Actions
    setGame: (game: Game) => void;
    setGamePlayers: (players: GamePlayer[] | ((prev: GamePlayer[]) => GamePlayer[])) => void;
    setCurrentTablePosition: (position: TablePosition | null) => void;

    setShowAddPlayer: (show: boolean) => void;
    setIsCreatingPlayer: (isCreating: boolean) => void;
    setShowManualTransfer: (show: boolean) => void;
    setShowPositionEditor: (show: boolean) => void;
    setPositionsJustChanged: (changed: boolean) => void;
    setHandTrackingStage: (stage: 'setup' | 'ready' | 'recording') => void;
    setHasSavedHandState: (hasSaved: boolean) => void;
    setIsCompletingGame: (isCompleting: boolean) => void;

    setNewPlayerName: (name: string) => void;
    setSearchQuery: (query: string) => void;
    setNewTransferFrom: (from: string) => void;
    setNewTransferTo: (to: string) => void;
    setNewTransferAmount: (amount: string) => void;

    resetDashboard: () => void;
}

const initialState = {
    game: null,
    gamePlayers: [],
    currentTablePosition: null,

    showAddPlayer: false,
    isCreatingPlayer: false,
    showManualTransfer: false,
    showPositionEditor: false,
    positionsJustChanged: false,
    handTrackingStage: 'setup' as const,
    hasSavedHandState: false,
    isCompletingGame: false,

    newPlayerName: '',
    searchQuery: '',
    newTransferFrom: '',
    newTransferTo: '',
    newTransferAmount: '',
};

export const useDashboardStore = create<DashboardState>((set) => ({
    ...initialState,

    setGame: (game) => set({ game }),
    setGamePlayers: (players) => set((state) => ({
        gamePlayers: typeof players === 'function' ? players(state.gamePlayers) : players
    })),
    setCurrentTablePosition: (position) => set({ currentTablePosition: position }),

    setShowAddPlayer: (show) => set({ showAddPlayer: show }),
    setIsCreatingPlayer: (isCreating) => set({ isCreatingPlayer: isCreating }),
    setShowManualTransfer: (show) => set({ showManualTransfer: show }),
    setShowPositionEditor: (show) => set({ showPositionEditor: show }),
    setPositionsJustChanged: (changed) => set({ positionsJustChanged: changed }),
    setHandTrackingStage: (stage) => set({ handTrackingStage: stage }),
    setHasSavedHandState: (hasSaved) => set({ hasSavedHandState: hasSaved }),
    setIsCompletingGame: (isCompleting) => set({ isCompletingGame: isCompleting }),

    setNewPlayerName: (name) => set({ newPlayerName: name }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setNewTransferFrom: (from) => set({ newTransferFrom: from }),
    setNewTransferTo: (to) => set({ newTransferTo: to }),
    setNewTransferAmount: (amount) => set({ newTransferAmount: amount }),

    resetDashboard: () => set(initialState),
}));
