
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, apiKey: userApiKey } = await req.json()
    if (!image) {
      throw new Error('No image provided')
    }

    // Initialize Gemini (User Key takes precedence, fallback to Server Env)
    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Please add it in Profile settings.')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Using the specific model requested by the user
    const model = genAI.getGenerativeModel({ model: 'gemini-3.0-pro-preview' })

    const prompt = `
      You are an expert Poker Chip Specialist working at a high-stakes casino.
      Your job is to ACCURATELY count the value of the poker chips in this image.

      Instructions:
      1. Identify distinct vertical stacks of chips.
      2. For each stack, identify the color (red, blue, green, white, black, etc.).
      3. Count the EXACT number of chips in each stack. Look closely at the side ridges/stripes.
      4. IGNORE any loose chips lying flat if they are not part of a stack.
      5. IGNORE reflections or background noise.
      6. Provide a bounding box [ymin, xmin, ymax, xmax] for each stack (normalized 0-1000).

      Output strictly as valid JSON in the following format:
      {
        "stacks": [
          { 
            "color": "red", 
            "count": 10, 
            "confidence": 0.95,
            "box_2d": [100, 200, 500, 300] 
          }
        ],
        "analysis_notes": "Brief comment."
      }

      Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
    `

    // Convert base64 to Part
    // Image comes in as "data:image/jpeg;base64,..." or just base64?
    // We assume the client handles the prefix removal or we strip it.
    const cleanBase64 = image.split(',').pop()

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
    const data = JSON.parse(jsonStr)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
