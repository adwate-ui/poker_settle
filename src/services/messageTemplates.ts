/**
 * WhatsApp Message Templates for Poker Settle
 * Standardized message templates for various notifications
 */

import { Settlement } from "@/types/poker";
import { formatCurrency } from "@/utils/currencyUtils";
import { generateUpiPaymentLink } from "@/utils/upiPaymentLinks";
import { CurrencyConfig, PaymentMethodConfig } from "@/config/localization";

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

export interface SettlementMessageData {
  playerName: string;
  settlements: Array<Settlement & { toUpiId?: string; confirmationId?: string }>;
  isWinner: boolean;
  totalAmount: number;
  paymentPreference?: string;
  upiId?: string;
  gameDate?: string;
}

export interface CombinedGameSettlementMessageData {
  playerName: string;
  gameDate: string;
  buyInAmount: number;
  finalStack: number;
  netAmount: number;
  gameLink: string;
  settlements: Array<Settlement & { toUpiId?: string; confirmationId?: string }>;
  isWinner: boolean;
  totalAmount: number;
  paymentPreference?: string;
  upiId?: string;
}

export interface WhatsAppSessionSummaryData {
  playerName: string;
  gameDate: string;
  netAmount: number;
  gameLink: string;
  settlements: Array<Settlement & { toUpiId?: string; confirmationId?: string }>;
  isWinner: boolean;
}

/**
 * Generate welcome message for newly added player
 */
export function generatePlayerWelcomeMessage(data: PlayerWelcomeMessageData): string {
  const appName = data.appName || "Poker Settle";

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
 * Generate settlement notification message
 */
export function generateSettlementMessage(data: SettlementMessageData): string {
  const paymentMethod = data.paymentPreference === PaymentMethodConfig.cash.key
    ? `💵 ${PaymentMethodConfig.cash.label}`
    : `📱 ${PaymentMethodConfig.digital.label}`;

  let message = `💳 *Settlement Details*

Hi ${data.playerName}!

Here are your settlement details:

`;

  if (data.isWinner) {
    message += `✅ *You will receive: ${formatCurrency(data.totalAmount)}*\n\n`;
    message += `*Payments from:*\n`;

    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. ${settlement.from}: ${formatCurrency(settlement.amount)}\n`;
    });

    message += `\n*Your Payment Method:* ${paymentMethod}\n`;

    if (data.paymentPreference === PaymentMethodConfig.digital.key && data.upiId) {
      message += `*Your ${PaymentMethodConfig.digital.label} ID:* ${data.upiId}\n`;
      message += `\nℹ️ Share your ID with the payers above for easy payment.\n`;
    }
  } else {
    message += `❌ *You need to pay: ${formatCurrency(data.totalAmount)}*\n\n`;
    message += `*Payments to:*\n\n`;

    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. *${settlement.to}*: ${formatCurrency(settlement.amount)}\n`;

      // Add UPI payment link if recipient has UPI ID
      if (settlement.toUpiId) {
        const upiLink = generateUpiPaymentLink(
          settlement.toUpiId,
          settlement.to,
          settlement.amount,
          data.gameDate ? `Poker settlement - ${data.gameDate}` : 'Poker settlement'
        );
        // Plain UPI link - email service will convert to clickable button automatically
        message += `   ${upiLink}\n`;
        message += `   📱 ${PaymentMethodConfig.digital.label} ID: ${settlement.toUpiId}\n`;
      }
      // Add transaction reference if available
      if (settlement.confirmationId) {
        message += `   📋 Transaction Ref: #${settlement.confirmationId}\n`;
      }
      message += `\n`;
    });

    message += `*Your Payment Method:* ${paymentMethod}\n`;

    if (data.settlements.some(s => s.toUpiId)) {
      message += `\n💡 *How to Pay:*\n`;
      message += `• *On Android/Mobile:* Tap the payment link above - it will open your digital payment app directly with pre-filled details!\n`;
      message += `• *If the link doesn't work:* Copy the ID shown below the link and use it in your payment app's "Pay to ID" option\n`;
      message += `• *On Desktop:* Copy the payment link or ID and use it in your mobile payment app\n`;
    }

    // Add confirmation instruction for payers
    message += `\n⚠️ *IMPORTANT:* After making the payment, please reply with:\n`;
    message += `*PAID*\n`;
    message += `\nThis will automatically confirm your payment and update the settlement records.\n`;
  }

  message += `\nPlease settle at your earliest convenience. Thank you! 🙏`;

  return message;
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
 * Generate combined game completion and settlement message
 * Combines game summary and settlement details into one email
 */
