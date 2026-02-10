
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
      You are a World-Class Casino Pit Boss and Optical Expert.
      
      **Goal:** accurately count the poker chips in each vertical stack in this image.

      **CONTEXT:**
      You are strictly limited to identifying chips from this provided list: 
      ${chipsContext}
      If a chip color is ambiguous, snap it to the closest valid color from this list.

      **METHODOLOGY (The "Ridge Count" Technique):**
      1.  **Do NOT attempt pixel measurements.** They are unreliable due to perspective.
      2.  **Instead, count the Horizontal Ridges (side edges):** Look at the vertical profile of each stack. Each chip creates a distinct horizontal line or "ridge" on the side of the stack.
      3.  **Count these ridges.** 1 Ridge = 1 Chip.
      4.  **Grouping:** Group contiguous vertical stacks of the same color.
      5.  **Exclusions:** Ignore loose chips lying flat on the table. Only count stacked chips.

      **OUTPUT FORMAT:**
      Return strictly valid JSON. matching this TypeScript interface:
      {
        "thinking_process": "Found 2 stacks. Stack 1 (Red): Counted 12 distinct ridges on the side profile. Stack 2 (Blue): Counted 5 ridges...",
        "stacks": [
          { 
            "color": "red", 
            "count": 12, 
            "confidence": 0.95,
            "box_2d": [ymin, xmin, ymax, xmax] // 0-1000 normalized
          }
        ],
        "analysis_notes": "Detected 2 stacks. Lighting is good. Counts are high confidence based on visible ridges."
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
