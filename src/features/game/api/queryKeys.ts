export const gameKeys = {
    all: ['games'] as const,
    lists: () => [...gameKeys.all, 'list'] as const,
    detail: (id: string) => [...gameKeys.all, 'detail', id] as const,
    players: (gameId: string) => [...gameKeys.detail(gameId), 'players'] as const,
    positions: (gameId: string) => [...gameKeys.detail(gameId), 'positions'] as const,
};

export const playerKeys = {
    all: ['players'] as const,
    lists: () => [...playerKeys.all, 'list'] as const,
    detail: (id: string) => [...playerKeys.all, 'detail', id] as const,
};
