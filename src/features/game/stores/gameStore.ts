import { create } from 'zustand';

interface GameState {
    selectedChipValue: number;
    isDragActive: boolean;
    activePlayerId: string | null;

    // Actions
    setSelectedChipValue: (value: number) => void;
    setIsDragActive: (active: boolean) => void;
    setActivePlayerId: (id: string | null) => void;
    resetStore: () => void;
}

const initialState = {
    selectedChipValue: 100, // Default chip value
    isDragActive: false,
    activePlayerId: null,
};

export const useGameStore = create<GameState>((set) => ({
    ...initialState,

    setSelectedChipValue: (value) => set({ selectedChipValue: value }),

    setIsDragActive: (active) => set({ isDragActive: active }),

    setActivePlayerId: (id) => set({ activePlayerId: id }),

    resetStore: () => set(initialState),
}));
