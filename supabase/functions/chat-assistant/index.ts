import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Determine which API key to use
    let apiKey: string | null = null;
    
    // For adwate@gmail.com, use the global key
    if (user.email === 'adwate@gmail.com') {
      apiKey = Deno.env.get('GEMINI_API_KEY') || null;
    } else {
      // For other users, check if they have their own key
      const { data: userKey } = await supabaseClient
        .from('user_api_keys')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();
      
      apiKey = userKey?.gemini_api_key || null;
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NO_API_KEY', message: 'Please add your Gemini API key to use the chatbot' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's data from Supabase
    const [gamesResult, playersResult, gamePlayersResult] = await Promise.all([
      supabaseClient.from('games').select('*').eq('user_id', user.id),
      supabaseClient.from('players').select('*').eq('user_id', user.id),
      supabaseClient.from('game_players').select('*, games!inner(user_id)').eq('games.user_id', user.id)
    ]);

    // Build context for AI
    const context = {
      games: gamesResult.data || [],
      players: playersResult.data || [],
      game_players: gamePlayersResult.data || []
    };

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant that answers questions about poker game data. 
              
Here is the user's data:
- Games: ${JSON.stringify(context.games, null, 2)}
- Players: ${JSON.stringify(context.players, null, 2)}
- Game Players: ${JSON.stringify(context.game_players, null, 2)}

User question: ${question}

Please provide a clear, concise answer based on the data provided. If you need to calculate statistics or analyze trends, do so. Format your response in a friendly, conversational way.`
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to get response from Gemini');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
