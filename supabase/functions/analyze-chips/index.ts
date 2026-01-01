
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

      **CRITICAL INSTRUCTION: USE "UNIT HEIGHT" CALIBRATION**
      Visual counting often fails on blurry edges or low stacks. Use the clearest stack to build a ruler.

      **Step 1: The Anchor Stack**
      - Find the stack with the **clearest, most distinct side ridges**.
      - Visually count these ridges carefully (Visual_Count).
      - Measure the stack's precise vertical height in pixels (Anchor_Height).
      - Calculate **Avg_Chip_Height = Anchor_Height / Visual_Count**.

      **Step 2: Measure All Stacks**
      - For every stack (including the anchor):
        - Measure its pixel height (Stack_Height).
        - **Calculated_Count = Stack_Height / Avg_Chip_Height**.
      
      **Step 3: Verification**
      - Round the Calculated_Count to the nearest integer.
      - If Visual Count differs from Calculated Count by more than 1, **Trust the Calculated Count** (Perspective often hides ridges, but height rarely lies).

      **Instructions:**
      1.  Identify distinct vertical stacks.
      2.  Ignore loose chips lying flat.
      3.  Ignore reflections.
      4.  Provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale).

      Output strictly as valid JSON in the following format:
      {
        "thinking_process": "Anchor: Stack 3 (Red) is clearest. Height=120px. Visual Count=12. Unit Height = 10px/chip. // Stack 1 (Blue): Height=52px. Calc = 5.2 -> 5 chips. Visual looked like 4, but height confirms 5. // Stack 2: Height=80px. Calc=8 chips.",
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