export function generateCombinedGameSettlementMessage(data: CombinedGameSettlementMessageData): string {
  const profitLoss = data.netAmount >= 0 ? "profit" : "loss";
  const emoji = data.netAmount >= 0 ? "🎉" : "📉";
  const paymentMethod = data.paymentPreference === PaymentMethodConfig.cash.key
    ? `💵 ${PaymentMethodConfig.cash.label}`
    : `📱 ${PaymentMethodConfig.digital.label}`;

  let message = `${emoji} *Game Completed - Settlement Details*

Hi ${data.playerName}!

The poker game from ${data.gameDate} has been completed.

💰 *Your Results:*
• Buy-in: ${formatCurrency(data.buyInAmount)}
• Final Stack: ${formatCurrency(data.finalStack)}
• Net ${profitLoss.charAt(0).toUpperCase() + profitLoss.slice(1)}: ${formatCurrency(Math.abs(data.netAmount))}

📊 *Game Details:*
${data.gameLink}

`;

  // Add settlement details
  message += `💳 *Settlement Details:*\n\n`;

  if (data.isWinner) {
    message += `✅ *You will receive: ${formatCurrency(data.totalAmount)}*\n\n`;
    message += `*Payments from:*\n`;

    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. ${settlement.from}: ${formatCurrency(settlement.amount)}\n`;
    });

    message += `\n*Your Payment Method:* ${paymentMethod}\n`;

    if (data.paymentPreference === PaymentMethodConfig.digital.key && data.upiId) {
      message += `*Your ${PaymentMethodConfig.digital.label} ID:* ${data.upiId}\n`;
      message += `\nℹ️ Share your ID with the payers above for easy payment.\n`;
    }
  } else {
    message += `❌ *You need to pay: ${formatCurrency(data.totalAmount)}*\n\n`;
    message += `*Payments to:*\n\n`;

    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. *${settlement.to}*: ${formatCurrency(settlement.amount)}\n`;

      // Add UPI payment link if recipient has UPI ID
      if (settlement.toUpiId) {
        const upiLink = generateUpiPaymentLink(
          settlement.toUpiId,
          settlement.to,
          settlement.amount,
          data.gameDate ? `Poker settlement - ${data.gameDate}` : 'Poker settlement'
        );
        // Plain UPI link - email service will convert to clickable button automatically
        message += `   ${upiLink}\n`;
        message += `   📱 ${PaymentMethodConfig.digital.label} ID: ${settlement.toUpiId}\n`;
      }
      // Add transaction reference if available (UUID)
      if (settlement.confirmationId) {
        message += `   📋 Transaction Ref: #${settlement.confirmationId}\n`;
      }
      message += `\n`;
    });

    message += `*Your Payment Method:* ${paymentMethod}\n`;

    if (data.settlements.some(s => s.toUpiId)) {
      message += `\n💡 *How to Pay:*\n`;
      message += `• *On Android/Mobile:* Tap the payment link above - it will open your digital payment app directly with pre-filled details!\n`;
      message += `• *If the link doesn't work:* Copy the ID shown below the link and use it in your payment app's "Pay to ID" option\n`;
      message += `• *On Desktop:* Copy the payment link or ID and use it in your mobile payment app\n`;
    }

    // Add confirmation instruction for payers
    message += `\n⚠️ *IMPORTANT:* After making the payment, please reply with:\n`;
    message += `*PAID*\n`;
    message += `\nThis will automatically confirm your payment and update the settlement records.\n`;
  }

  message += `\nPlease settle at your earliest convenience. Thank you! 🙏`;

  return message;
}

/**
 * Generate a unified WhatsApp session summary message
 * strictly following the requested mobile-first format
 */
export function generateWhatsAppSessionSummary(data: WhatsAppSessionSummaryData): string {
  const netFormatted = (data.netAmount >= 0 ? '+' : '-') + formatCurrency(Math.abs(data.netAmount));
  const dateObj = new Date(data.gameDate);
  const dateFormatted = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  let message = `♣️ *Poker Session: ${dateFormatted}*\n`;
  message += `💰 *Net: ${netFormatted}*\n\n`;

  message += `📊 *Game Link:* ${data.gameLink}\n\n`;

  if (data.settlements.length > 0) {
    message += `🤝 *Settlements:*\n`;

    data.settlements.forEach((s) => {
      if (data.isWinner) {
        // Player is a winner, they receive money
        message += `• Receive ${formatCurrency(s.amount)} from ${s.from}\n`;
      } else {
        // Player is a loser, they pay money
        message += `• Pay ${s.to} ${formatCurrency(s.amount)}`;

        if (s.toUpiId) {
          const upiLink = generateUpiPaymentLink(
            s.toUpiId,
            s.to,
            s.amount,
            `Poker ${dateFormatted}`
          );
          message += `: ${upiLink}`;
        }
        message += `\n`;
      }
    });
  } else {
    message += `✅ No pending settlements.`;
  }

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
