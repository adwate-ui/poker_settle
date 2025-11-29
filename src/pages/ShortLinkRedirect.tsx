import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ShortLinkRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveShortCode = async () => {
      if (!shortCode) {
        setError(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shared_links')
          .select('resource_type, resource_id, user_id')
          .eq('short_code', shortCode)
          .single();

        if (error || !data) {
          setError(true);
          return;
        }

        // Get the user's share token
        const { data: tokenData, error: tokenError } = await supabase
          .from('share_tokens')
          .select('token')
          .eq('user_id', data.user_id)
          .single();

        if (tokenError || !tokenData) {
          setError(true);
          return;
        }

        // Redirect to the appropriate shared view
        if (data.resource_type === 'game') {
          navigate(`/shared/${tokenData.token}/game/${data.resource_id}`, { replace: true });
        } else if (data.resource_type === 'player') {
          navigate(`/shared/${tokenData.token}/player/${data.resource_id}`, { replace: true });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error resolving short code:', err);
        setError(true);
      }
    };

    resolveShortCode();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Link Not Found</h1>
          <p className="text-muted-foreground">This share link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
