import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_MS = 40_000;
const POLL_MS = 5_000;
const WAIT_MS = 90_000;   // max time to wait for WhatsApp to reconnect after server restart

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

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { number, text } = await req.json();

        const apiUrl = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
        if (!apiUrl || !apiKey || !instanceName) throw new Error('Missing Config');

        const base = apiUrl.replace(/\/$/, '');
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

        const headers = { 'apikey': apiKey, 'Content-Type': 'application/json' };
        const stateUrl = `${base}/instance/connectionState/${instanceName}`;
        const sendUrl = `${base}/message/sendText/${instanceName}`;

        // Poll until instance state is "open" — handles the window after Evolution API server restart
        // where Baileys is re-establishing the WhatsApp WebSocket from saved credentials.
        // If state immediately shows "open" but the socket is stale, it will fail on send and we surface that clearly.
        const deadline = Date.now() + WAIT_MS;
        let state = 'unknown';

        console.log(`[Edge] send to ${cleanNumber}`);

        while (Date.now() < deadline) {
            try {
                const r = await timedFetch(stateUrl, { headers });
                if (r.ok) {
                    const j = await r.json();
                    state = j?.instance?.state ?? j?.state ?? 'unknown';
                    console.log(`[Edge] state: ${state}`);
                    if (state === 'open') break;
                } else {
                    console.log(`[Edge] state check HTTP ${r.status}`);
                }
            } catch (e) {
                console.log(`[Edge] state poll error: ${(e as Error).message}`);
            }
            await new Promise(r => setTimeout(r, POLL_MS));
        }

        if (state !== 'open') {
            throw new Error(
                'WhatsApp is not connected. Please restart your Evolution API server, ' +
                'then check the instance status at your Evolution API dashboard.'
            );
        }

        // Attempt to send
        const r = await timedFetch(sendUrl, {
            method: 'POST',
            headers: { ...headers, 'Connection': 'close' },
            body: JSON.stringify({ number: cleanNumber, text, delay: 100, linkPreview: false }),
        });

        const body = await r.text();

        if (r.ok) {
            console.log(`[Edge] sent ok to ${cleanNumber}`);
            return new Response(body, {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const connClosed = body.includes('Connection Closed');
        console.error(`[Edge] send failed: ${r.status} — ${body.slice(0, 300)}`);

        // connectionState reported "open" but send returned Connection Closed.
        // This means the Baileys socket is dead while the state cache shows stale "open".
        // This cannot be fixed by retrying — the Evolution API server process needs to be restarted
        // so Baileys rebuilds the WebSocket from saved credentials.
        throw new Error(
            connClosed
                ? 'WhatsApp connection is broken. Please restart your Evolution API server to force reconnection.'
                : `Send failed (${r.status}). Check your Evolution API instance.`
        );

    } catch (error) {
        console.error('[Edge] Error:', (error as Error).message);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: corsHeaders },
        );
    }
});
