import { supabase } from '@/integrations/supabase/client';

// Demo player data
const DEMO_PLAYERS = [
  { name: 'Alex "The Shark" Johnson', email: 'alex@demo.test', upi_id: 'alex@upi' },
  { name: 'Sam Chen', email: 'sam@demo.test', upi_id: 'samchen@upi' },
  { name: 'Jordan Williams', email: 'jordan@demo.test', upi_id: 'jordan@upi' },
  { name: 'Taylor Swift', email: 'taylor@demo.test', upi_id: 'taylor@upi' },
  { name: 'Morgan Lee', email: 'morgan@demo.test', upi_id: 'morgan@upi' },
  { name: 'Casey Brooks', email: 'casey@demo.test', upi_id: 'casey@upi' },
];

// Generate a random date within the past N months
const randomPastDate = (monthsAgo: number): string => {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - Math.floor(Math.random() * monthsAgo));
  past.setDate(Math.floor(Math.random() * 28) + 1);
  past.setHours(Math.floor(Math.random() * 4) + 18); // Evening games 6pm-10pm
  past.setMinutes(Math.floor(Math.random() * 60));
  return past.toISOString();
};

// Generate buy-in variations
const generateBuyIns = (playerCount: number, buyInAmount: number): number[] => {
  const buyIns: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    // Some players buy in multiple times
    const baseBuyIns = Math.random() > 0.3 ? 1 : Math.floor(Math.random() * 2) + 2;
    buyIns.push(baseBuyIns);
  }
  return buyIns;
};

// Generate final stacks that roughly balance (with some variance)
const generateFinalStacks = (
  buyIns: number[],
  buyInAmount: number
): number[] => {
  const totalPot = buyIns.reduce((sum, bi) => sum + bi * buyInAmount, 0);
  const playerCount = buyIns.length;

  // Generate random final stacks that sum to total pot
  let stacks: number[] = [];
  let remaining = totalPot;

  for (let i = 0; i < playerCount - 1; i++) {
    // Generate a stack with some variance
    const avgShare = remaining / (playerCount - i);
    const variance = avgShare * 0.6; // 60% variance
    let stack = Math.round(avgShare + (Math.random() * 2 - 1) * variance);
    stack = Math.max(0, stack); // No negative stacks
    stack = Math.min(remaining, stack); // Can't exceed remaining
    stack = Math.round(stack / 10) * 10; // Round to nearest 10
    stacks.push(stack);
    remaining -= stack;
  }
  stacks.push(remaining); // Last player gets the rest

  // Shuffle to randomize who wins/loses
  return stacks.sort(() => Math.random() - 0.5);
};

// Demo game configurations
const DEMO_GAME_CONFIGS = [
  { buyInAmount: 50, playerIndices: [0, 1, 2, 3] },
  { buyInAmount: 100, playerIndices: [0, 1, 2, 4, 5] },
  { buyInAmount: 50, playerIndices: [1, 2, 3, 5] },
  { buyInAmount: 200, playerIndices: [0, 2, 3, 4] },
  { buyInAmount: 50, playerIndices: [0, 1, 3, 4, 5] },
  { buyInAmount: 100, playerIndices: [0, 1, 2, 3, 4, 5] },
];

export interface DemoDataResult {
  success: boolean;
  message: string;
  playersCreated: number;
  gamesCreated: number;
}

/**
 * Loads demo data into the current user's account
 */
