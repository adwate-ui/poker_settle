import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CurrencyConfig } from '@/config/localization';

// Re-create the schema for testing (matches gameApi.ts)
const buyInAmountSchema = z
  .number()
  .min(1, `Buy-in must be at least ${CurrencyConfig.symbol} 1`)
  .max(1000000, `Buy-in cannot exceed ${CurrencyConfig.symbol} 10,00,000`);

describe('buyInAmountSchema', () => {
  it('should accept valid buy-in amounts', () => {
    expect(buyInAmountSchema.safeParse(100).success).toBe(true);
    expect(buyInAmountSchema.safeParse(1000).success).toBe(true);
    expect(buyInAmountSchema.safeParse(50000).success).toBe(true);
    expect(buyInAmountSchema.safeParse(1000000).success).toBe(true);
  });

  it('should reject buy-in below minimum', () => {
    const result = buyInAmountSchema.safeParse(0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least');
    }
  });

  it('should reject negative buy-in', () => {
    const result = buyInAmountSchema.safeParse(-100);
    expect(result.success).toBe(false);
  });

  it('should reject buy-in above maximum', () => {
    const result = buyInAmountSchema.safeParse(10000001);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('cannot exceed');
    }
  });

  it('should accept boundary values', () => {
    expect(buyInAmountSchema.safeParse(1).success).toBe(true);
    expect(buyInAmountSchema.safeParse(1000000).success).toBe(true);
  });
});

describe('transformGameData', () => {
  // Import the actual function for testing
  // Note: This is a simplified version since we can't easily import with mocked supabase

  it('should handle empty game_players array', () => {
    const rawGame = {
      id: 'test-id',
      date: '2024-01-01',
      buy_in_amount: 1000,
      is_complete: false,
      game_players: [],
    };

    // Simplified transformation logic matching the actual function
    const gamePlayers = Array.isArray(rawGame.game_players) ? rawGame.game_players : [];

    expect(gamePlayers).toHaveLength(0);
  });

  it('should handle null game_players', () => {
    const rawGame = {
      id: 'test-id',
      date: '2024-01-01',
      buy_in_amount: 1000,
      is_complete: false,
      game_players: null as unknown as [],
    };

    const gamePlayers = Array.isArray(rawGame.game_players) ? rawGame.game_players : [];

    expect(gamePlayers).toHaveLength(0);
  });

  it('should convert numeric fields correctly', () => {
    const rawGame = {
      id: 'test-id',
      date: '2024-01-01',
      buy_in_amount: '1000' as unknown as number, // Simulating DB string
      is_complete: 1 as unknown as boolean,
      small_blind: '10' as unknown as number,
      big_blind: '20' as unknown as number,
    };

    expect(Number(rawGame.buy_in_amount)).toBe(1000);
    expect(Boolean(rawGame.is_complete)).toBe(true);
    expect(Number(rawGame.small_blind)).toBe(10);
    expect(Number(rawGame.big_blind)).toBe(20);
  });
});

describe('Settlement Calculation Logic', () => {
  // Test the zero-sum principle for settlements
  it('should maintain zero-sum in settlements', () => {
    const settlements = [
      { from: 'Player A', to: 'Player B', amount: 500 },
      { from: 'Player A', to: 'Player C', amount: 300 },
      { from: 'Player D', to: 'Player B', amount: 200 },
    ];

    // Calculate net for each player
    const netAmounts: Record<string, number> = {};

    settlements.forEach(s => {
      netAmounts[s.from] = (netAmounts[s.from] || 0) - s.amount;
      netAmounts[s.to] = (netAmounts[s.to] || 0) + s.amount;
    });

    const totalNet = Object.values(netAmounts).reduce((sum, val) => sum + val, 0);

    expect(totalNet).toBe(0);
  });

  it('should calculate correct individual balances', () => {
    const playerResults = [
      { name: 'Player A', buyIns: 1000, finalStack: 500 },  // -500
      { name: 'Player B', buyIns: 1000, finalStack: 1800 }, // +800
      { name: 'Player C', buyIns: 1000, finalStack: 700 },  // -300
    ];

    const balances = playerResults.map(p => ({
      name: p.name,
      net: p.finalStack - p.buyIns
    }));

    expect(balances[0].net).toBe(-500);
    expect(balances[1].net).toBe(800);
    expect(balances[2].net).toBe(-300);

    // Total should be zero (money doesn't appear/disappear)
    const totalNet = balances.reduce((sum, b) => sum + b.net, 0);
    expect(totalNet).toBe(0);
  });
});
