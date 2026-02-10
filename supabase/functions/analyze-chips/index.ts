
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body', details: e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { image, apiKey: userApiKey, ping, defined_chips } = body;

    // 1. Health Check / Ping Mode
    if (ping) {
      console.log("Ping received. Returning Pong.");
      return new Response(JSON.stringify({ message: 'pong', model: 'gemini-3.0-pro-preview' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Processing image. Length: ${image.length} chars`);

    // Initialize Gemini (User Key takes precedence, fallback to Server Env)
    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error("Missing Gemini API Key")
      return new Response(JSON.stringify({ error: 'Missing Gemini API Key. Check Profile settings.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Using gemini-2.5-pro as explicitly requested.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const chipsContext = defined_chips
      ? JSON.stringify(defined_chips.map((c: any) => ({ color: c.color, label: c.label })))
      : "Standard Casino Colors (Red, Blue, Green, Black, White)";

    const prompt = `
      You are a Veteran Casino Pit Boss. Your eyes are trained to count chips instantly by recognizing patterns.

      **Goal:** Count the poker chips in the image.

      **CONSTRAINT:**
      You can ONLY identify chips from this specific list provided by the user: 
      ${chipsContext}
      Do not guess colors outside this list. If a chip looks like a variant (e.g. "dark red" vs "red"), snap it to the closest valid color from the list.

      **METHODOLOGY (The "Ridge Count" Technique):**
      1.  **Identify Stacks:** Locate vertical columns of chips.
      2.  **Count Ridges:** Look at the *side profile* of the stack. Count the distinct horizontal lines (ridges) that separate each chip.
          -   *Visual Tip:* 5 chips look like a small block. 20 chips usually form a standard "barrel".
      3.  **Context Check (The Barrel Heuristic):** If a stack is roughly the same height as a known stack of 20, assign it a count of 20. Do not output "19" or "21" unless the height difference is obvious.
      4.  **Ignore:** Loose chips lying flat on the felt (unless explicitly asked).

      **OUTPUT:** 
      Return strictly valid JSON containing a "stacks" array.
      FORMAT:
      {
        "thinking_process": "Observations about stacks, ridges seen, and barrel estimations...",
        "stacks": [
          { 
            "color": "exact_match_from_list", 
            "count": number,
            "confidence": 0.95,
            "box_2d": [ymin, xmin, ymax, xmax] 
          }
        ],
        "analysis_notes": "Short summary of what was found."
      }

      Do not include markdown formatting. Just the raw JSON string.
    `;

    // Clean base64 if needed (remove data:image/... prefix)
    const cleanBase64 = image.includes(',') ? image.split(',').pop() : image;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg'
          }
        }
      ])

      const response = await result.response
      const text = response.text()

      // Sanitize JSON (sometimes models add markdown)
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()

      let data;
      try {
        data = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("JSON Parse Error on Gemini output:", jsonStr);
        throw new Error("Failed to parse Gemini JSON response: " + parseError.message);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } catch (apiError) {
      console.error("Gemini API Error:", apiError);
      return new Response(JSON.stringify({
        error: 'Gemini API Error',
        details: apiError.message,
        hint: 'The model gemini-3.0-pro-preview might not be available for your key, or the image format is rejected.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

  } catch (error) {
    console.error("General Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
