import { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Game, GamePlayer, PokerHand, PlayerAction } from '@/types/poker';
import {
    getNextPlayerIndex,
    getStartingPlayerIndex,
    isBettingRoundComplete,
    shouldEndHandEarly,
    processAction,
    resetForNewStreet,
    HandStage,
    ActionType
} from '@/utils/handStateMachine';
import {
    getPositionForPlayer,
    getSmallBlindPlayer,
    getBigBlindPlayer
} from '@/utils/pokerPositions';

import { useHandPersistence, SavedHandState, HistoryState } from './useHandPersistence';
import { useHandTracking } from './useHandTracking';

interface EngineStateSnapshot {
    stage: HandStage;
    currentPlayerIndex: number;
    actionSequence: number;
    currentBet: number;
    potSize: number;
    streetPlayerBets: Record<string, number>;
    playerBets: Record<string, number>;
    playersInHand: string[];
    streetActions: PlayerAction[];
    allHandActions: PlayerAction[];
    lastAggressorIndex: number | null;
    flopCards: string;
    turnCard: string;
    riverCard: string;
    playerHoleCards: Record<string, string>;
    currentHand: PokerHand | null;
    buttonPlayerId: string;
    dealtOutPlayers: string[];
    activePlayers: GamePlayer[];
}

export const usePokerEngine = (
    game: Game,
    heroPlayer: GamePlayer | undefined,
    seatPositions: Record<string, number>,
    handTracking: ReturnType<typeof useHandTracking>,
    persistence: ReturnType<typeof useHandPersistence>
) => {
    const { toast } = useToast();
    const {
        createNewHand,
        getNextHandNumber,
        saveCompleteHandData,
    } = handTracking;

    // State
    const [currentHand, setCurrentHand] = useState<PokerHand | null>(null);
    const [stage, setStage] = useState<HandStage>('setup');
    const [buttonPlayerId, setButtonPlayerId] = useState<string>('');
    const [dealtOutPlayers, setDealtOutPlayers] = useState<string[]>([]);
    const [activePlayers, setActivePlayers] = useState<GamePlayer[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [actionSequence, setActionSequence] = useState(0);
    const [currentBet, setCurrentBet] = useState(0);
    const [flopCards, setFlopCards] = useState('');
    const [turnCard, setTurnCard] = useState('');
    const [riverCard, setRiverCard] = useState('');
    const [potSize, setPotSize] = useState(0);
    const [streetActions, setStreetActions] = useState<PlayerAction[]>([]);
    const [allHandActions, setAllHandActions] = useState<PlayerAction[]>([]);
    const [playersInHand, setPlayersInHand] = useState<string[]>([]);
    const [playerHoleCards, setPlayerHoleCards] = useState<Record<string, string>>({});
    const [playerBets, setPlayerBets] = useState<Record<string, number>>({});
    const [streetPlayerBets, setStreetPlayerBets] = useState<Record<string, number>>({});
    const [lastAggressorIndex, setLastAggressorIndex] = useState<number | null>(null);
    const [actionHistory, setActionHistory] = useState<EngineStateSnapshot[]>([]);

    // Computed
    const visualPotSize = useMemo(() => {
        const currentStreetTotal = Object.values(streetPlayerBets).reduce((sum, bet) => sum + bet, 0);
        return Math.max(0, potSize - currentStreetTotal);
    }, [potSize, streetPlayerBets]);

    const currentPlayer = activePlayers[currentPlayerIndex];

    const actionsByStreet = useMemo(() => {
        return ['River', 'Turn', 'Flop', 'Preflop'].map(street => ({
            street,
            actions: allHandActions.filter(a => a.street_type === street)
        })).filter(group => group.actions.length > 0);
    }, [allHandActions]);

    // Persist state
    useEffect(() => {
        if (!currentHand || stage === 'setup') return;

        const timeoutId = setTimeout(() => {
            persistence.saveHandState({
                currentHand,
                stage,
                buttonPlayerId,
                dealtOutPlayers,
                activePlayers,
                currentPlayerIndex,
                actionSequence,
                currentBet,
                flopCards,
                turnCard,
                riverCard,
                potSize,
                streetActions,
                allHandActions,
                playersInHand,
                playerHoleCards,
                playerBets,
                streetPlayerBets,
                lastAggressorIndex,
                actionHistory: actionHistory as unknown as HistoryState[], // Casting to match SavedHandState
            });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [
        currentHand, stage, currentPlayerIndex, actionSequence, currentBet,
        flopCards, turnCard, riverCard, potSize, streetActions, allHandActions,
        playersInHand, playerHoleCards, playerBets, streetPlayerBets, lastAggressorIndex,
        persistence, buttonPlayerId, dealtOutPlayers, activePlayers, actionHistory
    ]);

    // Methods
    const saveStateToHistory = useCallback(() => {
        const currentState: EngineStateSnapshot = {
            stage,
            currentPlayerIndex,
            actionSequence,
            currentBet,
            potSize,
            streetPlayerBets: { ...streetPlayerBets },
            playerBets: { ...playerBets },
            playersInHand: [...playersInHand],
            streetActions: [...streetActions],
            allHandActions: [...allHandActions],
            lastAggressorIndex,
            flopCards,
            turnCard,
            riverCard,
            playerHoleCards: { ...playerHoleCards },
            currentHand,
            buttonPlayerId,
            dealtOutPlayers: [...dealtOutPlayers],
            activePlayers: [...activePlayers],
        };
        setActionHistory(prev => [...prev, currentState]);
    }, [stage, currentPlayerIndex, actionSequence, currentBet, potSize, streetPlayerBets, playerBets, playersInHand, streetActions, allHandActions, lastAggressorIndex, flopCards, turnCard, riverCard, playerHoleCards, currentHand, buttonPlayerId, dealtOutPlayers, activePlayers]);

    const undoLastAction = useCallback(() => {
        if (actionHistory.length === 0) return;

        const previousState = actionHistory[actionHistory.length - 1];
        setStage(previousState.stage);
        setCurrentPlayerIndex(previousState.currentPlayerIndex);
        setActionSequence(previousState.actionSequence);
        setCurrentBet(previousState.currentBet);
        setPotSize(previousState.potSize);
        setStreetPlayerBets(previousState.streetPlayerBets);
        setPlayerBets(previousState.playerBets);
        setPlayersInHand(previousState.playersInHand);
        setStreetActions(previousState.streetActions);
        setAllHandActions(previousState.allHandActions);
        setLastAggressorIndex(previousState.lastAggressorIndex);
        setFlopCards(previousState.flopCards);
        setTurnCard(previousState.turnCard);
        setRiverCard(previousState.riverCard);
        setPlayerHoleCards(previousState.playerHoleCards);
        setCurrentHand(previousState.currentHand);
        setButtonPlayerId(previousState.buttonPlayerId);
        setDealtOutPlayers(previousState.dealtOutPlayers);
        setActivePlayers(previousState.activePlayers);
        setActionHistory(prev => prev.slice(0, -1));
    }, [actionHistory]);

    const startNewHand = useCallback(async (buttonId: string, dealtOutIds: string[]) => {
        if (!buttonId) return;
        if (Object.keys(seatPositions).length === 0) {
            toast({ title: 'Error', description: 'Table positions not loaded.', variant: 'destructive' });
            return;
        }

        const nextHandNumber = await getNextHandNumber(game.id);
        const active = game.game_players
            .filter(gp => !dealtOutIds.includes(gp.player_id))
            .sort((a, b) => (seatPositions[a.player_id] ?? 999) - (seatPositions[b.player_id] ?? 999));

        if (active.length < 2) {
            toast({ title: 'Error', description: 'At least 2 players required.', variant: 'destructive' });
            return;
        }

        const heroPos = heroPlayer?.player_id ? getPositionForPlayer(active, buttonId, heroPlayer.player_id, seatPositions) : 'UTG';

        const handObject: PokerHand = {
            id: `temp-hand-${Date.now()}`,
            game_id: game.id,
            hand_number: nextHandNumber,
            button_player_id: buttonId,
            hero_position: heroPos,
            final_stage: 'Preflop',
            pot_size: 0,
            winner_player_id: null,
            winner_player_ids: null,
            is_hero_win: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setCurrentHand(handObject);
        setActivePlayers(active);
        setPlayersInHand(active.map(p => p.player_id));
        setButtonPlayerId(buttonId);
        setDealtOutPlayers(dealtOutIds);

        const sbPlayer = getSmallBlindPlayer(active, buttonId, seatPositions);
        const bbPlayer = getBigBlindPlayer(active, buttonId, seatPositions);
        const sbAmount = game.small_blind || 50;
        const bbAmount = game.big_blind || 100;

        const initialBets: Record<string, number> = {};
        active.forEach(p => initialBets[p.player_id] = 0);
        initialBets[sbPlayer.player_id] = sbAmount;
        initialBets[bbPlayer.player_id] = bbAmount;

        setPlayerBets(initialBets);
        setStreetPlayerBets(initialBets);

        const sbAction: PlayerAction = {
            id: `temp-sb-${Date.now()}`,
            hand_id: handObject.id,
            player_id: sbPlayer.player_id,
            street_type: 'Preflop',
            action_type: 'Small Blind',
            bet_size: sbAmount,
            action_sequence: 0,
            is_hero: sbPlayer.player_id === heroPlayer?.player_id,
            position: getPositionForPlayer(active, buttonId, sbPlayer.player_id, seatPositions),
            hole_cards: null,
            created_at: new Date().toISOString()
        };

        const bbAction: PlayerAction = {
            id: `temp-bb-${Date.now()}`,
            hand_id: handObject.id,
            player_id: bbPlayer.player_id,
            street_type: 'Preflop',
            action_type: 'Big Blind',
            bet_size: bbAmount,
            action_sequence: 1,
            is_hero: bbPlayer.player_id === heroPlayer?.player_id,
            position: getPositionForPlayer(active, buttonId, bbPlayer.player_id, seatPositions),
            hole_cards: null,
            created_at: new Date().toISOString()
        };

        setStreetActions([sbAction, bbAction]);
        setAllHandActions([sbAction, bbAction]);
        const currentPlayersInHand = active.map(p => p.player_id);
        setCurrentPlayerIndex(getStartingPlayerIndex('preflop', active, buttonId, currentPlayersInHand));
        setStage('preflop');
        setCurrentBet(bbAmount);
        setPotSize(sbAmount + bbAmount);
        setActionSequence(2);
        setLastAggressorIndex(active.findIndex(p => p.player_id === bbPlayer.player_id));
    }, [game.big_blind, game.id, game.small_blind, game.game_players, getNextHandNumber, seatPositions, heroPlayer, toast]);

    const finishHand = useCallback(async (winnerIds: string[], finalStageOverride?: HandStage, lastAction?: PlayerAction) => {
        if (!currentHand) return;
        persistence.clearHandState();

        const isHeroWin = winnerIds.includes(heroPlayer?.player_id || '');
        let finalStageValue: string;
        if (finalStageOverride === 'showdown') finalStageValue = 'Showdown';
        else if (finalStageOverride) finalStageValue = finalStageOverride.charAt(0).toUpperCase() + finalStageOverride.slice(1);
        else finalStageValue = stage === 'showdown' ? 'Showdown' : stage.charAt(0).toUpperCase() + stage.slice(1);

        const actionsToSave = lastAction ? [...allHandActions, lastAction] : allHandActions;
        const heroPos = heroPlayer?.player_id ? getPositionForPlayer(activePlayers, currentHand.button_player_id, heroPlayer.player_id, seatPositions) : 'UTG';
        const positionsData = activePlayers.map(gp => ({ seat: seatPositions[gp.player_id] ?? 0, player_id: gp.player_id, player_name: gp.player.name }));

        const savedHand = await createNewHand(game.id, currentHand.button_player_id, currentHand.hand_number, heroPos, positionsData as unknown as []);
        if (!savedHand) {
            toast({ title: 'Error', description: 'Failed to save hand', variant: 'destructive' });
            return;
        }

        const finalActions = actionsToSave.map(action => {
            const playerActions = actionsToSave.filter(a => a.player_id === action.player_id);
            const isLastAction = playerActions[playerActions.length - 1].action_sequence === action.action_sequence;
            return {
                player_id: action.player_id,
                street_type: action.street_type,
                action_type: action.action_type,
                bet_size: action.bet_size,
                action_sequence: action.action_sequence,
                is_hero: action.is_hero,
                position: action.position,
                hole_cards: isLastAction ? (playerHoleCards[action.player_id] || null) : null
            };
        });

        const streetCardsData = [];
        if (flopCards) streetCardsData.push({ street_type: 'Flop', cards_notation: flopCards });
        if (turnCard) streetCardsData.push({ street_type: 'Turn', cards_notation: turnCard });
        if (riverCard) streetCardsData.push({ street_type: 'River', cards_notation: riverCard });

        await saveCompleteHandData(savedHand.id, finalActions, streetCardsData, winnerIds, potSize, isHeroWin, finalStageValue);

        // Reset state
        setCurrentHand(null);
        setStage('setup');
        setButtonPlayerId('');
        setDealtOutPlayers([]);
        setActivePlayers([]);
        setActionSequence(0);
        setPotSize(0);
        setFlopCards('');
        setTurnCard('');
        setRiverCard('');
        setStreetActions([]);
        setAllHandActions([]);
        setPlayersInHand([]);
        setPlayerHoleCards({});
        setPlayerBets({});
        setStreetPlayerBets({});
        setLastAggressorIndex(null);
        setActionHistory([]);
    }, [currentHand, persistence, activePlayers, heroPlayer, seatPositions, game.id, allHandActions, createNewHand, playerHoleCards, flopCards, turnCard, riverCard, potSize, saveCompleteHandData, stage, toast]);

    const moveToNextStreet = useCallback(() => {
        if (!currentHand) return;
        saveStateToHistory();

        const buttonIndex = activePlayers.findIndex(gp => gp.player_id === currentHand.button_player_id);
        const updates = resetForNewStreet({
            stage, activePlayers, currentPlayerIndex, playersInHand, dealtOutPlayers,
            buttonPlayerIndex: buttonIndex, currentBet, potSize, streetPlayerBets,
            totalPlayerBets: playerBets, streetActions, actionSequence, lastAggressorIndex
        }, currentHand.button_player_id);

        if (updates.stage) setStage(updates.stage);

        let finalStartingIndex = updates.currentPlayerIndex;
        if (updates.currentPlayerIndex !== undefined) {
            const startingPlayer = activePlayers[updates.currentPlayerIndex];
            if (startingPlayer && !playersInHand.includes(startingPlayer.player_id)) {
                console.warn(`[PokerEngine] Starting player ${startingPlayer.player?.name} is not in hand. Finding next valid player.`);
                finalStartingIndex = getNextPlayerIndex(
                    (updates.currentPlayerIndex - 1 + activePlayers.length) % activePlayers.length,
                    updates.stage || stage,
                    activePlayers,
                    buttonIndex,
                    playersInHand
                );
            }
            setCurrentPlayerIndex(finalStartingIndex);
        }
        if (updates.currentBet !== undefined) setCurrentBet(updates.currentBet);
        if (updates.streetPlayerBets) setStreetPlayerBets(updates.streetPlayerBets);
        if (updates.streetActions) setStreetActions(updates.streetActions);
        if (updates.lastAggressorIndex !== undefined) setLastAggressorIndex(updates.lastAggressorIndex);
    }, [currentHand, saveStateToHistory, activePlayers, stage, currentPlayerIndex, playersInHand, dealtOutPlayers, currentBet, potSize, streetPlayerBets, playerBets, streetActions, actionSequence, lastAggressorIndex]);

    const recordAction = useCallback(async (actionType: ActionType, betSizeValue?: number) => {
        if (!currentHand || !currentPlayer) return;

        // Strict Validation: Ensure current player is actually in the hand
        if (!playersInHand.includes(currentPlayer.player_id)) {
            console.warn(`[PokerEngine] Attempted action for folded player ${currentPlayer.player?.name}. Skipping.`);
            const buttonIndex = activePlayers.findIndex(gp => gp.player_id === currentHand.button_player_id);
            setCurrentPlayerIndex(getNextPlayerIndex(currentPlayerIndex, stage, activePlayers, buttonIndex, playersInHand));
            return;
        }

        saveStateToHistory();

        const buttonIndex = activePlayers.findIndex(gp => gp.player_id === currentHand.button_player_id);
        const playerPos = getPositionForPlayer(activePlayers, currentHand.button_player_id, currentPlayer.player_id, seatPositions);

        const action: PlayerAction = {
            id: `temp-action-${Date.now()}-${Math.random()}`,
            hand_id: currentHand.id,
            player_id: currentPlayer.player_id,
            street_type: stage === 'preflop' ? 'Preflop' : stage === 'flop' ? 'Flop' : stage === 'turn' ? 'Turn' : 'River',
            action_type: actionType,
            bet_size: betSizeValue || 0,
            action_sequence: actionSequence,
            is_hero: currentPlayer.player_id === heroPlayer?.player_id,
            position: playerPos,
            hole_cards: null,
            created_at: new Date().toISOString()
        };

        setStreetActions(prev => [...prev, action]);
        setAllHandActions(prev => [...prev, action]);

        const updates = processAction({
            stage, activePlayers, currentPlayerIndex, playersInHand, dealtOutPlayers,
            buttonPlayerIndex: buttonIndex, currentBet, potSize, streetPlayerBets,
            totalPlayerBets: playerBets, streetActions, actionSequence, lastAggressorIndex
        }, actionType, betSizeValue || 0);

        if (updates.potSize !== undefined) setPotSize(updates.potSize);
        if (updates.streetPlayerBets) setStreetPlayerBets(updates.streetPlayerBets);
        if (updates.totalPlayerBets) setPlayerBets(updates.totalPlayerBets);
        if (updates.actionSequence !== undefined) setActionSequence(updates.actionSequence);
        if (updates.currentBet !== undefined) setCurrentBet(updates.currentBet);
        if (updates.lastAggressorIndex !== undefined) setLastAggressorIndex(updates.lastAggressorIndex);

        // Fallback: Explicitly calculate updated playersInHand if action is Fold
        // This ensures that even if processAction returns undefined for playersInHand, we correctly filter the player out
        let updatedPlayersInHand = updates.playersInHand || playersInHand;
        if (actionType === 'Fold') {
            const calculatedPlayersInHand = playersInHand.filter(pid => pid !== currentPlayer.player_id);
            if (updatedPlayersInHand.length !== calculatedPlayersInHand.length) {
                updatedPlayersInHand = calculatedPlayersInHand;
                setPlayersInHand(updatedPlayersInHand);
            } else if (updates.playersInHand) {
                setPlayersInHand(updates.playersInHand);
            }
        } else if (updates.playersInHand) {
            setPlayersInHand(updates.playersInHand);
        }

        const endCheck = shouldEndHandEarly(activePlayers, updatedPlayersInHand);
        if (endCheck.shouldEnd && endCheck.winnerId) {
            await finishHand([endCheck.winnerId], stage, action);
            return;
        }

        const isComplete = isBettingRoundComplete(
            stage, activePlayers, updatedPlayersInHand, updates.streetPlayerBets || streetPlayerBets,
            [...streetActions, action], currentHand.button_player_id,
            updates.lastAggressorIndex !== undefined ? updates.lastAggressorIndex : lastAggressorIndex
        );

        if (isComplete) {
            setTimeout(() => moveToNextStreet(), 300);
        } else {
            setCurrentPlayerIndex(getNextPlayerIndex(currentPlayerIndex, stage, activePlayers, buttonIndex, updatedPlayersInHand));
        }
    }, [
        currentHand, currentPlayer, saveStateToHistory, activePlayers, seatPositions,
        stage, actionSequence, heroPlayer, playersInHand, dealtOutPlayers, currentBet,
        potSize, streetPlayerBets, playerBets, streetActions, lastAggressorIndex,
        moveToNextStreet, finishHand, currentPlayerIndex
    ]);

    const canMoveToNextStreet = useCallback(() => {
        if (!currentHand) return false;
        if (stage === 'flop' && !flopCards) return false;
        if (stage === 'turn' && !turnCard) return false;
        if (stage === 'river' && !riverCard) return false;
        if (stage === 'preflop' && !flopCards) return false;
        if (stage === 'flop' && !turnCard) return false;
        if (stage === 'turn' && !riverCard) return false;

        return isBettingRoundComplete(
            stage, activePlayers, playersInHand, streetPlayerBets, streetActions,
            currentHand.button_player_id, lastAggressorIndex
        );
    }, [currentHand, stage, flopCards, turnCard, riverCard, activePlayers, playersInHand, streetPlayerBets, streetActions, lastAggressorIndex]);

    // Restore state
    const restoreState = useCallback((savedState: SavedHandState) => {
        if (!savedState) return;
        setCurrentHand(savedState.currentHand);
        setStage(savedState.stage);
        setButtonPlayerId(savedState.buttonPlayerId);
        setDealtOutPlayers(savedState.dealtOutPlayers);
        setActivePlayers(savedState.activePlayers);
        setCurrentPlayerIndex(savedState.currentPlayerIndex);
        setActionSequence(savedState.actionSequence);
        setCurrentBet(savedState.currentBet);
        setFlopCards(savedState.flopCards);
        setTurnCard(savedState.turnCard);
        setRiverCard(savedState.riverCard);
        setPotSize(savedState.potSize);
        setStreetActions(savedState.streetActions);
        setAllHandActions(savedState.allHandActions);
        setPlayersInHand(savedState.playersInHand);
        setPlayerHoleCards(savedState.playerHoleCards);
        setPlayerBets(savedState.playerBets);
        setStreetPlayerBets(savedState.streetPlayerBets);
        setLastAggressorIndex(savedState.lastAggressorIndex);
        setActionHistory(savedState.actionHistory as unknown as EngineStateSnapshot[]);
    }, []);

    return {
        // State
        currentHand, stage, buttonPlayerId, dealtOutPlayers, activePlayers, currentPlayerIndex,
        actionSequence, currentBet, flopCards, turnCard, riverCard, potSize, streetActions,
        allHandActions, playersInHand, playerHoleCards, playerBets, streetPlayerBets, lastAggressorIndex, actionHistory,
        // Computed
        visualPotSize, currentPlayer, actionsByStreet, canMoveToNextStreet,
        // Methods
        startNewHand, recordAction, moveToNextStreet, finishHand, undoLastAction,
        setFlopCards, setTurnCard, setRiverCard, setPlayerHoleCards, setDealtOutPlayers, setButtonPlayerId,
        restoreState,
        resetHandState: () => {
            persistence.clearHandState();
            setStage('setup');
            setCurrentHand(null);
        }
    };
};
