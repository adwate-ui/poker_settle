/**
 * Email Webhook Handler
 * Processes incoming email replies to automatically confirm settlement payments
 * 
 * This function should be configured as a webhook endpoint in your email service
 * (e.g., SendGrid, Mailgun, or any service that supports inbound email webhooks)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Keywords that trigger payment confirmation (case-insensitive)
 */
const CONFIRMATION_KEYWORDS = ['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];

/**
 * Check if email message contains a confirmation keyword
 */
function isConfirmationMessage(text: string): boolean {
  const upperText = text.trim().toUpperCase();
  return CONFIRMATION_KEYWORDS.some(keyword => {
    const pattern = new RegExp(`\\b${keyword}\\b`);
    return pattern.test(upperText);
  });
}

/**
 * Process incoming email and auto-confirm payments if applicable
 */
async function processIncomingEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  senderEmail: string,
  messageText: string
): Promise<{ confirmed: boolean; settlementsUpdated: number; error?: string }> {
  try {
    // Check if message contains confirmation keyword
    if (!isConfirmationMessage(messageText)) {
      return {
        confirmed: false,
        settlementsUpdated: 0,
      };
    }

    // Get player by email
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .eq('email', senderEmail)
      .single();

    if (playerError || !player) {
      console.error('Player not found with email:', senderEmail);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Player not found with this email address',
      };
    }

    // Find all unconfirmed settlements where this player is the payer (settlement_from)
    const { data: confirmations, error: confirmationsError } = await supabase
      .from('settlement_confirmations')
      .select('id, settlement_from, settlement_to, amount, confirmed')
      .eq('settlement_from', player.name)
      .eq('confirmed', false);

    if (confirmationsError) {
      console.error('Error fetching settlement confirmations:', confirmationsError);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Failed to fetch settlement confirmations',
      };
    }

    if (!confirmations || confirmations.length === 0) {
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'No pending settlements found for this player',
      };
    }

    // Confirm all pending settlements for this player
    const confirmationIds = confirmations.map(c => c.id);
    const { error: updateError } = await supabase
      .from('settlement_confirmations')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .in('id', confirmationIds);

    if (updateError) {
      console.error('Error updating settlement confirmations:', updateError);
      return {
        confirmed: false,
        settlementsUpdated: 0,
        error: 'Failed to update settlement confirmations',
      };
    }

    console.log(`✅ Auto-confirmed ${confirmations.length} settlements for ${player.name}`);

    return {
      confirmed: true,
      settlementsUpdated: confirmations.length,
    };
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return {
      confirmed: false,
      settlementsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main webhook handler
 */
serve(async (req) => {
  try {
    // Verify the request is from authorized source
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    
    // Extract email data - format may vary depending on email service provider
    // This example handles common formats from SendGrid, Mailgun, and generic webhooks
    let senderEmail: string = '';
    let messageText: string = '';
    
    // SendGrid Inbound Parse format
    if (payload.from) {
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = payload.from.match(/<([^>]+)>/);
      senderEmail = emailMatch ? emailMatch[1] : payload.from;
      messageText = payload.text || payload.html || '';
    }
    // Mailgun format
    else if (payload.sender) {
      senderEmail = payload.sender;
      messageText = payload['body-plain'] || payload['body-html'] || '';
    }
    // Generic format
    else if (payload.email || payload.from_email) {
      senderEmail = payload.email || payload.from_email;
      messageText = payload.message || payload.body || payload.text || '';
    }
    else {
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!senderEmail || !messageText) {
      return new Response(JSON.stringify({ error: 'Missing sender email or message text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process the email for payment confirmation
    const result = await processIncomingEmail(supabase, senderEmail, messageText);

    if (result.confirmed) {
      console.log(`✅ Auto-confirmed ${result.settlementsUpdated} settlements from email`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
