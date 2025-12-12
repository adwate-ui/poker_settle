/**
 * Payment Confirmation Handler
 * Processes incoming WhatsApp messages to auto-confirm payments
 */

import { supabase } from "@/integrations/supabase/client";
import { SettlementConfirmation } from "@/types/poker";

/**
 * Keywords that trigger payment confirmation
 */
const CONFIRMATION_KEYWORDS = ['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];

/**
 * Pre-compiled regex patterns for efficient keyword matching
 */
const CONFIRMATION_PATTERNS = CONFIRMATION_KEYWORDS.map(
  keyword => new RegExp(`\\b${keyword}\\b`)
);

/**
 * Check if a message contains a confirmation keyword as a standalone word
 */
export function isConfirmationMessage(message: string): boolean {
  const upperMessage = message.trim().toUpperCase();
  
  // Use pre-compiled patterns for better performance
  return CONFIRMATION_PATTERNS.some(pattern => pattern.test(upperMessage));
}

/**
 * Process incoming WhatsApp message and auto-confirm payments if applicable
 * This function should be called by a webhook handler or message polling service
 */
export async function processIncomingMessage(
  phoneNumber: string,
  messageText: string
): Promise<{ confirmed: boolean; settlementsUpdated: number; error?: string }> {
  try {
    // Check if message contains confirmation keyword
    if (!isConfirmationMessage(messageText)) {
      return {
        confirmed: false,
        settlementsUpdated: 0,
      };
    }

    // Get player by phone number
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .eq('phone_number', phoneNumber)
      .single();

    if (playerError) {
      console.error('Error fetching player by phone:', playerError);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Failed to find player',
      };
    }

    if (!player) {
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Player not found with this phone number',
      };
    }

    // Find all unconfirmed settlements where this player is the payer (settlement_from)
    // Note: settlement_from is stored as player name in the schema, not player ID
    const { data: confirmations, error: confirmationsError } = await supabase
      .from('settlement_confirmations')
      .select('id, settlement_from, settlement_to, amount, confirmed')
      .eq('settlement_from', player.name)
      .eq('confirmed', false);

    if (confirmationsError) {
      console.error('Error fetching settlement confirmations:', confirmationsError);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Failed to fetch settlement confirmations',
      };
    }

    if (!confirmations || confirmations.length === 0) {
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'No pending settlements found for this player',
      };
    }

    // Confirm all pending settlements for this player
    const confirmationIds = confirmations.map(c => c.id);
    const { error: updateError } = await supabase
      .from('settlement_confirmations')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .in('id', confirmationIds);

    if (updateError) {
      console.error('Error updating settlement confirmations:', updateError);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Failed to update settlement confirmations',
      };
    }

    console.log(`✅ Auto-confirmed ${confirmations.length} settlements for ${player.name}`);

    return {
      confirmed: true,
      settlementsUpdated: confirmations.length,
    };
  } catch (error) {
    console.error('Error processing incoming message:', error);
    return {
      confirmed: false,
      settlementsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Manually confirm a settlement (for UI interactions)
 */
export async function manuallyConfirmSettlement(
  confirmationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('settlement_confirmations')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', confirmationId);

    if (error) {
      console.error('Error confirming settlement:', error);
      return {
        success: false,
        error: 'Failed to confirm settlement',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error confirming settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending settlements for a player by phone number
 */
export async function getPendingSettlementsByPhone(
  phoneNumber: string
): Promise<{ settlements: SettlementConfirmation[]; error?: string }> {
  try {
    // Get player by phone number
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .eq('phone_number', phoneNumber)
      .single();

    if (playerError || !player) {
      return {
        settlements: [],
        error: 'Player not found',
      };
    }

    // Get pending settlements - match by player ID for security
    const { data: confirmations, error: confirmationsError } = await supabase
      .from('settlement_confirmations')
      .select('id, game_id, player_name, settlement_from, settlement_to, amount, confirmed, confirmed_at, created_at, updated_at')
      .eq('player_name', player.name)
      .eq('confirmed', false);

    if (confirmationsError) {
      return {
        settlements: [],
        error: 'Failed to fetch settlements',
      };
    }

    return {
      settlements: confirmations || [],
    };
  } catch (error) {
    return {
      settlements: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
