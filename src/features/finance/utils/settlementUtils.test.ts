import { describe, it, expect } from 'vitest';
import {
  calculateOptimizedSettlements,
  calculateSettlementsWithPreferences,
  applyRake,
  pairKey,
  PlayerBalance,
} from './settlementUtils';

describe('calculateOptimizedSettlements', () => {
  it('produces a zero-sum settlement with the minimum number of transactions', () => {
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 100 },
      { name: 'B', amount: -60 },
      { name: 'C', amount: -40 },
    ];

    const settlements = calculateOptimizedSettlements(balances);

    const totalPaid = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalPaid).toBe(100);
    expect(settlements).toHaveLength(2);
  });

  it('applies manual transfers before computing auto-settlements', () => {
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 50 },
      { name: 'B', amount: -50 },
    ];

    const settlements = calculateOptimizedSettlements(balances, [
      { from: 'B', to: 'A', amount: 50 },
    ]);

    expect(settlements).toHaveLength(0);
  });
});

describe('calculateSettlementsWithPreferences', () => {
  it('settles preferred pairs directly even when it increases transaction count', () => {
    // A is owed 100 total, from B(-60) and C(-40).
    // D is owed nothing. Preferred pair: A-C should settle directly first.
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 100 },
      { name: 'B', amount: -60 },
      { name: 'C', amount: -40 },
    ];
    const preferredPairs = new Set([pairKey('A', 'C')]);

    const settlements = calculateSettlementsWithPreferences(balances, [], preferredPairs);

    const aFromC = settlements.find(s => s.from === 'C' && s.to === 'A');
    expect(aFromC).toBeDefined();
    expect(aFromC?.amount).toBe(40);

    const totalPaid = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalPaid).toBe(100);
  });

  it('skips an avoid pair when an alternative winner can cover the full debt', () => {
    // C owes 50. Winners are A(+60) and B(+20). Avoid pair: B-C.
    // A alone can cover all of C's debt, so B-C should never be used.
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 60 },
      { name: 'B', amount: 20 },
      { name: 'C', amount: -50 },
    ];
    const avoidPairs = new Set([pairKey('B', 'C')]);

    const settlements = calculateSettlementsWithPreferences(balances, [], new Set(), avoidPairs);

    const bFromC = settlements.find(s => s.from === 'C' && s.to === 'B');
    expect(bFromC).toBeUndefined();

    const aFromC = settlements.find(s => s.from === 'C' && s.to === 'A');
    expect(aFromC).toBeDefined();
    expect(aFromC?.amount).toBe(50);
  });

  it('falls back to an avoid pair when it is the only option left', () => {
    // Only one winner (A) and one loser (B), and A-B is an avoid pair.
    // There's no alternative, so it must still settle.
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 50 },
      { name: 'B', amount: -50 },
    ];
    const avoidPairs = new Set([pairKey('A', 'B')]);

    const settlements = calculateSettlementsWithPreferences(balances, [], new Set(), avoidPairs);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({ from: 'B', to: 'A', amount: 50 });
  });

  it('delegates to calculateOptimizedSettlements when no preferences are set', () => {
    const balances: PlayerBalance[] = [
      { name: 'A', amount: 100 },
      { name: 'B', amount: -100 },
    ];

    const withPrefs = calculateSettlementsWithPreferences(balances);
    const plain = calculateOptimizedSettlements(balances);

    expect(withPrefs).toEqual(plain);
  });
});

describe('applyRake', () => {
  it('deducts rake from non-host players whose final stack exceeds the rake, and credits the host', () => {
    const balances: PlayerBalance[] = [
      { name: 'Host', amount: -20 },
      { name: 'Player', amount: 20 },
    ];
    const finalStacks = new Map([
      ['Host', 480],
      ['Player', 520],
    ]);

    const result = applyRake(balances, finalStacks, 200, 'Host');

    const player = result.find(b => b.name === 'Player');
    const host = result.find(b => b.name === 'Host');
    expect(player?.amount).toBe(-180); // 20 - 200
    expect(host?.amount).toBe(180); // -20 + 200
  });

  it('is a no-op when rake is zero or host is missing', () => {
    const balances: PlayerBalance[] = [{ name: 'A', amount: 10 }];
    expect(applyRake(balances, new Map(), 0, 'A')).toEqual(balances);
    expect(applyRake(balances, new Map(), 100, null)).toEqual(balances);
  });
});
