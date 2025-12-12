# Email Reply Webhook Setup Guide

## Overview

This guide explains how to set up automatic payment confirmation via email replies. When players reply to settlement emails with keywords like "PAID", "DONE", or "SETTLED", the system automatically confirms their payment in the settlement table.

## How It Works

1. **Settlement Email Sent**: Players receive settlement notifications via email
2. **Player Replies**: Player replies to the email with a confirmation keyword (e.g., "PAID")
3. **Email Service Webhook**: Your email service forwards the reply to the webhook
4. **Auto-Confirmation**: The webhook processes the reply and updates the settlement status

## Supported Keywords

The following keywords (case-insensitive) trigger automatic confirmation:
- `PAID`
- `DONE`
- `SETTLED`
- `COMPLETE`
- `CONFIRMED`

## Setup Instructions

### Step 1: Deploy the Supabase Edge Function

Deploy the email webhook function:

```bash
cd /path/to/poker_settle
supabase functions deploy email-webhook
```

The function will be available at:
```
https://your-project.supabase.co/functions/v1/email-webhook
```

### Step 2: Set Environment Variables

In your Supabase project settings, add the following environment variable for the edge function:

```bash
EMAIL_WEBHOOK_SECRET=your-secret-key-here
```

Generate a secure random key:
```bash
openssl rand -base64 32
```

### Step 3: Configure Your Email Service

Choose one of the following email service providers:

#### Option A: SendGrid Inbound Parse

1. Go to SendGrid Dashboard → Settings → Inbound Parse
2. Add a new Inbound Parse webhook:
   - **Hostname**: Your subdomain (e.g., `poker.yourdomain.com`)
   - **URL**: `https://your-project.supabase.co/functions/v1/email-webhook`
   - **Add Header**: `Authorization: Bearer your-secret-key-here`
3. Set up DNS records:
   - **MX Record**: `mx.sendgrid.net` (priority 10)
4. Configure your email service to send FROM an address on this domain

#### Option B: Mailgun Inbound Routes

1. Go to Mailgun Dashboard → Receiving → Routes
2. Create a new route:
   - **Priority**: 0
   - **Filter Expression**: `match_recipient(".*@poker.yourdomain.com")`
   - **Actions**: 
     - Forward to URL: `https://your-project.supabase.co/functions/v1/email-webhook`
     - Custom Headers: `Authorization: Bearer your-secret-key-here`
3. Verify your domain in Mailgun
4. Configure your email service to send FROM an address on this domain

#### Option C: Custom Email Service

If you're using a different email service, configure it to:

1. Forward incoming emails to your webhook URL
2. Include the `Authorization` header with your secret
3. Send the email payload in one of these formats:

**SendGrid format:**
```json
{
  "from": "Player Name <player@email.com>",
  "text": "PAID"
}
```

**Mailgun format:**
```json
{
  "sender": "player@email.com",
  "body-plain": "PAID"
}
```

**Generic format:**
```json
{
  "from_email": "player@email.com",
  "message": "PAID"
}
```

### Step 4: Update Settlement Email Instructions

Ensure your settlement notification emails include clear instructions:

```
⚠️ IMPORTANT: After making the payment, please reply to this email with:
PAID

This will automatically confirm your payment and update the settlement records.
```

The `messageTemplates.ts` file already includes these instructions.

## Testing

### Manual Test

1. Send a settlement notification to a test player
2. Reply to that email with "PAID"
3. Check the settlement confirmations table:

```sql
SELECT * FROM settlement_confirmations 
WHERE confirmed = true 
ORDER BY confirmed_at DESC 
LIMIT 10;
```

### Webhook Test

Test the webhook directly:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/email-webhook \
  -H "Authorization: Bearer your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email": "test@example.com",
    "message": "PAID"
  }'
```

## Troubleshooting

### Emails Not Being Confirmed

1. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → email-webhook → Logs
   - Look for errors or "Player not found" messages

2. **Verify Email Address**:
   - Ensure the player's email in the database matches the sender email exactly
   - Email addresses are case-sensitive in some systems

3. **Check Webhook Configuration**:
   - Verify the webhook URL is correct
   - Ensure the Authorization header is being sent
   - Check that your email service is forwarding inbound emails

4. **Test Email Format**:
   - Send a test email and check the payload format in the logs
   - Adjust the webhook code if your email service uses a different format

### Common Issues

**"Player not found with this email address"**
- The sender's email doesn't match any player in the database
- Solution: Update the player's email or use the correct email address

**"No pending settlements found for this player"**
- The player has no unconfirmed settlements
- All settlements are already confirmed
- Solution: Verify the settlement_from field matches the player's name

**"Invalid payload format"**
- The webhook received data in an unexpected format
- Solution: Check the email service documentation and update the webhook parser

## Email Service Alternatives

### Without Inbound Email

If setting up inbound email webhooks is too complex, alternatives include:

1. **Manual Confirmation**: Players can confirm via the web UI
2. **WhatsApp Integration**: Use WhatsApp webhook (already implemented)
3. **SMS Gateway**: Integrate with an SMS service for confirmation codes

## Security Considerations

1. **Webhook Secret**: Always use a strong, random secret for authentication
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **Email Validation**: The webhook validates sender email against player records
4. **HTTPS Only**: Never expose the webhook over HTTP

## Support

For issues or questions:
1. Check the Edge Function logs in Supabase
2. Review your email service's webhook delivery logs
3. Test with the manual curl command above
4. Contact your email service support if webhooks aren't being delivered
