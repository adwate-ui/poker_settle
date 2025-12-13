/**
 * UPI Payment Link Generator
 * Generates UPI intent links for easy mobile payments
 */

/**
 * Generate UPI payment intent link via HTTPS bouncer page
 * Format: /upi-pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
 * 
 * The bouncer page acts as an HTTPS intermediary that redirects to upi:// links,
 * which helps work around restrictions on direct upi:// links in some contexts.
 * 
 * @param upiId - Recipient's UPI ID
 * @param recipientName - Recipient's name
 * @param amount - Payment amount in rupees
 * @param note - Payment note/description
 * @returns HTTPS bouncer URL that redirects to UPI intent
 */
export function generateUpiPaymentLink(
  upiId: string,
  recipientName: string,
  amount: number,
  note?: string
): string {
  // Validate UPI ID format
  if (!isValidUpiId(upiId)) {
    throw new Error('Invalid UPI ID format');
  }

  // Validate amount is positive
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const params = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: recipientName, // Payee name
    am: amount.toFixed(2), // Amount
    cu: 'INR', // Currency
  });

  if (note) {
    params.append('tn', note); // Transaction note
  }

  // Use absolute URL with current origin for the bouncer page
  // For SSR or when window is not available, return a relative URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/upi-pay?${params.toString()}`;
}

/**
 * Generate UPI payment link with game context
 */
export function generateGameSettlementUpiLink(
  upiId: string,
  recipientName: string,
  amount: number,
  gameDate: string
): string {
  const note = `Poker settlement - ${gameDate}`;
  return generateUpiPaymentLink(upiId, recipientName, amount, note);
}

/**
 * Generate a clickable UPI link for WhatsApp messages
 * This creates a link that users can click in WhatsApp to open UPI apps
 */
export function formatUpiLinkForMessage(
  upiId: string,
  recipientName: string,
  amount: number,
  gameDate: string
): string {
  const upiLink = generateGameSettlementUpiLink(upiId, recipientName, amount, gameDate);
  return upiLink;
}

/**
 * Validate UPI ID format
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  // UPI ID format: identifier@provider
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId.trim());
}

/**
 * Generate multiple UPI payment links for settlements
 */
export function generateSettlementUpiLinks(
  settlements: Array<{
    from: string;
    to: string;
    amount: number;
    toUpiId?: string;
  }>,
  gameDate: string
): Map<string, string> {
  const links = new Map<string, string>();

  settlements.forEach(settlement => {
    if (settlement.toUpiId && isValidUpiId(settlement.toUpiId)) {
      const key = `${settlement.from}_to_${settlement.to}`;
      const link = generateGameSettlementUpiLink(
        settlement.toUpiId,
        settlement.to,
        settlement.amount,
        gameDate
      );
      links.set(key, link);
    }
  });

  return links;
}
