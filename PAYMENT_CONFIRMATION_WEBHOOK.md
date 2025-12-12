# Payment Confirmation Webhook Integration

## Overview

The payment confirmation feature allows players to automatically confirm their payments by replying with a simple message like "PAID" to WhatsApp. This document explains how to set up the webhook integration with Evolution API.

## How It Works

1. **Settlement Messages**: When settlements are sent, payers receive instructions to reply with "PAID" after making the payment
2. **Incoming Message**: Evolution API receives the reply and forwards it to your webhook
3. **Auto-Confirmation**: The webhook processes the message and automatically confirms the settlement in the database
4. **Settlement Update**: The settlement table is updated to show the payment as confirmed

## Setup Instructions

### 1. Create a Webhook Endpoint

You need to create a webhook endpoint that Evolution API can call when messages are received. This can be done using:

- **Supabase Edge Functions** (recommended for this project)
- **Vercel Serverless Functions**
- **Your own backend server**

### 2. Example Edge Function (Supabase)

Create a file at `supabase/functions/whatsapp-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { processIncomingMessage } from '../../../src/services/paymentConfirmationHandler.ts'

serve(async (req) => {
  try {
    // Verify the request is from Evolution API (optional but recommended)
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== Deno.env.get('EVOLUTION_WEBHOOK_SECRET')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    
    // Extract message data from Evolution API webhook payload
    const { data } = payload
    const messageData = data?.message || data
    
    // Only process text messages
    if (messageData?.messageType !== 'conversation' && messageData?.messageType !== 'extendedTextMessage') {
      return new Response('OK', { status: 200 })
    }

    const phoneNumber = messageData.key?.remoteJid || messageData.from
    const messageText = messageData.message?.conversation || 
                       messageData.message?.extendedTextMessage?.text || ''

    // Process the message for payment confirmation
    const result = await processIncomingMessage(phoneNumber, messageText)

    if (result.confirmed) {
      console.log(`✅ Auto-confirmed ${result.settlementsUpdated} settlements`)
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 3. Deploy the Webhook

Deploy your edge function:

```bash
supabase functions deploy whatsapp-webhook
```

### 4. Configure Evolution API Webhook

Configure your Evolution API instance to send webhooks to your endpoint:

```bash
curl -X POST https://your-evolution-api.com/webhook/set/{instance_name} \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.supabase.co/functions/v1/whatsapp-webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }'
```

### 5. Set Environment Variables

Add the webhook secret to your environment:

```bash
# In your Supabase project settings or .env file
EVOLUTION_WEBHOOK_SECRET=your-secret-key-here
```

## Testing

### Manual Test

1. Send a settlement notification to a test player
2. Reply with "PAID" from that player's WhatsApp
3. Check the settlement confirmations table to verify it was auto-confirmed

### Verification Query

```sql
SELECT * FROM settlement_confirmations 
WHERE confirmed = true 
ORDER BY confirmed_at DESC 
LIMIT 10;
```

## Supported Keywords

The following keywords (case-insensitive) will trigger payment confirmation:

- `PAID`
- `DONE`
- `SETTLED`
- `COMPLETE`
- `CONFIRMED`

## Troubleshooting

### Messages Not Being Confirmed

1. Check Evolution API webhook logs
2. Verify the webhook URL is correct
3. Check the edge function logs in Supabase
4. Ensure the player's phone number matches exactly in the database

### Phone Number Formatting

Phone numbers should be stored in E.164 format (e.g., `+919876543210`). The system will try to match:

- With or without country code
- With or without + prefix
- The Evolution API formats the number in the webhook payload

## Security Considerations

1. **Webhook Secret**: Always verify the webhook request using a secret key
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **Message Validation**: Only process messages from known phone numbers
4. **Logging**: Log all confirmation attempts for audit purposes

## Future Enhancements

- Add confirmation notifications back to the payer
- Support for partial payments (e.g., "PAID 500")
- Multi-language keyword support
- Receipt verification via image recognition
