
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

      **CRITICAL INSTRUCTION: PRIORITIZE GEOMETRIC VERIFICATION**

      **Method 1: Visual Ridge Counting**
      - Count the distinct lines/ridges.

      **Method 2: Geometric Ratio (PRIMARY SOURCE OF TRUTH)**
      - A standard poker chip is ~3.3mm thick and ~39mm wide.
      - Ratio is roughly 1:12.
      - Measure the stack width (W) in pixels.
      - Measure the stack height (H) in pixels.
      - **Estimated Count = (H / W) * 12**.
      
      **CORRECTION LOGIC:**
      - **Perspective Bias**: Visual counting often MISSES the top or bottom chip due to camera angle.
      - **Trust Math**: If the Geometric Estimate (e.g., 7.8) is higher than the Visual Count (e.g., 7), **ROUND THE GEOMETRIC ESTIMATE TO THE NEAREST INTEGER AND USE THAT.**
      - Example: Geometric 7.8 -> Use 8. Geometric 10.8 -> Use 11.
      - Only use Visual Count if Geometric Count is physically impossible (e.g. stack is obviously not that tall).

      **Instructions:**
      1.  Identify distinct vertical stacks.
      2.  Ignore loose chips lying flat.
      3.  Ignore reflections.
      4.  Provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale).

      Output strictly as valid JSON in the following format:
      {
        "thinking_process": "Stack 1 (Red): Visual 10. Geometric: W=100, H=100. Ratio=1. Chips = 1 * 12 = 12.0. Visual (10) is lower than Math (12). Perspective likely hiding chips. Corrected Count: 12. // Stack 2 (Black): Visual 7. Geometric: W=100, H=65. Ratio=0.65. Chips = 0.65 * 12 = 7.8. Rounding 7.8 gives 8. Corrected Count: 8.",
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
