import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Key } from "lucide-react";

interface ApiKeySetupProps {
  onKeyAdded: () => void;
}

const ApiKeySetup = ({ onKeyAdded }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Try to insert, if exists then update
      const { error: insertError } = await supabase
        .from('user_api_keys')
        .insert({ user_id: user.id, gemini_api_key: apiKey });

      if (insertError) {
        // If insert fails due to unique constraint, try update
        const { error: updateError } = await supabase
          .from('user_api_keys')
          .update({ gemini_api_key: apiKey })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      toast.success('API key saved successfully');
      onKeyAdded();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle>Gemini API Key Required</CardTitle>
        </div>
        <CardDescription>
          To use the AI chatbot, please enter your Gemini API key. You can get one from Google AI Studio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={loading}
        />
        <Button 
          onClick={handleSaveKey} 
          disabled={loading || !apiKey.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save API Key'
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Get your free API key at:{' '}
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default ApiKeySetup;
