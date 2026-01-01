
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
    // Using gemini-2.5-pro as explicitly requested.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const prompt = `
      Act as an Optical Metrology Expert. Perform a precise count of the poker chips in this image using the following geometric constraint:

      Constraint: The Width-to-Height ratio of a single chip is exactly 12:1.

      **CRITICAL: BOUNDARY DEFINITION**
      To measure Height (H) accurately, you must identify the exact pixels:
      - **Bottom Edge:** The line where the lowest chip touches the table surface (Ignore reflection).
      - **Top Edge:** The top line of the *side profile* of the highest chip.
      - **Perspective Warning:** Do NOT include the elliptical "top face" of the stack in your height measurement. Measure only the vertical side stack.

      **Execution Steps:**

      1. **Calibration**: Measure the pixel width of the top-most chip in the a stack. Divide this width by 12 to establish the Standard Chip Height (px).

      2. **Vertical Measurement**: Measure the distance between the Bottom Edge and Top Edge defined above.

      3. **Mathematical Calculation**: Divide the Total Stack Height by Standard Chip Height. Round to the nearest whole number to derive the count.

      4. **Visual Verification**: Cross-check the calculated number against the visible horizontal ridges (edges) on the side of the chips.

      5. **Relative Logic Check**: Ensure the counts align with visual comparisons (e.g., if Stack B is physically taller than Stack A, its count must be higher).

      **Instructions:**
      1.  Identify distinct vertical stacks.
      2.  Ignore loose chips lying flat.
      3.  Provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale).

      Output strictly as valid JSON in the following format:
      {
        "thinking_process": "Calibration: Stack 1 Width 102px -> StdHeight = 8.5px. Stack 1 Height 98px -> 98/8.5 = 11.5 -> 12 chips. Visual check confirms ridges match.",
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
