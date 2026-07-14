import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_MS = 40_000;
const POLL_MS = 5_000;
const WAIT_MS = 90_000;   // max time to wait for WhatsApp to reconnect after server restart

interface BatchMessage {
    number: string;
    text: string;
}

interface BatchResult {
    number: string;
    success: boolean;
    messageId?: string;
    error?: string;
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
    message: BatchMessage
): Promise<BatchResult> {
    let cleanNumber = message.number.replace(/[^\d]/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    const stateUrl = `${base}/instance/connectionState/${instanceName}`;
    const sendUrl = `${base}/message/sendText/${instanceName}`;

    // Poll until instance state is "open" — handles the window after Evolution API
    // server restart where Baileys is re-establishing the WhatsApp WebSocket.
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
            number: cleanNumber,
            success: false,
            error: 'WhatsApp is not connected. Please restart your Evolution API server, then check the instance status at your Evolution API dashboard.',
        };
    }

    try {
        const r = await timedFetch(sendUrl, {
            method: 'POST',
            headers: { ...headers, 'Connection': 'close' },
            body: JSON.stringify({ number: cleanNumber, text: message.text, delay: 100, linkPreview: false }),
        });

        const body = await r.text();

        if (r.ok) {
            let messageId: string | undefined;
            try {
                messageId = JSON.parse(body)?.key?.id;
            } catch { /* non-JSON success body, ignore */ }
            return { number: cleanNumber, success: true, messageId };
        }

        const connClosed = body.includes('Connection Closed');
        console.error(`[Batch] send failed for ${cleanNumber}: ${r.status} — ${body.slice(0, 300)}`);
        return {
            number: cleanNumber,
            success: false,
            error: connClosed
                ? 'WhatsApp connection is broken. Please restart your Evolution API server to force reconnection.'
                : `Send failed (${r.status}). Check your Evolution API instance.`,
        };
    } catch (err) {
        console.error(`[Batch] error for ${cleanNumber}:`, err instanceof Error ? err.message : String(err));
        return { number: cleanNumber, success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { messages } = await req.json() as { messages: BatchMessage[] };

        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('messages must be a non-empty array');
        }

        const apiUrl = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
        if (!apiUrl || !apiKey || !instanceName) throw new Error('Missing Config');

        const base = apiUrl.replace(/\/$/, '');
        const headers = { 'apikey': apiKey, 'Content-Type': 'application/json' };
        const results: BatchResult[] = [];

        // Sequential with a small delay between sends, to avoid tripping the
        // upstream WhatsApp bridge's anti-spam / rate limiting. Runs entirely
        // server-side in one invocation so delivery survives the calling
        // browser tab being closed or backgrounded partway through.
        for (const message of messages) {
            console.log(`[Batch] sending to ${message.number}`);
            const result = await sendOne(base, headers, instanceName, message);
            results.push(result);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[Batch] Error:', error instanceof Error ? error.message : String(error));
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});
