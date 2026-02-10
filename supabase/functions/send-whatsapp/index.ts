import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { number, text } = await req.json();

        const url = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

        if (!url || !apiKey || !instanceName) {
            throw new Error('Missing server configuration');
        }

        // 1. Prepare URL and Number
        const cleanUrl = url.replace(/\/$/, '');
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        console.log(`[Edge] Requesting: ${targetUrl} | Number: ${cleanNumber}`);

        // 2. Prepare STRICT Payload (No root 'text' field)
        const payload = {
            number: cleanNumber,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: true
            },
            textMessage: {
                text: text
            }
        };

        // 3. Fetch with Timeout (Prevent hanging)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 4. Log Response for Debugging
        const responseText = await response.text();
        console.log('[Edge] Evolution Response:', response.status, responseText);

        return new Response(responseText, {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[Edge] Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});