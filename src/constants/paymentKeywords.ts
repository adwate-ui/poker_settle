/**
 * Default payment confirmation keywords
 * These are used when a user hasn't configured custom keywords
 */
export const DEFAULT_PAYMENT_KEYWORDS = [
  'PAID',
  'DONE',
  'SETTLED',
  'COMPLETE',
  'CONFIRMED'
] as const;

export type PaymentKeyword = typeof DEFAULT_PAYMENT_KEYWORDS[number];
