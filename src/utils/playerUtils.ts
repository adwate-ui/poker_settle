/**
 * Player utilities for handling player-related logic
 */

import { Player } from "@/types/poker";

/**
 * Determine payment preference based on UPI ID
 * If no UPI ID is provided, payment preference should be 'cash'
 */
export function determinePaymentPreference(upiId: string | undefined | null): 'upi' | 'cash' {
  // If UPI ID is provided and not empty, prefer UPI
  if (upiId && upiId.trim().length > 0) {
    return 'upi';
  }
  // Otherwise, prefer cash
  return 'cash';
}

/**
 * Validate UPI ID format
 * Common formats: username@paytm, 9876543210@ybl, name@oksbi, etc.
 */
export function validateUpiId(upiId: string): boolean {
  if (!upiId || upiId.trim().length === 0) {
    return true; // Empty is valid (means cash preference)
  }
  
  // UPI ID should be in format: identifier@provider
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId.trim());
}

/**
 * Format UPI ID for display
 */
export function formatUpiId(upiId: string | undefined | null): string {
  if (!upiId) return 'Not set';
  return upiId.trim();
}

/**
 * Get payment method display name
 */
export function getPaymentMethodDisplay(player: Player): string {
  const preference = player.payment_preference || determinePaymentPreference(player.upi_id);
  
  if (preference === 'cash') {
    return '💵 Cash';
  }
  
  if (player.upi_id) {
    return `📱 UPI (${player.upi_id})`;
  }
  
  return '📱 UPI';
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(paymentPreference: 'upi' | 'cash' | undefined): string {
  if (paymentPreference === 'cash') {
    return '💵';
  }
  return '📱';
}

/**
 * Ensure player has correct payment preference based on UPI ID
 * This should be called when saving/updating player data
 */
export function normalizePlayerPaymentPreference(player: Partial<Player>): Partial<Player> {
  const normalized = { ...player };
  
  // Auto-determine payment preference based on UPI ID if not explicitly set
  if (!normalized.payment_preference || normalized.upi_id !== undefined) {
    normalized.payment_preference = determinePaymentPreference(normalized.upi_id);
  }
  
  return normalized;
}
