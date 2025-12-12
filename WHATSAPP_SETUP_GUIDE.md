# WhatsApp Integration Setup Guide

This guide will help you set up WhatsApp integration using Evolution API for the Poker Settle application.

## Prerequisites

1. A running Evolution API instance (https://github.com/EvolutionAPI/evolution-api)
2. A WhatsApp number connected to your Evolution API instance
3. Access to your Supabase SQL Editor

## Setup Steps

### Step 1: Update Database Schema

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the entire content of `WHATSAPP_SCHEMA_UPDATE.sql`
4. Click **Run** to execute the SQL script
5. Verify the changes by running the verification queries at the bottom of the script

**What this does:**
- Adds `phone_number` field to store WhatsApp numbers
- Adds `upi_id` field to store UPI payment IDs
- Adds `payment_preference` field (auto-set to 'cash' if no UPI ID)
- Adds `settlements` field to games table for storing settlement calculations

### Step 2: Configure Evolution API

1. Set up your Evolution API instance following their [documentation](https://github.com/EvolutionAPI/evolution-api)
2. Create a WhatsApp instance in Evolution API
3. Connect your WhatsApp number to the instance
4. Note down the following:
   - **API Base URL** (e.g., `https://your-evolution-api.com`)
   - **API Key** (from Evolution API dashboard)
   - **Instance Name** (the name you gave your WhatsApp instance)

### Step 3: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Evolution API Configuration
VITE_EVOLUTION_API_URL=https://your-evolution-api.com
VITE_EVOLUTION_API_KEY=your_api_key_here
VITE_EVOLUTION_INSTANCE_NAME=your_instance_name
```

**Important:** Replace the placeholder values with your actual Evolution API credentials.

### Step 4: Rebuild and Deploy

```bash
# Install dependencies (if not already installed)
npm install

# Build the application
npm run build

# For local testing
npm run dev
```

## Features

### 1. Player WhatsApp Notifications

When a player is added to the system, they automatically receive:
- Welcome message with their player profile link
- Access to view their stats and game history

### 2. Game Completion Notifications

When a game is completed, all players receive:
- Game summary with their results
- Buy-in amount, final stack, and net profit/loss
- Link to view complete game details

### 3. Settlement Notifications

Players receive settlement details including:
- Who they need to pay or who will pay them
- Payment amounts
- Their payment method (UPI ID or Cash preference)

### 4. Optimized Settlement Calculation

The settlement algorithm now:
1. **Prioritizes cash players**: Settles debts among cash players first
2. **Minimizes mixed transactions**: Reduces transfers between cash and UPI players
3. **Shows payment preferences**: Displays whether each player prefers cash or UPI

## Player Setup

### Adding a New Player

When adding a player, you can now specify:

1. **Name** (Required)
   - Player's display name

2. **WhatsApp Number** (Optional)
   - Format: `+919876543210` (with country code)
   - Used for receiving game notifications

3. **UPI ID** (Optional)
   - Format: `username@paytm` or `9876543210@ybl`
   - If provided, player is marked as UPI preference
   - If empty, player automatically gets Cash preference

### Payment Preference Logic

- **Has UPI ID** → Payment Preference = UPI
- **No UPI ID** → Payment Preference = Cash

This is automatically determined and cannot be manually overridden to ensure consistency.

## Message Templates

The system uses standardized message templates for:

### Welcome Message
```
🎮 Welcome to Poker Settle!

Hi [Player Name]! 👋

You've been added to our poker game tracking system.

📊 Your Player Profile:
[Profile Link]

You can view your stats, game history, and performance anytime.

Good luck at the tables! 🃏
```

### Game Completion Message
```
🎉 Game Completed!

Hi [Player Name]!

The poker game from [Date] has been completed.

💰 Your Results:
• Buy-in: ₹[Amount]
• Final Stack: ₹[Amount]
• Net Profit/Loss: ₹[Amount]

📊 Game Details:
[Game Link]
```

### Settlement Message
```
💳 Settlement Details

Hi [Player Name]!

✅ You will receive: ₹[Amount]
or
❌ You need to pay: ₹[Amount]

Payments from/to:
1. [Player]: ₹[Amount]
2. [Player]: ₹[Amount]

Your Payment Method: 💵 Cash or 📱 UPI (UPI ID)

Please settle at your earliest convenience. Thank you! 🙏
```

## Testing

### Test WhatsApp Connection

To test if your Evolution API is properly configured:

1. Check browser console for "Evolution API not configured" warnings
2. Add a player with a valid WhatsApp number
3. The system should attempt to send a welcome message
4. Check Evolution API logs for message delivery status

### Test Settlement Calculation

1. Create a game with players having different payment preferences
2. Add buy-ins and final stacks
3. Complete the game
4. Verify that:
   - Cash players settle with each other first
   - UPI players settle with each other
   - Mixed cash-UPI settlements are minimized

## Troubleshooting

### Messages Not Sending

- **Check Evolution API is running**: Visit your API URL in browser
- **Verify API credentials**: Ensure all environment variables are correct
- **Check instance state**: Instance must be in "open" state (connected to WhatsApp)
- **Phone number format**: Ensure numbers include country code (e.g., +91)

### Payment Preference Issues

- **UPI ID validation**: Must be in format `identifier@provider`
- **Auto-detection**: Payment preference auto-updates when UPI ID is added/removed
- **Cash players**: Leave UPI ID empty for cash-only players

### Settlement Calculation

- **Net amount must be zero**: Total of all player net amounts must equal zero
- **Manual transfers**: Can override calculated settlements for special cases
- **Rounding**: All amounts are rounded to nearest rupee

## API Reference

### Evolution API Endpoints Used

- `POST /message/sendText/{instanceName}` - Send text message
- `GET /instance/connectionState/{instanceName}` - Check connection status

### Data Models

```typescript
// Player with WhatsApp fields
interface Player {
  id: string;
  name: string;
  phone_number?: string;
  upi_id?: string;
  payment_preference?: 'upi' | 'cash';
  total_games: number;
  total_profit: number;
}

// Settlement
interface Settlement {
  from: string;
  to: string;
  amount: number;
}
```

## Security Notes

- API keys are stored in environment variables (not in code)
- Phone numbers are optional and not shared publicly
- UPI IDs are only shown to game participants
- All WhatsApp messages are sent through secure Evolution API

## Support

For Evolution API setup issues, refer to:
- [Evolution API Documentation](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)

For application-specific issues:
- Check browser console for errors
- Verify database schema updates were applied
- Ensure environment variables are set correctly
