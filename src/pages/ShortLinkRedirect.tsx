import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { buildSharedViewUrl } from '@/lib/shareUtils';

type RedirectState = 'loading' | 'error';

export default function ShortLinkRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<RedirectState>('loading');

  useEffect(() => {
    const resolveAndRedirect = async () => {
      if (!shortCode) {
        setState('error');
        return;
      }

      try {
        // Use secure RPC function to resolve short link (prevents token enumeration)
        const { data, error } = await supabase
          .rpc('resolve_short_link', { _short_code: shortCode })
          .maybeSingle();

        if (error || !data) {
          console.error('[ShortLinkRedirect] Link not found:', shortCode);
          setState('error');
          return;
        }

        // Validate resource type
        if (data.resource_type !== 'game' && data.resource_type !== 'player') {
          console.error('[ShortLinkRedirect] Invalid resource type:', data.resource_type);
          setState('error');
          return;
        }

        // Check if current user is the owner
        const { data: { session } } = await supabase.auth.getSession();
        let isOwner = false;

        if (session?.user) {
          // Check ownership based on resource type
          if (data.resource_type === 'game') {
            const { data: game } = await supabase
              .from('games')
              .select('user_id')
              .eq('id', data.resource_id)
              .single();

            if (game && game.user_id === session.user.id) {
              isOwner = true;
            }
          } else if (data.resource_type === 'player') {
            const { data: player } = await supabase
              .from('players')
              .select('user_id')
              .eq('id', data.resource_id)
              .single();

            if (player && player.user_id === session.user.id) {
              isOwner = true;
            }
          }
        }

        if (isOwner) {
          // Redirect to owner view
          if (data.resource_type === 'game') {
            navigate(`/games/${data.resource_id}`, { replace: true });
            return;
          } else if (data.resource_type === 'player') {
            navigate(`/players/${data.resource_id}`, { replace: true });
            return;
          }
        }

        // Redirect to shared view
        const targetUrl = buildSharedViewUrl(
          data.access_token,
          data.resource_type as 'game' | 'player',
          data.resource_id
        );

        navigate(targetUrl, { replace: true });
      } catch (err) {
        console.error('[ShortLinkRedirect] Error:', err);
        setState('error');
      }
    };

    resolveAndRedirect();
  }, [shortCode, navigate]);

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Link Not Found</h1>
          <p className="text-muted-foreground">
            This share link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
