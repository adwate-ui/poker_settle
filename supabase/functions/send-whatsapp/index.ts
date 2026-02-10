import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { number, text } = await req.json();

        // 1. Validate Config
        const url = Deno.env.get('EVOLUTION_API_URL');
        const apiKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

        if (!url || !apiKey || !instanceName) {
            throw new Error('Missing server configuration');
        }

        // 2. Prepare Data
        const cleanUrl = url.replace(/\/$/, '');
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        console.log(`[Edge] Requesting: ${targetUrl} | Number: ${cleanNumber}`);

        // 3. HYBRID PAYLOAD: Send BOTH formats to ensure one works
        // Some versions want root 'text', others want 'textMessage.text'.
        // Sending both is usually safe and fixes the ambiguity.
        const payload = {
            number: cleanNumber,
            text: text,                  // Format A (Likely required based on your 400 error)
            textMessage: { text: text }, // Format B (Standard v2 backup)
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: true
            }
        };

        // 4. Fetch with Strict Timeout (8 seconds)
        // This prevents the "hanging" silence you are seeing.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let response;
        try {
            response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } catch (networkError) {
            if (networkError.name === 'AbortError') {
                throw new Error('Evolution API timed out (8s limit)');
            }
            throw networkError;
        } finally {
            clearTimeout(timeoutId);
        }

        // 5. Handle Response
        const responseText = await response.text();
        console.log('[Edge] Evolution Response:', response.status, responseText);

        // Evolution sometimes returns 200/201 for success, or 400/500 for error
        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: 'Evolution API Error', details: responseText }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(responseText, {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[Edge] CRITICAL FAIL:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});