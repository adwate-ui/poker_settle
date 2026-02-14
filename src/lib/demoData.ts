import { Player, Game, GamePlayer } from "@/types/poker";
import { supabase } from "@/integrations/supabase/client";

// This file provides realistic demo data for various game states
// It uses fixed UUIDs to maintain consistency during testing

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export const DEMO_PLAYERS: Player[] = [
  {
    id: "p1",
    name: "Alex",
    user_id: DEMO_USER_ID,
    total_games: 15,
    total_profit: 2500,
    phone_number: "+919999999991",
    created_at: new Date().toISOString()
  },
  {
    id: "p2",
    name: "Sam",
    user_id: DEMO_USER_ID,
    total_games: 12,
    total_profit: -1200,
    phone_number: "+919999999992",
    created_at: new Date().toISOString()
  },
  {
    id: "p3",
    name: "Jordan",
    user_id: DEMO_USER_ID,
    total_games: 8,
    total_profit: 450,
    upi_id: "jordan@upi",
    created_at: new Date().toISOString()
  }
];

export const DEMO_GAME: Game = {
  id: "g1",
  user_id: DEMO_USER_ID,
  date: new Date().toISOString(),
  buy_in_amount: 500,
  small_blind: 5,
  big_blind: 10,
  status: "completed",
  created_at: new Date().toISOString(),
  share_token: "demo-token"
};

export const DEMO_GAME_PLAYERS: GamePlayer[] = [
  {
    id: "gp1",
    game_id: "g1",
    player_id: "p1",
    buy_ins: 2,
    final_stack: 2500,
    net_amount: 1500,
    created_at: new Date().toISOString()
  },
  {
    id: "gp2",
    game_id: "g1",
    player_id: "p2",
    buy_ins: 3,
    final_stack: 0,
    net_amount: -1500,
    created_at: new Date().toISOString()
  }
];

// Demo Data Management functions for Profile Page

export const hasDemoData = async (userId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('phone_number', '+919999999991'); // Specific demo player signature

    if (error) return false;
    return (count || 0) > 0;
  } catch (err) {
    console.error('Error checking demo data:', err);
    return false;
  }
};

export const loadDemoData = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Check if already exists to avoid duplicates
    const exists = await hasDemoData(userId);
    if (exists) {
      return { success: false, message: 'Demo data already exists for this account.' };
    }

    // 2. Insert Demo Players
    const demoPlayers = [
      { name: 'Alex', user_id: userId, phone_number: '+919999999991', total_games: 15, total_profit: 2500 },
      { name: 'Sam', user_id: userId, phone_number: '+919999999992', total_games: 12, total_profit: -1200 },
      { name: 'Jordan', user_id: userId, phone_number: '+919999999993', total_games: 8, total_profit: 450 },
      { name: 'Priya', user_id: userId, phone_number: '+919999999994', total_games: 22, total_profit: 5800 },
      { name: 'Rahul', user_id: userId, phone_number: '+919999999995', total_games: 5, total_profit: -800 },
      { name: 'Vikram', user_id: userId, phone_number: '+919999999996', total_games: 18, total_profit: 1200 },
    ];

    const { data: players, error: pError } = await supabase
      .from('players')
      .insert(demoPlayers)
      .select();

    if (pError) throw pError;
    if (!players) throw new Error('Failed to create demo players');

    // 3. Insert Demo Games (over 5 months)
    const now = new Date();
    const demoGames = Array.from({ length: 6 }).map((_, i) => ({
      user_id: userId,
      date: new Date(now.getFullYear(), now.getMonth() - i, 15).toISOString(),
      buy_in_amount: i % 2 === 0 ? 500 : 1000,
      small_blind: i % 2 === 0 ? 5 : 10,
      big_blind: i % 2 === 0 ? 10 : 20,
      status: 'completed',
    }));

    const { data: games, error: gError } = await supabase
      .from('games')
      .insert(demoGames)
      .select();

    if (gError) throw gError;
    if (!games) throw new Error('Failed to create demo games');

    // 4. Create Game Players and History for the latest game
    const latestGame = games[0];
    const gpData = players.map((p, i) => ({
      game_id: latestGame.id,
      player_id: p.id,
      buy_ins: i % 3 + 1,
      final_stack: i % 2 === 0 ? latestGame.buy_in_amount * 3 : 0,
      net_amount: i % 2 === 0 ? latestGame.buy_in_amount : -latestGame.buy_in_amount * (i % 3 + 1),
    }));

    const { error: gpError } = await supabase.from('game_players').insert(gpData);
    if (gpError) throw gpError;

    return { success: true, message: 'Demo archives synchronized. Protocol active.' };
  } catch (err) {
    console.error('Error loading demo data:', err);
    return { success: false, message: 'Encryption failed. Demo data could not be seeded.' };
  }
};

export const clearDemoData = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Identify demo players
    const { data: players, error: pError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .in('phone_number', [
        '+919999999991', '+919999999992', '+919999999993',
        '+919999999994', '+919999999995', '+919999999996'
      ]);

    if (pError) throw pError;
    if (!players || players.length === 0) {
      return { success: true, message: 'No demo protocols found to purge.' };
    }

    const playerIds = players.map(p => p.id);

    // 2. Delete games (which should cascade to game_players and history if DB is set up, 
    // but we'll be thorough if needed. Usually games belongs to user_id, 
    // so we need to be careful not to delete ALL games of the user.)

    // We only delete games that HAVE demo players in them
    const { data: demoGps, error: dge } = await supabase
      .from('game_players')
      .select('game_id')
      .in('player_id', playerIds);

    if (!dge && demoGps && demoGps.length > 0) {
      const gameIds = Array.from(new Set(demoGps.map(dg => dg.game_id)));
      await supabase.from('games').delete().in('id', gameIds);
    }

    // 3. Delete players
    const { error: de } = await supabase.from('players').delete().in('id', playerIds);
    if (de) throw de;

    return { success: true, message: 'Demo protocols purged. System cleared.' };
  } catch (err) {
    console.error('Error clearing demo data:', err);
    return { success: false, message: 'Purge failed. Manual intervention may be required.' };
  }
};

// Legacy seed function
export const seedDemoData = async () => {
  try {
    // Check if demo players exist
    const { data: existingPlayers } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", DEMO_USER_ID);

    if (!existingPlayers || existingPlayers.length === 0) {
      // Seed players
      await supabase.from("players").insert(DEMO_PLAYERS);

      // Seed game
      await supabase.from("games").insert([DEMO_GAME]);

      // Seed game players
      await supabase.from("game_players").insert(DEMO_GAME_PLAYERS);

      // Seed some buy-in history
      const demoBuyInHistory = [
        {
          game_id: "g1",
          player_id: "p1",
          amount: 500,
          created_at: new Date().toISOString()
        }
      ];
      await supabase.from("buy_in_history").insert(demoBuyInHistory);
    }
    return true;
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return false;
  }
};
