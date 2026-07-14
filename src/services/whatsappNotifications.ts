/**
 * WhatsApp Notification Service
 * Handles sending WhatsApp notifications for various events
 */

import { evolutionApiService } from "./evolutionApi";
import {
  generatePlayerWelcomeMessage,
  generateGameCompletionMessage,
  generateGameShareLink,
  formatMessageDate,
  generateWhatsAppSessionSummary,
} from "./messageTemplates";
import { Player, Settlement } from "@/types/poker";

export interface NotificationResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send welcome message to a newly added player
 */
export async function sendPlayerWelcomeNotification(
  player: Player,
  playerLink: string
): Promise<{ success: boolean; error?: string }> {
  if (!player.phone_number) {
    return { success: false, error: "Player has no phone number" };
  }

  if (!evolutionApiService.isConfigured()) {
    console.warn("Evolution API not configured. Notification not sent.");
    return { success: false, error: "WhatsApp service not configured" };
  }

  const message = generatePlayerWelcomeMessage({
    playerName: player.name,
    playerLink,
  });

  const result = await evolutionApiService.sendMessage({
    number: player.phone_number,
    text: message,
  });

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
  if (!evolutionApiService.isConfigured()) {
    console.warn("Evolution API not configured. Notifications not sent.");
    return {
      success: false,
      sent: 0,
      failed: gamePlayers.length,
      errors: ["WhatsApp service not configured"],
    };
  }

  const results: NotificationResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const gameLink = generateGameShareLink(gameId, gameToken);

  for (const gamePlayer of gamePlayers) {
    const player = gamePlayer.player;

    if (!player.phone_number) {
      results.failed++;
      results.errors.push(`${player.name}: No phone number`);
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

    try {
      const result = await evolutionApiService.sendMessage({
        number: player.phone_number,
        text: message,
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${player.name}: ${result.error || "Unknown error"}`);
        results.success = false;
      }
    } catch (error) {
      console.error(`Failed to send completion message to ${player.name}:`, error);
      results.failed++;
      results.errors.push(`${player.name}: Exception - ${error instanceof Error ? error.message : String(error)}`);
      results.success = false;
    }

    // Small delay between messages
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Send a unified session summary notification to each player
 * Includes game summary, share link, and individual settlements
 */
export async function sendSessionSummaryNotification(
  gameDate: string,
  gameLink: string,
  players: Player[],
  gamePlayers: Array<{
    player_id: string;
    net_amount: number;
  }>,
  settlements: Settlement[]
): Promise<NotificationResult> {
  if (!evolutionApiService.isConfigured()) {
    console.warn("Evolution API not configured. Notifications not sent.");
    return {
      success: false,
      sent: 0,
      failed: players.length,
      errors: ["WhatsApp service not configured"],
    };
  }

  const results: NotificationResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const playersMap = new Map(players.map(p => [p.id, p]));
  const processedPlayerIds = new Set<string>();

  // Build every message up front (fast, synchronous) rather than sending
  // as we go. Sending is then a single server-side batch call so delivery
  // isn't tied to the browser tab staying open for the ~1 min+ it can take
  // to work through a full player list against the upstream WhatsApp bridge.
  const toSend: Array<{ playerName: string; phoneNumber: string; text: string }> = [];

  for (const gamePlayer of gamePlayers) {
    // Deduplicate recipients
    if (processedPlayerIds.has(gamePlayer.player_id)) {
      continue;
    }
    processedPlayerIds.add(gamePlayer.player_id);
    const player = playersMap.get(gamePlayer.player_id);
    if (!player) continue;

    if (!player.phone_number) {
      console.error(`WhatsApp Error: No phone number for player ${player.name}`);
      results.failed++;
      results.errors.push(`${player.name}: No phone number`);
      continue;
    }

    try {
      // Filter relevant settlements for this player
      const playerSettlements = settlements.filter(s => s.from === player.name || s.to === player.name);

      const isWinner = gamePlayer.net_amount >= 0;

      const message = generateWhatsAppSessionSummary({
        playerName: player.name,
        gameDate,
        netAmount: gamePlayer.net_amount,
        gameLink,
        settlements: playerSettlements,
        isWinner,
      });

      toSend.push({ playerName: player.name, phoneNumber: player.phone_number, text: message });
    } catch (error) {
      console.error(`Failed to build session summary for ${player.name}:`, error);
      results.failed++;
      results.errors.push(`${player.name}: Exception - ${error instanceof Error ? error.message : String(error)}`);
      results.success = false;
    }
  }

  if (toSend.length > 0) {
    const sendResults = await evolutionApiService.sendBatch(
      toSend.map(({ phoneNumber, text }) => ({ number: phoneNumber, text }))
    );

    sendResults.forEach((result, i) => {
      const { playerName } = toSend[i];
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${playerName}: ${result.error || "Unknown error"}`);
        results.success = false;
      }
    });
  }

  return results;
}

/**
 * Test if WhatsApp notifications are enabled and working
 */
export async function testWhatsAppConnection(): Promise<{ success: boolean; error?: string }> {
  return await evolutionApiService.testConnection();
}

/**
 * Check if WhatsApp service is configured
 */
export function isWhatsAppConfigured(): boolean {
  return evolutionApiService.isConfigured();
}