export const loadDemoData = async (userId: string): Promise<DemoDataResult> => {
  try {
    // Step 1: Create demo players
    const createdPlayers: { id: string; name: string }[] = [];

    for (const playerData of DEMO_PLAYERS) {
      const { data: player, error } = await supabase
        .from('players')
        .insert({
          user_id: userId,
          name: playerData.name,
          email: playerData.email,
          upi_id: playerData.upi_id,
        })
        .select('id, name')
        .single();

      if (error) {
        console.error('Error creating demo player:', error);
        continue;
      }

      if (player) {
        createdPlayers.push(player);
      }
    }

    if (createdPlayers.length === 0) {
      return {
        success: false,
        message: 'Failed to create demo players',
        playersCreated: 0,
        gamesCreated: 0,
      };
    }

    // Step 2: Create demo games
    let gamesCreated = 0;

    for (let i = 0; i < DEMO_GAME_CONFIGS.length; i++) {
      const config = DEMO_GAME_CONFIGS[i];
      const gameDate = randomPastDate(5); // Games within past 5 months

      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          user_id: userId,
          buy_in_amount: config.buyInAmount,
          status: 'completed',
          created_at: gameDate,
          is_shared: false,
        })
        .select('id')
        .single();

      if (gameError || !game) {
        console.error('Error creating demo game:', gameError);
        continue;
      }

      // Get players for this game
      const gamePlayers = config.playerIndices
        .map(idx => createdPlayers[idx])
        .filter(Boolean);

      if (gamePlayers.length < 2) continue;

      // Generate buy-ins and final stacks
      const buyIns = generateBuyIns(gamePlayers.length, config.buyInAmount);
      const finalStacks = generateFinalStacks(buyIns, config.buyInAmount);

      // Add players to the game
      for (let j = 0; j < gamePlayers.length; j++) {
        const { data: gamePlayer, error: gpError } = await supabase
          .from('game_players')
          .insert({
            game_id: game.id,
            player_id: gamePlayers[j].id,
            buy_ins: buyIns[j],
            final_stack: finalStacks[j],
          })
          .select('id')
          .single();

        if (gpError || !gamePlayer) {
          console.error('Error adding player to game:', gpError);
          continue;
        }

        // Create buy-in history entries
        for (let k = 0; k < buyIns[j]; k++) {
          const buyInTime = new Date(gameDate);
          buyInTime.setMinutes(buyInTime.getMinutes() + k * 45); // Spread buy-ins over time

          await supabase.from('buy_in_history').insert({
            game_player_id: gamePlayer.id,
            amount: config.buyInAmount,
            created_at: buyInTime.toISOString(),
          });
        }
      }

      // Create settlements for the game
      const settlements = calculateSettlements(
        gamePlayers.map((p, idx) => ({
          id: p.id,
          name: p.name,
          buyIns: buyIns[idx],
          finalStack: finalStacks[idx],
        })),
        config.buyInAmount
      );

      for (const settlement of settlements) {
        const fromPlayer = gamePlayers.find(p => p.name === settlement.from);
        const toPlayer = gamePlayers.find(p => p.name === settlement.to);

        if (fromPlayer && toPlayer) {
          await supabase.from('settlements').insert({
            game_id: game.id,
            from_player_id: fromPlayer.id,
            to_player_id: toPlayer.id,
            amount: settlement.amount,
            status: Math.random() > 0.3 ? 'completed' : 'pending', // Some pending
          });
        }
      }

      gamesCreated++;
    }

    return {
      success: true,
      message: `Demo data loaded! Created ${createdPlayers.length} players and ${gamesCreated} games.`,
      playersCreated: createdPlayers.length,
      gamesCreated,
    };
  } catch (error) {
    console.error('Error loading demo data:', error);
    return {
      success: false,
      message: 'An error occurred while loading demo data',
      playersCreated: 0,
      gamesCreated: 0,
    };
  }
};

// Simple settlement calculation for demo data
interface PlayerResult {
  id: string;
  name: string;
  buyIns: number;
  finalStack: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const calculateSettlements = (
  players: PlayerResult[],
  buyInAmount: number
): Settlement[] => {
  const settlements: Settlement[] = [];

  // Calculate net for each player
  const nets = players.map(p => ({
    name: p.name,
    net: p.finalStack - (p.buyIns * buyInAmount),
  }));

  // Sort by net (losers first, winners last)
  nets.sort((a, b) => a.net - b.net);

  // Simple settlement: losers pay winners
  let i = 0; // losers pointer
  let j = nets.length - 1; // winners pointer

  while (i < j) {
    const loser = nets[i];
    const winner = nets[j];

    if (loser.net >= 0 || winner.net <= 0) break;

    const amount = Math.min(Math.abs(loser.net), winner.net);

    if (amount > 0) {
      settlements.push({
        from: loser.name,
        to: winner.name,
        amount,
      });
    }

    loser.net += amount;
    winner.net -= amount;

    if (loser.net >= 0) i++;
    if (winner.net <= 0) j--;
  }

  return settlements;
};

/**
 * Clears all demo data (players with @demo.test email and their associated games)
 */
export const clearDemoData = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Find demo players
    const { data: demoPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .like('email', '%@demo.test');

    if (!demoPlayers || demoPlayers.length === 0) {
      return {
        success: true,
        message: 'No demo data found to clear.',
      };
    }

    const demoPlayerIds = demoPlayers.map(p => p.id);

    // Find games that only have demo players
    const { data: gamePlayersData } = await supabase
      .from('game_players')
      .select('game_id, player_id')
      .in('player_id', demoPlayerIds);

    if (gamePlayersData) {
      // Get unique game IDs
      const gameIds = [...new Set(gamePlayersData.map(gp => gp.game_id))];

      // Delete settlements for these games
      for (const gameId of gameIds) {
        await supabase.from('settlements').delete().eq('game_id', gameId);
      }

      // Delete game players and their buy-in history
      for (const gameId of gameIds) {
        const { data: gamePlayers } = await supabase
          .from('game_players')
          .select('id')
          .eq('game_id', gameId);

        if (gamePlayers) {
          for (const gp of gamePlayers) {
            await supabase.from('buy_in_history').delete().eq('game_player_id', gp.id);
          }
        }

        await supabase.from('game_players').delete().eq('game_id', gameId);
      }

      // Delete games
      await supabase.from('games').delete().in('id', gameIds);
    }

    // Delete demo players
    await supabase.from('players').delete().in('id', demoPlayerIds);

    return {
      success: true,
      message: `Cleared ${demoPlayers.length} demo players and their games.`,
    };
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return {
      success: false,
      message: 'An error occurred while clearing demo data',
    };
  }
};

/**
 * Check if demo data exists for a user
 */
export const hasDemoData = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', userId)
    .like('email', '%@demo.test')
    .limit(1);

  return (data?.length ?? 0) > 0;
};
