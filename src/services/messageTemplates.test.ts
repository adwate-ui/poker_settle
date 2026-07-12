import { describe, it, expect } from 'vitest';
import { generateWhatsAppSessionSummary, WhatsAppSessionSummaryData } from './messageTemplates';

const baseData: WhatsAppSessionSummaryData = {
  playerName: 'Alice',
  gameDate: '2026-07-12',
  netAmount: 0,
  gameLink: 'https://example.com/g/abc',
  settlements: [],
  isWinner: true,
};

describe('generateWhatsAppSessionSummary', () => {
  it('shows "owed to you" for a normal winner', () => {
    const message = generateWhatsAppSessionSummary({
      ...baseData,
      netAmount: 500,
      isWinner: true,
      settlements: [{ from: 'Bob', to: 'Alice', amount: 500 }],
    });

    expect(message).toContain("You're up");
    expect(message).toContain('Owed to you');
    expect(message).toContain('Bob');
    expect(message).not.toContain('You owe');
  });

  it('shows "you owe" for a normal loser', () => {
    const message = generateWhatsAppSessionSummary({
      ...baseData,
      netAmount: -300,
      isWinner: false,
      settlements: [{ from: 'Alice', to: 'Bob', amount: 300 }],
    });

    expect(message).toContain('closed');
    expect(message).toContain('You owe');
    expect(message).toContain('Bob');
    expect(message).toContain('reply *PAID*');
  });

  it('shows the rake-flip branch when the player is up in chip terms but must pay after rake', () => {
    const message = generateWhatsAppSessionSummary({
      ...baseData,
      netAmount: 50,
      isWinner: true,
      settlements: [{ from: 'Alice', to: 'Carol', amount: 150 }],
    });

    expect(message).toContain('You were up');
    expect(message).toContain('after rake');
    expect(message).toContain('You owe');
    expect(message).toContain('Carol');
    expect(message).toContain('Rs. 150');
    expect(message).toContain('reply *PAID*');
    expect(message).not.toContain('Owed to you');
  });

  it('handles a broke-even session with no settlements', () => {
    const message = generateWhatsAppSessionSummary({
      ...baseData,
      netAmount: 0,
      settlements: [],
    });

    expect(message).toContain('broke even');
    expect(message).not.toContain('You owe');
  });

  it('never includes a UPI ID or payment link, even when the settlement carries one', () => {
    const message = generateWhatsAppSessionSummary({
      ...baseData,
      netAmount: -300,
      isWinner: false,
      settlements: [{ from: 'Alice', to: 'Bob', amount: 300, toUpiId: 'bob@upi' } as unknown as { from: string; to: string; amount: number }],
    });

    expect(message).not.toContain('UPI');
    expect(message).not.toContain('Pay now');
    expect(message).not.toContain('upi://');
  });
});
