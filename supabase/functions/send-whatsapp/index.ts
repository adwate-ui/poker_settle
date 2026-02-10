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
            return new Response(
                JSON.stringify({ error: 'Server configuration missing' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 1. Clean URL and format number
        const cleanUrl = url.replace(/\/$/, '');
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

        // 2. USE THE WORKING POSTMAN ENDPOINT
        const targetUrl = `${cleanUrl}/message/sendText/${instanceName}`;

        console.log(`Requesting: ${targetUrl} for ${cleanNumber}`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            body: JSON.stringify({
                number: cleanNumber,
                text: text, // Evolution Exchange v2.3.7 usually expects text at root or inside textMessage
                textMessage: {
                    text: text
                },
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: true
                }
            }),
        });

        const responseText = await response.text();
        console.log('Evolution Response Status:', response.status);
        console.log('Evolution Response Body:', responseText);

        return new Response(responseText, {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Function Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});