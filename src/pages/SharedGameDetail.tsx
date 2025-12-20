import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSharedClient } from '@/integrations/supabase/client-shared';
import { supabase } from '@/integrations/supabase/client';
import { GameDetailView } from '@/components/GameDetailView';
import { useAuth } from '@/hooks/useAuth';
import GameDashboard from '@/components/GameDashboard';
import { Game } from '@/types/poker';
import { Loader2 } from 'lucide-react';

const SharedGameDetail = () => {
  const { token: encodedToken, gameId } = useParams<{ token: string; gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);

  // Check if current user is the owner of this game and it's active
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!user || !gameId) {
        setCheckingOwner(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("games")
          .select(`
            *,
            game_players (
              *,
              player:players (*)
            )
          `)
          .eq("id", gameId)
          .eq("user_id", user.id)
          .single();

        if (!error && data && !data.is_complete) {
          setActiveGame(data as Game);
        }
      } catch (error) {
        console.error("Error checking owner status:", error);
      } finally {
        setCheckingOwner(false);
      }
    };

    checkOwnerStatus();
  }, [user, gameId]);

  if (!encodedToken || !gameId) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Invalid share link</p>
        </div>
      </div>
    );
  }

  // If user is owner and game is active, render the dashboard
  if (activeGame) {
    return <GameDashboard game={activeGame} onBackToSetup={() => navigate('/')} />;
  }

  if (checkingOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Decode the token from the URL
  const token = decodeURIComponent(encodedToken);
  const sharedClient = createSharedClient(token);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <GameDetailView
        gameId={gameId}
        client={sharedClient}
        token={token}
        showOwnerControls={false}
        onBack={() => navigate(`/shared/${encodeURIComponent(token)}`)}
        backLabel="Back to Games History"
      />
    </div>
  );
};

export default SharedGameDetail;
