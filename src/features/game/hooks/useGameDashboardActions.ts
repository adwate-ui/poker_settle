import { useCallback } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/notifications';
import { ErrorMessages } from '@/lib/errorUtils';
import { GamePlayer, Settlement, SeatPosition } from '@/types/poker';
import { useNavigate } from 'react-router-dom';
import { calculateOptimizedSettlements, PlayerBalance } from '@/features/finance/utils/settlementUtils';
import { PaymentMethodConfig } from '@/config/localization';
import { sendSessionSummaryNotification } from '@/services/whatsappNotifications';
import { useSharedLink } from '@/hooks/useSharedLink';

export const useGameDashboardActions = () => {
    const {
        game,
        gamePlayers,
        newTransferFrom,
        newTransferTo,
        newTransferAmount,
        setGame,
        setGamePlayers,
        setNewTransferFrom,
        setNewTransferTo,
        setNewTransferAmount,
        setShowManualTransfer,
        setShowAddPlayer,
        setNewPlayerName,
        newPlayerName, // Added
        setShowPositionEditor,
        setCurrentTablePosition,
        setPositionsJustChanged,
        setHandTrackingStage,
        setIsCreatingPlayer,
        isCompletingGame,
        setIsCompletingGame,
        setHasSavedHandState,
        setSearchQuery
    } = useDashboardStore();

    const { updateGamePlayer, createOrFindPlayer, addPlayerToGame, completeGame, saveTablePosition } = useGameData();
    const { createOrGetSharedLink } = useSharedLink();
    const navigate = useNavigate();

    const handlePlayerUpdate = useCallback(async (gamePlayerId: string, updates: Partial<GamePlayer>, logBuyIn: boolean = false) => {
        if (!game) return;

        // 1. Immediate Optimistic Update
        setGamePlayers(prev => prev.map(gp =>
            gp.id === gamePlayerId ? { ...gp, ...updates } : gp
        ));

        try {
            let resolvedId = gamePlayerId;

            // 2. Smart ID Resolution (The Fix)
            if (gamePlayerId.startsWith("temp-")) {
                const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
                if (gamePlayer) {
                    // Fetch the real UUID from the database
                    const { data, error: _error } = await supabase
                        .from("game_players")
                        .select("id")
                        .eq("game_id", game.id)
                        .eq("player_id", gamePlayer.player_id)
                        .maybeSingle();

                    if (data?.id) {
                        resolvedId = data.id;
                        // 3. Self-Correction: Replace temp ID with real ID in local state
                        setGamePlayers(prev => prev.map(gp =>
                            gp.id === gamePlayerId ? { ...gp, id: resolvedId } : gp
                        ));
                    }
                }
            }

            // 4. Execute Update with valid UUID
            await updateGamePlayer(resolvedId, updates, logBuyIn);
        } catch (err) {
            console.error('Error updating player:', err);
            toast.error("Failed to sync player data");
        }
    }, [updateGamePlayer, gamePlayers, game, setGamePlayers]);

    const handleAddBuyIn = useCallback(async (gamePlayerId: string, buyInsToAdd: number) => {
        if (!game) return;
        const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
        if (!gamePlayer) return;

        const newTotal = gamePlayer.buy_ins + buyInsToAdd;
        await handlePlayerUpdate(gamePlayerId, {
            buy_ins: newTotal,
            net_amount: (gamePlayer.final_stack || 0) - (newTotal * game.buy_in_amount)
        }, true);
    }, [gamePlayers, game, handlePlayerUpdate]);

    const handleUpdateFinalStack = useCallback(async (gamePlayerId: string, finalStack: number) => {
        if (!game) return;
        const gamePlayer = gamePlayers.find(gp => gp.id === gamePlayerId);
        if (!gamePlayer) return;

        await handlePlayerUpdate(gamePlayerId, {
            final_stack: finalStack,
            net_amount: finalStack - (gamePlayer.buy_ins * game.buy_in_amount)
        });
    }, [gamePlayers, game, handlePlayerUpdate]);

    const addNewPlayer = useCallback(async () => {
        if (!game || !newPlayerName.trim()) {
            toast.error("Please enter a player name");
            return;
        }

        const nameToAdd = newPlayerName.trim();

        setIsCreatingPlayer(true);
        try {
            const player = await createOrFindPlayer(nameToAdd);
            const gamePlayer = await addPlayerToGame(game.id, player);
            setGamePlayers(prev => [...prev, gamePlayer]);
            setNewPlayerName('');
            setShowAddPlayer(false);
            toast.success(`${player.name} added to game`);
        } catch (error) {
            toast.error(ErrorMessages.player.addToGame(error, nameToAdd));
        } finally {
            setIsCreatingPlayer(false);
        }
    }, [game, newPlayerName, createOrFindPlayer, addPlayerToGame, setIsCreatingPlayer, setGamePlayers, setNewPlayerName, setShowAddPlayer]);

    const addExistingPlayer = useCallback(async (player: any) => {
        if (!game) return;
        setIsCreatingPlayer(true);
        try {
            const gamePlayer = await addPlayerToGame(game.id, player);
            setGamePlayers(prev => [...prev, gamePlayer]);
            setShowAddPlayer(false);
            setSearchQuery('');
            toast.success(`${player.name} added to game`);
        } catch (error) {
            toast.error(ErrorMessages.player.addToGame(error, player.name));
        } finally {
            setIsCreatingPlayer(false);
        }
    }, [game, addPlayerToGame, setIsCreatingPlayer, setGamePlayers, setShowAddPlayer, setSearchQuery]);

    const addManualTransfer = useCallback(async () => {
        if (!game) return;

        if (!newTransferFrom || !newTransferTo || !newTransferAmount || parseFloat(newTransferAmount) <= 0) {
            toast.error("Please fill in sender, recipient, and a valid amount for the transfer.");
            return;
        }

        if (newTransferFrom === newTransferTo) {
            toast.error("Please select different players for sender and recipient.");
            return;
        }

        const newTransfer: Settlement = {
            from: newTransferFrom,
            to: newTransferTo,
            amount: parseFloat(newTransferAmount)
        };

        const updatedSettlements = [...(game.settlements || []), newTransfer];

        const { error } = await supabase
            .from('games')
            .update({ settlements: updatedSettlements as unknown as [] })
            .eq('id', game.id);

        if (error) {
            toast.error(ErrorMessages.transfer.save(error));
            return;
        }

        setGame({ ...game, settlements: updatedSettlements });
        setNewTransferFrom('');
        setNewTransferTo('');
        setNewTransferAmount('');
        setShowManualTransfer(false);
        toast.success("Manual adjustment saved");
    }, [newTransferFrom, newTransferTo, newTransferAmount, game, setGame, setNewTransferFrom, setNewTransferTo, setNewTransferAmount, setShowManualTransfer]);

    const handleDeleteManualTransfer = useCallback(async (index: number) => {
        if (!game) return;

        const updatedSettlements = (game.settlements || []).filter((_, i) => i !== index);

        const { error } = await supabase
            .from('games')
            .update({ settlements: updatedSettlements as unknown as [] })
            .eq('id', game.id);

        if (error) {
            toast.error(ErrorMessages.transfer.delete(error));
            return;
        }

        setGame({ ...game, settlements: updatedSettlements });
        toast.info("Adjustment removed");
    }, [game, setGame]);

    const handleCompleteGame = useCallback(async (settlementsInput: Settlement[] = []) => {
        if (!game || isCompletingGame) return;

        setIsCompletingGame(true);
        const loadingToastId = toast.loading("Saving game..."); // Track toast ID

        try {
            // 0. Determine Settlements
            // If settlementsInput is empty (e.g. called from StackSlide or directly), calculate them here.
            // This ensures uniqueness of logic and prevents empty settlements from being saved if intended otherwise.
            let finalSettlements = settlementsInput;

            if (!finalSettlements || finalSettlements.length === 0) {
                const balances: PlayerBalance[] = gamePlayers.map(gp => ({
                    name: gp.player.name,
                    amount: gp.net_amount,
                    paymentPreference: gp.player.payment_preference || PaymentMethodConfig.digital.key
                }));

                // Get existing manual settlements from game state
                const manualSettlements = (game.settlements || []).filter((s: any) => s.isManual) as Settlement[];

                finalSettlements = calculateOptimizedSettlements(balances, manualSettlements);
            }

            // 1. Complete the game in the database
            await completeGame(game.id, finalSettlements);

            // 2. Verify completion before navigating to prevent 404s or missing data
            let attempts = 0;
            let verified = false;
            const maxAttempts = 15;

            const loadingToast = toast.loading("Verifying game records...");

            while (attempts < maxAttempts && !verified) {
                attempts++;
                try {
                    const { data: gameStatus, error: statusError } = await supabase
                        .from('games')
                        .select('is_complete')
                        .eq('id', game.id)
                        .single();

                    if (!statusError && gameStatus?.is_complete === true) {
                        verified = true;
                        break;
                    }
                } catch (err) {
                    console.warn(`Verification attempt ${attempts} failed:`, err);
                }

                // Wait 1s before next attempt
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            toast.dismiss(loadingToast);

            if (!verified) {
                console.warn("Game verification timed out. Forcing completion status...");
                toast.warning("Finalizing game records...");
                // Fail-safe: Force update
                try {
                    await supabase.from('games').update({ is_complete: true }).eq('id', game.id);
                } catch (e) {
                    console.error("Force update failed", e);
                }
            } else {
                toast.dismiss(loadingToastId); // Ensure initial toast is dismissed if success

                // Send Session Summary Notification
                try {
                    const loadingNotifyToast = toast.loading("Sending notifications...");

                    // Get Access Token for Share Link
                    const linkData = await createOrGetSharedLink('game', game.id);
                    const gameToken = linkData?.accessToken || '';

                    if (gameToken) {
                        const players = gamePlayers.map(gp => gp.player);
                        await sendSessionSummaryNotification(
                            game.id,
                            game.date,
                            gameToken,
                            players,
                            gamePlayers.map(gp => ({
                                player_id: gp.player_id,
                                net_amount: gp.net_amount
                            })),
                            finalSettlements
                        );
                        toast.success("Game finalized & notifications sent!");
                    } else {
                        console.warn("Could not generate share token for notifications");
                        toast.success("Game finalized! (Notifications skipped)");
                    }
                    toast.dismiss(loadingNotifyToast);
                } catch (notifyError) {
                    console.error("Failed to send notifications:", notifyError);
                    toast.error("Game finalized, but failed to send notifications");
                }
            }

            // 3. Navigation
            navigate(`/games/${game.id}`, {
                state: {
                    justCompleted: true,
                    settlements: finalSettlements,
                    gamePlayers: gamePlayers
                }
            });

        } catch (err) {
            toast.dismiss(loadingToastId);
            console.error("Error completing game:", err);
            toast.error(ErrorMessages.game.complete(err)); // Assuming ErrorMessages handles extraction
            setIsCompletingGame(false);
        }
    }, [game, completeGame, navigate, isCompletingGame, gamePlayers, setIsCompletingGame]);

    const handleSaveTablePosition = useCallback(async (positions: SeatPosition[]) => {
        if (!game) return;
        try {
            const savedPosition = await saveTablePosition(game.id, positions);
            setCurrentTablePosition(savedPosition);
            setShowPositionEditor(false);
            setPositionsJustChanged(true);
            setHandTrackingStage('ready');
            toast.success("Seating saved");

            setTimeout(() => setPositionsJustChanged(false), 2000);
        } catch (_error) {
            toast.error("Failed to save seating");
        }
    }, [game, saveTablePosition, setCurrentTablePosition, setShowPositionEditor, setPositionsJustChanged, setHandTrackingStage]);

    const handleStartHandTracking = useCallback(() => {
        setHandTrackingStage('recording');
        // Assuming tablePositionOpen was local, maybe keep it local in dashboard or move to store if needed
        // For strictly following user request, we focus on props.
    }, [setHandTrackingStage]);

    const handleHandComplete = useCallback(() => {
        if (!game) return;
        setHandTrackingStage('ready');

        try {
            const savedHandState = localStorage.getItem(`poker_hand_state_${game.id}`);
            if (savedHandState) {
                const parsedState = JSON.parse(savedHandState);
                const hasSaved = parsedState && parsedState.stage !== 'setup';
                setHasSavedHandState(!!hasSaved);
            } else {
                setHasSavedHandState(false);
            }
        } catch (error) {
            console.error('Error checking archive state:', error);
            setHasSavedHandState(false);
        }
    }, [game, setHandTrackingStage, setHasSavedHandState]);


    return {
        handlePlayerUpdate,
        handleAddBuyIn,
        handleUpdateFinalStack,
        addNewPlayer,
        addExistingPlayer,
        addManualTransfer,
        handleDeleteManualTransfer,
        handleCompleteGame,
        handleSaveTablePosition,
        handleStartHandTracking,
        handleHandComplete
    };
};
