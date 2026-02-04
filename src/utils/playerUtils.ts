/**
 * Player utilities for handling player-related logic
 */

import { Player } from "@/types/poker";
import { PaymentMethodConfig } from "@/config/localization";



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
  const preference = player.payment_preference || PaymentMethodConfig.digital.key;

  if (preference === PaymentMethodConfig.cash.key) {
    return `💵 ${PaymentMethodConfig.cash.label}`;
  }

  if (player.upi_id) {
    return `📱 ${PaymentMethodConfig.digital.label} (${player.upi_id})`;
  }

  return `📱 ${PaymentMethodConfig.digital.label}`;
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(paymentPreference: string | undefined): string {
  if (paymentPreference === PaymentMethodConfig.cash.key) {
    return '💵';
  }
  return '📱';
}

/**
 * Ensure player has payment preference set
 * Payment preference is now user-controlled and independent of UPI ID
 */
export function normalizePlayerPaymentPreference(player: Partial<Player>): Partial<Player> {
  const normalized = { ...player };

  // Default to digital if not explicitly set
  if (!normalized.payment_preference) {
    normalized.payment_preference = PaymentMethodConfig.digital.key;
  }

  return normalized;
}
