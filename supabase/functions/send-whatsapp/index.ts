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

        // Use the confirmed working endpoint
        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        console.log(`[Edge] Requesting: ${targetUrl} | Number: ${cleanNumber}`);

        // 2. payload FIX: 'text' must be at the ROOT level
        const payload = {
            number: cleanNumber,
            text: text,  // <--- This is the required field
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: true
            }
        };

        // 3. Fetch
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            body: JSON.stringify(payload),
        });

        // 4. Log Response
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