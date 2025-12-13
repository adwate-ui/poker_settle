/**
 * Email Notification Service
 * Handles sending email notifications for various events
 * Replacement for WhatsApp notifications
 */

import { emailService } from "./emailService";
import {
  generatePlayerWelcomeMessage,
  generateGameCompletionMessage,
  generateSettlementMessage,
  generateCombinedGameSettlementMessage,
  generateGameShareLink,
  formatMessageDate,
} from "./messageTemplates";
import { Player, Settlement } from "@/types/poker";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send welcome email to a newly added player
 */
export async function sendPlayerWelcomeNotification(
  player: Player,
  playerLink: string
): Promise<{ success: boolean; error?: string }> {
  // Validate email exists and is not empty
  if (!player.email || !player.email.trim()) {
    console.warn(`⚠️ Cannot send welcome email to ${player.name}: No email address`);
    return { success: false, error: "Player has no email address" };
  }

  if (!emailService.isConfigured()) {
    console.error("❌ Email service not configured. Notification not sent.");
    console.error("Please check environment variables: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_FROM_EMAIL");
    return { success: false, error: "Email service not configured" };
  }

  const message = generatePlayerWelcomeMessage({
    playerName: player.name,
    playerLink,
  });

  const result = await emailService.sendEmail({
    to_email: player.email,
    to_name: player.name,
    subject: "Welcome to Poker Settle! 🎮",
    message,
  });

  if (result.success) {
    console.log(`✅ Welcome email sent to ${player.name} (${player.email})`);
  } else {
    console.error(`❌ Failed to send welcome email to ${player.name}:`, result.error);
  }

  return result;
}

/**
 * Send game completion notifications to all players
 */
