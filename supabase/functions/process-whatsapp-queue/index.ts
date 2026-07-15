import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-queue-secret',
};

const FETCH_MS = 40_000;
const POLL_MS = 5_000;
const WAIT_MS = 90_000;

interface QueueRow {
    id: string;
    phone_number: string;
    message_text: string;
}

async function timedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_MS);
    try {
        const r = await fetch(url, { ...opts, signal: ctrl.signal });
        clearTimeout(t);
        return r;
    } catch (e) {
        clearTimeout(t);
        throw e;
    }
}

async function sendOne(
    base: string,
    headers: Record<string, string>,
    instanceName: string,
    row: QueueRow
): Promise<{ success: boolean; error?: string }> {
    let cleanNumber = row.phone_number.replace(/[^\d]/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    const stateUrl = `${base}/instance/connectionState/${instanceName}`;
    const sendUrl = `${base}/message/sendText/${instanceName}`;

    const deadline = Date.now() + WAIT_MS;
    let state = 'unknown';

    while (Date.now() < deadline) {
        try {
            const r = await timedFetch(stateUrl, { headers });
            if (r.ok) {
                const j = await r.json();
                state = j?.instance?.state ?? j?.state ?? 'unknown';
                if (state === 'open') break;
            }
        } catch { /* keep polling until deadline */ }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }

    if (state !== 'open') {
        return {
            success: false,
            error: 'WhatsApp is not connected. Please restart your Evolution API server, then check the instance status at your Evolution API dashboard.',
        };
    }

    try {
        const r = await timedFetch(sendUrl, {
            method: 'POST',
            headers: { ...headers, 'Connection': 'close' },
            body: JSON.stringify({ number: cleanNumber, text: row.message_text, delay: 100, linkPreview: false }),
        });

        const body = await r.text();

        if (r.ok) {
            return { success: true };
        }

        const connClosed = body.includes('Connection Closed');
        console.error(`[Queue] send failed for ${cleanNumber}: ${r.status} — ${body.slice(0, 300)}`);
        return {
            success: false,
            error: connClosed
                ? 'WhatsApp connection is broken. Please restart your Evolution API server to force reconnection.'
                : `Send failed (${r.status}). Check your Evolution API instance.`,
        };
    } catch (err) {
        console.error(`[Queue] error for ${cleanNumber}:`, err instanceof Error ? err.message : String(err));
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const queueSecret = Deno.env.get('QUEUE_TRIGGER_SECRET');
        if (!queueSecret || req.headers.get('x-queue-secret') !== queueSecret) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        const apiUrl = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!apiUrl || !apiKey || !instanceName) throw new Error('Missing Evolution API config');
        if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service config');

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const base = apiUrl.replace(/\/$/, '');
        const headers = { 'apikey': apiKey, 'Content-Type': 'application/json' };

        const { data: rows, error: claimError } = await supabase
            .rpc('claim_pending_whatsapp_notifications', { batch_size: 50 });

        if (claimError) throw claimError;

        const claimed = (rows ?? []) as QueueRow[];
        let sent = 0;
        let failed = 0;

        for (const row of claimed) {
            const result = await sendOne(base, headers, instanceName, row);

            await supabase
                .from('whatsapp_notification_queue')
                .update({
                    status: result.success ? 'sent' : 'failed',
                    error: result.error ?? null,
                    sent_at: result.success ? new Date().toISOString() : null,
                })
                .eq('id', row.id);

            if (result.success) sent++; else failed++;

            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return new Response(JSON.stringify({ processed: claimed.length, sent, failed }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[Queue] Error:', error instanceof Error ? error.message : String(error));
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});
