/**
 * WhatsApp Message Templates for Poker Settle
 * Standardized message templates for various notifications
 */

import { Player, Settlement } from "@/types/poker";
import { formatIndianNumber } from "@/lib/utils";
import { generateUpiPaymentLink } from "@/utils/upiPaymentLinks";

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
  settlements: Array<Settlement & { toUpiId?: string }>;
  isWinner: boolean;
  totalAmount: number;
  paymentPreference?: 'upi' | 'cash';
  upiId?: string;
  gameDate?: string;
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
• Buy-in: ₹${formatIndianNumber(data.buyInAmount)}
• Final Stack: ₹${formatIndianNumber(data.finalStack)}
• Net ${profitLoss.charAt(0).toUpperCase() + profitLoss.slice(1)}: ₹${formatIndianNumber(Math.abs(data.netAmount))}

📊 *Game Details:*
${data.gameLink}

View the complete game summary and settlement details using the link above.`;
}

/**
 * Generate settlement notification message
 */
export function generateSettlementMessage(data: SettlementMessageData): string {
  const paymentMethod = data.paymentPreference === 'cash' ? '💵 Cash' : '📱 UPI';
  
  let message = `💳 *Settlement Details*

Hi ${data.playerName}!

Here are your settlement details:

`;

  if (data.isWinner) {
    message += `✅ *You will receive: ₹${formatIndianNumber(data.totalAmount)}*\n\n`;
    message += `*Payments from:*\n`;
    
    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. ${settlement.from}: ₹${formatIndianNumber(settlement.amount)}\n`;
    });
    
    message += `\n*Your Payment Method:* ${paymentMethod}\n`;
    
    if (data.paymentPreference === 'upi' && data.upiId) {
      message += `*Your UPI ID:* ${data.upiId}\n`;
      message += `\nℹ️ Share your UPI ID with the payers above for easy payment.\n`;
    }
  } else {
    message += `❌ *You need to pay: ₹${formatIndianNumber(data.totalAmount)}*\n\n`;
    message += `*Payments to:*\n\n`;
    
    data.settlements.forEach((settlement, index) => {
      message += `${index + 1}. *${settlement.to}*: ₹${formatIndianNumber(settlement.amount)}\n`;
      
      // Add UPI payment link if recipient has UPI ID
      if (settlement.toUpiId) {
        const upiLink = generateUpiPaymentLink(
          settlement.toUpiId,
          settlement.to,
          settlement.amount,
          data.gameDate ? `Poker settlement - ${data.gameDate}` : 'Poker settlement'
        );
        message += `   💰 *Quick Pay:* ${upiLink}\n`;
        message += `   📱 UPI ID: ${settlement.toUpiId}\n`;
      }
      message += `\n`;
    });
    
    message += `*Your Payment Method:* ${paymentMethod}\n`;
    
    if (data.settlements.some(s => s.toUpiId)) {
      message += `\n💡 *Tip:* Click the "Quick Pay" links above to open your UPI app and pay instantly!\n`;
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
 */
export function generatePlayerShareLink(playerId: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/players/${playerId}`;
}

/**
 * Generate game link for sharing
 */
export function generateGameShareLink(gameId: string, token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/shared/${token}/game/${gameId}`;
}

/**
 * Format date for messages
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
