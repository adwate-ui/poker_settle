/**
 * Player utilities for handling player-related logic
 */



/**
 * Validate UPI ID format
 * Common formats: username@paytm, 9876543210@ybl, name@oksbi, etc.
 */
export function validateUpiId(upiId: string): boolean {
  if (!upiId || upiId.trim().length === 0) {
    return true; // Empty is valid
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
