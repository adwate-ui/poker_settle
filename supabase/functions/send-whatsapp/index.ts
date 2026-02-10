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

        // 1. Diagnostic Step: Check Connectivity to API Root
        try {
            const diagController = new AbortController();
            const diagTimeout = setTimeout(() => diagController.abort(), 5000);

            console.log(`[Edge] Checking connectivity to: ${cleanUrl}`);
            const diagResponse = await fetch(cleanUrl, {
                method: 'GET',
                signal: diagController.signal
            });
            clearTimeout(diagTimeout);

            if (!diagResponse.ok) throw new Error(`Status ${diagResponse.status}`);
            console.log('[Edge] Connectivity Check: Success');

        } catch (e) {
            console.error('[Edge] Connectivity Check Failed:', e);
            return new Response(JSON.stringify({
                error: "Connectivity Check Failed",
                details: "Could not reach API Root. Check Docker Binding (0.0.0.0) or IP Whitelist."
            }), { status: 502, headers: corsHeaders });
        }

        // Endpoint: /message/sendText (Confirmed by your Postman test)
        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        console.log(`[Edge] Requesting: ${targetUrl} | Number: ${cleanNumber}`);

        // Payload: Strict Root-Level Text (Matches your 'instance requires property text' fix)
        const payload = {
            number: cleanNumber,
            text: text,
            delay: 1200,
            linkPreview: false // Disabled for speed to prevent timeouts
        };

        // Fetch with 15s Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
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

            const responseText = await response.text();
            console.log(`[Edge] Response: ${response.status} ${responseText}`);

            return new Response(responseText, {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.error('[Edge] Timeout: Firewall Block Detected');
                return new Response(JSON.stringify({
                    error: "Firewall Block Detected",
                    detail: "Supabase could not reach 140.245.240.186:8080 within 15s. Ensure Port 8080 is open to 0.0.0.0/0."
                }), { status: 504, headers: corsHeaders });
            }
            throw err;
        }

    } catch (error) {
        console.error('[Edge] Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});