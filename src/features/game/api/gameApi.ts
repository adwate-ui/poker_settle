import { supabase } from "@/integrations/supabase/client";
import { Game, Player, GamePlayer, Settlement, SeatPosition } from "@/types/poker";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { z } from "zod";
import { generateShortCode } from "@/lib/shareUtils";
import { sendCombinedGameSettlementNotifications } from "@/services/emailNotifications";

const buyInAmountSchema = z.number().min(1, "Buy-in must be at least ₹1").max(1000000, "Buy-in cannot exceed ₹10,00,000");

export const fetchGames = async (userId: string, client?: SupabaseClient): Promise<Game[]> => {
    try {
        const supabaseClient = client || supabase;
        const { data, error } = await supabaseClient
            .from("games")
            .select(`
        *,
        game_players (
          *,
          player:players (*)
        )
      `)
            .eq("is_complete", true)
            .eq("user_id", userId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching games:", error);
        toast.error("Failed to fetch games");
        return [];
    }
};

export const createGame = async (userId: string, buyInAmount: number, selectedPlayers: Player[]): Promise<Game> => {
    // Validate buy-in amount
    try {
        buyInAmountSchema.parse(buyInAmount);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message);
        }
        throw error;
    }

    try {
        // Create the game
        const { data: gameData, error: gameError } = await supabase
            .from("games")
            .insert([{
                buy_in_amount: buyInAmount,
                date: new Date().toISOString(),
                is_complete: false,
                user_id: userId
            }])
            .select()
            .single();

        if (gameError) throw gameError;

        // Create game_players entries for each selected player
        const gamePlayersData = selectedPlayers.map(player => ({
            game_id: gameData.id,
            player_id: player.id,
            buy_ins: 1,
            final_stack: 0,
            net_amount: -buyInAmount
        }));

        const { error: gamePlayersError } = await supabase
            .from("game_players")
            .insert(gamePlayersData);

        if (gamePlayersError) throw gamePlayersError;

        // Fetch the complete game with players
        const { data: completeGame, error: fetchError } = await supabase
            .from("games")
            .select(`
        *,
        game_players (
          *,
          player:players (*)
        )
      `)
            .eq("id", gameData.id)
            .single();

        if (fetchError) throw fetchError;

        return completeGame;
    } catch (error) {
        console.error("Error creating game:", error);
        throw error;
    }
};

export const completeGameApi = async (
    userId: string,
    gameId: string,
    settlements: Settlement[],
    createConfirmations: (gameId: string, settlements: Settlement[]) => Promise<void>
) => {
    // Fetch the latest game data
    const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select(`
      *,
      game_players(
        *,
        player:players(*)
      )
    `)
        .eq("id", gameId)
        .single();

    if (gameError) throw gameError;

    const allGamePlayers = gameData.game_players;

    // Check if total net amounts sum to zero
    const totalNet = allGamePlayers.reduce((sum: number, gp: GamePlayer) => sum + (gp.net_amount || 0), 0);
    if (Math.abs(totalNet) > 0.01) {
        throw new Error("Total winnings and losses must sum to zero before completing the game");
    }

    const { error } = await supabase
        .from("games")
        .update({
            is_complete: true,
            settlements: settlements
        })
        .eq("id", gameId);

    if (error) throw error;

    // Create settlement confirmation records
    try {
        await createConfirmations(gameId, settlements);
    } catch (confirmationError) {
        console.error('Failed to create settlement confirmations:', confirmationError);
    }

    // Send email notifications
    try {
        let gameToken = '';

        // Check for existing shared link
        const { data: existingLink, error: fetchLinkError } = await supabase
            .from('shared_links')
            .select('access_token')
            .eq('user_id', userId)
            .eq('resource_type', 'game')
            .eq('resource_id', gameId)
            .maybeSingle();

        if (fetchLinkError) {
            console.error('Error fetching shared link:', fetchLinkError);
        }

        if (existingLink) {
            gameToken = existingLink.access_token;
        } else {
            const shortCode = generateShortCode();
            const { data: newLink, error: createError } = await supabase
                .from('shared_links')
                .insert({
                    user_id: userId,
                    resource_type: 'game',
                    resource_id: gameId,
                    short_code: shortCode,
                })
                .select('access_token')
                .single();

            if (createError) {
                console.error('Error creating shared link:', createError);
            } else if (newLink) {
                gameToken = newLink.access_token;
            }
        }

        // Send combined notifications
        const notificationResult = await sendCombinedGameSettlementNotifications(
            allGamePlayers as GamePlayer[],
            settlements,
            gameId,
            gameData.date,
            gameData.buy_in_amount,
            gameToken
        );

        return notificationResult;
    } catch (notificationError) {
        console.error('Failed to send email notifications:', notificationError);
        throw notificationError;
    }
};

export const updateGamePlayerApi = async (playerGameId: string, updates: Partial<GamePlayer>): Promise<void> => {
    const { error } = await supabase
        .from("game_players")
        .update(updates)
        .eq("id", playerGameId);

    if (error) throw error;
};

export const fetchGameDetail = async (client: SupabaseClient, gameId: string) => {
    const [gameResult, playersResult, positionsResult, confirmationsResult] = await Promise.all([
        client.from("games").select("*").eq("id", gameId).maybeSingle(),
        client
            .from("game_players")
            .select(`
            *,
            players (
              name,
              payment_preference,
              upi_id
            )
          `)
            .eq("game_id", gameId),
        client
            .from("table_positions")
            .select("*")
            .eq("game_id", gameId)
            .order("snapshot_timestamp", { ascending: true }),
        client
            .from("settlement_confirmations")
            .select("*")
            .eq("game_id", gameId)
    ]);

    if (gameResult.error) throw gameResult.error;
    if (!gameResult.data) throw new Error("Game not found");

    return {
        game: gameResult.data,
        gamePlayers: (playersResult.data || []).sort((a, b) => {
            const nameA = (a.players?.name ?? '').toLowerCase();
            const nameB = (b.players?.name ?? '').toLowerCase();
            return nameA.localeCompare(nameB);
        }),
        tablePositions: (positionsResult.data || []).map((tp) => ({
            id: tp.id,
            snapshot_timestamp: tp.snapshot_timestamp,
            positions: tp.positions as unknown as SeatPosition[],
        })),
        confirmations: confirmationsResult.data || []
    };
};
