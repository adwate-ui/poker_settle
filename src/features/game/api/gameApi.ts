import { supabase } from "@/integrations/supabase/client";
import { Game, Player, GamePlayer, Settlement, SeatPosition, Json, TablePosition, SettlementConfirmation } from "@/types/poker";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "@/lib/notifications";
import { z } from "zod";

import { CurrencyConfig } from "@/config/localization";

const buyInAmountSchema = z.number().min(1, `Buy-in must be at least ${CurrencyConfig.symbol} 1`).max(1000000, `Buy-in cannot exceed ${CurrencyConfig.symbol} 10,00,000`);


/**
 * Transforms raw database game data into the strict Game interface
 */
interface RawGamePlayer {
    id: string;
    game_id: string;
    player_id: string;
    buy_ins: number;
    final_stack: number;
    net_amount: number;
    player?: {
        id: string;
        name: string;
        total_games?: number;
        total_profit?: number;
        phone_number?: string | null;
        upi_id?: string | null;
        payment_preference?: string | null;
    } | null;
}

interface RawGameResponse {
    id: string;
    date: string;
    buy_in_amount: number;
    is_complete: boolean;
    small_blind?: number | null;
    big_blind?: number | null;
    settlements?: Json | null;
    user_id?: string;
    game_players?: RawGamePlayer[] | null;
}

/**
 * Transforms raw database game data into the strict Game interface
 */
export const transformGameData = (rawGame: RawGameResponse): Game => {
    // Runtime check for game_players array
    const gamePlayers = Array.isArray(rawGame.game_players) ? rawGame.game_players : [];

    return {
        id: rawGame.id,
        date: rawGame.date,
        buy_in_amount: Number(rawGame.buy_in_amount),
        is_complete: Boolean(rawGame.is_complete),
        small_blind: rawGame.small_blind ? Number(rawGame.small_blind) : undefined,
        big_blind: rawGame.big_blind ? Number(rawGame.big_blind) : undefined,
        settlements: (rawGame.settlements as unknown as Settlement[]) || [],
        game_players: gamePlayers.map((gp) => ({
            id: gp.id,
            game_id: gp.game_id,
            player_id: gp.player_id,
            buy_ins: Number(gp.buy_ins || 0),
            final_stack: Number(gp.final_stack || 0),
            net_amount: Number(gp.net_amount || 0),
            player: {
                id: gp.player?.id,
                name: gp.player?.name || 'Unknown',
                total_games: Number(gp.player?.total_games || 0),
                total_profit: Number(gp.player?.total_profit || 0),
                phone_number: gp.player?.phone_number || undefined,
                upi_id: gp.player?.upi_id || undefined,
                payment_preference: gp.player?.payment_preference || undefined
            }
        }))
    };
};

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
        return (data || []).map(transformGameData);
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

        return transformGameData(completeGame);
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
): Promise<Game> => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalNet = allGamePlayers.reduce((sum: number, gp: any) => sum + (Number(gp.net_amount) || 0), 0);
    if (Math.abs(totalNet) > 0.01) {
        throw new Error("Total winnings and losses must sum to zero before completing the game");
    }

    const { data, error } = await supabase
        .from("games")
        .update({
            is_complete: true,
            settlements: settlements as unknown as Json
        })
        .eq("id", gameId)
        .select(`
            *,
            game_players(
                *,
                player:players(*)
            )
        `)
        .single();

    if (error) throw error;

    // Create settlement confirmation records
    try {
        await createConfirmations(gameId, settlements);
    } catch (confirmationError) {
        console.error('Failed to create settlement confirmations:', confirmationError);
    }

    return transformGameData(data);
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
            player:players (
              id,
              name,
              payment_preference,
              upi_id,
              total_games,
              total_profit,
              phone_number
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gamePlayers = (playersResult.data || []).map((gp: any): GamePlayer => ({
        id: gp.id,
        game_id: gp.game_id,
        player_id: gp.player_id,
        buy_ins: Number(gp.buy_ins || 0),
        final_stack: Number(gp.final_stack || 0),
        net_amount: Number(gp.net_amount || 0),
        player: {
            id: gp.player?.id,
            name: gp.player?.name || 'Unknown',
            total_games: Number(gp.player?.total_games || 0),
            total_profit: Number(gp.player?.total_profit || 0),
            phone_number: gp.player?.phone_number || undefined,
            upi_id: gp.player?.upi_id || undefined,
            payment_preference: gp.player?.payment_preference || undefined
        }
    })).sort((a, b) => {
        const nameA = (a.player.name ?? '').toLowerCase();
        const nameB = (b.player.name ?? '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    return {
        game: {
            ...gameResult.data,
            settlements: (gameResult.data.settlements as unknown as Settlement[]) || [],
            game_players: gamePlayers
        } as Game,
        gamePlayers,
        tablePositions: (positionsResult.data || []).map((tp): TablePosition => ({
            id: tp.id,
            game_id: tp.game_id,
            snapshot_timestamp: tp.snapshot_timestamp,
            positions: (tp.positions as unknown as SeatPosition[]) || [],
            created_at: tp.created_at
        })),
        confirmations: (confirmationsResult.data || []) as SettlementConfirmation[]
    };
};