export async function sendGameCompletionNotifications(
  gamePlayers: Array<{
    player: Player;
    buy_ins: number;
    final_stack: number;
    net_amount: number;
  }>,
  gameId: string,
  gameDate: string,
  buyInAmount: number,
  gameToken: string
): Promise<NotificationResult> {
  if (!emailService.isConfigured()) {
    console.error("❌ Email service not configured. Game completion notifications not sent.");
    console.error("Please check environment variables: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_FROM_EMAIL");
    return {
      success: false,
      sent: 0,
      failed: gamePlayers.length,
      errors: ["Email service not configured"],
    };
  }

  console.log(`📧 Sending game completion notifications to ${gamePlayers.length} players...`);

  const results: NotificationResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const gameLink = generateGameShareLink(gameId, gameToken);

  for (const gamePlayer of gamePlayers) {
    const player = gamePlayer.player;

    // Validate email exists and is not empty
    if (!player.email || !player.email.trim()) {
      results.failed++;
      results.errors.push(`${player.name}: No email address`);
      continue;
    }

    const message = generateGameCompletionMessage({
      playerName: player.name,
      gameDate: formatMessageDate(gameDate),
      buyInAmount: buyInAmount,
      finalStack: gamePlayer.final_stack,
      netAmount: gamePlayer.net_amount,
      gameLink,
    });

    const result = await emailService.sendEmail({
      to_email: player.email,
      to_name: player.name,
      subject: `Poker Game Completed - ${formatMessageDate(gameDate)} ${gamePlayer.net_amount >= 0 ? '🎉' : '📉'}`,
      message,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${player.name}: ${result.error || "Unknown error"}`);
      results.success = false;
    }

    // Small delay between messages
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Send settlement notifications to players
 */
export async function sendSettlementNotifications(
  settlements: Settlement[],
  playersMap: Map<string, Player>,
  gameDate?: string,
  gameId?: string
): Promise<NotificationResult> {
  if (!emailService.isConfigured()) {
    console.error("❌ Email service not configured. Settlement notifications not sent.");
    console.error("Please check environment variables: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_FROM_EMAIL");
    return {
      success: false,
      sent: 0,
      failed: settlements.length,
      errors: ["Email service not configured"],
    };
  }

  console.log(`📧 Sending settlement notifications for ${settlements.length} settlements...`);

  const results: NotificationResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Fetch settlement confirmations to get UUIDs
  const confirmationsMap = new Map<string, string>();
  if (gameId) {
    try {
      const { data: confirmations } = await supabase
        .from("settlement_confirmations")
        .select("id, settlement_from, settlement_to")
        .eq("game_id", gameId);
      
      if (confirmations) {
        confirmations.forEach((conf) => {
          const key = `${conf.settlement_from}-${conf.settlement_to}`;
          confirmationsMap.set(key, conf.id);
        });
      }
    } catch (error) {
      console.error("Error fetching settlement confirmations:", error);
      // Continue without confirmations if fetch fails
    }
  }

  // Group settlements by player and enrich with recipient UPI IDs and confirmation IDs
  const playerSettlements = new Map<string, { 
    settlements: Array<Settlement & { toUpiId?: string; confirmationId?: string }>; 
    isWinner: boolean; 
    total: number 
  }>();

  settlements.forEach((settlement) => {
    // Get confirmation ID for this settlement
    const confirmationKey = `${settlement.from}-${settlement.to}`;
    const confirmationId = confirmationsMap.get(confirmationKey);

    // For payer (from)
    if (!playerSettlements.has(settlement.from)) {
      playerSettlements.set(settlement.from, {
        settlements: [],
        isWinner: false,
        total: 0,
      });
    }
    const fromData = playerSettlements.get(settlement.from)!;
    // Add UPI ID of the recipient (to) for payment links and confirmation ID
    const toPlayer = playersMap.get(settlement.to);
    fromData.settlements.push({
      ...settlement,
      toUpiId: toPlayer?.upi_id,
      confirmationId: confirmationId,
    });
    fromData.total += settlement.amount;

    // For receiver (to)
    if (!playerSettlements.has(settlement.to)) {
      playerSettlements.set(settlement.to, {
        settlements: [],
        isWinner: true,
        total: 0,
      });
    }
    const toData = playerSettlements.get(settlement.to)!;
    toData.settlements.push({
      ...settlement,
      confirmationId: confirmationId,
    });
    toData.total += settlement.amount;
  });

  // Send notifications
  for (const [playerName, data] of playerSettlements.entries()) {
    const player = playersMap.get(playerName);

    if (!player) {
      results.failed++;
      results.errors.push(`${playerName}: Player not found`);
      continue;
    }

    // Validate email exists and is not empty
    if (!player.email || !player.email.trim()) {
      results.failed++;
      results.errors.push(`${playerName}: No email address`);
      continue;
    }

    const message = generateSettlementMessage({
      playerName,
      settlements: data.settlements,
      isWinner: data.isWinner,
      totalAmount: data.total,
      paymentPreference: player.payment_preference,
      upiId: player.upi_id,
      gameDate,
    });

    const result = await emailService.sendEmail({
      to_email: player.email,
      to_name: player.name,
      subject: `Settlement Details - Poker Game ${data.isWinner ? '💰' : '💳'}`,
      message,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${playerName}: ${result.error || "Unknown error"}`);
      results.success = false;
    }

    // Small delay between messages
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Send combined game completion and settlement notifications to all players
 * This function sends a single email containing both game summary and settlement details
 */
export async function sendCombinedGameSettlementNotifications(
  gamePlayers: Array<{
    player: Player;
    buy_ins: number;
    final_stack: number;
    net_amount: number;
  }>,
  settlements: Settlement[],
  gameId: string,
  gameDate: string,
  buyInAmount: number,
  gameToken: string
): Promise<NotificationResult> {
  if (!emailService.isConfigured()) {
    console.error("❌ Email service not configured. Combined notifications not sent.");
    return {
      success: false,
      sent: 0,
      failed: gamePlayers.length,
      errors: ["Email service not configured"],
    };
  }

  console.log(`📧 Sending combined game & settlement notifications to ${gamePlayers.length} players...`);

  const results: NotificationResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const gameLink = generateGameShareLink(gameId, gameToken);

  // Build players map for quick lookup
  const playersMap = new Map<string, Player>();
  gamePlayers.forEach((gp) => {
    if (gp.player?.name) {
      playersMap.set(gp.player.name, gp.player);
    }
  });

  // Fetch settlement confirmations to get UUIDs
  const confirmationsMap = new Map<string, string>();
  try {
    const { data: confirmations } = await supabase
      .from("settlement_confirmations")
      .select("id, settlement_from, settlement_to")
      .eq("game_id", gameId);
    
    if (confirmations) {
      confirmations.forEach((conf) => {
        const key = `${conf.settlement_from}-${conf.settlement_to}`;
        confirmationsMap.set(key, conf.id);
      });
    }
  } catch (error) {
    console.error("Error fetching settlement confirmations:", error);
    // Continue without confirmations if fetch fails
  }

  // Group settlements by player and enrich with recipient UPI IDs and confirmation IDs
  const playerSettlements = new Map<string, { 
    settlements: Array<Settlement & { toUpiId?: string; confirmationId?: string }>; 
    isWinner: boolean; 
    total: number 
  }>();

  settlements.forEach((settlement) => {
    // Get confirmation ID for this settlement
    const confirmationKey = `${settlement.from}-${settlement.to}`;
    const confirmationId = confirmationsMap.get(confirmationKey);

    // For payer (from)
    if (!playerSettlements.has(settlement.from)) {
      playerSettlements.set(settlement.from, {
        settlements: [],
        isWinner: false,
        total: 0,
      });
    }
    const fromData = playerSettlements.get(settlement.from)!;
    // Add UPI ID of the recipient (to) for payment links and confirmation ID
    const toPlayer = playersMap.get(settlement.to);
    fromData.settlements.push({
      ...settlement,
      toUpiId: toPlayer?.upi_id,
      confirmationId: confirmationId,
    });
    fromData.total += settlement.amount;

    // For receiver (to)
    if (!playerSettlements.has(settlement.to)) {
      playerSettlements.set(settlement.to, {
        settlements: [],
        isWinner: true,
        total: 0,
      });
    }
    const toData = playerSettlements.get(settlement.to)!;
    toData.settlements.push({
      ...settlement,
      confirmationId: confirmationId,
    });
    toData.total += settlement.amount;
  });

  for (const gamePlayer of gamePlayers) {
    const player = gamePlayer.player;

    // Validate email exists and is not empty
    if (!player.email || !player.email.trim()) {
      results.failed++;
      results.errors.push(`${player.name}: No email address`);
      continue;
    }

    // Get settlement data for this player
    const settlementData = playerSettlements.get(player.name) || {
      settlements: [],
      isWinner: false,
      total: 0,
    };

    const message = generateCombinedGameSettlementMessage({
      playerName: player.name,
      gameDate: formatMessageDate(gameDate),
      buyInAmount: buyInAmount,
      finalStack: gamePlayer.final_stack,
      netAmount: gamePlayer.net_amount,
      gameLink,
      settlements: settlementData.settlements,
      isWinner: settlementData.isWinner,
      totalAmount: settlementData.total,
      paymentPreference: player.payment_preference,
      upiId: player.upi_id,
    });

    const result = await emailService.sendEmail({
      to_email: player.email,
      to_name: player.name,
      subject: `Poker Game Settlement - ${formatMessageDate(gameDate)} ${settlementData.isWinner ? '💰' : '💳'}`,
      message,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${player.name}: ${result.error || "Unknown error"}`);
      results.success = false;
    }

    // Small delay between messages
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Test if email notifications are enabled and working
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  return await emailService.testConnection();
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return emailService.isConfigured();
}

/**
 * Get email service configuration status for debugging
 */
export function getEmailConfigStatus() {
  return emailService.getConfigStatus();
}
