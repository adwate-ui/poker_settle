/**
 * WhatsApp Message Templates for PokerSettle
 * Standardized message templates for various notifications
 */

import { Settlement } from "@/types/poker";
import { formatCurrency } from "@/utils/currencyUtils";
import { CurrencyConfig } from "@/config/localization";

export interface PlayerWelcomeMessageData {
  playerName: string;
  playerLink: string;
  appName?: string;
}

export interface GameCompletionMessageData {
  playerName: string;
  gameDate: string;
  buyInAmount: number;
  finalStack: number;
  netAmount: number;
  gameLink: string;
}

export interface WhatsAppSessionSummaryData {
  playerName: string;
  gameDate: string;
  netAmount: number;
  gameLink: string;
  settlements: Settlement[];
  isWinner: boolean;
}

/**
 * Generate welcome message for newly added player
 */
export function generatePlayerWelcomeMessage(data: PlayerWelcomeMessageData): string {
  const appName = data.appName || "PokerSettle";

  return `🎮 *Welcome to ${appName}!*

Hi ${data.playerName}! 👋

You've been added to our poker game tracking system. 

📊 *Your Player Profile:*
${data.playerLink}

You can view your stats, game history, and performance anytime using the link above.

Good luck at the tables! 🃏`;
}

/**
 * Generate game completion summary message
 */
export function generateGameCompletionMessage(data: GameCompletionMessageData): string {
  const profitLoss = data.netAmount >= 0 ? "profit" : "loss";
  const emoji = data.netAmount >= 0 ? "🎉" : "📉";

  return `${emoji} *Game Completed!*

Hi ${data.playerName}!

The poker game from ${data.gameDate} has been completed.

💰 *Your Results:*
• Buy-in: ${formatCurrency(data.buyInAmount)}
• Final Stack: ${formatCurrency(data.finalStack)}
• Net ${profitLoss.charAt(0).toUpperCase() + profitLoss.slice(1)}: ${formatCurrency(Math.abs(data.netAmount))}

📊 *Game Details:*
${data.gameLink}

View the complete game summary and settlement details using the link above.`;
}

/**
 * Generate custom message with game link
 */
export function generateCustomMessage(playerName: string, message: string, gameLink?: string): string {
  let fullMessage = `Hi ${playerName}!\n\n${message}`;

  if (gameLink) {
    fullMessage += `\n\n📊 *Game Link:*\n${gameLink}`;
  }

  return fullMessage;
}

/**
 * Generate player link for sharing
 * Uses read-only shared link with access token
 */
export function generatePlayerShareLink(playerId: string, token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/shared/${encodeURIComponent(token)}/player/${playerId}`;
}

/**
 * Generate game link for sharing
 * Uses read-only shared link with access token
 */
export function generateGameShareLink(gameId: string, token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  // Ensure we use the public shared route, not the authenticated /games/ route
  return `${base}/shared/${encodeURIComponent(token)}/game/${gameId}`;
}

/**
 * Generate a unified WhatsApp session summary message
 * "The Concierge" template — warm, professional, one signature mark
 */
export function generateWhatsAppSessionSummary(data: WhatsAppSessionSummaryData): string {
  const absAmount = formatCurrency(Math.abs(data.netAmount));
  const dateFormatted = new Date(data.gameDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  let message = `🎴 *PokerSettle*\n\n`;
  message += `Hi ${data.playerName}, here's your wrap-up for *${dateFormatted}*.\n\n`;

  // Direction of money movement is derived from the settlements themselves,
  // not from raw netAmount — rake can flip a chip-winner into an actual payer.
  const owedToPlayer = data.settlements.filter((s) => s.to === data.playerName);
  const owedByPlayer = data.settlements.filter((s) => s.from === data.playerName);

  if (data.settlements.length === 0) {
    message += data.netAmount === 0
      ? `You broke even this session.\n\n`
      : `${data.isWinner ? `You're up *${absAmount}* this session.` : `This one closed *${absAmount}* down.`}\n\n`;
  } else if (owedByPlayer.length > 0 && data.isWinner) {
    message += `You were up *${absAmount}* on the table, but after rake this session nets out to a transfer.\n\n`;
    message += `*You owe:*\n`;
    owedByPlayer.forEach((s) => {
      message += `• ${s.to} — ${formatCurrency(s.amount)}\n`;
    });
    message += `\n`;
  } else if (owedByPlayer.length > 0) {
    message += `This one closed *${absAmount}* down.\n\n`;
    message += `*You owe:*\n`;
    owedByPlayer.forEach((s) => {
      message += `• ${s.to} — ${formatCurrency(s.amount)}\n`;
    });
    message += `\n`;
  } else {
    message += `You're up *${absAmount}* this session.\n\n`;
    message += `*Owed to you:*\n`;
    owedToPlayer.forEach((s) => {
      message += `• ${s.from} — ${formatCurrency(s.amount)}\n`;
    });
    message += `\n`;
  }

  message += `Full breakdown:\n${data.gameLink}\n\n`;

  message += owedByPlayer.length > 0
    ? `Once paid, reply *PAID* to confirm. Thanks!`
    : `Nicely played — see you at the next session.`;

  return message;
}

/**
 * Format date for messages
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(CurrencyConfig.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
