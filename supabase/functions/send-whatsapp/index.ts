import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { number, text } = await req.json();

        // Config
        const url = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

        if (!url || !apiKey || !instanceName) throw new Error('Missing Config');

        // Clean Data
        const cleanUrl = url.replace(/\/$/, '');
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

        console.log(`[Edge] Processing: ${cleanNumber}`);

        // Target
        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        // Payload
        const payload = {
            number: cleanNumber,
            text: text,
            delay: 100,
            linkPreview: false
        };

        // Fetch with Strict 15s Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'Connection': 'close' // Prevent open socket hang
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            // Return raw text if success, or basic error if not
            const responseText = await response.text();

            if (!response.ok) {
                console.error(`[Edge] Upstream Error: ${response.status} ${responseText}`);
                throw new Error(`Upstream Error: ${response.status} ${responseText}`);
            }

            return new Response(responseText, {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.error('[Edge] Timeout: 15s Limit Hit');
                return new Response(JSON.stringify({ error: 'Evolution API unresponsive after 15s' }), { status: 504, headers: corsHeaders });
            }
            throw err;
        }

    } catch (error) {
        console.error('[Edge] Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});