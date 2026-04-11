# WhatsApp Messages Not Being Sent - Root Cause & Fix

## Root Cause Analysis

The WhatsApp messages are failing because the **Supabase Edge Function** `send-whatsapp` requires environment variables that are **NOT set in your Supabase project**.

### How It Works

1. **Frontend** (`src/services/evolutionApi.ts`) calls the Supabase edge function:
   ```typescript
   await supabase.functions.invoke('send-whatsapp', {
     body: { number: cleanNumber, text: payload.text }
   });
   ```

2. **Edge Function** (`supabase/functions/send-whatsapp/index.ts`) reads environment variables:
   ```typescript
   const url = Deno.env.get('EVOLUTION_API_URL');
   const apiKey = Deno.env.get('EVOLUTION_API_KEY');
   const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

   if (!url || !apiKey || !instanceName) throw new Error('Missing Config');
   ```

3. **If any of these are missing**, the function throws an error and messages fail.

### Why This Happened

- The `.env` file in your local project is **NOT used by Supabase Edge Functions**
- Edge functions run on **Supabase servers** and need secrets to be configured **in the Supabase dashboard**
- These secrets may have been cleared, expired, or never set

---

## Fix Instructions

### Option 1: Set Environment Variables in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/xfahfllkbutljcowwxpx/settings/functions

2. **Navigate to Edge Functions → Configuration**
   - Look for "Function Secrets" or "Environment Variables"

3. **Add these secrets:**
   ```
   EVOLUTION_API_URL=https://your-evolution-api-url.com
   EVOLUTION_API_KEY=your_evolution_api_key
   EVOLUTION_INSTANCE_NAME=your_instance_name
   ```

4. **Redeploy the edge function:**
   ```bash
   npx supabase functions deploy send-whatsapp
   ```

5. **Test:**
   - Go to your app
   - Complete a game and trigger WhatsApp notifications
   - Check if messages are sent

---

### Option 2: Use Supabase CLI to Set Secrets

```bash
# Set secrets using CLI
npx supabase secrets set EVOLUTION_API_URL=https://your-evolution-api-url.com
npx supabase secrets set EVOLUTION_API_KEY=your_evolution_api_key
npx supabase secrets set EVOLUTION_INSTANCE_NAME=your_instance_name

# Verify secrets are set
npx supabase secrets list

# Redeploy function
npx supabase functions deploy send-whatsapp
```

---

## How to Get Your Evolution API Credentials

If you don't have your Evolution API credentials:

1. **Evolution API URL**: The base URL of your Evolution API instance (e.g., `https://api.example.com`)
2. **Evolution API Key**: Your API key from Evolution API dashboard
3. **Evolution Instance Name**: The name of your WhatsApp instance

---

## Verification Steps

### 1. Check if secrets are set:
```bash
npx supabase secrets list
```

Expected output:
```
EVOLUTION_API_URL
EVOLUTION_API_KEY
EVOLUTION_INSTANCE_NAME
```

### 2. Check edge function logs:
```bash
npx supabase functions logs send-whatsapp
```

Look for:
- ✅ **Success**: `[Edge] Processing: 919876543210`
- ❌ **Error**: `Missing Config` → Secrets not set
- ❌ **Error**: `Upstream Error: 401` → Invalid API key
- ❌ **Error**: `Timeout: 15s Limit Hit` → Evolution API unreachable

### 3. Test from app:
1. Go to a completed game
2. Click "Complete Game"
3. Check console for errors
4. Check if WhatsApp messages are received

---

## Alternative: Test Directly via Supabase

You can test the edge function directly in Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/xfahfllkbutljcowwxpx/functions
2. Select `send-whatsapp` function
3. Click "Invoke Function"
4. Use this payload:
   ```json
   {
     "number": "9876543210",
     "text": "Test message from Supabase"
   }
   ```
5. Check the response

---

## Common Errors & Solutions

### Error: "Missing Config"
**Cause**: Environment variables not set in Supabase
**Fix**: Set secrets as shown in Option 1 or 2 above

### Error: "Upstream Error: 401"
**Cause**: Invalid Evolution API key
**Fix**: Verify your API key is correct

### Error: "Timeout: 15s Limit Hit"
**Cause**: Evolution API is unreachable or slow
**Fix**:
- Check if Evolution API instance is running
- Verify the API URL is correct
- Check network/firewall settings

### Error: "Evolution API unresponsive after 15s"
**Cause**: Evolution API is down or overloaded
**Fix**: Check Evolution API status and restart if needed

---

## Quick Test Script

Create a test file `test-whatsapp.sh`:

```bash
#!/bin/bash

# Test if secrets are set
echo "Checking secrets..."
npx supabase secrets list | grep EVOLUTION

# Deploy function
echo "Deploying function..."
npx supabase functions deploy send-whatsapp

# Test function (replace with your phone number)
echo "Testing function..."
curl -X POST \
  'https://xfahfllkbutljcowwxpx.supabase.co/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "9876543210",
    "text": "Test message"
  }'
```

Run: `bash test-whatsapp.sh`

---

## Summary

**Problem**: WhatsApp messages not being sent
**Root Cause**: Missing environment variables in Supabase Edge Function
**Fix**: Set `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME` in Supabase dashboard or CLI
**Test**: Redeploy function and test from app

---

## Next Steps

1. Set the 3 environment variables in Supabase
2. Redeploy the `send-whatsapp` edge function
3. Test by completing a game
4. Check edge function logs for any errors
5. If still failing, share the logs for further debugging
