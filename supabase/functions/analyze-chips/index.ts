
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

    const { image, apiKey: userApiKey, ping } = body;

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
    // Using gemini-2.5-pro as explicitly requested by user.
    // Prompt includes Geometric Ratio verification for accuracy.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const prompt = `
      You are an expert Poker Chip Specialist working at a high-stakes casino.
      Your job is to ACCURATELY count the value of the poker chips in this image.

      **CRITICAL INSTRUCTION: STRICT SEPARATION OF TASKS**

      **Phase 1: Visual Detection (Find Stacks)**
      - Identify every distinct vertical stack of chips.
      - Identify the Color of each stack.
      - **DO NOT COUNT THE CHIPS VISUALLY.** Your visual counting is prone to perspective errors.

      **Phase 2: Geometric Calculation (Count Chips)**
      - For each identified stack, measure specific dimensions in pixels:
        - W: Width of the stack (chip diameter).
        - H: Height of the stack (total vertical extent).
      - **Apply this Formula**: Count = (H / W) * 12.
      - **Rounding Rule**: Round the result to the nearest integer.
      
      **Example:**
      - Stack looks like ~10 chips visually? IGNORE THIS.
      - Measure: H=100px, W=100px.
      - Calc: (100/100) * 12 = 12.
      - **Final Verification**: If Calc is X.7 or higher, ALWAYS round up. (e.g. 7.7 -> 8).

      **Instructions:**
      1.  Identify distinct vertical stacks.
      2.  Ignore loose chips lying flat.
      3.  Provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale).

      Output strictly as valid JSON in the following format:
      {
        "thinking_process": "Stack 1 (Red): Found Stack. Color=Red. Measuring Pixels... Height=98, Width=102. Ratio=0.96. Count = 0.96 * 12 = 11.52. Rounding to 12. // Stack 2 (Blue): Found Stack. Color=Blue. Measuring... Height=45, Width=100. Ratio=0.45. Count = 0.45 * 12 = 5.4. Rounding to 5.",
        "stacks": [
          { 
            "color": "red", 
            "count": 12, 
            "confidence": 0.95,
            "box_2d": [100, 200, 500, 300] 
          }
        ],
        "analysis_notes": "Brief summary for the user."
      }

      Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
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
