# Email Integration Setup Guide

This guide will help you set up email integration using EmailJS for the Poker Settle application.

## Prerequisites

1. A Gmail account (or any email service)
2. EmailJS account (free tier available)
3. Access to your Supabase SQL Editor

## Setup Steps

### Step 1: Update Database Schema

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Run the migration file: `supabase/migrations/20251212190000_replace_phone_with_email.sql`
4. This will rename the `phone_number` column to `email` in the players table

**What this does:**
- Replaces `phone_number` field with `email` field
- Maintains `upi_id` field for UPI payment IDs
- Allows manual setting of `payment_preference` field (independent of UPI ID)
- Updates indexes and comments for the new email field

### Step 2: Configure EmailJS

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account
2. **Add Email Service:**
   - Go to "Email Services" in the dashboard
   - Click "Add New Service"
   - Choose Gmail (or your preferred email provider)
   - Connect your Gmail account
   - Note down the **Service ID**

3. **Create Email Template:**
   - Go to "Email Templates"
   - Click "Create New Template"
   - Use the following template structure:

   **Template Name:** poker_settle_notification
   
   **Subject:** `{{subject}}`
   
   **Content (HTML):**
   ```html
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
     <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
       <h2 style="color: #1f2937; margin-top: 0;">{{subject}}</h2>
       
       <p style="color: #4b5563; line-height: 1.6;">Hi {{to_name}}!</p>
       
       <div style="color: #374151; line-height: 1.8; white-space: pre-wrap;">
         {{{html_message}}}
       </div>
       
       <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
         <p style="color: #6b7280; font-size: 14px; margin: 0;">
           Best regards,<br>
           {{from_name}}
         </p>
       </div>
     </div>
     
     <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
       <p>This is an automated email from Poker Settle</p>
     </div>
   </div>
   ```

   - Note down the **Template ID**

4. **Get Public Key:**
   - Go to "Account" → "General"
   - Copy your **Public Key**

### Step 3: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# EmailJS Configuration (for Email Notifications)
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_FROM_EMAIL=your_email@gmail.com
VITE_FROM_NAME=Poker Settle
```

**Important:** Replace the placeholder values with your actual EmailJS credentials.

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

### 1. Player Email Notifications

When a player is added to the system with an email, they automatically receive:
- Welcome email with their player profile link
- Access to view their stats and game history

### 2. Game Completion Notifications

When a game is completed, all players with email addresses receive:
- Game summary with their results
- Buy-in amount, final stack, and net profit/loss
- Link to view complete game details

### 3. Settlement Notifications

Players receive settlement details including:
- Who they need to pay or who will pay them
- Payment amounts
- UPI payment links (if recipient has UPI ID)
- Their payment method preference

### 4. Manual Payment Preference

Players can now:
- Set their payment preference (UPI or Cash) independently of their UPI ID
- Change their payment preference anytime from the player detail page
- Have UPI ID but prefer cash, or vice versa

## Player Setup

### Adding a New Player

When adding a player, you can now specify:

1. **Name** (Required)
   - Player's display name

2. **Email Address** (Optional)
   - For receiving game reports and payment notifications
   - Format: player@example.com

3. **UPI ID** (Optional)
   - For receiving UPI payments
   - Format: username@paytm or 9876543210@ybl
   - Providing UPI ID does NOT automatically set payment preference

4. **Payment Preference** (Required, default: UPI)
   - Choose between "UPI" or "Cash"
   - Can be changed anytime
   - Independent of whether UPI ID is provided

### Editing Player Details

You can edit any player's details anytime:
1. Go to the player's detail page
2. Click "Edit Details" button
3. Update email, UPI ID, or payment preference
4. Changes are saved immediately

## Email Notification Flow

### Welcome Email
Sent when a new player is added with an email address.

**Subject:** Welcome to Poker Settle! 🎮

**Content:**
- Personalized greeting
- Link to player's profile
- Brief explanation of what they can track

### Game Completion Email
Sent to all players when a game is completed.

**Subject:** Poker Game Completed - [Date] [🎉 or 📉]

**Content:**
- Game date and time
- Player's buy-in amount
- Final stack amount
- Net profit/loss
- Link to full game details

### Settlement Email
Sent to all players with pending settlements.

**Subject:** Settlement Details - Poker Game [💰 or 💳]

**Content:**
- Total amount to receive/pay
- List of individual transactions
- UPI payment links (clickable, opens UPI app)
- Recipient's UPI ID for reference
- Payment method reminder

## Troubleshooting

### Emails Not Sending

1. **Check EmailJS Configuration:**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_EMAILJS_SERVICE_ID);
   console.log(import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
   console.log(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
   ```
   - Ensure all three values are present

2. **Check EmailJS Dashboard:**
   - Verify email service is connected
   - Check template is active
   - Review quota usage (free tier has limits)

3. **Check Browser Console:**
   - Look for any JavaScript errors
   - EmailJS will log detailed error messages

### Email Template Not Working

1. Ensure template uses triple braces for HTML: `{{{html_message}}}`
2. Test the template in EmailJS dashboard
3. Verify all template variables match:
   - `{{to_email}}`
   - `{{to_name}}`
   - `{{from_email}}`
   - `{{from_name}}`
   - `{{subject}}`
   - `{{message}}`
   - `{{{html_message}}}`

### Payment Preference Issues

1. Payment preference is now independent of UPI ID
2. Default is "UPI" when creating new players
3. Can be changed anytime from player detail page
4. Check database directly if issues persist:
   ```sql
   SELECT name, payment_preference, upi_id FROM players;
   ```

## EmailJS Free Tier Limits

- **200 emails/month** on free tier
- For higher volumes, upgrade to paid plan
- Monitor usage in EmailJS dashboard

## Security Notes

- Email addresses are stored securely in Supabase
- EmailJS credentials should be in environment variables (not committed to git)
- Email content is sent through EmailJS servers (encrypted)
- UPI IDs are only shared with relevant players in settlement emails

## Migration from WhatsApp

If you were previously using WhatsApp integration:

1. Run the database migration to rename `phone_number` to `email`
2. Update environment variables (remove Evolution API, add EmailJS)
3. Inform players to provide email addresses instead of phone numbers
4. Existing players without emails will still work (they just won't receive notifications)

## Alternative Email Services

While this guide uses EmailJS, you can also use:
- **Resend** - Modern email API
- **SendGrid** - Enterprise email service
- **AWS SES** - Amazon's email service
- **Custom SMTP** - Via backend service

To switch, you'll need to modify `src/services/emailService.ts` to integrate with the new provider.

## Support

For issues:
- **EmailJS**: https://www.emailjs.com/docs/
- **App Issues**: Create issue in this repository
- **Setup Help**: See this guide

---

**Last Updated**: December 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
